import express from 'express';

import { userController } from '../controllers/index.js';
import authenticate from '../middlewares/authentication.middleware.js';
const router = express.Router();

router.get('/profile', authenticate, userController.profile);

export default router;
