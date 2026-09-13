// LOCAL DISH DATA
const DISHES = [
  { id: 1, name: "Signature Jollof Rice", description: "Smoky party-style jollof slow-cooked over firewood, served with grilled chicken and fresh coleslaw.", price: 5500, image: "images/jollof.jpg", tag: "Bestseller" },
  { id: 2, name: "Pepper Soup", description: "Deeply spiced goat-meat pepper soup with uziza leaves, a ChopHouse staple since day one.", price: 4200, image: "images/pepper-soup.jpg" },
  { id: 3, name: "Egusi Soup & Pounded Yam", description: "Richly blended melon seed soup with stockfish, beef, and spinach. Served with silky pounded yam.", price: 6800, image: "images/egusi.jpg", tag: "Chef's Pick" },
  { id: 4, name: "Suya Platter", description: "Thinly sliced spiced beef suya, skewered and fire-grilled, served with raw onions, tomatoes, and yaji spice.", price: 3900, image: "images/suya.jpg" },
  { id: 5, name: "Ofe Onugbu & Fufu", description: "Bitter-leaf soup prepared with assorted meats and crayfish, served with freshly pounded cocoyam fufu.", price: 5900, image: "images/onugbu.jpg" },
  { id: 6, name: "Grilled Tilapia & Fried Plantain", description: "Whole tilapia marinated in house spice blend, charcoal-grilled and served with sweet fried plantain.", price: 7200, image: "images/tilapia.jpg", tag: "New" }
];

let cart = {};

const formatMoney = (val) => `₦${val.toLocaleString("en-NG")}`;

// OPEN/CLOSE CART HANDLERS
window.openCart = function() {
  const overlay = document.getElementById("cart-drawer-overlay");
  if (overlay) {
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
};

window.closeCart = function() {
  const overlay = document.getElementById("cart-drawer-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
};

window.addToCart = function(dishId, btnElement) {
  cart[dishId] = (cart[dishId] || 0) + 1;
  
  if (btnElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Added ✓";
    setTimeout(() => { btnElement.innerText = originalText; }, 1000);
  }
  
  updateCartUI();
  renderDishes();
};

window.updateQuantity = function(dishId, delta) {
  if (!cart[dishId]) return;
  cart[dishId] += delta;
  if (cart[dishId] <= 0) {
    delete cart[dishId];
  }
  updateCartUI();
  renderDishes();
};

window.removeFromCart = function(dishId) {
  delete cart[dishId];
  updateCartUI();
  renderDishes();
};

// INITIAL RENDER & EVENT REGISTRATION
document.addEventListener("DOMContentLoaded", () => {
  renderDishes();
  updateCartUI();
  setupClickDelegation();
  setupFormHandlers();
});

// RENDER DISH CARDS
function renderDishes() {
  const dishesGrid = document.getElementById("dishes-grid");
  if (!dishesGrid) return;

  dishesGrid.innerHTML = DISHES.map(dish => {
    const qtyInCart = cart[dish.id] || 0;
    return `
      <article class="dish-card">
        <div class="dish-img-box">
          <img src="${dish.image}" alt="${dish.name}" loading="lazy" class="dish-img" onerror="this.style.backgroundColor='#2a221f';" />
          ${dish.tag ? `<span class="dish-tag">${dish.tag}</span>` : ""}
        </div>
        <div class="dish-details">
          <h3 class="dish-name">${dish.name}</h3>
          <p class="dish-desc">${dish.description}</p>
          <div class="dish-footer">
            <div>
              <strong class="dish-price">${formatMoney(dish.price)}</strong>
              ${qtyInCart > 0 ? `<small style="color:var(--muted-foreground); margin-left:0.25rem;">× ${qtyInCart} in cart</small>` : ""}
            </div>
            <button class="btn btn-primary" onclick="addToCart(${dish.id}, this)">
              Add to Cart
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// CALCULATE SUBTOTAL
function getCartSubtotal() {
  return DISHES.reduce((sum, dish) => sum + (dish.price * (cart[dish.id] || 0)), 0);
}

// UPDATE CHECKOUT TOTALS
function updateCheckoutTotals() {
  const subtotal = getCartSubtotal();
  const areaSelect = document.getElementById("order-area");
  const deliveryFee = areaSelect ? (parseInt(areaSelect.value, 10) || 1500) : 1500;
  const grandTotal = subtotal + deliveryFee;

  const checkoutSubtotal = document.getElementById("checkout-subtotal");
  const checkoutDelivery = document.getElementById("checkout-delivery");
  const checkoutGrandTotal = document.getElementById("checkout-grand-total");

  if (checkoutSubtotal) checkoutSubtotal.innerText = formatMoney(subtotal);
  if (checkoutDelivery) checkoutDelivery.innerText = formatMoney(deliveryFee);
  if (checkoutGrandTotal) checkoutGrandTotal.innerText = formatMoney(grandTotal);
}

// UPDATE CART UI STATE
function updateCartUI() {
  const totalCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const subtotal = getCartSubtotal();

  // Update badge counters
  const cartBadges = document.querySelectorAll(".cart-badge");
  cartBadges.forEach(badge => {
    badge.innerText = totalCount;
    if (totalCount > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  });

  const cartHeaderCount = document.getElementById("cart-header-count");
  if (cartHeaderCount) cartHeaderCount.innerText = `(${totalCount})`;

  const cartEmptyState = document.getElementById("cart-empty");
  const cartContentView = document.getElementById("cart-content");
  const checkoutView = document.getElementById("checkout-view");
  const successView = document.getElementById("order-success-view");

  if (totalCount === 0) {
    if (cartEmptyState) cartEmptyState.classList.remove("hidden");
    if (cartContentView) cartContentView.classList.add("hidden");
    if (checkoutView) checkoutView.classList.add("hidden");
    if (successView) successView.classList.add("hidden");
    resetCartDrawerHeaders("Your Order", "Cart");
  } else {
    if (cartEmptyState) cartEmptyState.classList.add("hidden");

    const isCheckoutVisible = checkoutView && !checkoutView.classList.contains("hidden");
    const isSuccessVisible = successView && !successView.classList.contains("hidden");

    if (!isCheckoutVisible && !isSuccessVisible) {
      if (cartContentView) cartContentView.classList.remove("hidden");
      resetCartDrawerHeaders("Your Order", "Cart");
    }

    renderCartItems();

    const cartSubtotal = document.getElementById("cart-subtotal");
    const cartTotal = document.getElementById("cart-total");
    if (cartSubtotal) cartSubtotal.innerText = formatMoney(subtotal);
    if (cartTotal) cartTotal.innerText = formatMoney(subtotal);

    updateCheckoutTotals();
  }
}

function renderCartItems() {
  const cartItemsList = document.getElementById("cart-items");
  if (!cartItemsList) return;

  const activeItems = DISHES.filter(d => cart[d.id]);

  if (activeItems.length === 0) {
    cartItemsList.innerHTML = "";
    return;
  }

  cartItemsList.innerHTML = activeItems.map(dish => `
    <div class="cart-item">
      <img src="${dish.image}" alt="${dish.name}" class="cart-item-img" onerror="this.style.backgroundColor='#2a221f';" />
      <div class="cart-item-info">
        <h3 class="cart-item-title">${dish.name}</h3>
        <p class="cart-item-price">${formatMoney(dish.price)}</p>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem;">
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQuantity(${dish.id}, -1)">-</button>
            <span class="qty-count">${cart[dish.id]}</span>
            <button class="qty-btn" onclick="updateQuantity(${dish.id}, 1)">+</button>
          </div>
          <button class="icon-btn" style="color:var(--muted-foreground);" onclick="removeFromCart(${dish.id})">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function resetCartDrawerHeaders(step, main) {
  const stepTitle = document.getElementById("cart-step-title");
  const mainHeading = document.getElementById("cart-main-heading");
  const totalCount = Object.values(cart).reduce((sum, count) => sum + count, 0);

  if (stepTitle) stepTitle.innerText = step;
  if (mainHeading) mainHeading.innerHTML = `${main} <span id="cart-header-count">(${totalCount})</span>`;
}

// FORM & CHECKOUT HANDLERS
function setupFormHandlers() {
  const areaSelect = document.getElementById("order-area");
  if (areaSelect) {
    areaSelect.addEventListener("change", () => {
      updateCheckoutTotals();
    });
  }

  const orderForm = document.getElementById("order-form");
  if (orderForm) {
    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("order-name").value.trim();
      const phone = document.getElementById("order-phone").value.trim();
      const address = document.getElementById("order-address").value.trim();

      let hasError = false;

      document.getElementById("err-order-name").innerText = "";
      document.getElementById("err-order-phone").innerText = "";
      document.getElementById("err-order-address").innerText = "";

      if (!name) {
        document.getElementById("err-order-name").innerText = "Please enter your name";
        hasError = true;
      }

      if (!phone || phone.length < 10) {
        document.getElementById("err-order-phone").innerText = "Please enter a valid phone number";
        hasError = true;
      }

      if (!address) {
        document.getElementById("err-order-address").innerText = "Please enter your delivery address";
        hasError = true;
      }

      if (!hasError) {
        // Complete Order & Clear State Across Entire UI
        cart = {}; 
        updateCartUI();
        renderDishes(); // Re-renders menu grid so dish badges clear completely

        document.getElementById("checkout-view").classList.add("hidden");
        document.getElementById("order-success-view").classList.remove("hidden");
        
        resetCartDrawerHeaders("Confirmed", "Success");
        
        const successMsg = document.getElementById("success-message");
        if (successMsg) {
          successMsg.innerText = `Thanks ${name}! Your order has been dispatched. Our rider will reach out to ${phone} upon arrival.`;
        }
      }
    });
  }
}

// EVENT DELEGATION FOR CLICK EVENTS
function setupClickDelegation() {
  document.addEventListener("click", (e) => {
    // 1. Open Cart
    const cartToggle = e.target.closest("#cart-toggle-desktop, #cart-toggle-mobile, .cart-btn");
    if (cartToggle) {
      e.preventDefault();
      window.openCart();
      return;
    }

    // 2. Close Cart (X button OR backdrop overlay click outside)
    const cartCloseBtn = e.target.closest("#cart-close, #cart-backdrop, #cart-browse-btn");
    if (cartCloseBtn || e.target.id === "cart-drawer-overlay") {
      e.preventDefault();
      window.closeCart();
      return;
    }

    // 3. Proceed to Checkout View
    const proceedBtn = e.target.closest("#proceed-checkout-btn, .cart-footer .btn-primary");
    if (proceedBtn && !proceedBtn.id.includes("place-order")) {
      e.preventDefault();
      const cartContent = document.getElementById("cart-content");
      const checkoutView = document.getElementById("checkout-view");
      
      if (cartContent && checkoutView) {
        cartContent.classList.add("hidden");
        checkoutView.classList.remove("hidden");
        updateCheckoutTotals();
        resetCartDrawerHeaders("Delivery Details", "Checkout");
      }
      return;
    }

    // 4. Back to Cart Items Step
    const backBtn = e.target.closest("#back-to-cart-btn");
    if (backBtn) {
      e.preventDefault();
      const cartContent = document.getElementById("cart-content");
      const checkoutView = document.getElementById("checkout-view");

      if (cartContent && checkoutView) {
        checkoutView.classList.add("hidden");
        cartContent.classList.remove("hidden");
        resetCartDrawerHeaders("Your Order", "Cart");
      }
      return;
    }

    // 5. Reset Success Screen
    const successCloseBtn = e.target.closest("#success-close-btn");
    if (successCloseBtn) {
      e.preventDefault();
      const successView = document.getElementById("order-success-view");
      if (successView) successView.classList.add("hidden");
      window.closeCart();
      return;
    }

    // 6. Mobile Menu Link Click Handler (Auto-Closes Mobile Drawer)
    const mobileNavLink = e.target.closest(".mobile-nav-link, .mobile-menu .btn");
    if (mobileNavLink) {
      const mobileMenu = document.getElementById("mobile-menu");
      const menuIconOpen = document.getElementById("menu-icon-open");
      const menuIconClose = document.getElementById("menu-icon-close");

      if (mobileMenu) {
        mobileMenu.classList.add("hidden");
        if (menuIconOpen) menuIconOpen.classList.remove("hidden");
        if (menuIconClose) menuIconClose.classList.add("hidden");
      }
      return;
    }

    // 7. Mobile Menu Toggle
    const menuToggleBtn = e.target.closest("#menu-toggle");
    if (menuToggleBtn) {
      e.preventDefault();
      const mobileMenu = document.getElementById("mobile-menu");
      const menuIconOpen = document.getElementById("menu-icon-open");
      const menuIconClose = document.getElementById("menu-icon-close");
      
      if (mobileMenu) {
        const isOpen = mobileMenu.classList.contains("hidden");
        if (isOpen) {
          mobileMenu.classList.remove("hidden");
          if (menuIconOpen) menuIconOpen.classList.add("hidden");
          if (menuIconClose) menuIconClose.classList.remove("hidden");
        } else {
          mobileMenu.classList.add("hidden");
          if (menuIconOpen) menuIconOpen.classList.remove("hidden");
          if (menuIconClose) menuIconClose.classList.add("hidden");
        }
      }
    }
  });
}