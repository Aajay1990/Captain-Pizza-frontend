import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CartDrawer.css';

/* ─── Addon Prices ────────────────────────────────────────────────── */
const AP = {
    ketchup: 1,
    veg: { small: 25, medium: 35, large: 45 },
    cheese: { small: 40, medium: 60, large: 90 },
    burst: { small: 50, medium: 60, large: 90 },
};

const VEG_TOPPINGS = [
    { id: 'tomato', name: 'Tomato' },
    { id: 'onion', name: 'Onion' },
    { id: 'corn', name: 'Sweet Corn' },
    { id: 'capsicum', name: 'Capsicum' },
];

/* ─── Size Chip ──────────────────────────────────────────────────── */
const SizeChip = ({ size, price, active, onClick }) => (
    <button
        className={`sz-chip ${active ? 'active' : ''}`}
        onClick={onClick}
        type="button"
    >
        <span className="sz-label">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
        <span className="sz-price">+₹{price}</span>
    </button>
);

/* ─── Inline Cart Customizer ─────────────────────────────────────── */
const CartCustomizer = ({ item, onSave, onClose }) => {
    const [ketchupQty, setKetchupQty] = useState(0);
    const [vegToppings, setVegToppings] = useState({});  // id → size
    const [cheese, setCheese] = useState(null); // size | null
    const [burst, setBurst] = useState(null); // size | null
    const [openSection, setOpenSection] = useState('ketchup');

    const toggle = (s) => setOpenSection(openSection === s ? null : s);

    const vegTotal = Object.values(vegToppings).reduce((a, sz) => a + AP.veg[sz], 0);
    const addonTotal = ketchupQty * AP.ketchup
        + vegTotal
        + (cheese ? AP.cheese[cheese] : 0)
        + (burst ? AP.burst[burst] : 0);

    const handleVegToggle = (id) => {
        setVegToppings(prev => {
            if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
            return { ...prev, [id]: 'medium' };
        });
    };

    const handleSave = () => {
        const toppings = [];
        if (ketchupQty > 0) toppings.push({ name: `Ketchup ×${ketchupQty}`, price: ketchupQty * AP.ketchup });
        Object.entries(vegToppings).forEach(([id, sz]) => {
            const t = VEG_TOPPINGS.find(x => x.id === id);
            if (t) toppings.push({ name: `${t.name} (${sz.charAt(0).toUpperCase()})`, price: AP.veg[sz] });
        });
        if (cheese) toppings.push({ name: `Extra Cheese (${cheese.charAt(0).toUpperCase()})`, price: AP.cheese[cheese] });
        if (burst) toppings.push({ name: `Cheese Burst (${burst.charAt(0).toUpperCase()})`, price: AP.burst[burst] });
        onSave({ toppings, addonTotal });
    };

    return (
        <div className="cart-cust">
            <div className="cart-cust-header">
                <span>🍕 Customize: <strong>{item.name}</strong></span>
                <button className="cust-x" onClick={onClose}>×</button>
            </div>

            {/* ── Ketchup ───────────────────────────── */}
            <div className="cust-section">
                <div className="cust-sec-title" onClick={() => toggle('ketchup')}>
                    <div>
                        <strong>Ketchup Packets</strong>
                        {ketchupQty > 0 && <span className="cust-badge">×{ketchupQty} +₹{ketchupQty}</span>}
                    </div>
                    <i className={`fas fa-chevron-${openSection === 'ketchup' ? 'up' : 'down'}`}></i>
                </div>
                {openSection === 'ketchup' && (
                    <div className="cust-body">
                        <p className="cust-hint">₹1 per packet — select quantity</p>
                        <div className="qty-row">
                            <button className="qty-btn" onClick={() => setKetchupQty(q => Math.max(0, q - 1))}>−</button>
                            <span className="qty-val">{ketchupQty}</span>
                            <button className="qty-btn plus" onClick={() => setKetchupQty(q => q + 1)}>+</button>
                            {ketchupQty > 0 && <span className="qty-price">+₹{ketchupQty}</span>}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Veg Toppings ──────────────────────── */}
            <div className="cust-section">
                <div className="cust-sec-title" onClick={() => toggle('veg')}>
                    <div>
                        <strong>Veg Toppings</strong>
                        {Object.keys(vegToppings).length > 0 && (
                            <span className="cust-badge">{Object.keys(vegToppings).length} added +₹{vegTotal}</span>
                        )}
                    </div>
                    <i className={`fas fa-chevron-${openSection === 'veg' ? 'up' : 'down'}`}></i>
                </div>
                {openSection === 'veg' && (
                    <div className="cust-body">
                        {VEG_TOPPINGS.map(t => (
                            <div key={t.id} className="topping-row">
                                <label className="topping-check">
                                    <input type="checkbox" checked={!!vegToppings[t.id]}
                                        onChange={() => handleVegToggle(t.id)} />
                                    <span>{t.name}</span>
                                    {vegToppings[t.id] && (
                                        <span className="cust-badge sm">+₹{AP.veg[vegToppings[t.id]]}</span>
                                    )}
                                </label>
                                {vegToppings[t.id] && (
                                    <div className="size-chips">
                                        {['small', 'medium', 'large'].map(sz => (
                                            <SizeChip key={sz} size={sz} price={AP.veg[sz]}
                                                active={vegToppings[t.id] === sz}
                                                onClick={() => setVegToppings(p => ({ ...p, [t.id]: sz }))} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Extra Cheese — direct size selection ─ */}
            <div className="cust-section">
                <div className="cust-sec-title" onClick={() => toggle('cheese')}>
                    <div>
                        <strong>Extra Cheese</strong>
                        {cheese && <span className="cust-badge">({cheese.charAt(0).toUpperCase()}) +₹{AP.cheese[cheese]}</span>}
                    </div>
                    <i className={`fas fa-chevron-${openSection === 'cheese' ? 'up' : 'down'}`}></i>
                </div>
                {openSection === 'cheese' && (
                    <div className="cust-body">
                        <p className="cust-hint">Tap a size to add — tap again to remove</p>
                        <div className="size-chips">
                            {['small', 'medium', 'large'].map(sz => (
                                <SizeChip key={sz} size={sz} price={AP.cheese[sz]}
                                    active={cheese === sz}
                                    onClick={() => setCheese(cheese === sz ? null : sz)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Cheese Burst — direct size selection ─ */}
            <div className="cust-section">
                <div className="cust-sec-title" onClick={() => toggle('burst')}>
                    <div>
                        <strong>Cheese Burst Crust</strong>
                        {burst && <span className="cust-badge">({burst.charAt(0).toUpperCase()}) +₹{AP.burst[burst]}</span>}
                    </div>
                    <i className={`fas fa-chevron-${openSection === 'burst' ? 'up' : 'down'}`}></i>
                </div>
                {openSection === 'burst' && (
                    <div className="cust-body">
                        <p className="cust-hint">Tap a size to add — tap again to remove</p>
                        <div className="size-chips">
                            {['small', 'medium', 'large'].map(sz => (
                                <SizeChip key={sz} size={sz} price={AP.burst[sz]}
                                    active={burst === sz}
                                    onClick={() => setBurst(burst === sz ? null : sz)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ───────────────────────────── */}
            <div className="cust-footer">
                {addonTotal > 0 && (
                    <div className="cust-addon-total">Add-ons: <strong>+₹{addonTotal}</strong></div>
                )}
                <div className="cust-footer-btns">
                    <button className="cust-cancel" onClick={onClose}>Cancel</button>
                    <button className="cust-apply" onClick={handleSave}>
                        Apply Add-Ons {addonTotal > 0 && `(+₹${addonTotal})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Cart Drawer ───────────────────────────────────────────── */
const CartDrawer = () => {
    const {
        cartItems, updateQuantity, isCartOpen, setIsCartOpen,
        cartCount, toggleAddon
    } = useContext(CartContext);

    const [customizingId, setCustomizingId] = useState(null);
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/order');
    };

    const handleSaveCust = (cartItemId, { toppings, addonTotal }) => {
        toppings.forEach(t => toggleAddon(cartItemId, t));
        setCustomizingId(null);
    };

    return (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="cart-head">
                    <div className="cart-head-left">
                        <i className="fas fa-shopping-basket"></i>
                        <h2>Your Cart <span className="cart-count-badge">{cartCount}</span></h2>
                    </div>
                    <button className="cart-close" onClick={() => setIsCartOpen(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <div className="cart-empty-icon">🛒</div>
                            <p>Your cart is empty</p>
                            <button
                                className="cart-browse-btn"
                                onClick={() => { setIsCartOpen(false); navigate('/menu'); }}
                            >
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map(item => (
                                <div key={item.cartItemId} className="cart-item-block">
                                    {/* Item Row */}
                                    <div className="cart-item-row">
                                        <div className="cart-item-info">
                                            <div className="cart-item-name">{item.name}</div>
                                            {item.toppings && item.toppings.length > 0 && (
                                                <div className="cart-item-addons">
                                                    {item.toppings.map((t, i) => (
                                                        <span key={i} className="addon-tag">+ {t.name || t}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="cart-item-price">₹{item.price} × {item.quantity} = <strong>₹{item.price * item.quantity}</strong></div>
                                        </div>
                                        <div className="cart-item-controls">
                                            <div className="cart-qty">
                                                <button onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                            </div>
                                            <button
                                                className={`addon-toggle-btn ${customizingId === item.cartItemId ? 'active' : ''}`}
                                                onClick={() => setCustomizingId(
                                                    customizingId === item.cartItemId ? null : item.cartItemId
                                                )}
                                            >
                                                <i className="fas fa-sliders-h"></i>
                                                {customizingId === item.cartItemId ? 'Close' : 'Add-Ons'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline Customizer */}
                                    {customizingId === item.cartItemId && (
                                        <CartCustomizer
                                            item={item}
                                            onSave={(data) => handleSaveCust(item.cartItemId, data)}
                                            onClose={() => setCustomizingId(null)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="cart-foot">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <strong>₹{subtotal}</strong>
                        </div>
                        <button className="cart-checkout-btn" onClick={handleCheckout}>
                            <i className="fas fa-lock"></i> Proceed to Checkout &nbsp;₹{subtotal}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
