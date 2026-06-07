const products = [
  {
    id: "immunity-shot",
    name: "Immunity Shot",
    category: "Wellness",
    size: "60 ml",
    price: 150,
    image: "immunity-shot.jpg",
    description: "Ginger and lemon wellness blend for a quick daily boost.",
  },
  {
    id: "glow-shot",
    name: "Glow Shot",
    category: "Wellness",
    size: "60 ml",
    price: 150,
    image: "glow-shot.jpg",
    description: "Turmeric, vitamin C, amla, ginger, and lemon for inner glow.",
  },
  {
    id: "lip-balm",
    name: "Lip Balm",
    category: "Daily Care",
    size: "15 g",
    price: 200,
    image: "lip-balm.jpg",
    description: "Nourishing balm designed to protect and soften lips naturally.",
  },
  {
    id: "face-scrub",
    name: "Face Scrub",
    category: "Face Care",
    size: "100 g",
    price: 300,
    image: "face-scrub.jpg",
    description: "Walnut shell, jojoba beads, aloe vera, and green tea extract.",
  },
  {
    id: "aloe-vera-gel",
    name: "Aloe Vera Gel",
    category: "Face Care",
    size: "300 g",
    price: 320,
    image: "aloe-vera-gel.jpg",
    description: "Cooling aloe gel for soothing hydration and refreshed skin.",
  },
  {
    id: "armpit-odor-cream",
    name: "Armpit Odor Cream",
    category: "Body Care",
    size: "50 g",
    price: 300,
    image: "armpit-odor-cream.jpg",
    description: "Aluminum-free odor care with aloe vera, chamomile, and tea tree oil.",
  },
  {
    id: "face-mask",
    name: "Face Mask",
    category: "Face Care",
    size: "100 g",
    price: 400,
    image: "face-mask.jpg",
    description: "Aloe vera and niacinamide care for a refreshed, clean-feel routine.",
  },
  {
    id: "tan-remover-scrub",
    name: "Tan Remover Scrub",
    category: "Face Care",
    size: "50 g",
    price: 300,
    image: "tan-remover-scrub.jpg",
    description: "Exfoliating scrub with licorice extract, aloe vera, and vitamin E.",
  },
];

const cart = new Map();
const CART_STORAGE_KEY = "ecodermCart";
const money = new Intl.NumberFormat("en-MU", {
  style: "currency",
  currency: "MUR",
  maximumFractionDigits: 0,
});

const productGrid = document.querySelector("#productGrid");
const contactForm = document.querySelector("#contactForm");
const skinScanForm = document.querySelector("#skinScanForm");
const scanResult = document.querySelector("#scanResult");
const skinCamera = document.querySelector("#skinCamera");
const startScan = document.querySelector("#startScan");
const stopScan = document.querySelector("[data-stop-scan]");
const cameraPlaceholder = document.querySelector("[data-camera-placeholder]");
const scanStatus = document.querySelector("[data-scan-status]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartOverlay = document.querySelector("[data-cart-overlay]");
const cartItems = document.querySelector("[data-cart-items]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartCounts = document.querySelectorAll("[data-cart-count]");
const cartSubtotal = document.querySelector("[data-cart-subtotal]");
const cartDelivery = document.querySelector("[data-cart-delivery]");
const cartTotal = document.querySelector("[data-cart-total]");
const checkoutDialog = document.querySelector("[data-checkout-dialog]");
const checkoutSummary = document.querySelector("[data-checkout-summary]");
const orderStatus = document.querySelector("[data-order-status]");
const contactStatus = document.querySelector("[data-contact-status]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const menuBackdrop = document.querySelector("[data-menu-backdrop]");
const cookieBanner = document.querySelector("[data-cookie-banner]");
const aiPanel = document.querySelector("[data-ai-panel]");
const aiMessages = document.querySelector("[data-ai-messages]");
const aiForm = document.querySelector("[data-ai-form]");
const aiInput = document.querySelector("[data-ai-input]");
const installAppButton = document.querySelector("[data-install-app]");

let cameraStream = null;
let deferredInstallPrompt = null;
let autoScanTimer = null;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    savedCart.forEach(([id, quantity]) => {
      if (getProduct(id) && Number.isInteger(quantity) && quantity > 0) {
        cart.set(id, quantity);
      }
    });
  } catch (error) {
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...cart.entries()]));
}

function formatPrice(value) {
  return money.format(value).replace("MUR", "Rs");
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
}

function renderProducts() {
  if (!productGrid) return;
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
              <strong class="price">${formatPrice(product.price)}</strong>
              <button class="add-button" type="button" data-add="${product.id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function getCartLines() {
  return [...cart.entries()]
    .map(([id, quantity]) => {
      const product = getProduct(id);
      return product ? { ...product, quantity, lineTotal: product.price * quantity } : null;
    })
    .filter(Boolean);
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

  cartCounts.forEach((count) => {
    count.textContent = quantity;
  });

  if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
  if (cartDelivery) cartDelivery.textContent = delivery === 0 ? "Free" : formatPrice(delivery);
  if (cartTotal) cartTotal.textContent = formatPrice(total);
  if (cartEmpty) cartEmpty.hidden = lines.length > 0;
  if (!cartItems) return;

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
  if (!cartOverlay || !cartDrawer) return;
  cartOverlay.hidden = false;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  if (!cartOverlay || !cartDrawer) return;
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
}

function addToCart(productId) {
  cart.set(productId, (cart.get(productId) || 0) + 1);
  saveCart();
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
  saveCart();
  renderCart();
}

function renderCheckoutSummary() {
  if (!checkoutSummary) return;
  const { lines, subtotal, delivery, total } = getTotals();
  checkoutSummary.innerHTML = [
    ...lines.map((item) => `<div><span>${item.quantity} x ${item.name}</span><strong>${formatPrice(item.lineTotal)}</strong></div>`),
    `<div><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>`,
    `<div><span>Delivery fee</span><strong>${delivery === 0 ? "Free" : formatPrice(delivery)}</strong></div>`,
    `<div><span>Total</span><strong>${formatPrice(total)}</strong></div>`,
  ].join("");
}

function openMenu() {
  if (!mobileMenu || !menuBackdrop) return;
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
  menuBackdrop.hidden = false;
}

function closeMenu() {
  if (!mobileMenu || !menuBackdrop) return;
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  menuBackdrop.hidden = true;
}

function setScanStatus(message) {
  if (scanStatus) scanStatus.textContent = message;
}

function stopCamera() {
  if (autoScanTimer) {
    clearTimeout(autoScanTimer);
    autoScanTimer = null;
  }
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  if (skinCamera) skinCamera.srcObject = null;
  if (cameraPlaceholder) cameraPlaceholder.hidden = false;
}

function renderScanResult(title, reason, source = "Automatic scan") {
  if (!scanResult) return;
  scanResult.innerHTML = `
    <p class="scan-source">${source}</p>
    <h3>Recommended Product: ${title}</h3>
    <p>${reason}</p>
    <small>This is only a product suggestion, not medical advice. Patch test before use.</small>
  `;
}

function getAutomaticScanRecommendation(metrics) {
  const { brightness, contrast, saturation, warmth } = metrics;

  if (brightness > 166 && saturation < 0.18) {
    return {
      title: "Aloe Vera Gel + Lip Balm",
      reason: "The scan noticed a lighter, lower-saturation frame. Start with soothing hydration and daily moisture support.",
    };
  }

  if (contrast > 48 || saturation > 0.34) {
    return {
      title: "Face Mask + Aloe Vera Gel",
      reason: "The scan noticed stronger texture/contrast signals. A clean-feel mask followed by Aloe Vera Gel is a balanced routine.",
    };
  }

  if (brightness < 112 || saturation < 0.15) {
    return {
      title: "Glow Shot + Face Scrub",
      reason: "The scan noticed a duller-looking frame. Glow Shot and Face Scrub are a good match for a refreshed glow routine.",
    };
  }

  if (warmth > 24) {
    return {
      title: "Tan Remover Scrub",
      reason: "The scan noticed warmer tone signals. Tan Remover Scrub is the closest Ecoderm match for uneven tone support.",
    };
  }

  return {
    title: "Aloe Vera Gel",
    reason: "The scan found a balanced frame. Aloe Vera Gel is the safest simple recommendation for soothing daily care.",
  };
}

function captureFaceScanMetrics() {
  if (!skinCamera || !skinCamera.videoWidth || !skinCamera.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const width = 160;
  const height = 160;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const sourceSize = Math.min(skinCamera.videoWidth, skinCamera.videoHeight) * 0.56;
  const sourceX = (skinCamera.videoWidth - sourceSize) / 2;
  const sourceY = (skinCamera.videoHeight - sourceSize) / 2;
  context.drawImage(skinCamera, sourceX, sourceY, sourceSize, sourceSize, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  let brightnessTotal = 0;
  let saturationTotal = 0;
  let warmthTotal = 0;
  const brightnessValues = [];

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const brightness = (red + green + blue) / 3;
    const saturation = max === 0 ? 0 : (max - min) / max;
    brightnessTotal += brightness;
    saturationTotal += saturation;
    warmthTotal += red - blue;
    brightnessValues.push(brightness);
  }

  const pixelCount = brightnessValues.length;
  const brightness = brightnessTotal / pixelCount;
  const saturation = saturationTotal / pixelCount;
  const warmth = warmthTotal / pixelCount;
  const contrast = Math.sqrt(
    brightnessValues.reduce((sum, value) => sum + Math.pow(value - brightness, 2), 0) / pixelCount,
  );

  return { brightness, contrast, saturation, warmth };
}

function runAutomaticFaceScan() {
  setScanStatus("Scanning complete. Preparing your Ecoderm product suggestion...");

  try {
    const metrics = captureFaceScanMetrics();
    if (!metrics) {
      renderScanResult(
        "Aloe Vera Gel",
        "The camera preview is still loading, so the safest automatic suggestion is gentle soothing hydration.",
      );
      setScanStatus("Automatic scan completed with a general recommendation.");
      return;
    }

    const recommendation = getAutomaticScanRecommendation(metrics);
    renderScanResult(recommendation.title, recommendation.reason);
    setScanStatus("Automatic scan completed. You can still use the manual form below for a second suggestion.");
  } catch (error) {
    renderScanResult(
      "Aloe Vera Gel",
      "The automatic scan could not read the camera frame clearly, so the safest suggestion is gentle soothing hydration.",
    );
    setScanStatus("Automatic scan could not read the frame clearly. You can still use the manual form.");
  }
}

function scheduleAutomaticFaceScan() {
  if (autoScanTimer) clearTimeout(autoScanTimer);
  if (scanResult) {
    scanResult.innerHTML = `
      <p class="scan-source">Automatic scan</p>
      <h3>Scanning your face preview...</h3>
      <p>Keep your face centered in good light. Your recommendation will appear automatically.</p>
    `;
  }
  setScanStatus("Camera preview is active. Automatic scan is running...");
  autoScanTimer = setTimeout(runAutomaticFaceScan, 2200);
}

async function startCameraScan() {
  if (!navigator.mediaDevices?.getUserMedia || !skinCamera) {
    setScanStatus("Camera access is not available in this browser.");
    return;
  }

  try {
    setScanStatus("Requesting camera access...");
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false,
    });
    skinCamera.srcObject = cameraStream;
    if (cameraPlaceholder) cameraPlaceholder.hidden = true;
    scheduleAutomaticFaceScan();
  } catch (error) {
    setScanStatus("Camera permission was not granted. You can still use the recommendation form.");
  }
}

function getSkinRecommendation({ skinType, concern, sensitivity }) {
  if (sensitivity === "high" || skinType === "sensitive") {
    return {
      title: "Aloe Vera Gel",
      reason: "A gentle soothing option is the safest starting point for sensitive-feeling skin.",
    };
  }

  if (concern === "dryness" || skinType === "dry") {
    return {
      title: "Aloe Vera Gel + Lip Balm",
      reason: "This pairing supports hydration, cooling comfort, and daily moisture protection.",
    };
  }

  if (concern === "pores" || skinType === "oily") {
    return {
      title: "Face Mask + Aloe Vera Gel",
      reason: "Face Mask supports a clean-feel routine, while Aloe Vera Gel helps soothe after cleansing.",
    };
  }

  if (concern === "dullness") {
    return {
      title: "Glow Shot + Face Scrub",
      reason: "Glow Shot supports the wellness routine, while Face Scrub helps refresh dull surface buildup.",
    };
  }

  if (concern === "tan") {
    return {
      title: "Tan Remover Scrub",
      reason: "This is the closest match for tan, uneven tone, and brightening-focused exfoliation.",
    };
  }

  if (concern === "odor") {
    return {
      title: "Armpit Odor Cream",
      reason: "This product is designed for underarm freshness and daily body confidence.",
    };
  }

  return {
    title: "Aloe Vera Gel",
    reason: "Aloe Vera Gel is a simple general recommendation for most daily routines.",
  };
}

function showCookieBanner() {
  if (!cookieBanner) return;
  const savedChoice = localStorage.getItem("ecodermCookieChoice");
  cookieBanner.hidden = Boolean(savedChoice);
}

function saveCookieChoice(choice) {
  localStorage.setItem("ecodermCookieChoice", choice);
  if (cookieBanner) cookieBanner.hidden = true;
}

function openAssistant() {
  if (aiPanel) aiPanel.hidden = false;
}

function closeAssistant() {
  if (aiPanel) aiPanel.hidden = true;
}

function addAssistantMessage(type, message) {
  if (!aiMessages) return;
  const bubble = document.createElement("p");
  bubble.className = `ai-message ${type === "user" ? "ai-message-user" : "ai-message-bot"}`;
  bubble.textContent = message;
  aiMessages.appendChild(bubble);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function getAssistantReply(message) {
  const text = message.toLowerCase();

  if (text.includes("dry") || text.includes("sensitive")) {
    return "I suggest Aloe Vera Gel for soothing hydration. If lips feel dry too, add Lip Balm.";
  }
  if (text.includes("oily") || text.includes("pore") || text.includes("acne")) {
    return "I suggest Face Mask for a clean-feel routine, then Aloe Vera Gel to soothe after cleansing.";
  }
  if (text.includes("dull") || text.includes("glow")) {
    return "I suggest Glow Shot with Face Scrub. This supports a brighter-looking routine and smoother surface feel.";
  }
  if (text.includes("tan") || text.includes("uneven")) {
    return "I suggest Tan Remover Scrub for tan or uneven tone concerns. Patch test first.";
  }
  if (text.includes("odor") || text.includes("underarm") || text.includes("armpit")) {
    return "I suggest Armpit Odor Cream for daily underarm freshness and comfort.";
  }

  return "Tell me if your skin is dry, oily, sensitive, dull, uneven, or if you need underarm care, and I will suggest a product.";
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installAppButton) installAppButton.textContent = "App Installed";
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches("[data-menu-open]")) openMenu();
  if (target.matches("[data-menu-close]") || target.matches("[data-menu-link]")) closeMenu();
  if (target.matches("[data-cart-open]")) openCart();
  if (target.matches("[data-cart-close]")) closeCart();
  if (target.matches("[data-checkout-close]")) checkoutDialog?.close();
  if (target.matches("[data-cookie-accept]")) saveCookieChoice("accepted");
  if (target.matches("[data-cookie-decline]")) saveCookieChoice("declined");
  if (target.matches("[data-ai-open]")) openAssistant();
  if (target.matches("[data-ai-close]")) closeAssistant();

  if (target.matches("[data-install-app]")) {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
      });
    } else {
      target.textContent = "Install option is available from your browser menu.";
      setTimeout(() => {
        target.textContent = "Install App";
      }, 3500);
    }
  }

  if (target.dataset.add) addToCart(target.dataset.add);
  if (target.dataset.increase) changeQuantity(target.dataset.increase, 1);
  if (target.dataset.decrease) changeQuantity(target.dataset.decrease, -1);
  if (target.dataset.remove) {
    cart.delete(target.dataset.remove);
    saveCart();
    renderCart();
  }

  if (target.matches("[data-checkout]")) {
    const { lines } = getTotals();
    if (!lines.length) return;
    renderCheckoutSummary();
    if (orderStatus) orderStatus.textContent = "";
    checkoutDialog?.showModal();
  }

  if (target.matches("[data-place-order]")) {
    const form = document.querySelector("[data-checkout-form]");
    if (!form.reportValidity()) return;
    orderStatus.textContent = "Order request received. Ecoderm will confirm payment and delivery details.";
    cart.clear();
    saveCart();
    renderCart();
    closeCart();
  }
});

menuBackdrop?.addEventListener("click", closeMenu);
cartOverlay?.addEventListener("click", closeCart);
startScan?.addEventListener("click", startCameraScan);
stopScan?.addEventListener("click", () => {
  stopCamera();
  setScanStatus("Camera stopped. You can restart it anytime.");
});

skinScanForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const skinType = document.querySelector("#skinType").value;
  const concern = document.querySelector("#skinConcern").value;
  const sensitivity = document.querySelector("#sensitivity").value;
  const recommendation = getSkinRecommendation({ skinType, concern, sensitivity });

  scanResult.innerHTML = `
    <p class="scan-source">Manual recommendation</p>
    <h3>Recommended Product: ${recommendation.title}</h3>
    <p>${recommendation.reason}</p>
    <small>This is only a product suggestion, not medical advice. Patch test before use.</small>
  `;
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.reset();
  contactStatus.textContent = "Message prepared. Connect this form to email or a backend to receive enquiries.";
});

aiForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = aiInput.value.trim();
  if (!message) return;
  addAssistantMessage("user", message);
  addAssistantMessage("bot", getAssistantReply(message));
  aiInput.value = "";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeCart();
    closeAssistant();
    if (checkoutDialog?.open) checkoutDialog.close();
  }
});

window.addEventListener("pagehide", stopCamera);

loadCart();
renderProducts();
renderCart();
showCookieBanner();
setupInstallPrompt();
