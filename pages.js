// ===== ALL PAGE RENDERERS =====

// -------- HOME PAGE --------
function renderHomePage() {
  const { user } = State.getState();
  return `
  ${renderNavbar()}
  <div class="page">
    <div class="hero">
      <div class="hero-title">
        Great food,<br/><span class="grd">delivered fast.</span>
      </div>
      <p class="hero-sub">Order from the best local brands. Your next favourite meal is a tap away.</p>
      ${!user ? `
        <button class="btn btn-primary btn-lg" data-action="openLogin">
          🚀 Get Started — It's Free
        </button>
      ` : `
        <div class="badge badge-success" style="font-size:14px;padding:8px 18px;">
          ✅ Logged in — Browse brands below
        </div>
      `}
    </div>

    <div class="brands-section container">
      <div class="section-label">Featured Brands</div>
      <div class="section-title">What are you craving?</div>
      <div class="grid-2">
        ${BRANDS.map(brand => `
          <div class="card brand-card card-clickable" data-action="goBrand" data-brand="${brand.id}">
            <div class="brand-cover" style="background:${brand.bg};pointer-events:none">
              <span style="font-size:90px;z-index:1">${brand.emoji}</span>
            </div>
            <div class="brand-info" style="pointer-events:none">
              <div class="flex-between mb-8">
                <div class="brand-name">${brand.name}</div>
                <div class="badge badge-success">⭐ ${brand.rating}</div>
              </div>
              <div class="text-muted text-sm mb-8">${brand.tagline}</div>
              <div class="brand-meta">
                <span>🕐 ${brand.deliveryTime}</span>
                <span>🛵 ${brand.deliveryFee} delivery</span>
                <span>📦 Min ${brand.minOrder}</span>
              </div>
              <div class="flex" style="gap:8px;margin-top:12px;flex-wrap:wrap">
                ${brand.tags.map(t => `<span class="brand-tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

// -------- BRAND / MENU PAGE --------
let _selectedCategory = null;

function renderBrandPage(brandId) {
  const brand = BRANDS.find(b => b.id === brandId);
  if (!brand) return renderHomePage();

  const { cart } = State.getState();
  const currentCat = _selectedCategory && brand.categories.includes(_selectedCategory)
    ? _selectedCategory : brand.categories[0];

  const itemsForCat = brand.menu.filter(item => item.category === currentCat);
  const count = cartCount();

  function getQty(itemId) {
    const c = cart.find(x => x.item.id === itemId);
    return c ? c.qty : 0;
  }

  return `
  ${renderNavbar()}
  <div class="page">
    <div class="brand-hero" style="background:${brand.bg}; min-height:260px;">
      <div class="brand-hero-overlay"></div>
      <div class="brand-hero-content">
        <p class="text-muted text-sm mb-8" style="cursor:pointer" data-action="goHome">← All Brands</p>
        <h1>${brand.emoji} ${brand.name}</h1>
        <p class="text-muted mt-8">${brand.tagline}</p>
        <div class="flex gap-16 mt-16" style="flex-wrap:wrap">
          <div class="badge badge-success">⭐ ${brand.rating}</div>
          <div class="badge badge-muted">🕐 ${brand.deliveryTime}</div>
          <div class="badge badge-muted">🛵 ${brand.deliveryFee} delivery</div>
        </div>
      </div>
    </div>

    <div class="category-tabs">
      ${brand.categories.map(cat => `
        <button class="cat-tab ${cat === currentCat ? 'active' : ''}"
          data-action="setCat" data-cat="${cat}">
          ${cat}
        </button>
      `).join('')}
    </div>

    <div class="menu-section container">
      <div class="menu-category-title">${currentCat}</div>
      <div class="menu-grid">
        ${itemsForCat.map(item => {
    const qty = getQty(item.id);
    return `
          <div class="card menu-item-card">
            <div class="menu-item-emoji">${item.emoji}</div>
            <div class="menu-item-body">
              <div class="menu-item-name">${item.name}</div>
              <div class="menu-item-desc">${item.desc}</div>
              <div class="menu-item-footer">
                <div class="menu-item-price">₹${item.price}</div>
                ${qty === 0 ? `
                  <button class="add-btn" data-action="addItem" data-item="${item.id}" data-brand="${brandId}">
                    + Add
                  </button>
                ` : `
                  <div class="qty-control">
                    <button class="qty-btn" data-action="removeItem" data-item="${item.id}">−</button>
                    <span class="qty-num">${qty}</span>
                    <button class="qty-btn" data-action="addItem" data-item="${item.id}" data-brand="${brandId}">+</button>
                  </div>
                `}
              </div>
            </div>
          </div>`;
  }).join('')}
      </div>
    </div>

    ${count > 0 ? `
    <button class="cart-fab" data-action="openCart">
      <span class="cart-fab-badge">${count}</span>
      View Cart — ₹${cartTotal()}
    </button>
    ` : ''}
  </div>`;
}

// -------- CHECKOUT PAGE --------
function renderCheckoutPage() {
  const { cart, user } = State.getState();
  if (!cart.length) { navigate('home'); return ''; }
  const total = cartTotal();
  const deliveryFee = 39;
  const tax = Math.round(total * 0.05);
  const grand = total + deliveryFee + tax;

  return `
  ${renderNavbar()}
  <div class="checkout-page">
    <div class="checkout-layout">
      <div>
        <p class="text-muted text-sm mb-16" style="cursor:pointer" data-action="goHome">← Back to home</p>
        <div class="card" style="padding:28px;margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:800;margin-bottom:20px">🚚 Delivery Details</h2>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="co-name" value="${user ? user.name : ''}" placeholder="Your name" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="co-phone" placeholder="9876543210" value="9876543210" />
            </div>
            <div class="form-group">
              <label class="form-label">Pincode</label>
              <input class="form-input" id="co-pin" placeholder="400001" value="400001" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" id="co-address" value="12, Demo Street, Bandra West" />
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-input" id="co-city" value="Mumbai" />
          </div>
        </div>

        <div class="card" style="padding:24px;margin-bottom:24px">
          <h2 style="font-size:18px;font-weight:800;margin-bottom:16px">💳 Payment</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${['💵 Cash on Delivery', '💳 Card / UPI', '🏦 Net Banking'].map((m, i) => `
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:12px 16px;background:var(--bg-elevated);border:1px solid ${i === 0 ? 'var(--border-accent)' : 'var(--border)'};border-radius:var(--radius-md)">
                <input type="radio" name="pay" ${i === 0 ? 'checked' : ''} /> ${m}
              </label>
            `).join('')}
          </div>
        </div>

        <button class="btn btn-primary btn-block btn-lg" data-action="placeOrder">
          🎉 Place Order — ₹${grand}
        </button>
      </div>

      <div class="card order-summary-card" style="position:sticky;top:80px">
        <h2>Order Summary</h2>
        ${cart.map(c => `
          <div class="summary-item">
            <span class="summary-item-name">${c.item.emoji} ${c.item.name} × ${c.qty}</span>
            <span style="font-weight:600">₹${c.item.price * c.qty}</span>
          </div>
        `).join('')}
        <div class="summary-item">
          <span class="summary-item-name">Subtotal</span><span>₹${total}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item-name">🛵 Delivery Fee</span><span>₹${deliveryFee}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item-name">GST (5%)</span><span>₹${tax}</span>
        </div>
        <div class="summary-total">
          <span>Grand Total</span><span class="price">₹${grand}</span>
        </div>
      </div>
    </div>
  </div>`;
}

// -------- TRACKING PAGE --------
let _adIndex = 0;
let _adInterval = null;

const STATUS_STEPS = [
  { key: 'received', icon: '📋', title: 'Order Received', sub: 'We got your order!' },
  { key: 'accepted', icon: '👨‍🍳', title: 'Preparing Your Food', sub: 'The kitchen is on it.' },
  { key: 'ready', icon: '✅', title: 'Food is Ready', sub: 'Packed and waiting for delivery.' },
  { key: 'dispatched', icon: '🛵', title: 'Out for Delivery', sub: 'On the way to you!' },
  { key: 'delivered', icon: '🎉', title: 'Delivered!', sub: 'Enjoy your meal. Rate us!' },
];
const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

function renderTrackingPage(orderId) {
  const order = getOrder(orderId);
  if (!order) return renderHomePage();

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const brand = BRANDS.find(b => b.id === order.brandId);
  const eta = order.status === 'delivered' ? 'Delivered!' : (brand ? brand.deliveryTime : '25-35 min');

  if (_adInterval) clearInterval(_adInterval);
  _adInterval = setInterval(() => {
    _adIndex = (_adIndex + 1) % AD_BANNERS.length;
    document.querySelectorAll('.ad-banner').forEach((b, i) => b.classList.toggle('visible', i === _adIndex));
    document.querySelectorAll('.ad-dot').forEach((d, i) => d.classList.toggle('active', i === _adIndex));
  }, 4000);

  return `
  ${renderNavbar()}
  <div class="tracking-page">
    <div class="tracking-header">
      <h1>Order ${order.status === 'delivered' ? '🎉 Delivered!' : 'Tracking'}</h1>
      <div class="order-id-chip">📦 ${order.id} · ${order.brandName}</div>
    </div>

    <div class="eta-box">
      <div class="eta-icon">🕐</div>
      <div>
        <div class="eta-label">Estimated Delivery</div>
        <div class="eta-value">${eta}</div>
      </div>
      <div style="margin-left:auto">
        <div class="badge ${order.status === 'delivered' ? 'badge-success' : 'badge-accent'}">
          ${STATUS_STEPS[currentIdx]?.title}
        </div>
      </div>
    </div>

    <div class="status-timeline">
      ${STATUS_STEPS.map((step, i) => {
    const isDone = i < currentIdx;
    const isActive = i === currentIdx;
    return `
        <div class="timeline-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
          <div class="timeline-dot">${step.icon}</div>
          <div class="timeline-content">
            <div class="timeline-title">${step.title}</div>
            <div class="timeline-sub">${isDone || isActive ? step.sub : ''}</div>
          </div>
        </div>`;
  }).join('')}
    </div>

    <div class="ad-banner-carousel">
      ${AD_BANNERS.map((ad, i) => `
        <div class="ad-banner ${i === _adIndex ? 'visible' : ''}"
          style="background:${ad.bg};border:1px solid ${ad.border}">
          <div class="ad-banner-icon">${ad.icon}</div>
          <div class="ad-banner-text">
            <h3>${ad.title}</h3>
            <p>${ad.subtitle}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="ad-nav">
      ${AD_BANNERS.map((_, i) => `
        <div class="ad-dot ${i === _adIndex ? 'active' : ''}" data-action="setAd" data-ad="${i}"></div>
      `).join('')}
    </div>

    <div class="mt-24">
      <button class="btn btn-secondary" data-action="goHome">← Back to Home</button>
    </div>
  </div>`;
}

// -------- ADMIN DASHBOARD --------
let _selectedOrderId = null;
let _timerIntervals = {};

function renderAdminDashboard() {
  const { orders } = State.getState();
  const selectedOrder = _selectedOrderId ? getOrder(_selectedOrderId) : null;

  return `
  <div class="admin-page">
    <div class="admin-header">
      <h1>⚙️ EatClub Admin — CRM</h1>
      <div class="flex gap-12">
        <div class="badge badge-accent">${orders.length} Orders</div>
        <button class="btn btn-ghost btn-sm" data-action="logout">Logout</button>
      </div>
    </div>
    <div class="admin-layout">
      <div class="orders-list">
        <div class="orders-list-header">
          <span>Incoming Orders</span><span>${orders.length}</span>
        </div>
        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">No orders yet</div>
          </div>
        ` : orders.slice().reverse().map(o => `
          <div class="order-list-item ${_selectedOrderId === o.id ? 'selected' : ''}"
            data-action="selectOrder" data-order="${o.id}">
            <div class="order-list-brand">${o.brandName} · ${o.id}</div>
            <div class="order-list-customer">👤 ${o.customer.name} · 📞 ${o.customer.phone}</div>
            <div class="order-list-meta">
              <span class="badge ${statusBadgeClass(o.status)}">${statusLabel(o.status)}</span>
              <span class="text-muted text-sm">₹${o.total}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="order-detail-panel">
        ${selectedOrder ? renderOrderDetail(selectedOrder) : `
          <div class="no-order-selected">
            <div style="font-size:48px">📋</div>
            <div style="font-size:16px;font-weight:600">Select an order to manage</div>
          </div>
        `}
      </div>
    </div>
  </div>`;
}

function statusBadgeClass(status) {
  return { received: 'badge-warning', accepted: 'badge-info', ready: 'badge-accent', dispatched: 'badge-info', delivered: 'badge-success' }[status] || 'badge-muted';
}
function statusLabel(status) {
  return { received: '📋 Received', accepted: '👨‍🍳 Preparing', ready: '✅ Ready', dispatched: '🛵 Dispatched', delivered: '🎉 Delivered' }[status] || status;
}

function renderOrderDetail(order) {
  const now = Date.now();
  const timerMs = order.timerEnd ? Math.max(0, order.timerEnd.getTime() - now) : 0;
  const timerMin = Math.floor(timerMs / 60000);
  const timerSec = Math.floor((timerMs % 60000) / 1000);
  const timerStr = `${String(timerMin).padStart(2, '0')}:${String(timerSec).padStart(2, '0')}`;

  if (order.status === 'accepted') {
    if (!_timerIntervals[order.id]) {
      _timerIntervals[order.id] = setInterval(() => {
        const el = document.getElementById(`timer-${order.id}`);
        if (el) {
          const ms = Math.max(0, (getOrder(order.id)?.timerEnd?.getTime() || 0) - Date.now());
          const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
          el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }, 1000);
    }
  } else {
    if (_timerIntervals[order.id]) { clearInterval(_timerIntervals[order.id]); delete _timerIntervals[order.id]; }
  }

  return `
  <div>
    <div class="flex-between mb-8">
      <div>
        <h2>${order.brandName} · ${order.id}</h2>
        <div class="badge ${statusBadgeClass(order.status)} mt-8">${statusLabel(order.status)}</div>
      </div>
      <div class="text-muted text-sm" style="text-align:right">
        Placed: ${order.placedAt.toLocaleTimeString()}<br/>
        Total: <strong class="text-accent">₹${order.total}</strong>
      </div>
    </div>

    <div class="card" style="padding:18px;margin-bottom:16px">
      <div class="text-sm font-bold mb-8">Customer Info</div>
      <div class="text-muted text-sm">👤 ${order.customer.name}</div>
      <div class="text-muted text-sm">📞 ${order.customer.phone}</div>
      <div class="text-muted text-sm">📍 ${order.customer.address}</div>
    </div>

    <div class="card" style="padding:18px;margin-bottom:16px">
      <div class="text-sm font-bold mb-8">Order Items</div>
      ${order.items.map(c => `
        <div class="admin-item-row">
          <span>${c.item.emoji} ${c.item.name} × ${c.qty}</span>
          <span class="text-accent font-bold">₹${c.item.price * c.qty}</span>
        </div>
      `).join('')}
      <div class="admin-item-row" style="margin-top:8px;font-weight:800;font-size:15px">
        <span>Total</span><span class="text-accent">₹${order.total}</span>
      </div>
    </div>

    <div class="order-actions">
      ${order.status === 'received' ? `
        <button class="btn btn-success btn-lg" data-action="adminAccept" data-order="${order.id}">
          ✅ Accept Order
        </button>
      ` : ''}
      ${order.status === 'accepted' ? `
        <div class="timer-box" style="width:100%">
          <div>
            <div class="timer-label">⏱ Kitchen Timer</div>
            <div class="timer-digits" id="timer-${order.id}">${timerStr}</div>
          </div>
          <div class="text-muted text-sm" style="margin-left:auto">Target: 10 minutes</div>
        </div>
        <button class="btn btn-warning btn-lg" data-action="adminReady" data-order="${order.id}">
          🍽️ Food is Ready
        </button>
      ` : ''}
      ${order.status === 'ready' ? `
        <div style="width:100%">
          <div class="text-sm text-muted mb-8">Contact and dispatch:</div>
          <div class="call-btn-group">
            <button class="btn btn-info call-btn" data-action="adminCallCustomer" data-order="${order.id}">
              📞 Call Customer
            </button>
            <button class="btn btn-secondary call-btn" data-action="adminCallDelivery" data-order="${order.id}">
              🛵 Call Delivery
            </button>
          </div>
          <div class="mt-16">
            <button class="btn btn-primary btn-lg" data-action="adminDispatch" data-order="${order.id}">
              🛵 Mark as Dispatched
            </button>
          </div>
        </div>
      ` : ''}
      ${order.status === 'dispatched' ? `
        <button class="btn btn-success btn-lg" data-action="adminDelivered" data-order="${order.id}">
          🎉 Mark as Delivered
        </button>
      ` : ''}
      ${order.status === 'delivered' ? `
        <div class="badge badge-success" style="font-size:15px;padding:10px 20px">
          🎉 Order Completed!
        </div>
      ` : ''}
    </div>
  </div>`;
}
