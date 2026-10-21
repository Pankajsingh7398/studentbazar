import { Router } from 'express';
import {
  getWishlist,
  toggleWishlistItem,
  removeWishlistItem,
  syncWishlist
} from '../controllers/wishlistController.js';
import { verifyJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);
router.delete('/:productId', removeWishlistItem);
router.post('/sync', syncWishlist);

export default router;
