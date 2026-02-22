// ===== MAIN APP ENTRY POINT + EVENT DELEGATION =====

function renderApp() {
    const { currentPage, currentBrandId, currentOrderId, loginModalOpen, cartOpen, user } = State.getState();

    const app = document.getElementById('app');
    const modalRoot = document.getElementById('modal-root');

    // Route pages
    let pageHTML = '';
    if (user && user.role === 'admin' && currentPage !== 'home') {
        pageHTML = renderAdminDashboard();
    } else {
        switch (currentPage) {
            case 'brand': pageHTML = renderBrandPage(currentBrandId); break;
            case 'checkout': pageHTML = renderCheckoutPage(); break;
            case 'tracking': pageHTML = renderTrackingPage(currentOrderId); break;
            case 'admin': pageHTML = renderAdminDashboard(); break;
            default: pageHTML = renderHomePage(); break;
        }
    }
    app.innerHTML = pageHTML;

    // Overlays (separate from app so they don't get wiped)
    let overlayHTML = '';
    if (loginModalOpen) overlayHTML += renderLoginModal();
    if (cartOpen) overlayHTML += renderCartDrawer();
    modalRoot.innerHTML = overlayHTML;
}

// ===== CENTRALIZED EVENT DELEGATION =====
// Handles ALL user interactions via data-action attributes
document.addEventListener('click', function (e) {
    // Walk up the DOM tree to find a data-action handler
    let el = e.target;
    while (el && el !== document.body) {
        if (el.dataset && el.dataset.action) {
            handleAction(el.dataset.action, el.dataset, e);
            return;
        }
        el = el.parentElement;
    }
});

// Enter key support for login modal inputs
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.id === 'login-email' || activeEl.id === 'login-password')) {
            handleAction('doLogin', {}, e);
        }
    }
});

function handleAction(action, dataset, e) {
    switch (action) {

        // ----- NAVIGATION -----
        case 'goHome':
            if (typeof _adInterval !== 'undefined' && _adInterval) clearInterval(_adInterval);
            navigate('home');
            break;

        case 'goAdmin':
            navigate('admin');
            break;

        case 'goBrand':
            _selectedCategory = null;
            navigate('brand', { currentBrandId: dataset.brand });
            break;

        case 'goCheckout': {
            const { user } = State.getState();
            if (!user) {
                State.setState({ cartOpen: false, loginModalOpen: true });
                renderApp();
            } else {
                State.setState({ cartOpen: false });
                navigate('checkout');
            }
            break;
        }

        // ----- AUTH -----
        case 'openLogin':
            State.setState({ loginModalOpen: true });
            renderApp();
            break;

        case 'closeModal': {
            const box = document.getElementById('login-modal-box');
            if (box && box.contains(e.target)) return;
            State.setState({ loginModalOpen: false });
            renderApp();
            break;
        }

        case 'doLogin': {
            const emailEl = document.getElementById('login-email');
            const pwEl = document.getElementById('login-password');
            const errEl = document.getElementById('login-error');
            if (!emailEl || !pwEl) return;
            const acc = login(emailEl.value.trim(), pwEl.value);
            if (!acc) {
                if (errEl) { errEl.textContent = 'Invalid email or password.'; errEl.classList.remove('hidden'); }
                return;
            }
            showToast('Welcome back, ' + acc.name.split(' ')[0] + '! 🎉', 'success');
            if (acc.role === 'admin') {
                navigate('admin'); // navigate() calls renderApp() automatically
            } else {
                renderApp(); // re-render home with user logged in
            }
            break;
        }

        case 'logout':
            logout();
            renderApp();
            break;

        // ----- CART -----
        case 'openCart':
            State.setState({ cartOpen: true });
            renderApp();
            break;

        case 'closeCart':
            State.setState({ cartOpen: false });
            renderApp();
            break;

        case 'addItem': {
            const itemId = dataset.item;
            const brandId = dataset.brand || State.getState().currentBrandId;
            let found = null;
            for (const b of BRANDS) {
                found = b.menu.find(m => m.id === itemId);
                if (found) break;
            }
            if (found) { addToCart(found, brandId); renderApp(); }
            break;
        }

        case 'removeItem':
            removeFromCart(dataset.item);
            renderApp();
            break;

        // ----- CATEGORY TAB -----
        case 'setCat':
            _selectedCategory = dataset.cat;
            renderApp();
            break;

        // ----- CHECKOUT / ORDER -----
        case 'placeOrder': {
            const nameEl = document.getElementById('co-name');
            const phoneEl = document.getElementById('co-phone');
            const addrEl = document.getElementById('co-address');
            const cityEl = document.getElementById('co-city');
            const orderId = placeOrder({
                name: nameEl ? nameEl.value : '',
                phone: phoneEl ? phoneEl.value : '',
                address: [(addrEl && addrEl.value), (cityEl && cityEl.value)].filter(Boolean).join(', ')
            });
            if (orderId) {
                showToast('Order placed! 🎉', 'success');
                navigate('tracking', { currentOrderId: orderId });
            }
            break;
        }

        // ----- AD CAROUSEL -----
        case 'setAd': {
            _adIndex = parseInt(dataset.ad, 10) || 0;
            document.querySelectorAll('.ad-banner').forEach((b, i) => b.classList.toggle('visible', i === _adIndex));
            document.querySelectorAll('.ad-dot').forEach((d, i) => d.classList.toggle('active', i === _adIndex));
            break;
        }

        // ----- ADMIN ACTIONS -----
        case 'selectOrder':
            _selectedOrderId = dataset.order;
            renderApp();
            break;

        case 'adminAccept':
            updateOrderStatus(dataset.order, 'accepted');
            showToast('Order accepted! Timer started ⏱', 'success');
            renderApp();
            break;

        case 'adminReady':
            updateOrderStatus(dataset.order, 'ready');
            if (_timerIntervals && _timerIntervals[dataset.order]) {
                clearInterval(_timerIntervals[dataset.order]);
                delete _timerIntervals[dataset.order];
            }
            showToast('Food marked as ready! 🍽️', 'success');
            renderApp();
            break;

        case 'adminCallCustomer': {
            const o = getOrder(dataset.order);
            showToast('📞 Calling ' + (o && o.customer ? o.customer.name : 'Customer') + '...', 'info', 2500);
            break;
        }

        case 'adminCallDelivery':
            showToast('🛵 Calling Delivery Partner...', 'info', 2500);
            break;

        case 'adminDispatch':
            updateOrderStatus(dataset.order, 'dispatched');
            showToast('Order dispatched! 🛵', 'success');
            renderApp();
            break;

        case 'adminDelivered':
            updateOrderStatus(dataset.order, 'delivered');
            showToast('Order delivered! 🎉', 'success');
            renderApp();
            break;
    }
}

// Initial render on page load
renderApp();
