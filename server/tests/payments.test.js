import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, stripeEvent } from './helpers.js';

let ctx;
before(async () => { ctx = await setupTestApp(); });
after(async () => { await ctx.cleanup(); });

const customer = { name: 'Grace Example', email: 'grace@example.org' };
const address = { line1: '1 Placeholder Way', city: 'Springfield', state: 'IL', postalCode: '62701', country: 'US' };

const sendWebhook = (event) => {
  const { payload, header } = ctx.signEvent(event);
  return request(ctx.app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').set('Stripe-Signature', header).send(payload);
};

async function startCheckout(items, shippingOption = 'standard') {
  const res = await request(ctx.app).post('/api/checkout/session')
    .send({ items, shippingOption, customer, shippingAddress: address }).expect(201);
  const created = ctx.fakeStripe.created.at(-1);
  const [order] = await ctx.db().findBy('orders', 'stripeSessionId', created.id);
  return { res, created, order };
}

describe('merchandise checkout', () => {
  it('validates customer details and shipping address', async () => {
    const res = await request(ctx.app).post('/api/checkout/session').send({
      items: [{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }],
      shippingOption: 'standard',
      customer: { name: '', email: 'not-an-email' },
    }).expect(400);
    assert.ok(res.body.details.some((d) => d.field === 'customer.email'));

    const noAddress = await request(ctx.app).post('/api/checkout/session').send({
      items: [{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }],
      shippingOption: 'standard',
      customer,
    }).expect(400);
    assert.ok(noAddress.body.details.some((d) => d.field === 'shippingAddress'));
  });

  it('creates a pending order and a Stripe Checkout Session with server prices', async () => {
    const { res, created, order } = await startCheckout([
      { productId: 'love-never-fails-tee', quantity: 2, size: 'L', color: 'Ivory', price: 1, unitPrice: 1 },
    ]);
    assert.match(res.body.url, /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(created.params.mode, 'payment');
    assert.equal(created.params.line_items[0].price_data.unit_amount, 2500);
    assert.equal(created.params.line_items[0].quantity, 2);
    assert.equal(created.params.shipping_options[0].shipping_rate_data.fixed_amount.amount, 695);
    assert.equal(created.params.metadata.type, 'merchandise');
    assert.match(created.params.success_url, /\{CHECKOUT_SESSION_ID\}/);
    assert.ok(created.opts.idempotencyKey);
    assert.equal(order.paymentStatus, 'pending');
    assert.equal(order.total, 5695);
  });

  it('does not create an order when Stripe is unreachable', async () => {
    const before = (await ctx.db().list('orders')).length;
    ctx.fakeStripe.failNextCreate = true;
    const res = await request(ctx.app).post('/api/checkout/session').send({
      items: [{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }], shippingOption: 'pickup', customer,
    });
    assert.equal(res.status, 503);
    assert.equal((await ctx.db().list('orders')).length, before);
  });

  it('confirmation lookup reports pending until the webhook verifies payment', async () => {
    const { created } = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }], 'pickup');
    ctx.fakeStripe.retrieveStatus = 'paid';
    const res = await request(ctx.app).get(`/api/checkout/session/${created.id}`).expect(200);
    assert.equal(res.body.paymentStatus, 'pending');
    assert.equal(res.body.stripePaymentStatus, 'paid');
    await request(ctx.app).get('/api/checkout/session/not-a-session').expect(400);
  });
});

describe('stripe webhook', () => {
  it('rejects requests with an invalid signature', async () => {
    await request(ctx.app).post('/api/webhooks/stripe').set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=1,v1=deadbeef').send('{"id":"evt_x"}').expect(400);
    await request(ctx.app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').send('{}').expect(400);
  });

  it('marks the order paid, decrements inventory and emails once – even for duplicate events', async () => {
    const { created, order } = await startCheckout([{ productId: 'heart-cross-key-holder', quantity: 3, color: 'Gold' }]);
    const stockBefore = (await ctx.db().get('products', 'heart-cross-key-holder')).inventory;
    const emailsBefore = ctx.sentEmails.length;

    const event = stripeEvent('checkout.session.completed', {
      id: created.id, object: 'checkout.session', mode: 'payment', payment_status: 'paid',
      amount_total: order.total, currency: 'usd', payment_intent: 'pi_test_123',
      client_reference_id: order.id, metadata: created.params.metadata,
    });
    const first = await sendWebhook(event).expect(200);
    assert.equal(first.body.duplicate, false);
    const dup = await sendWebhook(event).expect(200);
    assert.equal(dup.body.duplicate, true);

    // A different event for the same session must not double-process either.
    await sendWebhook({ ...event, id: 'evt_another_delivery' }).expect(200);

    const paid = await ctx.db().get('orders', order.id);
    assert.equal(paid.paymentStatus, 'paid');
    assert.equal(paid.stripePaymentIntentId, 'pi_test_123');
    assert.equal((await ctx.db().get('products', 'heart-cross-key-holder')).inventory, stockBefore - 3);
    assert.equal(ctx.sentEmails.length - emailsBefore, 1);
    assert.match(ctx.sentEmails.at(-1).subject, /Order confirmed/);

    const lookup = await request(ctx.app).get(`/api/checkout/session/${created.id}`).expect(200);
    assert.equal(lookup.body.paymentStatus, 'paid');
  });

  it('sends the confirmation to the customer and a separate alert to the church office', async () => {
    const { env } = await import('../src/config/env.js');
    const previous = env.notifyEmail;
    env.notifyEmail = 'office@church.example';
    try {
      const { created, order } = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }], 'pickup');
      const before = ctx.sentEmails.length;
      await sendWebhook(stripeEvent('checkout.session.completed', {
        id: created.id, object: 'checkout.session', mode: 'payment', payment_status: 'paid',
        amount_total: order.total, currency: 'usd', payment_intent: 'pi_test_alert',
        client_reference_id: order.id, metadata: created.params.metadata,
      })).expect(200);
      const sent = ctx.sentEmails.slice(before);
      assert.equal(sent.length, 2);
      const [toCustomer, toOffice] = sent;
      assert.equal(toCustomer.to, customer.email);
      assert.match(toCustomer.subject, /^Order confirmed/);
      assert.equal(toCustomer.replyTo, 'office@church.example');
      assert.match(toCustomer.text, /Pocket Edition/);
      assert.equal(toOffice.to, 'office@church.example');
      assert.match(toOffice.subject, /^New order .* from Grace Example/);
      assert.match(toOffice.html, /Staff notification/);
      assert.equal(toOffice.replyTo, customer.email);
      const saved = await ctx.db().get('orders', order.id);
      assert.equal(saved.emailSent, true);
      assert.equal(saved.staffNotified, true);
    } finally {
      env.notifyEmail = previous;
    }
  });

  it('flags orders for review when the paid amount does not match', async () => {
    const { created, order } = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }]);
    await sendWebhook(stripeEvent('checkout.session.completed', {
      id: created.id, payment_status: 'paid', amount_total: 1, currency: 'usd', metadata: created.params.metadata,
    })).expect(200);
    assert.equal((await ctx.db().get('orders', order.id)).paymentStatus, 'review_required');
  });

  it('does not mark unpaid (delayed) sessions as paid; handles async failure and expiry', async () => {
    const a = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }]);
    await sendWebhook(stripeEvent('checkout.session.completed', {
      id: a.created.id, payment_status: 'unpaid', amount_total: a.order.total, currency: 'usd', metadata: a.created.params.metadata,
    })).expect(200);
    assert.equal((await ctx.db().get('orders', a.order.id)).paymentStatus, 'pending');

    await sendWebhook(stripeEvent('checkout.session.async_payment_failed', {
      id: a.created.id, payment_status: 'unpaid', metadata: a.created.params.metadata,
    })).expect(200);
    assert.equal((await ctx.db().get('orders', a.order.id)).paymentStatus, 'failed');

    const b = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }]);
    await sendWebhook(stripeEvent('checkout.session.expired', { id: b.created.id, metadata: b.created.params.metadata })).expect(200);
    assert.equal((await ctx.db().get('orders', b.order.id)).paymentStatus, 'expired');
  });

  it('records card decline reasons without completing the order', async () => {
    const { order, created } = await startCheckout([{ productId: 'pocket-bible', quantity: 1, color: 'Tan' }]);
    await sendWebhook(stripeEvent('payment_intent.payment_failed', {
      id: 'pi_failed', object: 'payment_intent', metadata: created.params.metadata,
      last_payment_error: { message: 'Your card was declined.' },
    })).expect(200);
    const after = await ctx.db().get('orders', order.id);
    assert.equal(after.paymentStatus, 'pending');
    assert.equal(after.lastPaymentError, 'Your card was declined.');
  });
});

describe('donations', () => {
  it('validates donation input', async () => {
    await request(ctx.app).post('/api/donations/session').send({ amount: 0.5, frequency: 'one-time', name: 'A Donor', email: 'a@example.org' }).expect(400);
    await request(ctx.app).post('/api/donations/session').send({ amount: 25, frequency: 'weekly', name: 'A Donor', email: 'a@example.org' }).expect(400);
    const noName = await request(ctx.app).post('/api/donations/session').send({ amount: 25, frequency: 'one-time', email: 'a@example.org' }).expect(400);
    assert.ok(noName.body.details.some((d) => d.field === 'name'));
  });

  it('creates a one-time donation checkout separate from store orders', async () => {
    const ordersBefore = (await ctx.db().list('orders')).length;
    await request(ctx.app).post('/api/donations/session')
      .send({ amount: 50, frequency: 'one-time', name: 'Faith Giver', email: 'faith@example.org', fund: 'outreach', message: 'Blessings' })
      .expect(201);
    const created = ctx.fakeStripe.created.at(-1);
    assert.equal(created.params.mode, 'payment');
    assert.equal(created.params.submit_type, 'donate');
    assert.equal(created.params.line_items[0].price_data.unit_amount, 5000);
    assert.equal(created.params.metadata.type, 'donation');
    assert.equal((await ctx.db().list('orders')).length, ordersBefore);

    const [donation] = await ctx.db().findBy('donations', 'stripeSessionId', created.id);
    assert.equal(donation.paymentStatus, 'pending');

    const emailsBefore = ctx.sentEmails.length;
    await sendWebhook(stripeEvent('checkout.session.completed', {
      id: created.id, mode: 'payment', payment_status: 'paid', amount_total: 5000, currency: 'usd',
      payment_intent: 'pi_donation_1', metadata: created.params.metadata,
    })).expect(200);
    const done = await ctx.db().get('donations', donation.id);
    assert.equal(done.paymentStatus, 'completed');
    assert.equal(done.stripePaymentIntentId, 'pi_donation_1');
    assert.equal(ctx.sentEmails.length - emailsBefore, 1);
    assert.match(ctx.sentEmails.at(-1).subject, /Donation receipt/);

    const lookup = await request(ctx.app).get(`/api/donations/session/${created.id}`).expect(200);
    assert.equal(lookup.body.amount, 5000);
    assert.equal(lookup.body.paymentStatus, 'completed');
    assert.equal(lookup.body.transactionId, 'pi_donation_1');
    assert.ok(lookup.body.reference.startsWith('GIFT-'));
  });

  it('emails the donor a receipt and the church office a separate alert (hiding anonymous donors)', async () => {
    const { env } = await import('../src/config/env.js');
    const previous = env.notifyEmail;
    env.notifyEmail = 'office@church.example';
    const give = async (body) => {
      await request(ctx.app).post('/api/donations/session').send(body).expect(201);
      const created = ctx.fakeStripe.created.at(-1);
      const before = ctx.sentEmails.length;
      const event = stripeEvent('checkout.session.completed', {
        id: created.id, mode: 'payment', payment_status: 'paid', amount_total: body.amount * 100, currency: 'usd',
        payment_intent: `pi_${created.id}`, metadata: created.params.metadata,
      });
      await sendWebhook(event).expect(200);
      await sendWebhook({ ...event, id: `${event.id}_again` }).expect(200); // repeated delivery sends nothing new
      return ctx.sentEmails.slice(before);
    };
    try {
      const named = await give({ amount: 40, frequency: 'one-time', name: 'Hope Giver', email: 'hope@example.org', fund: 'general', message: 'For the youth trip' });
      assert.equal(named.length, 2);
      const [receipt, alert] = named;
      assert.equal(receipt.to, 'hope@example.org');
      assert.match(receipt.subject, /^Donation receipt/);
      assert.equal(alert.to, 'office@church.example');
      assert.match(alert.subject, /^One-time gift: \$40\.00 – GIFT-.* from Hope Giver$/);
      assert.match(alert.text, /For the youth trip/);
      assert.equal(alert.replyTo, 'hope@example.org');

      const anon = await give({ amount: 15, frequency: 'one-time', anonymous: true, email: 'quiet@example.org', fund: 'general' });
      const anonAlert = anon.find((m) => m.to === 'office@church.example');
      assert.ok(anon.some((m) => m.to === 'quiet@example.org'), 'anonymous donors still get their receipt');
      assert.doesNotMatch(anonAlert.subject + anonAlert.html + anonAlert.text, /quiet@example\.org/);
      assert.match(anonAlert.text, /Anonymous/);
      assert.equal(anonAlert.replyTo, undefined);
    } finally {
      env.notifyEmail = previous;
    }
  });

  it('supports anonymous gifts', async () => {
    await request(ctx.app).post('/api/donations/session')
      .send({ amount: 10, frequency: 'one-time', anonymous: true, email: 'anon@example.org' }).expect(201);
    const [donation] = await ctx.db().findBy('donations', 'stripeSessionId', ctx.fakeStripe.created.at(-1).id);
    assert.equal(donation.anonymous, true);
    assert.equal(donation.donorName, 'Anonymous');
  });

  it('creates monthly subscriptions and records renewals once', async () => {
    await request(ctx.app).post('/api/donations/session')
      .send({ amount: 25, frequency: 'monthly', name: 'Hope Monthly', email: 'hope@example.org' }).expect(201);
    const created = ctx.fakeStripe.created.at(-1);
    assert.equal(created.params.mode, 'subscription');
    assert.deepEqual(created.params.line_items[0].price_data.recurring, { interval: 'month' });
    assert.equal(created.params.subscription_data.metadata.type, 'donation');

    await sendWebhook(stripeEvent('checkout.session.completed', {
      id: created.id, mode: 'subscription', payment_status: 'paid', amount_total: 2500, currency: 'usd',
      subscription: 'sub_test_1', invoice: 'in_first', customer: 'cus_1', metadata: created.params.metadata,
    })).expect(200);
    const [root] = await ctx.db().findBy('donations', 'stripeSessionId', created.id);
    assert.equal(root.paymentStatus, 'completed');
    assert.equal(root.subscriptionStatus, 'active');
    assert.equal(root.stripeSubscriptionId, 'sub_test_1');

    // First invoice is already covered by the session – must not create a duplicate.
    await sendWebhook(stripeEvent('invoice.paid', {
      id: 'in_first', billing_reason: 'subscription_create', amount_paid: 2500, currency: 'usd',
      parent: { subscription_details: { subscription: 'sub_test_1' } },
    })).expect(200);
    const renewal = stripeEvent('invoice.paid', {
      id: 'in_second', billing_reason: 'subscription_cycle', amount_paid: 2500, currency: 'usd',
      parent: { subscription_details: { subscription: 'sub_test_1' } },
    });
    await sendWebhook(renewal).expect(200);
    await sendWebhook({ ...renewal, id: 'evt_renewal_redelivered' }).expect(200);

    const all = await ctx.db().findBy('donations', 'stripeSubscriptionId', 'sub_test_1');
    assert.equal(all.length, 2);
    assert.equal(all.filter((d) => d.isRenewal).length, 1);

    await sendWebhook(stripeEvent('customer.subscription.deleted', { id: 'sub_test_1', status: 'canceled' })).expect(200);
    assert.equal((await ctx.db().get('donations', root.id)).subscriptionStatus, 'canceled');
  });
});
