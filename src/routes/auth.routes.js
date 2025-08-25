import express from 'express';
import rateLimit from 'express-rate-limit';

import { authController } from '../controllers/index.js';
import authenticate from '../middlewares/authentication.middleware.js';
import validateRequest from '../middlewares/request.validate.middleware.js';
import authValidation from '../validations/auth.validation.js';

const router = express.Router();

const loginLimiter = rateLimit({
  legacyHeaders: false,
  max: 10 /** Max 10 attempt within a window of time */,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

const refreshLimiter = rateLimit({
  legacyHeaders: false,
  max: 30 /** refresh can be more frequent but still bounded */,

  message: { message: 'Too many refresh attempts. Slow down.' },

  standardHeaders: true,
  windowMs: 5 * 60 * 1000,
});

router.post(
  '/register',
  validateRequest(authValidation.registerSchema),
  authController.register,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(authValidation.loginSchema),
  authController.login,
);

router.post('/refresh', refreshLimiter, authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
