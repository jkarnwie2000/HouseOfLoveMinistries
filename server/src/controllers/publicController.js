import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { DONATION, SHIPPING_OPTIONS } from '../config/store.js';
import { stripeConfigured } from '../services/stripe.js';
import { contactNotificationEmail, registrationEmail, sendEmail } from '../services/email.js';
import { badRequest, notFound } from '../utils/errors.js';

const LOW_STOCK = 5;

export function publicProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    image: p.image || '',
    sizes: p.sizes || [],
    colors: p.colors || [],
    featured: Boolean(p.featured),
    inventory: Math.max(0, p.inventory ?? 0),
    availability: (p.inventory ?? 0) <= 0 ? 'out_of_stock' : p.inventory <= LOW_STOCK ? 'low_stock' : 'in_stock',
  };
}

export function getConfig(_req, res) {
  res.json({
    currency: env.currency,
    paymentsEnabled: stripeConfigured(),
    shippingOptions: SHIPPING_OPTIONS,
    donation: DONATION,
  });
}

export async function listCategories(_req, res) {
  const [categories, products] = await Promise.all([db().list('categories'), db().list('products')]);
  const counts = {};
  for (const p of products) if (p.active) counts[p.category] = (counts[p.category] || 0) + 1;
  res.json(
    categories
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name))
      .map((c) => ({ id: c.id, name: c.name, description: c.description || '', productCount: counts[c.id] || 0 })),
  );
}

export async function listProducts(req, res) {
  const { category, q, featured, sort } = req.query;
  let products = (await db().list('products')).filter((p) => p.active);
  if (typeof category === 'string' && category && category !== 'all') products = products.filter((p) => p.category === category);
  if (featured === 'true') products = products.filter((p) => p.featured);
  if (typeof q === 'string' && q.trim()) {
    const terms = q.toLowerCase().trim().slice(0, 100).split(/\s+/);
    products = products.filter((p) => {
      const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  const sorters = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    featured: (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
  };
  products.sort(sorters[sort] || sorters.featured);
  res.json(products.map(publicProduct));
}

export async function getProduct(req, res) {
  const product = await db().get('products', req.params.id);
  if (!product || !product.active) throw notFound('This product is not available.');
  res.json(publicProduct(product));
}

/** Rolls weekly recurring events (e.g. "Every Sunday") forward to their next occurrence. */
export function nextOccurrence(event, now = new Date()) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  if (!/^every\s/i.test(event.recurrence || '')) return event;
  const duration = end ? end - start : 0;
  const finish = () => new Date(start.getTime() + duration);
  while ((end ? finish() : start) < now) start.setDate(start.getDate() + 7);
  return { ...event, startDate: start.toISOString(), endDate: end ? finish().toISOString() : null };
}

async function registrationCounts() {
  const counts = {};
  for (const r of await db().list('registrations')) counts[r.eventId] = (counts[r.eventId] || 0) + (r.attendees || 1);
  return counts;
}

function publicEvent(e, counts) {
  const registered = counts[e.id] || 0;
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category || '',
    startDate: e.startDate,
    endDate: e.endDate || null,
    recurrence: e.recurrence || '',
    location: e.location,
    image: e.image || '',
    registrationRequired: Boolean(e.registrationRequired),
    capacity: e.capacity ?? null,
    spotsLeft: e.capacity ? Math.max(0, e.capacity - registered) : null,
  };
}

export async function listEvents(req, res) {
  const now = new Date();
  const counts = await registrationCounts();
  let events = (await db().list('events'))
    .filter((e) => e.published !== false)
    .map((e) => nextOccurrence(e, now))
    .filter((e) => new Date(e.endDate || e.startDate) >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const limit = Number(req.query.limit);
  if (limit > 0) events = events.slice(0, Math.min(limit, 50));
  res.json(events.map((e) => publicEvent(e, counts)));
}

export async function registerForEvent(req, res) {
  const event = await db().get('events', req.params.id);
  if (!event || event.published === false) throw notFound('This event could not be found.');
  if (!event.registrationRequired) throw badRequest('This event does not require registration – just come along!');
  const occurrence = nextOccurrence(event);
  if (new Date(occurrence.endDate || occurrence.startDate) < new Date()) throw badRequest('Registration for this event has closed.');

  const input = req.validated;
  const existing = (await db().findBy('registrations', 'eventId', event.id)).find((r) => r.email === input.email);
  if (existing) throw badRequest('You are already registered for this event with that email address.');
  if (event.capacity) {
    const counts = await registrationCounts();
    if ((counts[event.id] || 0) + input.attendees > event.capacity) {
      throw badRequest('Sorry – there are not enough places left for this event.');
    }
  }
  const reg = await db().create('registrations', { ...input, eventId: event.id, eventTitle: event.title });
  await sendEmail({ to: reg.email, ...registrationEmail(reg, occurrence) });
  res.status(201).json({ message: `You are registered for ${event.title}. A confirmation email is on its way.` });
}

export async function submitContact(req, res) {
  const { website, ...msg } = req.validated;
  if (website) return res.status(201).json({ message: 'Thank you! Your message has been sent.' }); // honeypot
  const saved = await db().create('messages', { ...msg, read: false });
  if (env.notifyEmail) await sendEmail({ to: env.notifyEmail, replyTo: saved.email, ...contactNotificationEmail(saved) });
  res.status(201).json({ message: 'Thank you! Your message has been sent. We will respond as soon as we can.' });
}

export async function subscribe(req, res) {
  const { email, name, website } = req.validated;
  if (website) return res.status(201).json({ message: 'Thank you for subscribing!' });
  const existing = await db().findBy('subscribers', 'email', email);
  if (existing.length === 0) await db().create('subscribers', { email, name: name || '', source: 'website' });
  res.status(201).json({ message: 'Thank you for subscribing! You will hear about upcoming services, events and outreach.' });
}
