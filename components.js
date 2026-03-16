// ===== SHARED COMPONENTS =====

// ---- NAVBAR ----
function renderNavbar() {
  const { user, notifications } = State.getState();
  const unread = notifications.filter(n => !n.read).length;
  return `
  <nav class="navbar">
    <div class="nav-logo" data-action="goHome">Eat<span>Club</span></div>
    <div class="nav-actions">
      ${user ? `
        ${user.role !== 'admin' ? `
          <button class="btn btn-ghost btn-sm" data-action="goOrderHistory">📦 Orders</button>
        ` : ''}
        ${user.role !== 'admin' ? `
          <div class="notif-bell-wrap" style="position:relative">
            <button class="btn btn-ghost btn-sm notif-bell-btn" data-action="toggleNotifPanel">
              🔔
              ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
            </button>
          </div>
        ` : ''}
        <button class="btn btn-ghost btn-sm" data-action="goProfile">
          <span class="nav-avatar">${user.name.charAt(0).toUpperCase()}</span>
          ${user.name.split(' ')[0]}
          ${(user.loyaltyPoints || 0) > 0 && user.role !== 'admin' ? `<span class="loyalty-chip">⭐${user.loyaltyPoints}</span>` : ''}
        </button>
        ${user.role === 'admin' ? `<button class="btn btn-secondary btn-sm" data-action="goAdmin">⚙️ Admin</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="logout">Logout</button>
      ` : `
        <button class="btn btn-primary btn-sm" data-action="openLogin">Sign In</button>
      `}
    </div>
  </nav>
  ${_renderNotifPanel()}`;
}

function _renderNotifPanel() {
  const { notifOpen, notifications } = State.getState();
  if (!notifOpen) return '';
  return `
  <div class="notif-panel-overlay" data-action="toggleNotifPanel"></div>
  <div class="notif-panel">
    <div class="notif-panel-header">
      <span style="font-weight:700">🔔 Notifications</span>
      <button class="btn btn-ghost btn-sm" style="font-size:12px" data-action="markNotifsRead">Mark all read</button>
    </div>
    <div class="notif-panel-body">
      ${notifications.length === 0
        ? `<div class="notif-empty">No notifications yet</div>`
        : notifications.map(n => `
          <div class="notif-item ${n.read ? 'read' : ''}" 
            ${n.orderId ? `data-action="goTracking" data-order="${n.orderId}"` : ''}>
            <div class="notif-dot ${n.read ? 'read' : ''}"></div>
            <div>
              <div class="notif-msg">${n.message}</div>
              <div class="notif-time">${_timeAgo(n.time)}</div>
            </div>
          </div>
        `).join('')}
    </div>
  </div>`;
}

function _timeAgo(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ---- AUTH MODAL (Sign In + Create Account) ----
let _authTab = 'signin';

function renderLoginModal() {
  return `
  <div class="modal-backdrop" data-action="closeModal">
    <div class="modal-box" id="login-modal-box">
      <div class="modal-logo"><span class="grd">EatClub</span></div>
      <div class="auth-tabs">
        <button class="auth-tab ${_authTab === 'signin' ? 'active' : ''}" data-action="switchAuthTab" data-tab="signin">Sign In</button>
        <button class="auth-tab ${_authTab === 'signup' ? 'active' : ''}" data-action="switchAuthTab" data-tab="signup">Create Account</button>
      </div>
      ${_authTab === 'signin' ? _renderSignInForm() : _renderSignUpForm()}
    </div>
  </div>`;
}

function _renderSignInForm() {
  return `
    <div id="login-error" class="error-msg hidden"></div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input class="form-input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" />
    </div>
    <button class="btn btn-primary btn-block btn-lg mt-16" data-action="doLogin">Sign In</button>
    <div class="mt-16 text-sm" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;line-height:1.9">
      <div style="font-weight:700;margin-bottom:4px;color:var(--text-secondary)">Demo Accounts</div>
      <div>👤 Customer &nbsp;·&nbsp; <span style="font-family:monospace">customer@test.com</span> / <span style="font-family:monospace">password</span></div>
      <div>⚙️ Admin &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;·&nbsp; <span style="font-family:monospace">admin@test.com</span> &nbsp;/ <span style="font-family:monospace">password</span></div>
    </div>`;
}

function _renderSignUpForm() {
  return `
    <div id="reg-error" class="error-msg hidden"></div>
    <div class="form-group">
      <label class="form-label">Full Name</label>
      <input class="form-input" type="text" id="reg-name" placeholder="Alex Kumar" autocomplete="name" />
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" type="email" id="reg-email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="form-group">
      <label class="form-label">Password <span class="text-muted">(min. 6 chars)</span></label>
      <input class="form-input" type="password" id="reg-password" placeholder="••••••••" autocomplete="new-password" />
    </div>
    <div class="form-group">
      <label class="form-label">Confirm Password</label>
      <input class="form-input" type="password" id="reg-password2" placeholder="••••••••" autocomplete="new-password" />
    </div>
    <button class="btn btn-primary btn-block btn-lg mt-16" data-action="doRegister">Create Account 🚀</button>`;
}

// ---- CART DRAWER ----
function renderCartDrawer() {
  const { cart } = State.getState();
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
      ` : cart.map((c, idx) => `
        <div class="cart-item">
          <div class="cart-item-emoji">${c.item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${c.item.name}</div>
            ${(c.addOns || []).length > 0 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">+ ${c.addOns.map(a => a.name).join(', ')}</div>` : ''}
            <div class="cart-item-price">₹${c.item.price + (c.addOnTotal || 0)} × ${c.qty} = ₹${(c.item.price + (c.addOnTotal || 0)) * c.qty}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" data-action="removeItem" data-item="${c.item.id}" data-idx="${idx}">−</button>
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
      <button class="btn btn-primary btn-block btn-lg" data-action="goCheckout">Proceed to Checkout →</button>
    </div>
    ` : ''}
  </div>`;
}

// ---- CUSTOMIZATION MODAL ----
function renderCustomizationModal() {
  const { customizationModal } = State.getState();
  if (!customizationModal) return '';
  const { item, brandId } = customizationModal;
  const addOns = item.addOns || [];
  return `
  <div class="modal-backdrop" data-action="closeCustomModal">
    <div class="modal-box" id="custom-modal-box" style="max-width:480px">
      <div style="font-size:48px;text-align:center;margin-bottom:8px">${item.emoji}</div>
      <h3 style="font-size:20px;font-weight:800;text-align:center;margin-bottom:4px">${item.name}</h3>
      <p class="text-muted text-sm" style="text-align:center;margin-bottom:20px">${item.desc || ''}</p>
      ${addOns.length > 0 ? `
        <div style="font-weight:700;margin-bottom:12px">Customise your order</div>
        ${addOns.map((addon, i) => `
          <label class="addon-option">
            <input type="checkbox" id="addon-${i}" data-addon-price="${addon.price}" data-addon-name="${addon.name}" />
            <span class="addon-label">${addon.name}</span>
            <span class="addon-price">+₹${addon.price}</span>
          </label>
        `).join('')}
        <div id="custom-total" style="margin-top:16px;font-size:16px;font-weight:700;color:var(--accent)"></div>
      ` : `<p class="text-muted text-sm" style="margin-bottom:12px">No customization options for this item.</p>`}
      <button class="btn btn-primary btn-block btn-lg mt-16" data-action="confirmAddToCart" data-item="${item.id}" data-brand="${brandId}">Add to Cart</button>
      <button class="btn btn-ghost btn-block mt-8" data-action="closeCustomModal">Cancel</button>
    </div>
  </div>`;
}
