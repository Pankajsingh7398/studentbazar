/**
 * StudentBazaar — Administrator Dashboard Controller (js/admin.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.AuthManager?.checkSession();
  const user = window.AuthManager?.getUser();

  if (!user || user.role !== 'admin') {
    window.showToast?.('Access restricted. Admin credentials required.', 'error');
    setTimeout(() => { window.location.href = '/pages/login.html'; }, 1000);
    return;
  }

  // Set admin name in header
  const adminNameElem = document.getElementById('admin-user-name');
  if (adminNameElem) adminNameElem.textContent = user.name;

  // Highlight active sidebar item based on current page URL
  const currentPath = window.location.pathname.toLowerCase();
  const adminNavLinks = document.querySelectorAll('.admin-nav-item');
  adminNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    link.classList.remove('active', 'bg-primary-container', 'text-on-primary');

    // Skip Public Storefront link from being highlighted as active in admin
    const text = link.textContent.trim().toLowerCase();
    if (text.includes('public storefront') || href === '/' || href === '/index.html') {
      return;
    }

    const isOverview = text.includes('overview') &&
      (currentPath.endsWith('/admin') || currentPath.endsWith('/admin/') || currentPath.endsWith('/admin/index.html') || currentPath.endsWith('/admin/index'));

    const isProducts = text.includes('products') && currentPath.includes('products');
    const isOrders = text.includes('orders') && currentPath.includes('orders');
    const isCustomers = text.includes('customers') && currentPath.includes('customers');
    const isInventory = text.includes('inventory') && currentPath.includes('inventory');

    if (isOverview || isProducts || isOrders || isCustomers || isInventory) {
      link.classList.add('active', 'bg-primary-container', 'text-on-primary');
    }
  });

  // Load Dashboard & Page Data conditionally based on what is in DOM
  if (document.getElementById('stat-total-sales')) loadDashboardStats();
  if (document.getElementById('admin-all-orders-table')) loadAdminOrders();
  if (document.getElementById('admin-inventory-table')) window.loadInventory();
  if (document.getElementById('admin-products-table-body')) window.loadAdminProductsList();
  if (document.getElementById('admin-customers-table-body')) window.loadAdminCustomersList();

  // Logout button
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    window.AuthManager?.logout();
  });
});

async function loadDashboardStats() {
  try {
    const res = await window.apiRequest('/admin/dashboard');
    if (res && res.success && res.data) {
      const { overview, recentOrders } = res.data;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

      setVal('stat-total-sales', `₹${overview.totalSales.toLocaleString('en-IN')}`);
      setVal('stat-total-orders', overview.totalOrders || 0);
      setVal('stat-pending-orders', overview.pendingOrders || 0);
      setVal('stat-confirmed-orders', overview.confirmedOrders || 0);
      setVal('stat-processing-orders', overview.processingOrders || 0);
      setVal('stat-packed-orders', overview.packedOrders || 0);
      setVal('stat-shipped-orders', overview.shippedOrders || 0);
      setVal('stat-out-for-delivery', overview.outForDeliveryOrders || 0);
      setVal('stat-delivered-orders', overview.deliveredOrders || 0);
      setVal('stat-cancelled-orders', (overview.cancelledOrders || 0) + (overview.rejectedOrders || 0));
      setVal('stat-pending-payments', overview.pendingPaymentsCount || 0);
      setVal('stat-customers', overview.totalCustomers || 0);
      setVal('stat-low-stock', overview.lowStockCount || 0);

      const recentOrdersBody = document.getElementById('admin-recent-orders-table');
      if (recentOrdersBody && recentOrders) {
        recentOrdersBody.innerHTML = recentOrders.map(o => `
          <tr class="border-b border-surface-container hover:bg-surface-container-low transition">
            <td class="py-3 px-4 font-label-md text-primary font-bold">${o.orderNumber}</td>
            <td class="py-3 px-4 text-body-sm text-on-surface">${o.user?.name || 'Scholar'}</td>
            <td class="py-3 px-4 font-currency-md text-primary">₹${o.total}</td>
            <td class="py-3 px-4">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                o.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                o.orderStatus === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }">${o.orderStatus}</span>
            </td>
            <td class="py-3 px-4 text-body-sm text-on-surface-variant">${o.paymentMethod.toUpperCase()} (${o.paymentStatus})</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('[Admin] Error loading stats', err);
  }
}

async function loadAdminOrders() {
  const tableBody = document.getElementById('admin-all-orders-table');
  if (!tableBody) return;

  try {
    const res = await window.apiRequest('/admin/orders');
    if (res && res.success && res.data.orders) {
      tableBody.innerHTML = res.data.orders.map(o => `
        <tr class="border-b border-surface-container hover:bg-surface-container-low transition">
          <td class="py-3 px-4 font-label-md text-primary font-bold">${o.orderNumber}</td>
          <td class="py-3 px-4 text-body-sm">
            <div>${o.user?.name || 'Unknown'}</div>
            <div class="text-[11px] text-on-surface-variant">${o.user?.email || ''}</div>
          </td>
          <td class="py-3 px-4 text-body-sm text-on-surface-variant">
            ${o.shippingAddress?.hostelOrBuilding || ''}, ${o.shippingAddress?.campusName || ''}
          </td>
          <td class="py-3 px-4 font-currency-md text-primary">₹${o.total}</td>
          <td class="py-3 px-4">
            <select class="px-2 py-1 bg-surface-container rounded font-label-sm text-primary border border-outline-variant focus:outline-none" onchange="updateOrderStatus('${o._id}', this.value)">
              ${['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => `
                <option value="${st}" ${st === o.orderStatus ? 'selected' : ''}>${st.toUpperCase()}</option>
              `).join('')}
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('[Admin Orders] Failed to load', e);
  }
}

window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res = await window.apiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res && res.success) {
      window.showToast?.(`Order status updated to ${newStatus.toUpperCase()}`, 'check_circle');
      loadDashboardStats();
    }
  } catch (err) {
    window.showToast?.(err.message || 'Status update failed', 'error');
  }
};

window.loadInventory = async function() {
  const container = document.getElementById('admin-inventory-table');
  if (!container) return;

  try {
    const res = await window.apiRequest('/admin/inventory');
    if (res && res.success && res.data.inventory) {
      container.innerHTML = res.data.inventory.map(item => `
        <tr class="border-b border-surface-container hover:bg-surface-container-low transition">
          <td class="py-3 px-4 font-label-md text-primary font-bold">${item.name}</td>
          <td class="py-3 px-4 text-body-sm text-on-surface-variant font-mono">${item.SKU}</td>
          <td class="py-3 px-4 font-currency-md text-primary">₹${item.price}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full font-bold text-[11px] ${item.stock <= 20 ? 'bg-error-container text-error' : 'bg-emerald-100 text-emerald-900'}">
              ${item.stock} in stock
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <input type="number" min="0" value="${item.stock}" id="stock-input-${item._id}" class="w-16 px-2 py-1 bg-surface-container rounded text-center font-label-md border border-outline-variant"/>
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-label-sm hover:bg-primary-container transition" onclick="saveStock('${item._id}')">Update</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('[Admin Inventory] Error loading', e);
  }
}

window.saveStock = async function(productId) {
  const input = document.getElementById(`stock-input-${productId}`);
  if (!input) return;

  const newStock = parseInt(input.value, 10);
  try {
    const res = await window.apiRequest(`/admin/inventory/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: newStock })
    });
    if (res && res.success) {
      window.showToast?.(res.message, 'check_circle');
      if (typeof loadInventory === 'function') loadInventory();
      if (typeof loadDashboardStats === 'function') loadDashboardStats();
    }
  } catch (err) {
    window.showToast?.(err.message || 'Failed to update stock', 'error');
  }
};

// Admin Products Page
window.loadAdminProductsList = async function() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  try {
    const res = await window.apiRequest('/products?limit=50');
    if (res && res.success && res.data.products) {
      tbody.innerHTML = res.data.products.map(p => `
        <tr class="border-b border-surface-container hover:bg-surface-container-low transition">
          <td class="py-3 px-4">
            <div class="font-label-md text-primary font-bold">${p.name}</div>
            <div class="text-[11px] text-on-surface-variant font-mono">SKU: ${p.SKU || 'N/A'}</div>
          </td>
          <td class="py-3 px-4 text-body-sm text-secondary font-semibold uppercase">${p.categorySlug || 'notebooks'}</td>
          <td class="py-3 px-4 font-currency-md text-primary font-bold">₹${p.price}</td>
          <td class="py-3 px-4 font-label-md">${p.stock} units</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${p.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="px-3 py-1 bg-surface-container text-error rounded text-label-sm font-semibold hover:bg-error hover:text-white transition" onclick="deleteAdminProduct('${p._id}')">
              Deactivate
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('[Admin] Error loading products list', err);
  }
};

window.deleteAdminProduct = async function(id) {
  if (!confirm('Are you sure you want to deactivate this product edition?')) return;
  try {
    const res = await window.apiRequest(`/products/${id}`, { method: 'DELETE' });
    if (res && res.success) {
      window.showToast?.(res.message, 'check_circle');
      window.loadAdminProductsList();
    }
  } catch (err) {
    window.showToast?.(err.message || 'Failed to deactivate product', 'error');
  }
};

// Admin Customers Page
window.loadAdminCustomersList = async function() {
  const tbody = document.getElementById('admin-customers-table-body');
  if (!tbody) return;

  try {
    const res = await window.apiRequest('/admin/customers');
    if (res && res.success && res.data.customers) {
      tbody.innerHTML = res.data.customers.map(c => `
        <tr class="border-b border-surface-container hover:bg-surface-container-low transition">
          <td class="py-3 px-4">
            <div class="font-label-md text-primary font-bold">${c.name}</div>
            <div class="text-[11px] text-on-surface-variant">${c.email}</div>
          </td>
          <td class="py-3 px-4 text-body-sm text-on-surface-variant">${c.phone || '—'}</td>
          <td class="py-3 px-4 text-body-sm">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-secondary uppercase">${c.role}</span>
          </td>
          <td class="py-3 px-4 text-body-sm text-on-surface-variant">
            ${c.addresses && c.addresses.length > 0 ? `${c.addresses[0].hostelOrBuilding || ''}, ${c.addresses[0].campusName || ''}` : 'No saved campus address'}
          </td>
          <td class="py-3 px-4 text-body-sm text-on-surface-variant font-mono text-[12px]">
            ${new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('[Admin] Error loading customers', err);
  }
};

