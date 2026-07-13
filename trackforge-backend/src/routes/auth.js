import express from 'express';
import {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  passwordResetRequest,
  passwordResetVerify,
  passwordResetComplete
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Define rate limits
const authLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many auth attempts from this IP, please try again after a minute.'
});

const passwordResetLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts, please try again later.'
});

router.post('/register', authLimiter, register);
router.post('/verify-email', verifyEmail);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);

router.post('/password-reset', passwordResetLimiter, passwordResetRequest);
router.post('/password-reset/verify', passwordResetVerify);
router.post('/password-reset/complete', passwordResetComplete);

export default router;
