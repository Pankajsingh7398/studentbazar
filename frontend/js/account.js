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

  // Check if an order ID is in URL query parameters to auto-open tracking
  const urlParams = new URLSearchParams(window.location.search);
  const trackOrderId = urlParams.get('id');
  if (trackOrderId) {
    setTimeout(() => {
      openOrderTracking(trackOrderId);
    }, 400);
  }

  // Close tracking modal listener
  document.getElementById('close-tracking-modal')?.addEventListener('click', () => {
    closeTrackingModal();
  });

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

let trackingPollInterval = null;

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
          pending: 'bg-amber-100 text-amber-800 border-amber-200',
          confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
          processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          packed: 'bg-teal-100 text-teal-800 border-teal-200',
          shipped: 'bg-purple-100 text-purple-800 border-purple-200',
          out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
          delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          rejected: 'bg-rose-100 text-rose-800 border-rose-200',
          cancelled: 'bg-zinc-100 text-zinc-800 border-zinc-200'
        }[o.orderStatus] || 'bg-stone-100 text-stone-800 border-stone-200';

        const canCancel = ['pending', 'confirmed'].includes(o.orderStatus);

        return `
          <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container">
              <div>
                <span class="font-label-lg text-label-lg text-primary font-bold">${o.orderNumber}</span>
                <span class="text-body-sm text-on-surface-variant ml-2">• ${dateStr}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeColor}">
                  ${o.orderStatus.replace('_', ' ')}
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
            <div class="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-surface-container">
              <div class="text-body-sm text-on-surface-variant">
                <span>Deliver to: <strong>${o.shippingAddress.hostelOrBuilding}, ${o.shippingAddress.campusName}</strong></span>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="font-headline-sm text-headline-sm text-primary mr-2">
                  Total: <span>₹${o.total}</span>
                </div>
                <button class="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition text-label-sm font-semibold flex items-center gap-1.5 shadow-xs" onclick="openOrderTracking('${o._id}')">
                  <span class="material-symbols-outlined text-[16px]">timeline</span>
                  <span>Track Order</span>
                </button>
                ${canCancel ? `
                  <button class="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 transition text-label-sm font-label-sm" onclick="cancelCustomerOrder('${o._id}')">
                    Cancel
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

window.openOrderTracking = async function (orderId) {
  const modal = document.getElementById('tracking-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Initial fetch and render
  await renderTrackingDetails(orderId);

  // Clear existing polling timer
  if (trackingPollInterval) clearInterval(trackingPollInterval);

  // Auto-sync polling every 8 seconds while modal is open
  trackingPollInterval = setInterval(() => {
    if (modal.classList.contains('hidden')) {
      clearInterval(trackingPollInterval);
      return;
    }
    renderTrackingDetails(orderId, true);
  }, 8000);
};

window.closeTrackingModal = function () {
  const modal = document.getElementById('tracking-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (trackingPollInterval) {
    clearInterval(trackingPollInterval);
    trackingPollInterval = null;
  }
};

async function renderTrackingDetails(orderId, isPolling = false) {
  try {
    const res = await window.apiRequest(`/orders/${orderId}/tracking`);
    if (!res || !res.success || !res.data) return;

    const { order, timeline, isCancelledOrRejected, negativeState, history } = res.data;

    document.getElementById('modal-order-number').textContent = `Order ${order.orderNumber}`;

    const badge = document.getElementById('modal-order-badge');
    if (badge) {
      badge.textContent = order.orderStatus.replace('_', ' ');
      badge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
        order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
        order.orderStatus === 'rejected' || order.orderStatus === 'cancelled' ? 'bg-rose-100 text-rose-800' :
        'bg-primary/10 text-primary'
      }`;
    }

    // Courier banner
    const courierBanner = document.getElementById('modal-courier-banner');
    if (courierBanner) {
      if (order.courierName || order.trackingNumber) {
        courierBanner.classList.remove('hidden');
        document.getElementById('modal-courier-name').textContent = order.courierName || 'Campus Express';
        document.getElementById('modal-tracking-number').textContent = order.trackingNumber || 'Assigned';
        const link = document.getElementById('modal-tracking-link');
        if (order.trackingUrl) {
          link.href = order.trackingUrl;
          document.getElementById('modal-tracking-link-wrapper').classList.remove('hidden');
        } else {
          document.getElementById('modal-tracking-link-wrapper').classList.add('hidden');
        }
      } else {
        courierBanner.classList.add('hidden');
      }
    }

    // Terminal negative state banner
    const negativeAlert = document.getElementById('modal-negative-alert');
    if (negativeAlert) {
      if (isCancelledOrRejected && negativeState) {
        negativeAlert.classList.remove('hidden');
        document.getElementById('modal-negative-title').textContent = `Order ${negativeState.status.toUpperCase()}`;
        document.getElementById('modal-negative-reason').textContent = `Reason: ${negativeState.reason}`;
        document.getElementById('modal-negative-time').textContent = negativeState.timestamp ? new Date(negativeState.timestamp).toLocaleString('en-IN') : '';
      } else {
        negativeAlert.classList.add('hidden');
      }
    }

    // Render Stepper Timeline
    const timelineContainer = document.getElementById('modal-timeline-container');
    if (timelineContainer && Array.isArray(timeline)) {
      timelineContainer.innerHTML = timeline.map(step => {
        let iconMarkup = '';
        let stepColor = 'text-on-surface-variant';
        let circleBg = 'bg-surface-container border-2 border-outline-variant';

        if (step.state === 'completed') {
          circleBg = 'bg-emerald-600 text-white';
          iconMarkup = '<span class="material-symbols-outlined text-[16px]">check</span>';
          stepColor = 'text-primary font-bold';
        } else if (step.state === 'current') {
          circleBg = 'bg-primary text-white ring-4 ring-primary/20 animate-pulse';
          iconMarkup = '<span class="material-symbols-outlined text-[16px]">radio_button_checked</span>';
          stepColor = 'text-primary font-bold';
        } else {
          circleBg = 'bg-surface-container-low text-on-surface-variant border-2 border-surface-container';
          iconMarkup = '<span class="material-symbols-outlined text-[14px]">circle</span>';
        }

        const dateFormatted = step.timestamp ? new Date(step.timestamp).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : (step.state === 'upcoming' ? 'Pending next stage' : 'Completed');

        return `
          <div class="relative flex items-start gap-4">
            <div class="absolute -left-[31px] w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${circleBg} shadow-xs">
              ${iconMarkup}
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold ${stepColor}">${step.label}</h4>
              <p class="text-[12px] text-on-surface-variant">${dateFormatted}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    // Audit trail logs
    const auditContainer = document.getElementById('modal-audit-trail');
    if (auditContainer && Array.isArray(history)) {
      auditContainer.innerHTML = history.map(h => `
        <div class="py-1 border-b border-surface-container last:border-0">
          <span class="text-primary font-bold">[${new Date(h.createdAt).toLocaleTimeString('en-IN')}]</span>
          <span>Status changed: <strong>${h.previousStatus || 'INIT'}</strong> → <strong class="text-primary">${h.newStatus}</strong></span>
          <div class="text-on-surface-variant pl-2">${h.note || ''}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('[Tracking Fetch Error]:', err);
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

