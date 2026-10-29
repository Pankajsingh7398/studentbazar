import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { verifyJWT, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getCategories);
router.post('/', verifyJWT, requireRole('admin'), createCategory);

export default router;
