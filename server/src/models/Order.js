import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  SKU: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  mockupStyle: {
    type: String,
    default: ''
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: true });

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Order must contain at least one item']
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    hostelOrBuilding: { type: String, required: true },
    campusName: { type: String, required: true },
    city: { type: String, required: true },
    pinCode: { type: String, required: true }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentReference: {
    type: String
  },
  razorpayOrderId: {
    type: String,
    index: true
  },
  trackingNumber: {
    type: String
  },
  cancellationReason: {
    type: String
  }
}, { timestamps: true });

// Pre-save order generator if orderNumber is missing
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `SB-${Date.now().toString().slice(-6)}-${randomSuffix}`;
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
