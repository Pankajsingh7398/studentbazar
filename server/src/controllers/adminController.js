import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalCustomers,
    productsCount,
    salesAgg,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
    Product.find({ isActive: true, stock: { $lte: 20 } }).select('name SKU stock price categorySlug')
  ]);

  const totalSales = salesAgg.length > 0 ? salesAgg[0].totalRevenue : 0;

  return res.status(200).json(
    new ApiResponse(200, 'Dashboard statistics fetched.', {
      overview: {
        totalSales,
        totalOrders,
        pendingOrders,
        deliveredOrders,
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
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (status && status !== 'all') {
    filter.orderStatus = status;
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

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, trackingNumber } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid order status. Must be one of [${validStatuses.join(', ')}]`);
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (status) order.orderStatus = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;

  await order.save();

  return res.status(200).json(
    new ApiResponse(200, 'Order status updated successfully.', { order })
  );
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
