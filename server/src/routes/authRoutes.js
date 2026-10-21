import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword
} from '../controllers/authController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', verifyJWT, getCurrentUser);
router.patch('/profile', verifyJWT, updateProfile);
router.post('/change-password', verifyJWT, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);

export default router;
