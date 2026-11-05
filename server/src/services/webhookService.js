import { db } from '../db/index.js';
import { markOrderPaid, setOrderPaymentStatus } from './orderService.js';
import {
  markDonationCompleted,
  markRecurringPaymentFailed,
  recordRecurringPayment,
  setDonationStatus,
  updateSubscriptionStatus,
} from './donationService.js';

const isDonation = (obj) => obj.metadata?.type === 'donation';
const isOrder = (obj) => obj.metadata?.type === 'merchandise';

async function handleSessionOutcome(session, outcome) {
  if (outcome === 'paid') {
    if (isDonation(session)) return markDonationCompleted(session);
    if (isOrder(session)) return markOrderPaid(session);
  } else {
    if (isDonation(session)) return setDonationStatus(session.metadata.donationId, outcome);
    if (isOrder(session)) return setOrderPaymentStatus(session.metadata.orderId, outcome);
  }
  return null;
}

export async function processStripeEvent(event) {
  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      // A delayed payment method (e.g. bank debit) completes the session before money arrives.
      if (obj.payment_status === 'paid' || obj.payment_status === 'no_payment_required') {
        return handleSessionOutcome(obj, 'paid');
      }
      return null;

    case 'checkout.session.async_payment_failed':
      return handleSessionOutcome(obj, 'failed');

    case 'checkout.session.expired':
      return handleSessionOutcome(obj, 'expired');

    case 'payment_intent.payment_failed': {
      // The customer can retry inside Stripe Checkout, so the record stays pending; we log the reason.
      const lastPaymentError = obj.last_payment_error?.message || 'Payment failed';
      if (isOrder(obj) && obj.metadata.orderId) {
        const order = await db().get('orders', obj.metadata.orderId);
        if (order?.paymentStatus === 'pending') await db().update('orders', order.id, { lastPaymentError });
      }
      if (isDonation(obj) && obj.metadata.donationId) {
        const donation = await db().get('donations', obj.metadata.donationId);
        if (donation?.paymentStatus === 'pending') await db().update('donations', donation.id, { lastPaymentError });
      }
      return null;
    }

    case 'invoice.paid':
      return recordRecurringPayment(obj);

    case 'invoice.payment_failed':
      return markRecurringPaymentFailed(obj);

    case 'customer.subscription.updated':
      return updateSubscriptionStatus(obj.id, obj.status);

    case 'customer.subscription.deleted':
      return updateSubscriptionStatus(obj.id, 'canceled');

    default:
      return null; // unhandled event types are acknowledged and ignored
  }
}

/**
 * Processes an already signature-verified event exactly once.
 * Returns { duplicate: true } when the event was handled before.
 */
export async function handleVerifiedEvent(event) {
  const store = db();
  const fresh = await store.createIfAbsent('webhookEvents', event.id, {
    type: event.type,
    status: 'processing',
    livemode: Boolean(event.livemode),
  });
  if (!fresh) {
    const existing = await store.get('webhookEvents', event.id);
    const stale = existing?.status === 'processing' && Date.now() - Date.parse(existing.updatedAt) > 2 * 60 * 1000;
    if (existing?.status === 'processed' || (existing?.status === 'processing' && !stale)) return { duplicate: true };
    // A previous attempt failed (or crashed) – allow Stripe's retry to process it again.
    // All handlers are idempotent, so re-running them cannot double-count anything.
    await store.update('webhookEvents', event.id, { status: 'processing', attempts: (existing?.attempts || 1) + 1 });
  }
  try {
    await processStripeEvent(event);
    await store.update('webhookEvents', event.id, { status: 'processed', processedAt: new Date().toISOString(), error: null });
    return { duplicate: false };
  } catch (err) {
    await store.update('webhookEvents', event.id, { status: 'failed', error: String(err.message).slice(0, 500) });
    throw err;
  }
}
