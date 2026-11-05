import { priceCart } from '../services/pricing.js';
import { createMerchandiseCheckout, getOrderForSession } from '../services/orderService.js';
import { createDonationCheckout, getDonationForSession } from '../services/donationService.js';
import { constructWebhookEvent } from '../services/stripe.js';
import { handleVerifiedEvent } from '../services/webhookService.js';
import { badRequest } from '../utils/errors.js';

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,255}$/;
const assertSessionId = (id) => {
  if (!SESSION_ID.test(id || '')) throw badRequest('Invalid checkout reference.');
  return id;
};

// ---- Merchandise -----------------------------------------------------------
export async function quoteCart(req, res) {
  const { items, shippingOption } = req.validated;
  res.json(await priceCart(items, shippingOption));
}

export async function createCheckoutSession(req, res) {
  res.status(201).json(await createMerchandiseCheckout(req.validated));
}

export async function getCheckoutSession(req, res) {
  res.json(await getOrderForSession(assertSessionId(req.params.sessionId)));
}

// ---- Donations -------------------------------------------------------------
export async function createDonationSession(req, res) {
  res.status(201).json(await createDonationCheckout(req.validated));
}

export async function getDonationSession(req, res) {
  res.json(await getDonationForSession(assertSessionId(req.params.sessionId)));
}

// ---- Stripe webhook (raw body) --------------------------------------------
export async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  if (!signature || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Missing Stripe signature.' });
  }
  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    if (err.status === 503) throw err;
    console.warn('[webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature.' });
  }
  const result = await handleVerifiedEvent(event);
  res.json({ received: true, duplicate: result.duplicate });
}
