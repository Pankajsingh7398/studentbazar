/**
 * StudentBazaar — Unified Wishlist Manager (js/wishlist.js)
 */

const WishlistManager = (function () {
  const STORAGE_KEY = 'studentbazaar_wishlist';
  let wishlistItems = [];

  function loadLocalWishlist() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalWishlist(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  async function fetchWishlist() {
    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest('/wishlist');
        if (res && res.success && Array.isArray(res.data.wishlist)) {
          wishlistItems = res.data.wishlist;
          updateWishlistUI();
          return wishlistItems;
        }
      } catch (e) {
        console.warn('[Wishlist] Server fetch error, using local fallback', e);
      }
    }

    wishlistItems = loadLocalWishlist();
    updateWishlistUI();
    return wishlistItems;
  }

  async function toggle(product) {
    const pId = product.id || product._id || product.productId;
    const name = product.name || 'Notebook';

    if (window.AuthManager?.isAuthenticated()) {
      try {
        const res = await window.apiRequest('/wishlist/toggle', {
          method: 'POST',
          body: JSON.stringify({ productId: pId })
        });
        if (res && res.success) {
          wishlistItems = res.data.wishlist;
          updateWishlistUI();
          window.showToast?.(res.data.isSaved ? `Saved "${name}" to wishlist!` : 'Removed from wishlist', 'favorite');
          return res.data.isSaved;
        }
      } catch (e) {
        console.warn('[Wishlist] Server toggle failed, falling back to local', e);
      }
    }

    // Guest flow
    let local = loadLocalWishlist();
    const existingIndex = local.findIndex(i => (i._id === pId || i.id === pId || i.name === name));
    let isSaved = false;

    if (existingIndex > -1) {
      local.splice(existingIndex, 1);
      isSaved = false;
      window.showToast?.('Removed from wishlist', 'favorite_border');
    } else {
      local.push({
        _id: pId,
        id: pId,
        name,
        price: product.price,
        mockupStyle: product.mockupStyle || 'bg-[#1C3627] text-amber-200'
      });
      isSaved = true;
      window.showToast?.(`Saved "${name}" to wishlist!`, 'favorite');
    }

    saveLocalWishlist(local);
    wishlistItems = local;
    updateWishlistUI();
    return isSaved;
  }

  async function syncWithServer() {
    const local = loadLocalWishlist();
    if (local.length === 0) return;

    try {
      const productIds = local.map(i => i._id || i.id || i.productId).filter(Boolean);
      const res = await window.apiRequest('/wishlist/sync', {
        method: 'POST',
        body: JSON.stringify({ productIds })
      });
      if (res && res.success) {
        wishlistItems = res.data.wishlist;
        localStorage.removeItem(STORAGE_KEY);
        updateWishlistUI();
      }
    } catch (e) {}
  }

  function updateWishlistUI() {
    const badges = document.querySelectorAll('.wishlist-badge, a[data-path="wishlist"] .wishlist-badge');
    badges.forEach(b => b.textContent = wishlistItems.length);

    // Sync card heart icons
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const cardId = card.getAttribute('data-id');
      const titleElem = card.querySelector('h3');
      const btn = card.querySelector('.wishlist-btn');
      const icon = btn?.querySelector('.material-symbols-outlined');
      if (!btn || !icon) return;

      const title = titleElem?.textContent.trim();
      const isSaved = wishlistItems.some(i => (
        (i._id && i._id === cardId) ||
        (i.id && i.id === cardId) ||
        (i.name && i.name === title)
      ));

      if (isSaved) {
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

  document.addEventListener('DOMContentLoaded', () => {
    fetchWishlist();

    const headerWishlistBtn = document.querySelector('a[data-path="wishlist"]');
    if (headerWishlistBtn) {
      headerWishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/pages/wishlist.html';
      });
    }
  });

  return {
    fetchWishlist,
    toggle,
    syncWithServer,
    getItems: () => wishlistItems,
    updateWishlistUI
  };
})();

window.WishlistManager = WishlistManager;
