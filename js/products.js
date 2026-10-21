/**
 * StudentBazaar — Product Catalog Client (js/products.js)
 * Fetches products from the backend API and renders cards while
 * strictly preserving the authentic realistic notebook cover mockups.
 */

const ProductService = (function () {
  let productsCache = [];

  function createProductCardHTML(p) {
    const id = p._id || p.id;
    const badgeText = p.badge || (p.compareAtPrice ? `${Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF` : '');
    const badgeColor = p.badgeColor || (p.badge === 'Bestseller' ? 'bg-emerald-900 text-emerald-100' : 'bg-secondary-container text-on-secondary-container');
    const mockupClass = p.mockupStyle || 'bg-[#1C3627] text-amber-200';
    const shortDesc = p.shortDescription || 'Archival 100 GSM • Ruled';
    const snippet = p.coverSnippet || p.name;
    const discountPercent = p.compareAtPrice ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;

    return `
      <article class="product-card bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between p-space-md" data-category="${p.categorySlug || 'notebooks'}" data-id="${id}">
        <!-- Preview Box -->
        <div class="h-52 rounded-lg relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center p-4">
          ${badgeText ? `
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full ${badgeColor} font-label-sm text-[11px] font-semibold tracking-wide shadow-xs">
              ${badgeText}
            </span>
          ` : ''}
          <button aria-label="Save to wishlist" class="wishlist-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/80 hover:bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-secondary shadow-xs transition-colors" data-id="${id}">
            <span class="material-symbols-outlined text-[18px]">favorite</span>
          </button>
          
          <!-- Realistic Notebook Cover Visualization -->
          <div class="product-mockup w-32 h-44 rounded-r-md rounded-l-xs ${mockupClass} shadow-xl p-3 flex flex-col justify-between text-center relative transform -rotate-1 hover:rotate-0 transition-transform notebook-mockup-shadow cursor-pointer" onclick="window.location.href='/pages/product.html?id=${id}'">
            <div class="absolute left-0 top-0 bottom-0 w-2.5 bg-black/20 rounded-l-xs shadow-inner notebook-cover-spine"></div>
            <div class="text-[10px] opacity-70 uppercase tracking-widest pl-1 font-mono">${shortDesc.split('•')[0] || '192p'}</div>
            <div class="my-auto pl-1">
              <span class="material-symbols-outlined text-[18px] opacity-90">auto_stories</span>
              <p class="font-headline-sm text-[13px] leading-tight font-bold mt-1 font-serif">${snippet}</p>
            </div>
            <div class="text-[9px] opacity-60 uppercase pl-1">StudentBazaar</div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="pt-space-md flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant mb-1">
              <span>${shortDesc}</span>
              <span class="text-secondary font-medium">${p.category?.name || 'Notebook'}</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm text-primary mb-2 font-serif cursor-pointer hover:text-secondary transition-colors" onclick="window.location.href='/pages/product.html?id=${id}'">
              ${p.name}
            </h3>
          </div>
          <div class="pt-2">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="font-currency-lg text-currency-lg text-primary">₹${p.price}</span>
              ${p.compareAtPrice ? `
                <span class="text-on-surface-variant line-through text-body-sm font-body-sm">₹${p.compareAtPrice}</span>
                <span class="px-1.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">${discountPercent}% OFF</span>
              ` : ''}
            </div>
            <button class="add-to-cart-btn w-full py-2.5 bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg hover:bg-primary active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xs" data-id="${id}">
              <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  async function loadProducts(targetContainerId = 'product-grid', queryParams = {}) {
    const container = document.getElementById(targetContainerId);
    if (!container) return [];

    try {
      const searchParams = new URLSearchParams(queryParams).toString();
      const res = await window.apiRequest(`/products${searchParams ? `?${searchParams}` : ''}`);

      if (res && res.success && res.data.products) {
        productsCache = res.data.products;
        if (productsCache.length === 0) {
          container.innerHTML = `
            <div class="col-span-full py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[40px] text-stone-300">search_off</span>
              <p class="font-headline-sm text-headline-sm text-primary">No products found</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant">Try refining your search or select another category.</p>
            </div>
          `;
        } else {
          container.innerHTML = productsCache.map(createProductCardHTML).join('');
          window.WishlistManager?.updateWishlistUI();
        }
        return productsCache;
      }
    } catch (e) {
      console.warn('[Products] Error loading products from server, preserving DOM fallback', e);
    }
    return [];
  }

  return {
    loadProducts,
    createProductCardHTML,
    getCache: () => productsCache
  };
})();

window.ProductService = ProductService;
