import { Router } from 'express';
import * as c from '../controllers/publicController.js';
import * as pay from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { formLimiter, paymentLimiter } from '../middleware/rateLimits.js';
import {
  cartQuoteSchema, checkoutSchema, contactSchema, donationSchema, eventRegistrationSchema, newsletterSchema,
} from '../validators/schemas.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/config', c.getConfig);

// Store catalogue
router.get('/categories', c.listCategories);
router.get('/products', c.listProducts);
router.get('/products/:id', c.getProduct);

// Merchandise checkout
router.post('/cart/quote', validate(cartQuoteSchema), pay.quoteCart);
router.post('/checkout/session', paymentLimiter, validate(checkoutSchema), pay.createCheckoutSession);
router.get('/checkout/session/:sessionId', pay.getCheckoutSession);

// Donations (kept separate from merchandise)
router.post('/donations/session', paymentLimiter, validate(donationSchema), pay.createDonationSession);
router.get('/donations/session/:sessionId', pay.getDonationSession);

// Events
router.get('/events', c.listEvents);
router.post('/events/:id/register', formLimiter, validate(eventRegistrationSchema), c.registerForEvent);

// Forms
router.post('/contact', formLimiter, validate(contactSchema), c.submitContact);
router.post('/newsletter', formLimiter, validate(newsletterSchema), c.subscribe);

export default router;
