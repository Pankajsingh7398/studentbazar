/**
 * ============================================================================
 * StudentBazaar — Main Script (script.js)
 * Clean, minimal Vanilla JavaScript for carousel, shopping cart, wishlist,
 * search, category filtering, toast notifications, and local storage.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Initial State & Configuration
  // --------------------------------------------------------------------------
  const STORAGE_KEY_CART = 'studentbazaar_cart';
  const STORAGE_KEY_WISHLIST = 'studentbazaar_wishlist';
  const FREE_SHIPPING_THRESHOLD = 200;
  const STANDARD_SHIPPING_FEE = 20;
  const STUDENT_DISCOUNT_THRESHOLD = 100;
  const STUDENT_DISCOUNT_AMOUNT = 25;

  // Default initial cart if none saved
  const DEFAULT_CART = [
    { id: 'nb-1', name: 'Motivational Notebook', price: 70, quantity: 1, img: 'bg-[#1C3627] text-amber-200' },
    { id: 'nb-2', name: 'Classmate Style Notebook', price: 65, quantity: 1, img: 'bg-[#4A6B82] text-white' }
  ];

  // Default initial wishlist items
  const DEFAULT_WISHLIST = [
    'Motivational Notebook',
    'Spiral Notebook (A5)',
    'Premium Notebook'
  ];

  // State variables
  let cart = [];
  let wishlist = [];
  let currentSlide = 0;
  const totalSlides = 3;
  let carouselInterval = null;
  let toastTimeout = null;
  let activeCategory = 'all'; // 'all', 'notebooks', etc.
  let searchQuery = '';

  // --------------------------------------------------------------------------
  // 2. Local Storage Helpers
  // --------------------------------------------------------------------------
  function loadState() {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY_CART);
      cart = savedCart ? JSON.parse(savedCart) : [...DEFAULT_CART];
      if (!Array.isArray(cart)) cart = [...DEFAULT_CART];
    } catch (e) {
      console.warn('Could not parse saved cart, using defaults.', e);
      cart = [...DEFAULT_CART];
    }

    try {
      const savedWishlist = localStorage.getItem(STORAGE_KEY_WISHLIST);
      wishlist = savedWishlist ? JSON.parse(savedWishlist) : [...DEFAULT_WISHLIST];
      if (!Array.isArray(wishlist)) wishlist = [...DEFAULT_WISHLIST];
    } catch (e) {
      console.warn('Could not parse saved wishlist, using defaults.', e);
      wishlist = [...DEFAULT_WISHLIST];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }

  function saveWishlist() {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Toast Notifications
  // --------------------------------------------------------------------------
  function showToast(message, icon = 'check_circle') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast || !toastMsg || !toastIcon) return;

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastMsg.textContent = message;
    toastIcon.textContent = icon;

    toast.classList.remove('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    toastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-20px]', 'pointer-events-none');
      toast.classList.remove('opacity-100', 'translate-y-0');
      toastTimeout = null;
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 4. Hero Carousel Controller
  // --------------------------------------------------------------------------
  function updateCarousel() {
    const track = document.getElementById('carousel-track');
    if (track) {
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      if (index === currentSlide) {
        dot.classList.remove('bg-primary/30', 'w-2', 'h-2');
        dot.classList.add('bg-primary', 'w-2.5', 'h-2.5');
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.classList.remove('bg-primary', 'w-2.5', 'h-2.5');
        dot.classList.add('bg-primary/30', 'w-2', 'h-2');
        dot.removeAttribute('aria-current');
      }
    });
  }

  function setSlide(index) {
    currentSlide = (index + totalSlides) % totalSlides;
    updateCarousel();
  }

  function nextSlide() {
    setSlide(currentSlide + 1);
  }

  function prevSlide() {
    setSlide(currentSlide - 1);
  }

  function startCarouselTimer() {
    stopCarouselTimer();
    carouselInterval = setInterval(nextSlide, 6000);
  }

  function stopCarouselTimer() {
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null;
    }
  }

  function initCarousel() {
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const carouselContainer = document.querySelector('.carousel-slide-container') || document.getElementById('carousel-track')?.parentElement;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startCarouselTimer();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startCarouselTimer();
      });
    }

    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        setSlide(index);
        startCarouselTimer();
      });
    });

    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', stopCarouselTimer);
      carouselContainer.addEventListener('mouseleave', startCarouselTimer);
      carouselContainer.addEventListener('touchstart', stopCarouselTimer, { passive: true });
      carouselContainer.addEventListener('touchend', startCarouselTimer, { passive: true });
    }

    updateCarousel();
    startCarouselTimer();
  }

  // --------------------------------------------------------------------------
  // 5. Shopping Cart Drawer & Calculations
  // --------------------------------------------------------------------------
  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (!drawer || !backdrop) return;

    renderCartItems();
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
    document.body.classList.add('cart-open');
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (!drawer || !backdrop) return;

    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
    document.body.classList.remove('cart-open');
  }

  function openMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (!drawer || !backdrop) return;

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    drawer.classList.remove('-translate-x-full');
    document.body.classList.add('cart-open');
  }

  function closeMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    if (!drawer || !backdrop) return;

    backdrop.classList.add('opacity-0', 'pointer-events-none');
    backdrop.classList.remove('opacity-100');
    drawer.classList.add('-translate-x-full');
    document.body.classList.remove('cart-open');
  }

  function updateCartTotals() {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Header badge
    const headerCartBadge = document.querySelector('a[data-path="cart"] .cart-badge');
    if (headerCartBadge) {
      headerCartBadge.textContent = totalCount;
    }

    // Drawer Header Item Count Badge
    const drawerCount = document.getElementById('drawer-item-count-badge');
    if (drawerCount) {
      drawerCount.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    }

    // Subtotal
    const subtotalElem = document.getElementById('cart-subtotal-val');
    if (subtotalElem) {
      subtotalElem.textContent = `₹${subtotal}`;
    }

    // Free delivery progress tracking
    const shippingBar = document.getElementById('shipping-bar');
    const freeShippingText = document.getElementById('free-shipping-text');
    const freeShippingPct = document.getElementById('free-shipping-pct');
    const shippingValElem = document.getElementById('cart-shipping-val');

    let deliveryFee = 0;
    if (subtotal === 0) {
      deliveryFee = 0;
      if (shippingBar) shippingBar.style.width = '0%';
      if (freeShippingPct) freeShippingPct.textContent = '0%';
      if (freeShippingText) freeShippingText.textContent = `Add ₹${FREE_SHIPPING_THRESHOLD} for Priority Free Hostel Delivery`;
      if (shippingValElem) shippingValElem.textContent = '₹0';
    } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      deliveryFee = 0;
      if (shippingBar) shippingBar.style.width = '100%';
      if (freeShippingPct) freeShippingPct.textContent = '100%';
      if (freeShippingText) freeShippingText.textContent = 'Unlocked Free Priority Campus Delivery!';
      if (shippingValElem) shippingValElem.textContent = 'FREE';
    } else {
      deliveryFee = STANDARD_SHIPPING_FEE;
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
      if (shippingBar) shippingBar.style.width = `${pct}%`;
      if (freeShippingPct) freeShippingPct.textContent = `${pct}%`;
      if (freeShippingText) freeShippingText.textContent = `Add ₹${remaining} more for Free Hostel Delivery`;
      if (shippingValElem) shippingValElem.textContent = `₹${STANDARD_SHIPPING_FEE}`;
    }

    // Student discount
    const discount = subtotal > STUDENT_DISCOUNT_THRESHOLD ? STUDENT_DISCOUNT_AMOUNT : 0;
    const discountRow = document.getElementById('cart-discount-val');
    if (discountRow) {
      discountRow.textContent = discount > 0 ? `- ₹${discount}` : '₹0';
    }

    // Final total calculation
    const finalTotal = subtotal === 0 ? 0 : Math.max(0, subtotal + deliveryFee - discount);
    const totalElem = document.getElementById('cart-total-val');
    if (totalElem) {
      totalElem.textContent = `₹${finalTotal}`;
    }

    saveCart();
  }

  function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
          <span class="material-symbols-outlined text-[48px] text-stone-300 mb-2">production_quantity_limits</span>
          <p class="font-headline-sm text-headline-sm text-primary mb-1">Your kit is empty</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">Stock up on premium notebooks & supplies for this semester.</p>
          <button id="cart-start-shopping-btn" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition">Start Shopping</button>
        </div>
      `;
      return;
    }

    container.innerHTML = cart.map(item => `
      <div class="cart-item-card flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-surface-container/60 shadow-xs" data-id="${item.id}">
        <div class="w-12 h-16 rounded-lg ${item.img || 'bg-[#1C3627] text-amber-200'} flex flex-col items-center justify-center flex-shrink-0 shadow-xs text-center p-1">
          <span class="material-symbols-outlined text-[16px] opacity-80">menu_book</span>
          <span class="font-mono text-[9px] font-bold tracking-wider mt-0.5">NOTE</span>
        </div>
        <div class="flex-1 min-w-0 pr-1">
          <h4 class="font-label-md text-label-md text-primary font-semibold truncate leading-tight">${escapeHtml(item.name)}</h4>
          <div class="font-currency-md text-currency-md text-secondary font-bold mt-0.5">₹${item.price}</div>
          
          <div class="flex items-center gap-2 mt-2">
            <div class="flex items-center bg-surface-container-highest rounded-lg overflow-hidden border border-surface-container">
              <button class="cart-qty-btn w-6 h-6 flex items-center justify-center hover:bg-surface-container text-primary transition" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">
                <span class="material-symbols-outlined text-[13px]">remove</span>
              </button>
              <span class="w-6 text-center font-label-sm text-label-sm font-bold text-primary">${item.quantity}</span>
              <button class="cart-qty-btn w-6 h-6 flex items-center justify-center hover:bg-surface-container text-primary transition" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">
                <span class="material-symbols-outlined text-[13px]">add</span>
              </button>
            </div>

            <button class="cart-remove-btn text-on-surface-variant hover:text-error text-[11px] font-medium flex items-center gap-0.5 transition" data-id="${item.id}" aria-label="Remove item">
              <span class="material-symbols-outlined text-[14px]">delete</span>
              <span>Remove</span>
            </button>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <span class="font-currency-md text-currency-md text-primary font-bold">₹${item.price * item.quantity}</span>
        </div>
      </div>
    `).join('');
  }

  function addToCart(product) {
    if (window.CartManager && typeof window.CartManager.addItem === 'function') {
      window.CartManager.addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        mockupStyle: product.img,
        quantity: 1
      });
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartTotals();
    showToast(`${product.name} added to study kit!`);
    openCartDrawer();
  }

  function changeQuantity(id, delta) {
    if (window.CartManager && typeof window.CartManager.updateQuantity === 'function') {
      window.CartManager.updateQuantity(id, delta);
      return;
    }
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
      showToast('Item removed from study kit', 'delete');
    }
    renderCartItems();
    updateCartTotals();
  }

  function removeFromCart(id) {
    if (window.CartManager && typeof window.CartManager.removeItem === 'function') {
      window.CartManager.removeItem(id);
      return;
    }
    cart = cart.filter(i => i.id !== id);
    renderCartItems();
    updateCartTotals();
    showToast('Item removed from study kit', 'delete');
  }

  // --------------------------------------------------------------------------
  // 6. Wishlist Controller
  // --------------------------------------------------------------------------
  function updateWishlistBadge() {
    const badge = document.querySelector('a[data-path="wishlist"] .wishlist-badge');
    if (badge) {
      badge.textContent = wishlist.length;
    }
  }

  function syncWishlistCardButtons() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const titleElem = card.querySelector('h3');
      const btn = card.querySelector('.wishlist-btn');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (!titleElem || !btn || !icon) return;

      const productName = titleElem.textContent.trim();
      const isWishlisted = wishlist.includes(productName);

      if (isWishlisted) {
        btn.classList.add('active', 'text-error');
        btn.classList.remove('text-on-surface-variant');
        icon.style.fontVariationSettings = "'FILL' 1";
      } else {
        btn.classList.remove('active', 'text-error');
        btn.classList.add('text-on-surface-variant');
        icon.style.fontVariationSettings = "'FILL' 0";
      }
    });
  }

  function toggleWishlist(productName) {
    const index = wishlist.indexOf(productName);
    if (index === -1) {
      wishlist.push(productName);
      showToast(`Saved "${productName}" to wishlist!`, 'favorite');
    } else {
      wishlist.splice(index, 1);
      showToast(`Removed from wishlist`, 'favorite_border');
    }
    saveWishlist();
    updateWishlistBadge();
    syncWishlistCardButtons();
  }

  // --------------------------------------------------------------------------
  // 7. Combined Filtering: Search & Category
  // --------------------------------------------------------------------------
  function applyFilters() {
    const cards = document.querySelectorAll('.product-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const specs = card.querySelector('.text-label-sm')?.textContent.toLowerCase() || '';

      const matchesCategory = (activeCategory === 'all' || activeCategory === 'notebooks' || category === activeCategory);
      const matchesSearch = !searchQuery || title.includes(searchQuery) || specs.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update filter tag pill in section header
    const pill = document.getElementById('filter-tag-pill');
    const pillName = document.getElementById('filter-tag-name');
    if (pill && pillName) {
      const parts = [];
      if (activeCategory !== 'all') {
        parts.push(`Category: ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`);
      }
      if (searchQuery) {
        parts.push(`Search: "${searchQuery}"`);
      }

      if (parts.length > 0) {
        pill.classList.remove('hidden');
        pill.classList.add('flex');
        pillName.textContent = `${parts.join(' | ')} (${visibleCount})`;
      } else {
        pill.classList.add('hidden');
        pill.classList.remove('flex');
      }
    }

    // No products matching message
    let noResultsElem = document.getElementById('no-products-msg');
    if (visibleCount === 0) {
      if (!noResultsElem) {
        noResultsElem = document.createElement('div');
        noResultsElem.id = 'no-products-msg';
        noResultsElem.className = 'col-span-full py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3 bg-surface-container-low rounded-2xl';
        noResultsElem.innerHTML = `
          <span class="material-symbols-outlined text-[40px] text-stone-400">search_off</span>
          <p class="font-headline-sm text-headline-sm text-primary">No notebooks found</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm">No items match your active filters. Try searching for another keyword or reset the category.</p>
          <button id="reset-all-filters-btn" class="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-primary-container transition mt-1">Clear Filters</button>
        `;
        const grid = document.getElementById('product-grid');
        grid?.appendChild(noResultsElem);
        document.getElementById('reset-all-filters-btn')?.addEventListener('click', resetAllFilters);
      }
      noResultsElem.style.display = 'flex';
    } else if (noResultsElem) {
      noResultsElem.style.display = 'none';
    }
  }

  function setCategory(catKey) {
    activeCategory = catKey;

    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
      const btnCat = btn.getAttribute('data-category');
      const box = btn.querySelector('.category-icon-box');
      const label = btn.querySelector('.category-label');

      if (btnCat === catKey) {
        btn.classList.add('active');
        box?.classList.add('bg-primary-container', 'text-on-primary');
        box?.classList.remove('bg-[#F3EFE6]', 'text-primary');
        label?.classList.add('font-bold', 'text-primary');
      } else {
        btn.classList.remove('active');
        box?.classList.remove('bg-primary-container', 'text-on-primary');
        box?.classList.add('bg-[#F3EFE6]', 'text-primary');
        label?.classList.remove('font-bold', 'text-primary');
      }
    });

    applyFilters();

    if (catKey !== 'all') {
      showToast(`Filtered by ${catKey.charAt(0).toUpperCase() + catKey.slice(1)}`);
    }
  }

  function resetCategoryFilter() {
    activeCategory = 'all';
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach((btn, index) => {
      const box = btn.querySelector('.category-icon-box');
      const label = btn.querySelector('.category-label');
      if (index === 0) {
        btn.classList.add('active');
        box?.classList.add('bg-primary-container', 'text-on-primary');
        box?.classList.remove('bg-[#F3EFE6]', 'text-primary');
        label?.classList.add('font-bold', 'text-primary');
      } else {
        btn.classList.remove('active');
        box?.classList.remove('bg-primary-container', 'text-on-primary');
        box?.classList.add('bg-[#F3EFE6]', 'text-primary');
        label?.classList.remove('font-bold', 'text-primary');
      }
    });
    applyFilters();
    showToast('Category filter reset');
  }

  function resetAllFilters() {
    searchQuery = '';
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
    searchInputs.forEach(input => input.value = '');
    resetCategoryFilter();
  }

  function scrollToNotebooks() {
    const section = document.getElementById('featured-notebooks-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // --------------------------------------------------------------------------
  // 8. Event Delegations & Bindings
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Cart open button in header
    const headerCartBtn = document.querySelector('a[data-path="cart"]');
    if (headerCartBtn) {
      headerCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    }

    // Wishlist button in header
    const headerWishlistBtn = document.querySelector('a[data-path="wishlist"]');
    if (headerWishlistBtn) {
      headerWishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast(`You have ${wishlist.length} item(s) in your Wishlist`, 'favorite');
      });
    }

    // Cart Drawer close triggers
    document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-drawer-backdrop')?.addEventListener('click', closeCartDrawer);

    // Mobile Navigation Drawer triggers
    document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobileNav);
    document.getElementById('close-mobile-nav-btn')?.addEventListener('click', closeMobileNav);
    document.getElementById('mobile-nav-backdrop')?.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCartDrawer();
        closeMobileNav();
      }
    });

    // Cart Container Delegated Actions (Qty, Remove, Start Shopping)
    const cartContainer = document.getElementById('cart-items-container');
    if (cartContainer) {
      cartContainer.addEventListener('click', (e) => {
        const qtyBtn = e.target.closest('.cart-qty-btn');
        if (qtyBtn) {
          const action = qtyBtn.getAttribute('data-action');
          const id = qtyBtn.getAttribute('data-id');
          changeQuantity(id, action === 'increase' ? 1 : -1);
          return;
        }

        const removeBtn = e.target.closest('.cart-remove-btn');
        if (removeBtn) {
          const id = removeBtn.getAttribute('data-id');
          removeFromCart(id);
          return;
        }

        if (e.target.closest('#cart-start-shopping-btn')) {
          closeCartDrawer();
          scrollToNotebooks();
        }
      });
    }

    // Checkout button inside cart drawer
    document.getElementById('checkout-action-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      saveCart();
      const stored = localStorage.getItem(STORAGE_KEY_CART);
      let parsed = [];
      try { parsed = stored ? JSON.parse(stored) : cart; } catch (_) { parsed = cart; }
      if (!parsed || parsed.length === 0) {
        showToast('Your kit is empty! Add notebooks before checkout.', 'error');
        return;
      }
      closeCartDrawer();
      const isInsidePages = window.location.pathname.includes('/pages/');
      window.location.href = isInsidePages ? 'checkout.html' : 'pages/checkout.html';
    });

    // Header Search Input
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
      });
    });

    // Filter Tag Pill reset button
    const filterPillCloseBtn = document.querySelector('#filter-tag-pill button');
    if (filterPillCloseBtn) {
      filterPillCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetAllFilters();
      });
    }

    // "View All" link in section header
    const viewAllLink = document.getElementById('view-all-notebooks-link');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetAllFilters();
        scrollToNotebooks();
      });
    }

    // Category button clicks
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') || 'notebooks';
        setCategory(cat);
      });
    });

    // Product Card Action Delegations (Add to Cart, Wishlist)
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.addEventListener('click', (e) => {
        // Wishlist button click
        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (wishlistBtn) {
          e.preventDefault();
          const card = wishlistBtn.closest('.product-card');
          const title = card?.querySelector('h3')?.textContent.trim() || 'Notebook';
          toggleWishlist(title);
          return;
        }

        // Add to cart button click
        const addCartBtn = e.target.closest('.add-to-cart-btn');
        if (addCartBtn) {
          e.preventDefault();
          const card = addCartBtn.closest('.product-card');
          if (!card) return;

          const id = card.getAttribute('data-id') || 'nb-item';
          const name = card.querySelector('h3')?.textContent.trim() || 'Student Notebook';
          const priceText = card.querySelector('.font-currency-lg')?.textContent.replace(/[^0-9]/g, '') || '70';
          const price = parseInt(priceText, 10);
          const mockup = card.querySelector('.product-mockup');
          const imgClasses = mockup ? mockup.className : 'bg-primary-container text-on-primary';

          addToCart({ id, name, price, img: imgClasses });
        }
      });
    }

    // Hero buttons & triggers
    document.getElementById('hero-shop-notebooks-btn')?.addEventListener('click', scrollToNotebooks);
    document.getElementById('hero-view-exam-kits-btn')?.addEventListener('click', () => {
      setCategory('stationery');
      scrollToNotebooks();
    });
    document.getElementById('hero-explore-backpacks-btn')?.addEventListener('click', () => {
      setCategory('bags');
      scrollToNotebooks();
    });

    // Thesis printing concierge demo button
    document.getElementById('order-thesis-btn')?.addEventListener('click', () => {
      showToast('Binding concierge connected! Submit PDF for hardcover embossing.');
    });

    // Navigation bar links (desktop and mobile)
    const navLinks = document.querySelectorAll('nav a[data-path]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileNav();
        const path = link.getAttribute('data-path');
        const isInsidePages = window.location.pathname.includes('/pages/');
        const prefix = isInsidePages ? '' : 'pages/';

        if (path === 'home') {
          if (isInsidePages) {
            window.location.href = '../index.html';
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (path === 'shop' || path === 'notebooks') {
          if (isInsidePages) {
            window.location.href = `${prefix}shop.html`;
          } else {
            resetAllFilters();
            scrollToNotebooks();
          }
        } else if (path === 'stationery') {
          if (isInsidePages) {
            window.location.href = `${prefix}shop.html`;
          } else {
            setCategory('stationery');
            scrollToNotebooks();
          }
        } else if (path === 'accessories') {
          if (isInsidePages) {
            window.location.href = `${prefix}shop.html`;
          } else {
            setCategory('essentials');
            scrollToNotebooks();
          }
        } else if (path === 'order-tracking' || path === 'orders') {
          window.location.href = `${prefix}orders.html`;
        } else if (path === 'wishlist') {
          showToast(`You have ${wishlist.length} item(s) in your Wishlist`, 'favorite');
        } else {
          showToast(`StudentBazaar — ${link.textContent.trim()} section`);
        }
      });
    });

    // Footer navigation links
    document.querySelectorAll('footer a[data-path]').forEach(link => {
      link.addEventListener('click', (e) => {
        const path = link.getAttribute('data-path');
        const isInsidePages = window.location.pathname.includes('/pages/');
        const prefix = isInsidePages ? '' : 'pages/';
        if (path === 'order-tracking') {
          e.preventDefault();
          window.location.href = `${prefix}orders.html`;
        } else if (path === 'contact-us' || path === 'returns') {
          e.preventDefault();
          window.location.href = `${prefix}contact.html`;
        } else if (path === 'notebooks' || path === 'stationery' || path === 'accessories' || path === 'shop') {
          e.preventDefault();
          window.location.href = `${prefix}shop.html`;
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 9. Utility: HTML Escape
  // --------------------------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --------------------------------------------------------------------------
  // 10. Initialization on DOMContentLoaded
  // --------------------------------------------------------------------------
  window.showToast = showToast;

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initCarousel();
    setupEventListeners();
    updateCartTotals();
    updateWishlistBadge();
    syncWishlistCardButtons();

    // Real-time server catalog sync
    if (window.ProductService?.loadProducts) {
      window.ProductService.loadProducts('product-grid');
    }
  });
})();
