// ===== ALL PAGE RENDERERS =====

// -------- HOME PAGE --------
function renderHomePage() {
  const { user, searchQuery, settings } = State.getState();
  const storeOpen = isStoreCurrentlyOpen();
  return `
  ${renderNavbar()}
  <div class="page">
    <div class="hero">
      <div class="hero-title">Great food,<br/><span class="grd">delivered fast.</span></div>
      <p class="hero-sub">Order from the best local brands. Your next favourite meal is a tap away.</p>
      <div class="search-wrapper">
        <span class="search-icon-label">🔍</span>
        <input class="search-input-hero" type="text" id="main-search"
          placeholder="Search burgers, sushi, chaat..."
          value="${searchQuery ? searchQuery.replace(/"/g, '&quot;') : ''}"
          autocomplete="off" />
        ${searchQuery ? `<button class="search-clear-btn" data-action="clearSearch">✕</button>` : ''}
      </div>
      ${!user && !searchQuery ? `
        <button class="btn btn-primary btn-lg" data-action="openLogin" style="margin-top:20px">
          🚀 Get Started — It's Free
        </button>
      ` : ''}
    </div>

    ${!storeOpen ? `
      <div class="store-closed-banner container" style="max-width:800px;margin:16px auto">
        🔴 We are currently closed. We'll be back soon — check our business hours!
      </div>` : ''}

    ${searchQuery
      ? _renderSearchResults(searchQuery)
      : `
    <div class="brands-section container">
      <div class="section-label">Featured Brands</div>
      <div class="section-title">What are you craving?</div>
      <div class="grid-2">
        ${getBrands().map(brand => `
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
                ${(brand.tags || []).map(t => `<span class="brand-tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`}
  </div>`;
}

function _renderSearchResults(query) {
  const q = query.toLowerCase().trim();
  const results = [];
  getBrands().forEach(brand => {
    const items = (brand.menu || []).filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.desc || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      brand.name.toLowerCase().includes(q)
    );
    if (items.length) results.push({ brand, items });
  });

  if (!results.length) return `
      <div class="container" style="padding:60px 24px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">🍽️</div>
        <div style="font-size:22px;font-weight:800">No results for "${query}"</div>
        <p class="text-muted mt-8">Try a different search term</p>
      </div>`;

  const totalItems = results.reduce((t, r) => t + r.items.length, 0);
  const { cart } = State.getState();
  return `
    <div class="container" style="padding:24px">
      <div class="section-label">${totalItems} item${totalItems !== 1 ? 's' : ''} found</div>
      ${results.map(({ brand, items }) => `
        <div style="margin-bottom:36px">
          <div class="flex" style="align-items:center;gap:10px;margin-bottom:16px">
            <span style="font-size:28px">${brand.emoji}</span>
            <span style="font-size:20px;font-weight:800">${brand.name}</span>
          </div>
          <div class="menu-grid">
            ${items.map(item => {
    const qty = (cart.find(c => c.item.id === item.id) || {}).qty || 0;
    const effPrice = item.effectivePrice ?? item.price;
    const hasDiscount = effPrice < item.price;
    const discLabel = item.discountPct ? `${item.discountPct}% OFF` : (hasDiscount ? `SALE` : '');
    return `
                <div class="card menu-item-card">
                  <div class="menu-item-emoji">${item.emoji}</div>
                  <div class="menu-item-body">
                    <div class="menu-item-name">${item.name}${hasDiscount ? `<span class="discount-badge">${discLabel}</span>` : ''}</div>
                    <div class="menu-item-desc">${item.desc}</div>
                    <div class="menu-item-footer">
                      <div class="menu-item-price">
                        ${hasDiscount ? `<span class="price-original">₹${item.price}</span>` : ''}₹${effPrice}
                      </div>
                      ${qty === 0
        ? `<button class="add-btn" data-action="addItem" data-item="${item.id}" data-brand="${brand.id}">+ Add</button>`
        : `<div class="qty-control">
                             <button class="qty-btn" data-action="removeItem" data-item="${item.id}">−</button>
                             <span class="qty-num">${qty}</span>
                             <button class="qty-btn" data-action="addItem" data-item="${item.id}" data-brand="${brand.id}">+</button>
                           </div>`
      }
                    </div>
                  </div>
                </div>`;
  }).join('')}
          </div>
        </div>
      `).join('')}
    </div>`;
}

// -------- BRAND / MENU PAGE --------
let _selectedCategory = null;

function renderBrandPage(brandId) {
  const brand = getBrands().find(b => b.id === brandId);
  if (!brand) return renderHomePage();
  const { cart } = State.getState();
  const currentCat = _selectedCategory && (brand.categories || []).includes(_selectedCategory)
    ? _selectedCategory : (brand.categories || [])[0];
  const itemsForCat = (brand.menu || []).filter(item => item.category === currentCat);
  const count = cartCount();

  function getQty(itemId) { return (cart.find(x => x.item.id === itemId) || {}).qty || 0; }

  return `
  ${renderNavbar()}
  <div class="page">
    <div class="brand-hero" style="background:${brand.bg};min-height:260px;">
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
      ${(brand.categories || []).map(cat => `
        <button class="cat-tab ${cat === currentCat ? 'active' : ''}"
          data-action="setCat" data-cat="${cat}">${cat}</button>
      `).join('')}
    </div>

    <div class="menu-section container">
      <div class="menu-category-title">${currentCat || 'Menu'}</div>
      ${itemsForCat.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">🍽️</div><div class="empty-state-text">Menu coming soon</div></div>` : ''}
      <div class="menu-grid">
        ${itemsForCat.map(item => {
    const qty = getQty(item.id);
    const effPrice = item.effectivePrice ?? item.price;
    const hasDiscount = effPrice < item.price;
    // Flash sale
    const flashEnd = item.flashSaleEnd ? new Date(item.flashSaleEnd) : null;
    const isFlashActive = flashEnd && flashEnd > new Date();
    const discLabel = isFlashActive ? `⚡${item.flashSaleDiscount}% FLASH`
      : item.discountPct ? `${item.discountPct}% OFF` : hasDiscount ? `SALE` : '';
    const isOutOfStock = !!item.outOfStock;
    const hasAddOns = (item.addOns || []).length > 0;
    return `
            <div class="card menu-item-card ${isOutOfStock ? 'out-of-stock-card' : ''}">
              <div class="menu-item-emoji">
                ${item.imageUrl ? `<img src="${item.imageUrl}" class="menu-item-img" alt="${item.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" /><span style="display:none">${item.emoji}</span>` : item.emoji}
                ${isOutOfStock ? `<div class="oos-overlay">Out of Stock</div>` : ''}
              </div>
              <div class="menu-item-body">
                <div class="menu-item-name">${item.name}${(hasDiscount || isFlashActive) && !isOutOfStock ? `<span class="discount-badge ${isFlashActive ? 'flash-badge' : ''}">${discLabel}</span>` : ''}</div>
                <div class="menu-item-desc">${item.desc || ''}</div>
                ${isFlashActive ? `<div class="flash-timer" id="flash-${item.id}" data-end="${item.flashSaleEnd}">⏰ Loading...</div>` : ''}
                <div class="menu-item-footer">
                  <div class="menu-item-price">
                    ${hasDiscount && !isOutOfStock ? `<span class="price-original">₹${item.price}</span>` : ''}₹${isOutOfStock ? item.price : effPrice}
                  </div>
                  ${isOutOfStock ? `<button class="add-btn" style="opacity:0.4;cursor:not-allowed" disabled>Out of Stock</button>`
                    : qty === 0
                    ? (hasAddOns
                      ? `<button class="add-btn" data-action="openCustomModal" data-item="${item.id}" data-brand="${brandId}">+ Add</button>`
                      : `<button class="add-btn" data-action="addItem" data-item="${item.id}" data-brand="${brandId}">+ Add</button>`)
                    : `<div class="qty-control">
                         <button class="qty-btn" data-action="removeItem" data-item="${item.id}">−</button>
                         <span class="qty-num">${qty}</span>
                         <button class="qty-btn" data-action="addItem" data-item="${item.id}" data-brand="${brandId}">+</button>
                       </div>`
                  }
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
    </button>` : ''}
  </div>`;
}

// -------- CHECKOUT PAGE --------
function renderCheckoutPage() {
  const { cart, user, appliedPromo, loyaltyRedemption } = State.getState();
  if (!cart.length) { navigate('home'); return ''; }
  const { subtotal, promoDiscount, loyaltyDiscount, discount, deliveryFee, tax, grand } = cartGrandTotal();
  const savedAddresses = user?.addresses || [];
  const loyaltyPts = user?.loyaltyPoints || 0;
  const maxRedeemable = Math.floor(loyaltyPts / 100) * 10;

  return `
  ${renderNavbar()}
  <div class="checkout-page">
    <div class="checkout-layout">
      <div>
        <p class="text-muted text-sm mb-16" style="cursor:pointer" data-action="goHome">← Back to home</p>
        <div class="card" style="padding:28px;margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:800;margin-bottom:20px">🚚 Delivery Details</h2>
          ${savedAddresses.length > 0 ? `
            <div class="form-group">
              <label class="form-label">📍 Saved Addresses</label>
              <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
                ${savedAddresses.map(a => `
                  <div class="saved-addr-option" onclick="_fillAddress('${a.address.replace(/'/g,"\\\'")}')"
                    style="cursor:pointer;padding:10px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);font-size:13px">
                    <span style="font-weight:600">${a.label}</span> · ${a.address}
                  </div>`).join('')}
              </div>
            </div>` : ''}
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="co-name" value="${user ? user.name : ''}" placeholder="Your name" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="co-phone" placeholder="9876543210" value="${user && user.phone ? user.phone : '9876543210'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Pincode</label>
              <input class="form-input" id="co-pin" placeholder="400001" value="400001" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" id="co-address" value="${user && user.savedAddress ? user.savedAddress : '12, Demo Street, Bandra West'}" />
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-input" id="co-city" value="Mumbai" />
          </div>
          <div class="form-group">
            <label class="form-label">🕐 Schedule Delivery <span class="text-muted">(optional — leave blank for ASAP)</span></label>
            <input class="form-input" id="co-schedule" type="datetime-local"
              min="${new Date(Date.now() + 30*60000).toISOString().slice(0,16)}"
              style="color-scheme:dark" />
          </div>
        </div>

        <div class="card" style="padding:24px;margin-bottom:24px">
          <h2 style="font-size:18px;font-weight:800;margin-bottom:16px">🏷️ Promo Code</h2>
          ${appliedPromo ? `
            <div class="promo-applied">
              <span>✅ <strong>${appliedPromo.code}</strong> — ${appliedPromo.discount}% off applied!</span>
              <button class="btn btn-ghost btn-sm" data-action="removePromoCode">Remove</button>
            </div>
          ` : `
            <div class="promo-input-row">
              <input class="form-input" id="promo-input" placeholder="Enter promo code (e.g. EATCLUB50)" style="flex:1" />
              <button class="btn btn-secondary" data-action="applyPromoCode">Apply</button>
            </div>
            <div id="promo-error" class="error-msg hidden" style="margin-top:10px"></div>
          `}
        </div>

        ${loyaltyPts > 0 ? `
        <div class="card" style="padding:24px;margin-bottom:24px">
          <h2 style="font-size:18px;font-weight:800;margin-bottom:4px">⭐ Loyalty Points</h2>
          <p class="text-muted text-sm mb-16">You have <strong style="color:var(--warning)">${loyaltyPts} pts</strong> · Max redeemable: ₹${maxRedeemable}</p>
          ${loyaltyRedemption ? `
            <div class="promo-applied">
              <span>✅ Redeeming <strong>${loyaltyRedemption.points} pts</strong> for ₹${loyaltyRedemption.value} off</span>
              <button class="btn btn-ghost btn-sm" data-action="cancelLoyalty">Remove</button>
            </div>
          ` : maxRedeemable > 0 ? `
            <div class="promo-input-row">
              <input class="form-input" id="loyalty-pts-input" type="number" placeholder="Points to redeem (min 100)" min="100" step="100" max="${loyaltyPts}" style="flex:1" />
              <button class="btn btn-secondary" data-action="redeemLoyalty">Redeem</button>
            </div>` : `<p class="text-muted text-sm">Need at least 100 points to redeem. Keep ordering!</p>`
          }
        </div>` : ''}

        <div class="card" style="padding:24px;margin-bottom:24px">
          <h2 style="font-size:18px;font-weight:800;margin-bottom:16px">💳 Payment Method</h2>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="payment-method-option ${State.getState().selectedPaymentMethod !== 'online' ? 'selected' : ''}" id="pay-cod-label">
              <input type="radio" name="pay" value="cod" id="pay-cod" data-action="selectPaymentMethod" data-method="cod" ${State.getState().selectedPaymentMethod !== 'online' ? 'checked' : ''} />
              <span>💵 Cash on Delivery</span>
              <span class="razorpay-badge">No charges</span>
            </label>
            <label class="payment-method-option ${State.getState().selectedPaymentMethod === 'online' ? 'selected' : ''}" id="pay-online-label">
              <input type="radio" name="pay" value="online" id="pay-online" data-action="selectPaymentMethod" data-method="online" ${State.getState().selectedPaymentMethod === 'online' ? 'checked' : ''} />
              <span>💳 Pay Online — UPI / Card / NetBanking</span>
              <span class="razorpay-badge">Powered by Razorpay</span>
            </label>
          </div>
          ${State.getState().selectedPaymentMethod === 'online' ? `
          <div style="margin-top:12px;padding:12px 16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-md);font-size:12px;color:var(--success)">
            ✅ Secure payment via Razorpay. UPI, Cards, NetBanking all supported.
          </div>` : ''}
        </div>

        <button class="btn btn-primary btn-block btn-lg" data-action="placeOrder">
          ${State.getState().selectedPaymentMethod === 'online' ? '💳 Pay & Place Order' : '🎉 Place Order'} — ₹${grand}
        </button>
      </div>

      <div class="card order-summary-card" style="position:sticky;top:80px">
        <h2>Order Summary</h2>
        ${cart.map(c => `
          <div class="summary-item">
            <span class="summary-item-name">${c.item.emoji} ${c.item.name} × ${c.qty}${(c.addOns||[]).length?` <span style="font-size:11px">(+${c.addOns.map(a=>a.name).join(',')})</span>`:''}</span>
            <span style="font-weight:600">₹${(c.item.price + (c.addOnTotal||0)) * c.qty}</span>
          </div>
        `).join('')}
        <div class="summary-item"><span class="summary-item-name">Subtotal</span><span>₹${subtotal}</span></div>
        ${promoDiscount > 0 ? `<div class="summary-item" style="color:var(--success)"><span class="summary-item-name">🏷️ Promo Discount</span><span>−₹${promoDiscount}</span></div>` : ''}
        ${loyaltyDiscount > 0 ? `<div class="summary-item" style="color:var(--warning)"><span class="summary-item-name">⭐ Loyalty Discount</span><span>−₹${loyaltyDiscount}</span></div>` : ''}
        <div class="summary-item"><span class="summary-item-name">🛵 Delivery Fee</span><span>₹${deliveryFee}</span></div>
        <div class="summary-item"><span class="summary-item-name">GST (5%)</span><span>₹${tax}</span></div>
        <div class="summary-total">
          <span>Grand Total</span><span class="price">₹${grand}</span>
        </div>
        ${(user?.loyaltyPoints || 0) >= 0 ? `<div style="font-size:12px;color:var(--warning);margin-top:12px;text-align:center">⭐ You'll earn ~${Math.floor(grand/10)} loyalty points for this order!</div>` : ''}
      </div>
    </div>
  </div>`;
}

// -------- ORDER HISTORY PAGE --------
function renderOrderHistoryPage() {
  const { user, orders } = State.getState();
  if (!user) { navigate('home'); return ''; }
  const myOrders = orders.filter(o => o.customerId === user.uid).sort((a, b) => b.placedAt - a.placedAt);

  return `
  ${renderNavbar()}
  <div class="page" style="max-width:800px;margin:0 auto;padding:40px 24px">
    <p class="text-muted text-sm mb-16" style="cursor:pointer" data-action="goHome">← Home</p>
    <h1 style="font-size:28px;font-weight:900;margin-bottom:24px">📦 My Orders</h1>
    ${myOrders.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No orders yet. Go order something delicious!</div>
        <button class="btn btn-primary mt-16" data-action="goHome">Browse Brands</button>
      </div>
    ` : myOrders.map(o => `
      <div class="card history-item" style="padding:20px;margin-bottom:16px">
        <div class="flex-between mb-8">
          <div>
            <div style="font-weight:800;font-size:15px">${o.brandName} · <span style="font-family:monospace">${o.id}</span></div>
            <div class="text-muted text-sm">${o.placedAt instanceof Date ? o.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
            ${o.scheduledFor ? `<div style="font-size:12px;color:var(--warning)">🕐 Scheduled: ${new Date(o.scheduledFor).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>` : ''}
          </div>
          <div class="text-right">
            <div class="badge ${statusBadgeClass(o.status)}">${statusLabel(o.status)}</div>
            <div style="font-size:18px;font-weight:900;color:var(--accent);margin-top:4px">₹${o.total}</div>
          </div>
        </div>
        <div class="text-muted text-sm">${o.items.map(c => `${c.item.emoji} ${c.item.name} ×${c.qty}`).join(' · ')}</div>
        <div class="flex gap-8 mt-12">
          ${o.status !== 'delivered' ? `
            <button class="btn btn-secondary btn-sm" data-action="goTracking" data-order="${o.id}">Track Order</button>
          ` : ''}
          ${o.status === 'delivered' && !o.rated ? `
            <button class="btn btn-ghost btn-sm" data-action="goTracking" data-order="${o.id}">⭐ Rate Order</button>
          ` : ''}
          <button class="btn btn-ghost btn-sm" data-action="reorder" data-order="${o.id}">🔄 Reorder</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// -------- PROFILE PAGE --------
function renderProfilePage() {
  const { user } = State.getState();
  if (!user) { navigate('home'); return ''; }
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const savedAddresses = user.addresses || [];
  const loyaltyPts = user.loyaltyPoints || 0;

  return `
  ${renderNavbar()}
  <div class="page" style="max-width:600px;margin:0 auto;padding:40px 24px">
    <p class="text-muted text-sm mb-16" style="cursor:pointer" data-action="goHome">← Home</p>
    <div class="profile-avatar-wrap">
      <div class="profile-avatar">${initials}</div>
      <div>
        <div style="font-size:22px;font-weight:900">${user.name}</div>
        <div class="text-muted text-sm">${user.email}</div>
        <div class="badge badge-accent mt-8" style="width:fit-content">${user.role === 'admin' ? '⚙️ Admin' : '👤 Customer'}</div>
      </div>
    </div>

    ${user.role !== 'admin' ? `
    <div class="card" style="padding:24px;margin-bottom:20px;background:linear-gradient(135deg,#1a1000,#3d2a00)">
      <div class="flex-between">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--warning);text-transform:uppercase;letter-spacing:1px">⭐ Loyalty Points</div>
          <div style="font-size:40px;font-weight:900;color:var(--warning);line-height:1.1">${loyaltyPts}</div>
          <div class="text-muted text-sm">= ₹${Math.floor(loyaltyPts/100)*10} redeemable</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:var(--text-muted)">Earn 1 pt per ₹10 spent</div>
          <div style="font-size:12px;color:var(--text-muted)">100 pts = ₹10 off</div>
          <div class="badge badge-warning mt-8">${loyaltyPts >= 100 ? '✅ Ready to redeem' : `${100-loyaltyPts} pts to unlock`}</div>
        </div>
      </div>
      <div class="loyalty-progress" style="margin-top:16px">
        <div class="loyalty-bar" style="width:${Math.min(100, loyaltyPts % 100)}%"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${loyaltyPts % 100}/100 pts to next reward</div>
    </div>` : ''}

    <div class="card" style="padding:28px;margin-bottom:20px">
      <h2 style="font-size:18px;font-weight:800;margin-bottom:20px">Edit Profile</h2>
      <div id="profile-success" class="hidden" style="color:var(--success);font-size:13px;margin-bottom:12px">✅ Profile saved!</div>
      <div id="profile-error" class="error-msg hidden"></div>
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-input" id="profile-name" value="${user.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="profile-phone" value="${user.phone || ''}" placeholder="9876543210" />
      </div>
      <div class="form-group">
        <label class="form-label">Saved Address</label>
        <input class="form-input" id="profile-address" value="${user.savedAddress || ''}" placeholder="12, Demo Street, Mumbai" />
      </div>
      <button class="btn btn-primary btn-block mt-8" data-action="updateProfile">Save Changes</button>
    </div>

    ${user.role !== 'admin' ? `
    <div class="card" style="padding:24px;margin-bottom:20px">
      <h2 style="font-size:16px;font-weight:800;margin-bottom:16px">📍 Address Book</h2>
      ${savedAddresses.length === 0 ? `<p class="text-muted text-sm mb-12">No saved addresses yet.</p>` : `
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          ${savedAddresses.map(a => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md)">
              <div>
                <div style="font-weight:600;font-size:14px">${a.label}</div>
                <div class="text-muted text-sm">${a.address}</div>
              </div>
              <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-action="removeAddress" data-addrId="${a.id}">✕</button>
            </div>`).join('')}
        </div>`}
      <div id="addr-form" style="display:flex;flex-direction:column;gap:8px">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Label</label><input class="form-input" id="addr-label" placeholder="Home / Office" /></div>
          <div class="form-group" style="flex:2"><label class="form-label">Address</label><input class="form-input" id="addr-address" placeholder="12, Demo Street, Mumbai" /></div>
        </div>
        <button class="btn btn-secondary" data-action="saveAddress">+ Save Address</button>
      </div>
    </div>` : ''}

    <div class="card" style="padding:20px;margin-bottom:20px">
      <h2 style="font-size:16px;font-weight:800;margin-bottom:12px">🔔 Notifications</h2>
      ${'Notification' in window && Notification.permission === 'granted' ? `
        <div class="badge badge-success">✅ Notifications enabled</div>
      ` : `
        <p class="text-muted text-sm mb-12">Get real-time updates when your order status changes.</p>
        <button class="btn btn-secondary" data-action="requestNotifications">Enable Notifications</button>
      `}
    </div>

    <button class="btn btn-ghost btn-block" data-action="goOrderHistory">📦 View My Orders</button>
  </div>`;
}

// -------- TRACKING PAGE --------
let _adIndex = 0;
let _adInterval = null;
let _ratingState = {}; // { [orderId]: { stars: 0 } }

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
  if (!_ratingState[orderId]) _ratingState[orderId] = { stars: 0 };

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const brand = getBrands().find(b => b.id === order.brandId);
  const eta = order.status === 'delivered' ? 'Delivered!' : (brand ? brand.deliveryTime : '25-35 min');
  const rState = _ratingState[orderId];

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

    ${'Notification' in window && Notification.permission === 'default' ? `
    <div class="notif-banner">
      <span>🔔 Enable notifications to get real-time order updates</span>
      <button class="btn btn-primary btn-sm" data-action="requestNotifications">Enable</button>
    </div>
    ` : ''}

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
    const isDone = i < currentIdx, isActive = i === currentIdx;
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

    ${order.status === 'delivered' && !order.rated ? `
    <div class="rating-section">
      <h3>⭐ How was your experience?</h3>
      <p class="text-muted text-sm mt-8 mb-16">Rate your order from ${order.brandName}</p>
      <div class="star-picker">
        ${[1, 2, 3, 4, 5].map(n => `
          <button class="star-btn ${rState.stars >= n ? 'active' : ''}"
            data-action="setStar" data-order="${orderId}" data-stars="${n}">★</button>
        `).join('')}
      </div>
      <textarea class="form-input" id="rating-comment-${orderId}"
        placeholder="Tell us more (optional)..."
        style="margin-top:14px;min-height:80px;resize:vertical"></textarea>
      <button class="btn btn-primary btn-block mt-12" data-action="submitRating"
        data-order="${orderId}" data-brand="${order.brandId}"
        ${rState.stars === 0 ? 'disabled' : ''}>
        Submit Rating
      </button>
    </div>
    ` : order.rated ? `
    <div class="rating-section" style="text-align:center">
      <div style="font-size:40px">🙏</div>
      <div style="font-weight:800;margin-top:8px">Thanks for rating!</div>
    </div>
    ` : ''}

    <div class="ad-banner-carousel">
      ${AD_BANNERS.map((ad, i) => `
        <div class="ad-banner ${i === _adIndex ? 'visible' : ''}"
          style="background:${ad.bg};border:1px solid ${ad.border}">
          <div class="ad-banner-icon">${ad.icon}</div>
          <div class="ad-banner-text"><h3>${ad.title}</h3><p>${ad.subtitle}</p></div>
        </div>
      `).join('')}
    </div>
    <div class="ad-nav">
      ${AD_BANNERS.map((_, i) => `
        <div class="ad-dot ${i === _adIndex ? 'active' : ''}" data-action="setAd" data-ad="${i}"></div>
      `).join('')}
    </div>

    ${['received', 'accepted'].includes(order.status) ? `
    <div class="cancel-order-section">
      <div style="font-weight:700;margin-bottom:12px;color:var(--danger)">Cancel Order</div>
      <select class="cancel-reason-select" id="cancel-reason-select">
        <option value="">Select a reason...</option>
        <option value="Changed my mind">Changed my mind</option>
        <option value="Ordered by mistake">Ordered by mistake</option>
        <option value="Delivery taking too long">Delivery taking too long</option>
        <option value="Found a better option">Found a better option</option>
        <option value="Other">Other</option>
      </select>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger);border:1px solid var(--danger)" data-action="cancelMyOrder" data-order="${orderId}">
        Cancel This Order
      </button>
    </div>` : order.status === 'cancelled' ? `
    <div style="text-align:center;padding:20px;background:rgba(239,68,68,0.08);border-radius:var(--radius-md);border:1px solid rgba(239,68,68,0.2)">
      <div style="font-size:32px;margin-bottom:8px">❌</div>
      <div style="font-weight:800;color:var(--danger)">Order Cancelled</div>
      ${order.cancelReason ? `<div class="text-muted text-sm mt-4">${order.cancelReason}</div>` : ''}
    </div>` : ''}

    <div class="mt-24">
      <button class="btn btn-secondary" data-action="goHome">← Back to Home</button>
    </div>
  </div>`;
}

// -------- ADMIN DASHBOARD --------
let _selectedOrderId = null;
let _timerIntervals = {};
let _adminBrandView = 'list'; // 'list' | 'detail'
let _adminBrandDetailId = null;

function renderAdminDashboard() {
  const { adminTab } = State.getState();
  return `
  <div class="admin-page">
    <div class="admin-header">
      <h1>⚙️ EatClub Admin</h1>
      <div class="flex gap-12">
        <button class="btn btn-ghost btn-sm" data-action="logout">Logout</button>
      </div>
    </div>

    <div class="admin-tab-nav">
      <button class="admin-nav-tab ${adminTab === 'orders' ? 'active' : ''}" data-action="adminSetTab" data-tab="orders">📋 Orders</button>
      <button class="admin-nav-tab ${adminTab === 'brands' ? 'active' : ''}" data-action="adminSetTab" data-tab="brands">🍔 Brands</button>
      <button class="admin-nav-tab ${adminTab === 'promos' ? 'active' : ''}" data-action="adminSetTab" data-tab="promos">🏷️ Promos</button>
      <button class="admin-nav-tab ${adminTab === 'analytics' ? 'active' : ''}" data-action="adminSetTab" data-tab="analytics">📊 Analytics</button>
      <button class="admin-nav-tab ${adminTab === 'inventory' ? 'active' : ''}" data-action="adminSetTab" data-tab="inventory">📦 Inventory</button>
      <button class="admin-nav-tab ${adminTab === 'settings' ? 'active' : ''}" data-action="adminSetTab" data-tab="settings">⚙️ Settings</button>
    </div>

    <div class="admin-tab-content">
      ${adminTab === 'orders' ? _renderAdminOrdersTab() : ''}
      ${adminTab === 'brands' ? _renderAdminBrandsTab() : ''}
      ${adminTab === 'promos' ? _renderAdminPromosTab() : ''}
      ${adminTab === 'analytics' ? _renderAdminAnalyticsTab() : ''}
      ${adminTab === 'inventory' ? _renderAdminInventoryTab() : ''}
      ${adminTab === 'settings' ? _renderAdminSettingsTab() : ''}
    </div>
  </div>`;
}

function _renderAdminOrdersTab() {
  const { orders } = State.getState();
  const selectedOrder = _selectedOrderId ? getOrder(_selectedOrderId) : null;
  return `
  <div class="admin-layout">
    <div class="orders-list">
      <div class="orders-list-header">
        <span>Incoming Orders</span><span>${orders.length}</span>
      </div>
      ${orders.length === 0 ? `
        <div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No orders yet</div></div>
      ` : orders.slice().map(o => `
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
  </div>`;
}

function _renderAdminBrandsTab() {
  const allBrands = getBrands().filter(b => !b._deleted);

  if (_adminBrandView === 'detail' && _adminBrandDetailId) {
    const brand = allBrands.find(b => b.id === _adminBrandDetailId);
    if (!brand) { _adminBrandView = 'list'; _adminBrandDetailId = null; }
    else return `
        <div style="padding:24px;max-width:800px">
          <button class="btn btn-ghost btn-sm mb-16" data-action="adminBrandBack">← All Brands</button>
          <div class="flex flex-between mb-24" style="align-items:center">
            <h2 style="font-size:24px;font-weight:900;margin:0">${brand.emoji} ${brand.name}</h2>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-action="adminDeleteBrand" data-brand="${brand.id}">Delete Brand</button>
          </div>

          <div class="grid-2">
            <!-- CATEGORIES -->
            <div class="card" style="padding:20px;align-self:start">
              <div style="font-weight:700;margin-bottom:12px;display:flex;justify-content:space-between">
                <span>Categories</span>
                <span class="text-muted text-sm">${(brand.categories || []).length}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
                ${(brand.categories || []).map(cat => `
                  <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-xl);padding:4px 12px;font-size:13px;display:flex;align-items:center;gap:6px">
                    <span>${cat}</span>
                    <button class="btn btn-ghost" style="padding:0;width:18px;height:18px;min-height:0;color:var(--text-muted)" data-action="adminRemoveCategory" data-brand="${brand.id}" data-cat="${cat}">✕</button>
                  </div>
                `).join('')}
              </div>
              <div style="display:flex;gap:8px">
                <input class="form-input" id="nc-name" placeholder="New Category" style="flex:1" />
                <button class="btn btn-ghost" data-action="adminAddCategory" data-brand="${brand.id}">Add</button>
              </div>
            </div>

            <!-- ADD MENU ITEM -->
            <div class="card" style="padding:20px">
              <div style="font-weight:700;margin-bottom:16px">Add Menu Item</div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="mi-name" placeholder="Classic Burger" /></div>
                <div class="form-group" style="max-width:80px"><label class="form-label">Emoji</label><input class="form-input" id="mi-emoji" placeholder="🍔" /></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Category</label>
                  <select class="form-input" id="mi-cat">
                    ${(brand.categories || []).length ? (brand.categories || []).map(c => `<option>${c}</option>`).join('') : '<option value="">Add a category first</option>'}
                  </select>
                </div>
                <div class="form-group"><label class="form-label">Price (₹)</label><input class="form-input" id="mi-price" type="number" placeholder="199" oninput="_updateDiscPreview()" /></div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Discount % <span class="text-muted">(optional)</span></label>
                  <input class="form-input" id="mi-disc" type="number" placeholder="e.g. 50" min="1" max="99" oninput="_updateDiscPreview()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fixed Sale Price ₹ <span class="text-muted">(optional)</span></label>
                  <input class="form-input" id="mi-sale" type="number" placeholder="e.g. 99" oninput="_updateDiscPreview()" />
                </div>
              </div>
              <div id="mi-disc-preview" style="font-size:13px;color:var(--accent);margin-bottom:12px;min-height:18px"></div>
              <div class="form-group"><label class="form-label">Description (Optional)</label><input class="form-input" id="mi-desc" placeholder="Short description..." /></div>
              <div class="form-group">
                <label class="form-label">Photo <span class="text-muted">(optional)</span></label>
                <label class="upload-img-btn">
                  📷 Upload Photo
                  <input type="file" id="mi-img-input" accept="image/*" onchange="handleAction('uploadMenuImg',{brand:'${brand.id}'},event)" />
                </label>
                <div id="mi-img-preview"></div>
              </div>
              <button class="btn btn-primary" data-action="adminAddMenuItem" data-brand="${brand.id}" ${!(brand.categories || []).length ? 'disabled' : ''}>Add Item</button>
            </div>
          </div>

          <!-- MENU ITEMS LIST -->
          <div class="card mt-24" style="padding:24px">
            <div style="font-weight:700;margin-bottom:16px;display:flex;justify-content:space-between">
              <span>Menu Items</span>
              <span class="text-muted text-sm">${(brand.menu || []).length} items</span>
            </div>
            ${(brand.menu || []).length === 0 ? `<p class="text-muted text-sm">No items yet. Add your first item above.</p>` : ''}
            
            ${(brand.categories || []).map(cat => {
      const catItems = (brand.menu || []).filter(i => i.category === cat);
      if (!catItems.length) return '';
      return `
                <div style="margin-bottom:24px">
                  <div class="text-muted text-sm" style="font-weight:700;text-transform:uppercase;margin-bottom:8px">${cat}</div>
                  ${catItems.map(item => {
                    const effPrice = item.effectivePrice ?? item.price;
                    const hasDisc = effPrice < item.price;
                    const discLabel = item.discountPct ? `${item.discountPct}% OFF` : (hasDisc ? 'SALE' : '');
                    const flashEnd = item.flashSaleEnd ? new Date(item.flashSaleEnd) : null;
                    const isFlashActive = flashEnd && flashEnd > new Date();
                    return `
                    <div class="admin-item-row" style="padding:12px 16px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:8px">
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                        <div class="flex" style="gap:12px;align-items:center">
                          <span style="font-size:24px">${item.emoji}</span>
                          <div>
                            <div style="font-weight:600">${item.name}${item.outOfStock ? `<span style="margin-left:8px;font-size:11px;color:var(--danger)">● Out of Stock</span>` : ''}${isFlashActive ? `<span class="discount-badge flash-badge" style="margin-left:8px">⚡${item.flashSaleDiscount}% FLASH</span>` : (hasDisc ? `<span class="discount-badge" style="margin-left:8px">${discLabel}</span>` : '')}</div>
                            <div class="text-muted text-sm">
                              ${hasDisc ? `<span class="price-original" style="font-size:12px">₹${item.price}</span> <span style="color:var(--accent);font-weight:700">₹${effPrice}</span>` : `₹${item.price}`}
                              ${item.desc ? ' · ' + item.desc : ''}
                            </div>
                          </div>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-action="adminRemoveMenuItem" data-brand="${brand.id}" data-item="${item.id}">🗑️</button>
                      </div>
                      <div class="flex gap-8" style="flex-wrap:wrap">
                        <button class="btn btn-ghost btn-sm" style="font-size:12px" data-action="adminToggleStock" data-brand="${brand.id}" data-item="${item.id}" data-oos="${item.outOfStock ? '0' : '1'}">
                          ${item.outOfStock ? '✅ Mark In Stock' : '⛔ Mark Out of Stock'}
                        </button>
                        <button class="btn btn-ghost btn-sm" style="font-size:12px" data-action="adminStartFlashSale" data-brand="${brand.id}" data-item="${item.id}">
                          ⚡ Flash Sale
                        </button>
                      </div>
                    </div>
                    `;
                  }).join('')}
                </div>
              `;
    }).join('')}
          </div>
        </div>`;
  }

  return `
    <div style="padding:24px;max-width:1000px">
      <div class="flex-between mb-24">
        <h2 style="font-size:22px;font-weight:900">All Brands (${allBrands.length})</h2>
      </div>

      <div class="grid-2" style="margin-bottom:32px">
        ${allBrands.map(brand => `
          <div class="card" style="padding:16px;cursor:pointer;position:relative" data-action="adminBrandDetail" data-brand="${brand.id}">
            <div class="flex" style="align-items:center;gap:12px">
              <span style="font-size:36px">${brand.emoji}</span>
              <div style="flex:1">
                <div style="font-weight:800">${brand.name}</div>
                <div class="text-muted text-sm">${(brand.menu || []).length} items · ${brand.deliveryTime}</div>
              </div>
              <button class="btn btn-ghost btn-sm" style="z-index:2;font-size:12px" data-action="showQrModal" data-brand="${brand.id}" onclick="event.stopPropagation()" title="Generate QR Menu">📱 QR</button>
              <button class="btn btn-ghost btn-sm" style="z-index:2" data-action="adminDeleteBrand" data-brand="${brand.id}" onclick="event.stopPropagation()">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="padding:24px">
        <h3 style="font-weight:800;margin-bottom:20px">+ Add New Brand</h3>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Brand Name</label><input class="form-input" id="nb-name" placeholder="My Restaurant" /></div>
          <div class="form-group"><label class="form-label">Emoji</label><input class="form-input" id="nb-emoji" placeholder="🍜" style="font-size:22px" /></div>
        </div>
        <div class="form-group"><label class="form-label">Tagline</label><input class="form-input" id="nb-tagline" placeholder="Short catchy tagline" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Delivery Time</label><input class="form-input" id="nb-time" placeholder="25-35 min" /></div>
          <div class="form-group"><label class="form-label">Delivery Fee</label><input class="form-input" id="nb-fee" placeholder="₹39" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Min Order</label><input class="form-input" id="nb-min" placeholder="₹199" /></div>
          <div class="form-group"><label class="form-label">Initial Categories (comma separated)</label><input class="form-input" id="nb-cats" placeholder="Pizza, Pasta, Drinks" /></div>
        </div>
        <button class="btn btn-primary mt-8" data-action="adminAddBrand">Add Brand</button>
      </div>
    </div>`;
}

function _renderAdminPromosTab() {
  const { promoCodes } = State.getState();
  const promoList = Object.entries(promoCodes);

  return `
    <div style="padding:24px;max-width:800px">
      <h2 style="font-size:22px;font-weight:900;margin-bottom:24px">Promo Codes (${promoList.length})</h2>

      ${promoList.length === 0
      ? `<p class="text-muted mb-24">No promo codes yet. Create your first one below.</p>`
      : `<div class="card" style="padding:0;margin-bottom:24px;overflow:hidden">
            ${promoList.map(([code, p]) => `
              <div class="promo-list-item">
                <div>
                  <div style="font-weight:800;font-size:15px;font-family:monospace">${code}</div>
                  <div class="text-muted text-sm">${p.discount}% off${p.minOrder > 0 ? ` · Min order ₹${p.minOrder}` : ''}</div>
                </div>
                <div class="flex gap-8 align-center">
                  <span class="badge ${p.active ? 'badge-success' : 'badge-muted'}">${p.active ? 'Active' : 'Inactive'}</span>
                  <button class="btn btn-ghost btn-sm" data-action="adminTogglePromo" data-code="${code}" data-active="${p.active ? '0' : '1'}">${p.active ? 'Disable' : 'Enable'}</button>
                  <button class="btn btn-ghost btn-sm" data-action="adminDeletePromo" data-code="${code}">🗑️</button>
                </div>
              </div>
            `).join('')}
           </div>`}

      <div class="card" style="padding:24px">
        <h3 style="font-weight:800;margin-bottom:20px">+ Create Promo Code</h3>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Code</label><input class="form-input" id="pc-code" placeholder="SUMMER30" style="text-transform:uppercase" /></div>
          <div class="form-group"><label class="form-label">Discount %</label><input class="form-input" id="pc-discount" type="number" placeholder="20" min="1" max="100" /></div>
        </div>
        <div class="form-group"><label class="form-label">Min Order Amount (₹) — 0 for no minimum</label><input class="form-input" id="pc-min" type="number" placeholder="0" /></div>
        <button class="btn btn-primary mt-8" data-action="adminCreatePromo">Create Code</button>
      </div>
    </div>`;
}

function _renderAdminAnalyticsTab() {
  const { orders } = State.getState();
  if (orders.length === 0) return `
    <div style="padding:24px">
      <h2 style="font-size:22px;font-weight:900;margin-bottom:24px">📊 Analytics</h2>
      <div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No order data yet.</div></div>
    </div>`;

  // Revenue by day (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), date: d.toDateString(), revenue: 0, count: 0 };
  });
  orders.forEach(o => {
    const placed = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt?.seconds * 1000 || Date.now());
    const dayEntry = days.find(d => d.date === placed.toDateString());
    if (dayEntry) { dayEntry.revenue += o.total; dayEntry.count += 1; }
  });
  const maxRev = Math.max(...days.map(d => d.revenue), 1);

  // Top items
  const itemMap = {};
  orders.forEach(o => o.items.forEach(c => {
    const key = c.item.name;
    itemMap[key] = (itemMap[key] || { name: c.item.name, emoji: c.item.emoji, qty: 0, revenue: 0 });
    itemMap[key].qty += c.qty;
    itemMap[key].revenue += c.item.price * c.qty;
  }));
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 6);
  const maxQty = Math.max(...topItems.map(i => i.qty), 1);

  // Peak hours
  const hours = Array.from({ length: 24 }, (_, i) => ({ h: i, count: 0 }));
  orders.forEach(o => {
    const d = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt?.seconds * 1000 || Date.now());
    hours[d.getHours()].count += 1;
  });
  const maxHour = Math.max(...hours.map(h => h.count), 1);

  // Summary stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgOrder = Math.round(totalRevenue / orders.length);
  const delivered = orders.filter(o => o.status === 'delivered').length;

  return `
    <div style="padding:24px;max-width:900px">
      <h2 style="font-size:22px;font-weight:900;margin-bottom:24px">📊 Analytics</h2>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px">
        ${[
          { label: 'Total Orders', val: orders.length, icon: '📦' },
          { label: 'Total Revenue', val: '₹' + totalRevenue.toLocaleString(), icon: '💰' },
          { label: 'Avg Order Value', val: '₹' + avgOrder, icon: '📈' },
          { label: 'Completed', val: delivered, icon: '✅' },
        ].map(s => `
          <div class="card" style="padding:20px">
            <div style="font-size:28px">${s.icon}</div>
            <div style="font-size:22px;font-weight:900;color:var(--accent);margin:8px 0 4px">${s.val}</div>
            <div class="text-muted text-sm">${s.label}</div>
          </div>`).join('')}
      </div>

      <div class="card" style="padding:24px;margin-bottom:24px">
        <h3 style="font-weight:800;margin-bottom:20px">Revenue Last 7 Days</h3>
        <div style="display:flex;align-items:flex-end;gap:12px;height:160px">
          ${days.map(d => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="font-size:11px;font-weight:600;color:var(--accent)">${d.revenue > 0 ? '₹' + d.revenue : ''}</div>
              <div style="width:100%;background:var(--accent);border-radius:6px 6px 0 0;min-height:4px;height:${Math.max(4, (d.revenue / maxRev) * 120)}px;opacity:${d.revenue > 0 ? 1 : 0.15};transition:height 0.6s ease"></div>
              <div style="font-size:12px;color:var(--text-muted)">${d.label}</div>
              <div style="font-size:11px;color:var(--text-muted)">${d.count > 0 ? d.count + ' orders' : '-'}</div>
            </div>`).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div class="card" style="padding:24px">
          <h3 style="font-weight:800;margin-bottom:16px">🏆 Top Items</h3>
          ${topItems.map((item, i) => `
            <div style="margin-bottom:12px">
              <div class="flex-between mb-4">
                <span style="font-size:13px;font-weight:600">${item.emoji} ${item.name}</span>
                <span style="font-size:12px;color:var(--accent);font-weight:700">${item.qty}x</span>
              </div>
              <div style="height:6px;background:var(--bg-elevated);border-radius:99px">
                <div style="height:6px;background:${i===0?'var(--accent)':i===1?'var(--warning)':'var(--info)'};border-radius:99px;width:${Math.round((item.qty/maxQty)*100)}%;transition:width 0.8s ease"></div>
              </div>
            </div>`).join('')}
        </div>

        <div class="card" style="padding:24px">
          <h3 style="font-weight:800;margin-bottom:16px">⏰ Peak Hours</h3>
          <div style="display:flex;align-items:flex-end;gap:3px;height:100px">
            ${hours.map(h => `
              <div style="flex:1;background:${h.count === maxHour?'var(--accent)':'var(--bg-elevated)'};border-radius:3px 3px 0 0;height:${Math.max(3,(h.count/maxHour)*90)}px;"
                title="${h.h}:00 — ${h.count} orders"></div>`).join('')}
          </div>
          <div class="flex-between mt-8" style="font-size:11px;color:var(--text-muted)"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
        </div>
      </div>
    </div>`;
}

// ---- FLASH TIMER UPDATER (runs after render) ----
function _updateFlashTimers() {
  document.querySelectorAll('.flash-timer[data-end]').forEach(el => {
    const end = new Date(el.getAttribute('data-end'));
    function tick() {
      const diff = Math.max(0, end - new Date());
      if (diff === 0) { el.textContent = '⚡ Flash Sale Ended'; return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `⏰ Flash Sale ends in ${m}m ${String(s).padStart(2,'0')}s`;
      setTimeout(tick, 1000);
    }
    tick();
  });
}

// ---- ADDRESS FILL HELPER ----
function _fillAddress(addr) {
  const el = document.getElementById('co-address');
  if (el) { el.value = addr; el.style.borderColor = 'var(--accent)'; }
}

// ---- ORDER DETAIL WITH SCHEDULED / ADDONS / LOYALTY ----
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
  } else if (_timerIntervals[order.id]) {
    clearInterval(_timerIntervals[order.id]); delete _timerIntervals[order.id];
  }

  return `
  <div>
    <div class="flex-between mb-8">
      <div>
        <h2>${order.brandName} · ${order.id}</h2>
        <div class="badge ${statusBadgeClass(order.status)} mt-8">${statusLabel(order.status)}</div>
        ${order.scheduledFor ? `<div style="margin-top:6px;font-size:12px;color:var(--warning)">🕐 Scheduled: ${new Date(order.scheduledFor).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>` : ''}
      </div>
      <div class="text-muted text-sm" style="text-align:right">
        Placed: ${order.placedAt instanceof Date ? order.placedAt.toLocaleTimeString() : ''}<br/>
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
          <span>${c.item.emoji} ${c.item.name}${(c.addOns||[]).length?` <span style="font-size:11px;color:var(--text-muted)">(+${c.addOns.map(a=>a.name).join(', ')})</span>`:''} × ${c.qty}</span>
          <span class="text-accent font-bold">₹${(c.item.price + (c.addOnTotal||0)) * c.qty}</span>
        </div>
      `).join('')}
      ${order.promoCode ? `<div class="text-sm text-muted mt-8">🏷️ Promo: ${order.promoCode} (−₹${order.promoDiscount || 0})</div>` : ''}
      ${(order.loyaltyDiscount || 0) > 0 ? `<div class="text-sm" style="color:var(--warning);margin-top:4px">⭐ Loyalty Discount: −₹${order.loyaltyDiscount}</div>` : ''}
      <div class="admin-item-row" style="margin-top:8px;font-weight:800;font-size:15px">
        <span>Total</span><span class="text-accent">₹${order.total}</span>
      </div>
    </div>

    <div class="order-actions">
      ${order.status === 'received' ? `<button class="btn btn-success btn-lg" data-action="adminAccept" data-order="${order.id}">✅ Accept Order</button>` : ''}
      ${order.status === 'accepted' ? `
        <div class="timer-box" style="width:100%">
          <div><div class="timer-label">⏱ Kitchen Timer</div><div class="timer-digits" id="timer-${order.id}">${timerStr}</div></div>
          <div class="text-muted text-sm" style="margin-left:auto">Target: 10 min</div>
        </div>
        <button class="btn btn-warning btn-lg" data-action="adminReady" data-order="${order.id}">🍽️ Food is Ready</button>
      ` : ''}
      ${order.status === 'ready' ? `
        <div style="width:100%">
          <div class="call-btn-group">
            <button class="btn btn-info call-btn" data-action="adminCallCustomer" data-order="${order.id}">📞 Call Customer</button>
            <button class="btn btn-secondary call-btn" data-action="adminCallDelivery" data-order="${order.id}">🛵 Call Delivery</button>
          </div>
          <div class="mt-16"><button class="btn btn-primary btn-lg" data-action="adminDispatch" data-order="${order.id}">🛵 Mark as Dispatched</button></div>
        </div>
      ` : ''}
      ${order.status === 'dispatched' ? `<button class="btn btn-success btn-lg" data-action="adminDelivered" data-order="${order.id}">🎉 Mark as Delivered</button>` : ''}
      ${order.status === 'delivered' ? `<div class="badge badge-success" style="font-size:15px;padding:10px 20px">🎉 Order Completed!</div>` : ''}
      ${order.status === 'cancelled' ? `<div class="badge badge-cancelled" style="font-size:14px;padding:10px 20px">❌ Cancelled${order.cancelReason ? ' — ' + order.cancelReason : ''}</div>` : ''}
      ${['received', 'accepted'].includes(order.status) ? `
        <div style="margin-top:12px">
          <select class="cancel-reason-select" id="admin-cancel-reason-${order.id}" style="margin-bottom:8px">
            <option value="">Reason for cancellation...</option>
            <option value="Item out of stock">Item out of stock</option>
            <option value="Unable to deliver to area">Unable to deliver to area</option>
            <option value="Restaurant too busy">Restaurant too busy</option>
            <option value="Customer not reachable">Customer not reachable</option>
          </select>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);border:1px solid var(--danger)" data-action="adminCancelOrder" data-order="${order.id}">Cancel Order</button>
        </div>` : ''}
    </div>
  </div>`;
}

function statusBadgeClass(status) {
  return { received: 'badge-warning', accepted: 'badge-info', ready: 'badge-accent', dispatched: 'badge-info', delivered: 'badge-success', cancelled: 'badge-cancelled' }[status] || 'badge-muted';
}
function statusLabel(status) {
  return { received: '📋 Received', accepted: '👨‍🍳 Preparing', ready: '✅ Ready', dispatched: '🛵 Dispatched', delivered: '🎉 Delivered', cancelled: '❌ Cancelled' }[status] || status;
}

// ============================================================
// ===== INVENTORY MANAGEMENT UI =====
// ============================================================

function _renderAdminInventoryTab() {
  const { inventoryTab, rawMaterials, inventoryCategories } = State.getState();

  const totalValue = rawMaterials.reduce((s, r) => s + (r.qty * r.costPerUnit), 0);
  const lowStockCount = rawMaterials.filter(r => r.qty <= r.lowStockAlert).length;

  return `
  <div style="padding:24px;max-width:1000px">
    <div class="flex-between mb-24">
      <div>
        <h2 style="font-size:22px;font-weight:900">📦 Inventory Management</h2>
        <div class="text-muted text-sm mt-4">${rawMaterials.length} items · Total stock value: <strong style="color:var(--accent)">₹${totalValue.toLocaleString('en-IN')}</strong>${lowStockCount > 0 ? ` · <span style="color:var(--danger)">⚠️ ${lowStockCount} low stock</span>` : ''}</div>
      </div>
    </div>

    <div class="inv-sub-tabs">
      ${[
        ['stock',     '🥬 Stock'],
        ['configure', '⚙️ Configure'],
        ['recipes',   '📋 Recipes'],
        ['logs',      '📉 Logs'],
      ].map(([key, label]) => `
        <button class="inv-sub-tab ${inventoryTab === key ? 'active' : ''}" data-action="invSetTab" data-tab="${key}">${label}</button>
      `).join('')}
    </div>

    <div class="inv-tab-body">
      ${inventoryTab === 'stock'     ? _renderInvStockTab()     : ''}
      ${inventoryTab === 'configure' ? _renderInvConfigTab()    : ''}
      ${inventoryTab === 'recipes'   ? _renderInvRecipesTab()   : ''}
      ${inventoryTab === 'logs'      ? _renderInvLogsTab()      : ''}
    </div>
  </div>`;
}

// -------- SUB-TAB: CONFIGURE --------
function _renderInvConfigTab() {
  const { inventoryCategories, inventoryUnits } = State.getState();
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
    <!-- CATEGORIES -->
    <div class="card" style="padding:24px">
      <h3 style="font-weight:800;margin-bottom:16px;font-size:16px">🏷️ Categories</h3>
      <p class="text-muted text-sm mb-16">e.g. Packaging, Vegetables, Dairy, Sauces</p>
      ${inventoryCategories.length === 0 ? `<p class="text-muted text-sm mb-12">No categories yet.</p>` : `
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
          ${inventoryCategories.map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <span style="font-size:14px;font-weight:600">${c.name}</span>
              <button class="btn btn-ghost btn-sm" style="color:var(--danger);font-size:12px" data-action="invDeleteCategory" data-id="${c.id}">✕</button>
            </div>`).join('')}
        </div>`}
      <div style="display:flex;gap:8px">
        <input class="form-input" id="inv-cat-name" placeholder="Category name" style="flex:1" />
        <button class="btn btn-primary btn-sm" data-action="invAddCategory">+ Add</button>
      </div>
    </div>

    <!-- UNITS -->
    <div class="card" style="padding:24px">
      <h3 style="font-weight:800;margin-bottom:16px;font-size:16px">📐 Units of Measurement</h3>
      <p class="text-muted text-sm mb-16">e.g. Piece (pc), Gram (g), Liter (L)</p>
      ${inventoryUnits.length === 0 ? `<p class="text-muted text-sm mb-12">No units yet.</p>` : `
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
          ${inventoryUnits.map(u => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
              <span style="font-size:14px;font-weight:600">${u.name} <span class="text-muted">(${u.abbr})</span></span>
              <button class="btn btn-ghost btn-sm" style="color:var(--danger);font-size:12px" data-action="invDeleteUnit" data-id="${u.id}">✕</button>
            </div>`).join('')}
        </div>`}
      <div style="display:flex;gap:8px">
        <input class="form-input" id="inv-unit-name" placeholder="Unit name (e.g. Gram)" style="flex:1" />
        <input class="form-input" id="inv-unit-abbr" placeholder="Abbr (e.g. g)" style="width:80px" />
        <button class="btn btn-primary btn-sm" data-action="invAddUnit">+ Add</button>
      </div>
    </div>
  </div>`;
}

// -------- SUB-TAB: STOCK LEDGER --------
function _renderInvStockTab() {
  const { rawMaterials, inventoryCategories, inventoryUnits } = State.getState();

  // Group by category
  const byCategory = {};
  rawMaterials.forEach(rm => {
    const cat = rm.categoryName || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(rm);
  });

  const totalValue = rawMaterials.reduce((s, r) => s + (r.qty * r.costPerUnit), 0);

  // Stock level color
  const stockColor = (rm) => {
    if (rm.qty <= rm.lowStockAlert) return 'var(--danger)';
    if (rm.qty <= rm.lowStockAlert * 2) return 'var(--warning)';
    return 'var(--success)';
  };

  return `
  <!-- ADD RAW MATERIAL FORM -->
  <div class="card" style="padding:24px;margin-bottom:24px">
    <h3 style="font-weight:800;margin-bottom:16px;font-size:16px">+ Add Raw Material</h3>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="form-group">
        <label class="form-label">Item Name</label>
        <input class="form-input" id="rm-name" placeholder="e.g. Bun" />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-input" id="rm-cat">
          <option value="">Select category</option>
          ${inventoryCategories.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-input" id="rm-unit">
          <option value="">Select unit</option>
          ${inventoryUnits.map(u => `<option value="${u.id}" data-abbr="${u.abbr}">${u.name} (${u.abbr})</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:12px;align-items:flex-end">
      <div class="form-group">
        <label class="form-label">Cost per Unit (₹)</label>
        <input class="form-input" id="rm-cost" type="number" placeholder="2" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label class="form-label">Opening Qty</label>
        <input class="form-input" id="rm-qty" type="number" placeholder="40" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Low Stock Alert ≤</label>
        <input class="form-input" id="rm-alert" type="number" placeholder="5" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Stock Value</label>
        <div id="rm-value-preview" style="height:40px;display:flex;align-items:center;font-weight:800;color:var(--accent);font-size:16px">₹0</div>
      </div>
      <button class="btn btn-primary" data-action="invAddMaterial" style="height:40px">Add Item</button>
    </div>
  </div>

  <!-- STOCK TABLE -->
  ${rawMaterials.length === 0 ? `
    <div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">No raw materials yet. Add your first item above.</div></div>
  ` : Object.entries(byCategory).map(([cat, items]) => `
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px">
      <div style="padding:12px 20px;background:var(--bg-elevated);font-weight:700;font-size:13px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
        <span>${cat}</span>
        <span class="text-muted" style="font-weight:400">${items.length} items</span>
      </div>
      <table class="inv-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit</th>
            <th>Cost/Unit</th>
            <th>Qty in Stock</th>
            <th>Stock Value</th>
            <th>Adjust</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(rm => {
            const val = (rm.qty * rm.costPerUnit).toFixed(2);
            const col = stockColor(rm);
            return `
            <tr>
              <td><strong>${rm.name}</strong></td>
              <td><span class="inv-unit-badge">${rm.unitAbbr}</span></td>
              <td>₹${rm.costPerUnit}</td>
              <td>
                <span style="font-size:18px;font-weight:900;color:${col}">${rm.qty}</span>
                ${rm.qty <= rm.lowStockAlert ? `<span style="font-size:11px;color:var(--danger);margin-left:4px">⚠️ LOW</span>` : ''}
              </td>
              <td><span class="inv-value-chip">₹${Number(val).toLocaleString('en-IN')}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <button class="qty-btn" data-action="invAdjustQty" data-id="${rm.id}" data-delta="-1">−</button>
                  <input type="number" class="inv-qty-input" value="${rm.qty}" id="qty-input-${rm.id}"
                    onchange="invSetQty('${rm.id}', this.value)" style="width:60px;text-align:center" />
                  <button class="qty-btn" data-action="invAdjustQty" data-id="${rm.id}" data-delta="1">+</button>
                </div>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);font-size:12px" data-action="invDeleteMaterial" data-id="${rm.id}">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align:right;font-weight:700;color:var(--text-muted)">Category Total:</td>
            <td colspan="3"><strong style="color:var(--accent)">₹${items.reduce((s,r) => s + r.qty*r.costPerUnit, 0).toLocaleString('en-IN')}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `).join('')}

  ${rawMaterials.length > 0 ? `
  <div style="text-align:right;margin-top:8px;font-size:16px;font-weight:900">
    Total Inventory Value: <span style="color:var(--accent)">₹${totalValue.toLocaleString('en-IN')}</span>
  </div>` : ''}`;
}

// -------- SUB-TAB: RECIPES --------
function _renderInvRecipesTab() {
  const { brands, rawMaterials, recipes } = State.getState();

  // Collect all menu items across all brands
  const allItems = [];
  brands.forEach(b => (b.menu || []).forEach(item => {
    allItems.push({ item, brand: b });
  }));

  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

    <!-- RECIPE BUILDER -->
    <div class="card" style="padding:24px">
      <h3 style="font-weight:800;margin-bottom:16px;font-size:16px">🍳 Create / Edit Recipe</h3>
      <div class="form-group">
        <label class="form-label">Menu Item</label>
        <select class="form-input" id="rec-item" onchange="_onRecipeItemChange()">
          <option value="">Select menu item</option>
          ${allItems.map(({ item, brand }) =>
            `<option value="${item.id}" data-brand="${brand.id}" data-name="${item.name}">${brand.name} → ${item.emoji} ${item.name}</option>`
          ).join('')}
        </select>
      </div>

      <div id="rec-ingredients-box" style="margin-bottom:16px">
        <label class="form-label">Ingredients</label>
        <div id="rec-ingredient-rows" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px"></div>
        <button class="btn btn-ghost btn-sm" onclick="_addRecipeIngredientRow()">+ Add Ingredient</button>
      </div>

      <button class="btn btn-primary btn-block" data-action="invSaveRecipe">💾 Save Recipe</button>
    </div>

    <!-- EXISTING RECIPES -->
    <div>
      <h3 style="font-weight:800;margin-bottom:16px;font-size:16px">📋 Saved Recipes (${recipes.length})</h3>
      ${recipes.length === 0 ? `<p class="text-muted text-sm">No recipes yet. Create your first recipe on the left.</p>` : recipes.map(rec => `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div class="flex-between mb-8">
            <div>
              <div style="font-weight:700">${rec.menuItemName || rec.menuItemId}</div>
              <div class="text-muted text-sm">${rec.ingredients.length} ingredients</div>
            </div>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-action="invDeleteRecipe" data-id="${rec.id}">🗑️</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${rec.ingredients.map(ing =>
              `<span class="inv-unit-badge" style="background:var(--bg-elevated)">${ing.qty} ${ing.unitAbbr} ${ing.name}</span>`
            ).join('')}
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

// -------- SUB-TAB: LOGS & ALERTS --------
function _renderInvLogsTab() {
  const { inventoryLogs, rawMaterials } = State.getState();
  const lowStock = rawMaterials.filter(r => r.qty <= r.lowStockAlert);

  const sorted = [...inventoryLogs].sort((a, b) => {
    const ta = a.timestamp?.seconds || 0;
    const tb = b.timestamp?.seconds || 0;
    return tb - ta;
  });

  return `
  ${lowStock.length > 0 ? `
  <div class="card" style="padding:20px;margin-bottom:24px;background:linear-gradient(135deg,#1a0000,#3d0000);border-color:rgba(239,68,68,0.3)">
    <div style="font-weight:800;font-size:15px;color:var(--danger);margin-bottom:12px">⚠️ Low Stock Alerts (${lowStock.length})</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${lowStock.map(rm => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,0,0,0.3);border-radius:var(--radius-md)">
          <div>
            <span style="font-weight:700">${rm.name}</span>
            <span class="text-muted text-sm"> · ${rm.categoryName}</span>
          </div>
          <div style="text-align:right">
            <span style="color:var(--danger);font-size:18px;font-weight:900">${rm.qty}</span>
            <span class="text-muted"> ${rm.unitAbbr}</span>
            <div style="font-size:11px;color:var(--text-muted)">Alert threshold: ≤${rm.lowStockAlert}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>` : `
  <div class="badge badge-success" style="margin-bottom:20px;padding:10px 16px;font-size:13px">✅ All stock levels are healthy</div>`}

  <div class="card" style="padding:0;overflow:hidden">
    <div style="padding:14px 20px;background:var(--bg-elevated);border-bottom:1px solid var(--border);font-weight:700">
      📜 Inventory Log (${sorted.length} entries)
    </div>
    ${sorted.length === 0 ? `<p class="text-muted text-sm" style="padding:20px">No log entries yet. Logs appear when orders are accepted or stock is adjusted manually.</p>` : `
    <div style="max-height:480px;overflow-y:auto">
      ${sorted.map(log => {
        const ts = log.timestamp?.seconds
          ? new Date(log.timestamp.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Unknown time';
        const badge = log.type === 'order_deduction'
          ? `<span class="inv-unit-badge" style="background:rgba(59,130,246,0.15);color:var(--info)">Order</span>`
          : log.type === 'waste'
          ? `<span class="inv-unit-badge" style="background:rgba(239,68,68,0.15);color:var(--danger)">Waste</span>`
          : `<span class="inv-unit-badge">Manual</span>`;
        return `
        <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div class="flex-between mb-6">
            <div style="display:flex;align-items:center;gap:8px">
              ${badge}
              ${log.orderId ? `<span class="text-muted text-sm">Order #${(log.orderId || '').slice(-6)}</span>` : ''}
              ${log.reason ? `<span class="text-muted text-sm">"${log.reason}"</span>` : ''}
            </div>
            <span class="text-muted text-sm">${ts}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${(log.changes || []).map(c =>
              `<span class="inv-unit-badge">−${c.used} ${c.unitAbbr} ${c.name} → ${c.newQty} left</span>`
            ).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`}
  </div>`;
}

// -------- RECIPE HELPERS (called inline via onclick) --------
let _recipeIngredientCount = 0;
function _addRecipeIngredientRow(prefill = {}) {
  const { rawMaterials } = State.getState();
  const id = ++_recipeIngredientCount;
  const row = document.createElement('div');
  row.id = `rec-row-${id}`;
  row.style.cssText = 'display:flex;gap:8px;align-items:center';
  row.innerHTML = `
    <select class="form-input" id="rec-rm-${id}" style="flex:2">
      <option value="">Raw material</option>
      ${rawMaterials.map(r => `<option value="${r.id}" data-abbr="${r.unitAbbr}" data-name="${r.name}" ${prefill.rawMaterialId === r.id ? 'selected' : ''}>${r.name} (${r.unitAbbr})</option>`).join('')}
    </select>
    <input type="number" class="form-input" id="rec-qty-${id}" placeholder="Qty" min="0" step="0.1" value="${prefill.qty || ''}" style="width:80px" />
    <span id="rec-abbr-${id}" class="inv-unit-badge" style="min-width:36px;text-align:center">${prefill.unitAbbr || '?'}</span>
    <button class="qty-btn" onclick="document.getElementById('rec-row-${id}').remove()" style="color:var(--danger)">✕</button>
  `;
  row.querySelector(`#rec-rm-${id}`).addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    const abbr = opt.getAttribute('data-abbr') || '?';
    document.getElementById(`rec-abbr-${id}`).textContent = abbr;
  });
  document.getElementById('rec-ingredient-rows')?.appendChild(row);
}

function _onRecipeItemChange() {
  const { recipes } = State.getState();
  const sel = document.getElementById('rec-item');
  const itemId = sel?.value;
  const brandId = sel?.options[sel.selectedIndex]?.getAttribute('data-brand');
  const existing = recipes.find(r => r.menuItemId === itemId && r.brandId === brandId);
  const rows = document.getElementById('rec-ingredient-rows');
  if (rows) rows.innerHTML = '';
  _recipeIngredientCount = 0;
  if (existing) {
    existing.ingredients.forEach(ing => _addRecipeIngredientRow(ing));
  } else {
    _addRecipeIngredientRow();
  }
}

function invSetQty(id, newQty) {
  setRawMaterialQty(id, parseInt(newQty, 10))
    .then(() => {})
    .catch(() => showToast('Could not update qty.', 'error'));
}

// ====================================================
// ===== ADMIN: SETTINGS TAB ==========================
// ====================================================

function _renderAdminSettingsTab() {
  const { settings } = State.getState();
  const bh = (settings && settings.businessHours) || {
    mon: { open: '10:00', close: '22:00', closed: false },
    tue: { open: '10:00', close: '22:00', closed: false },
    wed: { open: '10:00', close: '22:00', closed: false },
    thu: { open: '10:00', close: '22:00', closed: false },
    fri: { open: '10:00', close: '23:00', closed: false },
    sat: { open: '10:00', close: '23:00', closed: false },
    sun: { open: '11:00', close: '22:00', closed: false },
  };
  const isOpen = settings ? settings.storeOpen !== false : true;
  const DAY_LABELS = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };
  const cfg = typeof BRAND_CONFIG !== 'undefined' ? BRAND_CONFIG : {};

  return `
  <div style="padding:24px;max-width:860px">
    <h2 style="font-size:22px;font-weight:900;margin-bottom:28px">Settings</h2>

    <!-- STORE STATUS -->
    <div class="card settings-section" style="padding:24px;margin-bottom:24px">
      <div class="settings-section-title">Store Status</div>
      <label style="display:flex;align-items:center;gap:12px;cursor:pointer;font-weight:600;font-size:15px">
        <input type="checkbox" id="store-open-toggle" ${isOpen ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent)" data-action="toggleStoreOpen" />
        ${isOpen ? '<span style="color:var(--success)">Store is OPEN — accepting orders</span>' : '<span style="color:var(--danger)">Store is CLOSED — not accepting orders</span>'}
      </label>
      <p class="text-muted text-sm mt-8">Override business hours with a manual open/close switch.</p>
    </div>

    <!-- BUSINESS HOURS -->
    <div class="card settings-section" style="padding:24px;margin-bottom:24px">
      <div class="settings-section-title">Business Hours</div>
      <p class="text-muted text-sm mb-16">Set your opening and closing times for each day of the week.</p>
      <div class="hours-grid">
        ${Object.entries(bh).map(([day, times]) => `
          <div>
            <div class="hours-day-label">${DAY_LABELS[day] || day}</div>
            <div class="hours-input-pair">
              <input type="time" id="bh-open-${day}" value="${times.open || '10:00'}" ${times.closed ? 'disabled' : ''} />
              <input type="time" id="bh-close-${day}" value="${times.close || '22:00'}" ${times.closed ? 'disabled' : ''} />
              <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-muted);cursor:pointer;margin-top:4px;justify-content:center">
                <input type="checkbox" id="bh-closed-${day}" ${times.closed ? 'checked' : ''} style="accent-color:var(--danger)" />
                Closed
              </label>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="hours-save-btn" data-action="saveBusinessHours">💾 Save Business Hours</button>
    </div>

    <!-- WHATSAPP NOTIFICATIONS -->
    <div class="card settings-section" style="padding:24px;margin-bottom:24px">
      <div class="settings-section-title">WhatsApp Notifications</div>
      <p class="text-muted text-sm mb-16">Get WhatsApp alerts on every new order. Enter the restaurant owner number.</p>
      <div class="form-row" style="align-items:flex-end">
        <div class="form-group" style="flex:2">
          <label class="form-label">WhatsApp Number (with country code)</label>
          <input class="form-input" id="wa-number" placeholder="919876543210" value="${cfg.ownerWhatsApp || ''}" />
        </div>
        <button class="btn btn-primary" data-action="saveWhatsAppNumber">Save</button>
      </div>
      <p class="text-muted text-sm mt-8">Orders will open a WhatsApp chat for quick alerting. Full automation via WATI/Twilio available on upgrade.</p>
    </div>

    <!-- RAZORPAY SETTINGS -->
    <div class="card settings-section" style="padding:24px;margin-bottom:24px">
      <div class="settings-section-title">Razorpay Payment Gateway</div>
      <p class="text-muted text-sm mb-16">Add your Razorpay Key ID to accept online payments. Get it from <span style="color:var(--accent)">dashboard.razorpay.com</span></p>
      <div class="form-group">
        <label class="form-label">Razorpay Key ID</label>
        <input class="form-input" id="rzp-key" placeholder="rzp_live_XXXXXXXXXXXXXXXX" value="${cfg.razorpayKeyId !== 'rzp_test_REPLACE_WITH_YOUR_KEY' ? cfg.razorpayKeyId : ''}" />
      </div>
      <p class="text-muted text-sm mt-8 mb-12">Use <strong>rzp_test_</strong> prefix for testing, <strong>rzp_live_</strong> for production.</p>
      <button class="btn btn-primary" data-action="saveRazorpayKey">Save Key</button>
    </div>

    <!-- BRAND IDENTITY -->
    <div class="card settings-section" style="padding:24px;margin-bottom:24px">
      <div class="settings-section-title">Brand Identity</div>
      <p class="text-muted text-sm mb-16">Customize the app name, logo, and accent color for this client. Changes take effect after page reload.</p>
      <div class="form-group">
        <label class="form-label">App Name</label>
        <input class="form-input" id="brand-name-input" value="${cfg.appName || 'EatClub'}" />
      </div>
      <div class="form-group">
        <label class="form-label">Accent Color</label>
        <div style="display:flex;gap:12px;align-items:center">
          <input type="color" id="brand-color-input" value="${cfg.accent || '#ff6b2c'}" style="width:48px;height:36px;cursor:pointer;border:none;border-radius:8px;background:none" />
          <span class="text-muted text-sm" id="brand-color-preview">${cfg.accent || '#ff6b2c'}</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Logo URL <span class="text-muted">(leave blank to use text logo)</span></label>
        <input class="form-input" id="brand-logo-input" placeholder="https://yourdomain.com/logo.png" value="${cfg.logoUrl || ''}" />
      </div>
      <p class="text-muted text-sm mt-8">Edit <strong>brand-config.js</strong> directly for permanent changes, or use this form to preview.</p>
      <button class="btn btn-primary mt-12" data-action="previewBrandConfig">👁️ Apply Preview</button>
    </div>
  </div>`;
}
