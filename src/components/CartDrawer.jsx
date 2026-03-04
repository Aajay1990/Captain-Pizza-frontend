import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CartDrawer.css';

/* ─── Add-On Prices (mirrors POS) ─── */
const ADDON_PRICES = {
    veg: { small: 25, medium: 35, large: 45 },
    cheese: { small: 40, medium: 60, large: 90 },
    burst: { small: 50, medium: 60, large: 90 },
    ketchup: 1
};
const VEG_TOPPINGS = [
    { id: 'tomato', name: 'Tomato' },
    { id: 'onion', name: 'Onion' },
    { id: 'corn', name: 'Sweet Corn' },
    { id: 'capsicum', name: 'Capsicum' }
];

/* ─── Inline Customization Panel (shown inside cart) ─── */
const CartItemCustomizer = ({ item, onSave, onClose }) => {
    const [vegToppings, setVegToppings] = useState({});
    const [extraCheese, setExtraCheese] = useState(null);
    const [cheeseBurst, setCheeseBurst] = useState(null);
    const [ketchupEnabled, setKetchupEnabled] = useState(false);
    const [ketchupQty, setKetchupQty] = useState(1);
    const [expanded, setExpanded] = useState('ketchup');

    const toggleSection = (s) => setExpanded(expanded === s ? null : s);

    const handleVegToggle = (id) => {
        setVegToppings(prev => {
            const next = { ...prev };
            if (next[id]) delete next[id];
            else next[id] = 'medium';
            return next;
        });
    };

    const calculateAddonsTotal = () => {
        let t = 0;
        Object.values(vegToppings).forEach(sz => t += ADDON_PRICES.veg[sz]);
        if (extraCheese) t += ADDON_PRICES.cheese[extraCheese];
        if (cheeseBurst) t += ADDON_PRICES.burst[cheeseBurst];
        if (ketchupEnabled) t += ketchupQty * ADDON_PRICES.ketchup;
        return t;
    };

    const handleSave = () => {
        const formattedToppings = [];
        let addonsPrice = 0;
        Object.entries(vegToppings).forEach(([id, sz]) => {
            const name = VEG_TOPPINGS.find(t => t.id === id)?.name;
            if (name) {
                addonsPrice += ADDON_PRICES.veg[sz];
                formattedToppings.push({ name: `${name} (${sz.charAt(0).toUpperCase()})`, price: ADDON_PRICES.veg[sz] });
            }
        });
        if (extraCheese) {
            addonsPrice += ADDON_PRICES.cheese[extraCheese];
            formattedToppings.push({ name: `Extra Cheese (${extraCheese.charAt(0).toUpperCase()})`, price: ADDON_PRICES.cheese[extraCheese] });
        }
        if (cheeseBurst) {
            addonsPrice += ADDON_PRICES.burst[cheeseBurst];
            formattedToppings.push({ name: `Cheese Burst (${cheeseBurst.charAt(0).toUpperCase()})`, price: ADDON_PRICES.burst[cheeseBurst] });
        }
        if (ketchupEnabled) {
            addonsPrice += ketchupQty * ADDON_PRICES.ketchup;
            formattedToppings.push({ name: `Ketchup (x${ketchupQty})`, price: ketchupQty * ADDON_PRICES.ketchup });
        }
        onSave({ toppings: formattedToppings, addonsPrice });
    };

    const addonTotal = calculateAddonsTotal();
    const baseItem = item;

    return (
        <div className="cart-customizer">
            <div className="cust-header">
                <span>🍕 Customize: <strong>{item.name}</strong></span>
                <button onClick={onClose} className="cust-close-btn">&times;</button>
            </div>

            {/* Ketchup */}
            <div className="cust-accordion">
                <div className="cust-acc-header" onClick={() => toggleSection('ketchup')}>
                    <strong>Ketchup Packets</strong>
                    <span>{ketchupEnabled ? `✓ x${ketchupQty} +₹${ketchupQty}` : 'Not selected'}</span>
                    <i className={`fas fa-chevron-${expanded === 'ketchup' ? 'up' : 'down'}`}></i>
                </div>
                {expanded === 'ketchup' && (
                    <div className="cust-acc-body">
                        <label className="cust-check-row">
                            <input type="checkbox" checked={ketchupEnabled} onChange={e => setKetchupEnabled(e.target.checked)} />
                            <span>Include Ketchup (+₹1/packet)</span>
                        </label>
                        {ketchupEnabled && (
                            <div className="cust-qty-row">
                                <button onClick={() => setKetchupQty(q => Math.max(1, q - 1))}>-</button>
                                <span>{ketchupQty}</span>
                                <button onClick={() => setKetchupQty(q => q + 1)}>+</button>
                                <strong>+₹{ketchupQty}</strong>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Veg Toppings */}
            <div className="cust-accordion">
                <div className="cust-acc-header" onClick={() => toggleSection('veg')}>
                    <strong>Veg Toppings</strong>
                    <span>{Object.keys(vegToppings).length > 0 ? `✓ ${Object.keys(vegToppings).length} selected +₹${Object.values(vegToppings).reduce((a, sz) => a + ADDON_PRICES.veg[sz], 0)}` : 'Not selected'}</span>
                    <i className={`fas fa-chevron-${expanded === 'veg' ? 'up' : 'down'}`}></i>
                </div>
                {expanded === 'veg' && (
                    <div className="cust-acc-body">
                        {VEG_TOPPINGS.map(t => (
                            <div key={t.id} className="cust-topping-row">
                                <label className="cust-check-row">
                                    <input type="checkbox" checked={!!vegToppings[t.id]} onChange={() => handleVegToggle(t.id)} />
                                    <span>{t.name}</span>
                                </label>
                                {vegToppings[t.id] && (
                                    <div className="cust-size-row">
                                        {['small', 'medium', 'large'].map(sz => (
                                            <label key={sz} className={`cust-size-chip ${vegToppings[t.id] === sz ? 'active' : ''}`}>
                                                <input type="radio" name={`veg-${t.id}`} checked={vegToppings[t.id] === sz}
                                                    onChange={() => setVegToppings(p => ({ ...p, [t.id]: sz }))} style={{ display: 'none' }} />
                                                {sz.charAt(0).toUpperCase()} +₹{ADDON_PRICES.veg[sz]}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Extra Cheese */}
            <div className="cust-accordion">
                <div className="cust-acc-header" onClick={() => toggleSection('cheese')}>
                    <strong>Extra Cheese</strong>
                    <span>{extraCheese ? `✓ (${extraCheese.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.cheese[extraCheese]}` : 'Not selected'}</span>
                    <i className={`fas fa-chevron-${expanded === 'cheese' ? 'up' : 'down'}`}></i>
                </div>
                {expanded === 'cheese' && (
                    <div className="cust-acc-body">
                        <label className="cust-check-row">
                            <input type="checkbox" checked={!!extraCheese} onChange={e => setExtraCheese(e.target.checked ? 'medium' : null)} />
                            <span>Add Extra Cheese</span>
                        </label>
                        {extraCheese && (
                            <div className="cust-size-row">
                                {['small', 'medium', 'large'].map(sz => (
                                    <label key={sz} className={`cust-size-chip ${extraCheese === sz ? 'active' : ''}`}>
                                        <input type="radio" name="cheese-sz" checked={extraCheese === sz}
                                            onChange={() => setExtraCheese(sz)} style={{ display: 'none' }} />
                                        {sz.charAt(0).toUpperCase()} +₹{ADDON_PRICES.cheese[sz]}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Cheese Burst */}
            <div className="cust-accordion">
                <div className="cust-acc-header" onClick={() => toggleSection('burst')}>
                    <strong>Cheese Burst Crust</strong>
                    <span>{cheeseBurst ? `✓ (${cheeseBurst.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.burst[cheeseBurst]}` : 'Not selected'}</span>
                    <i className={`fas fa-chevron-${expanded === 'burst' ? 'up' : 'down'}`}></i>
                </div>
                {expanded === 'burst' && (
                    <div className="cust-acc-body">
                        <label className="cust-check-row">
                            <input type="checkbox" checked={!!cheeseBurst} onChange={e => setCheeseBurst(e.target.checked ? 'medium' : null)} />
                            <span>Add Cheese Burst Crust</span>
                        </label>
                        {cheeseBurst && (
                            <div className="cust-size-row">
                                {['small', 'medium', 'large'].map(sz => (
                                    <label key={sz} className={`cust-size-chip ${cheeseBurst === sz ? 'active' : ''}`}>
                                        <input type="radio" name="burst-sz" checked={cheeseBurst === sz}
                                            onChange={() => setCheeseBurst(sz)} style={{ display: 'none' }} />
                                        {sz.charAt(0).toUpperCase()} +₹{ADDON_PRICES.burst[sz]}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="cust-footer">
                <div className="cust-total">Add-ons Total: <strong>+₹{addonTotal}</strong></div>
                <div className="cust-actions">
                    <button onClick={onClose} className="cust-btn-cancel">Cancel</button>
                    <button onClick={handleSave} className="cust-btn-save">Apply Add-Ons</button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Cart Drawer ─── */
const CartDrawer = () => {
    const { cartItems, updateQuantity, isCartOpen, setIsCartOpen, cartCount, toggleAddon } = useContext(CartContext);
    const [customizingItem, setCustomizingItem] = useState(null);
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const calculateTotal = () => cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/order');
    };

    const handleSaveCustomization = (cartItem, { toppings, addonsPrice }) => {
        // Apply each topping to the cart item via toggleAddon
        toppings.forEach(t => toggleAddon(cartItem.cartItemId, t));
        setCustomizingItem(null);
    };

    // Determine if item is a pizza (has size in its name or isPizza flag)
    const isPizza = (item) => {
        return item.category === 'pizza' || (item.name && (
            item.name.toLowerCase().includes('pizza') ||
            item.selectedSize || item.size
        ));
    };

    return (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                <div className="cart-drawer-header">
                    <h2>Your Basket ({cartCount})</h2>
                    <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="cart-drawer-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart-drawer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            <p>Your basket is empty!</p>
                            <button className="btn-primary" onClick={() => { setIsCartOpen(false); navigate('/menu'); }} style={{ padding: '10px 20px', marginTop: '10px' }}>
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        <div className="drawer-items">
                            {cartItems.map(item => (
                                <div key={item.cartItemId}>
                                    <div className="drawer-item">
                                        <div className="drawer-item-info">
                                            <h4>{item.name}</h4>
                                            {item.toppings && item.toppings.length > 0 && (
                                                <div className="cart-item-toppings" style={{ fontSize: '0.78rem', color: '#c62828', marginTop: '-2px', marginBottom: '3px' }}>
                                                    + {item.toppings.map(t => t.name || t).join(', ')}
                                                </div>
                                            )}
                                            <p className="drawer-item-price">₹{item.price} × {item.quantity} = <strong>₹{item.price * item.quantity}</strong></p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div className="quantity-controls drawer-qty">
                                                <button onClick={() => updateQuantity(item.cartItemId, -1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                            </div>
                                            {/* Show Customize button for pizzas */}
                                            <button
                                                onClick={() => setCustomizingItem(customizingItem?.cartItemId === item.cartItemId ? null : item)}
                                                style={{
                                                    fontSize: '0.75rem', border: '1px solid #c62828', background: customizingItem?.cartItemId === item.cartItemId ? '#c62828' : 'transparent',
                                                    color: customizingItem?.cartItemId === item.cartItemId ? '#fff' : '#c62828',
                                                    borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s'
                                                }}
                                            >
                                                🍕 Add-Ons
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline Cart Customizer */}
                                    {customizingItem?.cartItemId === item.cartItemId && (
                                        <CartItemCustomizer
                                            item={item}
                                            onSave={(data) => handleSaveCustomization(item, data)}
                                            onClose={() => setCustomizingItem(null)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="drawer-subtotal">
                            <span>Subtotal:</span>
                            <span>₹{calculateTotal()}</span>
                        </div>
                        <button className="btn-primary checkout-btn-drawer" onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
