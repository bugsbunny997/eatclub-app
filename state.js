// ===== APPLICATION STATE =====

const State = (() => {
    let _state = {
        user: null,
        cart: [],
        orders: [],
        brands: [...BRANDS],
        promoCodes: {},
        appliedPromo: null,
        loyaltyRedemption: null,
        searchQuery: '',
        currentPage: 'home',
        currentBrandId: null,
        currentOrderId: null,
        loginModalOpen: false,
        cartOpen: false,
        adminTab: 'orders',        // 'orders'|'brands'|'promos'|'analytics'|'inventory'
        authLoading: true,
        notifications: [],
        notifOpen: false,
        customizationModal: null,
        // ---- INVENTORY ----
        inventoryCategories: [],   // [{ id, name }]
        inventoryUnits: [],        // [{ id, name, abbr }]
        rawMaterials: [],          // [{ id, name, categoryId, unitId, unitAbbr, costPerUnit, qty, lowStockAlert }]
        recipes: [],               // [{ id, menuItemId, brandId, name, ingredients:[{rawMaterialId,name,qty,unitAbbr}] }]
        inventoryLogs: [],         // [{ id, orderId, type, timestamp, changes }]
        inventoryTab: 'stock',     // 'configure'|'stock'|'recipes'|'logs'
        // ---- SETTINGS / BUSINESS HOURS ----
        settings: null,            // { businessHours: {mon:{open,close,closed},...}, storeOpen: true }
        // ---- QR MODAL ----
        qrModalBrandId: null,      // brand id for which QR is shown
        // ---- PAYMENT ----
        selectedPaymentMethod: 'cod', // 'cod' | 'online'
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

function getBrands() { return State.getState().brands; }

// ===== AUTH (Firebase) =====
function login(email, password) {
    return AUTH.signInWithEmailAndPassword(email, password)
        .then(cred => DB.collection('users').doc(cred.user.uid).get())
        .then(doc => {
            const userData = doc.exists ? doc.data() : null;
            if (!userData) throw new Error('User profile missing.');
            State.setState({ user: userData, loginModalOpen: false });
            return userData;
        });
}

function logout() {
    return AUTH.signOut().then(() => {
        State.setState({ user: null, currentPage: 'home', cart: [], appliedPromo: null, loyaltyRedemption: null, searchQuery: '', notifications: [], notifOpen: false });
    });
}

function registerAccount(name, email, password) {
    return AUTH.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            const userData = { name, email, role: 'customer', uid: cred.user.uid, phone: '', savedAddress: '', addresses: [], loyaltyPoints: 0 };
            return DB.collection('users').doc(cred.user.uid).set(userData).then(() => userData);
        })
        .then(userData => {
            State.setState({ user: userData, loginModalOpen: false });
            return userData;
        });
}

function updateUserProfile(updates) {
    const { user } = State.getState();
    if (!user) return Promise.reject('Not logged in');
    return DB.collection('users').doc(user.uid).update(updates).then(() => {
        State.setState({ user: { ...user, ...updates } });
    });
}

// ===== ADDRESS BOOK =====
function saveAddress(label, address) {
    const { user } = State.getState();
    if (!user) return Promise.reject('Not logged in');
    const addresses = [...(user.addresses || []), { id: Date.now().toString(), label, address }];
    return updateUserProfile({ addresses });
}

function removeAddress(id) {
    const { user } = State.getState();
    if (!user) return Promise.reject('Not logged in');
    const addresses = (user.addresses || []).filter(a => a.id !== id);
    return updateUserProfile({ addresses });
}

// ===== CART =====
function addToCart(item, brandId, addOns = []) {
    const { cart } = State.getState();
    const effPrice = item.effectivePrice ?? item.price;
    const addOnTotal = addOns.reduce((s, a) => s + a.price, 0);
    const existingIdx = cart.findIndex(c => c.item.id === item.id && JSON.stringify(c.addOns) === JSON.stringify(addOns));
    if (existingIdx >= 0) {
        const newCart = [...cart];
        newCart[existingIdx] = { ...newCart[existingIdx], qty: newCart[existingIdx].qty + 1 };
        State.setState({ cart: newCart });
    } else {
        State.setState({ cart: [...cart, { item: { ...item, price: effPrice }, qty: 1, brandId, addOns, addOnTotal }] });
    }
}

function removeFromCart(itemId, addOnsSig) {
    const { cart } = State.getState();
    const idx = cart.findIndex(c => c.item.id === itemId && (addOnsSig === undefined || JSON.stringify(c.addOns) === addOnsSig));
    if (idx < 0) return;
    if (cart[idx].qty === 1) {
        State.setState({ cart: cart.filter((_, i) => i !== idx) });
    } else {
        const newCart = [...cart];
        newCart[idx] = { ...newCart[idx], qty: newCart[idx].qty - 1 };
        State.setState({ cart: newCart });
    }
}

function clearCart() { State.setState({ cart: [] }); }
function cartTotal() { return State.getState().cart.reduce((s, c) => s + (c.item.price + (c.addOnTotal || 0)) * c.qty, 0); }
function cartCount() { return State.getState().cart.reduce((s, c) => s + c.qty, 0); }

// ===== LOYALTY POINTS =====
function earnLoyaltyPoints(orderTotal) {
    const { user } = State.getState();
    if (!user || user.role === 'admin') return Promise.resolve();
    const earned = Math.floor(orderTotal / 10);
    if (!earned) return Promise.resolve();
    const newPoints = (user.loyaltyPoints || 0) + earned;
    return DB.collection('users').doc(user.uid).update({ loyaltyPoints: newPoints }).then(() => {
        State.setState({ user: { ...user, loyaltyPoints: newPoints } });
    });
}

function redeemLoyaltyPoints(points) {
    const { user } = State.getState();
    if (!user) return;
    const available = user.loyaltyPoints || 0;
    const toRedeem = Math.min(points, available);
    const value = Math.floor(toRedeem / 100) * 10; // 100 pts = ₹10
    if (value <= 0) return;
    State.setState({ loyaltyRedemption: { points: toRedeem, value } });
}

function cancelLoyaltyRedemption() {
    State.setState({ loyaltyRedemption: null });
}

// ===== PROMO CODES =====
function applyPromoCode(code) {
    const { promoCodes, user } = State.getState();
    const promo = promoCodes[code.toUpperCase()];
    if (!promo) return { error: 'Promo code not found.' };
    if (!promo.active) return { error: 'This promo code is no longer active.' };
    const total = cartTotal();
    if (promo.minOrder && total < promo.minOrder) {
        return { error: `Minimum order of ₹${promo.minOrder} required for this code.` };
    }
    // Per-user promo limit: check promoUsage collection
    if (user && promo.maxUsesPerUser) {
        return DB.collection('promoUsage')
            .where('userId', '==', user.uid)
            .where('code', '==', code.toUpperCase())
            .get()
            .then(snap => {
                if (snap.size >= (promo.maxUsesPerUser || 1)) {
                    return { error: 'You have already used this promo code.' };
                }
                State.setState({ appliedPromo: { code: code.toUpperCase(), discount: promo.discount } });
                return { success: true, discount: promo.discount };
            });
    }
    State.setState({ appliedPromo: { code: code.toUpperCase(), discount: promo.discount } });
    return { success: true, discount: promo.discount };
}

// Track promo usage in Firestore after order is placed
function recordPromoUsage(code, orderId) {
    const { user } = State.getState();
    if (!user || !code) return Promise.resolve();
    return DB.collection('promoUsage').add({
        userId: user.uid, code, orderId, usedAt: firebase.firestore.Timestamp.now()
    }).then(() =>
        // Increment global uses counter
        DB.collection('promoCodes').doc(code).update({ uses: firebase.firestore.FieldValue.increment(1) })
    ).catch(() => {}); // non-critical
}

function removePromoCode() { State.setState({ appliedPromo: null }); }

function cartGrandTotal() {
    const subtotal = cartTotal();
    const { appliedPromo, loyaltyRedemption } = State.getState();
    const promoDiscount = appliedPromo ? Math.round(subtotal * appliedPromo.discount / 100) : 0;
    const loyaltyDiscount = loyaltyRedemption ? loyaltyRedemption.value : 0;
    const discount = promoDiscount + loyaltyDiscount;
    const deliveryFee = 39;
    const tax = Math.round(Math.max(0, subtotal - discount) * 0.05);
    return { subtotal, promoDiscount, loyaltyDiscount, discount, deliveryFee, tax, grand: Math.max(0, subtotal - discount) + deliveryFee + tax };
}

// ===== ORDERS (Firestore) =====
function placeOrder(customerInfo) {
    const { cart, user, appliedPromo, loyaltyRedemption, selectedPaymentMethod } = State.getState();
    if (!cart.length) return Promise.resolve(null);
    const brandId = cart[0].brandId;
    const brand = getBrands().find(b => b.id === brandId);
    const orderId = 'EC' + Date.now();
    const now = new Date();
    const totals = cartGrandTotal();

    const localOrder = {
        id: orderId,
        brandId,
        brandName: brand ? brand.name : brandId,
        customerId: user ? user.uid : null,
        customer: {
            name: user ? user.name : customerInfo.name,
            phone: customerInfo.phone || user?.phone || '9876543210',
            address: customerInfo.address || user?.savedAddress || '123, Demo Street',
        },
        items: cart.map(c => ({ ...c })),
        subtotal: totals.subtotal,
        promoDiscount: totals.promoDiscount,
        loyaltyDiscount: totals.loyaltyDiscount,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        tax: totals.tax,
        total: totals.grand,
        promoCode: appliedPromo ? appliedPromo.code : null,
        loyaltyPointsUsed: loyaltyRedemption ? loyaltyRedemption.points : 0,
        status: 'received',
        placedAt: now,
        acceptedAt: null,
        timerEnd: null,
        rated: false,
        scheduledFor: customerInfo.scheduledFor || null,
        paymentMethod: selectedPaymentMethod || 'cod',
        paymentId: customerInfo.paymentId || null,
    };

    State.setState({ orders: [...State.getState().orders, localOrder] });
    clearCart();
    removePromoCode();
    cancelLoyaltyRedemption();

    // Deduct redeemed points & earn new ones
    if (loyaltyRedemption && user) {
        const remainingPts = Math.max(0, (user.loyaltyPoints || 0) - loyaltyRedemption.points);
        DB.collection('users').doc(user.uid).update({ loyaltyPoints: remainingPts }).then(() => {
            const updatedUser = { ...State.getState().user, loyaltyPoints: remainingPts };
            State.setState({ user: updatedUser });
            earnLoyaltyPoints(totals.grand);
        });
    } else {
        earnLoyaltyPoints(totals.grand);
    }

    const firestoreOrder = {
        ...localOrder,
        placedAt: firebase.firestore.Timestamp.fromDate(now),
        acceptedAt: null,
        timerEnd: null,
    };
    return DB.collection('orders').doc(orderId).set(firestoreOrder).then(() => {
        // Track promo usage per-user (non-blocking)
        if (appliedPromo) recordPromoUsage(appliedPromo.code, orderId);
        return orderId;
    });
}

function updateOrderStatus(orderId, status) {
    const firestoreUpdate = { status };
    let localUpdates = { status };

    if (status === 'accepted') {
        const acceptedAt = new Date();
        const timerEnd = new Date(Date.now() + 10 * 60 * 1000);
        firestoreUpdate.acceptedAt = firebase.firestore.Timestamp.fromDate(acceptedAt);
        firestoreUpdate.timerEnd = firebase.firestore.Timestamp.fromDate(timerEnd);
        localUpdates = { ...localUpdates, acceptedAt, timerEnd };
    }
    const orders = State.getState().orders.map(o =>
        o.id !== orderId ? o : { ...o, ...localUpdates }
    );
    State.setState({ orders });
    return DB.collection('orders').doc(orderId).update(firestoreUpdate);
}

function getOrder(orderId) { return State.getState().orders.find(o => o.id === orderId); }

// ===== NOTIFICATIONS =====
function addNotification(message, orderId) {
    const { notifications } = State.getState();
    const notif = { id: Date.now().toString(), message, orderId, read: false, time: new Date() };
    State.setState({ notifications: [notif, ...notifications].slice(0, 20) });
}

function markAllNotifsRead() {
    const { notifications } = State.getState();
    State.setState({ notifications: notifications.map(n => ({ ...n, read: true })) });
}

// ===== RATINGS =====
function submitRating(orderId, brandId, stars, comment) {
    const { user } = State.getState();
    const rating = {
        orderId, brandId,
        customerId: user ? user.uid : null,
        customerName: user ? user.name : 'Anonymous',
        stars, comment,
        createdAt: firebase.firestore.Timestamp.now(),
    };
    DB.collection('orders').doc(orderId).update({ rated: true });
    return DB.collection('ratings').doc(orderId).set(rating).then(() => {
        const orders = State.getState().orders.map(o =>
            o.id !== orderId ? o : { ...o, rated: true }
        );
        State.setState({ orders });
    });
}

// ===== ITEM CUSTOMIZATION MODAL =====
function openCustomizationModal(item, brandId) {
    State.setState({ customizationModal: { item, brandId } });
    renderApp();
}
function closeCustomizationModal() {
    State.setState({ customizationModal: null });
    renderApp();
}

// ===== ADMIN: BRANDS =====
function ensureBrandInFirestore(brandId) {
    return DB.collection('brands').doc(brandId).get().then(doc => {
        if (!doc.exists) {
            const staticBrand = BRANDS.find(b => b.id === brandId);
            if (staticBrand) return DB.collection('brands').doc(brandId).set({ ...staticBrand, _fromFirestore: true });
        }
    });
}

function addBrandToFirestore(brandData) {
    const id = brandData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const brand = { ...brandData, id, rating: '4.5', menu: [], _fromFirestore: true };
    return DB.collection('brands').doc(id).set(brand);
}

function updateBrandInfo(brandId, updates) {
    return ensureBrandInFirestore(brandId).then(() =>
        DB.collection('brands').doc(brandId).update(updates)
    );
}

function deleteBrand(brandId) {
    return ensureBrandInFirestore(brandId)
        .then(() => DB.collection('brands').doc(brandId).update({ _deleted: true }))
        .then(() => State.setState({ brands: getBrands().filter(b => b.id !== brandId) }));
}

function addCategory(brandId, category) {
    return ensureBrandInFirestore(brandId).then(() =>
        DB.collection('brands').doc(brandId).update({
            categories: firebase.firestore.FieldValue.arrayUnion(category),
            tags: firebase.firestore.FieldValue.arrayUnion(category),
        })
    );
}

function removeCategory(brandId, category) {
    return ensureBrandInFirestore(brandId).then(() => {
        const brand = getBrands().find(b => b.id === brandId);
        const newMenu = (brand?.menu || []).filter(i => i.category !== category);
        const newCats = (brand?.categories || []).filter(c => c !== category);
        return DB.collection('brands').doc(brandId).update({ categories: newCats, tags: newCats, menu: newMenu });
    });
}

function addMenuItem(brandId, item) {
    const itemWithId = { ...item, id: brandId.slice(0, 3) + Date.now() };
    return ensureBrandInFirestore(brandId).then(() =>
        DB.collection('brands').doc(brandId).update({
            menu: firebase.firestore.FieldValue.arrayUnion(itemWithId)
        })
    );
}

function removeMenuItem(brandId, itemId) {
    return ensureBrandInFirestore(brandId).then(() => {
        const brand = getBrands().find(b => b.id === brandId);
        const newMenu = (brand?.menu || []).filter(i => i.id !== itemId);
        return DB.collection('brands').doc(brandId).update({ menu: newMenu });
    });
}

// Toggle out-of-stock on a menu item
function toggleItemStock(brandId, itemId, outOfStock) {
    return ensureBrandInFirestore(brandId).then(() => {
        const brand = getBrands().find(b => b.id === brandId);
        const newMenu = (brand?.menu || []).map(i =>
            i.id !== itemId ? i : { ...i, outOfStock }
        );
        return DB.collection('brands').doc(brandId).update({ menu: newMenu });
    });
}

// Set flash sale on an item
function setFlashSale(brandId, itemId, discountPct, durationMinutes) {
    return ensureBrandInFirestore(brandId).then(() => {
        const brand = getBrands().find(b => b.id === brandId);
        const flashSaleEnd = new Date(Date.now() + durationMinutes * 60 * 1000);
        const newMenu = (brand?.menu || []).map(i => {
            if (i.id !== itemId) return i;
            const salePrice = Math.round(i.price * (1 - discountPct / 100));
            return { ...i, flashSaleDiscount: discountPct, flashSaleEnd: flashSaleEnd.toISOString(), effectivePrice: salePrice };
        });
        return DB.collection('brands').doc(brandId).update({ menu: newMenu });
    });
}

// ===== ADMIN: PROMO CODES =====
function createPromoCode(code, discount, minOrder) {
    const promoData = { code: code.toUpperCase(), discount: Number(discount), minOrder: Number(minOrder) || 0, active: true, createdAt: firebase.firestore.Timestamp.now(), uses: 0 };
    return DB.collection('promoCodes').doc(code.toUpperCase()).set(promoData);
}

function togglePromoCode(code, active) {
    return DB.collection('promoCodes').doc(code).update({ active });
}

function deletePromoCode(code) {
    return DB.collection('promoCodes').doc(code).delete();
}

// ===== PUSH NOTIFICATIONS =====
function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    return Notification.requestPermission();
}

function _tryShowNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
}

// ===== NAVIGATION =====
function navigate(page, params = {}) {
    State.setState({ currentPage: page, ...params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ===================================================
// ===== INVENTORY MANAGEMENT =====
// ===================================================

// ---- CATEGORIES ----
function addInventoryCategory(name) {
    const id = 'cat_' + Date.now();
    return DB.collection('inventoryCategories').doc(id).set({ id, name: name.trim() });
}
function deleteInventoryCategory(id) {
    return DB.collection('inventoryCategories').doc(id).delete();
}

// ---- UNITS ----
function addInventoryUnit(name, abbr) {
    const id = 'unit_' + Date.now();
    return DB.collection('inventoryUnits').doc(id).set({ id, name: name.trim(), abbr: abbr.trim() });
}
function deleteInventoryUnit(id) {
    return DB.collection('inventoryUnits').doc(id).delete();
}

// ---- RAW MATERIALS ----
function addRawMaterial(data) {
    // data: { name, categoryId, categoryName, unitId, unitAbbr, costPerUnit, qty, lowStockAlert }
    const id = 'rm_' + Date.now();
    const material = {
        id,
        name: data.name.trim(),
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        unitId: data.unitId,
        unitAbbr: data.unitAbbr,
        costPerUnit: Number(data.costPerUnit) || 0,
        qty: Number(data.qty) || 0,
        lowStockAlert: Number(data.lowStockAlert) || 5,
    };
    return DB.collection('rawMaterials').doc(id).set(material);
}

function adjustRawMaterialQty(id, delta) {
    // delta can be positive (stock in) or negative (use)
    const { rawMaterials } = State.getState();
    const rm = rawMaterials.find(r => r.id === id);
    if (!rm) return Promise.reject('Not found');
    const newQty = Math.max(0, (rm.qty || 0) + delta);
    return DB.collection('rawMaterials').doc(id).update({ qty: newQty });
}

function setRawMaterialQty(id, qty) {
    return DB.collection('rawMaterials').doc(id).update({ qty: Math.max(0, Number(qty)) });
}

function deleteRawMaterial(id) {
    return DB.collection('rawMaterials').doc(id).delete();
}

// ---- RECIPES ----
function saveRecipe(menuItemId, brandId, menuItemName, ingredients) {
    // ingredients: [{ rawMaterialId, name, qty, unitAbbr }]
    // Check if recipe for this item already exists
    const { recipes } = State.getState();
    const existing = recipes.find(r => r.menuItemId === menuItemId && r.brandId === brandId);
    const data = { menuItemId, brandId, menuItemName, ingredients, updatedAt: new Date().toISOString() };
    if (existing) {
        return DB.collection('recipes').doc(existing.id).update(data);
    } else {
        const id = 'rec_' + Date.now();
        return DB.collection('recipes').doc(id).set({ id, ...data });
    }
}

function deleteRecipe(id) {
    return DB.collection('recipes').doc(id).delete();
}

// ---- AUTO-DEDUCTION ----
function deductInventoryForOrder(order) {
    const { recipes, rawMaterials } = State.getState();
    const changes = [];
    const updates = {}; // rawMaterialId -> newQty

    order.items.forEach(cartItem => {
        const recipe = recipes.find(r => r.menuItemId === cartItem.item.id && r.brandId === (order.brandId || cartItem.brandId || ''));
        if (!recipe) return;
        recipe.ingredients.forEach(ing => {
            const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
            if (!rm) return;
            const used = ing.qty * (cartItem.qty || 1);
            const currentQty = updates[rm.id] !== undefined ? updates[rm.id] : rm.qty;
            const newQty = Math.max(0, currentQty - used);
            updates[rm.id] = newQty;
            changes.push({ rawMaterialId: rm.id, name: rm.name, unitAbbr: rm.unitAbbr, used, newQty });
        });
    });

    if (changes.length === 0) return Promise.resolve();

    // Batch update Firestore
    const batch = DB.batch();
    Object.entries(updates).forEach(([rmId, newQty]) => {
        batch.update(DB.collection('rawMaterials').doc(rmId), { qty: newQty });
    });

    // Write log
    const logId = 'log_' + Date.now();
    batch.set(DB.collection('inventoryLogs').doc(logId), {
        id: logId,
        orderId: order.id,
        type: 'order_deduction',
        timestamp: firebase.firestore.Timestamp.now(),
        changes,
        orderTotal: order.total,
    });

    return batch.commit().then(() => {
        // Check for low-stock alerts
        const { rawMaterials: updatedMaterials } = State.getState();
        changes.forEach(c => {
            const rm = updatedMaterials.find(r => r.id === c.rawMaterialId);
            if (rm && c.newQty <= rm.lowStockAlert) {
                addNotification(`⚠️ Low stock: ${rm.name} — only ${c.newQty} ${rm.unitAbbr} left!`, 'warning');
            }
        });
    });
}

// ===================================================
// ===== ORDER CANCELLATION =====
// ===================================================

function cancelOrder(orderId, reason) {
    const { user } = State.getState();
    const now = firebase.firestore.Timestamp.now();
    const firestoreUpdate = {
        status: 'cancelled',
        cancelledAt: now,
        cancelReason: reason || 'Customer requested cancellation',
        cancelledBy: user ? user.uid : 'customer',
    };
    const orders = State.getState().orders.map(o =>
        o.id !== orderId ? o : { ...o, status: 'cancelled', cancelReason: reason }
    );
    State.setState({ orders });
    return DB.collection('orders').doc(orderId).update(firestoreUpdate);
}

function adminCancelOrder(orderId, reason) {
    const now = firebase.firestore.Timestamp.now();
    const firestoreUpdate = {
        status: 'cancelled',
        cancelledAt: now,
        cancelReason: reason || 'Cancelled by restaurant',
        cancelledBy: 'admin',
    };
    const orders = State.getState().orders.map(o =>
        o.id !== orderId ? o : { ...o, status: 'cancelled', cancelReason: reason }
    );
    State.setState({ orders });
    return DB.collection('orders').doc(orderId).update(firestoreUpdate);
}

// ===================================================
// ===== BUSINESS HOURS & SETTINGS =====
// ===================================================

const DEFAULT_HOURS = {
    mon: { open: '10:00', close: '22:00', closed: false },
    tue: { open: '10:00', close: '22:00', closed: false },
    wed: { open: '10:00', close: '22:00', closed: false },
    thu: { open: '10:00', close: '22:00', closed: false },
    fri: { open: '10:00', close: '23:00', closed: false },
    sat: { open: '10:00', close: '23:00', closed: false },
    sun: { open: '11:00', close: '22:00', closed: false },
};

function saveBusinessHours(hours) {
    return DB.collection('settings').doc('businessHours').set({ hours, updatedAt: firebase.firestore.Timestamp.now() })
        .then(() => {
            const { settings } = State.getState();
            State.setState({ settings: { ...(settings || {}), businessHours: hours } });
        });
}

function saveStoreStatus(isOpen) {
    return DB.collection('settings').doc('storeStatus').set({ isOpen, updatedAt: firebase.firestore.Timestamp.now() })
        .then(() => {
            const { settings } = State.getState();
            State.setState({ settings: { ...(settings || {}), storeOpen: isOpen } });
        });
}

function isStoreCurrentlyOpen() {
    const { settings } = State.getState();
    if (!settings) return true; // Default open if no settings
    if (settings.storeOpen === false) return false;
    if (!settings.businessHours) return true;
    const now = new Date();
    const days = ['sun','mon','tue','wed','thu','fri','sat'];
    const day = days[now.getDay()];
    const todayHours = settings.businessHours[day];
    if (!todayHours || todayHours.closed) return false;
    const [oh, om] = (todayHours.open || '00:00').split(':').map(Number);
    const [ch, cm] = (todayHours.close || '23:59').split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    return nowMin >= openMin && nowMin < closeMin;
}

// ===================================================
// ===== IMAGE UPLOAD (Firebase Storage) =====
// ===================================================

function uploadMenuItemImage(brandId, itemId, file) {
    if (!window.firebase.storage) return Promise.reject('Firebase Storage not configured');
    const STORAGE = firebase.storage();
    const ref = STORAGE.ref(`menuItems/${brandId}/${itemId}_${Date.now()}.${file.name.split('.').pop()}`);
    return ref.put(file).then(snap => snap.ref.getDownloadURL());
}

// ---- MANUAL WASTE LOG ----
function logWaste(rawMaterialId, qty, reason) {
    const { rawMaterials } = State.getState();
    const rm = rawMaterials.find(r => r.id === rawMaterialId);
    if (!rm) return Promise.reject('Not found');
    const newQty = Math.max(0, rm.qty - qty);
    const logId = 'log_' + Date.now();
    const batch = DB.batch();
    batch.update(DB.collection('rawMaterials').doc(rawMaterialId), { qty: newQty });
    batch.set(DB.collection('inventoryLogs').doc(logId), {
        id: logId,
        type: 'waste',
        timestamp: firebase.firestore.Timestamp.now(),
        reason: reason || '',
        changes: [{ rawMaterialId, name: rm.name, unitAbbr: rm.unitAbbr, used: qty, newQty }],
    });
    return batch.commit();
}
