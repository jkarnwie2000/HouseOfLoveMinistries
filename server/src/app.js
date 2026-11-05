import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { stripeWebhook } from './controllers/paymentController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimits.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
        formAction: ["'self'", 'https://checkout.stripe.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: env.isProd ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  app.use(cors({
    origin(origin, cb) {
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  }));

  // Stripe webhooks need the exact raw body for signature verification,
  // so this route is registered BEFORE the JSON body parser.
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.use('/api', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFoundHandler);

  fs.mkdirSync(env.uploadDir, { recursive: true });
  app.use('/uploads', express.static(env.uploadDir, { maxAge: '30d', index: false, dotfiles: 'deny' }));

  // In production the API also serves the built React app.
  if (env.serveClient && fs.existsSync(env.clientDist)) {
    app.use(express.static(env.clientDist, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(env.clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
