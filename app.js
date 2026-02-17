// ========== GLOBAL STATE ==========
let cart = JSON.parse(localStorage.getItem("swiftcart-cart")) || [];
let allProducts = [];
let activeCategory = "all";

// ========== DOM ELEMENTS ==========
const productsGrid = document.getElementById("productsGrid");
const trendingProducts = document.getElementById("trendingProducts");
const categoryContainer = document.getElementById("categoryContainer");
const spinner = document.getElementById("spinner");
const cartCount = document.getElementById("cartCount");
const cartIcon = document.getElementById("cartIcon");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navMenu = document.getElementById("navMenu");
const newsletterForm = document.getElementById("newsletterForm");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const toastContainer = document.getElementById("toastContainer");

// ========== API BASE URL ==========
const BASE_URL = "https://fakestoreapi.com";

// ========== TOAST NOTIFICATION SYSTEM ==========
function showToast(message, type = "success") {
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => toast.remove());
  }, 2500);
}

// ========== UTILITY FUNCTIONS ==========

// Generate star rating HTML
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let html = "";

  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fa-solid fa-star"></i>';
  }
  if (hasHalf) {
    html += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

// Truncate text
function truncateText(text, maxLength = 50) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
}

// Show spinner
function showSpinner() {
  spinner.classList.add("show");
  productsGrid.innerHTML = "";
}

// Hide spinner
function hideSpinner() {
  spinner.classList.remove("show");
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("swiftcart-cart", JSON.stringify(cart));
}

// ========== FETCH FUNCTIONS ==========

// Fetch all products
async function fetchAllProducts() {
  try {
    showSpinner();
    const response = await fetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allProducts = data;
    hideSpinner();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    hideSpinner();
    productsGrid.innerHTML =
      '<p style="text-align:center;color:#dc3545;grid-column:1/-1;padding:40px 0;"><i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;display:block;margin-bottom:10px;"></i>Failed to load products. Please try again later.</p>';
    showToast("Failed to load products", "error");
  }
}

// Fetch products by category
async function fetchProductsByCategory(category) {
  try {
    showSpinner();
    const response = await fetch(`${BASE_URL}/products/category/${category}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    hideSpinner();
    return data;
  } catch (error) {
    console.error("Error fetching category products:", error);
    hideSpinner();
    productsGrid.innerHTML =
      '<p style="text-align:center;color:#dc3545;grid-column:1/-1;padding:40px 0;">Failed to load products. Please try again later.</p>';
    showToast("Failed to load category products", "error");
  }
}

// Fetch all categories
async function fetchCategories() {
  try {
    const response = await fetch(`${BASE_URL}/products/categories`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    showToast("Failed to load categories", "error");
  }
}

// Fetch single product
async function fetchProduct(id) {
  try {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching product:", error);
    showToast("Failed to load product details", "error");
  }
}

// ========== RENDER FUNCTIONS ==========

// Create product card HTML
function createProductCard(product, index = 0) {
  const card = document.createElement("div");
  card.classList.add("product-card", "animate-in");
  card.style.animationDelay = `${index * 0.08}s`;

  card.innerHTML = `
    <div class="product-image">
      <img src="${product.image}" alt="${product.title}" loading="lazy">
    </div>
    <div class="product-info">
      <span class="product-category">${product.category}</span>
      <h3 class="product-title" title="${product.title}">${truncateText(product.title)}</h3>
      <div class="product-rating">
        <span class="stars">${generateStars(product.rating.rate)}</span>
        <span class="rating-text">(${product.rating.rate} / ${product.rating.count} reviews)</span>
      </div>
      <p class="product-price">$${product.price.toFixed(2)}</p>
      <div class="product-actions">
        <button class="btn-details" onclick="openModal(${product.id})" aria-label="View details for ${truncateText(product.title, 30)}">Details</button>
        <button class="btn-add-cart" onclick="addToCart(${product.id}, event)" aria-label="Add ${truncateText(product.title, 30)} to cart">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>
  `;

  return card;
}

// Render products in grid
function renderProducts(products) {
  productsGrid.innerHTML = "";

  if (!products || products.length === 0) {
    productsGrid.innerHTML =
      '<p style="text-align:center;color:var(--gray);grid-column:1/-1;padding:40px 0;">No products found.</p>';
    return;
  }

  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    productsGrid.appendChild(card);
  });
}

// Render trending / top rated products
function renderTrendingProducts(products) {
  const topRated = [...products]
    .sort((a, b) => b.rating.rate - a.rating.rate)
    .slice(0, 3);

  trendingProducts.innerHTML = "";
  topRated.forEach((product, index) => {
    const card = createProductCard(product, index);
    trendingProducts.appendChild(card);
  });
}

// Render categories
function renderCategories(categories) {
  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.classList.add("category-btn");
    btn.dataset.category = category;
    btn.textContent = category;
    btn.addEventListener("click", () => handleCategoryClick(category, btn));
    categoryContainer.appendChild(btn);
  });
}

// ========== CATEGORY HANDLING ==========

async function handleCategoryClick(category, btn) {
  // Update active state
  document
    .querySelectorAll(".category-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  activeCategory = category;

  if (category === "all") {
    renderProducts(allProducts);
  } else {
    const products = await fetchProductsByCategory(category);
    renderProducts(products);
  }
}

// Add "All" button click handler
document
  .querySelector('.category-btn[data-category="all"]')
  .addEventListener("click", function () {
    document
      .querySelectorAll(".category-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    activeCategory = "all";
    renderProducts(allProducts);
  });

// ========== MODAL FUNCTIONS ==========

async function openModal(productId) {
  const product =
    allProducts.find((p) => p.id === productId) ||
    (await fetchProduct(productId));

  if (!product) return;

  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalImage").alt = product.title;
  document.getElementById("modalCategory").textContent = product.category;
  document.getElementById("modalTitle").textContent = product.title;
  document.getElementById("modalDescription").textContent = product.description;
  document.getElementById("modalRating").innerHTML = `
    ${generateStars(product.rating.rate)}
    <span class="rating-number">${product.rating.rate} out of 5 (${product.rating.count} reviews)</span>
  `;
  document.getElementById("modalPrice").textContent =
    `$${product.price.toFixed(2)}`;

  // Set up modal cart button
  const modalCartBtn = document.getElementById("modalCartBtn");
  modalCartBtn.onclick = (e) => {
    addToCart(product.id, e);
    closeModal();
  };

  modalOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.remove("show");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ========== CART FUNCTIONS ==========

function addToCart(productId, e) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  // Check if already in cart
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart();
  updateCartUI();
  showToast(`${truncateText(product.title, 25)} added to cart!`, "success");

  // Brief visual feedback on the button
  if (e && e.target) {
    const btn =
      e.target.closest(".btn-add-cart") || e.target.closest(".modal-cart-btn");
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
      btn.style.background = "#28a745";
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = "";
      }, 1000);
    }
  }
}

function removeFromCart(productId) {
  const item = cart.find((item) => item.id === productId);
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartUI();
  if (item) {
    showToast(`${truncateText(item.title, 25)} removed from cart`, "info");
  }
}

function updateQuantity(productId, delta) {
  const item = cart.find((item) => item.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  updateCartUI();
}

function updateCartUI() {
  // Update cart count badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  // Animate badge when items change
  cartCount.style.transform = "scale(1.3)";
  setTimeout(() => (cartCount.style.transform = "scale(1)"), 200);

  // Update cart items
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>Your cart is empty</p>
      </div>
    `;
    cartTotal.textContent = "$0.00";
    return;
  }

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;

    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <h4>${truncateText(item.title, 30)}</h4>
        <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, +1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove item" aria-label="Remove ${truncateText(item.title, 20)} from cart">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    cartItems.appendChild(cartItem);
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Cart sidebar toggle
function openCart() {
  cartOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartOverlay.classList.remove("show");
  document.body.style.overflow = "";
}

cartIcon.addEventListener("click", openCart);
cartIcon.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openCart();
  }
});

cartClose.addEventListener("click", closeCart);

cartOverlay.addEventListener("click", (e) => {
  if (e.target === cartOverlay) closeCart();
});

// ========== MOBILE MENU ==========
mobileMenuBtn.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("show");
  mobileMenuBtn.setAttribute("aria-expanded", isOpen);
  mobileMenuBtn.querySelector("i").className = isOpen
    ? "fa-solid fa-xmark"
    : "fa-solid fa-bars";
});

// Close mobile menu on link click
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("show");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mobileMenuBtn.querySelector("i").className = "fa-solid fa-bars";
  });
});

// ========== NEWSLETTER ==========
newsletterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const emailInput = newsletterForm.querySelector("input");
  const email = emailInput.value.trim();

  if (email) {
    showToast(`Thank you for subscribing with ${email}!`, "success");
    newsletterForm.reset();
  }
});

// ========== SCROLL EFFECTS ==========
let lastScroll = 0;
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  // Navbar scroll effect
  if (scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  // Scroll to top button
  if (scrollY > 500) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }

  lastScroll = scrollY;
});

// Scroll to top
scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ========== ACTIVE NAV LINK ON SCROLL ==========
const sections = document.querySelectorAll("section[id]");

function updateActiveNav() {
  const scrollY = window.pageYOffset;
  sections.forEach((section) => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 120;
    const sectionId = section.getAttribute("id");
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (navLink) {
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
        navLink.classList.add("active");
      }
    }
  });
}

window.addEventListener("scroll", updateActiveNav);

// ========== KEYBOARD SUPPORT ==========
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeCart();
  }
});

// ========== INITIALIZE APP ==========
async function init() {
  // Load categories and products in parallel for faster load
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchAllProducts(),
  ]);

  if (categories) {
    renderCategories(categories);
  }

  if (products) {
    renderProducts(products);
    renderTrendingProducts(products);
  }

  // Initialize cart UI from localStorage
  updateCartUI();
}

// Start the app
init();
