/** Seeds placeholder categories, products, events and the admin from .env (only into empty collections). */
import { initDb, closeDb } from '../src/db/index.js';

await initDb({ seed: true });
await closeDb();
console.log('Seeding complete.');
