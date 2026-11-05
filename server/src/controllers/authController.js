import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { AUTH_COOKIE, cookieOptions, signToken } from '../middleware/auth.js';
import { unauthorized } from '../utils/errors.js';

// Compared against when the email is unknown so response timing does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function login(req, res) {
  const { email, password } = req.validated;
  const [user] = await db().findBy('users', 'email', email);
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok || !user.active) throw unauthorized('Incorrect email or password.');

  await db().update('users', user.id, { lastLoginAt: new Date().toISOString() });
  res.cookie(AUTH_COOKIE, signToken(user), cookieOptions());
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export function logout(_req, res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(AUTH_COOKIE, opts);
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ user: req.user });
}
