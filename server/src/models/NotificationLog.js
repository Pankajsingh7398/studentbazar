import mongoose, { Schema } from 'mongoose';

const notificationLogSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  orderNumber: {
    type: String,
    index: true
  },
  recipient: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  recipientType: {
    type: String,
    enum: ['admin', 'customer'],
    required: true,
    index: true
  },
  notificationType: {
    type: String,
    required: true,
    enum: [
      'order_placed_admin',
      'order_placed_customer',
      'order_confirmed',
      'order_rejected',
      'order_processing',
      'order_packed',
      'order_shipped',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled'
    ],
    index: true
  },
  provider: {
    type: String,
    default: 'whatsapp_cloud_api'
  },
  providerMessageId: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  messageBody: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['QUEUED', 'SENT', 'DELIVERED', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  attemptCount: {
    type: Number,
    default: 1
  },
  lastError: {
    type: String,
    default: null
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

export const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);
