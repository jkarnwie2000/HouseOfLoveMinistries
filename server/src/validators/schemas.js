import { z } from 'zod';
import { cleanText } from '../utils/sanitize.js';
import { DONATION, MAX_QTY_PER_LINE, ORDER_FULFILLMENT_STATUSES, SHIPPING_OPTIONS } from '../config/store.js';

const text = (max, min = 0, label = 'This field') =>
  z.string({ error: `${label} is required.` })
    .transform((v) => cleanText(v, max))
    .pipe(min > 0 ? z.string().min(min, `${label} is required.`) : z.string());

const optionalText = (max) =>
  z.string().nullish().transform((v) => cleanText(v ?? '', max)).optional().transform((v) => v ?? '');

const email = z.string({ error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Please enter a valid email address.'));

const idString = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/, 'Invalid identifier.');

export const cartItemSchema = z.object({
  productId: idString,
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE),
  size: optionalText(20),
  color: optionalText(40),
});

export const cartQuoteSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty.').max(50),
  shippingOption: z.enum(SHIPPING_OPTIONS.map((o) => o.id)).default('standard'),
});

export const addressSchema = z.object({
  line1: text(200, 1, 'Street address'),
  line2: optionalText(200),
  city: text(100, 1, 'City'),
  state: text(100, 1, 'State / region'),
  postalCode: text(20, 1, 'Postal code'),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Use a 2-letter country code.').default('US'),
});

export const checkoutSchema = cartQuoteSchema.extend({
  customer: z.object({
    name: text(120, 2, 'Full name'),
    email,
    phone: optionalText(40),
  }),
  shippingAddress: addressSchema.optional().nullable(),
}).superRefine((val, ctx) => {
  const option = SHIPPING_OPTIONS.find((o) => o.id === val.shippingOption);
  if (option?.requiresAddress && !val.shippingAddress) {
    ctx.addIssue({ code: 'custom', path: ['shippingAddress'], message: 'A shipping address is required for delivery.' });
  }
});

export const donationSchema = z.object({
  amount: z.coerce.number({ error: 'Please choose an amount.' })
    .min(DONATION.minAmount, `The minimum gift is $${DONATION.minAmount}.`)
    .max(DONATION.maxAmount, `For gifts above $${DONATION.maxAmount.toLocaleString()}, please contact the church office.`)
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, 'Use at most two decimal places.'),
  frequency: z.enum(['one-time', 'monthly']),
  fund: z.enum(DONATION.funds.map((f) => f.id)).default('general'),
  anonymous: z.coerce.boolean().default(false),
  name: optionalText(120),
  email,
  message: optionalText(500),
}).superRefine((val, ctx) => {
  if (!val.anonymous && val.name.length < 2) {
    ctx.addIssue({ code: 'custom', path: ['name'], message: 'Please enter your full name, or choose to give anonymously.' });
  }
});

export const contactSchema = z.object({
  name: text(120, 2, 'Name'),
  email,
  subject: text(150, 2, 'Subject'),
  message: text(5000, 10, 'Message').refine((v) => v.length >= 10, 'Please write at least 10 characters.'),
  website: optionalText(200), // honeypot – must stay empty
});

export const newsletterSchema = z.object({
  email,
  name: optionalText(120),
  website: optionalText(200),
});

export const eventRegistrationSchema = z.object({
  name: text(120, 2, 'Name'),
  email,
  phone: optionalText(40),
  attendees: z.coerce.number().int().min(1).max(20).default(1),
  notes: optionalText(500),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.').max(200),
});

const colorSchema = z.object({
  name: text(40, 1, 'Color name'),
  hex: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color such as #6B1E2E.'),
});

const imageUrl = z.string().trim().max(500)
  .refine((v) => v === '' || v.startsWith('/uploads/') || v.startsWith('/images/') || /^https:\/\//.test(v),
    'Image must be an uploaded file or an https:// URL.');

const bool = z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => v === true || v === 'true');

export const productSchema = z.object({
  name: text(120, 2, 'Product name'),
  description: text(2000, 1, 'Description'),
  price: z.coerce.number().int('Price must be in whole cents.').min(50, 'Minimum price is $0.50.').max(1_000_000),
  category: idString,
  image: imageUrl.default(''),
  sizes: z.array(text(20, 1)).max(15).default([]),
  colors: z.array(colorSchema).max(15).default([]),
  inventory: z.coerce.number().int().min(0).max(1_000_000),
  active: bool.default(true),
  featured: bool.default(false),
});

export const categorySchema = z.object({
  name: text(80, 2, 'Category name'),
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(999).default(99),
});

export const eventSchema = z.object({
  title: text(150, 2, 'Event name'),
  description: text(3000, 1, 'Description'),
  category: optionalText(60),
  startDate: z.iso.datetime({ offset: true, error: 'Enter a valid start date and time.' }),
  endDate: z.union([z.iso.datetime({ offset: true }), z.literal(''), z.null()]).optional().transform((v) => v || null),
  recurrence: optionalText(80),
  location: text(200, 1, 'Location'),
  image: imageUrl.default(''),
  registrationRequired: bool.default(false),
  capacity: z.union([z.coerce.number().int().min(1).max(100000), z.literal(''), z.null()]).optional()
    .transform((v) => (v === '' || v == null ? null : v)),
  published: bool.default(true),
});

export const fulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(ORDER_FULFILLMENT_STATUSES),
  trackingNumber: optionalText(100),
  internalNote: optionalText(1000),
});

/** Public "create a staff account" request – the account stays pending until an admin approves it. */
export const registerSchema = z.object({
  name: text(120, 2, 'Full name'),
  email,
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
  note: optionalText(300), // role or ministry, shown to the approving admin
  website: optionalText(200), // honeypot – must stay empty
});

export const approveUserSchema = z.object({
  role: z.enum(['admin', 'editor']),
});

export const userSchema = z.object({
  name: text(120, 2, 'Name'),
  email,
  role: z.enum(['admin', 'editor']),
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
});
