import mongoose, { Schema } from 'mongoose';

const orderStatusHistorySchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: null
  },
  newStatus: {
    type: String,
    required: true,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'rejected',
      'cancelled'
    ]
  },
  changedBy: {
    type: Schema.Types.Mixed, // ObjectId ref or 'customer' / 'system' / 'admin'
    default: 'system'
  },
  changedByName: {
    type: String,
    default: 'System Automator'
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  courierName: {
    type: String,
    trim: true,
    default: ''
  },
  trackingNumber: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

export const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
