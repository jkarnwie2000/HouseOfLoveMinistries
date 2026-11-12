# House of Love International Ministries – Website, Store & Online Giving

**Live site:** https://house-of-love-ministries.vercel.app

| Home | Store |
| --- | --- |
| ![Home page](docs/screenshots/home-hero.jpg) | ![Store](docs/screenshots/store.jpg) |
| **Give** | **Admin dashboard** |
| ![Giving page](docs/screenshots/give.jpg) | ![Admin products](docs/screenshots/admin-products.jpg) |

## About this project

House of Love International Ministries is a full-stack website, online store and donation platform built for an African-owned Christian ministry. It brings together everything a growing church needs online: a welcoming public website, a merchandise shop, secure online giving and a private dashboard where church staff manage it all.

The public site introduces the church through Home, About, Ministries, Events and Contact pages. Visitors can explore eight ministries, see upcoming services and events, register for events and add them to their own calendar, and send a message or prayer request through a validated contact form. The design pairs a burgundy, gold and ivory palette with subtle African-inspired patterns, and it adapts smoothly to phones, tablets and desktops.

The House of Love Store sells church apparel, Holy Bibles and Christian gifts. Shoppers can search and filter products, choose sizes and colours, and keep items in a cart that survives page refreshes. Checkout runs through Stripe Checkout. Prices are always recalculated on the server, and an order is only marked paid after Stripe's signed webhook has been verified, with protection against duplicate events and mismatched amounts. No card details are ever stored.

The giving page accepts preset or custom one-time gifts as well as monthly recurring donations through Stripe subscriptions, with options for anonymous giving and choosing where a gift goes. Customers and donors receive branded email receipts, and the church office automatically receives a clearly marked staff copy of every receipt.

Staff sign in to a role-based admin dashboard to manage products and image uploads, categories, orders and fulfilment, donations and monthly gifts, events, messages and staff accounts. New team members can request an account, which an administrator must approve, and each role sees only what it needs. Staff can also resend any receipt and run an email delivery check.

The project is built with React and Vite on the front end and Node.js with Express on the back end, using Firebase Firestore for data, Vercel Blob for product images and Vercel for hosting. It is backed by 53 automated server tests covering pricing, payments, webhooks, receipts, staff accounts and security.

More screenshots, including mobile views, are in [Screenshots](#12-screenshots).

> **Placeholder content:** The church's history, leadership names, address, service times, product photos, prices and events have **not** been invented. They are clearly labelled, editable placeholders. See [Customising content](#7-customising-content).

---

## Contents
1. [Features](#1-features)
2. [Technology stack](#2-technology-stack)
3. [Project structure](#3-project-structure)
4. [Quick start (local development)](#4-quick-start-local-development)
5. [Stripe setup (payments & donations)](#5-stripe-setup-payments--donations)
6. [Database setup](#6-database-setup)
7. [Customising content](#7-customising-content)
8. [Email setup](#8-email-setup)
9. [Testing](#9-testing)
10. [Production build & deployment](#10-production-build--deployment)
11. [Security notes](#11-security-notes)
12. [Screenshots](#12-screenshots)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Features

### Ministry website
- **Home page:** hero with service times, "Join Us in Worship" and "Donate Now" buttons, welcome, mission and vision, featured ministries, scripture, upcoming events (live from the API), featured products, outreach highlights, a giving band, and newsletter sign-up.
- **About page:** history timeline, mission and vision, core values, statement of faith, leadership team and church life.
- **Ministries page:** 8 ministries, each with its own detail page (`/ministries/youth`, …).
- **Events page:** weekly services, category filters, online **event registration** (with capacity limits) and **Add to calendar** (.ics download). Weekly services roll forward automatically.
- **Contact page:** a validated contact form with a spam honeypot, contact details, service schedule, social links and a map placeholder.
- **Legal pages:** Privacy Policy and Terms & Conditions templates.

### House of Love Store
- Categories: T-Shirts, Sweaters & Hoodies, Baseball Caps, **Bangers** (product type to be confirmed; fully editable), Holy Bibles, and Christian Key Holders.
- Search, category filters and sorting. Filters live in the URL, so links can be shared (`/store?category=caps&q=crest`).
- Product pages with colour swatches, sizes, a quantity selector and stock availability.
- Cart (React Context + `localStorage`) that survives refreshes and stays in sync across browser tabs. You can update quantities, remove items, and see the subtotal, shipping and total.
- Checkout: contact details, delivery method (standard, express or pick-up at church), a shipping address, then **Stripe Checkout**.
- An order confirmation page. It polls the server until the **Stripe webhook** confirms payment.

### Online giving (`/give`)
- Preset amounts ($10–$500) or a custom amount, a **one-time / monthly** choice, and a fund designation.
- Name, email, optional message, and **anonymous giving**.
- One-time gifts use Stripe Checkout (`payment` mode). Monthly gifts use **Stripe Subscriptions**, and each monthly renewal is recorded automatically.
- A thank-you page shows the amount, the reference and the Stripe transaction ID.
- An emailed donation receipt.
- An editable nonprofit disclosure. The site makes **no promise of tax deductibility**.

### Admin dashboard (`/admin`)
- Secure sign-in (bcrypt + httpOnly JWT cookie), with **role-based access**:
  - `admin`: everything, including donations and staff accounts.
  - `editor`: products, categories, events, orders and messages, but **no donation records**.
- **Dashboard:** revenue, donation totals, monthly donors, recent transactions and low-stock alerts.
- **Products:** add, edit and delete products; set prices, descriptions, sizes, colours, inventory and active/featured flags; upload images.
- **Categories:** add, edit and delete (in-use categories are protected).
- **Orders:** filter orders, view details, and update fulfilment status and tracking (customers are emailed automatically).
- **Donations:** totals, filters, and cancelling a monthly gift.
- **Events:** create, edit and delete events, and view registrations.
- **Messages & Subscribers:** contact messages and newsletter subscribers, with CSV export.
- **Staff accounts:** create users and enable or disable them.
- **Staff sign-up with approval:** staff can request an account from **Staff Login → Create a staff account** (`/admin/register`). New accounts are *pending* and cannot sign in. The church office address and all admins are emailed; an admin chooses Editor or Admin and clicks **Approve** (or **Decline**) under *Staff Accounts*. The staff member is then emailed and can sign in and out.

---

## 2. Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, JavaScript (ES2022), React Router 7, Context API, Vite 8, Lucide React icons, hand-written CSS3 (no UI framework) |
| Backend | Node.js 20+, Express 5 |
| Payments | Stripe Checkout Sessions (payments and subscriptions), Stripe webhooks (`stripe` Node SDK) |
| Database | Pluggable: **JSON file store** (zero setup) or **Google Cloud Firestore / Firebase** (`firebase-admin`) |
| Auth | bcryptjs password hashing, JSON Web Token in an httpOnly, SameSite=Strict cookie |
| Validation | zod (server), plus accessible client-side validation |
| Security | helmet (CSP and security headers), CORS allow-list, express-rate-limit, multer image upload with signature checks |
| Email | Nodemailer (any SMTP provider) |
| Tests | Node's built-in test runner + supertest (42 API tests) |

No TypeScript is used anywhere.

---

## 3. Project structure

```
HouseOfLoveMinistries/
├── .env.example              ← copy to .env and fill in
├── package.json              ← root scripts (dev, build, start, test)
├── README.md
├── client/                   ← React frontend (Vite)
│   ├── index.html            ← SEO + Open Graph meta, fonts
│   ├── public/               ← favicon, og-image, robots.txt, images/
│   ├── vite.config.js        ← dev proxy to the API
│   └── src/
│       ├── main.jsx, App.jsx ← providers & routes (admin is code-split)
│       ├── components/
│       │   ├── layout/       ← Header (mobile menu), Footer, Layout
│       │   ├── store/        ← ProductCard, ProductArt, QtyStepper
│       │   ├── ui/           ← Field, Modal, Artwork, Logo, Feedback, Section…
│       │   └── EventCard, MinistryCard, NewsletterForm
│       ├── context/          ← CartContext, AuthContext, ConfigContext, ToastContext
│       ├── data/site.js      ← ✏️ ALL editable church content & placeholders
│       ├── lib/              ← api client, hooks, formatting, validation
│       ├── pages/            ← Home, About, Ministries, Events, Contact, Give…
│       │   ├── store/        ← Store, ProductDetail, Cart, Checkout, OrderConfirmation
│       │   └── admin/        ← Dashboard, Products, Orders, Donations, Events…
│       └── styles/           ← global (design tokens), layout, pages, store, admin
└── server/                   ← Express API
    ├── src/
    │   ├── index.js          ← starts the server
    │   ├── app.js            ← middleware, routes, static hosting
    │   ├── config/           ← env.js, store.js (shipping rates, donation presets)
    │   ├── controllers/      ← public, payment, auth, admin
    │   ├── routes/           ← public.js, auth.js, admin.js
    │   ├── middleware/       ← auth (roles), validate, rate limits, upload, errors
    │   ├── services/         ← stripe, pricing, orderService, donationService,
    │   │                       webhookService, email
    │   ├── db/               ← jsonStore, firestoreStore, seed data
    │   ├── validators/       ← zod schemas
    │   └── utils/            ← sanitising, errors, ids
    ├── scripts/              ← seed.js, create-admin.js
    ├── tests/                ← automated API tests
    ├── data/                 ← JSON database (git-ignored)
    └── uploads/              ← admin-uploaded images (git-ignored)
```

---

## 4. Quick start (local development)

### Prerequisites
- **Node.js 20.19 or newer** ([download](https://nodejs.org)). Check with `node -v`.
- A free **Stripe account** ([sign up](https://dashboard.stripe.com/register)). It stays in test mode by default.
- Optional: the **Stripe CLI** for local webhooks ([install guide](https://docs.stripe.com/stripe-cli)).

### Step 1 – Install dependencies
```bash
git clone https://github.com/jkarnwie2000/HouseOfLoveMinistries.git
cd HouseOfLoveMinistries
npm run install:all
```
This installs the root, `server/` and `client/` packages.

### Step 2 – Create your `.env` file
```bash
# macOS / Linux / Git Bash
cp .env.example .env
# Windows PowerShell
Copy-Item .env.example .env
```
Open `.env` and set at least these values:

| Variable | What to put |
| --- | --- |
| `STRIPE_SECRET_KEY` | Your **test** secret key, `sk_test_…` (see section 5) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` printed by `stripe listen` (see section 5) |
| `JWT_SECRET` | A long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The first admin login. It is created automatically the first time the server starts. |

### Step 3 – Start everything
```bash
npm run dev
```
- Website: **http://localhost:5173**
- API: http://localhost:4242 (the website proxies `/api` to it automatically)
- Admin: **http://localhost:5173/admin** (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

On first start the database is seeded with the 6 store categories, 14 placeholder products, 7 placeholder events and your admin account.

### Step 4 – Forward Stripe webhooks (in a second terminal)
```bash
npm run stripe:listen
# same as: stripe listen --events <the 9 events below> --forward-to localhost:4242/api/webhooks/stripe
```
Copy the `whsec_…` secret it prints into `STRIPE_WEBHOOK_SECRET` in `.env`, then restart `npm run dev`.

> **Why webhooks matter:** an order or donation is only marked **paid** after Stripe's signed webhook is verified on the server. Without the listener, payments still go through on Stripe, but the confirmation page keeps saying "finalising".

### Step 5 – Make a test purchase and a test donation
Use Stripe's [test cards](https://docs.stripe.com/testing):

| Card number | Result |
| --- | --- |
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3-D Secure authentication |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date, any CVC and any postcode.

To test monthly renewals without waiting a month, run `stripe trigger invoice.paid`, or use a [test clock](https://docs.stripe.com/billing/testing/test-clocks) in the Stripe Dashboard.

---

## 5. Stripe setup (payments & donations)

1. **Get your API keys.** Go to the Stripe Dashboard → *Developers* → *API keys* (make sure **Test mode** is on). Copy the **Secret key** (`sk_test_…`) into `STRIPE_SECRET_KEY`.
   - The site never needs the publishable key, because customers pay on Stripe's hosted Checkout page.
   - **Never** put the secret key in any `VITE_` variable or in frontend code.
2. **Set up webhooks for local development.** Run `stripe login` once, then `npm run stripe:listen`, and copy the `whsec_…` into `.env`.
3. **Set up webhooks for production:**
   1. Go to the Dashboard → *Developers* → *Webhooks* → **Add endpoint**.
   2. Endpoint URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
   3. Events to send:
      - `checkout.session.completed`
      - `checkout.session.async_payment_succeeded`
      - `checkout.session.async_payment_failed`
      - `checkout.session.expired`
      - `payment_intent.payment_failed`
      - `invoice.paid`
      - `invoice.payment_failed`
      - `customer.subscription.updated`
      - `customer.subscription.deleted`
   4. Copy that endpoint's **Signing secret** into the production `STRIPE_WEBHOOK_SECRET`.
4. **Branding (recommended).** Under *Settings* → *Branding*, upload the logo and set the colours to burgundy `#6B1E2E` and gold `#C9A24B`, so Stripe Checkout matches the site.
5. **Optional receipts.** Under *Settings* → *Customer emails*, you can also enable Stripe's own receipts.
6. **Going live.** Activate your Stripe account, then replace the test key and webhook secret with **live** values (`sk_live_…`). Never mix test and live keys.

### How payments work
```
Browser ──(cart items: ids, sizes, colours, quantities only)──▶ POST /api/checkout/session
Server: re-prices everything from the database, checks stock, creates a PENDING order,
        creates a Stripe Checkout Session (idempotency key = order id) ──▶ returns Stripe URL
Browser ──▶ Stripe Checkout (card details never touch our server)
Stripe ──(signed webhook)──▶ POST /api/webhooks/stripe
Server: verifies signature ▶ de-duplicates event id ▶ checks amount paid == order total
        ▶ marks order PAID ▶ decrements stock ▶ emails confirmation (exactly once)
Browser ◀── /store/order-confirmation polls the order status
```
Donations follow the same pattern through `/api/donations/session`. They are stored in a separate `donations` collection with `metadata.type = "donation"`.

---

## 6. Database setup

Choose the database with `DB_DRIVER` in `.env`.

### Option A – JSON file (default, zero setup)
`DB_DRIVER=json` stores everything in `server/data/db.json`. This is ideal for development and for small single-server hosting **with a persistent disk**. Back up that file regularly.

### Option B – Firebase / Cloud Firestore (recommended for production)
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Go to *Build* → *Firestore Database* → **Create database** (production mode). No client security rules are needed, because only the server accesses Firestore.
3. Go to *Project settings* → *Service accounts* → **Generate new private key** to download a JSON file. **Keep it secret.**
4. In `.env`:
   ```env
   DB_DRIVER=firestore
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   Alternatively, set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.
5. Start the server. Empty collections are seeded automatically.
6. Firestore may ask you to create single-field indexes the first time some lookups run. If so, follow the link in the error message.

### Collections

| Collection | Key fields |
| --- | --- |
| `products` | id, name, description, price (cents), category, image, sizes[], colors[{name,hex}], inventory, active, featured |
| `categories` | id, name, description, sortOrder |
| `orders` | id, orderNumber, customerName, customerEmail, shippingAddress, items[], subtotal, shippingCost, total, stripeSessionId, stripePaymentIntentId, paymentStatus, fulfillmentStatus, createdAt |
| `donations` | id, reference, donorName, donorEmail, amount, frequency, fund, stripeSessionId, stripePaymentIntentId, stripeSubscriptionId, subscriptionStatus, paymentStatus, anonymous, createdAt |
| `events` | id, title, description, startDate, endDate, recurrence, location, image, registrationRequired, capacity, published |
| `registrations` | eventId, name, email, attendees |
| `users` | email, name, role (`admin` or `editor`), passwordHash, active, status (`pending` / `active`), note, requestedAt, approvedAt |
| `messages`, `subscribers` | contact form messages and newsletter sign-ups |
| `webhookEvents` | processed Stripe event ids (duplicate protection) |

All money values are stored as **integer cents**. **No card data is ever stored.**

### Useful scripts
```bash
npm run seed                                               # seed empty collections
npm run create-admin -- you@church.org "Your Name" admin   # create or reset a staff login (prompts for password)
```

---

## 7. Customising content

| What | Where |
| --- | --- |
| Church name, tagline, email, phone, address, service times, social links | `client/src/data/site.js` |
| Mission, vision, values, beliefs, history, leadership, ministries, giving impact, nonprofit disclosure | `client/src/data/site.js` |
| Site photography (hero, ministries, leaders…) | Add files to `client/public/images/` and register them in `photos` in `site.js` (see `client/public/images/README.md`) |
| Logo | `client/src/components/ui/Logo.jsx` and `client/public/favicon.svg` (the current heart-and-cross mark is a placeholder) |
| Products, prices, images, categories (including **Bangers**) | Admin dashboard → Products / Categories |
| Events | Admin dashboard → Events |
| Shipping rates, free-shipping threshold, donation presets and funds | `server/src/config/store.js` |
| Colours and fonts | CSS variables at the top of `client/src/styles/global.css` |
| Privacy and Terms text | `client/src/pages/Legal.jsx` (have these reviewed) |

Everything marked **"Editable placeholder"** on the site should be confirmed by the ministry before launch.

---

## 8. Email setup

The site sends order confirmations, shipping updates, donation receipts, event registration confirmations, and new-order and contact notifications to staff.

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` and `ORG_NOTIFY_EMAIL` in `.env`. Any SMTP service works (Google Workspace, Microsoft 365, SendGrid, Mailgun, Postmark, Brevo…).

If `SMTP_HOST` is empty, emails are **logged to the console** instead of sent, which is handy in development. A failed email never blocks a payment from being recorded.

---

## 9. Testing

### Automated API tests
```bash
npm test
```
There are 42 tests, which run offline against a temporary database. They cover:
- catalogue filtering and search
- server-side pricing (client prices are ignored) and invalid sizes, colours and stock
- checkout validation and Stripe session parameters
- **webhook signature verification** and **duplicate-event protection**
- order and donation records created only after verified payment
- amount-mismatch flagging, failed and expired payments, card-decline logging
- one-time and **monthly** donations, renewals and cancellations
- admin authentication, roles, product/category/event management, image upload validation
- contact and newsletter validation, honeypot, security headers

The tests use a small stand-in for Stripe's network API so they can run without internet access. Signature verification uses the real Stripe library.

### Manual end-to-end checklist (with your Stripe test keys)
1. Browse the store: filter by category, search, add sizes and colours, change quantities, remove items, and refresh the page (the cart persists).
2. Check out with `4242 4242 4242 4242`. The confirmation page should show **Thank you for your order**, the order should appear in Admin → Orders, and stock should go down.
3. Check out with `4000 0000 0000 0002`. Stripe shows a decline, and you can retry or cancel back to the cart.
4. Make a $25 one-time gift and a $10 monthly gift. Both should appear in Admin → Donations, and the monthly gift should show *Subscription: Active*.
5. In Admin, mark the order **Shipped** with a tracking number. The customer should be emailed (or the email logged to the console).
6. Check the layout on a phone, and use the hamburger menu.

---

## 10. Production build & deployment

### Build and run on one server (simplest)
```bash
npm run install:all
npm run build                     # builds client/dist
NODE_ENV=production npm start     # Express serves the API AND the website
```
In production the Express server serves `client/dist` and handles all routes, so you only deploy one Node app.

**Required production environment variables:**
- `NODE_ENV=production`
- `CLIENT_URL=https://your-domain.org`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- the database variables, SMTP variables, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` (for the first run)

### Vercel (current live site)
The repository is ready for Vercel. `vercel.json` builds the React site into `client/dist`, sends every `/api/*` request to the Express app through `api/index.js` (a serverless function), and applies the same security headers the Express server uses.

Vercel functions have no permanent disk, so on Vercel:
- **Database:** `DB_DRIVER=firestore`, with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` taken from a Firebase service-account key.
- **Product images:** uploaded to **Vercel Blob**. Create a Blob store (Storage tab, or `vercel blob create-store <name> --access public`) and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`, and the upload code then uses Blob automatically.

Other environment variables (Project → Settings → Environment Variables, or `vercel env add NAME production`):
- `CLIENT_URL` (the site's https address)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from the Dashboard webhook endpoint, not from `stripe listen`), `STRIPE_CURRENCY`
- `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- optional `SMTP_*`, `EMAIL_FROM`, `ORG_NOTIFY_EMAIL`

Deploy with `vercel deploy --prod`, or connect the GitHub repository so that every push to `main` deploys. **Redeploy after changing environment variables**, because running deployments keep the old values.

### Hosting options
- **Render / Railway / Fly.io / a VPS (DigitalOcean, Lightsail):**
  - Build command: `npm run install:all && npm run build`
  - Start command: `npm start`
  - Add the environment variables in the host's dashboard.
  - If you use the JSON database, attach a **persistent disk** and point `JSON_DB_PATH` and `UPLOAD_DIR` at it. Otherwise use Firestore.
- **Separate frontend and API (e.g. Netlify/Vercel + Render):**
  - Deploy `client/` as a static site with `VITE_API_URL=https://api.your-domain.org`.
  - Set `CORS_ORIGINS=https://www.your-domain.org` on the API.
  - Add an SPA fallback rewrite (`/* → /index.html`).
  - Note that the admin cookie is `SameSite=Strict`, so the site and the API should share the same registrable domain (for example `www.` and `api.` of the same domain).

### After deploying
1. Add the production Stripe webhook endpoint (see section 5).
2. Sign in at `/admin`. Then create a personal admin account and disable the bootstrap one (or reset it with `npm run create-admin`).
3. Replace placeholder content, products and photos.
4. Point your domain at the host and make sure HTTPS is enabled. Secure cookies require HTTPS in production.

---

## 11. Security notes
- **Prices are never trusted from the browser.** Every quote and checkout is re-priced from the database. Stock, sizes and colours are validated.
- **Stripe webhooks are signature-verified.** Events are de-duplicated by id, and every handler is idempotent (stock is decremented and emails are sent exactly once). Paid amounts are compared with order totals, and mismatches are flagged `review_required`.
- **No card data is stored.** Card entry happens only on Stripe-hosted pages.
- **Secrets stay server-side** (`.env` is git-ignored). Only `VITE_` variables reach the browser, and none are secret.
- **Admin access:** bcrypt-hashed passwords, a short-lived JWT in an httpOnly + SameSite=Strict (+ Secure in production) cookie, the user re-checked on every request, role checks on every admin route, rate-limited login, and timing-safe failure responses.
- **Inputs** are validated with zod; HTML and control characters are stripped; JSON body size is limited; uploads must be real JPG/PNG/WebP/AVIF images of 5 MB or less, stored under random names.
- **Abuse protection:** helmet security headers and a Content-Security-Policy, a CORS allow-list, rate limiting on forms, payments and login, and honeypot fields on public forms.
- `npm audit` reports a moderate advisory in a sub-dependency of `firebase-admin` (`uuid`). It affects a code path this app does not use, and it clears when Google updates the package. Keep dependencies updated with `npm outdated` and `npm audit`.

---

## 12. Screenshots

Captured from the live site. Product images, photos and church details are clearly labelled placeholders until the church supplies real content.

### Public website
| Home (full page) | Ministries |
| --- | --- |
| [![Home page, full length](docs/screenshots/home.jpg)](docs/screenshots/home.jpg) | ![Ministries](docs/screenshots/ministries.jpg) |
| **Events** | **Contact** |
| ![Events with registration](docs/screenshots/events.jpg) | ![Contact form and service schedule](docs/screenshots/contact.jpg) |

### Store and giving
| Store | Product |
| --- | --- |
| ![Store with search and category filters](docs/screenshots/store.jpg) | ![Product page with colours, sizes and quantity](docs/screenshots/product.jpg) |
| **Give – one-time or monthly** | |
| ![Donation form](docs/screenshots/give.jpg) | |

### Mobile
| Home | Store | Give |
| --- | --- | --- |
| ![Mobile home](docs/screenshots/mobile-home.jpg) | ![Mobile store](docs/screenshots/mobile-store.jpg) | ![Mobile giving form](docs/screenshots/mobile-give.jpg) |

### Admin
| Staff sign-in | Products |
| --- | --- |
| ![Staff sign-in](docs/screenshots/admin-login.jpg) | ![Admin products](docs/screenshots/admin-products.jpg) |

---

## 13. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Online payments are not configured yet" | Set `STRIPE_SECRET_KEY` in `.env` and restart. |
| Order page stuck on "finalising" | The webhook isn't reaching the server. Run `npm run stripe:listen` and check that `STRIPE_WEBHOOK_SECRET` matches what it printed. |
| Webhook returns 400 "Invalid signature" | You're using the wrong `whsec_…`. The CLI and each Dashboard endpoint have different secrets. |
| "We could not reach our secure payment provider" | The Stripe key is invalid or revoked, or there's no internet connection. Check the server console. |
| Port 5173 already in use | Vite will choose another port automatically. Update `CLIENT_URL` to match it so Stripe redirects back to the right address, or stop the other app. |
| Can't sign in to admin | Run `npm run create-admin -- you@example.org "Name" admin` to create or reset an account. |
| Emails not arriving | Check the SMTP settings. Without `SMTP_HOST`, emails are only printed in the server console. |
