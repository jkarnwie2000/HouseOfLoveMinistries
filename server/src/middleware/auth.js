import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const AUTH_COOKIE = 'holim_admin';

export const ROLES = {
  admin: 'admin', // full access, including donations and user management
  editor: 'editor', // products, categories, events, orders – no donation records
};

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'holim-api',
    audience: 'holim-admin',
  });
}

/** Requires a valid admin session cookie; re-checks the user record on every request. */
export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next(unauthorized());
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { issuer: 'holim-api', audience: 'holim-admin' });
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }
  const user = await db().get('users', payload.sub);
  if (!user || !user.active) return next(unauthorized());
  req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
  next();
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};
