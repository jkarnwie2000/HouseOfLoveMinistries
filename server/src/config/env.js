import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '../..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

// A single .env file at the project root is shared by the server and Vite
// (Vite only exposes variables prefixed with VITE_ to the browser).
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.join(PROJECT_ROOT, '.env'), quiet: true });
}

const list = (value, fallback) =>
  value ? value.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

let jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  if (isProd) throw new Error('JWT_SECRET must be set in production.');
  jwtSecret = crypto.randomBytes(32).toString('hex');
  if (nodeEnv !== 'test') {
    console.warn('[config] JWT_SECRET not set – using a temporary secret (admin sessions reset on restart).');
  }
}

export const env = {
  nodeEnv,
  isProd,
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 4242,
  clientUrl,
  corsOrigins: list(process.env.CORS_ORIGINS, [clientUrl]),

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  admin: {
    email: (process.env.ADMIN_EMAIL || '').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Site Administrator',
  },

  dbDriver: (process.env.DB_DRIVER || 'json').toLowerCase(),
  jsonDbPath: process.env.JSON_DB_PATH
    ? path.resolve(PROJECT_ROOT, process.env.JSON_DB_PATH)
    : path.join(SERVER_ROOT, 'data', 'db.json'),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'House of Love International Ministries <no-reply@example.org>',
  notifyEmail: process.env.ORG_NOTIFY_EMAIL || '',

  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(PROJECT_ROOT, process.env.UPLOAD_DIR)
    : path.join(SERVER_ROOT, 'uploads'),
  clientDist: path.join(PROJECT_ROOT, 'client', 'dist'),
  serveClient: process.env.SERVE_CLIENT ? process.env.SERVE_CLIENT === 'true' : isProd,
};
