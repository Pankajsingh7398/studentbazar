import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5001/api/v1';

test('E-Commerce Order Management & WhatsApp Upgrade Suite', async (t) => {
  let customerToken = '';
  let customerId = '';
  let adminToken = '';
  let sampleProductId = '';
  let testOrderId = '';
  let sampleProviderMessageId = '';

  await t.test('1. Setup: Customer Registration & Product Retrieval', async () => {
    // Register customer
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Sharma',
        email: `rahul_${Date.now()}@campus.in`,
        password: 'CustomerPass123!',
        phone: '9876543210'
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    customerToken = regData.data.token;
    customerId = regData.data.user._id;
    assert.ok(customerToken);

    // Get product
    const prodRes = await fetch(`${BASE_URL}/products`);
    const prodData = await prodRes.json();
    assert.ok(prodData.data.products.length > 0);
    sampleProductId = prodData.data.products[0]._id;
    assert.ok(sampleProductId);
  });

  await t.test('2. Admin Passkey Login — Reject Incorrect Passkey', async () => {
    const res = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: 'WrongPasskey123' })
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /invalid admin passkey/i);
  });

  await t.test('3. Admin Passkey Login — Authenticate Valid Passkey', async () => {
    const res = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey: 'AdminPassKey123!' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.user.role, 'admin');
    adminToken = data.data.token;
    assert.ok(adminToken);
  });

  await t.test('4. Security: Customer Forbidden from Admin Routes', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test('5. Customer Places Order — Initial Status is "pending"', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Rahul Sharma',
          phone: '9876543210',
          hostelOrBuilding: 'Tagore Hostel, Room 204',
          campusName: 'North Campus, DU',
          city: 'Delhi',
          pinCode: '110007'
        },
        whatsappNumber: '919876543210',
        whatsappOptIn: true,
        paymentMethod: 'cod',
        items: [{ productId: sampleProductId, quantity: 1 }]
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.order.orderStatus, 'pending');
    assert.equal(data.data.order.paymentStatus, 'pending');
    assert.equal(data.data.order.whatsappNumber, '919876543210');
    assert.equal(data.data.order.whatsappOptIn, true);
    testOrderId = data.data.order._id;
    assert.ok(testOrderId);
  });

  await t.test('6. Customer Order Tracking Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.order.orderStatus, 'pending');
    assert.ok(Array.isArray(data.data.timeline));
    assert.equal(data.data.timeline[0].key, 'pending');
    assert.equal(data.data.timeline[0].state, 'current');
    assert.ok(data.data.timeline[0].timestamp);
    assert.ok(Array.isArray(data.data.history));
    assert.equal(data.data.history[0].newStatus, 'pending');
  });

  await t.test('7. Admin Dashboard Overview Statistics', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    const overview = data.data.overview;
    assert.ok(overview.totalOrders >= 1);
    assert.ok(overview.pendingOrders >= 1);
    assert.ok(overview.totalSales >= 0);
  });

  await t.test('8. Admin Order Lifecycle — Reject Illegal Transition (Skip steps)', async () => {
    // Attempt to jump from 'pending' directly to 'shipped'
    const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /illegal status transition/i);
  });

  await t.test('9. Admin Order Confirmation (pending -> confirmed)', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.order.orderStatus, 'confirmed');
  });

  await t.test('10. Admin Lifecycle Progression (confirmed -> processing -> packed)', async () => {
    // Step to processing
    const procRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'processing' })
    });
    assert.equal(procRes.status, 200);

    // Step to packed
    const packRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'packed' })
    });
    assert.equal(packRes.status, 200);
  });

  await t.test('11. Admin Ship Order — Require Courier & Tracking Details', async () => {
    // Attempt to mark as shipped without courier details
    const failRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    assert.equal(failRes.status, 400);

    // Ship with valid courier info
    const shipRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'shipped',
        courierName: 'Campus Express Delivery',
        trackingNumber: 'TRK-99887766',
        trackingUrl: 'https://track.studentbazaar.in/TRK-99887766'
      })
    });
    assert.equal(shipRes.status, 200);
    const shipData = await shipRes.json();
    assert.equal(shipData.data.order.orderStatus, 'shipped');
    assert.equal(shipData.data.order.courierName, 'Campus Express Delivery');
    assert.equal(shipData.data.order.trackingNumber, 'TRK-99887766');
  });

  await t.test('12. Final Delivery Stage (shipped -> out_for_delivery -> delivered)', async () => {
    const ofdRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'out_for_delivery' })
    });
    assert.equal(ofdRes.status, 200);

    const delivRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'delivered' })
    });
    assert.equal(delivRes.status, 200);
    const delivData = await delivRes.json();
    assert.equal(delivData.data.order.orderStatus, 'delivered');
    assert.equal(delivData.data.order.paymentStatus, 'paid'); // COD marked paid upon delivery
  });

  await t.test('13. WhatsApp Notification Logs Inspection', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.logs));
    assert.ok(data.data.logs.length >= 1);

    const adminLog = data.data.logs.find(l => l.recipientType === 'admin');
    assert.ok(adminLog, 'Admin notification log should be recorded');
    assert.ok(adminLog.status === 'SENT' || adminLog.status === 'QUEUED');

    sampleProviderMessageId = adminLog.providerMessageId;
  });

  await t.test('14. WhatsApp Webhook Handshake Verification', async () => {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'studentbazaar_wa_verify_2026';
    const challenge = 'CHALLENGE_TEST_STRING_7788';
    const res = await fetch(
      `${BASE_URL}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challenge}`
    );
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(text, challenge);
  });

  await t.test('15. WhatsApp Webhook Delivery Callback Processing', async () => {
    if (!sampleProviderMessageId) return;

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            statuses: [{
              id: sampleProviderMessageId,
              status: 'delivered',
              timestamp: String(Math.floor(Date.now() / 1000)),
              recipient_id: '919876543210'
            }]
          }
        }]
      }]
    };

    const res = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.received, true);
  });
});
