// ===== APPLICATION STATE =====
// Global state object (reactive via simple pub/sub)

const State = (() => {
    let _state = {
        user: null,           // { name, email, role: 'customer'|'admin' }
        cart: [],             // [{ item, qty, brandId }]
        orders: [],           // see placeOrder()
        currentPage: 'home',  // 'home'|'brand'|'checkout'|'tracking'|'admin'
        currentBrandId: null,
        currentOrderId: null,
        loginModalOpen: false,
        cartOpen: false,
    };

    const _listeners = [];

    function getState() { return _state; }

    function setState(updates) {
        _state = { ..._state, ...updates };
        _listeners.forEach(fn => fn(_state));
    }

    function subscribe(fn) { _listeners.push(fn); }

    return { getState, setState, subscribe };
})();

// ===== AUTH =====
const ACCOUNTS = [
    { email: 'customer@test.com', password: 'password', name: 'Alex Kumar', role: 'customer' },
    { email: 'admin@test.com', password: 'password', name: 'Admin Panel', role: 'admin' },
];

function login(email, password) {
    const acc = ACCOUNTS.find(a => a.email === email && a.password === password);
    if (!acc) return false;
    State.setState({ user: acc, loginModalOpen: false });
    return acc;
}

function logout() {
    State.setState({ user: null, currentPage: 'home', cart: [] });
}

// ===== CART =====
function addToCart(item, brandId) {
    const { cart } = State.getState();
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
        State.setState({ cart: cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c) });
    } else {
        State.setState({ cart: [...cart, { item, qty: 1, brandId }] });
    }
}

function removeFromCart(itemId) {
    const { cart } = State.getState();
    const existing = cart.find(c => c.item.id === itemId);
    if (!existing) return;
    if (existing.qty === 1) {
        State.setState({ cart: cart.filter(c => c.item.id !== itemId) });
    } else {
        State.setState({ cart: cart.map(c => c.item.id === itemId ? { ...c, qty: c.qty - 1 } : c) });
    }
}

function clearCart() { State.setState({ cart: [] }); }

function cartTotal() {
    return State.getState().cart.reduce((s, c) => s + c.item.price * c.qty, 0);
}

function cartCount() {
    return State.getState().cart.reduce((s, c) => s + c.qty, 0);
}

// ===== ORDERS =====
let _orderId = 1000;

function placeOrder(customerInfo) {
    const { cart, user } = State.getState();
    if (!cart.length) return null;
    const brandId = cart[0].brandId;
    const brand = BRANDS.find(b => b.id === brandId);
    const order = {
        id: 'EC' + (++_orderId),
        brandId,
        brandName: brand ? brand.name : brandId,
        customer: { name: user ? user.name : customerInfo.name, phone: customerInfo.phone || '9876543210', address: customerInfo.address || '123, Demo Street' },
        items: cart.map(c => ({ ...c })),
        total: cartTotal(),
        status: 'received',   // received|accepted|ready|dispatched|delivered
        placedAt: new Date(),
        acceptedAt: null,
        timerEnd: null,       // Date when 10-min timer expires
        timerInterval: null,
    };
    State.setState({ orders: [...State.getState().orders, order] });
    clearCart();
    return order.id;
}

function updateOrderStatus(orderId, status) {
    const orders = State.getState().orders.map(o => {
        if (o.id !== orderId) return o;
        const updated = { ...o, status };
        if (status === 'accepted') {
            updated.acceptedAt = new Date();
            updated.timerEnd = new Date(Date.now() + 10 * 60 * 1000);
        }
        return updated;
    });
    State.setState({ orders });
}

function getOrder(orderId) {
    return State.getState().orders.find(o => o.id === orderId);
}

// ===== NAVIGATION =====
function navigate(page, params = {}) {
    State.setState({ currentPage: page, ...params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // renderApp is defined in app.js which loads after this file
    if (typeof renderApp === 'function') renderApp();
}

// ===== TOAST =====
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
