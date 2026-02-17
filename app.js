/* ========== SwiftCart E-Commerce — Full App ========== */
"use strict";

/* ========== SECURITY UTILITIES ========== */
const Security = {
  sanitize(str) {
    if (typeof str !== "string") return str;
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return str.replace(/[&<>"']/g, (c) => map[c]);
  },
  sanitizeInput(str) {
    return str.replace(/<[^>]*>/g, "").trim();
  },
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

/* ========== STATE ========== */
const State = {
  allProducts: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem("swiftcart_cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("swiftcart_wishlist") || "[]"),
  compare: JSON.parse(localStorage.getItem("swiftcart_compare") || "[]"),
  recentlyViewed: JSON.parse(localStorage.getItem("swiftcart_recent") || "[]"),
  orders: JSON.parse(localStorage.getItem("swiftcart_orders") || "[]"),
  reviews: JSON.parse(localStorage.getItem("swiftcart_reviews") || "{}"),
  user: JSON.parse(localStorage.getItem("swiftcart_user") || "null"),
  darkMode: localStorage.getItem("swiftcart_darkmode") === "true",
  coupon: null,
  currentCategory: "all",
  currentSort: "default",
  currentView: "grid",
  maxPrice: 1000,
  currentProduct: null,
  modalQty: 1,
  checkoutStep: 1,
  reviewRating: 0,
  productsPerPage: 8,
  productsShown: 8,
};

const API_BASE = "https://fakestoreapi.com";
const COUPONS = {
  SWIFT20: { type: "percent", value: 20, desc: "20% off" },
  WELCOME10: { type: "percent", value: 10, desc: "10% off" },
  FREE: { type: "shipping", value: 0, desc: "Free shipping" },
  SAVE5: { type: "fixed", value: 5, desc: "$5 off" },
};
const TAX_RATE = 0.08;

/* ========== EXTRA PRODUCTS (50+ custom products) ========== */
const EXTRA_PRODUCTS = [
  // ===== SHOES =====
  { id: 101, title: "Nike Air Max 270 Running Shoes", price: 129.99, description: "Lightweight running shoes with Air Max cushioning, breathable mesh upper, and durable rubber outsole for all-day comfort.", category: "shoes", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.6, count: 340 } },
  { id: 102, title: "Adidas Ultraboost 22 Sneakers", price: 159.99, description: "Premium running sneakers with Boost midsole technology, Primeknit upper, and Continental rubber outsole for superior grip.", category: "shoes", image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg", rating: { rate: 4.8, count: 520 } },
  { id: 103, title: "Classic Leather Chelsea Boots", price: 89.99, description: "Timeless Chelsea boots crafted from genuine leather with elastic side panels and comfort insole. Perfect for casual and formal occasions.", category: "shoes", image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg", rating: { rate: 4.4, count: 180 } },
  { id: 104, title: "Converse Chuck Taylor All Star High Top", price: 59.99, description: "Iconic canvas high-top sneakers with rubber toe cap, medial eyelets for ventilation, and OrthoLite insole.", category: "shoes", image: "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg", rating: { rate: 4.5, count: 890 } },
  { id: 105, title: "Puma RS-X Reinvention Sneakers", price: 109.99, description: "Retro-inspired chunky sneakers with RS cushioning technology, mesh and leather upper, and rubber outsole.", category: "shoes", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.3, count: 210 } },
  { id: 106, title: "Timberland 6-Inch Premium Waterproof Boots", price: 198.00, description: "Iconic waterproof boots with premium nubuck leather, padded collar, and anti-fatigue technology for all-day support.", category: "shoes", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 445 } },

  // ===== BOOKS =====
  { id: 201, title: "The Art of Programming - Complete Guide", price: 39.99, description: "Comprehensive programming guide covering algorithms, data structures, design patterns, and best practices for modern software development.", category: "books", image: "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg", rating: { rate: 4.9, count: 1200 } },
  { id: 202, title: "JavaScript: The Definitive Guide 7th Edition", price: 45.99, description: "The bible of JavaScript development. Covers ES2020+, Node.js, and modern web APIs with practical examples.", category: "books", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 890 } },
  { id: 203, title: "Clean Code: A Handbook of Agile Craftsmanship", price: 34.99, description: "Robert C. Martin's classic guide to writing readable, maintainable code. Essential for every developer.", category: "books", image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_.jpg", rating: { rate: 4.8, count: 2100 } },
  { id: 204, title: "Design Patterns: Elements of Reusable Software", price: 49.99, description: "The Gang of Four classic covering 23 essential design patterns for object-oriented software development.", category: "books", image: "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_.jpg", rating: { rate: 4.6, count: 780 } },
  { id: 205, title: "Atomic Habits by James Clear", price: 16.99, description: "An easy and proven way to build good habits and break bad ones. Over 10 million copies sold worldwide.", category: "books", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.9, count: 3500 } },
  { id: 206, title: "The Psychology of Money by Morgan Housel", price: 14.99, description: "Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money.", category: "books", image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg", rating: { rate: 4.7, count: 2800 } },

  // ===== SPORTS & OUTDOORS =====
  { id: 301, title: "Professional Yoga Mat with Carry Strap", price: 29.99, description: "Extra thick 6mm non-slip yoga mat with alignment lines, moisture-resistant surface, and carrying strap included.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.5, count: 670 } },
  { id: 302, title: "Adjustable Dumbbell Set 5-52.5 lbs", price: 299.99, description: "Space-saving adjustable dumbbells replacing 15 sets of weights. Quick-change mechanism for seamless workout transitions.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.8, count: 430 } },
  { id: 303, title: "Waterproof Hiking Backpack 40L", price: 54.99, description: "Durable 40L hiking backpack with waterproof coating, multiple compartments, hydration bladder compatible, and adjustable straps.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", rating: { rate: 4.6, count: 290 } },
  { id: 304, title: "Resistance Bands Set - 5 Levels", price: 19.99, description: "Set of 5 latex resistance bands with different tension levels. Includes door anchor, handles, and ankle straps.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.4, count: 1100 } },
  { id: 305, title: "GPS Sports Watch with Heart Rate Monitor", price: 199.99, description: "Advanced GPS sports watch with built-in heart rate monitor, 14-day battery life, 100+ workout modes, and waterproof to 50m.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_.jpg", rating: { rate: 4.7, count: 560 } },
  { id: 306, title: "Portable Camping Tent - 4 Person", price: 89.99, description: "Easy-setup 4-person camping tent with waterproof rainfly, mesh windows for ventilation, and durable fiberglass poles.", category: "sports & outdoors", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.3, count: 340 } },

  // ===== HOME & KITCHEN =====
  { id: 401, title: "Smart Air Purifier with HEPA Filter", price: 149.99, description: "HEPA air purifier covering 500 sq ft. WiFi-enabled with app control, auto mode, sleep mode, and real-time air quality display.", category: "home & kitchen", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.6, count: 890 } },
  { id: 402, title: "Stainless Steel French Press Coffee Maker", price: 24.99, description: "Double-wall insulated French press with 4-level filtration system. Keeps coffee hot for hours. Holds 34 oz.", category: "home & kitchen", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.5, count: 1200 } },
  { id: 403, title: "Robot Vacuum Cleaner with Smart Mapping", price: 279.99, description: "Smart robot vacuum with LiDAR mapping, 2500Pa suction, auto-empty base, and 150-min runtime. Works with Alexa.", category: "home & kitchen", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 670 } },
  { id: 404, title: "Cast Iron Dutch Oven 6-Quart", price: 59.99, description: "Pre-seasoned cast iron Dutch oven perfect for slow cooking, braising, baking, and frying. Oven safe to 500°F.", category: "home & kitchen", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.8, count: 2300 } },
  { id: 405, title: "Smart LED Light Bulbs - 4 Pack RGB", price: 34.99, description: "WiFi-enabled LED bulbs with 16 million colors, voice control via Alexa/Google, schedules, and scenes. 800 lumens each.", category: "home & kitchen", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.4, count: 560 } },
  { id: 406, title: "Bamboo Cutting Board Set with Juice Groove", price: 22.99, description: "Set of 3 premium bamboo cutting boards with juice grooves. Anti-bacterial, knife-friendly, and eco-sustainable.", category: "home & kitchen", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", rating: { rate: 4.5, count: 890 } },

  // ===== BEAUTY & PERSONAL CARE =====
  { id: 501, title: "Vitamin C Brightening Serum 30ml", price: 28.99, description: "Professional-grade vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, reduces dark spots, and boosts collagen.", category: "beauty", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 3400 } },
  { id: 502, title: "Premium Hair Dryer with Ionic Technology", price: 79.99, description: "Professional ionic hair dryer with 3 heat settings, cool shot button, concentrator and diffuser attachments. 1875W motor.", category: "beauty", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.5, count: 780 } },
  { id: 503, title: "Complete Skincare Gift Set - 8 Piece", price: 64.99, description: "Luxury skincare set with cleanser, toner, serum, moisturizer, eye cream, face mask, lip balm, and beauty bag.", category: "beauty", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 1200 } },
  { id: 504, title: "Electric Toothbrush with 4 Brush Heads", price: 42.99, description: "Sonic electric toothbrush with 5 cleaning modes, 2-min smart timer, pressure sensor, and 30-day battery life.", category: "beauty", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.8, count: 2100 } },
  { id: 505, title: "Natural Organic Face Cream SPF 30", price: 19.99, description: "Daily moisturizer with SPF 30 sun protection. Made with organic ingredients, lightweight formula, and no harsh chemicals.", category: "beauty", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.4, count: 670 } },

  // ===== TOYS & GAMES =====
  { id: 601, title: "LEGO Architecture City Skyline Set", price: 49.99, description: "Build iconic city skylines with this detailed LEGO Architecture set. 597 pieces for ages 12+. Display-worthy model.", category: "toys & games", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.8, count: 1500 } },
  { id: 602, title: "1000-Piece Adult Jigsaw Puzzle - Starry Night", price: 18.99, description: "Premium 1000-piece puzzle featuring Van Gogh's Starry Night. Precision-cut pieces with anti-glare finish.", category: "toys & games", image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_.jpg", rating: { rate: 4.5, count: 890 } },
  { id: 603, title: "RC Drone with 4K Camera & GPS", price: 189.99, description: "Foldable RC drone with 4K camera, GPS return home, 28-min flight time, follow-me mode, and carrying case included.", category: "toys & games", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 430 } },
  { id: 604, title: "Board Game Collection - Strategy Pack", price: 34.99, description: "Set of 5 award-winning strategy board games for family game night. 2-8 players, ages 8+.", category: "toys & games", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", rating: { rate: 4.7, count: 670 } },
  { id: 605, title: "Magnetic Building Blocks 100-Piece Set", price: 39.99, description: "Creative magnetic tiles for STEM learning. 100 pieces in various shapes and colors. Compatible with major brands.", category: "toys & games", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.9, count: 2300 } },

  // ===== AUTOMOTIVE =====
  { id: 701, title: "Dash Cam 4K with Night Vision", price: 79.99, description: "4K dash camera with wide-angle lens, night vision, G-sensor, parking mode, loop recording, and 32GB SD card included.", category: "automotive", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 890 } },
  { id: 702, title: "Car Phone Mount - Wireless Charger", price: 34.99, description: "Auto-clamping car phone mount with 15W Qi wireless charging. Air vent and dashboard mount included. Compatible with all phones.", category: "automotive", image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_.jpg", rating: { rate: 4.5, count: 1200 } },
  { id: 703, title: "Portable Jump Starter Power Bank 2000A", price: 69.99, description: "2000A peak car jump starter that can start V8 engines. Also works as USB-C power bank, LED flashlight, and emergency tool.", category: "automotive", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.7, count: 560 } },
  { id: 704, title: "Car Detailing Kit - 20 Piece Professional", price: 44.99, description: "Complete car detailing set with car wash soap, wax, interior cleaner, tire shine, microfiber towels, and applicator pads.", category: "automotive", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.4, count: 340 } },

  // ===== GROCERY & GOURMET =====
  { id: 801, title: "Organic Matcha Green Tea Powder Premium", price: 24.99, description: "Ceremonial grade organic matcha from Kyoto, Japan. Rich in antioxidants, smooth taste, no bitterness. 100g tin.", category: "grocery & gourmet", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.8, count: 2100 } },
  { id: 802, title: "Artisan Dark Chocolate Collection Gift Box", price: 39.99, description: "12 handcrafted dark chocolate truffles in assorted flavors: sea salt, espresso, raspberry, mint, and caramel.", category: "grocery & gourmet", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", rating: { rate: 4.9, count: 780 } },
  { id: 803, title: "Premium Mixed Nuts & Dried Fruits 2lb", price: 19.99, description: "Resealable bag of roasted almonds, cashews, walnuts, pecans, cranberries, and apricots. No added sugar or salt.", category: "grocery & gourmet", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 1500 } },
  { id: 804, title: "Gourmet Coffee Beans Variety Pack 3x12oz", price: 32.99, description: "Three bags of single-origin specialty coffee: Ethiopian Yirgacheffe, Colombian Supremo, and Sumatra Mandheling.", category: "grocery & gourmet", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 890 } },

  // ===== MORE ELECTRONICS =====
  { id: 901, title: "Wireless Noise Cancelling Earbuds Pro", price: 149.99, description: "True wireless earbuds with active noise cancellation, transparency mode, 30-hour battery, and IPX5 waterproof rating.", category: "electronics", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.7, count: 3400 } },
  { id: 902, title: "4K Ultra HD Webcam with Ring Light", price: 89.99, description: "Professional 4K webcam with built-in ring light, auto-focus, noise-cancelling microphone, and privacy cover.", category: "electronics", image: "https://fakestoreapi.com/img/81Zt42iIapL._AC_SX679_.jpg", rating: { rate: 4.5, count: 1200 } },
  { id: 903, title: "Mechanical Gaming Keyboard RGB", price: 69.99, description: "Full-size mechanical keyboard with Cherry MX switches, per-key RGB, macro programming, and detachable wrist rest.", category: "electronics", image: "https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_.jpg", rating: { rate: 4.6, count: 890 } },
  { id: 904, title: "Portable Bluetooth Speaker 30W Waterproof", price: 59.99, description: "30W bluetooth speaker with deep bass, 360° surround sound, IPX7 waterproof, 24-hour battery, and built-in mic.", category: "electronics", image: "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_.jpg", rating: { rate: 4.8, count: 2100 } },
  { id: 905, title: "Smart Home Hub with Voice Assistant", price: 99.99, description: "Central smart home hub with voice control, 7-inch display, compatible with 10,000+ devices, video calling, and streaming.", category: "electronics", image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", rating: { rate: 4.4, count: 560 } },
  { id: 906, title: "Wireless Gaming Mouse 16000 DPI", price: 49.99, description: "Ultra-lightweight wireless gaming mouse with 16000 DPI sensor, 6 programmable buttons, RGB, and 70-hour battery.", category: "electronics", image: "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 1500 } },

  // ===== MORE MEN'S CLOTHING =====
  { id: 1001, title: "Premium Slim Fit Dress Shirt - Egyptian Cotton", price: 49.99, description: "Luxury dress shirt made from 100% Egyptian cotton with wrinkle-resistant finish. Available in classic white and light blue.", category: "men's clothing", image: "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg", rating: { rate: 4.5, count: 670 } },
  { id: 1002, title: "Wool Blend Overcoat - Charcoal Grey", price: 189.99, description: "Premium wool blend overcoat with satin lining, notch lapels, and double-breasted button closure. Dry clean only.", category: "men's clothing", image: "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg", rating: { rate: 4.7, count: 340 } },
  { id: 1003, title: "Athletic Performance Polo Shirt", price: 34.99, description: "Moisture-wicking polo shirt with 4-way stretch fabric, UPF 50 sun protection, and anti-odor technology.", category: "men's clothing", image: "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg", rating: { rate: 4.4, count: 560 } },

  // ===== MORE WOMEN'S CLOTHING =====
  { id: 1101, title: "Cashmere Blend V-Neck Sweater", price: 79.99, description: "Ultra-soft cashmere blend sweater with ribbed trim, relaxed fit, and classic V-neck design. Hand wash recommended.", category: "women's clothing", image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg", rating: { rate: 4.6, count: 890 } },
  { id: 1102, title: "High-Waist Yoga Leggings with Pockets", price: 32.99, description: "Buttery-soft yoga leggings with high waist, side pockets, 4-way stretch, and squat-proof material. Moisture-wicking.", category: "women's clothing", image: "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_.jpg", rating: { rate: 4.8, count: 3400 } },
  { id: 1103, title: "Floral Maxi Wrap Dress", price: 44.99, description: "Elegant floral maxi dress with wrap-around design, adjustable tie waist, flutter sleeves, and flowy skirt.", category: "women's clothing", image: "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg", rating: { rate: 4.5, count: 670 } },

  // ===== MORE JEWELERY =====
  { id: 1201, title: "Sterling Silver Infinity Bracelet", price: 29.99, description: "925 sterling silver infinity bracelet with adjustable chain clasp. Comes in a luxury gift box. Hypoallergenic.", category: "jewelery", image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.6, count: 1200 } },
  { id: 1202, title: "Pearl Drop Earrings - 14K Gold", price: 89.99, description: "Elegant freshwater pearl drop earrings set in 14K gold. 8mm pearls with high luster. Perfect for weddings and special occasions.", category: "jewelery", image: "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.8, count: 560 } },
  { id: 1203, title: "Sapphire and Diamond Pendant Necklace", price: 249.99, description: "Stunning sapphire pendant surrounded by pave diamonds on an 18-inch white gold chain. 1.5 carat total weight.", category: "jewelery", image: "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg", rating: { rate: 4.9, count: 340 } },
];

/* ========== UTILITY ========== */
function $(sel) {
  return document.querySelector(sel);
}
function $$(sel) {
  return document.querySelectorAll(sel);
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatCurrency(n) {
  const rate = window._currencyRate || 1;
  const symbol = window._currencySymbol || '$';
  return symbol + (Number(n) * rate).toFixed(2);
}

function generateOrderId() {
  return (
    "#SW-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 4).toUpperCase()
  );
}

/* ========== TOAST ========== */
function showToast(message, type = "success", duration = 3000) {
  const container = $("#toastContainer");
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info",
  };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Security.sanitize(message)}</span><span class="toast-close">&times;</span>`;
  container.appendChild(toast);
  toast
    .querySelector(".toast-close")
    .addEventListener("click", () => toast.remove());
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(60px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ========== SAVE STATE ========== */
function saveState(key, data) {
  try {
    localStorage.setItem("swiftcart_" + key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage full");
  }
}

/* ========== DARK MODE ========== */
function initDarkMode() {
  if (State.darkMode) document.body.classList.add("dark-mode");
  const icon = $("#darkModeToggle i");
  if (icon)
    icon.className = State.darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
  $("#darkModeToggle").addEventListener("click", () => {
    State.darkMode = !State.darkMode;
    document.body.classList.toggle("dark-mode", State.darkMode);
    saveState("darkmode", State.darkMode);
    icon.className = State.darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
    showToast(
      State.darkMode ? "Dark mode enabled" : "Light mode enabled",
      "info",
    );
  });
}

/* ========== ANNOUNCEMENT BAR ========== */
function initAnnouncement() {
  const bar = $("#announcementBar");
  const closeBtn = $("#announcementClose");
  if (sessionStorage.getItem("swiftcart_announce_closed")) {
    bar.classList.add("hidden");
    return;
  }
  closeBtn.addEventListener("click", () => {
    bar.classList.add("hidden");
    sessionStorage.setItem("swiftcart_announce_closed", "true");
  });
}

/* ========== FLASH TIMER ========== */
function initFlashTimer() {
  let timeLeft = 2 * 60 * 60; // 2 hours
  const timerEl = $("#flashTimer");
  function updateTimer() {
    const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
    const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;
    if ($("#countHours")) $("#countHours").textContent = h;
    if ($("#countMinutes")) $("#countMinutes").textContent = m;
    if ($("#countSeconds")) $("#countSeconds").textContent = s;
    if (timeLeft > 0) timeLeft--;
  }
  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ========== NAVBAR ========== */
function initNavbar() {
  const navbar = $("#navbar");
  const menuBtn = $("#mobileMenuBtn");
  const menu = $("#navMenu");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
    const scrollBtn = $("#scrollTopBtn");
    if (scrollBtn) scrollBtn.classList.toggle("visible", window.scrollY > 400);
  });
  menuBtn.addEventListener("click", () => {
    menu.classList.toggle("active");
    menuBtn.setAttribute("aria-expanded", menu.classList.contains("active"));
  });
  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      $$(".nav-link").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      menu.classList.remove("active");
    });
  });
}

/* ========== SEARCH ========== */
function initSearch() {
  const input = $("#searchInput");
  const results = $("#searchResults");
  const clearBtn = $("#searchClear");
  const search = debounce((query) => {
    query = query.toLowerCase().trim();
    if (!query) {
      results.style.display = "none";
      clearBtn.style.display = "none";
      return;
    }
    clearBtn.style.display = "block";
    const matches = State.allProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
      .slice(0, 8);
    if (matches.length === 0) {
      results.innerHTML =
        '<div class="search-no-results">No products found</div>';
    } else {
      results.innerHTML = matches
        .map(
          (p) => `
        <div class="search-result-item" data-id="${p.id}">
          <img src="${Security.sanitize(p.image)}" alt="${Security.sanitize(p.title)}" loading="lazy" />
          <div class="sr-info"><div class="sr-name">${Security.sanitize(p.title)}</div><div class="sr-price">${formatCurrency(p.price)}</div></div>
        </div>`,
        )
        .join("");
    }
    results.style.display = "block";
  }, 250);
  input.addEventListener("input", () => search(input.value));
  clearBtn.addEventListener("click", () => {
    input.value = "";
    results.style.display = "none";
    clearBtn.style.display = "none";
  });
  results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (item) {
      openProductModal(parseInt(item.dataset.id));
      results.style.display = "none";
      input.value = "";
      clearBtn.style.display = "none";
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-bar")) results.style.display = "none";
  });
}

/* ========== FETCH PRODUCTS ========== */
async function fetchProducts() {
  try {
    const [products, categories] = await Promise.all([
      fetch(`${API_BASE}/products`).then((r) => {
        if (!r.ok) throw new Error("API Error");
        return r.json();
      }),
      fetch(`${API_BASE}/products/categories`).then((r) => r.json()),
    ]);
    State.allProducts = [...products, ...EXTRA_PRODUCTS];
    State.filteredProducts = [...State.allProducts];
    // Gather all unique categories from all products
    const allCategories = [...new Set(State.allProducts.map(p => p.category))];
    renderCategories(allCategories);
    renderProducts();
    renderDeals(products);
    renderTrending(products);
    renderRecentlyViewed();
    $("#spinner").style.display = "none";
    // Notify category showcase
    if (window._swcFetchDone) window._swcFetchDone();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    $("#spinner").innerHTML =
      '<p style="text-align:center;color:var(--danger);padding:40px">Failed to load products. Please refresh.</p>';
    showToast("Failed to load products", "error");
  }
}

/* ========== RENDER CATEGORIES ========== */
function renderCategories(categories) {
  const container = $("#categoryContainer");
  container.innerHTML =
    '<button class="category-btn active" data-category="all">All</button>';
  categories.forEach((cat) => {
    container.innerHTML += `<button class="category-btn" data-category="${Security.sanitize(cat)}">${Security.sanitize(cat)}</button>`;
  });
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-btn");
    if (!btn) return;
    $$(".category-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    State.currentCategory = btn.dataset.category;
    State.productsShown = State.productsPerPage;
    applyFilters();
  });
}

/* ========== FILTERS & SORTING ========== */
function applyFilters() {
  let products = [...State.allProducts];
  if (State.currentCategory !== "all")
    products = products.filter((p) => p.category === State.currentCategory);
  products = products.filter((p) => p.price <= State.maxPrice);
  switch (State.currentSort) {
    case "price-low":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      products.sort((a, b) => b.price - a.price);
      break;
    case "rating-high":
      products.sort((a, b) => b.rating.rate - a.rating.rate);
      break;
    case "rating-low":
      products.sort((a, b) => a.rating.rate - b.rating.rate);
      break;
    case "name-az":
      products.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "name-za":
      products.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }
  State.filteredProducts = products;
  renderProducts();
}

function initFilters() {
  $("#sortSelect").addEventListener("change", (e) => {
    State.currentSort = e.target.value;
    State.productsShown = State.productsPerPage;
    applyFilters();
  });
  const range = $("#priceRange");
  const label = $("#priceMaxLabel");
  range.addEventListener("input", () => {
    State.maxPrice = parseInt(range.value);
    label.textContent = range.value;
  });
  range.addEventListener("change", () => {
    State.productsShown = State.productsPerPage;
    applyFilters();
  });
  $$(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      State.currentView = btn.dataset.view;
      const grid = $("#productsGrid");
      grid.classList.toggle("list-view", State.currentView === "list");
    });
  });
  $("#loadMoreBtn").addEventListener("click", () => {
    State.productsShown += State.productsPerPage;
    renderProducts();
  });
}

/* ========== RENDER PRODUCTS ========== */
function renderProducts() {
  const grid = $("#productsGrid");
  const products = State.filteredProducts;
  const visible = products.slice(0, State.productsShown);
  $("#productCount").textContent =
    `Showing ${visible.length} of ${products.length} products`;
  const loadMore = $("#loadMoreBtn");
  loadMore.style.display =
    State.productsShown < products.length ? "inline-flex" : "none";
  grid.innerHTML = visible.map((p) => createProductCard(p)).join("");
  attachProductCardEvents(grid);
}

function createProductCard(p) {
  const inWishlist = State.wishlist.some((w) => w.id === p.id);
  const inCompare = State.compare.some((c) => c.id === p.id);
  const stars = renderStarsHTML(p.rating.rate);
  const badges = [];
  if (p.rating.rate >= 4.5)
    badges.push('<span class="badge-item badge-hot">HOT</span>');
  if (p.price < 20)
    badges.push('<span class="badge-item badge-sale">SALE</span>');
  return `
    <div class="product-card" data-id="${p.id}">
      ${badges.length ? `<div class="product-badges">${badges.join("")}</div>` : ""}
      <div class="product-actions-overlay">
        <button class="wishlist-toggle ${inWishlist ? "active" : ""}" data-id="${p.id}" title="Wishlist"><i class="fa-${inWishlist ? "solid" : "regular"} fa-heart"></i></button>
        <button class="compare-toggle ${inCompare ? "active" : ""}" data-id="${p.id}" title="Compare"><i class="fa-solid fa-code-compare"></i></button>
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
  container.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(parseInt(btn.dataset.id));
    });
  });
  container.querySelectorAll(".wishlist-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWishlist(parseInt(btn.dataset.id));
    });
  });
  container.querySelectorAll(".compare-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCompare(parseInt(btn.dataset.id));
    });
  });
  container.querySelectorAll(".quick-view").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openProductModal(parseInt(btn.dataset.id));
    });
  });
  container.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () =>
      openProductModal(parseInt(card.dataset.id)),
    );
  });
}

function renderStarsHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<i class="fa-solid fa-star"></i>';
    else if (rating >= i - 0.5)
      html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

/* ========== DEALS ========== */
function renderDeals(products) {
  const deals = products.filter((p) => p.price > 50).slice(0, 4);
  const grid = $("#dealsGrid");
  grid.innerHTML = deals
    .map((p) => {
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
    })
    .join("");
  grid.querySelectorAll(".deal-card").forEach((card) => {
    card.addEventListener("click", () =>
      openProductModal(parseInt(card.dataset.id)),
    );
  });
}

/* ========== TRENDING ========== */
function renderTrending(products) {
  const trending = [...products]
    .sort((a, b) => b.rating.rate - a.rating.rate)
    .slice(0, 4);
  const grid = $("#trendingProducts");
  grid.innerHTML = trending.map((p) => createProductCard(p)).join("");
  attachProductCardEvents(grid);
}

/* ========== CART ========== */
function addToCart(productId, qty = 1) {
  const product = State.allProducts.find((p) => p.id === productId);
  if (!product) return;
  const existing = State.cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    State.cart.push({ ...product, qty });
  }
  saveState("cart", State.cart);
  updateCartUI();
  showToast(`${product.title.substring(0, 30)}... added to cart`, "success");
}

function removeFromCart(productId) {
  State.cart = State.cart.filter((item) => item.id !== productId);
  saveState("cart", State.cart);
  updateCartUI();
  renderCartItems();
}

function updateCartQty(productId, delta) {
  const item = State.cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveState("cart", State.cart);
  updateCartUI();
  renderCartItems();
}

function getCartTotals() {
  const subtotal = State.cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  let discount = 0;
  if (State.coupon) {
    if (State.coupon.type === "percent")
      discount = subtotal * (State.coupon.value / 100);
    else if (State.coupon.type === "fixed") discount = State.coupon.value;
  }
  const afterDiscount = subtotal - discount;
  const shippingMethod = document.querySelector(
    'input[name="shippingMethod"]:checked',
  );
  let shipping = 0;
  if (State.coupon && State.coupon.type === "shipping") shipping = 0;
  else if (subtotal >= 50) shipping = 0;
  else if (shippingMethod) {
    if (shippingMethod.value === "express") shipping = 9.99;
    else if (shippingMethod.value === "overnight") shipping = 19.99;
    else shipping = subtotal < 50 ? 4.99 : 0;
  } else {
    shipping = subtotal < 50 ? 4.99 : 0;
  }
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;
  return { subtotal, discount, shipping, tax, total };
}

function updateCartUI() {
  const totalItems = State.cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cartCount").textContent = totalItems;
  const totals = getCartTotals();
  $("#cartSubtotal").textContent = formatCurrency(totals.subtotal);
  const discountRow = $("#discountRow");
  if (totals.discount > 0) {
    discountRow.style.display = "flex";
    $("#cartDiscount").textContent = "-" + formatCurrency(totals.discount);
  } else {
    discountRow.style.display = "none";
  }
  $("#cartShipping").textContent =
    totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping);
  $("#cartTax").textContent = formatCurrency(totals.tax);
  $("#cartTotal").textContent = formatCurrency(totals.total);
  // Update free shipping progress bar
  try { updateFreeShippingBar(); } catch(e) {}
}

function renderCartItems() {
  const container = $("#cartItems");
  if (State.cart.length === 0) {
    container.innerHTML =
      '<div class="cart-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty</p></div>';
    return;
  }
  container.innerHTML = State.cart
    .map(
      (item) => `
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
    </div>`,
    )
    .join("");
  container.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      updateCartQty(
        parseInt(btn.dataset.id),
        btn.dataset.action === "plus" ? 1 : -1,
      ),
    );
  });
  container.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", () =>
      removeFromCart(parseInt(btn.dataset.id)),
    );
  });
}

function initCart() {
  const overlay = $("#cartOverlay");
  const sidebar = $("#cartSidebar");
  $("#cartIcon").addEventListener("click", () => {
    overlay.classList.add("active");
    renderCartItems();
  });
  $("#cartClose").addEventListener("click", () =>
    overlay.classList.remove("active"),
  );
  $("#continueShoppingBtn").addEventListener("click", () =>
    overlay.classList.remove("active"),
  );
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
  updateCartUI();

  // Coupon
  $("#applyCouponBtn").addEventListener("click", () => {
    const code = $("#couponInput").value.trim().toUpperCase();
    const msg = $("#couponMessage");
    if (COUPONS[code]) {
      State.coupon = COUPONS[code];
      msg.textContent = `Coupon applied: ${COUPONS[code].desc}`;
      msg.className = "coupon-message success";
      showToast("Coupon applied!", "success");
    } else {
      State.coupon = null;
      msg.textContent = "Invalid coupon code";
      msg.className = "coupon-message error";
      showToast("Invalid coupon code", "error");
    }
    updateCartUI();
  });
}

/* ========== WISHLIST ========== */
function toggleWishlist(productId) {
  const product = State.allProducts.find((p) => p.id === productId);
  if (!product) return;
  const idx = State.wishlist.findIndex((w) => w.id === productId);
  if (idx >= 0) {
    State.wishlist.splice(idx, 1);
    showToast("Removed from wishlist", "info");
  } else {
    State.wishlist.push(product);
    showToast("Added to wishlist", "success");
  }
  saveState("wishlist", State.wishlist);
  updateWishlistUI();
  renderProducts();
  renderTrending(State.allProducts);
}

function updateWishlistUI() {
  $("#wishlistCount").textContent = State.wishlist.length;
}

function renderWishlistItems() {
  const container = $("#wishlistItems");
  if (State.wishlist.length === 0) {
    container.innerHTML =
      '<div class="cart-empty"><i class="fa-solid fa-heart"></i><p>Your wishlist is empty</p></div>';
    return;
  }
  container.innerHTML = State.wishlist
    .map(
      (item) => `
    <div class="wishlist-item" data-id="${item.id}">
      <div class="wishlist-item-image"><img src="${Security.sanitize(item.image)}" alt="${Security.sanitize(item.title)}" loading="lazy" /></div>
      <div class="wishlist-item-info"><div class="wishlist-item-title">${Security.sanitize(item.title)}</div><div class="wishlist-item-price">${formatCurrency(item.price)}</div></div>
      <div class="wishlist-item-actions">
        <button class="wishlist-add-cart" data-id="${item.id}" title="Add to Cart"><i class="fa-solid fa-cart-plus"></i></button>
        <button class="wishlist-remove" data-id="${item.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>`,
    )
    .join("");
  container.querySelectorAll(".wishlist-add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(parseInt(btn.dataset.id));
    });
  });
  container.querySelectorAll(".wishlist-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleWishlist(parseInt(btn.dataset.id));
      renderWishlistItems();
    });
  });
}

function initWishlist() {
  const overlay = $("#wishlistOverlay");
  $("#wishlistIcon").addEventListener("click", () => {
    overlay.classList.add("active");
    renderWishlistItems();
  });
  $("#wishlistClose").addEventListener("click", () =>
    overlay.classList.remove("active"),
  );
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
  $("#addAllWishlistToCart").addEventListener("click", () => {
    if (State.wishlist.length === 0) {
      showToast("Wishlist is empty", "warning");
      return;
    }
    State.wishlist.forEach((item) => addToCart(item.id));
    showToast("All items added to cart!", "success");
  });
  updateWishlistUI();
}

/* ========== COMPARE ========== */
function toggleCompare(productId) {
  const product = State.allProducts.find((p) => p.id === productId);
  if (!product) return;
  const idx = State.compare.findIndex((c) => c.id === productId);
  if (idx >= 0) {
    State.compare.splice(idx, 1);
    showToast("Removed from compare", "info");
  } else {
    if (State.compare.length >= 4) {
      showToast("Max 4 products to compare", "warning");
      return;
    }
    State.compare.push(product);
    showToast("Added to compare", "success");
  }
  saveState("compare", State.compare);
  updateCompareUI();
  renderProducts();
  renderTrending(State.allProducts);
}

function updateCompareUI() {
  $("#compareCount").textContent = State.compare.length;
}

function renderCompareBody() {
  const body = $("#compareBody");
  if (State.compare.length === 0) {
    body.innerHTML = '<p class="compare-empty">Add products to compare.</p>';
    return;
  }
  const rows = [
    {
      label: "Image",
      render: (p) => `<img src="${Security.sanitize(p.image)}" alt="" />`,
    },
    { label: "Name", render: (p) => Security.sanitize(p.title) },
    {
      label: "Price",
      render: (p) => `<strong>${formatCurrency(p.price)}</strong>`,
    },
    {
      label: "Rating",
      render: (p) => `${renderStarsHTML(p.rating.rate)} (${p.rating.count})`,
    },
    { label: "Category", render: (p) => Security.sanitize(p.category) },
    {
      label: "",
      render: (p) =>
        `<button class="compare-remove-btn" data-id="${p.id}">Remove</button>`,
    },
  ];
  body.innerHTML = `<table class="compare-table"><thead><tr><th></th>${State.compare.map(() => "<th></th>").join("")}</tr></thead><tbody>${rows.map((r) => `<tr><th>${r.label}</th>${State.compare.map((p) => `<td>${r.render(p)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  body.querySelectorAll(".compare-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleCompare(parseInt(btn.dataset.id));
      renderCompareBody();
    });
  });
}

function initCompare() {
  const overlay = $("#compareOverlay");
  $("#compareIcon").addEventListener("click", () => {
    overlay.classList.add("active");
    renderCompareBody();
  });
  $("#compareClose").addEventListener("click", () =>
    overlay.classList.remove("active"),
  );
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });
  updateCompareUI();
}

/* ========== PRODUCT MODAL ========== */
function openProductModal(productId) {
  const product = State.allProducts.find((p) => p.id === productId);
  if (!product) return;
  State.currentProduct = product;
  State.modalQty = 1;
  $("#modalImage").src = product.image;
  $("#modalImage").alt = product.title;
  $("#modalCategory").textContent = product.category;
  $("#modalCategoryBread").textContent = product.category;
  $("#modalTitle").textContent = product.title;
  $("#modalPrice").textContent = formatCurrency(product.price);
  const origPrice = (product.price * 1.3).toFixed(2);
  $("#modalOriginalPrice").textContent = formatCurrency(origPrice);
  $("#modalDescription").textContent = product.description;
  $("#modalRating").innerHTML =
    `<span class="stars">${renderStarsHTML(product.rating.rate)}</span><span class="rating-info">${product.rating.rate} / 5 (${product.rating.count} reviews)</span>`;
  $("#modalQtyValue").textContent = "1";
  $("#modalStock").innerHTML =
    product.rating.count > 10
      ? '<i class="fa-solid fa-circle-check"></i> In Stock'
      : '<i class="fa-solid fa-clock"></i> Low Stock';
  // Wishlist / Compare btn state
  const inWish = State.wishlist.some((w) => w.id === productId);
  $("#modalWishlistBtn").innerHTML =
    `<i class="fa-${inWish ? "solid" : "regular"} fa-heart"></i>`;
  // Reviews
  renderModalReviews(productId);
  // Recently viewed
  addToRecentlyViewed(product);
  // Size & color selectors
  try { showSizeColorForProduct(product); } catch(e) {}
  // Reset tabs to first tab
  try {
    document.querySelectorAll('.modal-tab').forEach((t,i) => t.classList.toggle('active', i===0));
    document.querySelectorAll('.modal-tab-content').forEach((c,i) => c.classList.toggle('active', i===0));
  } catch(e) {}
  $("#modalOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  $("#modalOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

function initProductModal() {
  $("#modalClose").addEventListener("click", closeProductModal);
  $("#modalOverlay").addEventListener("click", (e) => {
    if (e.target === $("#modalOverlay")) closeProductModal();
  });
  $("#modalQtyMinus").addEventListener("click", () => {
    if (State.modalQty > 1) {
      State.modalQty--;
      $("#modalQtyValue").textContent = State.modalQty;
    }
  });
  $("#modalQtyPlus").addEventListener("click", () => {
    if (State.modalQty < 10) {
      State.modalQty++;
      $("#modalQtyValue").textContent = State.modalQty;
    }
  });
  $("#modalCartBtn").addEventListener("click", () => {
    if (State.currentProduct) {
      addToCart(State.currentProduct.id, State.modalQty);
      closeProductModal();
    }
  });
  $("#modalWishlistBtn").addEventListener("click", () => {
    if (State.currentProduct) {
      toggleWishlist(State.currentProduct.id);
      const inWish = State.wishlist.some(
        (w) => w.id === State.currentProduct.id,
      );
      $("#modalWishlistBtn").innerHTML =
        `<i class="fa-${inWish ? "solid" : "regular"} fa-heart"></i>`;
    }
  });
  $("#modalCompareBtn").addEventListener("click", () => {
    if (State.currentProduct) toggleCompare(State.currentProduct.id);
  });
  $("#modalShareBtn").addEventListener("click", () => {
    if (!State.currentProduct) return;
    const text = `${State.currentProduct.title} - ${formatCurrency(State.currentProduct.price)} at SwiftCart`;
    if (navigator.share) {
      navigator.share({ title: "SwiftCart", text, url: window.location.href });
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Link copied!", "info"));
    }
  });
  // Image zoom
  $("#modalZoom").addEventListener("click", () => {
    if (State.currentProduct) {
      $("#zoomImage").src = State.currentProduct.image;
      $("#zoomOverlay").classList.add("active");
    }
  });
  $("#modalImage").addEventListener("click", () => {
    if (State.currentProduct) {
      $("#zoomImage").src = State.currentProduct.image;
      $("#zoomOverlay").classList.add("active");
    }
  });
  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      $("#cartOverlay").classList.remove("active");
      $("#wishlistOverlay").classList.remove("active");
      $("#compareOverlay").classList.remove("active");
      $("#checkoutOverlay").classList.remove("active");
      $("#authOverlay").classList.remove("active");
      $("#ordersOverlay").classList.remove("active");
      $("#zoomOverlay").classList.remove("active");
      $("#successOverlay").classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

/* ========== IMAGE ZOOM ========== */
function initImageZoom() {
  $("#zoomClose").addEventListener("click", () =>
    $("#zoomOverlay").classList.remove("active"),
  );
  $("#zoomOverlay").addEventListener("click", (e) => {
    if (e.target === $("#zoomOverlay"))
      $("#zoomOverlay").classList.remove("active");
  });
}

/* ========== REVIEWS ========== */
function renderModalReviews(productId) {
  const reviews = State.reviews[productId] || [];
  const list = $("#modalReviews");
  const count = $("#modalReviewCount");
  count.textContent = `(${reviews.length})`;
  if (reviews.length === 0) {
    list.innerHTML = '<p class="no-reviews">No reviews yet. Be the first!</p>';
  } else {
    list.innerHTML = reviews
      .map(
        (r) => `
      <div class="review-item">
        <div class="review-header"><span class="review-author">${Security.sanitize(r.author)}</span><span class="review-date">${r.date}</span></div>
        <div class="review-stars">${renderStarsHTML(r.rating)}</div>
        <div class="review-text">${Security.sanitize(r.text)}</div>
      </div>`,
      )
      .join("");
  }
  // Review form state
  State.reviewRating = 0;
  $$("#reviewFormStars i").forEach(
    (star) => (star.className = "fa-regular fa-star"),
  );
  $("#reviewText").value = "";
  $("#addReviewSection").style.display = "none";
}

function initReviews() {
  const stars = $$("#reviewFormStars i");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      State.reviewRating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className =
          i < State.reviewRating
            ? "fa-solid fa-star active"
            : "fa-regular fa-star";
      });
    });
    star.addEventListener("mouseenter", () => {
      const r = parseInt(star.dataset.rating);
      stars.forEach((s, i) => {
        s.className = i < r ? "fa-solid fa-star" : "fa-regular fa-star";
      });
    });
    star.addEventListener("mouseleave", () => {
      stars.forEach((s, i) => {
        s.className =
          i < State.reviewRating
            ? "fa-solid fa-star active"
            : "fa-regular fa-star";
      });
    });
  });
  $("#toggleReviewForm").addEventListener("click", () => {
    if (!State.user) {
      showToast("Please login to write a review", "warning");
      openAuth();
      return;
    }
    const section = $("#addReviewSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
  });
  $("#submitReviewBtn").addEventListener("click", () => {
    if (!State.currentProduct) return;
    if (State.reviewRating === 0) {
      showToast("Please select a rating", "warning");
      return;
    }
    const text = Security.sanitizeInput($("#reviewText").value);
    if (!text || text.length < 5) {
      showToast("Review must be at least 5 characters", "warning");
      return;
    }
    const review = {
      author: State.user ? State.user.firstName : "Anonymous",
      rating: State.reviewRating,
      text,
      date: new Date().toLocaleDateString(),
    };
    if (!State.reviews[State.currentProduct.id])
      State.reviews[State.currentProduct.id] = [];
    State.reviews[State.currentProduct.id].unshift(review);
    saveState("reviews", State.reviews);
    renderModalReviews(State.currentProduct.id);
    showToast("Review submitted!", "success");
  });
}

/* ========== RECENTLY VIEWED ========== */
function addToRecentlyViewed(product) {
  State.recentlyViewed = State.recentlyViewed.filter(
    (p) => p.id !== product.id,
  );
  State.recentlyViewed.unshift(product);
  if (State.recentlyViewed.length > 10)
    State.recentlyViewed = State.recentlyViewed.slice(0, 10);
  saveState("recent", State.recentlyViewed);
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const section = $("#recentlyViewed");
  const grid = $("#recentlyViewedGrid");
  if (State.recentlyViewed.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  grid.innerHTML = State.recentlyViewed
    .slice(0, 5)
    .map((p) => createProductCard(p))
    .join("");
  attachProductCardEvents(grid);
}

/* ========== CHECKOUT ========== */
function initCheckout() {
  const overlay = $("#checkoutOverlay");
  $("#checkoutBtn").addEventListener("click", () => {
    if (State.cart.length === 0) {
      showToast("Cart is empty", "warning");
      return;
    }
    $("#cartOverlay").classList.remove("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    goToCheckoutStep(1);
  });
  $("#checkoutClose").addEventListener("click", () => {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Step 1: Shipping
  $("#shippingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("#shippingForm").checkValidity()) {
      showToast("Please fill all required fields", "error");
      return;
    }
    goToCheckoutStep(2);
  });

  // Step 2: Payment
  $("#paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const method = document.querySelector(
      'input[name="paymentMethod"]:checked',
    ).value;
    if (method === "card") {
      if (
        !$("#cardNumber").value ||
        !$("#cardExpiry").value ||
        !$("#cardCVV").value ||
        !$("#cardName").value
      ) {
        showToast("Please fill card details", "error");
        return;
      }
    }
    populateOrderReview();
    goToCheckoutStep(3);
  });

  // Payment method toggle
  $$('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      $$(".payment-method").forEach((m) => m.classList.remove("active"));
      radio.closest(".payment-method").classList.add("active");
      const isCard = radio.value === "card";
      $("#cardPaymentFields").style.display = isCard ? "block" : "none";
      // Toggle required attribute so hidden fields don't block form submission
      ["#cardNumber", "#cardExpiry", "#cardCVV", "#cardName"].forEach((sel) => {
        const field = $(sel);
        if (field) {
          if (isCard) field.setAttribute("required", "");
          else field.removeAttribute("required");
        }
      });
    });
  });

  // Shipping method change
  $$('input[name="shippingMethod"]').forEach((radio) => {
    radio.addEventListener("change", () => updateCartUI());
  });

  // Card number formatting
  $("#cardNumber").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").substring(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
  });
  // Expiry formatting
  $("#cardExpiry").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + "/" + v.substring(2);
    e.target.value = v;
  });

  // Navigation
  $("#backToShipping").addEventListener("click", () => goToCheckoutStep(1));
  $("#backToPayment").addEventListener("click", () => goToCheckoutStep(2));

  // Place Order
  $("#placeOrderBtn").addEventListener("click", placeOrder);
}

function goToCheckoutStep(step) {
  State.checkoutStep = step;
  $$(".checkout-step").forEach((s) => s.classList.remove("active"));
  $(`#checkoutStep${step}`).classList.add("active");
  $$(".progress-step").forEach((s) => {
    const sStep = parseInt(s.dataset.step);
    s.classList.toggle("active", sStep === step);
    s.classList.toggle("completed", sStep < step);
  });
}

function populateOrderReview() {
  const shipping = `${$("#shipFirstName").value} ${$("#shipLastName").value}<br>${$("#shipAddress").value}, ${$("#shipCity").value} ${$("#shipZip").value}<br>${$("#shipEmail").value} | ${$("#shipPhone").value}`;
  const method = document.querySelector(
    'input[name="paymentMethod"]:checked',
  ).value;
  const paymentText =
    method === "card"
      ? `Card ending in ${$("#cardNumber").value.slice(-4)}`
      : method === "paypal"
        ? "PayPal"
        : "Cash on Delivery";
  $("#reviewShipping").innerHTML = `<p>${shipping}</p>`;
  $("#reviewPayment").innerHTML = `<p>${paymentText}</p>`;
  $("#reviewItemCount").textContent = State.cart.reduce((s, i) => s + i.qty, 0);
  $("#reviewItems").innerHTML = State.cart
    .map(
      (item) =>
        `<div class="review-item-row"><span>${Security.sanitize(item.title.substring(0, 40))}... x${item.qty}</span><span>${formatCurrency(item.price * item.qty)}</span></div>`,
    )
    .join("");
  const totals = getCartTotals();
  $("#reviewTotals").innerHTML = `
    <div class="cart-summary-row"><span>Subtotal:</span><span>${formatCurrency(totals.subtotal)}</span></div>
    ${totals.discount > 0 ? `<div class="cart-summary-row"><span>Discount:</span><span class="discount-amount">-${formatCurrency(totals.discount)}</span></div>` : ""}
    <div class="cart-summary-row"><span>Shipping:</span><span>${totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}</span></div>
    <div class="cart-summary-row"><span>Tax (8%):</span><span>${formatCurrency(totals.tax)}</span></div>
    <div class="cart-summary-row total"><span>Total:</span><span>${formatCurrency(totals.total)}</span></div>`;
}

function placeOrder() {
  const btn = $("#placeOrderBtn");
  if (btn) btn.disabled = true;
  try {
    const totals = getCartTotals();
    const orderId = generateOrderId();
    const order = {
      id: orderId,
      date: new Date().toLocaleDateString(),
      items: [...State.cart],
      totals,
      shipping: {
        name: `${$("#shipFirstName").value} ${$("#shipLastName").value}`,
        address: $("#shipAddress").value,
        city: $("#shipCity").value,
        zip: $("#shipZip").value,
        email: $("#shipEmail").value,
        phone: $("#shipPhone").value,
      },
      payment: document.querySelector('input[name="paymentMethod"]:checked')
        .value,
      status: "processing",
    };
    State.orders.unshift(order);
    saveState("orders", State.orders);
    // Clear cart
    State.cart = [];
    State.coupon = null;
    saveState("cart", State.cart);
    updateCartUI();
    // Award loyalty points
    if (window.addLoyaltyPoints) window.addLoyaltyPoints(totals.total);
    // Close checkout, show success
    $("#checkoutOverlay").classList.remove("active");
    $("#orderNumber").textContent = orderId;
    $("#successOverlay").classList.add("active");
    showToast("Order placed successfully!", "success");
  } catch (e) {
    console.error("[SwiftCart] placeOrder failed:", e);
    showToast("Order failed. Please try again.", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

function initOrderSuccess() {
  $("#viewOrderBtn").addEventListener("click", () => {
    $("#successOverlay").classList.remove("active");
    openOrders();
  });
  $("#continueShopping2").addEventListener("click", () => {
    $("#successOverlay").classList.remove("active");
    document.body.style.overflow = "";
  });
}

/* ========== ORDER HISTORY ========== */
function openOrders() {
  renderOrders();
  $("#ordersOverlay").classList.add("active");
}

function renderOrders() {
  const list = $("#ordersList");
  if (State.orders.length === 0) {
    list.innerHTML =
      '<div class="no-orders"><i class="fa-solid fa-clock-rotate-left"></i><p>No orders yet</p></div>';
    return;
  }
  const statusClasses = {
    processing: "status-processing",
    shipped: "status-shipped",
    delivered: "status-delivered",
  };
  list.innerHTML = State.orders
    .map(
      (o) => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-id">${Security.sanitize(o.id)}</span>
        <span class="order-status ${statusClasses[o.status] || "status-processing"}">${o.status.toUpperCase()}</span>
      </div>
      <div class="order-card-body">
        <p><strong>Date:</strong> ${o.date}</p>
        <p><strong>Total:</strong> ${formatCurrency(o.totals.total)}</p>
        <p><strong>Items:</strong> ${o.items.reduce((s, i) => s + i.qty, 0)}</p>
        <div class="order-items-list">${o.items.map((i) => `<div class="oi-item"><span>${Security.sanitize(i.title.substring(0, 45))}... x${i.qty}</span><span>${formatCurrency(i.price * i.qty)}</span></div>`).join("")}</div>
      </div>
    </div>`,
    )
    .join("");
}

function initOrders() {
  $("#ordersClose").addEventListener("click", () => {
    $("#ordersOverlay").classList.remove("active");
    document.body.style.overflow = "";
  });
  $("#ordersOverlay").addEventListener("click", (e) => {
    if (e.target === $("#ordersOverlay")) {
      $("#ordersOverlay").classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

/* ========== AUTH ========== */
function openAuth() {
  const overlay = $("#authOverlay");
  if (State.user) {
    $("#loginForm").style.display = "none";
    $("#registerForm").style.display = "none";
    $$(".auth-tab").forEach((t) => (t.style.display = "none"));
    $("#userProfile").style.display = "block";
    $("#profileAvatar").textContent = (
      State.user.firstName[0] + State.user.lastName[0]
    ).toUpperCase();
    $("#profileName").textContent =
      `${State.user.firstName} ${State.user.lastName}`;
    $("#profileEmail").textContent = State.user.email;
  } else {
    $$(".auth-tab").forEach((t) => (t.style.display = "block"));
    $$(".auth-tab")[0].click();
    $("#userProfile").style.display = "none";
  }
  overlay.classList.add("active");
}

function initAuth() {
  const overlay = $("#authOverlay");
  $("#userIcon").addEventListener("click", openAuth);
  $("#authClose").addEventListener("click", () => {
    overlay.classList.remove("active");
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("active");
  });

  // Tabs
  $$(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".auth-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      if (tab.dataset.tab === "login") {
        $("#loginForm").style.display = "block";
        $("#registerForm").style.display = "none";
      } else {
        $("#loginForm").style.display = "none";
        $("#registerForm").style.display = "block";
      }
    });
  });

  // Login
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = Security.sanitizeInput($("#loginEmail").value);
    const password = $("#loginPassword").value;
    if (!Security.validateEmail(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    // Simulate login
    State.user = { firstName: email.split("@")[0], lastName: "User", email };
    saveState("user", State.user);
    showToast("Logged in successfully!", "success");
    overlay.classList.remove("active");
    updateAuthUI();
  });

  // Register
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const first = Security.sanitizeInput($("#regFirstName").value);
    const last = Security.sanitizeInput($("#regLastName").value);
    const email = Security.sanitizeInput($("#regEmail").value);
    const pass = $("#regPassword").value;
    const confirm = $("#regConfirmPassword").value;
    if (!Security.validateEmail(email)) {
      showToast("Invalid email", "error");
      return;
    }
    if (pass.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (pass !== confirm) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!$("#agreeTerms").checked) {
      showToast("Please agree to terms", "error");
      return;
    }
    State.user = { firstName: first, lastName: last, email };
    saveState("user", State.user);
    showToast("Account created successfully!", "success");
    overlay.classList.remove("active");
    updateAuthUI();
  });

  // Password strength
  $("#regPassword").addEventListener("input", (e) => {
    const val = e.target.value;
    const bar = $("#passwordStrength");
    let strength = "";
    if (
      val.length >= 8 &&
      /[A-Z]/.test(val) &&
      /[0-9]/.test(val) &&
      /[^A-Za-z0-9]/.test(val)
    )
      strength = "strength-strong";
    else if (val.length >= 6 && (/[A-Z]/.test(val) || /[0-9]/.test(val)))
      strength = "strength-medium";
    else if (val.length > 0) strength = "strength-weak";
    bar.innerHTML = `<div class="strength-bar ${strength}"></div>`;
  });

  // Password visibility
  $$(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-solid fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fa-solid fa-eye";
      }
    });
  });

  // Social login stubs
  $$(".btn-social").forEach((btn) => {
    btn.addEventListener("click", () =>
      showToast("Social login coming soon!", "info"),
    );
  });

  // Forgot password
  $(".forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Password reset link sent!", "info");
  });

  // Profile menu
  $("#logoutBtn").addEventListener("click", () => {
    State.user = null;
    saveState("user", null);
    showToast("Logged out", "info");
    overlay.classList.remove("active");
    updateAuthUI();
  });
  $("#viewOrdersBtn").addEventListener("click", () => {
    overlay.classList.remove("active");
    openOrders();
  });
  $("#viewWishlistBtn").addEventListener("click", () => {
    overlay.classList.remove("active");
    $("#wishlistOverlay").classList.add("active");
    renderWishlistItems();
  });

  updateAuthUI();
}

function updateAuthUI() {
  const icon = $("#userIcon i");
  if (State.user) icon.className = "fa-solid fa-user-check";
  else icon.className = "fa-solid fa-user";
}

/* ========== FAQ ========== */
function initFAQ() {
  $$(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("active");
      $$(".faq-item").forEach((i) => {
        i.classList.remove("active");
        i.querySelector(".faq-answer").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("active");
        const answer = item.querySelector(".faq-answer");
        answer.style.maxHeight = answer.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      } else {
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/* ========== NEWSLETTER ========== */
function initNewsletter() {
  $("#newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = Security.sanitizeInput($("#newsletterEmail").value);
    if (!Security.validateEmail(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }
    showToast(
      "Subscribed successfully! Check your email for 15% off.",
      "success",
    );
    $("#newsletterEmail").value = "";
  });
}

/* ========== SCROLL TO TOP ========== */
function initScrollTop() {
  $("#scrollTopBtn").addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

/* ========== COOKIE CONSENT ========== */
function initCookies() {
  if (localStorage.getItem("swiftcart_cookies")) return;
  const banner = $("#cookieBanner");
  banner.style.display = "block";
  $("#acceptCookies").addEventListener("click", () => {
    localStorage.setItem("swiftcart_cookies", "accepted");
    banner.style.display = "none";
    showToast("Cookies accepted", "info");
  });
  $("#declineCookies").addEventListener("click", () => {
    localStorage.setItem("swiftcart_cookies", "declined");
    banner.style.display = "none";
  });
}

/* ========== CURRENCY SWITCHER ========== */
function initCurrencySwitcher() {
  const rates = { USD: 1, EUR: 0.92, GBP: 0.79, BDT: 110.5, INR: 83.2, JPY: 149.8 };
  const symbols = { USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥' };
  const btn = $('#currencyBtn');
  const dropdown = $('#currencyDropdown');
  if (!btn || !dropdown) return;
  let currentCurrency = 'USD';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });
  document.addEventListener('click', () => dropdown.classList.remove('show'));

  dropdown.querySelectorAll('.currency-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const code = opt.dataset.currency;
      if (code === currentCurrency) return;
      dropdown.querySelectorAll('.currency-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      currentCurrency = code;
      btn.querySelector('.curr-code').textContent = code;
      // Update formatCurrency globally
      window._currencyRate = rates[code];
      window._currencySymbol = symbols[code];
      // Re-render products and cart
      renderProducts(State.filteredProducts);
      updateCartUI();
      renderCartItems();
      dropdown.classList.remove('show');
      showToast(`Currency changed to ${code}`, 'info');
    });
  });
}

/* ========== NOTIFICATION CENTER ========== */
function initNotificationCenter() {
  const btn = $('#notifBtn');
  const dropdown = $('#notifDropdown');
  const badge = $('#notifBadge');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove('show');
  });

  const clearBtn = dropdown.querySelector('.notif-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const list = dropdown.querySelector('.notif-list');
      list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-bell-slash" style="font-size:1.5rem;margin-bottom:8px;display:block"></i>No notifications</div>';
      if (badge) badge.style.display = 'none';
    });
  }
}

/* ========== LOYALTY POINTS ========== */
function initLoyaltyPoints() {
  const btn = document.querySelector('.loyalty-btn');
  const overlay = $('#loyaltyOverlay');
  const closeBtn = $('#loyaltyClose');
  if (!btn || !overlay) return;
  let points = parseInt(localStorage.getItem('swiftcart_loyalty') || '50'); // Start with welcome bonus

  function updateLoyaltyUI() {
    const balanceEl = $('#loyaltyBalance');
    const tierFill = $('#tierProgressFill');
    const tierMsg = $('#tierNextMsg');
    const tierBadge = overlay.querySelector('.tier-badge');
    if (balanceEl) balanceEl.textContent = points;
    // Tier system
    let tier = 'Bronze', nextTier = 500, tierClass = 'tier-bronze';
    if (points >= 2000) { tier = 'Platinum'; nextTier = points; tierClass = 'tier-platinum'; }
    else if (points >= 1000) { tier = 'Gold'; nextTier = 2000; tierClass = 'tier-gold'; }
    else if (points >= 500) { tier = 'Silver'; nextTier = 1000; tierClass = 'tier-silver'; }
    if (tierBadge) {
      tierBadge.className = `tier-badge ${tierClass}`;
      tierBadge.innerHTML = `<i class="fa-solid fa-medal"></i> ${tier}`;
    }
    const progress = tier === 'Platinum' ? 100 : (points / nextTier) * 100;
    if (tierFill) tierFill.style.width = Math.min(progress, 100) + '%';
    if (tierMsg) tierMsg.textContent = tier === 'Platinum' ? 'You\'ve reached the highest tier!' : `Earn ${nextTier - points} more points to reach ${tier === 'Bronze' ? 'Silver' : tier === 'Silver' ? 'Gold' : 'Platinum'}`;
    // Update badge in navbar
    const navBadge = document.querySelector('.loyalty-badge');
    if (navBadge) navBadge.textContent = points;
    localStorage.setItem('swiftcart_loyalty', points);
  }

  btn.addEventListener('click', () => {
    updateLoyaltyUI();
    overlay.classList.add('show');
  });
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });

  // Expose function to add points from purchases
  window.addLoyaltyPoints = function(amount) {
    points += Math.floor(amount);
    updateLoyaltyUI();
    showToast(`+${Math.floor(amount)} loyalty points earned!`, 'success');
  };
  updateLoyaltyUI();
}

/* ========== CATEGORY SHOWCASE ========== */
function initCategoryShowcase() {
  const cards = document.querySelectorAll('.cat-card');
  if (!cards.length) return;

  function updateCategoryCounts() {
    const counts = {};
    State.allProducts.forEach(p => {
      const cat = p.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    cards.forEach(card => {
      const cat = card.dataset.category;
      const span = card.querySelector('span');
      if (span && cat) {
        const count = counts[cat.toLowerCase()] || 0;
        span.textContent = `${count} items`;
      }
    });
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.dataset.category;
      if (!category) return;
      // Scroll to products
      const prodSection = document.getElementById('productsSection') || document.querySelector('.products');
      if (prodSection) prodSection.scrollIntoView({ behavior: 'smooth' });
      // Apply filter
      setTimeout(() => {
        const filterBtns = document.querySelectorAll('.filter-btn, [data-filter]');
        let found = false;
        filterBtns.forEach(btn => {
          if (btn.dataset.filter && btn.dataset.filter.toLowerCase() === category.toLowerCase()) {
            btn.click();
            found = true;
          }
        });
        if (!found) {
          State.filteredProducts = State.allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
          renderProducts(State.filteredProducts);
        }
      }, 400);
    });
  });

  // Update counts after products load
  const origFetch = window._swcFetchDone;
  window._swcFetchDone = function() {
    updateCategoryCounts();
    if (origFetch) origFetch();
  };
  // Also try now in case products already loaded
  if (State.allProducts.length) updateCategoryCounts();
}

/* ========== FREE SHIPPING PROGRESS BAR ========== */
function updateFreeShippingBar() {
  const bar = document.querySelector('.free-shipping-bar');
  if (!bar) return;
  const subtotal = State.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const threshold = 50;
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const fill = bar.querySelector('.shipping-progress-fill');
  const msg = bar.querySelector('.shipping-msg');
  const label = bar.querySelector('p');
  if (fill) fill.style.width = progress + '%';
  if (subtotal >= threshold) {
    if (label) label.innerHTML = '<i class="fa-solid fa-truck-fast"></i> You qualify for FREE shipping!';
    if (msg) msg.textContent = '🎉 Free shipping unlocked!';
  } else {
    const remaining = (threshold - subtotal).toFixed(2);
    if (label) label.innerHTML = `<i class="fa-solid fa-truck"></i> Add $${remaining} more for FREE shipping`;
    if (msg) msg.textContent = `$${subtotal.toFixed(2)} / $${threshold.toFixed(2)}`;
  }
}

/* ========== PRODUCT MODAL TABS ========== */
function initModalTabs() {
  const tabs = document.querySelectorAll('.modal-tab');
  const contents = document.querySelectorAll('.modal-tab-content');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

/* ========== SIZE & COLOR SELECTORS ========== */
function initSizeColorSelectors() {
  const sizeSelector = $('#sizeSelector');
  const colorSelector = $('#colorSelector');
  if (!sizeSelector && !colorSelector) return;

  // Size buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function showSizeColorForProduct(product) {
  const sizeSelector = $('#sizeSelector');
  const colorSelector = $('#colorSelector');
  if (!sizeSelector || !colorSelector) return;
  const cat = product.category.toLowerCase();
  const clothingCats = ["men's clothing", "women's clothing", "shoes"];
  if (clothingCats.some(c => cat.includes(c))) {
    sizeSelector.classList.add('visible');
    colorSelector.classList.add('visible');
  } else {
    sizeSelector.classList.remove('visible');
    colorSelector.classList.remove('visible');
  }
  // Reset selections
  document.querySelectorAll('.size-btn, .color-btn').forEach(b => b.classList.remove('selected'));
}

/* ========== SOCIAL PROOF POPUP ========== */
function initSocialProof() {
  const popup = $('#socialProofPopup');
  const closeBtn = $('#socialProofClose');
  if (!popup) return;

  const names = ['Ahmed R.', 'Fatima S.', 'Mohammad K.', 'Ayesha B.', 'John D.', 'Sarah M.', 'Ali H.', 'Priya N.', 'James L.', 'Emma W.', 'Carlos G.', 'Mia T.', 'Yuki K.', 'Hans B.'];
  const times = ['just now', '2 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago'];

  function showSocialProof() {
    if (!State.allProducts.length) return;
    const product = State.allProducts[Math.floor(Math.random() * State.allProducts.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const time = times[Math.floor(Math.random() * times.length)];
    const imgEl = $('#socialProofImg');
    const nameEl = $('#socialProofName');
    const prodEl = $('#socialProofProduct');
    const timeEl = $('#socialProofTime');
    if (imgEl) imgEl.style.backgroundImage = `url(${product.image})`;
    if (nameEl) nameEl.textContent = name;
    if (prodEl) prodEl.textContent = product.title.substring(0, 40) + (product.title.length > 40 ? '...' : '');
    if (timeEl) timeEl.textContent = time;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 5000);
  }

  if (closeBtn) closeBtn.addEventListener('click', () => popup.classList.remove('show'));

  // First popup after 20 seconds, then every 30-60 seconds
  setTimeout(() => {
    showSocialProof();
    setInterval(() => showSocialProof(), 30000 + Math.random() * 30000);
  }, 20000);
}

/* ========== LIVE CHAT WIDGET ========== */
function initLiveChat() {
  const toggle = $('#chatToggle');
  const window_ = $('#chatWindow');
  const minimize = $('#chatMinimize');
  const input = $('#chatInput');
  const sendBtn = $('#chatSend');
  const messages = $('#chatMessages');
  const quickReplies = $('#chatQuickReplies');
  const unread = document.querySelector('.chat-unread');
  if (!toggle || !window_) return;

  const botResponses = {
    'track my order': 'You can track your order from the "My Orders" section. Click the user icon → Orders to view your recent purchases and tracking details! 📦',
    'i need help with returns': 'We offer a 30-day return policy for all items in original condition. To start a return, go to My Orders and select the item you wish to return. We\'ll provide a prepaid shipping label! 🔄',
    'what are your shipping options?': 'We offer 3 shipping options:\n• Standard (3-5 days) — $4.99 (FREE over $50)\n• Express (1-2 days) — $9.99\n• Overnight — $19.99\nAll orders over $50 get free standard shipping! 🚚',
    'i have a question about a product': 'I\'d be happy to help! Please share the product name or describe what you\'re looking for, and I\'ll find the information you need. 🔍',
    'default': 'Thanks for your message! Our team will get back to you shortly. In the meantime, feel free to browse our latest deals! 😊'
  };

  function addMessage(text, isUser = false) {
    const div = document.createElement('div');
    div.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `<div class="chat-msg-bubble">${Security.sanitize(text)}</div><small>${isUser ? 'You' : 'SwiftCart Bot'} • ${time}</small>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function handleUserMessage(text) {
    addMessage(text, true);
    if (quickReplies) quickReplies.style.display = 'none';
    // Bot typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.innerHTML = '<div class="chat-msg-bubble">Typing...</div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const key = text.toLowerCase();
      const response = botResponses[key] || botResponses['default'];
      addMessage(response);
    }, 1000 + Math.random() * 1000);
  }

  toggle.addEventListener('click', () => {
    window_.classList.toggle('open');
    if (unread) unread.style.display = 'none';
    if (window_.classList.contains('open') && input) input.focus();
  });
  if (minimize) minimize.addEventListener('click', () => window_.classList.remove('open'));
  if (sendBtn) sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) { handleUserMessage(text); input.value = ''; }
  });
  if (input) input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = input.value.trim();
      if (text) { handleUserMessage(text); input.value = ''; }
    }
  });
  if (quickReplies) {
    quickReplies.querySelectorAll('.quick-reply').forEach(btn => {
      btn.addEventListener('click', () => handleUserMessage(btn.dataset.msg));
    });
  }
}

/* ========== SPIN-TO-WIN WHEEL ========== */
function initSpinWheel() {
  const overlay = $('#spinOverlay');
  const closeBtn = $('#spinClose');
  const spinBtn = $('#spinBtn');
  const wheel = $('#spinWheel');
  const result = $('#spinResult');
  if (!overlay || !wheel) return;

  const prizes = ['5%', '10%', 'FREE SHIP', '15%', '$5 OFF', '20%', 'TRY AGAIN', '25%'];
  let hasSpun = localStorage.getItem('swiftcart_spun');
  let isSpinning = false;

  // Show spin popup after 45 seconds for first-time visitors
  if (!hasSpun) {
    setTimeout(() => {
      if (!hasSpun) overlay.classList.add('show');
    }, 45000);
  }

  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });

  if (spinBtn) spinBtn.addEventListener('click', () => {
    if (isSpinning || hasSpun) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = 'Spinning...';

    const segmentAngle = 360 / prizes.length;
    const winIndex = Math.floor(Math.random() * prizes.length);
    // Spin to land on the winning segment
    const rotation = 360 * 5 + (360 - winIndex * segmentAngle - segmentAngle / 2);
    wheel.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
      isSpinning = false;
      hasSpun = true;
      localStorage.setItem('swiftcart_spun', 'true');
      const prize = prizes[winIndex];
      if (prize === 'TRY AGAIN') {
        result.textContent = 'Better luck next time! 😢';
        result.className = 'spin-result lose';
      } else {
        result.textContent = `🎉 You won ${prize} OFF! Code: SPIN${prize.replace(/[^A-Z0-9]/g, '')}`;
        result.className = 'spin-result win';
        showToast(`You won ${prize}! Use code SPIN${prize.replace(/[^A-Z0-9]/g, '')}`, 'success', 6000);
      }
      spinBtn.textContent = 'Already Spun';
    }, 4500);
  });
}

/* ========== BACK IN STOCK ALERT ========== */
function initStockAlert() {
  const overlay = $('#stockAlertOverlay');
  const closeBtn = $('#stockAlertClose');
  const form = $('#stockAlertForm');
  if (!overlay) return;

  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });

  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#stockAlertEmail').value;
    showToast(`We'll notify ${email} when this item is back!`, 'success');
    overlay.classList.remove('show');
    form.reset();
  });

  // Expose function to show alert
  window.showStockAlert = function() {
    overlay.classList.add('show');
  };
}

/* ========== ANIMATED STATS COUNTER ========== */
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');
  if (!stats.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target || el.textContent.replace(/[^0-9]/g, ''));
    const suffix = el.textContent.replace(/[0-9,]/g, '');
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 25);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(stat => observer.observe(stat));
  }
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", () => {
  const safeInit = (fn, name) => {
    try {
      fn();
    } catch (e) {
      console.error(`[SwiftCart] ${name} init failed:`, e);
    }
  };
  safeInit(initDarkMode, "DarkMode");
  safeInit(initAnnouncement, "Announcement");
  safeInit(initFlashTimer, "FlashTimer");
  safeInit(initNavbar, "Navbar");
  safeInit(initSearch, "Search");
  safeInit(initFilters, "Filters");
  safeInit(initCart, "Cart");
  safeInit(initWishlist, "Wishlist");
  safeInit(initCompare, "Compare");
  safeInit(initProductModal, "ProductModal");
  safeInit(initImageZoom, "ImageZoom");
  safeInit(initReviews, "Reviews");
  safeInit(initCheckout, "Checkout");
  safeInit(initOrderSuccess, "OrderSuccess");
  safeInit(initOrders, "Orders");
  safeInit(initAuth, "Auth");
  safeInit(initFAQ, "FAQ");
  safeInit(initNewsletter, "Newsletter");
  safeInit(initScrollTop, "ScrollTop");
  safeInit(initCookies, "Cookies");
  safeInit(initCurrencySwitcher, "CurrencySwitcher");
  safeInit(initNotificationCenter, "NotificationCenter");
  safeInit(initLoyaltyPoints, "LoyaltyPoints");
  safeInit(initCategoryShowcase, "CategoryShowcase");
  safeInit(initModalTabs, "ModalTabs");
  safeInit(initSizeColorSelectors, "SizeColorSelectors");
  safeInit(initSocialProof, "SocialProof");
  safeInit(initLiveChat, "LiveChat");
  safeInit(initSpinWheel, "SpinWheel");
  safeInit(initStockAlert, "StockAlert");
  safeInit(initStatsCounter, "StatsCounter");
  fetchProducts().catch((e) =>
    console.error("[SwiftCart] fetchProducts failed:", e),
  );
});
