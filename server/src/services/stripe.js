import Stripe from 'stripe';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

let client = null;
// Used only to verify webhook signatures – verification is local and needs no API call.
const signatureVerifier = new Stripe(env.stripeSecretKey || 'sk_test_signature_verification_only');

export function getStripe() {
  if (client) return client;
  if (!env.stripeSecretKey) {
    throw new AppError(503, 'Online payments are not configured yet. Please contact the church office.');
  }
  if (env.isProd && env.stripeSecretKey.startsWith('sk_test_')) {
    console.warn('[stripe] Running in production with a TEST secret key – no real money will be collected.');
  }
  client = new Stripe(env.stripeSecretKey, {
    maxNetworkRetries: 2,
    appInfo: { name: 'House of Love International Ministries Website' },
  });
  return client;
}

/** Test hook: lets the automated test-suite inject a stand-in Stripe client. */
export function setStripeClient(fake) {
  client = fake;
}

export function stripeConfigured() {
  return Boolean(env.stripeSecretKey);
}

/** Verifies the Stripe-Signature header against the raw request body. Throws on failure. */
export function constructWebhookEvent(rawBody, signature) {
  if (!env.stripeWebhookSecret) {
    throw new AppError(503, 'Webhook secret is not configured.');
  }
  return signatureVerifier.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

export { signatureVerifier };
