/* ========== SwiftCart E-Commerce — Full App ========== */
'use strict';

/* ========== SECURITY UTILITIES ========== */
const Security = {
  sanitize(str) {
    if (typeof str !== 'string') return str;
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  },
  sanitizeInput(str) {
    return str.replace(/<[^>]*>/g, '').trim();
  },
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

/* ========== STATE ========== */
const State = {
  allProducts: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem('swiftcart_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('swiftcart_wishlist') || '[]'),
  compare: JSON.parse(localStorage.getItem('swiftcart_compare') || '[]'),
  recentlyViewed: JSON.parse(localStorage.getItem('swiftcart_recent') || '[]'),
  orders: JSON.parse(localStorage.getItem('swiftcart_orders') || '[]'),
  reviews: JSON.parse(localStorage.getItem('swiftcart_reviews') || '{}'),
  user: JSON.parse(localStorage.getItem('swiftcart_user') || 'null'),
  darkMode: localStorage.getItem('swiftcart_darkmode') === 'true',
  coupon: null,
  currentCategory: 'all',
  currentSort: 'default',
  currentView: 'grid',
  maxPrice: 1000,
  currentProduct: null,
  modalQty: 1,
  checkoutStep: 1,
  reviewRating: 0,
  productsPerPage: 8,
  productsShown: 8
};

const API_BASE = 'https://fakestoreapi.com';
const COUPONS = {
  'SWIFT20': { type: 'percent', value: 20, desc: '20% off' },
  'WELCOME10': { type: 'percent', value: 10, desc: '10% off' },
  'FREE': { type: 'shipping', value: 0, desc: 'Free shipping' },
  'SAVE5': { type: 'fixed', value: 5, desc: '$5 off' }
};
const TAX_RATE = 0.08;

/* ========== UTILITY ========== */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatCurrency(n) { return '$' + Number(n).toFixed(2); }

function generateOrderId() {
  return '#SW-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

/* ========== TOAST ========== */
function showToast(message, type = 'success', duration = 3000) {
  const container = $('#toastContainer');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Security.sanitize(message)}</span><span class="toast-close">&times;</span>`;
  container.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(60px)'; setTimeout(() => toast.remove(), 300); }, duration);
}

/* ========== SAVE STATE ========== */
function saveState(key, data) {
  try { localStorage.setItem('swiftcart_' + key, JSON.stringify(data)); } catch (e) { console.warn('Storage full'); }
}

/* ========== DARK MODE ========== */
function initDarkMode() {
  if (State.darkMode) document.body.classList.add('dark-mode');
  const icon = $('#darkModeToggle i');
  if (icon) icon.className = State.darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  $('#darkModeToggle').addEventListener('click', () => {
    State.darkMode = !State.darkMode;
    document.body.classList.toggle('dark-mode', State.darkMode);
    saveState('darkmode', State.darkMode);
    icon.className = State.darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    showToast(State.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
  });
}

/* ========== ANNOUNCEMENT BAR ========== */
function initAnnouncement() {
  const bar = $('#announcementBar');
  const closeBtn = $('#announcementClose');
  if (sessionStorage.getItem('swiftcart_announce_closed')) { bar.classList.add('hidden'); return; }
  closeBtn.addEventListener('click', () => { bar.classList.add('hidden'); sessionStorage.setItem('swiftcart_announce_closed', 'true'); });
}

/* ========== FLASH TIMER ========== */
function initFlashTimer() {
  let timeLeft = 2 * 60 * 60; // 2 hours
  const timerEl = $('#flashTimer');
  function updateTimer() {
    const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
    const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;
    if ($('#countHours')) $('#countHours').textContent = h;
    if ($('#countMinutes')) $('#countMinutes').textContent = m;
    if ($('#countSeconds')) $('#countSeconds').textContent = s;
    if (timeLeft > 0) timeLeft--;
  }
  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ========== NAVBAR ========== */
function initNavbar() {
  const navbar = $('#navbar');
  const menuBtn = $('#mobileMenuBtn');
  const menu = $('#navMenu');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    const scrollBtn = $('#scrollTopBtn');
    if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 400);
  });
  menuBtn.addEventListener('click', () => {
    menu.classList.toggle('active');
    menuBtn.setAttribute('aria-expanded', menu.classList.contains('active'));
  });
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      $$('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      menu.classList.remove('active');
    });
  });
}

/* ========== SEARCH ========== */
function initSearch() {
  const input = $('#searchInput');
  const results = $('#searchResults');
  const clearBtn = $('#searchClear');
  const search = debounce((query) => {
    query = query.toLowerCase().trim();
    if (!query) { results.style.display = 'none'; clearBtn.style.display = 'none'; return; }
    clearBtn.style.display = 'block';
    const matches = State.allProducts.filter(p =>
      p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    ).slice(0, 8);
    if (matches.length === 0) {
      results.innerHTML = '<div class="search-no-results">No products found</div>';
    } else {
      results.innerHTML = matches.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <img src="${Security.sanitize(p.image)}" alt="${Security.sanitize(p.title)}" loading="lazy" />
          <div class="sr-info"><div class="sr-name">${Security.sanitize(p.title)}</div><div class="sr-price">${formatCurrency(p.price)}</div></div>
        </div>`).join('');
    }
    results.style.display = 'block';
  }, 250);
  input.addEventListener('input', () => search(input.value));
  clearBtn.addEventListener('click', () => { input.value = ''; results.style.display = 'none'; clearBtn.style.display = 'none'; });
  results.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) { openProductModal(parseInt(item.dataset.id)); results.style.display = 'none'; input.value = ''; clearBtn.style.display = 'none'; }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-bar')) results.style.display = 'none'; });
}

/* ========== FETCH PRODUCTS ========== */
async function fetchProducts() {
  try {
    const [products, categories] = await Promise.all([
      fetch(`${API_BASE}/products`).then(r => { if (!r.ok) throw new Error('API Error'); return r.json(); }),
      fetch(`${API_BASE}/products/categories`).then(r => r.json())
    ]);
    State.allProducts = products;
    State.filteredProducts = [...products];
    renderCategories(categories);
    renderProducts();
    renderDeals(products);
    renderTrending(products);
    renderRecentlyViewed();
    $('#spinner').style.display = 'none';
  } catch (error) {
    console.error('Failed to fetch products:', error);
    $('#spinner').innerHTML = '<p style="text-align:center;color:var(--danger);padding:40px">Failed to load products. Please refresh.</p>';
    showToast('Failed to load products', 'error');
  }
}

/* ========== RENDER CATEGORIES ========== */
function renderCategories(categories) {
  const container = $('#categoryContainer');
  container.innerHTML = '<button class="category-btn active" data-category="all">All</button>';
  categories.forEach(cat => {
    container.innerHTML += `<button class="category-btn" data-category="${Security.sanitize(cat)}">${Security.sanitize(cat)}</button>`;
  });
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    $$('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    State.currentCategory = btn.dataset.category;
    State.productsShown = State.productsPerPage;
    applyFilters();
  });
}

/* ========== FILTERS & SORTING ========== */
function applyFilters() {
  let products = [...State.allProducts];
  if (State.currentCategory !== 'all') products = products.filter(p => p.category === State.currentCategory);
  products = products.filter(p => p.price <= State.maxPrice);
  switch (State.currentSort) {
    case 'price-low': products.sort((a, b) => a.price - b.price); break;
    case 'price-high': products.sort((a, b) => b.price - a.price); break;
    case 'rating-high': products.sort((a, b) => b.rating.rate - a.rating.rate); break;
    case 'rating-low': products.sort((a, b) => a.rating.rate - b.rating.rate); break;
    case 'name-az': products.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'name-za': products.sort((a, b) => b.title.localeCompare(a.title)); break;
  }
  State.filteredProducts = products;
  renderProducts();
}

function initFilters() {
  $('#sortSelect').addEventListener('change', (e) => { State.currentSort = e.target.value; State.productsShown = State.productsPerPage; applyFilters(); });
  const range = $('#priceRange');
  const label = $('#priceMaxLabel');
  range.addEventListener('input', () => { State.maxPrice = parseInt(range.value); label.textContent = range.value; });
  range.addEventListener('change', () => { State.productsShown = State.productsPerPage; applyFilters(); });
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.currentView = btn.dataset.view;
      const grid = $('#productsGrid');
      grid.classList.toggle('list-view', State.currentView === 'list');
    });
  });
  $('#loadMoreBtn').addEventListener('click', () => {
    State.productsShown += State.productsPerPage;
    renderProducts();
  });
}

/* ========== RENDER PRODUCTS ========== */
function renderProducts() {
  const grid = $('#productsGrid');
  const products = State.filteredProducts;
  const visible = products.slice(0, State.productsShown);
  $('#productCount').textContent = `Showing ${visible.length} of ${products.length} products`;
  const loadMore = $('#loadMoreBtn');
  loadMore.style.display = State.productsShown < products.length ? 'inline-flex' : 'none';
  grid.innerHTML = visible.map(p => createProductCard(p)).join('');
  attachProductCardEvents(grid);
}

function createProductCard(p) {
  const inWishlist = State.wishlist.some(w => w.id === p.id);
  const inCompare = State.compare.some(c => c.id === p.id);
  const stars = renderStarsHTML(p.rating.rate);
  const badges = [];
  if (p.rating.rate >= 4.5) badges.push('<span class="badge-item badge-hot">HOT</span>');
  if (p.price < 20) badges.push('<span class="badge-item badge-sale">SALE</span>');
  return `
    <div class="product-card" data-id="${p.id}">
      ${badges.length ? `<div class="product-badges">${badges.join('')}</div>` : ''}
      <div class="product-actions-overlay">
        <button class="wishlist-toggle ${inWishlist ? 'active' : ''}" data-id="${p.id}" title="Wishlist"><i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i></button>
        <button class="compare-toggle ${inCompare ? 'active' : ''}" data-id="${p.id}" title="Compare"><i class="fa-solid fa-code-compare"></i></button>
        <button class="quick-view" data-id="${p.id}" title="Quick View"><i class="fa-solid fa-eye"></i></button>
      </div>
      <div class="product-img"><img src="${Security.sanitize(p.image)}" alt="${Security.sanitize(p.title)}" loading="lazy" /></div>
      <div class="product-info">
        <div class="product-category">${Security.sanitize(p.category)}</div>
        <h3 class="product-title">${Security.sanitize(p.title)}</h3>
        <div class="product-rating"><span class="stars">${stars}</span><span class="rating-text">${p.rating.rate} (${p.rating.count})</span></div>
        <div class="product-bottom">
          <span class="product-price">${formatCurrency(p.price)}</span>
          <button class="add-to-cart-btn" data-id="${p.id}" title="Add to Cart"><i class="fa-solid fa-cart-plus"></i></button>
        </div>
      </div>
    </div>`;
}

function attachProductCardEvents(container) {
  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(parseInt(btn.dataset.id)); });
  });
  container.querySelectorAll('.wishlist-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(parseInt(btn.dataset.id)); });
  });
  container.querySelectorAll('.compare-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleCompare(parseInt(btn.dataset.id)); });
  });
  container.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openProductModal(parseInt(btn.dataset.id)); });
  });
  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(parseInt(card.dataset.id)));
  });
}

function renderStarsHTML(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<i class="fa-solid fa-star"></i>';
    else if (rating >= i - 0.5) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

/* ========== DEALS ========== */
function renderDeals(products) {
  const deals = products.filter(p => p.price > 50).slice(0, 4);
  const grid = $('#dealsGrid');
  grid.innerHTML = deals.map(p => {
    const discount = Math.floor(Math.random() * 30) + 15;
    const original = (p.price / (1 - discount / 100)).toFixed(2);
    return `
    <div class="deal-card" data-id="${p.id}">
      <span class="deal-badge">-${discount}%</span>
      <div class="product-img"><img src="${Security.sanitize(p.image)}" alt="${Security.sanitize(p.title)}" loading="lazy" /></div>
      <div class="deal-info">
        <div class="deal-title">${Security.sanitize(p.title)}</div>
        <div class="deal-prices"><span class="deal-original">${formatCurrency(original)}</span><span class="deal-price">${formatCurrency(p.price)}</span></div>
      </div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.deal-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(parseInt(card.dataset.id)));
  });
}

/* ========== TRENDING ========== */
function renderTrending(products) {
  const trending = [...products].sort((a, b) => b.rating.rate - a.rating.rate).slice(0, 4);
  const grid = $('#trendingProducts');
  grid.innerHTML = trending.map(p => createProductCard(p)).join('');
  attachProductCardEvents(grid);
}

/* ========== CART ========== */
function addToCart(productId, qty = 1) {
  const product = State.allProducts.find(p => p.id === productId);
  if (!product) return;
  const existing = State.cart.find(item => item.id === productId);
  if (existing) { existing.qty += qty; } else { State.cart.push({ ...product, qty }); }
  saveState('cart', State.cart);
  updateCartUI();
  showToast(`${product.title.substring(0, 30)}... added to cart`, 'success');
}

function removeFromCart(productId) {
  State.cart = State.cart.filter(item => item.id !== productId);
  saveState('cart', State.cart);
  updateCartUI();
  renderCartItems();
}

function updateCartQty(productId, delta) {
  const item = State.cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId); return; }
  saveState('cart', State.cart);
  updateCartUI();
  renderCartItems();
}

function getCartTotals() {
  const subtotal = State.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discount = 0;
  if (State.coupon) {
    if (State.coupon.type === 'percent') discount = subtotal * (State.coupon.value / 100);
    else if (State.coupon.type === 'fixed') discount = State.coupon.value;
  }
  const afterDiscount = subtotal - discount;
  const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked');
  let shipping = 0;
  if (State.coupon && State.coupon.type === 'shipping') shipping = 0;
  else if (subtotal >= 50) shipping = 0;
  else if (shippingMethod) {
    if (shippingMethod.value === 'express') shipping = 9.99;
    else if (shippingMethod.value === 'overnight') shipping = 19.99;
    else shipping = subtotal < 50 ? 4.99 : 0;
  } else { shipping = subtotal < 50 ? 4.99 : 0; }
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;
  return { subtotal, discount, shipping, tax, total };
}

function updateCartUI() {
  const totalItems = State.cart.reduce((sum, item) => sum + item.qty, 0);
  $('#cartCount').textContent = totalItems;
  const totals = getCartTotals();
  $('#cartSubtotal').textContent = formatCurrency(totals.subtotal);
  const discountRow = $('#discountRow');
  if (totals.discount > 0) { discountRow.style.display = 'flex'; $('#cartDiscount').textContent = '-' + formatCurrency(totals.discount); }
  else { discountRow.style.display = 'none'; }
  $('#cartShipping').textContent = totals.shipping === 0 ? 'Free' : formatCurrency(totals.shipping);
  $('#cartTax').textContent = formatCurrency(totals.tax);
  $('#cartTotal').textContent = formatCurrency(totals.total);
}

function renderCartItems() {
  const container = $('#cartItems');
  if (State.cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty</p></div>';
    return;
  }
  container.innerHTML = State.cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-image"><img src="${Security.sanitize(item.image)}" alt="${Security.sanitize(item.title)}" loading="lazy" /></div>
      <div class="cart-item-info">
        <div class="cart-item-title">${Security.sanitize(item.title)}</div>
        <div class="cart-item-price">${formatCurrency(item.price * item.qty)}</div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" data-id="${item.id}" data-action="minus">−</button>
          <span class="cart-qty">${item.qty}</span>
          <button class="cart-qty-btn" data-id="${item.id}" data-action="plus">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('');
  container.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => updateCartQty(parseInt(btn.dataset.id), btn.dataset.action === 'plus' ? 1 : -1));
  });
  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

function initCart() {
  const overlay = $('#cartOverlay');
  const sidebar = $('#cartSidebar');
  $('#cartIcon').addEventListener('click', () => { overlay.classList.add('active'); renderCartItems(); });
  $('#cartClose').addEventListener('click', () => overlay.classList.remove('active'));
  $('#continueShoppingBtn').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  updateCartUI();

  // Coupon
  $('#applyCouponBtn').addEventListener('click', () => {
    const code = $('#couponInput').value.trim().toUpperCase();
    const msg = $('#couponMessage');
    if (COUPONS[code]) {
      State.coupon = COUPONS[code];
      msg.textContent = `Coupon applied: ${COUPONS[code].desc}`;
      msg.className = 'coupon-message success';
      showToast('Coupon applied!', 'success');
    } else {
      State.coupon = null;
      msg.textContent = 'Invalid coupon code';
      msg.className = 'coupon-message error';
      showToast('Invalid coupon code', 'error');
    }
    updateCartUI();
  });
}

/* ========== WISHLIST ========== */
function toggleWishlist(productId) {
  const product = State.allProducts.find(p => p.id === productId);
  if (!product) return;
  const idx = State.wishlist.findIndex(w => w.id === productId);
  if (idx >= 0) { State.wishlist.splice(idx, 1); showToast('Removed from wishlist', 'info'); }
  else { State.wishlist.push(product); showToast('Added to wishlist', 'success'); }
  saveState('wishlist', State.wishlist);
  updateWishlistUI();
  renderProducts();
  renderTrending(State.allProducts);
}

function updateWishlistUI() { $('#wishlistCount').textContent = State.wishlist.length; }

function renderWishlistItems() {
  const container = $('#wishlistItems');
  if (State.wishlist.length === 0) { container.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-heart"></i><p>Your wishlist is empty</p></div>'; return; }
  container.innerHTML = State.wishlist.map(item => `
    <div class="wishlist-item" data-id="${item.id}">
      <div class="wishlist-item-image"><img src="${Security.sanitize(item.image)}" alt="${Security.sanitize(item.title)}" loading="lazy" /></div>
      <div class="wishlist-item-info"><div class="wishlist-item-title">${Security.sanitize(item.title)}</div><div class="wishlist-item-price">${formatCurrency(item.price)}</div></div>
      <div class="wishlist-item-actions">
        <button class="wishlist-add-cart" data-id="${item.id}" title="Add to Cart"><i class="fa-solid fa-cart-plus"></i></button>
        <button class="wishlist-remove" data-id="${item.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>`).join('');
  container.querySelectorAll('.wishlist-add-cart').forEach(btn => {
    btn.addEventListener('click', () => { addToCart(parseInt(btn.dataset.id)); });
  });
  container.querySelectorAll('.wishlist-remove').forEach(btn => {
    btn.addEventListener('click', () => { toggleWishlist(parseInt(btn.dataset.id)); renderWishlistItems(); });
  });
}

function initWishlist() {
  const overlay = $('#wishlistOverlay');
  $('#wishlistIcon').addEventListener('click', () => { overlay.classList.add('active'); renderWishlistItems(); });
  $('#wishlistClose').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  $('#addAllWishlistToCart').addEventListener('click', () => {
    if (State.wishlist.length === 0) { showToast('Wishlist is empty', 'warning'); return; }
    State.wishlist.forEach(item => addToCart(item.id));
    showToast('All items added to cart!', 'success');
  });
  updateWishlistUI();
}

/* ========== COMPARE ========== */
function toggleCompare(productId) {
  const product = State.allProducts.find(p => p.id === productId);
  if (!product) return;
  const idx = State.compare.findIndex(c => c.id === productId);
  if (idx >= 0) { State.compare.splice(idx, 1); showToast('Removed from compare', 'info'); }
  else {
    if (State.compare.length >= 4) { showToast('Max 4 products to compare', 'warning'); return; }
    State.compare.push(product);
    showToast('Added to compare', 'success');
  }
  saveState('compare', State.compare);
  updateCompareUI();
  renderProducts();
  renderTrending(State.allProducts);
}

function updateCompareUI() { $('#compareCount').textContent = State.compare.length; }

function renderCompareBody() {
  const body = $('#compareBody');
  if (State.compare.length === 0) { body.innerHTML = '<p class="compare-empty">Add products to compare.</p>'; return; }
  const rows = [
    { label: 'Image', render: p => `<img src="${Security.sanitize(p.image)}" alt="" />` },
    { label: 'Name', render: p => Security.sanitize(p.title) },
    { label: 'Price', render: p => `<strong>${formatCurrency(p.price)}</strong>` },
    { label: 'Rating', render: p => `${renderStarsHTML(p.rating.rate)} (${p.rating.count})` },
    { label: 'Category', render: p => Security.sanitize(p.category) },
    { label: '', render: p => `<button class="compare-remove-btn" data-id="${p.id}">Remove</button>` }
  ];
  body.innerHTML = `<table class="compare-table"><thead><tr><th></th>${State.compare.map(() => '<th></th>').join('')}</tr></thead><tbody>${rows.map(r => `<tr><th>${r.label}</th>${State.compare.map(p => `<td>${r.render(p)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  body.querySelectorAll('.compare-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => { toggleCompare(parseInt(btn.dataset.id)); renderCompareBody(); });
  });
}

function initCompare() {
  const overlay = $('#compareOverlay');
  $('#compareIcon').addEventListener('click', () => { overlay.classList.add('active'); renderCompareBody(); });
  $('#compareClose').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
  updateCompareUI();
}

/* ========== PRODUCT MODAL ========== */
function openProductModal(productId) {
  const product = State.allProducts.find(p => p.id === productId);
  if (!product) return;
  State.currentProduct = product;
  State.modalQty = 1;
  $('#modalImage').src = product.image;
  $('#modalImage').alt = product.title;
  $('#modalCategory').textContent = product.category;
  $('#modalCategoryBread').textContent = product.category;
  $('#modalTitle').textContent = product.title;
  $('#modalPrice').textContent = formatCurrency(product.price);
  const origPrice = (product.price * 1.3).toFixed(2);
  $('#modalOriginalPrice').textContent = formatCurrency(origPrice);
  $('#modalDescription').textContent = product.description;
  $('#modalRating').innerHTML = `<span class="stars">${renderStarsHTML(product.rating.rate)}</span><span class="rating-info">${product.rating.rate} / 5 (${product.rating.count} reviews)</span>`;
  $('#modalQtyValue').textContent = '1';
  $('#modalStock').innerHTML = product.rating.count > 10 ? '<i class="fa-solid fa-circle-check"></i> In Stock' : '<i class="fa-solid fa-clock"></i> Low Stock';
  // Wishlist / Compare btn state
  const inWish = State.wishlist.some(w => w.id === productId);
  $('#modalWishlistBtn').innerHTML = `<i class="fa-${inWish ? 'solid' : 'regular'} fa-heart"></i>`;
  // Reviews
  renderModalReviews(productId);
  // Recently viewed
  addToRecentlyViewed(product);
  $('#modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  $('#modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function initProductModal() {
  $('#modalClose').addEventListener('click', closeProductModal);
  $('#modalOverlay').addEventListener('click', (e) => { if (e.target === $('#modalOverlay')) closeProductModal(); });
  $('#modalQtyMinus').addEventListener('click', () => {
    if (State.modalQty > 1) { State.modalQty--; $('#modalQtyValue').textContent = State.modalQty; }
  });
  $('#modalQtyPlus').addEventListener('click', () => {
    if (State.modalQty < 10) { State.modalQty++; $('#modalQtyValue').textContent = State.modalQty; }
  });
  $('#modalCartBtn').addEventListener('click', () => {
    if (State.currentProduct) { addToCart(State.currentProduct.id, State.modalQty); closeProductModal(); }
  });
  $('#modalWishlistBtn').addEventListener('click', () => {
    if (State.currentProduct) { toggleWishlist(State.currentProduct.id); const inWish = State.wishlist.some(w => w.id === State.currentProduct.id); $('#modalWishlistBtn').innerHTML = `<i class="fa-${inWish ? 'solid' : 'regular'} fa-heart"></i>`; }
  });
  $('#modalCompareBtn').addEventListener('click', () => {
    if (State.currentProduct) toggleCompare(State.currentProduct.id);
  });
  $('#modalShareBtn').addEventListener('click', () => {
    if (!State.currentProduct) return;
    const text = `${State.currentProduct.title} - ${formatCurrency(State.currentProduct.price)} at SwiftCart`;
    if (navigator.share) { navigator.share({ title: 'SwiftCart', text, url: window.location.href }); }
    else { navigator.clipboard.writeText(text).then(() => showToast('Link copied!', 'info')); }
  });
  // Image zoom
  $('#modalZoom').addEventListener('click', () => {
    if (State.currentProduct) { $('#zoomImage').src = State.currentProduct.image; $('#zoomOverlay').classList.add('active'); }
  });
  $('#modalImage').addEventListener('click', () => {
    if (State.currentProduct) { $('#zoomImage').src = State.currentProduct.image; $('#zoomOverlay').classList.add('active'); }
  });
  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      $('#cartOverlay').classList.remove('active');
      $('#wishlistOverlay').classList.remove('active');
      $('#compareOverlay').classList.remove('active');
      $('#checkoutOverlay').classList.remove('active');
      $('#authOverlay').classList.remove('active');
      $('#ordersOverlay').classList.remove('active');
      $('#zoomOverlay').classList.remove('active');
      $('#successOverlay').classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ========== IMAGE ZOOM ========== */
function initImageZoom() {
  $('#zoomClose').addEventListener('click', () => $('#zoomOverlay').classList.remove('active'));
  $('#zoomOverlay').addEventListener('click', (e) => { if (e.target === $('#zoomOverlay')) $('#zoomOverlay').classList.remove('active'); });
}

/* ========== REVIEWS ========== */
function renderModalReviews(productId) {
  const reviews = State.reviews[productId] || [];
  const list = $('#modalReviews');
  const count = $('#modalReviewCount');
  count.textContent = `(${reviews.length})`;
  if (reviews.length === 0) { list.innerHTML = '<p class="no-reviews">No reviews yet. Be the first!</p>'; }
  else {
    list.innerHTML = reviews.map(r => `
      <div class="review-item">
        <div class="review-header"><span class="review-author">${Security.sanitize(r.author)}</span><span class="review-date">${r.date}</span></div>
        <div class="review-stars">${renderStarsHTML(r.rating)}</div>
        <div class="review-text">${Security.sanitize(r.text)}</div>
      </div>`).join('');
  }
  // Review form state
  State.reviewRating = 0;
  $$('#reviewFormStars i').forEach(star => star.className = 'fa-regular fa-star');
  $('#reviewText').value = '';
  $('#addReviewSection').style.display = 'none';
}

function initReviews() {
  const stars = $$('#reviewFormStars i');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      State.reviewRating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => { s.className = i < State.reviewRating ? 'fa-solid fa-star active' : 'fa-regular fa-star'; });
    });
    star.addEventListener('mouseenter', () => {
      const r = parseInt(star.dataset.rating);
      stars.forEach((s, i) => { s.className = i < r ? 'fa-solid fa-star' : 'fa-regular fa-star'; });
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => { s.className = i < State.reviewRating ? 'fa-solid fa-star active' : 'fa-regular fa-star'; });
    });
  });
  $('#toggleReviewForm').addEventListener('click', () => {
    if (!State.user) { showToast('Please login to write a review', 'warning'); openAuth(); return; }
    const section = $('#addReviewSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
  });
  $('#submitReviewBtn').addEventListener('click', () => {
    if (!State.currentProduct) return;
    if (State.reviewRating === 0) { showToast('Please select a rating', 'warning'); return; }
    const text = Security.sanitizeInput($('#reviewText').value);
    if (!text || text.length < 5) { showToast('Review must be at least 5 characters', 'warning'); return; }
    const review = { author: State.user ? State.user.firstName : 'Anonymous', rating: State.reviewRating, text, date: new Date().toLocaleDateString() };
    if (!State.reviews[State.currentProduct.id]) State.reviews[State.currentProduct.id] = [];
    State.reviews[State.currentProduct.id].unshift(review);
    saveState('reviews', State.reviews);
    renderModalReviews(State.currentProduct.id);
    showToast('Review submitted!', 'success');
  });
}

/* ========== RECENTLY VIEWED ========== */
function addToRecentlyViewed(product) {
  State.recentlyViewed = State.recentlyViewed.filter(p => p.id !== product.id);
  State.recentlyViewed.unshift(product);
  if (State.recentlyViewed.length > 10) State.recentlyViewed = State.recentlyViewed.slice(0, 10);
  saveState('recent', State.recentlyViewed);
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const section = $('#recentlyViewed');
  const grid = $('#recentlyViewedGrid');
  if (State.recentlyViewed.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  grid.innerHTML = State.recentlyViewed.slice(0, 5).map(p => createProductCard(p)).join('');
  attachProductCardEvents(grid);
}

/* ========== CHECKOUT ========== */
function initCheckout() {
  const overlay = $('#checkoutOverlay');
  $('#checkoutBtn').addEventListener('click', () => {
    if (State.cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    $('#cartOverlay').classList.remove('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    goToCheckoutStep(1);
  });
  $('#checkoutClose').addEventListener('click', () => { overlay.classList.remove('active'); document.body.style.overflow = ''; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }});

  // Step 1: Shipping
  $('#shippingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('#shippingForm').checkValidity()) { showToast('Please fill all required fields', 'error'); return; }
    goToCheckoutStep(2);
  });

  // Step 2: Payment
  $('#paymentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (method === 'card') {
      if (!$('#cardNumber').value || !$('#cardExpiry').value || !$('#cardCVV').value || !$('#cardName').value) {
        showToast('Please fill card details', 'error'); return;
      }
    }
    populateOrderReview();
    goToCheckoutStep(3);
  });

  // Payment method toggle
  $$('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      $$('.payment-method').forEach(m => m.classList.remove('active'));
      radio.closest('.payment-method').classList.add('active');
      $('#cardPaymentFields').style.display = radio.value === 'card' ? 'block' : 'none';
    });
  });

  // Shipping method change
  $$('input[name="shippingMethod"]').forEach(radio => {
    radio.addEventListener('change', () => updateCartUI());
  });

  // Card number formatting
  $('#cardNumber').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  // Expiry formatting
  $('#cardExpiry').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
    e.target.value = v;
  });

  // Navigation
  $('#backToShipping').addEventListener('click', () => goToCheckoutStep(1));
  $('#backToPayment').addEventListener('click', () => goToCheckoutStep(2));

  // Place Order
  $('#placeOrderBtn').addEventListener('click', placeOrder);
}

function goToCheckoutStep(step) {
  State.checkoutStep = step;
  $$('.checkout-step').forEach(s => s.classList.remove('active'));
  $(`#checkoutStep${step}`).classList.add('active');
  $$('.progress-step').forEach(s => {
    const sStep = parseInt(s.dataset.step);
    s.classList.toggle('active', sStep === step);
    s.classList.toggle('completed', sStep < step);
  });
}

function populateOrderReview() {
  const shipping = `${$('#shipFirstName').value} ${$('#shipLastName').value}<br>${$('#shipAddress').value}, ${$('#shipCity').value} ${$('#shipZip').value}<br>${$('#shipEmail').value} | ${$('#shipPhone').value}`;
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const paymentText = method === 'card' ? `Card ending in ${$('#cardNumber').value.slice(-4)}` : method === 'paypal' ? 'PayPal' : 'Cash on Delivery';
  $('#reviewShipping').innerHTML = `<p>${shipping}</p>`;
  $('#reviewPayment').innerHTML = `<p>${paymentText}</p>`;
  $('#reviewItemCount').textContent = State.cart.reduce((s, i) => s + i.qty, 0);
  $('#reviewItems').innerHTML = State.cart.map(item => `<div class="review-item-row"><span>${Security.sanitize(item.title.substring(0, 40))}... x${item.qty}</span><span>${formatCurrency(item.price * item.qty)}</span></div>`).join('');
  const totals = getCartTotals();
  $('#reviewTotals').innerHTML = `
    <div class="cart-summary-row"><span>Subtotal:</span><span>${formatCurrency(totals.subtotal)}</span></div>
    ${totals.discount > 0 ? `<div class="cart-summary-row"><span>Discount:</span><span class="discount-amount">-${formatCurrency(totals.discount)}</span></div>` : ''}
    <div class="cart-summary-row"><span>Shipping:</span><span>${totals.shipping === 0 ? 'Free' : formatCurrency(totals.shipping)}</span></div>
    <div class="cart-summary-row"><span>Tax (8%):</span><span>${formatCurrency(totals.tax)}</span></div>
    <div class="cart-summary-row total"><span>Total:</span><span>${formatCurrency(totals.total)}</span></div>`;
}

function placeOrder() {
  const totals = getCartTotals();
  const orderId = generateOrderId();
  const order = {
    id: orderId,
    date: new Date().toLocaleDateString(),
    items: [...State.cart],
    totals,
    shipping: { name: `${$('#shipFirstName').value} ${$('#shipLastName').value}`, address: $('#shipAddress').value, city: $('#shipCity').value, zip: $('#shipZip').value, email: $('#shipEmail').value, phone: $('#shipPhone').value },
    payment: document.querySelector('input[name="paymentMethod"]:checked').value,
    status: 'processing'
  };
  State.orders.unshift(order);
  saveState('orders', State.orders);
  // Clear cart
  State.cart = [];
  State.coupon = null;
  saveState('cart', State.cart);
  updateCartUI();
  // Close checkout, show success
  $('#checkoutOverlay').classList.remove('active');
  $('#orderNumber').textContent = orderId;
  $('#successOverlay').classList.add('active');
  showToast('Order placed successfully!', 'success');
}

function initOrderSuccess() {
  $('#viewOrderBtn').addEventListener('click', () => { $('#successOverlay').classList.remove('active'); openOrders(); });
  $('#continueShopping2').addEventListener('click', () => { $('#successOverlay').classList.remove('active'); document.body.style.overflow = ''; });
}

/* ========== ORDER HISTORY ========== */
function openOrders() {
  renderOrders();
  $('#ordersOverlay').classList.add('active');
}

function renderOrders() {
  const list = $('#ordersList');
  if (State.orders.length === 0) { list.innerHTML = '<div class="no-orders"><i class="fa-solid fa-clock-rotate-left"></i><p>No orders yet</p></div>'; return; }
  const statusClasses = { processing: 'status-processing', shipped: 'status-shipped', delivered: 'status-delivered' };
  list.innerHTML = State.orders.map(o => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-id">${Security.sanitize(o.id)}</span>
        <span class="order-status ${statusClasses[o.status] || 'status-processing'}">${o.status.toUpperCase()}</span>
      </div>
      <div class="order-card-body">
        <p><strong>Date:</strong> ${o.date}</p>
        <p><strong>Total:</strong> ${formatCurrency(o.totals.total)}</p>
        <p><strong>Items:</strong> ${o.items.reduce((s, i) => s + i.qty, 0)}</p>
        <div class="order-items-list">${o.items.map(i => `<div class="oi-item"><span>${Security.sanitize(i.title.substring(0, 45))}... x${i.qty}</span><span>${formatCurrency(i.price * i.qty)}</span></div>`).join('')}</div>
      </div>
    </div>`).join('');
}

function initOrders() {
  $('#ordersClose').addEventListener('click', () => { $('#ordersOverlay').classList.remove('active'); document.body.style.overflow = ''; });
  $('#ordersOverlay').addEventListener('click', (e) => { if (e.target === $('#ordersOverlay')) { $('#ordersOverlay').classList.remove('active'); document.body.style.overflow = ''; }});
}

/* ========== AUTH ========== */
function openAuth() {
  const overlay = $('#authOverlay');
  if (State.user) {
    $('#loginForm').style.display = 'none';
    $('#registerForm').style.display = 'none';
    $$('.auth-tab').forEach(t => t.style.display = 'none');
    $('#userProfile').style.display = 'block';
    $('#profileAvatar').textContent = (State.user.firstName[0] + State.user.lastName[0]).toUpperCase();
    $('#profileName').textContent = `${State.user.firstName} ${State.user.lastName}`;
    $('#profileEmail').textContent = State.user.email;
  } else {
    $$('.auth-tab').forEach(t => t.style.display = 'block');
    $$('.auth-tab')[0].click();
    $('#userProfile').style.display = 'none';
  }
  overlay.classList.add('active');
}

function initAuth() {
  const overlay = $('#authOverlay');
  $('#userIcon').addEventListener('click', openAuth);
  $('#authClose').addEventListener('click', () => { overlay.classList.remove('active'); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });

  // Tabs
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') { $('#loginForm').style.display = 'block'; $('#registerForm').style.display = 'none'; }
      else { $('#loginForm').style.display = 'none'; $('#registerForm').style.display = 'block'; }
    });
  });

  // Login
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = Security.sanitizeInput($('#loginEmail').value);
    const password = $('#loginPassword').value;
    if (!Security.validateEmail(email)) { showToast('Please enter a valid email', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    // Simulate login
    State.user = { firstName: email.split('@')[0], lastName: 'User', email };
    saveState('user', State.user);
    showToast('Logged in successfully!', 'success');
    overlay.classList.remove('active');
    updateAuthUI();
  });

  // Register
  $('#registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const first = Security.sanitizeInput($('#regFirstName').value);
    const last = Security.sanitizeInput($('#regLastName').value);
    const email = Security.sanitizeInput($('#regEmail').value);
    const pass = $('#regPassword').value;
    const confirm = $('#regConfirmPassword').value;
    if (!Security.validateEmail(email)) { showToast('Invalid email', 'error'); return; }
    if (pass.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (pass !== confirm) { showToast('Passwords do not match', 'error'); return; }
    if (!$('#agreeTerms').checked) { showToast('Please agree to terms', 'error'); return; }
    State.user = { firstName: first, lastName: last, email };
    saveState('user', State.user);
    showToast('Account created successfully!', 'success');
    overlay.classList.remove('active');
    updateAuthUI();
  });

  // Password strength
  $('#regPassword').addEventListener('input', (e) => {
    const val = e.target.value;
    const bar = $('#passwordStrength');
    let strength = '';
    if (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) strength = 'strength-strong';
    else if (val.length >= 6 && (/[A-Z]/.test(val) || /[0-9]/.test(val))) strength = 'strength-medium';
    else if (val.length > 0) strength = 'strength-weak';
    bar.innerHTML = `<div class="strength-bar ${strength}"></div>`;
  });

  // Password visibility
  $$('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');
      if (input.type === 'password') { input.type = 'text'; icon.className = 'fa-solid fa-eye-slash'; }
      else { input.type = 'password'; icon.className = 'fa-solid fa-eye'; }
    });
  });

  // Social login stubs
  $$('.btn-social').forEach(btn => {
    btn.addEventListener('click', () => showToast('Social login coming soon!', 'info'));
  });

  // Forgot password
  $('.forgot-link').addEventListener('click', (e) => { e.preventDefault(); showToast('Password reset link sent!', 'info'); });

  // Profile menu
  $('#logoutBtn').addEventListener('click', () => {
    State.user = null;
    saveState('user', null);
    showToast('Logged out', 'info');
    overlay.classList.remove('active');
    updateAuthUI();
  });
  $('#viewOrdersBtn').addEventListener('click', () => { overlay.classList.remove('active'); openOrders(); });
  $('#viewWishlistBtn').addEventListener('click', () => { overlay.classList.remove('active'); $('#wishlistOverlay').classList.add('active'); renderWishlistItems(); });

  updateAuthUI();
}

function updateAuthUI() {
  const icon = $('#userIcon i');
  if (State.user) icon.className = 'fa-solid fa-user-check';
  else icon.className = 'fa-solid fa-user';
}

/* ========== FAQ ========== */
function initFAQ() {
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('active');
      $$('.faq-item').forEach(i => { i.classList.remove('active'); i.querySelector('.faq-answer').style.maxHeight = null; });
      if (!isOpen) {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

/* ========== NEWSLETTER ========== */
function initNewsletter() {
  $('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = Security.sanitizeInput($('#newsletterEmail').value);
    if (!Security.validateEmail(email)) { showToast('Please enter a valid email', 'error'); return; }
    showToast('Subscribed successfully! Check your email for 15% off.', 'success');
    $('#newsletterEmail').value = '';
  });
}

/* ========== SCROLL TO TOP ========== */
function initScrollTop() {
  $('#scrollTopBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ========== COOKIE CONSENT ========== */
function initCookies() {
  if (localStorage.getItem('swiftcart_cookies')) return;
  const banner = $('#cookieBanner');
  banner.style.display = 'block';
  $('#acceptCookies').addEventListener('click', () => { localStorage.setItem('swiftcart_cookies', 'accepted'); banner.style.display = 'none'; showToast('Cookies accepted', 'info'); });
  $('#declineCookies').addEventListener('click', () => { localStorage.setItem('swiftcart_cookies', 'declined'); banner.style.display = 'none'; });
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initAnnouncement();
  initFlashTimer();
  initNavbar();
  initSearch();
  initFilters();
  initCart();
  initWishlist();
  initCompare();
  initProductModal();
  initImageZoom();
  initReviews();
  initCheckout();
  initOrderSuccess();
  initOrders();
  initAuth();
  initFAQ();
  initNewsletter();
  initScrollTop();
  initCookies();
  fetchProducts();
});
