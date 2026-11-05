import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { AUTH_COOKIE, cookieOptions, signToken } from '../middleware/auth.js';
import { sendEmail, staffRequestAlertEmail, staffRequestReceivedEmail } from '../services/email.js';
import { forbidden, unauthorized } from '../utils/errors.js';

// Compared against when the email is unknown so response timing does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

/** Accounts created before self-registration existed have no status and are treated as active. */
export const isPending = (user) => user?.status === 'pending';

export async function login(req, res) {
  const { email, password } = req.validated;
  const [user] = await db().findBy('users', 'email', email);
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Incorrect email or password.');
  // Only someone who knows the password learns that the account is waiting for approval.
  if (isPending(user)) throw forbidden('Your account is waiting for approval by an administrator. You will receive an email once it has been approved.');
  if (!user.active) throw unauthorized('Incorrect email or password.');

  await db().update('users', user.id, { lastLoginAt: new Date().toISOString() });
  res.cookie(AUTH_COOKIE, signToken(user), cookieOptions());
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

const REGISTERED_MESSAGE = 'Thank you! Your account request has been sent to the site administrators. You will receive an email once it has been approved, and you can then sign in.';

/**
 * Public staff sign-up. The new account is created as "pending" (inactive) and cannot sign in
 * until an administrator approves it and chooses its role on the Staff Accounts page.
 */
export async function register(req, res) {
  const { website, password, ...data } = req.validated;
  if (website) return res.status(201).json({ message: REGISTERED_MESSAGE }); // honeypot: silently ignore bots

  // Same response whether or not the email already exists, so the form cannot be used to discover accounts.
  const [existing] = await db().findBy('users', 'email', data.email);
  if (existing) return res.status(201).json({ message: REGISTERED_MESSAGE });

  const user = await db().create('users', {
    name: data.name,
    email: data.email,
    note: data.note,
    role: 'editor', // final role is chosen by the approving admin
    active: false,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    passwordHash: await bcrypt.hash(password, 12),
  });

  // Tell the administrators (church office address + every active admin), and acknowledge the request.
  const admins = (await db().findBy('users', 'role', 'admin')).filter((u) => u.active && !isPending(u)).map((u) => u.email);
  const recipients = [...new Set([env.notifyEmail, ...admins].filter(Boolean).map((e) => e.toLowerCase()))];
  const alert = staffRequestAlertEmail(user);
  for (const to of recipients) await sendEmail({ to, ...alert });
  await sendEmail({ to: user.email, ...staffRequestReceivedEmail(user) });

  res.status(201).json({ message: REGISTERED_MESSAGE });
}

export function logout(_req, res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(AUTH_COOKIE, opts);
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ user: req.user });
}
