import { Router } from 'express';
import {
  getAllProducts,
  getFeaturedProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { verifyJWT, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:identifier', getProductBySlugOrId);

// Admin-only management routes
router.post('/', verifyJWT, requireRole('admin'), createProduct);
router.patch('/:id', verifyJWT, requireRole('admin'), updateProduct);
router.delete('/:id', verifyJWT, requireRole('admin'), deleteProduct);

export default router;
