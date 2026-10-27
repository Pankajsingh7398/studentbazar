import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  adminLogin,
  changeAdminPasskey
} from '../controllers/authController.js';
import { verifyJWT, requireRole } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', verifyJWT, getCurrentUser);
router.patch('/profile', verifyJWT, updateProfile);
router.post('/change-password', verifyJWT, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);

// Dedicated Admin Passkey Routes
router.post('/admin/login', authLimiter, adminLogin);
router.post('/admin/change-passkey', verifyJWT, requireRole('admin'), changeAdminPasskey);

export default router;

