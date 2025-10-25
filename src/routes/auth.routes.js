import express from 'express';
import rateLimit from 'express-rate-limit';

import { authController } from '../controllers/index.js';
import authenticate from '../middlewares/authentication.middleware.js';
import validateRequest from '../middlewares/request.validate.middleware.js';
import authSchemas from '../validations/auth.validation.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  legacyHeaders: false,
  standardHeaders: true,
  message: { message: 'Too many login attempts, Please try again later' },
});

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  legacyHeaders: false,
  standardHeaders: true,
  message: { message: 'Too many refresh attempts, Slow down' },
});

router.post(
  '/register',
  validateRequest(authSchemas.registerSchema),
  authController.register,
);

router.post(
  '/login',
  loginLimiter,
  validateRequest(authSchemas.loginSchema),
  authController.login,
);

router.post('/refresh', refreshLimiter, authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
