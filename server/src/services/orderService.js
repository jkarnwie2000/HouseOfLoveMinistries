import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { getShippingOption } from '../config/store.js';
import { getStripe } from './stripe.js';
import { priceCart } from './pricing.js';
import { newOrderAlertEmail, orderConfirmationEmail, sendEmail } from './email.js';
import { notFound } from '../utils/errors.js';
import { reference } from '../utils/sanitize.js';

const absoluteImage = (src) => {
  if (!src) return undefined;
  if (/^https:\/\//.test(src)) return [src];
  if (src.startsWith('/') && env.clientUrl.startsWith('https://')) return [`${env.clientUrl}${src}`];
  return undefined; // Stripe only accepts publicly reachable https images
};

/** Creates a pending order from server-priced cart data and a Stripe Checkout Session for it. */
export async function createMerchandiseCheckout({ items, shippingOption, customer, shippingAddress }) {
  const quote = await priceCart(items, shippingOption);
  const option = getShippingOption(shippingOption);
  const stripe = getStripe();

  const order = await db().create('orders', {
    orderNumber: reference('HOL'),
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone || '',
    shippingAddress: option.requiresAddress ? shippingAddress : null,
    items: quote.lines,
    subtotal: quote.subtotal,
    shippingCost: quote.shipping,
    shippingOptionId: option.id,
    shippingLabel: option.label,
    total: quote.total,
    currency: quote.currency,
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    stripeSessionId: null,
    stripePaymentIntentId: null,
    inventoryAdjusted: false,
    emailSent: false,
    staffNotified: false,
  });

  const metadata = { type: 'merchandise', orderId: order.id, orderNumber: order.orderNumber };
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: customer.email,
        client_reference_id: order.id,
        line_items: quote.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: quote.currency,
            unit_amount: l.unitPrice,
            product_data: {
              name: l.name,
              description: [l.size && `Size: ${l.size}`, l.color && `Color: ${l.color}`].filter(Boolean).join(' · ') || undefined,
              images: absoluteImage(l.image),
              metadata: { productId: l.productId },
            },
          },
        })),
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: option.label,
              fixed_amount: { amount: quote.shipping, currency: quote.currency },
              ...(option.minDays
                ? {
                    delivery_estimate: {
                      minimum: { unit: 'business_day', value: option.minDays },
                      maximum: { unit: 'business_day', value: option.maxDays },
                    },
                  }
                : {}),
            },
          },
        ],
        metadata,
        payment_intent_data: {
          metadata,
          description: `House of Love Store order ${order.orderNumber}`,
          receipt_email: customer.email,
          ...(order.shippingAddress
            ? {
                shipping: {
                  name: customer.name,
                  address: {
                    line1: shippingAddress.line1,
                    line2: shippingAddress.line2 || undefined,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.postalCode,
                    country: shippingAddress.country,
                  },
                },
              }
            : {}),
        },
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        success_url: `${env.clientUrl}/store/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.clientUrl}/cart?checkout=canceled`,
      },
      { idempotencyKey: `order-${order.id}` },
    );
  } catch (err) {
    await db().remove('orders', order.id);
    throw err;
  }

  await db().update('orders', order.id, { stripeSessionId: session.id });
  return { url: session.url, sessionId: session.id, orderNumber: order.orderNumber };
}

export function publicOrder(order, stripePaymentStatus = null) {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    shippingLabel: order.shippingLabel,
    total: order.total,
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    stripePaymentStatus,
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
  };
}

/** Order lookup for the confirmation page. The DB status is only changed by verified webhooks. */
export async function getOrderForSession(sessionId) {
  const [order] = await db().findBy('orders', 'stripeSessionId', sessionId);
  if (!order) throw notFound('We could not find that order.');
  let stripePaymentStatus = null;
  if (order.paymentStatus === 'pending') {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      stripePaymentStatus = session.payment_status;
    } catch {
      /* status will be confirmed by the webhook */
    }
  }
  return publicOrder(order, stripePaymentStatus);
}

/** Called from a verified webhook. Idempotent – safe to run more than once. */
export async function markOrderPaid(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  const order = orderId && (await db().get('orders', orderId));
  if (!order) {
    console.warn(`[orders] webhook for unknown order ${orderId} (session ${session.id})`);
    return null;
  }
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'review_required') return order;

  const amountMatches = session.amount_total === order.total && session.currency === order.currency;
  if (!amountMatches) {
    console.error(`[orders] amount mismatch on ${order.orderNumber}: expected ${order.total}, Stripe reported ${session.amount_total}`);
  }

  let updated = await db().update('orders', order.id, {
    paymentStatus: amountMatches ? 'paid' : 'review_required',
    paidAt: new Date().toISOString(),
    amountReceived: session.amount_total,
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    lastPaymentError: null,
  });

  if (!updated.inventoryAdjusted) {
    for (const item of updated.items) {
      await db().increment('products', item.productId, 'inventory', -item.quantity);
    }
    updated = await db().update('orders', order.id, { inventoryAdjusted: true });
  }

  // Customer confirmation → the email address entered at checkout.
  if (!updated.emailSent) {
    const sent = await sendEmail({
      to: updated.customerEmail,
      replyTo: env.notifyEmail || undefined, // customer replies reach the church office
      ...orderConfirmationEmail(updated),
    });
    if (sent) updated = await db().update('orders', order.id, { emailSent: true });
  }
  // Separate staff alert → the church office address (tracked independently).
  if (env.notifyEmail && !updated.staffNotified) {
    const sent = await sendEmail({ to: env.notifyEmail, ...newOrderAlertEmail(updated) });
    if (sent) updated = await db().update('orders', order.id, { staffNotified: true });
  }
  return updated;
}

export async function setOrderPaymentStatus(orderId, status, extra = {}) {
  const order = orderId && (await db().get('orders', orderId));
  if (!order || order.paymentStatus !== 'pending') return null;
  return db().update('orders', order.id, { paymentStatus: status, ...extra });
}
