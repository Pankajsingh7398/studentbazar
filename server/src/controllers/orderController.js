import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const FREE_SHIPPING_THRESHOLD = Number(process.env.CAMPUS_FREE_SHIPPING_THRESHOLD) || 200;
const STANDARD_SHIPPING_FEE = Number(process.env.STANDARD_SHIPPING_FEE) || 20;
const MAX_COD_AMOUNT = Number(process.env.MAX_COD_AMOUNT) || 1500;

export const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod = 'cod',
    items: explicitItems,
    couponCode
  } = req.body;

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.hostelOrBuilding) {
    throw new ApiError(400, 'Complete campus shipping address is required.');
  }

  // Retrieve cart items: from explicit request payload or user's stored cart
  let orderItemsRaw = explicitItems;
  if (!orderItemsRaw || !Array.isArray(orderItemsRaw) || orderItemsRaw.length === 0) {
    const userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart || userCart.items.length === 0) {
      throw new ApiError(400, 'Your shopping cart is empty.');
    }
    orderItemsRaw = userCart.items.map(i => ({
      productId: i.product,
      quantity: i.quantity
    }));
  }

  // Validate real-time products, prices, and stock
  let subtotal = 0;
  const validatedOrderItems = [];
  const stockDeductionPlan = [];

  for (const item of orderItemsRaw) {
    const pId = item.productId || item.product;
    const product = await Product.findById(pId);
    if (!product || !product.isActive) {
      throw new ApiError(400, `A requested product is no longer available.`);
    }

    const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (product.stock < requestedQty) {
      throw new ApiError(400, `Insufficient stock for "${product.name}". Only ${product.stock} available.`);
    }

    const lineTotal = product.price * requestedQty;
    subtotal += lineTotal;

    validatedOrderItems.push({
      product: product._id,
      name: product.name,
      SKU: product.SKU,
      price: product.price,
      quantity: requestedQty,
      mockupStyle: product.mockupStyle,
      subtotal: lineTotal
    });

    stockDeductionPlan.push({ product, quantity: requestedQty });
  }

  // Shipping fee calculation
  let shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

  // Discount calculation (Coupon or automatic student discount)
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (coupon) {
      if (subtotal >= coupon.minimumOrderValue) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maximumDiscount) discount = Math.min(discount, coupon.maximumDiscount);
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        await coupon.save();
      }
    }
  } else if (subtotal > 100) {
    // Default student subsidy of ₹25
    discount = 25;
  }

  const total = Math.max(0, subtotal + shippingFee - discount);

  // COD validations
  if (paymentMethod === 'cod' && total > MAX_COD_AMOUNT) {
    throw new ApiError(400, `Cash on Delivery is limited to orders up to ₹${MAX_COD_AMOUNT}. Please choose online payment.`);
  }

  // Deduct stock safely
  for (const plan of stockDeductionPlan) {
    plan.product.stock -= plan.quantity;
    await plan.product.save();
  }

  // Create immutable order
  const order = new Order({
    user: req.user._id,
    items: validatedOrderItems,
    shippingAddress,
    subtotal,
    discount,
    shippingFee,
    total,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    trackingNumber: `CAMPUS-${Date.now().toString().slice(-4)}`
  });

  await order.save();

  // Clear user cart in database
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  return res.status(201).json(
    new ApiResponse(201, 'Order placed successfully! Campus dispatch initiated.', { order })
  );
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, 'Orders retrieved.', { orders }));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  return res.status(200).json(new ApiResponse(200, 'Order details fetched.', { order }));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by student' } = req.body;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
    throw new ApiError(400, `Cannot cancel order with status "${order.orderStatus}".`);
  }

  // Restore inventory
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  order.orderStatus = 'cancelled';
  order.cancellationReason = reason;
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
  }
  await order.save();

  return res.status(200).json(new ApiResponse(200, 'Order cancelled and stock restored.', { order }));
});
