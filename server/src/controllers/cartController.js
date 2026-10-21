import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const FREE_SHIPPING_THRESHOLD = Number(process.env.CAMPUS_FREE_SHIPPING_THRESHOLD) || 200;
const STANDARD_SHIPPING_FEE = Number(process.env.STANDARD_SHIPPING_FEE) || 20;
const STUDENT_DISCOUNT_THRESHOLD = 100;
const STUDENT_DISCOUNT_AMOUNT = 25;

export const computeTotals = async (cartItems) => {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of cartItems) {
    const product = item.product || await Product.findById(item.productId);
    if (!product || !product.isActive) continue;

    const qty = Math.max(1, Math.min(item.quantity, product.stock));
    const lineTotal = product.price * qty;
    subtotal += lineTotal;

    validatedItems.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      SKU: product.SKU,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      mockupStyle: product.mockupStyle,
      stock: product.stock,
      quantity: qty,
      lineTotal
    });
  }

  let shippingFee = 0;
  if (subtotal === 0) {
    shippingFee = 0;
  } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingFee = 0;
  } else {
    shippingFee = STANDARD_SHIPPING_FEE;
  }

  const discount = subtotal > STUDENT_DISCOUNT_THRESHOLD ? STUDENT_DISCOUNT_AMOUNT : 0;
  const total = subtotal === 0 ? 0 : Math.max(0, subtotal + shippingFee - discount);

  return {
    items: validatedItems,
    itemCount: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
    subtotal,
    shippingFee,
    discount,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingEligible: subtotal >= FREE_SHIPPING_THRESHOLD
  };
};

export const getCart = asyncHandler(async (req, res) => {
  let userCart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!userCart) {
    userCart = await Cart.create({ user: req.user._id, items: [] });
  }

  const computed = await computeTotals(userCart.items);
  return res.status(200).json(new ApiResponse(200, 'User cart retrieved.', computed));
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new ApiError(400, 'Product ID is required.');
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found or inactive.');
  }

  let userCart = await Cart.findOne({ user: req.user._id });
  if (!userCart) {
    userCart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItemIndex = userCart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    userCart.items[existingItemIndex].quantity += Number(quantity);
  } else {
    userCart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await userCart.save();
  await userCart.populate('items.product');
  const computed = await computeTotals(userCart.items);

  return res.status(200).json(new ApiResponse(200, 'Item added to cart.', computed));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined) {
    throw new ApiError(400, 'Quantity is required.');
  }

  const userCart = await Cart.findOne({ user: req.user._id });
  if (!userCart) {
    throw new ApiError(404, 'Cart not found.');
  }

  const qty = parseInt(quantity, 10);
  if (qty <= 0) {
    userCart.items = userCart.items.filter(i => i.product.toString() !== productId);
  } else {
    const item = userCart.items.find(i => i.product.toString() === productId);
    if (item) {
      item.quantity = qty;
    }
  }

  await userCart.save();
  await userCart.populate('items.product');
  const computed = await computeTotals(userCart.items);

  return res.status(200).json(new ApiResponse(200, 'Cart item updated.', computed));
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const userCart = await Cart.findOne({ user: req.user._id });
  if (userCart) {
    userCart.items = userCart.items.filter(i => i.product.toString() !== productId);
    await userCart.save();
    await userCart.populate('items.product');
    const computed = await computeTotals(userCart.items);
    return res.status(200).json(new ApiResponse(200, 'Item removed from cart.', computed));
  }

  return res.status(200).json(new ApiResponse(200, 'Item removed.', { items: [], total: 0 }));
});

export const syncCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;

  let userCart = await Cart.findOne({ user: req.user._id });
  if (!userCart) {
    userCart = new Cart({ user: req.user._id, items: [] });
  }

  // Merge items from guest local cart
  for (const guestItem of items) {
    const existing = userCart.items.find(
      i => i.product.toString() === guestItem.productId
    );
    if (existing) {
      existing.quantity = Math.max(existing.quantity, guestItem.quantity);
    } else if (guestItem.productId) {
      userCart.items.push({
        product: guestItem.productId,
        quantity: guestItem.quantity || 1
      });
    }
  }

  await userCart.save();
  await userCart.populate('items.product');
  const computed = await computeTotals(userCart.items);

  return res.status(200).json(new ApiResponse(200, 'Cart synchronized with server.', computed));
});

export const calculateGuestCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  const computed = await computeTotals(items);
  return res.status(200).json(new ApiResponse(200, 'Cart calculated.', computed));
});
