import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    // Generous in dev/test (React StrictMode doubles requests); strict in production.
    limit: env.isProd ? limit : limit * 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });

export const loginLimiter = make(10, 15, 'Too many sign-in attempts. Please wait 15 minutes and try again.');
export const formLimiter = make(20, 15, 'Too many submissions. Please try again later.');
export const paymentLimiter = make(30, 15, 'Too many payment attempts. Please wait a few minutes and try again.');
// Many visitors can share one IP (e.g. church Wi-Fi), so the general limit is generous.
export const apiLimiter = make(2000, 15, 'Too many requests. Please slow down.');
