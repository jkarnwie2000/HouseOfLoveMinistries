import { env } from '../config/env.js';
import { createJsonStore } from './jsonStore.js';
import { createFirestoreStore } from './firestoreStore.js';
import { seedIfEmpty } from './seed.js';

/**
 * Collections:
 *  products, categories, orders, donations, events, users,
 *  messages (contact form), subscribers (newsletter), webhookEvents (Stripe idempotency)
 */
let store = null;

export async function initDb({ seed = true } = {}) {
  if (store) return store;
  if (env.dbDriver === 'firestore') {
    store = await createFirestoreStore(env.firebase);
  } else if (env.dbDriver === 'json') {
    store = createJsonStore(env.jsonDbPath);
  } else {
    throw new Error(`Unknown DB_DRIVER "${env.dbDriver}". Use "json" or "firestore".`);
  }
  await store.init();
  if (seed) await seedIfEmpty(store);
  return store;
}

export function db() {
  if (!store) throw new Error('Database has not been initialised. Call initDb() first.');
  return store;
}

export async function closeDb() {
  if (store) await store.close();
  store = null;
}
