import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  syncCart,
  calculateGuestCart
} from '../controllers/cartController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Guest cart calculation (public, recalculates authoritative totals for guest cart)
router.post('/calculate', calculateGuestCart);

// Authenticated cart routes
router.get('/', verifyJWT, getCart);
router.post('/items', verifyJWT, addItem);
router.patch('/items/:productId', verifyJWT, updateItem);
router.delete('/items/:productId', verifyJWT, removeItem);
router.post('/sync', verifyJWT, syncCart);

export default router;
