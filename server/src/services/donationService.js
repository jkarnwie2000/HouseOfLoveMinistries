import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { DONATION } from '../config/store.js';
import { getStripe } from './stripe.js';
import { donationReceiptEmail, sendEmail } from './email.js';
import { notFound } from '../utils/errors.js';
import { reference } from '../utils/sanitize.js';

/**
 * Donations are kept completely separate from merchandise orders:
 * their own collection, Checkout Sessions, metadata type and webhook handling.
 */
export async function createDonationCheckout(input) {
  const stripe = getStripe();
  const amount = Math.round(input.amount * 100);
  const fund = DONATION.funds.find((f) => f.id === input.fund) || DONATION.funds[0];
  const monthly = input.frequency === 'monthly';

  const donation = await db().create('donations', {
    reference: reference('GIFT'),
    donorName: input.anonymous ? 'Anonymous' : input.name,
    donorEmail: input.email,
    anonymous: input.anonymous,
    message: input.message || '',
    amount,
    currency: env.currency,
    frequency: input.frequency,
    fund: fund.id,
    fundLabel: fund.label,
    paymentStatus: 'pending',
    stripeSessionId: null,
    stripePaymentIntentId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    parentDonationId: null,
    receiptSent: false,
  });

  const metadata = { type: 'donation', donationId: donation.id, reference: donation.reference, fund: fund.id };
  const productName = `${monthly ? 'Monthly donation' : 'Donation'} – ${fund.label}`;
  const params = {
    customer_email: input.email,
    client_reference_id: donation.id,
    metadata,
    success_url: `${env.clientUrl}/give/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/give?donation=canceled`,
  };

  if (monthly) {
    Object.assign(params, {
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: env.currency,
          unit_amount: amount,
          recurring: { interval: 'month' },
          product_data: { name: productName },
        },
      }],
      subscription_data: { metadata, description: 'Monthly gift to House of Love International Ministries' },
    });
  } else {
    Object.assign(params, {
      mode: 'payment',
      submit_type: 'donate',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: env.currency,
          unit_amount: amount,
          product_data: { name: productName, description: 'House of Love International Ministries' },
        },
      }],
      payment_intent_data: { metadata, description: `Donation ${donation.reference}`, receipt_email: input.email },
    });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(params, { idempotencyKey: `donation-${donation.id}` });
  } catch (err) {
    await db().remove('donations', donation.id);
    throw err;
  }
  await db().update('donations', donation.id, { stripeSessionId: session.id });
  return { url: session.url, sessionId: session.id, reference: donation.reference };
}

export async function getDonationForSession(sessionId) {
  const [donation] = await db().findBy('donations', 'stripeSessionId', sessionId);
  if (!donation) throw notFound('We could not find that donation.');
  let stripePaymentStatus = null;
  if (donation.paymentStatus === 'pending') {
    try {
      stripePaymentStatus = (await getStripe().checkout.sessions.retrieve(sessionId)).payment_status;
    } catch {
      /* confirmed by webhook */
    }
  }
  return {
    reference: donation.reference,
    amount: donation.amount,
    currency: donation.currency,
    frequency: donation.frequency,
    fundLabel: donation.fundLabel,
    anonymous: donation.anonymous,
    donorName: donation.anonymous ? null : donation.donorName,
    paymentStatus: donation.paymentStatus,
    stripePaymentStatus,
    transactionId: donation.stripePaymentIntentId || donation.stripeSubscriptionId || null,
    createdAt: donation.createdAt,
    completedAt: donation.completedAt || null,
  };
}

const idOf = (v) => (typeof v === 'string' ? v : v?.id || null);

/** Called from a verified webhook. Idempotent. */
export async function markDonationCompleted(session) {
  const donationId = session.metadata?.donationId || session.client_reference_id;
  const donation = donationId && (await db().get('donations', donationId));
  if (!donation) {
    console.warn(`[donations] webhook for unknown donation ${donationId}`);
    return null;
  }
  if (donation.paymentStatus === 'completed' || donation.paymentStatus === 'review_required') return donation;

  const amountMatches = session.amount_total === donation.amount && session.currency === donation.currency;
  let updated = await db().update('donations', donation.id, {
    paymentStatus: amountMatches ? 'completed' : 'review_required',
    completedAt: new Date().toISOString(),
    amountReceived: session.amount_total,
    stripePaymentIntentId: idOf(session.payment_intent),
    stripeSubscriptionId: idOf(session.subscription),
    stripeInvoiceId: idOf(session.invoice),
    stripeCustomerId: idOf(session.customer),
    subscriptionStatus: donation.frequency === 'monthly' ? 'active' : null,
  });

  if (!updated.receiptSent) {
    await sendEmail({ to: updated.donorEmail, ...donationReceiptEmail(updated) });
    updated = await db().update('donations', donation.id, { receiptSent: true });
  }
  return updated;
}

export async function setDonationStatus(donationId, status, extra = {}) {
  const donation = donationId && (await db().get('donations', donationId));
  if (!donation || donation.paymentStatus !== 'pending') return null;
  return db().update('donations', donation.id, { paymentStatus: status, ...extra });
}

const subscriptionIdFromInvoice = (invoice) =>
  idOf(invoice.subscription) || idOf(invoice.parent?.subscription_details?.subscription) || null;

async function findRootDonationBySubscription(subscriptionId) {
  const matches = await db().findBy('donations', 'stripeSubscriptionId', subscriptionId);
  return matches.find((d) => !d.parentDonationId) || null;
}

/** Records each monthly renewal payment as its own donation record. */
export async function recordRecurringPayment(invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return null; // first payment is recorded via checkout.session.completed
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  const root = subscriptionId && (await findRootDonationBySubscription(subscriptionId));
  if (!root) {
    console.warn(`[donations] renewal for unknown subscription ${subscriptionId}`);
    return null;
  }
  const id = `renewal_${invoice.id}`;
  const record = {
    reference: reference('GIFT'),
    donorName: root.donorName,
    donorEmail: root.donorEmail,
    anonymous: root.anonymous,
    message: '',
    amount: invoice.amount_paid,
    currency: invoice.currency,
    frequency: 'monthly',
    fund: root.fund,
    fundLabel: root.fundLabel,
    paymentStatus: 'completed',
    completedAt: new Date().toISOString(),
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    stripePaymentIntentId: null,
    parentDonationId: root.id,
    isRenewal: true,
    receiptSent: false,
  };
  const created = await db().createIfAbsent('donations', id, record);
  if (!created) return db().get('donations', id);
  await db().update('donations', root.id, { subscriptionStatus: 'active' });
  await sendEmail({ to: record.donorEmail, ...donationReceiptEmail(record, { renewal: true }) });
  return db().update('donations', id, { receiptSent: true });
}

export async function updateSubscriptionStatus(subscriptionId, status) {
  const root = await findRootDonationBySubscription(subscriptionId);
  if (!root) return null;
  return db().update('donations', root.id, { subscriptionStatus: status });
}

export async function markRecurringPaymentFailed(invoice) {
  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return null;
  return updateSubscriptionStatus(subscriptionId, 'past_due');
}

export async function cancelRecurringDonation(donationId) {
  const donation = await db().get('donations', donationId);
  if (!donation || !donation.stripeSubscriptionId) throw notFound('No active monthly gift was found for this record.');
  await getStripe().subscriptions.cancel(donation.stripeSubscriptionId);
  return db().update('donations', donation.id, { subscriptionStatus: 'canceled' });
}
