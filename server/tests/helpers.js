import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export const ADMIN = { email: 'admin@example.org', password: 'CorrectHorse123!' };
export const WEBHOOK_SECRET = 'whsec_test_secret_for_automated_tests';

/**
 * Stand-in for the Stripe API client, used ONLY by the automated tests so they can
 * run offline. It records the parameters our code sends to Stripe. Webhook signature
 * verification still uses the real Stripe library.
 */
export function createFakeStripe() {
  const fake = {
    created: [],
    retrieveStatus: 'unpaid',
    canceled: [],
    failNextCreate: false,
    checkout: {
      sessions: {
        create: async (params, opts) => {
          if (fake.failNextCreate) {
            fake.failNextCreate = false;
            const err = new Error('Stripe is unavailable');
            err.type = 'StripeConnectionError';
            throw err;
          }
          const id = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
          fake.created.push({ id, params, opts });
          return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
        },
        retrieve: async (id) => ({ id, payment_status: fake.retrieveStatus }),
      },
    },
    subscriptions: {
      cancel: async (id) => {
        fake.canceled.push(id);
        return { id, status: 'canceled' };
      },
    },
  };
  return fake;
}

export async function setupTestApp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holim-test-'));
  Object.assign(process.env, {
    NODE_ENV: 'test',
    JSON_DB_PATH: path.join(dir, 'db.json'),
    UPLOAD_DIR: path.join(dir, 'uploads'),
    STRIPE_SECRET_KEY: 'sk_test_automated_tests',
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    JWT_SECRET: 'automated-test-jwt-secret',
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD: ADMIN.password,
    CLIENT_URL: 'http://localhost:5173',
    DB_DRIVER: 'json',
  });

  const dbModule = await import('../src/db/index.js');
  const { createApp } = await import('../src/app.js');
  const stripeModule = await import('../src/services/stripe.js');
  const emailModule = await import('../src/services/email.js');

  await dbModule.initDb();
  const fakeStripe = createFakeStripe();
  stripeModule.setStripeClient(fakeStripe);

  const signEvent = (event) => {
    const payload = JSON.stringify(event);
    const header = stripeModule.signatureVerifier.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
    return { payload, header };
  };

  return {
    app: createApp(),
    db: dbModule.db,
    fakeStripe,
    sentEmails: emailModule.sentEmails,
    signEvent,
    async cleanup() {
      await dbModule.closeDb();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function stripeEvent(type, object, id = `evt_${crypto.randomBytes(8).toString('hex')}`) {
  return { id, object: 'event', type, livemode: false, created: Math.floor(Date.now() / 1000), data: { object } };
}
