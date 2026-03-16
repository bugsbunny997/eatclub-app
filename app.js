// ===== MAIN APP ENTRY POINT + EVENT DELEGATION =====

function renderApp() {
    const { currentPage, currentBrandId, currentOrderId, loginModalOpen, cartOpen, user, authLoading, customizationModal } = State.getState();
    const app = document.getElementById('app');
    const modalRoot = document.getElementById('modal-root');

    if (authLoading) {
        app.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px">
            <div style="font-size:60px">🍽️</div>
            <div style="color:var(--text-muted);font-size:15px;font-weight:500">Loading EatClub...</div>
          </div>`;
        modalRoot.innerHTML = '';
        return;
    }

    let pageHTML = '';
    if (user && user.role === 'admin' && !['home', 'profile'].includes(currentPage)) {
        pageHTML = renderAdminDashboard();
    } else {
        switch (currentPage) {
            case 'brand': pageHTML = renderBrandPage(currentBrandId); break;
            case 'checkout': pageHTML = renderCheckoutPage(); break;
            case 'tracking': pageHTML = renderTrackingPage(currentOrderId); break;
            case 'admin': pageHTML = renderAdminDashboard(); break;
            case 'orderHistory': pageHTML = renderOrderHistoryPage(); break;
            case 'profile': pageHTML = renderProfilePage(); break;
            default: pageHTML = renderHomePage(); break;
        }
    }
    app.innerHTML = pageHTML;

    let overlayHTML = '';
    if (loginModalOpen) overlayHTML += renderLoginModal();
    if (cartOpen) overlayHTML += renderCartDrawer();
    if (customizationModal) overlayHTML += renderCustomizationModal();
    modalRoot.innerHTML = overlayHTML;

    // Run flash timer updater
    if (typeof _updateFlashTimers === 'function') _updateFlashTimers();
}


// ===== EVENT DELEGATION =====
document.addEventListener('click', function (e) {
    let el = e.target;
    while (el && el !== document.body) {
        if (el.dataset && el.dataset.action) { handleAction(el.dataset.action, el.dataset, e); return; }
        el = el.parentElement;
    }
});

// Enter key for auth modals
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const id = document.activeElement && document.activeElement.id;
    if (['login-email', 'login-password'].includes(id)) handleAction('doLogin', {}, e);
    if (['reg-name', 'reg-email', 'reg-password', 'reg-password2'].includes(id)) handleAction('doRegister', {}, e);
});

// Search input (debounced, refocuses after render)
let _searchTimer = null;
document.addEventListener('input', function (e) {
    if (e.target.id !== 'main-search') return;
    const val = e.target.value;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
        State.setState({ searchQuery: val });
        renderApp();
        const el = document.getElementById('main-search');
        if (el) { el.focus(); el.setSelectionRange(val.length, val.length); }
    }, 250);
});

function _updateDiscPreview() {
    const priceEl = document.getElementById('mi-price');
    const discEl = document.getElementById('mi-disc');
    const saleEl = document.getElementById('mi-sale');
    const previewEl = document.getElementById('mi-disc-preview');
    if (!previewEl) return;
    const price = parseInt(priceEl?.value, 10) || 0;
    const discPct = parseInt(discEl?.value, 10) || 0;
    const salePrice = parseInt(saleEl?.value, 10) || 0;
    if (!price) { previewEl.textContent = ''; return; }
    if (salePrice > 0) {
        const saved = price - salePrice;
        const pct = Math.round(saved / price * 100);
        previewEl.innerHTML = `✅ Fixed price: <strong>₹${price}</strong> → <strong style="color:var(--accent)">₹${salePrice}</strong> &nbsp;·&nbsp; Customer saves ₹${saved} (${pct}% off)`;
    } else if (discPct > 0) {
        const eff = Math.round(price * (1 - discPct / 100));
        previewEl.innerHTML = `✅ Auto discount: <strong>₹${price}</strong> → <strong style="color:var(--accent)">₹${eff}</strong> &nbsp;·&nbsp; ${discPct}% off`;
    } else {
        previewEl.textContent = '';
    }
}

function handleAction(action, dataset, e) {
    switch (action) {

        // ---- NAVIGATION ----
        case 'goHome':
            if (typeof _adInterval !== 'undefined' && _adInterval) clearInterval(_adInterval);
            State.setState({ searchQuery: '' });
            navigate('home');
            break;
        case 'goAdmin': navigate('admin'); break;
        case 'goProfile': navigate('profile'); break;
        case 'goOrderHistory': navigate('orderHistory'); break;

        case 'goTracking':
            navigate('tracking', { currentOrderId: dataset.order });
            break;

        case 'goBrand':
            _selectedCategory = null;
            navigate('brand', { currentBrandId: dataset.brand });
            break;

        case 'goCheckout': {
            const { user } = State.getState();
            if (!user) { State.setState({ cartOpen: false, loginModalOpen: true }); renderApp(); }
            else { State.setState({ cartOpen: false }); navigate('checkout'); }
            break;
        }

        case 'clearSearch':
            State.setState({ searchQuery: '' });
            renderApp();
            break;

        // ---- AUTH ----
        case 'openLogin':
            _authTab = 'signin';
            State.setState({ loginModalOpen: true });
            renderApp();
            break;

        case 'closeModal': {
            const box = document.getElementById('login-modal-box');
            if (box && box.contains(e.target)) return;
            _authTab = 'signin';
            State.setState({ loginModalOpen: false });
            renderApp();
            break;
        }

        case 'switchAuthTab':
            _authTab = dataset.tab || 'signin';
            renderApp();
            break;

        case 'doLogin': {
            const emailEl = document.getElementById('login-email');
            const pwEl = document.getElementById('login-password');
            const errEl = document.getElementById('login-error');
            if (!emailEl || !pwEl) return;
            const emailVal = emailEl.value.trim(), pwVal = pwEl.value;
            if (errEl) errEl.classList.add('hidden');

            login(emailVal, pwVal)
                .then(acc => {
                    showToast('Welcome back, ' + acc.name.split(' ')[0] + '! 🎉', 'success');
                    if (acc.role === 'admin') navigate('admin'); else renderApp();
                })
                .catch(err => {
                    const isNotFound = ['auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(err.code);
                    if (isNotFound && emailVal === 'admin@test.com') {
                        // Auto-create demo admin on first use
                        AUTH.createUserWithEmailAndPassword('admin@test.com', pwVal)
                            .then(cred => DB.collection('users').doc(cred.user.uid).set({ name: 'Admin Panel', email: 'admin@test.com', role: 'admin', uid: cred.user.uid }).then(() => cred))
                            .then(cred => DB.collection('users').doc(cred.user.uid).get())
                            .then(doc => { State.setState({ user: doc.data(), loginModalOpen: false }); showToast('Admin ready! 🎉', 'success'); navigate('admin'); })
                            .catch(e2 => { if (errEl) { errEl.textContent = e2.message; errEl.classList.remove('hidden'); } });
                    } else if (isNotFound && emailVal === 'customer@test.com') {
                        // Auto-create demo customer on first use
                        AUTH.createUserWithEmailAndPassword('customer@test.com', pwVal)
                            .then(cred => DB.collection('users').doc(cred.user.uid).set({ name: 'Demo Customer', email: 'customer@test.com', role: 'customer', uid: cred.user.uid, phone: '9876543210', savedAddress: '12, Demo Street, Bandra West, Mumbai' }).then(() => cred))
                            .then(cred => DB.collection('users').doc(cred.user.uid).get())
                            .then(doc => { State.setState({ user: doc.data(), loginModalOpen: false }); showToast('Welcome, Demo Customer! 🎉', 'success'); renderApp(); })
                            .catch(e2 => { if (errEl) { errEl.textContent = e2.message; errEl.classList.remove('hidden'); } });
                    } else {
                        if (errEl) { errEl.textContent = 'Invalid email or password.'; errEl.classList.remove('hidden'); }
                    }
                });
            break;
        }

        case 'doRegister': {
            const nameEl = document.getElementById('reg-name');
            const emailEl = document.getElementById('reg-email');
            const pwEl = document.getElementById('reg-password');
            const pw2El = document.getElementById('reg-password2');
            const errEl = document.getElementById('reg-error');
            if (!nameEl || !emailEl || !pwEl || !pw2El) return;
            const name = nameEl.value.trim(), email = emailEl.value.trim(), pw = pwEl.value, pw2 = pw2El.value;
            if (!name) { errEl.textContent = 'Please enter your name.'; errEl.classList.remove('hidden'); return; }
            if (!email) { errEl.textContent = 'Please enter your email.'; errEl.classList.remove('hidden'); return; }
            if (pw.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }
            if (pw !== pw2) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return; }
            errEl.classList.add('hidden');
            registerAccount(name, email, pw)
                .then(acc => { showToast('Welcome, ' + acc.name.split(' ')[0] + '! 🎉', 'success'); renderApp(); })
                .catch(err => {
                    let msg = 'Registration failed.';
                    if (err.code === 'auth/email-already-in-use') msg = 'Email already registered. Try signing in.';
                    if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email.';
                    errEl.textContent = msg; errEl.classList.remove('hidden');
                });
            break;
        }

        case 'logout':
            logout().then(() => renderApp());
            break;

        // ---- PROFILE ----
        case 'updateProfile': {
            const nameEl = document.getElementById('profile-name');
            const phoneEl = document.getElementById('profile-phone');
            const addrEl = document.getElementById('profile-address');
            const errEl = document.getElementById('profile-error');
            const okEl = document.getElementById('profile-success');
            if (!nameEl) return;
            if (!nameEl.value.trim()) { if (errEl) { errEl.textContent = 'Name cannot be empty.'; errEl.classList.remove('hidden'); } return; }
            updateUserProfile({ name: nameEl.value.trim(), phone: phoneEl?.value || '', savedAddress: addrEl?.value || '' })
                .then(() => {
                    if (okEl) { okEl.classList.remove('hidden'); setTimeout(() => okEl.classList.add('hidden'), 3000); }
                    if (errEl) errEl.classList.add('hidden');
                    showToast('Profile saved!', 'success');
                })
                .catch(err => { if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); } });
            break;
        }

        // ---- NOTIFICATIONS ----
        case 'requestNotifications':
            requestNotificationPermission().then(perm => {
                if (perm === 'granted') { showToast('Notifications enabled! 🔔', 'success'); renderApp(); }
                else { showToast('Notification permission denied.', 'error'); }
            });
            break;

        // ---- CART ----
        case 'openCart': State.setState({ cartOpen: true }); renderApp(); break;
        case 'closeCart': State.setState({ cartOpen: false }); renderApp(); break;

        case 'addItem': {
            const itemId = dataset.item, brandId = dataset.brand || State.getState().currentBrandId;
            let found = null;
            for (const b of getBrands()) { found = (b.menu || []).find(m => m.id === itemId); if (found) break; }
            if (found) { addToCart(found, brandId); renderApp(); }
            break;
        }
        case 'removeItem': removeFromCart(dataset.item); renderApp(); break;
        case 'setCat': _selectedCategory = dataset.cat; renderApp(); break;

        // ---- PROMO CODES ----
        case 'applyPromoCode': {
            const input = document.getElementById('promo-input');
            const errEl = document.getElementById('promo-error');
            if (!input) return;
            const result = applyPromoCode(input.value.trim());
            if (result.error) {
                if (errEl) { errEl.textContent = result.error; errEl.classList.remove('hidden'); }
            } else {
                showToast(`Promo applied! ${result.discount}% off 🎉`, 'success');
                renderApp();
            }
            break;
        }
        case 'removePromoCode': removePromoCode(); renderApp(); break;
        case 'placeOrder': {
            const name = document.getElementById('co-name')?.value.trim();
            const phone = document.getElementById('co-phone')?.value.trim();
            const address = `${document.getElementById('co-address')?.value.trim()}, ${document.getElementById('co-city')?.value.trim()}`;
            const scheduleEl = document.getElementById('co-schedule');
            const scheduledFor = scheduleEl?.value ? new Date(scheduleEl.value).toISOString() : null;
            if (!name || !phone || !address) { showToast('Please fill in delivery details.', 'error'); return; }
            placeOrder({ name, phone, address, scheduledFor })
                .then(orderId => {
                    if (orderId) {
                        showToast('\ud83c\udf89 Order placed! Tracking your delivery...', 'success');
                        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
                        navigate('tracking', { currentOrderId: orderId });
                    }
                })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        // ---- RATING ----
        case 'setStar': {
            const orderId = dataset.order, stars = parseInt(dataset.stars, 10);
            if (!_ratingState[orderId]) _ratingState[orderId] = { stars: 0 };
            _ratingState[orderId].stars = stars;
            // Re-render just the star picker without full renderApp
            document.querySelectorAll('.star-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i < stars);
            });
            const submitBtn = document.querySelector(`[data-action="submitRating"][data-order="${orderId}"]`);
            if (submitBtn) submitBtn.disabled = false;
            break;
        }

        case 'submitRating': {
            const orderId = dataset.order, brandId = dataset.brand;
            const rState = _ratingState[orderId];
            if (!rState || rState.stars === 0) { showToast('Please select a star rating first.', 'error'); return; }
            const comment = (document.getElementById(`rating-comment-${orderId}`) || {}).value || '';
            submitRating(orderId, brandId, rState.stars, comment)
                .then(() => { showToast('Thanks for your rating! 🙏', 'success'); renderApp(); })
                .catch(() => showToast('Could not submit rating. Try again.', 'error'));
            break;
        }

        // ---- AD CAROUSEL ----
        case 'setAd':
            _adIndex = parseInt(dataset.ad, 10) || 0;
            document.querySelectorAll('.ad-banner').forEach((b, i) => b.classList.toggle('visible', i === _adIndex));
            document.querySelectorAll('.ad-dot').forEach((d, i) => d.classList.toggle('active', i === _adIndex));
            break;

        // ---- ADMIN: GENERAL ----
        case 'adminSetTab':
            State.setState({ adminTab: dataset.tab || 'orders' });
            _adminBrandView = 'list'; _adminBrandDetailId = null;
            renderApp();
            break;

        case 'selectOrder': _selectedOrderId = dataset.order; renderApp(); break;

        case 'adminAccept':
            updateOrderStatus(dataset.order, 'accepted').then(() => { showToast('Order accepted! Timer started ⏱', 'success'); renderApp(); });
            break;
        case 'adminReady':
            updateOrderStatus(dataset.order, 'ready').then(() => {
                if (_timerIntervals?.[dataset.order]) { clearInterval(_timerIntervals[dataset.order]); delete _timerIntervals[dataset.order]; }
                showToast('Food marked as ready! 🍽️', 'success'); renderApp();
            });
            break;
        case 'adminCallCustomer': { const o = getOrder(dataset.order); showToast('📞 Calling ' + (o?.customer?.name || 'Customer') + '...', 'info', 2500); break; }
        case 'adminCallDelivery': showToast('🛵 Calling Delivery Partner...', 'info', 2500); break;
        case 'adminDispatch':
            updateOrderStatus(dataset.order, 'dispatched').then(() => { showToast('Order dispatched! 🛵', 'success'); renderApp(); });
            break;
        case 'adminDelivered':
            updateOrderStatus(dataset.order, 'delivered').then(() => { showToast('Order delivered! 🎉', 'success'); renderApp(); });
            break;

        // ---- ADMIN: BRANDS ----
        case 'adminBrandDetail':
            _adminBrandView = 'detail'; _adminBrandDetailId = dataset.brand;
            renderApp();
            break;
        case 'adminBrandBack':
            _adminBrandView = 'list'; _adminBrandDetailId = null;
            renderApp();
            break;

        case 'adminAddBrand': {
            const name = document.getElementById('nb-name')?.value.trim();
            const emoji = document.getElementById('nb-emoji')?.value.trim() || '🍽️';
            const tagline = document.getElementById('nb-tagline')?.value.trim();
            const time = document.getElementById('nb-time')?.value.trim() || '30-40 min';
            const fee = document.getElementById('nb-fee')?.value.trim() || '₹39';
            const min = document.getElementById('nb-min')?.value.trim() || '₹199';
            const catsRaw = document.getElementById('nb-cats')?.value.trim() || '';
            if (!name) { showToast('Brand name is required.', 'error'); return; }
            const cats = catsRaw.split(',').map(c => c.trim()).filter(Boolean);
            const brandData = { name, emoji, tagline: tagline || 'Great food, delivered fresh.', bg: 'linear-gradient(135deg, #111827,#1f2937)', accentColor: '#ff6b2c', tags: cats, deliveryTime: time, deliveryFee: fee, minOrder: min, categories: cats, menu: [] };
            addBrandToFirestore(brandData)
                .then(() => { showToast(`${emoji} ${name} added!`, 'success'); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'adminDeleteBrand':
            if (!confirm(`Delete this brand?`)) return;
            deleteBrand(dataset.brand)
                .then(() => showToast('Brand deleted.', 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'adminAddMenuItem': {
            const brandId = dataset.brand;
            const name = document.getElementById('mi-name')?.value.trim();
            const emoji = document.getElementById('mi-emoji')?.value.trim() || '🍽️';
            const cat = document.getElementById('mi-cat')?.value;
            const price = parseInt(document.getElementById('mi-price')?.value, 10);
            const desc = document.getElementById('mi-desc')?.value.trim() || '';
            const discPct = parseInt(document.getElementById('mi-disc')?.value, 10) || 0;
            const salePriceRaw = parseInt(document.getElementById('mi-sale')?.value, 10) || 0;
            if (!name || !price || !cat) { showToast('Name, Category, and Price are required.', 'error'); return; }
            const effectivePrice = salePriceRaw > 0 ? salePriceRaw
                : discPct > 0 ? Math.round(price * (1 - discPct / 100))
                : price;
            const itemData = { name, emoji, category: cat, price, desc, effectivePrice };
            if (discPct > 0) itemData.discountPct = discPct;
            if (salePriceRaw > 0) itemData.salePrice = salePriceRaw;
            addMenuItem(brandId, itemData)
                .then(() => { showToast(`${emoji} ${name} added!`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'adminRemoveMenuItem':
            if (!confirm('Delete this menu item?')) return;
            removeMenuItem(dataset.brand, dataset.item)
                .then(() => showToast('Item deleted.', 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'adminAddCategory': {
            const brandId = dataset.brand;
            const cat = document.getElementById('nc-name')?.value.trim();
            if (!cat) { showToast('Category name is required.', 'error'); return; }
            addCategory(brandId, cat)
                .then(() => { showToast(`Category added!`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'adminRemoveCategory':
            if (!confirm(`Delete category? This will also remove all items in this category.`)) return;
            removeCategory(dataset.brand, dataset.cat)
                .then(() => showToast('Category deleted.', 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        // ---- ADMIN: PROMOS ----
        case 'adminCreatePromo': {
            const code = document.getElementById('pc-code')?.value.trim().toUpperCase();
            const discount = parseInt(document.getElementById('pc-discount')?.value, 10);
            const minOrder = parseInt(document.getElementById('pc-min')?.value, 10) || 0;
            if (!code || !discount || discount < 1 || discount > 100) { showToast('Valid code and discount % required.', 'error'); return; }
            createPromoCode(code, discount, minOrder)
                .then(() => showToast(`Promo ${code} created!`, 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'adminTogglePromo':
            togglePromoCode(dataset.code, dataset.active === '1')
                .then(() => showToast('Promo updated.', 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'adminDeletePromo':
            if (!confirm(`Delete promo ${dataset.code}?`)) return;
            deletePromoCode(dataset.code)
                .then(() => showToast('Promo deleted.', 'success'))
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        // ---- ADMIN: STOCK + FLASH SALE ----
        case 'adminToggleStock': {
            const oos = dataset.oos === '1';
            toggleItemStock(dataset.brand, dataset.item, oos)
                .then(() => { showToast(oos ? '⛔ Marked Out of Stock' : '✅ Marked In Stock', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'adminStartFlashSale': {
            const pct = parseInt(prompt('Flash Sale discount %? (e.g. 30)'), 10);
            const mins = parseInt(prompt('Duration in minutes? (e.g. 60)'), 10);
            if (!pct || pct < 1 || pct > 99 || !mins || mins < 1) { showToast('Invalid flash sale parameters.', 'error'); return; }
            setFlashSale(dataset.brand, dataset.item, pct, mins)
                .then(() => { showToast(`⚡ Flash sale started! ${pct}% off for ${mins} min`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        // ---- SMART REORDER ----
        case 'reorder': {
            const { orders, brands } = State.getState();
            const order = orders.find(o => o.id === dataset.order);
            if (!order) { showToast('Order not found.', 'error'); return; }
            clearCart();
            order.items.forEach(c => {
                // Find the item's brand to resolve current addOns
                addToCart(c.item, c.brandId, c.addOns || []);
            });
            State.setState({ cartOpen: true });
            renderApp();
            showToast('🔄 Items added to cart!', 'success');
            break;
        }

        // ---- ADDRESS BOOK ----
        case 'saveAddress': {
            const label = document.getElementById('addr-label')?.value.trim();
            const address = document.getElementById('addr-address')?.value.trim();
            if (!label || !address) { showToast('Label and address are required.', 'error'); return; }
            saveAddress(label, address)
                .then(() => { showToast('Address saved!', 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }
        case 'removeAddress': {
            removeAddress(dataset.addrId)
                .then(() => { showToast('Address removed.', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        // ---- LOYALTY POINTS ----
        case 'redeemLoyalty': {
            const pts = parseInt(document.getElementById('loyalty-pts-input')?.value, 10);
            if (!pts || pts < 100) { showToast('Enter at least 100 points to redeem.', 'error'); return; }
            redeemLoyaltyPoints(pts);
            renderApp();
            const { loyaltyRedemption } = State.getState();
            if (loyaltyRedemption) showToast(`⭐ ${loyaltyRedemption.points} pts = ₹${loyaltyRedemption.value} discount applied!`, 'success');
            break;
        }
        case 'cancelLoyalty':
            cancelLoyaltyRedemption();
            renderApp();
            showToast('Loyalty discount removed.', 'info');
            break;

        // ---- NOTIFICATION BELL ----
        case 'toggleNotifPanel': {
            const { notifOpen } = State.getState();
            State.setState({ notifOpen: !notifOpen });
            renderApp();
            break;
        }
        case 'markNotifsRead':
            markAllNotifsRead();
            renderApp();
            break;

        // ---- CUSTOMIZATION MODAL ----
        case 'openCustomModal': {
            const { brands } = State.getState();
            const brandId = dataset.brand;
            const itemId = dataset.item;
            // Find item across all brands
            let foundItem = null;
            for (const b of brands) {
                const mi = (b.menu || []).find(m => m.id === itemId);
                if (mi) { foundItem = mi; break; }
            }
            if (foundItem) openCustomizationModal(foundItem, brandId);
            break;
        }
        case 'closeCustomModal':
            closeCustomizationModal();
            break;
        case 'confirmAddToCart': {
            const { customizationModal, brands } = State.getState();
            if (!customizationModal) break;
            const { item, brandId } = customizationModal;
            // Collect selected add-ons
            const selectedAddOns = [];
            let totalAddon = 0;
            document.querySelectorAll('#custom-modal-box input[type=checkbox]').forEach(cb => {
                if (cb.checked) {
                    const name = cb.getAttribute('data-addon-name');
                    const price = parseInt(cb.getAttribute('data-addon-price'), 10) || 0;
                    selectedAddOns.push({ name, price });
                    totalAddon += price;
                }
            });
            addToCart(item, brandId, selectedAddOns);
            closeCustomizationModal();
            State.setState({ cartOpen: true });
            renderApp();
            showToast(`${item.emoji} ${item.name} added!`, 'success');
            break;
        }

        // ---- INVENTORY ----
        case 'invSetTab':
            State.setState({ inventoryTab: dataset.tab });
            renderApp();
            break;

        case 'invAddCategory': {
            const name = document.getElementById('inv-cat-name')?.value.trim();
            if (!name) { showToast('Category name is required.', 'error'); return; }
            addInventoryCategory(name)
                .then(() => { showToast(`Category "${name}" added!`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }
        case 'invDeleteCategory':
            deleteInventoryCategory(dataset.id)
                .then(() => { showToast('Category deleted.', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'invAddUnit': {
            const name = document.getElementById('inv-unit-name')?.value.trim();
            const abbr = document.getElementById('inv-unit-abbr')?.value.trim();
            if (!name || !abbr) { showToast('Unit name and abbreviation required.', 'error'); return; }
            addInventoryUnit(name, abbr)
                .then(() => { showToast(`Unit "${name} (${abbr})" added!`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }
        case 'invDeleteUnit':
            deleteInventoryUnit(dataset.id)
                .then(() => { showToast('Unit deleted.', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'invAddMaterial': {
            const name = document.getElementById('rm-name')?.value.trim();
            const catSel = document.getElementById('rm-cat');
            const unitSel = document.getElementById('rm-unit');
            const costPerUnit = parseFloat(document.getElementById('rm-cost')?.value) || 0;
            const qty = parseFloat(document.getElementById('rm-qty')?.value) || 0;
            const lowStockAlert = parseInt(document.getElementById('rm-alert')?.value, 10) || 5;
            if (!name) { showToast('Item name is required.', 'error'); return; }
            if (!catSel?.value) { showToast('Please select a category.', 'error'); return; }
            if (!unitSel?.value) { showToast('Please select a unit.', 'error'); return; }
            const categoryName = catSel.options[catSel.selectedIndex]?.getAttribute('data-name') || '';
            const unitAbbr = unitSel.options[unitSel.selectedIndex]?.getAttribute('data-abbr') || '';
            addRawMaterial({ name, categoryId: catSel.value, categoryName, unitId: unitSel.value, unitAbbr, costPerUnit, qty, lowStockAlert })
                .then(() => { showToast(`${name} added to stock!`, 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }
        case 'invDeleteMaterial':
            if (!confirm('Delete this raw material? This cannot be undone.')) return;
            deleteRawMaterial(dataset.id)
                .then(() => { showToast('Item deleted.', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;

        case 'invAdjustQty': {
            const delta = parseInt(dataset.delta, 10);
            adjustRawMaterialQty(dataset.id, delta)
                .then(() => renderApp())
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'invSaveRecipe': {
            const sel = document.getElementById('rec-item');
            const menuItemId = sel?.value;
            const brandId = sel?.options[sel.selectedIndex]?.getAttribute('data-brand');
            const menuItemName = sel?.options[sel.selectedIndex]?.getAttribute('data-name') || '';
            if (!menuItemId) { showToast('Please select a menu item.', 'error'); return; }

            const ingredients = [];
            let rowIdx = 1;
            while (document.getElementById(`rec-rm-${rowIdx}`)) {
                const rmSel = document.getElementById(`rec-rm-${rowIdx}`);
                const qtyEl = document.getElementById(`rec-qty-${rowIdx}`);
                const rmId = rmSel?.value;
                const qty = parseFloat(qtyEl?.value) || 0;
                if (rmId && qty > 0) {
                    const opt = rmSel.options[rmSel.selectedIndex];
                    ingredients.push({
                        rawMaterialId: rmId,
                        name: opt?.getAttribute('data-name') || '',
                        unitAbbr: opt?.getAttribute('data-abbr') || '',
                        qty,
                    });
                }
                rowIdx++;
            }
            if (ingredients.length === 0) { showToast('Add at least one ingredient.', 'error'); return; }
            saveRecipe(menuItemId, brandId, menuItemName, ingredients)
                .then(() => { showToast('Recipe saved! 🍳', 'success'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
        }

        case 'invDeleteRecipe':
            if (!confirm('Delete this recipe?')) return;
            deleteRecipe(dataset.id)
                .then(() => { showToast('Recipe deleted.', 'info'); renderApp(); })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            break;
    }
}

// Live stock value preview on the Add Material form
document.addEventListener('input', function(e) {
    if (['rm-cost', 'rm-qty'].includes(e.target.id)) {
        const cost = parseFloat(document.getElementById('rm-cost')?.value) || 0;
        const qty = parseFloat(document.getElementById('rm-qty')?.value) || 0;
        const preview = document.getElementById('rm-value-preview');
        if (preview) preview.textContent = `₹${(cost * qty).toLocaleString('en-IN')}`;
    }
});


// ===== FIREBASE REAL-TIME LISTENERS =====

// Track previous order statuses for push notifications
let _prevOrderStatuses = {};

// 1. Brands (Firestore admin-created brands merged with static defaults)
DB.collection('brands').onSnapshot(snapshot => {
    const firestoreBrands = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, _fromFirestore: true }));
    // Merge: start with static BRANDS, add Firestore brands (override if same ID)
    const staticIds = new Set(BRANDS.map(b => b.id));
    const merged = [...BRANDS, ...firestoreBrands.filter(b => !staticIds.has(b.id))];
    State.setState({ brands: merged });
    const { currentPage, adminTab } = State.getState();
    if (currentPage === 'home' || (currentPage === 'admin' && adminTab === 'brands')) renderApp();
});

// 2. Promo Codes
DB.collection('promoCodes').onSnapshot(snapshot => {
    const promoCodes = {};
    snapshot.docs.forEach(doc => { promoCodes[doc.id] = doc.data(); });
    State.setState({ promoCodes });
    const { currentPage, adminTab } = State.getState();
    if (currentPage === 'admin' && adminTab === 'promos') renderApp();
});

// 3. Orders (real-time sync + push notification detection)
DB.collection('orders').onSnapshot(snapshot => {
    const orders = snapshot.docs.map(doc => {
        const d = doc.data();
        return { ...d, id: doc.id, placedAt: d.placedAt?.toDate() || new Date(), acceptedAt: d.acceptedAt?.toDate() || null, timerEnd: d.timerEnd?.toDate() || null };
    }).sort((a, b) => b.placedAt - a.placedAt);

    // Push + in-app notifications for status changes
    const { user } = State.getState();
    const msgs = {
        accepted: '👨‍🍳 Kitchen is preparing your order!',
        ready: '✅ Your food is ready for delivery!',
        dispatched: '🛵 Your order is on the way!',
        delivered: '🎉 Your order has been delivered!'
    };
    if (user) {
        orders.forEach(order => {
            if (order.customerId === user.uid) {
                const prev = _prevOrderStatuses[order.id];
                if (prev && prev !== order.status && msgs[order.status]) {
                    // In-app notification
                    addNotification(`Order #${order.id.slice(-5)}: ${msgs[order.status]}`, order.status);
                    // System push
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('EatClub Update 🍽️', { body: msgs[order.status] });
                    }
                }
                _prevOrderStatuses[order.id] = order.status;
            }
        });
    }
    // Seed _prevOrderStatuses on first load (no notification)
    if (Object.keys(_prevOrderStatuses).length === 0) {
        orders.forEach(o => { _prevOrderStatuses[o.id] = o.status; });
    }

    State.setState({ orders });
    const { currentPage } = State.getState();
    if (['admin', 'tracking', 'orderHistory'].includes(currentPage)) renderApp();
});

// 4. Inventory Collections
DB.collection('inventoryCategories').onSnapshot(snap => {
    State.setState({ inventoryCategories: snap.docs.map(d => ({...d.data(), id: d.id})) });
    if (State.getState().adminTab === 'inventory') renderApp();
});
DB.collection('inventoryUnits').onSnapshot(snap => {
    State.setState({ inventoryUnits: snap.docs.map(d => ({...d.data(), id: d.id})) });
    if (State.getState().adminTab === 'inventory') renderApp();
});
DB.collection('rawMaterials').onSnapshot(snap => {
    State.setState({ rawMaterials: snap.docs.map(d => ({...d.data(), id: d.id})) });
    if (State.getState().adminTab === 'inventory') renderApp();
});
DB.collection('recipes').onSnapshot(snap => {
    State.setState({ recipes: snap.docs.map(d => ({...d.data(), id: d.id})) });
    if (State.getState().adminTab === 'inventory') renderApp();
});
DB.collection('inventoryLogs').orderBy('timestamp', 'desc').limit(50).onSnapshot(snap => {
    State.setState({ inventoryLogs: snap.docs.map(d => ({...d.data(), id: d.id})) });
    if (State.getState().adminTab === 'inventory') renderApp();
});

// 5. Auth state persistence
AUTH.onAuthStateChanged(async firebaseUser => {
    if (firebaseUser) {
        try {
            const doc = await DB.collection('users').doc(firebaseUser.uid).get();
            State.setState({ user: doc.exists ? doc.data() : null, authLoading: false });
        } catch (_) { State.setState({ user: null, authLoading: false }); }
    } else {
        State.setState({ user: null, authLoading: false });
    }
    renderApp();
});
