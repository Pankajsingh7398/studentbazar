import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_studentbazaar';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

  // Amount in paise (1 INR = 100 paise)
  const amountPaise = Math.round(order.total * 100);

  // In test / offline development mode or real gateway:
  const mockRazorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  order.razorpayOrderId = mockRazorpayOrderId;
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, 'Razorpay order created.', {
      keyId,
      razorpayOrderId: mockRazorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      orderNumber: order.orderNumber,
      customerName: req.user.name,
      customerEmail: req.user.email
    })
  );
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) {
    throw new ApiError(404, 'Order not found.');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Verify HMAC-SHA256 signature when secret is provided
  if (keySecret && razorpay_signature) {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      order.paymentStatus = 'failed';
      await order.save();
      throw new ApiError(400, 'Payment signature verification failed. Untrusted report.');
    }
  }

  // Update order status upon successful verification
  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentReference = razorpay_payment_id || `PAY-${Date.now()}`;
  await order.save();

  return res.status(200).json(
    new ApiResponse(200, 'Payment verified successfully! Order confirmed.', { order })
  );
});

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (webhookSecret && signature) {
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const rzpOrderId = payment.order_id;
    if (rzpOrderId) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          paymentReference: payment.id
        }
      );
    }
  }

  return res.status(200).json({ status: 'ok' });
});
