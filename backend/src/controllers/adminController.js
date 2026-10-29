import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { OrderStatusHistory } from '../models/OrderStatusHistory.js';
import { NotificationLog } from '../models/NotificationLog.js';
import { whatsappService } from '../services/whatsappService.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Strict server-side order lifecycle transition rules
const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: []
};

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    packedOrders,
    shippedOrders,
    outForDeliveryOrders,
    deliveredOrders,
    cancelledOrders,
    rejectedOrders,
    pendingPaymentsCount,
    totalCustomers,
    productsCount,
    salesAgg,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'confirmed' }),
    Order.countDocuments({ orderStatus: 'processing' }),
    Order.countDocuments({ orderStatus: 'packed' }),
    Order.countDocuments({ orderStatus: 'shipped' }),
    Order.countDocuments({ orderStatus: 'out_for_delivery' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    Order.countDocuments({ orderStatus: 'rejected' }),
    Order.countDocuments({ paymentStatus: 'pending', orderStatus: { $nin: ['cancelled', 'rejected'] } }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { orderStatus: { $nin: ['cancelled', 'rejected'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email phone'),
    Product.find({ isActive: true, stock: { $lte: 20 } }).select('name SKU stock price categorySlug')
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].totalRevenue : 0;

  return res.status(200).json(
    new ApiResponse(200, 'Comprehensive dashboard statistics fetched.', {
      overview: {
        totalSales,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        packedOrders,
        shippedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
        rejectedOrders,
        pendingPaymentsCount,
        totalCustomers,
        productsCount,
        lowStockCount: lowStockProducts.length
      },
      recentOrders,
      lowStockProducts
    })
  );
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (status && status !== 'all') {
    filter.orderStatus = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { 'customerSnapshot.name': { $regex: s, $options: 'i' } },
      { 'customerSnapshot.phone': { $regex: s, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: s, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: s, $options: 'i' } },
      { trackingNumber: { $regex: s, $options: 'i' } }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter)
  ]);

  return res.status(200).json(
    new ApiResponse(200, 'Orders list retrieved.', {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  );
});

export const getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate('user', 'name email phone');
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const [history, notificationLogs] = await Promise.all([
    OrderStatusHistory.find({ order: order._id }).sort({ createdAt: 1 }),
    NotificationLog.find({ order: order._id }).sort({ createdAt: -1 })
  ]);

  const allowedNextStatuses = ALLOWED_TRANSITIONS[order.orderStatus] || [];

  return res.status(200).json(
    new ApiResponse(200, 'Order details fetched with logs.', {
      order,
      history,
      notificationLogs,
      allowedNextStatuses
    })
  );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    paymentStatus,
    courierName,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    rejectionReason,
    cancellationReason,
    note
  } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const currentStatus = order.orderStatus;

  // Validate status transition if status is being updated
  if (status && status !== currentStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(
        400,
        `Illegal status transition. Cannot move order from "${currentStatus}" to "${status}". Allowed transitions: [${allowed.join(', ') || 'None (Terminal state)'}]`
      );
    }

    // Required details validation based on target status
    if (status === 'shipped') {
      if (!courierName && !order.courierName) {
        throw new ApiError(400, 'Courier name is required when marking an order as shipped.');
      }
      if (!trackingNumber && !order.trackingNumber) {
        throw new ApiError(400, 'Tracking number is required when marking an order as shipped.');
      }
    }

    if (status === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new ApiError(400, 'A clear rejection reason is required to reject an order.');
      }
    }

    // Restore stock if transitioning to rejected or cancelled
    if (['rejected', 'cancelled'].includes(status) && !['rejected', 'cancelled'].includes(currentStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Set stage-specific timestamps
    const now = new Date();
    if (status === 'confirmed') order.confirmedAt = now;
    if (status === 'processing') order.processedAt = now;
    if (status === 'packed') order.packedAt = now;
    if (status === 'shipped') order.shippedAt = now;
    if (status === 'out_for_delivery') order.outForDeliveryAt = now;
    if (status === 'delivered') {
      order.deliveredAt = now;
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }
    if (status === 'rejected') {
      order.rejectedAt = now;
      order.rejectionReason = rejectionReason.trim();
    }
    if (status === 'cancelled') {
      order.cancelledAt = now;
      order.cancellationReason = (cancellationReason || note || 'Cancelled by admin').trim();
    }

    order.orderStatus = status;

    // Record audit trail
    await OrderStatusHistory.create({
      order: order._id,
      orderNumber: order.orderNumber,
      previousStatus: currentStatus,
      newStatus: status,
      changedBy: req.user._id,
      changedByName: req.user.name || 'Store Administrator',
      note: note || rejectionReason || cancellationReason || `Order status updated to ${status}`,
      courierName: courierName || order.courierName,
      trackingNumber: trackingNumber || order.trackingNumber
    });
  }

  // Update tracking details if provided
  if (courierName) order.courierName = courierName.trim();
  if (trackingNumber) order.trackingNumber = trackingNumber.trim();
  if (trackingUrl) order.trackingUrl = trackingUrl.trim();
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  // Update payment status if explicitly requested with verification rule
  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    if (paymentStatus === 'paid' && order.orderStatus !== 'delivered' && order.paymentMethod === 'cod') {
      // Prompt requirement: Do not allow the admin to mark an order as paid without appropriate verification
      throw new ApiError(400, 'Cash on Delivery orders can only be verified as paid once delivered to the customer.');
    }
    order.paymentStatus = paymentStatus;
  }

  await order.save();

  // Asynchronously dispatch WhatsApp stage notification to the customer
  if (status && status !== currentStatus) {
    setImmediate(async () => {
      try {
        await whatsappService.notifyCustomerStatusUpdate(order, status, {
          courierName: order.courierName,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          reason: order.rejectionReason || order.cancellationReason
        });
      } catch (err) {
        console.error('[WhatsApp Status Update Notify Error]:', err);
      }
    });
  }

  return res.status(200).json(
    new ApiResponse(200, `Order ${order.orderNumber} successfully updated to "${order.orderStatus}".`, { order })
  );
});

export const getOrderNotificationLogs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const logs = await NotificationLog.find({ order: id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, 'Order notification logs retrieved.', { logs }));
});


export const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find({ role: 'customer' })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments({ role: 'customer' })
  ]);

  return res.status(200).json(
    new ApiResponse(200, 'Customers list retrieved.', {
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  );
});

export const getInventory = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .select('name SKU price stock categorySlug featured badge')
    .sort({ stock: 1 });

  return res.status(200).json(
    new ApiResponse(200, 'Inventory list fetched.', { inventory: products })
  );
});

export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || isNaN(stock) || stock < 0) {
    throw new ApiError(400, 'Valid non-negative stock count is required.');
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { stock: Number(stock) } },
    { new: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }

  return res.status(200).json(
    new ApiResponse(200, `Stock updated for ${product.name} to ${product.stock} units.`, { product })
  );
});
