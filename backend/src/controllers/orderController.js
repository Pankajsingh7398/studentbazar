import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { whatsappService } from '../services/whatsappService.js';
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
    couponCode,
    whatsappNumber,
    whatsappOptIn
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
    const candidateId = item.productId || item.product || item.id || item._id;
    let product = null;

    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      product = await Product.findById(candidateId);
    }
    if (!product && candidateId) {
      product = await Product.findOne({
        $or: [
          { slug: candidateId },
          { SKU: candidateId },
          { name: item.name ? new RegExp('^' + item.name.trim() + '$', 'i') : '' }
        ]
      });
    }
    if (!product && item.name) {
      product = await Product.findOne({ name: new RegExp(item.name.trim(), 'i') });
    }

    if (!product || !product.isActive) {
      throw new ApiError(400, `A requested product ("${item.name || candidateId}") is no longer available.`);
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

  const effectiveWhatsapp = (whatsappNumber || shippingAddress.phone || req.user.phone || '').trim();
  const effectiveWhatsappOptIn = whatsappOptIn !== undefined ? Boolean(whatsappOptIn) : true;

  // Create order with initial 'pending' (Awaiting Confirmation) state
  const order = new Order({
    user: req.user._id,
    customerSnapshot: {
      name: req.user.name || shippingAddress.fullName,
      email: req.user.email,
      phone: req.user.phone || shippingAddress.phone
    },
    whatsappNumber: effectiveWhatsapp,
    whatsappOptIn: effectiveWhatsappOptIn,
    items: validatedOrderItems,
    shippingAddress,
    subtotal,
    discount,
    shippingFee,
    total,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending', // Pending Confirmation
    trackingNumber: `CAMPUS-${Date.now().toString().slice(-4)}`
  });

  await order.save();

  // Record initial order status transition in audit log
  await OrderStatusHistory.create({
    order: order._id,
    orderNumber: order.orderNumber,
    previousStatus: null,
    newStatus: 'pending',
    changedBy: req.user._id,
    changedByName: req.user.name || 'Customer',
    note: 'Order placed by customer (Awaiting admin review & confirmation)'
  });

  // Clear user cart in database
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  // Trigger Asynchronous WhatsApp notifications without delaying checkout response
  setImmediate(async () => {
    try {
      await Promise.allSettled([
        whatsappService.notifyAdminNewOrder(order),
        whatsappService.notifyCustomerOrderPlaced(order)
      ]);
    } catch (notifyErr) {
      console.error('[WhatsApp Order Creation Notify Error]:', notifyErr);
    }
  });

  return res.status(201).json(
    new ApiResponse(201, 'Order placed successfully! Awaiting store confirmation.', { order })
  );
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, 'Orders retrieved.', { orders }));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: id } : { orderNumber: id };

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  // Authorize: customer must own the order or be an admin
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden. You do not have permission to view this order.');
  }

  return res.status(200).json(new ApiResponse(200, 'Order details fetched.', { order }));
});

/**
 * Real-time Customer Order Tracking
 * Returns order state, timeline progression, active timestamps, and history
 */
export const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: id } : { orderNumber: id };

  const order = await Order.findOne(query).populate('user', 'name email phone');
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden. You can only track your own orders.');
  }

  const history = await OrderStatusHistory.find({ order: order._id }).sort({ createdAt: 1 });

  // Standard ordered steps
  const standardSteps = [
    { key: 'pending', label: 'Order Placed', timestamp: order.createdAt },
    { key: 'confirmed', label: 'Order Confirmed', timestamp: order.confirmedAt },
    { key: 'processing', label: 'Processing', timestamp: order.processedAt },
    { key: 'packed', label: 'Packed', timestamp: order.packedAt },
    { key: 'shipped', label: 'Shipped', timestamp: order.shippedAt },
    { key: 'out_for_delivery', label: 'Out for Delivery', timestamp: order.outForDeliveryAt },
    { key: 'delivered', label: 'Delivered', timestamp: order.deliveredAt }
  ];

  const currentStatus = order.orderStatus;
  const isTerminalNegative = ['rejected', 'cancelled'].includes(currentStatus);

  const stepKeys = standardSteps.map(s => s.key);
  const currentIndex = stepKeys.indexOf(currentStatus);

  const timeline = standardSteps.map((step, idx) => {
    let state = 'upcoming';
    if (!isTerminalNegative) {
      if (idx < currentIndex) state = 'completed';
      else if (idx === currentIndex) state = 'current';
    } else {
      // If cancelled/rejected after some steps
      if (step.timestamp && step.timestamp <= (order.cancelledAt || order.rejectedAt || new Date())) {
        state = 'completed';
      }
    }

    return {
      ...step,
      state
    };
  });

  return res.status(200).json(
    new ApiResponse(200, 'Tracking details retrieved successfully.', {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        items: order.items,
        shippingAddress: order.shippingAddress,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery,
        rejectionReason: order.rejectionReason,
        cancellationReason: order.cancellationReason,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        processedAt: order.processedAt,
        packedAt: order.packedAt,
        shippedAt: order.shippedAt,
        outForDeliveryAt: order.outForDeliveryAt,
        deliveredAt: order.deliveredAt
      },
      timeline,
      isCancelledOrRejected: isTerminalNegative,
      negativeState: isTerminalNegative ? {
        status: currentStatus,
        reason: order.rejectionReason || order.cancellationReason || 'Order terminated.',
        timestamp: order.rejectedAt || order.cancelledAt
      } : null,
      history
    })
  );
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by student' } = req.body;

  const order = await Order.findOne({ _id: id, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'].includes(order.orderStatus)) {
    throw new ApiError(400, `Cannot cancel order with status "${order.orderStatus}".`);
  }

  const previousStatus = order.orderStatus;

  // Restore inventory
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  order.orderStatus = 'cancelled';
  order.cancellationReason = reason;
  order.cancelledAt = new Date();
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
  }
  await order.save();

  // Record history
  await OrderStatusHistory.create({
    order: order._id,
    orderNumber: order.orderNumber,
    previousStatus,
    newStatus: 'cancelled',
    changedBy: req.user._id,
    changedByName: req.user.name || 'Customer',
    note: `Order cancelled by customer: ${reason}`
  });

  // Notify customer via WhatsApp
  setImmediate(async () => {
    try {
      await whatsappService.notifyCustomerStatusUpdate(order, 'cancelled', { reason });
    } catch (err) {
      console.error('[WhatsApp Customer Cancel Notify Error]:', err);
    }
  });

  return res.status(200).json(new ApiResponse(200, 'Order cancelled and stock restored.', { order }));
});

