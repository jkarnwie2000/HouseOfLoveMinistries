import { Router } from 'express';
import * as a from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { approveUserSchema, categorySchema, eventSchema, fulfillmentSchema, productSchema, userSchema } from '../validators/schemas.js';

const router = Router();
const staff = requireRole('admin', 'editor');
const adminOnly = requireRole('admin');

// Every admin route requires a valid session.
router.use(requireAuth);

router.get('/stats', staff, a.stats);

router.get('/products', staff, a.listProducts);
router.get('/products/:id', staff, a.getProduct);
router.post('/products', staff, validate(productSchema), a.createProduct);
router.put('/products/:id', staff, validate(productSchema), a.updateProduct);
router.delete('/products/:id', staff, a.deleteProduct);
router.post('/uploads', staff, imageUpload.single('image'), a.uploadImage);

router.get('/categories', staff, a.listCategories);
router.post('/categories', staff, validate(categorySchema), a.createCategory);
router.put('/categories/:id', staff, validate(categorySchema), a.updateCategory);
router.delete('/categories/:id', staff, a.deleteCategory);

router.get('/orders', staff, a.listOrders);
router.get('/orders/:id', staff, a.getOrder);
router.patch('/orders/:id/fulfillment', staff, validate(fulfillmentSchema), a.updateFulfillment);
router.post('/orders/:id/resend-receipt', staff, a.resendOrderReceipt);

router.get('/donations', adminOnly, a.listDonations);
router.post('/donations/:id/cancel-subscription', adminOnly, a.cancelSubscription);
router.post('/donations/:id/resend-receipt', adminOnly, a.resendDonationReceipt);

router.get('/events', staff, a.listEvents);
router.post('/events', staff, validate(eventSchema), a.createEvent);
router.put('/events/:id', staff, validate(eventSchema), a.updateEvent);
router.delete('/events/:id', staff, a.deleteEvent);
router.get('/events/:id/registrations', staff, a.listRegistrations);

router.get('/messages', staff, a.listMessages);
router.patch('/messages/:id', staff, a.markMessageRead);
router.get('/subscribers', staff, a.listSubscribers);

router.get('/users', adminOnly, a.listUsers);
router.post('/users', adminOnly, validate(userSchema), a.createUser);
router.patch('/users/:id', adminOnly, a.setUserActive);
router.post('/users/:id/approve', adminOnly, validate(approveUserSchema), a.approveUser);
router.delete('/users/:id', adminOnly, a.declineUser);

router.post('/email/test', adminOnly, a.testEmail);

export default router;
