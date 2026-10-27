import { NotificationLog } from '../models/NotificationLog.js';

/**
 * Normalizes phone number into international E.164 format without '+' or spaces
 * Defaulting to Indian standard (country code 91) if 10 digits provided
 */
export function formatPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Sends a WhatsApp message via Meta Cloud API or durably logs it in simulation mode
 */
export async function sendWhatsAppMessage({
  order,
  recipient,
  recipientType,
  notificationType,
  messageBody,
  idempotencyKey
}) {
  const formattedPhone = formatPhoneNumber(recipient);
  if (!formattedPhone) {
    console.warn(`[WhatsApp Service] Invalid recipient phone number: ${recipient}`);
    return null;
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isConfigured = Boolean(token && phoneNumberId);

  // Check idempotency to avoid duplicates
  if (idempotencyKey) {
    const existing = await NotificationLog.findOne({ idempotencyKey, status: { $in: ['SENT', 'DELIVERED'] } });
    if (existing) {
      console.log(`[WhatsApp Service] Skipping duplicate notification: ${idempotencyKey}`);
      return existing;
    }
  }

  // Create durable notification log entry
  const logEntry = new NotificationLog({
    order: order?._id || order?.id,
    orderNumber: order?.orderNumber || 'N/A',
    recipient: formattedPhone,
    recipientType,
    notificationType,
    messageBody,
    idempotencyKey,
    status: 'QUEUED',
    attemptCount: 1
  });

  await logEntry.save();

  // If live credentials are not set, run in safe simulation mode for development
  if (!isConfigured) {
    console.log(`\n============================================================`);
    console.log(`📱 [WhatsApp Notification Simulation]`);
    console.log(`Recipient: +${formattedPhone} (${recipientType.toUpperCase()})`);
    console.log(`Type: ${notificationType}`);
    console.log(`------------------------------------------------------------`);
    console.log(messageBody);
    console.log(`============================================================\n`);

    logEntry.status = 'SENT';
    logEntry.sentAt = new Date();
    logEntry.providerMessageId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    logEntry.metadata = { note: 'Development simulated delivery (Add Meta Cloud API keys to activate live messages)' };
    await logEntry.save();
    return logEntry;
  }

  // Live Meta Cloud API HTTP Request
  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageBody
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || `WhatsApp API responded with status ${response.status}`);
    }

    const messageId = result.messages?.[0]?.id;
    logEntry.status = 'SENT';
    logEntry.sentAt = new Date();
    logEntry.providerMessageId = messageId;
    logEntry.metadata = result;
    await logEntry.save();

    console.log(`[WhatsApp Service] Message dispatched to +${formattedPhone} (ID: ${messageId})`);
    return logEntry;
  } catch (error) {
    console.error(`[WhatsApp Service Error] Failed to send message to +${formattedPhone}:`, error.message);
    logEntry.status = 'FAILED';
    logEntry.lastError = error.message;
    await logEntry.save();
    return logEntry;
  }
}

/**
 * 1. Admin Order Notification
 */
export async function notifyAdminNewOrder(order) {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '918429172879';
  const customerName = order.shippingAddress?.fullName || order.customerSnapshot?.name || 'Scholar Customer';
  const customerPhone = order.shippingAddress?.phone || order.customerSnapshot?.phone || 'N/A';
  const address = `${order.shippingAddress?.hostelOrBuilding || ''}, ${order.shippingAddress?.campusName || ''}`;

  const itemsList = (order.items || [])
    .map(i => `• ${i.quantity}x ${i.name} (₹${i.price})`)
    .join('\n');

  const message = `🔔 *NEW ORDER RECEIVED*

*Order ID:* #${order.orderNumber}
*Customer:* ${customerName}
*Phone:* +${formatPhoneNumber(customerPhone)}
*Items:*
${itemsList}

*Order Total:* ₹${order.total}
*Payment Method:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})
*Delivery Address:* ${address}

*Status:* ${order.orderStatus.toUpperCase()}

Please open the Admin Dashboard to review and confirm this order:
${process.env.APP_BASE_URL || 'http://localhost:5001'}/admin/orders.html`;

  return sendWhatsAppMessage({
    order,
    recipient: adminPhone,
    recipientType: 'admin',
    notificationType: 'order_placed_admin',
    messageBody: message,
    idempotencyKey: `${order._id}_placed_admin`
  });
}

/**
 * 2. Customer Order Acknowledgment
 */
export async function notifyCustomerOrderPlaced(order) {
  if (order.whatsappOptIn === false) {
    console.log(`[WhatsApp Service] Customer opted out of WhatsApp updates for order ${order.orderNumber}`);
    return null;
  }

  const recipient = order.whatsappNumber || order.shippingAddress?.phone;
  if (!recipient) return null;

  const customerName = order.shippingAddress?.fullName || 'Scholar';

  const message = `Hello *${customerName}*! 📚

Thank you for shopping with *StudentBazaar*.

Your campus order has been received successfully.

*Order ID:* #${order.orderNumber}
*Order Total:* ₹${order.total}
*Payment Method:* ${order.paymentMethod.toUpperCase()}
*Current Status:* Awaiting Confirmation

We will notify you here once our store confirms and dispatches your order.

You can track your order live anytime at:
${process.env.APP_BASE_URL || 'http://localhost:5001'}/pages/orders.html

Thank you for choosing StudentBazaar!`;

  return sendWhatsAppMessage({
    order,
    recipient,
    recipientType: 'customer',
    notificationType: 'order_placed_customer',
    messageBody: message,
    idempotencyKey: `${order._id}_placed_customer`
  });
}

/**
 * 3. Lifecycle Stage Notification to Customer
 */
export async function notifyCustomerStatusUpdate(order, newStatus, note = '') {
  if (order.whatsappOptIn === false) return null;

  const recipient = order.whatsappNumber || order.shippingAddress?.phone;
  if (!recipient) return null;

  const customerName = order.shippingAddress?.fullName || 'Scholar';
  let title = 'ORDER UPDATE';
  let statusText = newStatus.toUpperCase();
  let extraInfo = '';

  switch (newStatus) {
    case 'confirmed':
      title = '✅ ORDER CONFIRMED!';
      extraInfo = `Your order has been confirmed by our store manager. We are preparing your academic study kit.`;
      break;
    case 'processing':
      title = '⚙️ ORDER IN PROCESSING';
      extraInfo = `Our team is assembling your notebook editions.`;
      break;
    case 'packed':
      title = '📦 ORDER PACKED';
      extraInfo = `Your study materials are neatly packed and awaiting courier handover.`;
      break;
    case 'shipped':
      title = '🚀 ORDER SHIPPED';
      extraInfo = `Your order is on the way!\n*Courier:* ${order.courierName || 'Campus Fast Courier'}\n*Tracking Number:* ${order.trackingNumber || 'N/A'}`;
      if (order.trackingUrl) {
        extraInfo += `\n*Track URL:* ${order.trackingUrl}`;
      }
      break;
    case 'out_for_delivery':
      title = '🛵 OUT FOR DELIVERY';
      extraInfo = `Your delivery partner has arrived on campus. Please keep your phone handy!`;
      break;
    case 'delivered':
      title = '🎉 ORDER DELIVERED';
      extraInfo = `Your stationery order has been safely delivered to your hostel room. Happy studying!`;
      break;
    case 'rejected':
      title = '❌ ORDER REJECTED';
      extraInfo = `We regret to inform you that order #${order.orderNumber} could not be fulfilled.\n*Reason:* ${note || order.rejectionReason || 'Item currently unavailable'}`;
      break;
    case 'cancelled':
      title = '🛑 ORDER CANCELLED';
      extraInfo = `Order #${order.orderNumber} has been cancelled.\n*Reason:* ${note || order.cancellationReason || 'Cancelled by customer'}`;
      break;
    default:
      extraInfo = `Order status is now ${statusText}.`;
  }

  const message = `${title}

Hello *${customerName}*,

*Order ID:* #${order.orderNumber}
*Total Amount:* ₹${order.total}
*Status:* ${statusText}

${extraInfo}

Track real-time status:
${process.env.APP_BASE_URL || 'http://localhost:5001'}/pages/orders.html

Thank you for choosing StudentBazaar!`;

  return sendWhatsAppMessage({
    order,
    recipient,
    recipientType: 'customer',
    notificationType: `order_${newStatus}`,
    messageBody: message,
    idempotencyKey: `${order._id}_${newStatus}`
  });
}

export const whatsappService = {
  formatPhoneNumber,
  sendWhatsAppMessage,
  notifyAdminNewOrder,
  notifyCustomerOrderPlaced,
  notifyCustomerStatusUpdate
};

export default whatsappService;

