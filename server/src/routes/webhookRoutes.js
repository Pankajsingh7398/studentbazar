import { Router } from 'express';
import { NotificationLog } from '../models/NotificationLog.js';

const router = Router();

/**
 * WhatsApp Cloud API Webhook Verification (Handshake)
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'studentbazaar_wa_verify_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] Handshake verified successfully.');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook] Handshake failed: invalid verify token.');
  return res.status(403).json({ error: 'Verification token mismatch' });
});

/**
 * WhatsApp Cloud API Webhook Inbound Events (Delivery receipts & read receipts)
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (!Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          const value = change.value;
          if (value && Array.isArray(value.statuses)) {
            for (const statusObj of value.statuses) {
              const { id: messageId, status, timestamp, errors } = statusObj;

              console.log(`[WhatsApp Webhook] Message ${messageId} status update: ${status}`);

              const updateData = {};
              if (status === 'sent') {
                updateData.status = 'SENT';
                updateData.sentAt = new Date(Number(timestamp) * 1000);
              } else if (status === 'delivered') {
                updateData.status = 'DELIVERED';
                updateData.deliveredAt = new Date(Number(timestamp) * 1000);
              } else if (status === 'read') {
                updateData.status = 'DELIVERED';
              } else if (status === 'failed') {
                updateData.status = 'FAILED';
                if (errors && errors.length > 0) {
                  updateData.lastError = `${errors[0].title || 'Failure'}: ${errors[0].message || ''} (code: ${errors[0].code})`;
                }
              }

              if (Object.keys(updateData).length > 0) {
                await NotificationLog.findOneAndUpdate(
                  { providerMessageId: messageId },
                  { $set: updateData }
                );
              }
            }
          }
        }
      }
    }

    // Always acknowledge 200 OK quickly to prevent Meta retries
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[WhatsApp Webhook Error]:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
});

export default router;
