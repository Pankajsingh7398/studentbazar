/**
 * StudentBazaar — Checkout & Order Flow Controller (js/checkout.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkoutItemsContainer = document.getElementById('checkout-items-summary');
  const subtotalElem = document.getElementById('checkout-subtotal');
  const shippingElem = document.getElementById('checkout-shipping');
  const discountElem = document.getElementById('checkout-discount');
  const totalElem = document.getElementById('checkout-total');
  const checkoutForm = document.getElementById('checkout-form');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const successModal = document.getElementById('order-success-modal');

  // Check login state: redirect to login if not authenticated
  await window.AuthManager?.checkSession();
  const user = window.AuthManager?.getUser();
  const isInsidePages = window.location.pathname.includes('/pages/');
  if (!user) {
    sessionStorage.setItem('redirect_after_login', isInsidePages ? 'checkout.html' : 'pages/checkout.html');
    window.location.href = isInsidePages ? 'login.html' : 'pages/login.html';
    return;
  }

  // Pre-fill user details if address exists
  if (user) {
    document.getElementById('checkout-name')?.setAttribute('value', user.name || '');
    document.getElementById('checkout-phone')?.setAttribute('value', user.phone || '');
    if (user.addresses && user.addresses.length > 0) {
      const def = user.addresses[0];
      document.getElementById('checkout-hostel')?.setAttribute('value', def.hostelOrBuilding || '');
      document.getElementById('checkout-campus')?.setAttribute('value', def.campusName || '');
      document.getElementById('checkout-city')?.setAttribute('value', def.city || 'New Delhi');
      document.getElementById('checkout-pincode')?.setAttribute('value', def.pinCode || '110007');
    }
  }

  // Fetch fresh cart calculation
  let cart = await window.CartManager.fetchCart();
  if (!cart.items || cart.items.length === 0) {
    const rawLocal = localStorage.getItem('studentbazaar_cart');
    if (rawLocal) {
      try {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (window.CartManager?.syncWithServer) {
            await window.CartManager.syncWithServer();
          }
          cart = await window.CartManager.fetchCart();
        }
      } catch (_) {}
    }
  }

  if (!cart.items || cart.items.length === 0) {
    window.showToast?.('Your study kit is empty! Add notebooks before checkout.', 'error');
    setTimeout(() => { window.location.href = isInsidePages ? '../index.html' : 'index.html'; }, 1500);
    return;
  }

  // Render items summary
  if (checkoutItemsContainer) {
    checkoutItemsContainer.innerHTML = cart.items.map(i => `
      <div class="flex items-center justify-between py-2 border-b border-surface-container">
        <div class="flex items-center gap-3">
          <div class="w-9 h-11 rounded ${i.mockupStyle || 'bg-stone-800 text-stone-100'} flex items-center justify-center text-[8px] font-mono font-bold shadow-xs">
            NOTE
          </div>
          <div>
            <h5 class="font-label-md text-label-md text-primary">${i.name}</h5>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Qty: ${i.quantity} × ₹${i.price}</p>
          </div>
        </div>
        <span class="font-currency-md text-currency-md text-primary">₹${i.price * i.quantity}</span>
      </div>
    `).join('');
  }

  // Update summary numbers
  if (subtotalElem) subtotalElem.textContent = `₹${cart.subtotal}`;
  if (shippingElem) shippingElem.textContent = cart.shippingFee === 0 ? 'FREE' : `₹${cart.shippingFee}`;
  if (discountElem) discountElem.textContent = cart.discount > 0 ? `- ₹${cart.discount}` : '₹0';
  if (totalElem) totalElem.textContent = `₹${cart.total}`;

  // Helper: Copy phone to WhatsApp input
  document.getElementById('copy-phone-btn')?.addEventListener('click', () => {
    const phoneVal = document.getElementById('checkout-phone')?.value.trim();
    const whatsappInput = document.getElementById('checkout-whatsapp');
    if (whatsappInput && phoneVal) {
      whatsappInput.value = phoneVal;
      window.showToast?.('WhatsApp number set to phone number', 'check');
    }
  });

  // Handle checkout form submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('checkout-name')?.value.trim();
      const phone = document.getElementById('checkout-phone')?.value.trim();
      const whatsappNumber = document.getElementById('checkout-whatsapp')?.value.trim() || phone;
      const whatsappOptIn = document.getElementById('checkout-whatsapp-optin')?.checked ?? true;
      const deliveryInstructions = document.getElementById('checkout-instructions')?.value.trim();
      const hostelOrBuilding = document.getElementById('checkout-hostel')?.value.trim();
      const campusName = document.getElementById('checkout-campus')?.value.trim();
      const city = document.getElementById('checkout-city')?.value.trim() || 'New Delhi';
      const pinCode = document.getElementById('checkout-pincode')?.value.trim() || '110007';
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'cod';

      if (!fullName || !phone || !hostelOrBuilding || !campusName) {
        window.showToast?.('Please fill out all address fields.', 'error');
        return;
      }

      if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">sync</span><span>Securing Order...</span>';
      }

      try {
        const orderPayload = {
          shippingAddress: {
            fullName,
            phone,
            hostelOrBuilding: deliveryInstructions ? `${hostelOrBuilding} (Note: ${deliveryInstructions})` : hostelOrBuilding,
            campusName,
            city,
            pinCode
          },
          whatsappNumber,
          whatsappOptIn,
          paymentMethod,
          items: cart.items.map(i => ({ productId: i.productId || i._id, quantity: i.quantity }))
        };

        const res = await window.apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload)
        });

        if (res && res.success && res.data.order) {
          const createdOrder = res.data.order;

          // If Razorpay payment selected:
          if (paymentMethod === 'razorpay') {
            window.showToast?.('Initiating secure Razorpay gateway...', 'payments');
            await window.apiRequest('/payments/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: createdOrder._id,
                razorpay_order_id: `rzp_mock_${Date.now()}`,
                razorpay_payment_id: `pay_mock_${Date.now()}`
              })
            });
          }

          // Clear local cart
          localStorage.removeItem('studentbazaar_cart');
          await window.CartManager.fetchCart();

          // Show confirmation modal
          if (successModal) {
            document.getElementById('success-order-number').textContent = createdOrder.orderNumber;
            document.getElementById('success-order-total').textContent = `₹${createdOrder.total}`;
            const trackBtn = document.getElementById('success-track-btn');
            if (trackBtn) {
              trackBtn.href = `orders.html?id=${createdOrder._id}`;
            }

            // Pre-fill WhatsApp message to Admin (8429172879)
            const adminWaBtn = document.getElementById('success-whatsapp-admin-btn');
            if (adminWaBtn) {
              const itemsList = (createdOrder.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
              const waMsg = encodeURIComponent(
                `🔔 *NEW ORDER RECEIVED (StudentBazaar)*\n\n` +
                `*Order ID:* #${createdOrder.orderNumber}\n` +
                `*Customer:* ${createdOrder.shippingAddress?.fullName || 'Customer'}\n` +
                `*Phone:* ${createdOrder.shippingAddress?.phone || 'N/A'}\n` +
                `*Items:* ${itemsList}\n` +
                `*Total:* ₹${createdOrder.total}\n` +
                `*Payment:* ${createdOrder.paymentMethod ? createdOrder.paymentMethod.toUpperCase() : 'COD'}\n` +
                `*Address:* ${createdOrder.shippingAddress?.hostelOrBuilding || ''}, ${createdOrder.shippingAddress?.campusName || ''}\n\n` +
                `Review on Admin Portal:\nhttps://studentbazaar.netlify.app/admin/orders.html`
              );
              adminWaBtn.href = `https://wa.me/918429172879?text=${waMsg}`;
            }

            successModal.classList.remove('hidden');
            successModal.classList.add('flex');
          } else {
            window.showToast?.(`Order ${createdOrder.orderNumber} placed!`, 'check_circle');
            setTimeout(() => { window.location.href = `orders.html?id=${createdOrder._id}`; }, 1800);
          }
        }
      } catch (err) {
        window.showToast?.(err.message || 'Failed to place order.', 'error');
        if (placeOrderBtn) {
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = '<span>Confirm Campus Delivery</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
        }
      }
    });
  }
});
