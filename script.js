const products = [
  {
    id: "immunity-shot",
    name: "Immunity Shot",
    category: "Wellness shot",
    size: "100 ml",
    price: 180,
    image: "assets/immunity-shot.jpg",
    description: "Ginger and lemon wellness blend for a quick daily boost.",
  },
  {
    id: "glow-shot",
    name: "Glow Shot",
    category: "Beauty drink",
    size: "60 ml",
    price: 220,
    image: "assets/glow-shot.jpg",
    description: "Turmeric, vitamin C, amla, ginger, and lemon for inner glow.",
  },
  {
    id: "lip-balm",
    name: "Lip Balm",
    category: "Daily care",
    size: "15 g",
    price: 260,
    image: "assets/lip-balm.jpg",
    description: "Nourishing balm designed to protect and soften lips naturally.",
  },
  {
    id: "face-scrub",
    name: "Face Scrub",
    category: "Exfoliator",
    size: "100 g",
    price: 420,
    image: "assets/face-scrub.jpg",
    description: "Walnut shell, jojoba beads, aloe vera, and green tea extract.",
  },
  {
    id: "aloe-vera-gel",
    name: "Aloe Vera Gel",
    category: "Hydrator",
    size: "300 g",
    price: 520,
    image: "assets/aloe-vera-gel.jpg",
    description: "Cooling aloe gel for soothing hydration and refreshed skin.",
  },
  {
    id: "armpit-odor-cream",
    name: "Armpit Odor Cream",
    category: "Body care",
    size: "50 g",
    price: 390,
    image: "assets/armpit-odor-cream.jpg",
    description: "Aluminum-free odor care with aloe vera, chamomile, and tea tree oil.",
  },
  {
    id: "face-mask",
    name: "Face Mask",
    category: "Treatment",
    size: "100 g",
    price: 480,
    image: "assets/face-mask.jpg",
    description: "Kaolin clay, matcha, aloe vera, and niacinamide for clean pores.",
  },
  {
    id: "tan-remover-scrub",
    name: "Tan Remover Scrub",
    category: "Brightening",
    size: "50 g",
    price: 360,
    image: "assets/tan-remover-scrub.jpg",
    description: "Exfoliating scrub with licorice extract, aloe vera, and vitamin E.",
  },
];

const cart = new Map();
const money = new Intl.NumberFormat("en-MU", {
  style: "currency",
  currency: "MUR",
  maximumFractionDigits: 0,
});

const productGrid = document.querySelector("#productGrid");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartCount = document.querySelector("[data-cart-count]");
const cartSubtotal = document.querySelector("[data-cart-subtotal]");
const cartDelivery = document.querySelector("[data-cart-delivery]");
const cartTotal = document.querySelector("[data-cart-total]");
const checkoutDialog = document.querySelector("[data-checkout-dialog]");
const checkoutSummary = document.querySelector("[data-checkout-summary]");
const orderStatus = document.querySelector("[data-order-status]");
const contactStatus = document.querySelector("[data-contact-status]");

function formatPrice(value) {
  return money.format(value).replace("MUR", "Rs");
}

function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image}" alt="Ecoderm ${product.name}" loading="lazy" />
          <div class="product-info">
            <div class="product-meta">
              <span class="pill">${product.category}</span>
              <span class="pill">${product.size}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-bottom">
              <span class="price">${formatPrice(product.price)}</span>
              <button class="add-button" type="button" data-add="${product.id}">Add to cart</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function getCartLines() {
  return [...cart.entries()].map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { ...product, quantity, lineTotal: product.price * quantity };
  });
}

function getTotals() {
  const lines = getCartLines();
  const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const delivery = subtotal === 0 || subtotal >= 1500 ? 0 : 120;
  return { lines, subtotal, delivery, total: subtotal + delivery };
}

function renderCart() {
  const { lines, subtotal, delivery, total } = getTotals();
  const quantity = lines.reduce((sum, item) => sum + item.quantity, 0);

  cartCount.textContent = quantity;
  cartSubtotal.textContent = formatPrice(subtotal);
  cartDelivery.textContent = delivery === 0 ? "Free" : formatPrice(delivery);
  cartTotal.textContent = formatPrice(total);
  cartEmpty.hidden = lines.length > 0;

  cartItems.innerHTML = lines
    .map(
      (item) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.name}" />
          <div>
            <h3>${item.name}</h3>
            <p>${item.size} - ${formatPrice(item.price)} each</p>
            <div class="quantity-row">
              <div class="quantity-control" aria-label="Quantity for ${item.name}">
                <button type="button" data-decrease="${item.id}" aria-label="Decrease ${item.name}">-</button>
                <span>${item.quantity}</span>
                <button type="button" data-increase="${item.id}" aria-label="Increase ${item.name}">+</button>
              </div>
              <button class="remove-button" type="button" data-remove="${item.id}">Remove</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function openCart() {
  cartOverlay.hidden = false;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
}

function addToCart(productId) {
  cart.set(productId, (cart.get(productId) || 0) + 1);
  renderCart();
  openCart();
}

function changeQuantity(productId, change) {
  const nextQuantity = (cart.get(productId) || 0) + change;
  if (nextQuantity <= 0) {
    cart.delete(productId);
  } else {
    cart.set(productId, nextQuantity);
  }
  renderCart();
}

function renderCheckoutSummary() {
  const { lines, subtotal, delivery, total } = getTotals();
  checkoutSummary.innerHTML = [
    ...lines.map(
      (item) => `<div><span>${item.quantity} x ${item.name}</span><strong>${formatPrice(item.lineTotal)}</strong></div>`,
    ),
    `<div><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>`,
    `<div><span>Delivery</span><strong>${delivery === 0 ? "Free" : formatPrice(delivery)}</strong></div>`,
    `<div><span>Total</span><strong>${formatPrice(total)}</strong></div>`,
  ].join("");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  const addId = target.dataset.add;
  const increaseId = target.dataset.increase;
  const decreaseId = target.dataset.decrease;
  const removeId = target.dataset.remove;

  if (addId) addToCart(addId);
  if (increaseId) changeQuantity(increaseId, 1);
  if (decreaseId) changeQuantity(decreaseId, -1);
  if (removeId) {
    cart.delete(removeId);
    renderCart();
  }
  if (target.matches("[data-cart-open]")) openCart();
  if (target.matches("[data-cart-close]")) closeCart();
  if (target.matches("[data-checkout]")) {
    const { lines } = getTotals();
    if (!lines.length) {
      cartEmpty.hidden = false;
      return;
    }
    renderCheckoutSummary();
    orderStatus.textContent = "";
    checkoutDialog.showModal();
  }
  if (target.matches("[data-checkout-close]")) {
    checkoutDialog.close();
  }
  if (target.matches("[data-place-order]")) {
    const form = document.querySelector("#checkoutForm");
    if (!form.reportValidity()) return;
    orderStatus.textContent =
      "Order request prepared. Ecoderm will confirm payment and delivery details with the customer.";
    cart.clear();
    renderCart();
    closeCart();
  }
});

cartOverlay.addEventListener("click", closeCart);

document.querySelector("#contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.reset();
  contactStatus.textContent = "Message prepared. Connect this form to email or a backend to receive enquiries.";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

renderProducts();
renderCart();
