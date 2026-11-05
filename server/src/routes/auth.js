import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { AUTH_COOKIE, requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimits.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
// Session check: returns { user: null } (not 401) when signed out, so the login page loads cleanly.
router.get('/me', (req, res, next) => {
  if (!req.cookies?.[AUTH_COOKIE]) return res.json({ user: null });
  return requireAuth(req, res, (err) => (err ? res.json({ user: null }) : me(req, res)));
});
export default router;
