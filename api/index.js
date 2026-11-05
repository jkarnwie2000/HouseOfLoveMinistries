// Vercel serverless entry point: every /api/* request is handled by the Express app.
// The React site itself is served by Vercel as static files from client/dist.
import { initDb } from '../server/src/db/index.js';
import { createApp } from '../server/src/app.js';

const app = createApp();
let ready = null;

function init() {
  if (!ready) {
    ready = initDb().catch((err) => {
      ready = null; // retry on the next request instead of caching the failure
      throw err;
    });
  }
  return ready;
}

export default async function handler(req, res) {
  try {
    await init();
  } catch (err) {
    console.error('[startup] database initialisation failed:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'The service is temporarily unavailable. Please try again shortly.' }));
  }
  return app(req, res);
}
