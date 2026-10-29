import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5001/api/v1';

test('StudentBazaar API Integration Test Suite', async (t) => {
  let authToken = '';
  let testUserId = '';
  let sampleProductId = '';
  let createdOrderId = '';

  await t.test('1. Health Check Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'UP');
  });

  await t.test('2. Products Catalog & Search', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.products));
    assert.ok(body.data.products.length >= 6);

    sampleProductId = body.data.products[0]._id;
    assert.ok(sampleProductId);

    // Test text search
    const searchRes = await fetch(`${BASE_URL}/products?q=Motivational`);
    const searchBody = await searchRes.json();
    assert.equal(searchBody.success, true);
    assert.ok(searchBody.data.products.some(p => p.name.includes('Motivational')));
  });

  await t.test('3. Categories Taxonomy', async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.categories.length >= 7);
  });

  await t.test('4. Customer Registration', async () => {
    const randomEmail = `scholar_${Date.now()}@testcampus.in`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Scholar',
        email: randomEmail,
        password: 'ValidPassword123!',
        phone: '9988776655'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.role, 'customer');
    authToken = body.data.token;
    testUserId = body.data.user._id;
  });

  await t.test('5. Customer Login with Incorrect Credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'scholar@studentbazaar.in',
        password: 'WrongPassword!'
      })
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test('6. Authenticated User /me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user._id, testUserId);
  });

  await t.test('7. Shopping Cart Add & Calculations', async () => {
    // Add product to cart
    const addRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        productId: sampleProductId,
        quantity: 2
      })
    });

    assert.equal(addRes.status, 200);
    const cartBody = await addRes.json();
    assert.equal(cartBody.success, true);
    assert.ok(cartBody.data.subtotal > 0);
    assert.ok(cartBody.data.total > 0);
  });

  await t.test('8. Wishlist Toggle', async () => {
    const res = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ productId: sampleProductId })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isSaved, true);
  });

  await t.test('9. Order Placement (COD)', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Test Scholar',
          phone: '9988776655',
          hostelOrBuilding: 'Hostel 1, Room 101',
          campusName: 'Main Campus',
          city: 'Delhi',
          pinCode: '110007'
        },
        paymentMethod: 'cod'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.order.orderNumber.startsWith('SB-'));
    assert.equal(body.data.order.paymentMethod, 'cod');
    createdOrderId = body.data.order._id;
  });

  await t.test('10. Customer Order History & Cancellation', async () => {
    const listRes = await fetch(`${BASE_URL}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.data.orders.length > 0);

    // Cancel order
    const cancelRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ reason: 'Changing delivery address' })
    });
    assert.equal(cancelRes.status, 200);
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.data.order.orderStatus, 'cancelled');
  });

  await t.test('11. Customer Forbidden from Admin Routes', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    // Customer role should receive 403 Forbidden
    assert.equal(res.status, 403);
  });

  await t.test('12. Admin Authorization & Dashboard Stats', async () => {
    // Login as Admin
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@studentbazaar.in',
        password: 'AdminPass123!'
      })
    });
    const loginBody = await loginRes.json();
    const adminToken = loginBody.data.token;

    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(dashRes.status, 200);
    const dashBody = await dashRes.json();
    assert.equal(dashBody.success, true);
    assert.ok(dashBody.data.overview.totalOrders >= 1);
  });
});
