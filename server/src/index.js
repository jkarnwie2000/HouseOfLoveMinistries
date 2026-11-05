import { env } from './config/env.js';
import { initDb, closeDb } from './db/index.js';
import { createApp } from './app.js';

await initDb();
const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`\n  House of Love API running on http://localhost:${env.port}`);
  console.log(`  Database driver: ${env.dbDriver}`);
  if (!env.stripeSecretKey) console.warn('  ⚠ STRIPE_SECRET_KEY is not set – checkout and donations are disabled.');
  if (!env.stripeWebhookSecret) console.warn('  ⚠ STRIPE_WEBHOOK_SECRET is not set – payments cannot be confirmed.');
  if (!env.smtp.host) console.warn('  ⚠ SMTP is not configured – emails are logged to the console instead of sent.');
  console.log('');
});

async function shutdown(signal) {
  console.log(`\n${signal} received – shutting down…`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
