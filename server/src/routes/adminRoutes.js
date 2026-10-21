import { Router } from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getCustomers,
  getInventory,
  updateStock
} from '../controllers/adminController.js';
import { verifyJWT, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce admin role for all routes under /admin
router.use(verifyJWT, requireRole('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/customers', getCustomers);
router.get('/inventory', getInventory);
router.patch('/inventory/:id/stock', updateStock);

export default router;
