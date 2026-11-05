import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * PLACEHOLDER SEED DATA.
 * Every product, price and event below is an editable placeholder – replace them
 * from the admin dashboard once the ministry confirms real details.
 */
const C = {
  burgundy: { name: 'Burgundy', hex: '#6B1E2E' },
  gold: { name: 'Gold', hex: '#C9A24B' },
  ivory: { name: 'Ivory', hex: '#F3EBDB' },
  charcoal: { name: 'Charcoal', hex: '#2B2622' },
  white: { name: 'White', hex: '#FFFFFF' },
  forest: { name: 'Forest', hex: '#2F4A3A' },
  black: { name: 'Black', hex: '#141414' },
  tan: { name: 'Tan', hex: '#B08A5A' },
};
const APPAREL = ['S', 'M', 'L', 'XL', '2XL'];

export const SEED_CATEGORIES = [
  { id: 't-shirts', name: 'T-Shirts', description: 'Church-branded T-shirts for worship, outreach and everyday wear.', sortOrder: 1 },
  { id: 'sweaters-hoodies', name: 'Sweaters & Hoodies', description: 'Warm church-branded sweaters and hoodies.', sortOrder: 2 },
  { id: 'caps', name: 'Baseball Caps', description: 'Embroidered House of Love baseball caps.', sortOrder: 3 },
  {
    id: 'bangers',
    name: 'Bangers',
    description: 'Church-branded “Bangers”. PLACEHOLDER – the exact product type is awaiting confirmation from the ministry; rename this category and its products from the admin dashboard.',
    sortOrder: 4,
  },
  { id: 'bibles', name: 'Holy Bibles', description: 'Holy Bibles for study, devotion and gifting.', sortOrder: 5 },
  { id: 'key-holders', name: 'Christian Key Holders', description: 'Christian key holders and keychains.', sortOrder: 6 },
];

const p = (o) => ({
  image: '',
  sizes: [],
  colors: [],
  active: true,
  featured: false,
  ...o,
});

export const SEED_PRODUCTS = [
  p({ id: 'love-never-fails-tee', name: '“Love Never Fails” Tee', category: 't-shirts', price: 2500, inventory: 120, featured: true,
    description: 'Soft ring-spun cotton tee printed with the House of Love crest and 1 Corinthians 13:8. A comfortable way to carry the message wherever you go.',
    sizes: APPAREL, colors: [C.burgundy, C.ivory, C.charcoal] }),
  p({ id: 'house-of-love-crest-tee', name: 'House of Love Crest Tee', category: 't-shirts', price: 2200, inventory: 90,
    description: 'Classic crew-neck tee with an embroidered-look gold crest on the chest and an African-inspired pattern band across the back.',
    sizes: APPAREL, colors: [C.white, C.black, C.forest] }),
  p({ id: 'outreach-team-tee', name: 'Outreach Team Tee', category: 't-shirts', price: 2000, inventory: 60,
    description: 'Lightweight tee designed for outreach days and volunteer events, with “Serving in Love” across the back.',
    sizes: APPAREL, colors: [C.gold, C.burgundy] }),
  p({ id: 'heritage-hoodie', name: 'Heritage Pullover Hoodie', category: 'sweaters-hoodies', price: 4800, inventory: 45, featured: true,
    description: 'Heavyweight fleece hoodie with a kente-inspired pattern stripe on the sleeves and the ministry name on the chest.',
    sizes: APPAREL, colors: [C.burgundy, C.charcoal, C.tan] }),
  p({ id: 'faith-crewneck-sweater', name: 'Faith Crewneck Sweater', category: 'sweaters-hoodies', price: 4200, inventory: 40,
    description: 'Cozy crewneck sweater with “Faith · Hope · Love” stitched in gold thread.',
    sizes: APPAREL, colors: [C.ivory, C.forest] }),
  p({ id: 'zip-up-unity-hoodie', name: 'Unity Zip-Up Hoodie', category: 'sweaters-hoodies', price: 5200, inventory: 30,
    description: 'Full-zip hoodie with front pockets and the House of Love heart-and-cross mark.',
    sizes: APPAREL, colors: [C.black, C.burgundy] }),
  p({ id: 'crest-baseball-cap', name: 'Embroidered Crest Cap', category: 'caps', price: 2400, inventory: 75, featured: true,
    description: 'Structured six-panel cap with the embroidered heart-and-cross crest and an adjustable strap. One size fits most.',
    colors: [C.burgundy, C.charcoal, C.ivory] }),
  p({ id: 'blessed-dad-cap', name: '“Blessed” Washed Cap', category: 'caps', price: 2200, inventory: 50,
    description: 'Unstructured washed-cotton cap with “Blessed” embroidered in gold. One size fits most.',
    colors: [C.tan, C.forest] }),
  p({ id: 'house-of-love-banger', name: 'House of Love Banger', category: 'bangers', price: 1800, inventory: 40,
    description: 'PLACEHOLDER PRODUCT – the ministry will confirm what a “Banger” is. Update the name, description, image and price from the admin dashboard.',
    colors: [C.burgundy, C.gold] }),
  p({ id: 'scripture-banger', name: 'Scripture Banger', category: 'bangers', price: 1500, inventory: 40,
    description: 'PLACEHOLDER PRODUCT – editable once the product type for the Bangers category is confirmed.',
    colors: [C.ivory, C.charcoal] }),
  p({ id: 'kjv-study-bible', name: 'Holy Bible – Study Edition', category: 'bibles', price: 3900, inventory: 35, featured: true,
    description: 'Hardcover study Bible with reading plans, maps and room for notes. PLACEHOLDER: confirm the translation and edition you will stock.',
    colors: [C.burgundy, C.black] }),
  p({ id: 'pocket-bible', name: 'Holy Bible – Pocket Edition', category: 'bibles', price: 1600, inventory: 80,
    description: 'Compact pocket Bible, perfect for travel, outreach and gifting. PLACEHOLDER: confirm the translation.',
    colors: [C.tan, C.burgundy] }),
  p({ id: 'heart-cross-key-holder', name: 'Heart & Cross Key Holder', category: 'key-holders', price: 900, inventory: 150,
    description: 'Polished metal key holder featuring the heart-and-cross symbol of House of Love.',
    colors: [C.gold, { name: 'Silver', hex: '#B9BCC0' }] }),
  p({ id: 'psalm-23-key-holder', name: 'Psalm 23 Leather Key Holder', category: 'key-holders', price: 1200, inventory: 100,
    description: 'Genuine leather key holder embossed with “The Lord is my shepherd” (Psalm 23:1).',
    colors: [C.tan, C.charcoal] }),
];

function nextWeekday(from, weekday, hour, minute = 0, addWeeks = 0) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff + addWeeks * 7);
  if (d < from) d.setDate(d.getDate() + 7);
  return d;
}
const plusHours = (d, h) => new Date(d.getTime() + h * 3600 * 1000);

export function buildSeedEvents(from = new Date()) {
  const sunday = nextWeekday(from, 0, 10);
  const wednesday = nextWeekday(from, 3, 19);
  const friday = nextWeekday(from, 5, 18, 30);
  const conference = nextWeekday(from, 5, 18, 0, 6);
  const outreach = nextWeekday(from, 6, 9, 0, 3);
  const youth = nextWeekday(from, 6, 14, 0, 2);
  const family = nextWeekday(from, 6, 12, 0, 5);
  const loc = 'Main Sanctuary – address to be confirmed';
  return [
    { id: 'sunday-worship', title: 'Sunday Worship Service', category: 'Worship', recurrence: 'Every Sunday',
      startDate: sunday.toISOString(), endDate: plusHours(sunday, 2).toISOString(), location: loc, registrationRequired: false,
      description: 'Join us for spirit-filled praise and worship, prayer and the preaching of God’s Word. Everyone is welcome – come as you are.' },
    { id: 'midweek-bible-study', title: 'Midweek Bible Study', category: 'Bible Study', recurrence: 'Every Wednesday',
      startDate: wednesday.toISOString(), endDate: plusHours(wednesday, 1.5).toISOString(), location: 'Fellowship Hall – address to be confirmed', registrationRequired: false,
      description: 'An interactive study through the Scriptures with time for questions, discussion and fellowship.' },
    { id: 'friday-prayer-meeting', title: 'Friday Prayer Meeting', category: 'Prayer', recurrence: 'Every Friday',
      startDate: friday.toISOString(), endDate: plusHours(friday, 1.5).toISOString(), location: loc, registrationRequired: false,
      description: 'Come together to intercede for our families, our church, our communities and the nations.' },
    { id: 'annual-conference', title: 'Annual Revival Conference (Placeholder)', category: 'Conference', recurrence: '',
      startDate: conference.toISOString(), endDate: plusHours(conference, 52).toISOString(), location: 'Venue to be confirmed', registrationRequired: true, capacity: 300,
      description: 'Three days of worship, teaching and renewal. PLACEHOLDER – theme, speakers and venue will be announced by the ministry.' },
    { id: 'community-food-drive', title: 'Community Food & Clothing Drive', category: 'Outreach', recurrence: '',
      startDate: outreach.toISOString(), endDate: plusHours(outreach, 4).toISOString(), location: 'Church grounds – address to be confirmed', registrationRequired: true, capacity: 60,
      description: 'Volunteer with us as we serve neighbours in need with groceries, clothing and prayer. Register to help.' },
    { id: 'youth-fellowship-day', title: 'Youth Fellowship Day', category: 'Youth & Family', recurrence: '',
      startDate: youth.toISOString(), endDate: plusHours(youth, 4).toISOString(), location: 'Fellowship Hall – address to be confirmed', registrationRequired: true, capacity: 80,
      description: 'Games, worship, mentoring and real conversations for young people aged 13–25.' },
    { id: 'family-picnic', title: 'Family Fellowship Picnic', category: 'Youth & Family', recurrence: '',
      startDate: family.toISOString(), endDate: plusHours(family, 4).toISOString(), location: 'Park location to be confirmed', registrationRequired: true, capacity: 150,
      description: 'An afternoon of food, music, games and fellowship for the whole church family. Bring a friend!' },
  ].map((e) => ({ image: '', published: true, capacity: null, ...e }));
}

export async function seedIfEmpty(store, { log = true } = {}) {
  const say = (...a) => log && !env.isTest && console.log('[seed]', ...a);

  if ((await store.list('categories')).length === 0) {
    for (const c of SEED_CATEGORIES) await store.create('categories', c);
    say(`created ${SEED_CATEGORIES.length} placeholder categories`);
  }
  if ((await store.list('products')).length === 0) {
    for (const prod of SEED_PRODUCTS) await store.create('products', prod);
    say(`created ${SEED_PRODUCTS.length} placeholder products`);
  }
  if ((await store.list('events')).length === 0) {
    const events = buildSeedEvents();
    for (const e of events) await store.create('events', e);
    say(`created ${events.length} placeholder events`);
  }

  const users = await store.list('users');
  if (users.length === 0) {
    if (env.admin.email && env.admin.password) {
      await store.create('users', {
        email: env.admin.email,
        name: env.admin.name,
        role: 'admin',
        active: true,
        passwordHash: await bcrypt.hash(env.admin.password, 12),
      });
      say(`created administrator account for ${env.admin.email}`);
    } else if (!env.isTest) {
      console.warn('[seed] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env, or run "npm run create-admin".');
    }
  }
}
