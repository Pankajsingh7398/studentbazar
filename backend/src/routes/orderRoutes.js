import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  cancelOrder
} from '../controllers/orderController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id/tracking', getOrderTracking);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

export default router;

