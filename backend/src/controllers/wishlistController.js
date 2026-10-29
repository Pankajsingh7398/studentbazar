import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    match: { isActive: true },
    select: 'name slug price compareAtPrice mockupStyle badge badgeColor shortDescription stock'
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Wishlist fetched successfully.', { wishlist: wishlist.products }));
});

export const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    throw new ApiError(400, 'Product ID is required.');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found.');
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const index = wishlist.products.findIndex(id => id.toString() === productId);
  let isSaved = false;

  if (index > -1) {
    wishlist.products.splice(index, 1);
    isSaved = false;
  } else {
    wishlist.products.push(productId);
    isSaved = true;
  }

  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    select: 'name slug price compareAtPrice mockupStyle badge badgeColor shortDescription stock'
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      isSaved ? 'Item saved to wishlist.' : 'Item removed from wishlist.',
      { isSaved, wishlist: wishlist.products }
    )
  );
});

export const removeWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    await wishlist.populate({
      path: 'products',
      select: 'name slug price compareAtPrice mockupStyle badge badgeColor shortDescription stock'
    });
    return res.status(200).json(new ApiResponse(200, 'Item removed from wishlist.', { wishlist: wishlist.products }));
  }

  return res.status(200).json(new ApiResponse(200, 'Wishlist empty.', { wishlist: [] }));
});

export const syncWishlist = asyncHandler(async (req, res) => {
  const { productIds = [] } = req.body;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  // Merge guest product IDs without duplicates
  for (const id of productIds) {
    if (!wishlist.products.some(p => p.toString() === id)) {
      wishlist.products.push(id);
    }
  }

  await wishlist.save();
  await wishlist.populate({
    path: 'products',
    select: 'name slug price compareAtPrice mockupStyle badge badgeColor shortDescription stock'
  });

  return res.status(200).json(new ApiResponse(200, 'Wishlist synchronized.', { wishlist: wishlist.products }));
});
