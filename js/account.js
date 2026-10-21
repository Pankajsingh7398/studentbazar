/**
 * StudentBazaar — Scholar Account & Orders Controller (js/account.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  await window.AuthManager?.checkSession();
  const user = window.AuthManager?.getUser();

  if (!user) {
    window.location.href = '/pages/login.html';
    return;
  }

  // Populate profile info
  const nameElem = document.getElementById('account-name');
  const emailElem = document.getElementById('account-email');
  const phoneElem = document.getElementById('account-phone');
  const roleElem = document.getElementById('account-role');

  if (nameElem) nameElem.textContent = user.name;
  if (emailElem) emailElem.textContent = user.email;
  if (phoneElem) phoneElem.textContent = user.phone || 'Not provided';
  if (roleElem) roleElem.textContent = user.role === 'admin' ? 'Campus Administrator' : 'Enrolled Scholar';

  // Load orders
  loadUserOrders();

  // Tab switching
  const tabs = document.querySelectorAll('.account-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-primary', 'text-primary', 'font-bold'));
      btn.classList.add('active', 'border-primary', 'text-primary', 'font-bold');

      const target = btn.getAttribute('data-tab');
      document.querySelectorAll('.account-tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`tab-${target}`)?.classList.remove('hidden');
    });
  });

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    window.AuthManager?.logout();
  });
});

async function loadUserOrders() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  try {
    const res = await window.apiRequest('/orders/my-orders');
    if (res && res.success && res.data.orders) {
      const orders = res.data.orders;
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[48px] text-stone-300">receipt_long</span>
            <p class="font-headline-sm text-headline-sm text-primary">No campus orders yet</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Your order history and live dispatch status will appear here.</p>
            <a href="/pages/shop.html" class="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md">Explore Notebooks</a>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(o => {
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const statusBadgeColor = {
          pending: 'bg-amber-100 text-amber-800',
          confirmed: 'bg-sky-100 text-sky-800',
          processing: 'bg-indigo-100 text-indigo-800',
          shipped: 'bg-purple-100 text-purple-800',
          delivered: 'bg-emerald-100 text-emerald-800',
          cancelled: 'bg-rose-100 text-rose-800'
        }[o.orderStatus] || 'bg-stone-100 text-stone-800';

        const canCancel = ['pending', 'confirmed'].includes(o.orderStatus);

        return `
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-surface-container space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-container">
              <div>
                <span class="font-label-lg text-label-lg text-primary font-bold">${o.orderNumber}</span>
                <span class="text-body-sm text-on-surface-variant ml-2">• ${dateStr}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-label-sm font-semibold uppercase tracking-wider ${statusBadgeColor}">
                  ${o.orderStatus}
                </span>
                <span class="text-label-sm font-label-sm text-on-surface-variant font-medium">
                  (${o.paymentMethod.toUpperCase()} • ${o.paymentStatus})
                </span>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-2">
              ${o.items.map(item => `
                <div class="flex items-center justify-between text-body-sm">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-secondary">book</span>
                    <span class="text-on-surface font-medium">${item.name}</span>
                    <span class="text-on-surface-variant">× ${item.quantity}</span>
                  </div>
                  <span class="font-currency-md text-primary">₹${item.subtotal}</span>
                </div>
              `).join('')}
            </div>

            <!-- Total and Actions -->
            <div class="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-container">
              <div class="text-body-sm text-on-surface-variant">
                <span>Deliver to: <strong>${o.shippingAddress.hostelOrBuilding}, ${o.shippingAddress.campusName}</strong></span>
              </div>
              <div class="flex items-center gap-3">
                <div class="font-headline-sm text-headline-sm text-primary">
                  Total: <span>₹${o.total}</span>
                </div>
                ${canCancel ? `
                  <button class="px-3 py-1.5 rounded-lg border border-error text-error hover:bg-error hover:text-white transition text-label-sm font-label-sm" onclick="cancelCustomerOrder('${o._id}')">
                    Cancel Order
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('[Orders] Failed to load', e);
  }
}

window.cancelCustomerOrder = async function (orderId) {
  if (!confirm('Are you sure you want to cancel this campus delivery order?')) return;

  try {
    const res = await window.apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Cancelled by scholar' })
    });
    if (res && res.success) {
      window.showToast?.('Order cancelled successfully. Stock restored.', 'check_circle');
      loadUserOrders();
    }
  } catch (err) {
    window.showToast?.(err.message || 'Failed to cancel order.', 'error');
  }
};
