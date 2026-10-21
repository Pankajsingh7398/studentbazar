import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/razorpay/order', verifyJWT, createRazorpayOrder);
router.post('/razorpay/verify', verifyJWT, verifyRazorpayPayment);
router.post('/razorpay/webhook', handleRazorpayWebhook);

export default router;
