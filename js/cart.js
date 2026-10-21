/**
 * StudentBazaar — Unified Cart Manager (js/cart.js)
 * Seamlessly coordinates between guest LocalStorage and server persistent cart.
 */

const CartManager = (function () {
  const STORAGE_KEY = 'studentbazaar_cart';
  let cartData = {
    items: [],
    itemCount: 0,
    subtotal: 0,
    shippingFee: 0,
    discount: 0,
    total: 0
  };

  function loadLocalCart() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  async function fetchCart() {
    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest('/cart');
        if (res && res.success && res.data) {
          cartData = res.data;
          updateCartUI();
          return cartData;
        }
      } catch (e) {
        console.warn('[Cart] Server fetch error, using local fallback', e);
      }
    }

    // Guest fallback
    const localItems = loadLocalCart();
    if (localItems.length > 0) {
      try {
        const res = await window.apiRequest('/cart/calculate', {
          method: 'POST',
          body: JSON.stringify({ items: localItems })
        });
        if (res && res.success && res.data) {
          cartData = res.data;
          updateCartUI();
          return cartData;
        }
      } catch (e) {
        // Simple offline fallback calculation
        const subtotal = localItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const shippingFee = subtotal >= 200 || subtotal === 0 ? 0 : 20;
        const discount = subtotal > 100 ? 25 : 0;
        cartData = {
          items: localItems,
          itemCount: localItems.reduce((acc, i) => acc + i.quantity, 0),
          subtotal,
          shippingFee,
          discount,
          total: subtotal === 0 ? 0 : Math.max(0, subtotal + shippingFee - discount)
        };
      }
    } else {
      cartData = { items: [], itemCount: 0, subtotal: 0, shippingFee: 0, discount: 0, total: 0 };
    }

    updateCartUI();
    return cartData;
  }

  async function addItem(product, quantity = 1) {
    const pId = product.id || product._id || product.productId;

    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ productId: pId, quantity })
        });
        if (res && res.success && res.data) {
          cartData = res.data;
          updateCartUI();
          window.showToast?.(`${product.name || 'Notebook'} added to study kit!`);
          openDrawer();
          return cartData;
        }
      } catch (e) {
        console.warn('[Cart] Server add failed, falling back to local', e);
      }
    }

    // Guest flow
    const localItems = loadLocalCart();
    const existing = localItems.find(i => (i.productId === pId || i.id === pId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      localItems.push({
        productId: pId,
        id: pId,
        name: product.name,
        price: product.price,
        quantity,
        mockupStyle: product.mockupStyle || 'bg-stone-800 text-stone-100'
      });
    }

    saveLocalCart(localItems);
    await fetchCart();
    window.showToast?.(`${product.name || 'Notebook'} added to study kit!`);
    openDrawer();
    return cartData;
  }

  async function updateQuantity(productId, delta) {
    const existing = cartData.items.find(i => (i.productId === productId || i.id === productId || i._id === productId));
    if (!existing) return;

    const newQty = existing.quantity + delta;

    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest(`/cart/items/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: newQty })
        });
        if (res && res.success) {
          cartData = res.data;
          updateCartUI();
          return cartData;
        }
      } catch (e) {}
    }

    // Guest flow
    let localItems = loadLocalCart();
    if (newQty <= 0) {
      localItems = localItems.filter(i => (i.productId !== productId && i.id !== productId));
      window.showToast?.('Item removed from study kit', 'delete');
    } else {
      const item = localItems.find(i => (i.productId === productId || i.id === productId));
      if (item) item.quantity = newQty;
    }

    saveLocalCart(localItems);
    await fetchCart();
    return cartData;
  }

  async function removeItem(productId) {
    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest(`/cart/items/${productId}`, {
          method: 'DELETE'
        });
        if (res && res.success) {
          cartData = res.data;
          updateCartUI();
          window.showToast?.('Item removed from study kit', 'delete');
          return cartData;
        }
      } catch (e) {}
    }

    let localItems = loadLocalCart();
    localItems = localItems.filter(i => (i.productId !== productId && i.id !== productId));
    saveLocalCart(localItems);
    window.showToast?.('Item removed from study kit', 'delete');
    await fetchCart();
    return cartData;
  }

  async function syncWithServer() {
    const localItems = loadLocalCart();
    if (localItems.length === 0) return;

    try {
      const res = await window.apiRequest('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items: localItems })
      });
      if (res && res.success) {
        cartData = res.data;
        localStorage.removeItem(STORAGE_KEY); // Cleared once synced
        updateCartUI();
      }
    } catch (e) {
      console.warn('[Cart] Sync failed', e);
    }
  }

  function updateCartUI() {
    // Header cart badge
    const headerBadges = document.querySelectorAll('.cart-badge, a[data-path="cart"] .cart-badge');
    headerBadges.forEach(b => b.textContent = cartData.itemCount || 0);

    // Drawer Header Item Count Badge
    const drawerCount = document.getElementById('drawer-item-count-badge');
    if (drawerCount) {
      drawerCount.textContent = `${cartData.itemCount || 0} item${cartData.itemCount === 1 ? '' : 's'}`;
    }

    // Subtotal
    const subtotalElem = document.getElementById('cart-subtotal-val');
    if (subtotalElem) subtotalElem.textContent = `₹${cartData.subtotal || 0}`;

    // Free delivery progress tracking
    const shippingBar = document.getElementById('shipping-bar');
    const freeShippingText = document.getElementById('free-shipping-text');
    const freeShippingPct = document.getElementById('free-shipping-pct');
    const shippingValElem = document.getElementById('cart-shipping-val');

    const threshold = cartData.freeShippingThreshold || 200;
    if (cartData.subtotal === 0) {
      if (shippingBar) shippingBar.style.width = '0%';
      if (freeShippingPct) freeShippingPct.textContent = '0%';
      if (freeShippingText) freeShippingText.textContent = `Add ₹${threshold} for Priority Free Hostel Delivery`;
      if (shippingValElem) shippingValElem.textContent = '₹0';
    } else if (cartData.subtotal >= threshold) {
      if (shippingBar) shippingBar.style.width = '100%';
      if (freeShippingPct) freeShippingPct.textContent = '100%';
      if (freeShippingText) freeShippingText.textContent = 'Unlocked Free Priority Campus Delivery!';
      if (shippingValElem) shippingValElem.textContent = 'FREE';
    } else {
      const remaining = threshold - cartData.subtotal;
      const pct = Math.min(100, Math.round((cartData.subtotal / threshold) * 100));
      if (shippingBar) shippingBar.style.width = `${pct}%`;
      if (freeShippingPct) freeShippingPct.textContent = `${pct}%`;
      if (freeShippingText) freeShippingText.textContent = `Add ₹${remaining} more for Free Hostel Delivery`;
      if (shippingValElem) shippingValElem.textContent = `₹${cartData.shippingFee || 20}`;
    }

    // Discount
    const discountRow = document.getElementById('cart-discount-val');
    if (discountRow) {
      discountRow.textContent = cartData.discount > 0 ? `- ₹${cartData.discount}` : '₹0';
    }

    // Total
    const totalElem = document.getElementById('cart-total-val');
    if (totalElem) totalElem.textContent = `₹${cartData.total || 0}`;

    renderCartItems();
  }

  function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (!cartData.items || cartData.items.length === 0) {
      container.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
          <span class="material-symbols-outlined text-[48px] text-stone-300 mb-2">production_quantity_limits</span>
          <p class="font-headline-sm text-headline-sm text-primary mb-1">Your kit is empty</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">Stock up on premium archival notebooks & supplies.</p>
          <button id="cart-start-shopping-btn" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition">Start Shopping</button>
        </div>
      `;
      return;
    }

    container.innerHTML = cartData.items.map(item => {
      const id = item.productId || item._id || item.id;
      const mockupClass = item.mockupStyle || 'bg-[#1C3627] text-amber-200';
      return `
        <div class="flex items-center gap-space-md p-space-sm bg-surface-container-low rounded-xl" data-id="${id}">
          <div class="w-14 h-18 rounded-md ${mockupClass} flex items-center justify-center flex-shrink-0 shadow-xs font-mono text-[10px] p-1 text-center font-bold">
            NOTE
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-label-lg text-label-lg text-primary truncate">${item.name}</h4>
            <div class="font-currency-md text-currency-md text-primary mt-0.5">₹${item.price}</div>
            
            <div class="flex items-center gap-space-md mt-2">
              <div class="flex items-center bg-surface-container-highest rounded-lg overflow-hidden">
                <button class="cart-qty-btn w-7 h-7 flex items-center justify-center hover:bg-surface-variant text-primary transition" data-action="decrease" data-id="${id}" aria-label="Decrease quantity">
                  <span class="material-symbols-outlined text-[14px]">remove</span>
                </button>
                <span class="w-7 text-center font-label-md text-label-md text-primary">${item.quantity}</span>
                <button class="cart-qty-btn w-7 h-7 flex items-center justify-center hover:bg-surface-variant text-primary transition" data-action="increase" data-id="${id}" aria-label="Increase quantity">
                  <span class="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>

              <button class="cart-remove-btn text-on-surface-variant hover:text-error text-body-sm font-body-sm flex items-center gap-0.5 transition" data-id="${id}" aria-label="Remove item">
                <span class="material-symbols-outlined text-[16px]">delete</span>
                <span>Remove</span>
              </button>
            </div>
          </div>
          <div class="text-right">
            <span class="font-currency-md text-currency-md text-primary">₹${item.price * item.quantity}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (!drawer || !backdrop) return;

    renderCartItems();
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
    document.body.classList.add('cart-open');
  }

  function closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (!drawer || !backdrop) return;

    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
    document.body.classList.remove('cart-open');
  }

  // Setup cart drawer event bindings
  document.addEventListener('DOMContentLoaded', () => {
    fetchCart();

    document.getElementById('close-cart-btn')?.addEventListener('click', closeDrawer);
    document.getElementById('cart-drawer-backdrop')?.addEventListener('click', closeDrawer);

    const headerCartBtn = document.querySelector('a[data-path="cart"]');
    if (headerCartBtn) {
      headerCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

    const cartContainer = document.getElementById('cart-items-container');
    if (cartContainer) {
      cartContainer.addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.cart-qty-btn');
        if (qtyBtn) {
          const action = qtyBtn.getAttribute('data-action');
          const id = qtyBtn.getAttribute('data-id');
          updateQuantity(id, action === 'increase' ? 1 : -1);
          return;
        }

        const removeBtn = e.target.closest('.cart-remove-btn');
        if (removeBtn) {
          const id = removeBtn.getAttribute('data-id');
          removeItem(id);
          return;
        }

        if (e.target.closest('#cart-start-shopping-btn')) {
          closeDrawer();
          const target = document.getElementById('featured-notebooks-section');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
          else window.location.href = '/pages/shop.html';
        }
      });
    }

    // Checkout button inside drawer
    document.getElementById('checkout-action-btn')?.addEventListener('click', () => {
      if (!cartData.items || cartData.items.length === 0) {
        window.showToast?.('Your study kit is empty!', 'error');
        return;
      }
      closeDrawer();
      window.location.href = '/pages/checkout.html';
    });
  });

  return {
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    syncWithServer,
    openDrawer,
    closeDrawer,
    getCartData: () => cartData
  };
})();

window.CartManager = CartManager;
