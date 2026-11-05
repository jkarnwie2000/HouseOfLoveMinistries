import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { verifyImageSignature, uploadFileName } from '../middleware/upload.js';
import { cancelRecurringDonation } from '../services/donationService.js';
import { donationReceiptEmail, fulfillmentEmail, orderConfirmationEmail, sendEmail, sendTestEmail, staffApprovedEmail } from '../services/email.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { cleanText, slugify } from '../utils/sanitize.js';
import { env } from '../config/env.js';

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const COMPLETED_ORDER = new Set(['paid', 'review_required']);

async function uniqueId(collection, base) {
  const root = slugify(base) || 'item';
  let id = root;
  for (let n = 2; await db().get(collection, id); n++) id = `${root}-${n}`;
  return id;
}

// ---- Dashboard -------------------------------------------------------------
export async function stats(req, res) {
  const [orders, donations, products, events, messages] = await Promise.all(
    ['orders', 'donations', 'products', 'events', 'messages'].map((c) => db().list(c)),
  );
  const paidOrders = orders.filter((o) => COMPLETED_ORDER.has(o.paymentStatus));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const result = {
    orders: {
      paidCount: paidOrders.length,
      revenue: paidOrders.reduce((s, o) => s + o.total, 0),
      awaitingFulfillment: paidOrders.filter((o) => ['unfulfilled', 'processing'].includes(o.fulfillmentStatus)).length,
      pendingCount: orders.filter((o) => o.paymentStatus === 'pending').length,
    },
    products: {
      active: products.filter((p) => p.active).length,
      lowStock: products.filter((p) => p.active && p.inventory <= 5)
        .map((p) => ({ id: p.id, name: p.name, inventory: p.inventory })),
    },
    events: { upcoming: events.filter((e) => new Date(e.startDate) >= new Date() || /^every/i.test(e.recurrence || '')).length },
    messages: { unread: messages.filter((m) => !m.read).length },
    recentTransactions: [],
    donations: null,
  };

  const tx = paidOrders.map((o) => ({
    kind: 'order', id: o.id, reference: o.orderNumber, name: o.customerName, amount: o.total, date: o.paidAt || o.createdAt,
  }));

  if (req.user.role === 'admin') {
    const done = donations.filter((d) => d.paymentStatus === 'completed');
    result.donations = {
      total: done.reduce((s, d) => s + d.amount, 0),
      count: done.length,
      thisMonth: done.filter((d) => new Date(d.completedAt || d.createdAt) >= monthStart).reduce((s, d) => s + d.amount, 0),
      activeMonthly: donations.filter((d) => !d.parentDonationId && d.subscriptionStatus === 'active').length,
    };
    tx.push(...done.map((d) => ({
      kind: 'donation', id: d.id, reference: d.reference, name: d.anonymous ? 'Anonymous' : d.donorName, amount: d.amount, date: d.completedAt || d.createdAt,
    })));
  }
  result.recentTransactions = tx.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  res.json(result);
}

// ---- Products --------------------------------------------------------------
export async function listProducts(_req, res) {
  res.json((await db().list('products')).sort((a, b) => a.name.localeCompare(b.name)));
}

export async function getProduct(req, res) {
  const product = await db().get('products', req.params.id);
  if (!product) throw notFound('Product not found.');
  res.json(product);
}

async function assertCategory(id) {
  if (!(await db().get('categories', id))) throw badRequest('Please choose an existing category.');
}

export async function createProduct(req, res) {
  await assertCategory(req.validated.category);
  const id = await uniqueId('products', req.validated.name);
  res.status(201).json(await db().create('products', { ...req.validated, id }));
}

export async function updateProduct(req, res) {
  await assertCategory(req.validated.category);
  const updated = await db().update('products', req.params.id, req.validated);
  if (!updated) throw notFound('Product not found.');
  res.json(updated);
}

export async function deleteProduct(req, res) {
  if (!(await db().remove('products', req.params.id))) throw notFound('Product not found.');
  res.status(204).end();
}

export async function uploadImage(req, res) {
  if (!req.file) throw badRequest('Please choose an image to upload.');
  if (req.file.buffer) {
    // Vercel Blob storage (production on Vercel).
    if (!verifyImageSignature(req.file.buffer)) throw badRequest('That file does not appear to be a valid image.');
    const { put } = await import('@vercel/blob');
    const blob = await put(`products/${uploadFileName(req.file.mimetype)}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });
    return res.status(201).json({ url: blob.url });
  }
  if (!verifyImageSignature(req.file.path)) {
    fs.rmSync(req.file.path, { force: true });
    throw badRequest('That file does not appear to be a valid image.');
  }
  res.status(201).json({ url: `/uploads/${path.basename(req.file.path)}` });
}

// ---- Categories ------------------------------------------------------------
export async function listCategories(_req, res) {
  const [categories, products] = await Promise.all([db().list('categories'), db().list('products')]);
  res.json(categories
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
    .map((c) => ({ ...c, productCount: products.filter((p) => p.category === c.id).length })));
}

export async function createCategory(req, res) {
  const id = await uniqueId('categories', req.validated.name);
  res.status(201).json(await db().create('categories', { ...req.validated, id }));
}

export async function updateCategory(req, res) {
  const updated = await db().update('categories', req.params.id, req.validated);
  if (!updated) throw notFound('Category not found.');
  res.json(updated);
}

export async function deleteCategory(req, res) {
  const inUse = await db().findBy('products', 'category', req.params.id);
  if (inUse.length) throw conflict(`Move or delete the ${inUse.length} product(s) in this category first.`);
  if (!(await db().remove('categories', req.params.id))) throw notFound('Category not found.');
  res.status(204).end();
}

// ---- Orders ----------------------------------------------------------------
export async function listOrders(req, res) {
  let orders = await db().list('orders');
  const { paymentStatus, fulfillmentStatus } = req.query;
  if (paymentStatus && paymentStatus !== 'all') orders = orders.filter((o) => o.paymentStatus === paymentStatus);
  if (fulfillmentStatus && fulfillmentStatus !== 'all') orders = orders.filter((o) => o.fulfillmentStatus === fulfillmentStatus);
  res.json(orders.sort(byNewest));
}

export async function getOrder(req, res) {
  const order = await db().get('orders', req.params.id);
  if (!order) throw notFound('Order not found.');
  res.json(order);
}

export async function updateFulfillment(req, res) {
  const order = await db().get('orders', req.params.id);
  if (!order) throw notFound('Order not found.');
  if (!COMPLETED_ORDER.has(order.paymentStatus)) throw badRequest('Only paid orders can be fulfilled.');
  const { fulfillmentStatus, trackingNumber, internalNote } = req.validated;
  const history = [...(order.fulfillmentHistory || []), {
    status: fulfillmentStatus, at: new Date().toISOString(), by: req.user.email,
  }];
  const updated = await db().update('orders', order.id, {
    fulfillmentStatus,
    trackingNumber: trackingNumber || order.trackingNumber || '',
    internalNote: internalNote ?? order.internalNote ?? '',
    fulfillmentHistory: history,
  });
  if (fulfillmentStatus !== order.fulfillmentStatus) {
    const mail = fulfillmentEmail(updated);
    if (mail) await sendEmail({ to: updated.customerEmail, ...mail });
  }
  res.json(updated);
}

// ---- Donations (admin role only) ------------------------------------------
export async function listDonations(req, res) {
  let donations = await db().list('donations');
  const { status, frequency } = req.query;
  if (status && status !== 'all') donations = donations.filter((d) => d.paymentStatus === status);
  if (frequency && frequency !== 'all') donations = donations.filter((d) => d.frequency === frequency);
  const completed = donations.filter((d) => d.paymentStatus === 'completed');
  res.json({
    donations: donations.sort(byNewest),
    totals: {
      completedAmount: completed.reduce((s, d) => s + d.amount, 0),
      completedCount: completed.length,
      oneTime: completed.filter((d) => d.frequency === 'one-time').reduce((s, d) => s + d.amount, 0),
      monthly: completed.filter((d) => d.frequency === 'monthly').reduce((s, d) => s + d.amount, 0),
    },
  });
}

export async function cancelSubscription(req, res) {
  res.json(await cancelRecurringDonation(req.params.id));
}

// ---- Events ----------------------------------------------------------------
export async function listEvents(_req, res) {
  const [events, regs] = await Promise.all([db().list('events'), db().list('registrations')]);
  res.json(events
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map((e) => ({ ...e, registrations: regs.filter((r) => r.eventId === e.id).reduce((s, r) => s + (r.attendees || 1), 0) })));
}

export async function createEvent(req, res) {
  const id = await uniqueId('events', req.validated.title);
  res.status(201).json(await db().create('events', { ...req.validated, id }));
}

export async function updateEvent(req, res) {
  const updated = await db().update('events', req.params.id, req.validated);
  if (!updated) throw notFound('Event not found.');
  res.json(updated);
}

export async function deleteEvent(req, res) {
  if (!(await db().remove('events', req.params.id))) throw notFound('Event not found.');
  res.status(204).end();
}

export async function listRegistrations(req, res) {
  res.json((await db().findBy('registrations', 'eventId', req.params.id)).sort(byNewest));
}

// ---- Messages & subscribers -----------------------------------------------
export async function listMessages(_req, res) {
  res.json((await db().list('messages')).sort(byNewest));
}

export async function markMessageRead(req, res) {
  const updated = await db().update('messages', req.params.id, { read: req.body?.read !== false });
  if (!updated) throw notFound('Message not found.');
  res.json(updated);
}

export async function listSubscribers(_req, res) {
  res.json((await db().list('subscribers')).sort(byNewest));
}

// ---- Users (admin role only) ----------------------------------------------
const safeUser = ({ passwordHash, ...u }) => u;

export async function listUsers(_req, res) {
  res.json((await db().list('users')).map(safeUser));
}

export async function createUser(req, res) {
  const { password, ...data } = req.validated;
  if ((await db().findBy('users', 'email', data.email)).length) throw conflict('A user with that email already exists.');
  const user = await db().create('users', { ...data, active: true, status: 'active', passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json(safeUser(user));
}

export async function setUserActive(req, res) {
  if (req.params.id === req.user.id) throw badRequest('You cannot deactivate your own account.');
  const current = await db().get('users', req.params.id);
  if (!current) throw notFound('User not found.');
  if (current.status === 'pending') throw badRequest('This account is waiting for approval. Use Approve or Decline instead.');
  const updated = await db().update('users', req.params.id, { active: Boolean(req.body?.active) });
  if (!updated) throw notFound('User not found.');
  res.json(safeUser(updated));
}

/** Approves a self-registered staff account, sets its role and emails the staff member. */
export async function approveUser(req, res) {
  const user = await db().get('users', req.params.id);
  if (!user) throw notFound('User not found.');
  if (user.status !== 'pending') throw badRequest('This account is not waiting for approval.');
  const updated = await db().update('users', user.id, {
    role: req.validated.role,
    active: true,
    status: 'active',
    approvedAt: new Date().toISOString(),
    approvedBy: req.user.email,
  });
  await sendEmail({ to: updated.email, ...staffApprovedEmail(updated) });
  res.json(safeUser(updated));
}

/** Declines (deletes) a pending account request. Active accounts are disabled instead, never deleted here. */
export async function declineUser(req, res) {
  const user = await db().get('users', req.params.id);
  if (!user) throw notFound('User not found.');
  if (user.status !== 'pending') throw badRequest('Only pending account requests can be declined. Disable active accounts instead.');
  await db().remove('users', user.id);
  res.status(204).end();
}

// ---- Resend receipts ----------------------------------------------------------
const RESEND_COOLDOWN_MS = 30 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Re-sends a receipt to the address on file, or to a corrected address typed by staff.
 * Every resend is recorded (when, by whom, to where) on the order/donation.
 */
async function resendReceipt(req, res, { collection, record, onFile, sentField, buildEmail }) {
  const to = cleanText(req.body?.to || '', 254).toLowerCase() || onFile;
  if (!EMAIL_RE.test(to)) throw badRequest('Please enter a valid email address.');
  const history = record.receiptResends || [];
  const last = history.at(-1);
  if (last && Date.now() - new Date(last.at).getTime() < RESEND_COOLDOWN_MS) {
    throw badRequest('A receipt was just sent. Please wait 30 seconds before sending it again.');
  }
  const sent = await sendEmail({ to, replyTo: env.notifyEmail || undefined, ...buildEmail() });
  if (!sent) {
    const err = new Error('The email could not be sent. Use the “Email delivery check” on the Dashboard to see why.');
    err.status = 502;
    err.expose = true;
    throw err;
  }
  const entry = { at: new Date().toISOString(), by: req.user.email, to };
  const patch = { receiptResends: [...history, entry].slice(-20) };
  if (to === onFile.toLowerCase()) patch[sentField] = true;
  const updated = await db().update(collection, record.id, patch);
  res.json({ ok: true, to, at: entry.at, receiptResends: updated.receiptResends });
}

export async function resendOrderReceipt(req, res) {
  const order = await db().get('orders', req.params.id);
  if (!order) throw notFound('Order not found.');
  if (!['paid', 'review_required'].includes(order.paymentStatus)) throw badRequest('Only paid orders have a receipt to resend.');
  return resendReceipt(req, res, {
    collection: 'orders', record: order, onFile: order.customerEmail, sentField: 'emailSent',
    buildEmail: () => orderConfirmationEmail(order),
  });
}

export async function resendDonationReceipt(req, res) {
  const donation = await db().get('donations', req.params.id);
  if (!donation) throw notFound('Donation not found.');
  if (!['completed', 'review_required'].includes(donation.paymentStatus)) throw badRequest('Only completed gifts have a receipt to resend.');
  return resendReceipt(req, res, {
    collection: 'donations', record: donation, onFile: donation.donorEmail, sentField: 'receiptSent',
    buildEmail: () => donationReceiptEmail(donation, { renewal: Boolean(donation.isRenewal) }),
  });
}

// ---- Email diagnostics -----------------------------------------------------
export async function testEmail(req, res) {
  const to = cleanText(req.body?.to || '', 200) || env.notifyEmail || req.user.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw badRequest('Please enter a valid email address.');
  res.json(await sendTestEmail(to));
}
