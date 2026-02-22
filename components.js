// ===== SHARED COMPONENTS =====

// ---- NAVBAR ----
function renderNavbar() {
  const { user } = State.getState();
  return `
  <nav class="navbar">
    <div class="nav-logo" data-action="goHome">Eat<span>Club</span></div>
    <div class="nav-actions">
      ${user ? `
        <span class="text-muted text-sm">Hi, ${user.name.split(' ')[0]} 👋</span>
        ${user.role === 'admin' ? `<button class="btn btn-secondary btn-sm" data-action="goAdmin">⚙️ Admin</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="logout">Logout</button>
      ` : `
        <button class="btn btn-primary btn-sm" data-action="openLogin">Sign In</button>
      `}
    </div>
  </nav>`;
}

// ---- LOGIN MODAL ----
function renderLoginModal() {
  return `
  <div class="modal-backdrop" data-action="closeModal">
    <div class="modal-box" id="login-modal-box">
      <div class="modal-logo"><span class="grd">EatClub</span></div>
      <div class="modal-subtitle">Sign in to order from your favourite brands</div>
      <div id="login-error" class="error-msg hidden"></div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" id="login-email" placeholder="you@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" type="password" id="login-password" placeholder="••••••••" />
      </div>
      <button class="btn btn-primary btn-block btn-lg mt-16" data-action="doLogin">Sign In</button>
      <div class="mt-16 text-sm text-muted" style="text-align:center">
        <strong>Customer:</strong> customer@test.com / password<br/>
        <strong>Admin:</strong> admin@test.com / password
      </div>
    </div>
  </div>`;
}

// ---- CART DRAWER ----
function renderCartDrawer() {
  const { cart, currentBrandId } = State.getState();
  const total = cartTotal();
  return `
  <div class="drawer-overlay" data-action="closeCart"></div>
  <div class="drawer">
    <div class="drawer-header">
      <h3>🛒 Your Cart</h3>
      <button class="btn btn-ghost btn-sm" data-action="closeCart">✕ Close</button>
    </div>
    <div class="drawer-body">
      ${cart.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <div class="empty-state-text">Your cart is empty</div>
        </div>
      ` : cart.map(c => `
        <div class="cart-item">
          <div class="cart-item-emoji">${c.item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${c.item.name}</div>
            <div class="cart-item-price">₹${c.item.price} × ${c.qty} = ₹${c.item.price * c.qty}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" data-action="removeItem" data-item="${c.item.id}">−</button>
            <span class="qty-num">${c.qty}</span>
            <button class="qty-btn" data-action="addItem" data-item="${c.item.id}" data-brand="${c.brandId}">+</button>
          </div>
        </div>
      `).join('')}
    </div>
    ${cart.length > 0 ? `
    <div class="drawer-footer">
      <div class="cart-total-row">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-value">₹${total}</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" data-action="goCheckout">
        Proceed to Checkout →
      </button>
    </div>
    ` : ''}
  </div>`;
}
