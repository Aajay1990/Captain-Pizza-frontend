import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './CartDrawer.css';

const API = 'https://pizza-backend-api-a5mm.onrender.com';

const ADDONS_CONFIG = [
    { name: 'Ketchup Packets', isToggle: true, prices: { default: 1 } },
    { name: 'Veg Topping', isToggle: false, prices: { small: 25, medium: 35, large: 45 } },
    { name: 'Extra Cheese', isToggle: false, prices: { small: 40, medium: 60, large: 90 } },
    { name: 'Cheese Burst', isToggle: false, prices: { small: 50, medium: 60, large: 90 } },
];

const CartDrawer = () => {
    const {
        cartItems, updateQuantity, clearCart,
        toggleAddonSML, isCartOpen, setIsCartOpen, cartCount
    } = useContext(CartContext);
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // ── Delivery settings from backend ─────────────────────────────
    const [deliverySettings, setDeliverySettings] = useState({ charge: 40, threshold: 300 });
    const [adminWhatsApp, setAdminWhatsApp] = useState('919220367325');

    // ── Checkout form ───────────────────────────────────────────────
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // ── Coupon ──────────────────────────────────────────────────────
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // ── State ───────────────────────────────────────────────────────
    const [view, setView] = useState('cart'); // 'cart' | 'checkout'
    const [orderPlacing, setOrderPlacing] = useState(false);

    // ── Totals ──────────────────────────────────────────────────────
    const cartSubtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryFee = cartSubtotal >= deliverySettings.threshold ? 0 : deliverySettings.charge;
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API}/api/admin/settings`);
                const data = await res.json();
                if (data.success) {
                    const val = (key, def) => data.data.find(s => s.key === key)?.value || def;
                    setDeliverySettings({ charge: val('delivery_charge', 40), threshold: val('free_delivery_min_order', 300) });
                    setAdminWhatsApp(val('admin_whatsapp_number', '919220367325'));
                }
            } catch (_) { }
        };
        fetchSettings();
    }, [user]);

    if (!isCartOpen) return null;

    // ── Coupon ──────────────────────────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true); setCouponMsg('');
        try {
            const res = await fetch(`${API}/api/admin/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, orderTotal: cartSubtotal })
            });
            const data = await res.json();
            if (data.success) { setDiscount(data.discount); setCouponMsg(`✅ ${data.message} (-₹${data.discount})`); }
            else { setDiscount(0); setCouponMsg(`❌ ${data.message}`); }
        } catch { setCouponMsg('❌ Could not validate coupon'); }
        finally { setApplyingCoupon(false); }
    };

    // ── WhatsApp notify ─────────────────────────────────────────────
    const redirectToWhatsApp = (orderResp, paymentId) => {
        let text = `🍕 *NEW ORDER* 🍕\n━━━━━━━━━━━━━━━━\n`;
        text += `🆔 #${orderResp._id.slice(-6).toUpperCase()}\n💳 ${paymentId || 'N/A'}\n`;
        text += `👤 ${name}\n📞 ${phone}\n📍 ${address}\n━━━━━━━━━━━━━━━━\n`;
        cartItems.forEach((item, i) => {
            text += `${i + 1}. ${item.name} ×${item.quantity} — ₹${item.price * item.quantity}\n`;
            if (item.toppings?.length) text += `   ➕ ${item.toppings.map(t => t.name || t).join(', ')}\n`;
        });
        text += `━━━━━━━━━━━━━━━━\n💰 Total: ₹${finalTotal}\n✅ PAID (Online)`;
        window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const makeObjectId = (id) => {
        const s = String(id);
        if (/^[a-fA-F0-9]{24}$/.test(s)) return s;
        let h = '';
        for (let i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16);
        return h.padEnd(24, '0').slice(0, 24);
    };

    // ── Place order ─────────────────────────────────────────────────
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return;
        setOrderPlacing(true);

        const orderData = {
            userId: user?._id || null,
            customerInfo: { name, phone, address, email: user?.email || '' },
            orderItems: cartItems.map(i => ({
                menuItem: makeObjectId(i._id || i.id),
                name: i.name, quantity: i.quantity, size: i.selectedSize || 'regular',
                price: i.price, toppings: i.toppings?.map(t => t.name || t.baseName) || []
            })),
            totalAmount: finalTotal,
            orderType: 'delivery', paymentMethod: 'online',
            discount, tax: 0, subTotal: cartSubtotal, paymentStatus: 'pending'
        };

        try {
            const resKey = await fetch(`${API}/api/orders/razorpay/key`);
            const keyData = await resKey.json();
            if (!keyData.key) { alert('Razorpay not configured.'); setOrderPlacing(false); return; }

            const resOrder = await fetch(`${API}/api/orders/razorpay/create`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: finalTotal })
            });
            const orderResult = await resOrder.json();
            if (!orderResult.success) { alert('Failed to create Razorpay order.'); setOrderPlacing(false); return; }

            const options = {
                key: keyData.key,
                amount: orderResult.order.amount, currency: 'INR',
                name: 'Captain Pizza', description: 'Pizza Order',
                order_id: orderResult.order.id,
                handler: async (response) => {
                    setOrderPlacing(true);
                    try {
                        const verifyRes = await fetch(`${API}/api/orders/razorpay/verify`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderData
                            })
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            if (user) refreshUser({ ...user, hasUsedWelcomeOffer: true });
                            clearCart();
                            setIsCartOpen(false);
                            alert(`🎉 Order Placed! ID: ${verifyData.data._id}`);
                            redirectToWhatsApp(verifyData.data, response.razorpay_payment_id);
                            navigate('/');
                        } else { alert('Payment verification failed. Contact support.'); }
                    } catch { alert('Verification error. Contact support if money was deducted.'); }
                    finally { setOrderPlacing(false); }
                },
                prefill: { name, contact: phone, email: user?.email || '' },
                theme: { color: '#B71C1C' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', r => alert('Payment Failed: ' + r.error.description));
            rzp.open();
            setOrderPlacing(false);
        } catch {
            alert('Could not load payment gateway.');
            setOrderPlacing(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>

                {/* ─ Header ─ */}
                <div className="cart-head">
                    <div className="cart-head-left">
                        <i className="fas fa-shopping-basket"></i>
                        <h2>
                            {view === 'cart' ? 'Your Cart' : 'Checkout'}
                            <span className="cart-count-badge">{cartCount}</span>
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {view === 'checkout' && (
                            <button className="cart-back-btn" onClick={() => setView('cart')}>
                                <i className="fas fa-arrow-left"></i> Cart
                            </button>
                        )}
                        <button className="cart-close" onClick={() => setIsCartOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* ─ CART VIEW ─ */}
                {view === 'cart' && (
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
                            <>
                                {/* Items */}
                                {cartItems.map((item, index) => (
                                    <div key={item.cartItemId} className="cd-item-card">
                                        {/* Item title + remove */}
                                        <div className="cd-item-top">
                                            <h4 className="cd-item-name">{index + 1}. {item.name}</h4>
                                            <button
                                                className="cd-remove-btn"
                                                onClick={() => updateQuantity(item.cartItemId, -item.quantity)}
                                                title="Remove"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>

                                        {/* Add-ons section */}
                                        <div className="cd-addons">
                                            <p className="cd-addons-title">Add-ons</p>

                                            {ADDONS_CONFIG.map((addon, i) => {
                                                if (addon.isToggle) {
                                                    const isSelected = item.toppings?.some(t => t.baseName === addon.name);
                                                    return (
                                                        <label key={i} className="cd-addon-toggle">
                                                            <div className="cd-addon-label">
                                                                <span>{addon.name}</span>
                                                                <span className="cd-addon-price">+₹{addon.prices.default} each</span>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAddonSML(item.cartItemId, addon.name, 'default', addon.prices.default)}
                                                            />
                                                        </label>
                                                    );
                                                } else {
                                                    const selectedSz = item.toppings?.find(t => t.baseName === addon.name)?.size;
                                                    return (
                                                        <div key={i} className="cd-addon-sizes">
                                                            <div className="cd-addon-label">
                                                                <span>{addon.name}</span>
                                                                {selectedSz && <span className="cd-addon-price selected">+₹{addon.prices[selectedSz]}</span>}
                                                            </div>
                                                            <div className="cd-size-btns">
                                                                {['small', 'medium', 'large'].map(sz => (
                                                                    <button
                                                                        key={sz}
                                                                        type="button"
                                                                        className={`cd-size-btn ${selectedSz === sz ? 'active' : ''}`}
                                                                        onClick={() => toggleAddonSML(item.cartItemId, addon.name, sz, addon.prices[sz])}
                                                                    >
                                                                        <span>{sz.charAt(0).toUpperCase() + sz.slice(1)}</span>
                                                                        <span>+₹{addon.prices[sz]}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>

                                        {/* Item qty + price */}
                                        <div className="cd-item-bottom">
                                            <div className="cd-qty">
                                                <button onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                            </div>
                                            <div className="cd-item-price">₹{item.price * item.quantity}</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Coupon */}
                                <div className="cd-coupon">
                                    <p className="cd-coupon-title">🎟️ Promo Code</p>
                                    <div className="cd-coupon-row">
                                        <input
                                            type="text"
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            className="cd-coupon-input"
                                        />
                                        <button
                                            className="cd-coupon-btn"
                                            onClick={handleApplyCoupon}
                                            disabled={applyingCoupon || !couponCode}
                                        >
                                            {applyingCoupon ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponMsg && (
                                        <p className={`cd-coupon-msg ${discount > 0 ? 'success' : 'error'}`}>
                                            {couponMsg}
                                        </p>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="cd-summary">
                                    <div className="cd-sum-row"><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
                                    <div className="cd-sum-row">
                                        <span>Delivery Fee</span>
                                        <span>{deliveryFee === 0 ? <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE 🎉</span> : `₹${deliveryFee}`}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="cd-sum-row" style={{ color: '#16a34a' }}>
                                            <span>Coupon Discount</span><span>−₹{discount}</span>
                                        </div>
                                    )}
                                    <div className="cd-sum-row total">
                                        <span>Total Payable</span><strong>₹{finalTotal}</strong>
                                    </div>
                                    {cartSubtotal < deliverySettings.threshold && (
                                        <p className="cd-free-delivery-hint">
                                            Add ₹{deliverySettings.threshold - cartSubtotal} more for FREE delivery
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ─ CHECKOUT VIEW ─ */}
                {view === 'checkout' && (
                    <div className="cart-body">
                        <form className="cd-checkout-form" onSubmit={handlePlaceOrder}>
                            <h3 className="cd-section-title">
                                <i className="fas fa-map-marker-alt"></i> Delivery Details
                            </h3>
                            <div className="cd-form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="cd-form-group">
                                <label>Phone Number</label>
                                <input type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>
                            <div className="cd-form-group">
                                <label>Delivery Address</label>
                                <textarea placeholder="House no., Street, Locality, City..." rows={3} value={address} onChange={e => setAddress(e.target.value)} required />
                            </div>

                            <h3 className="cd-section-title" style={{ marginTop: '16px' }}>
                                <i className="fas fa-credit-card"></i> Payment
                            </h3>
                            <label className="cd-payment-option active">
                                <input type="radio" checked readOnly />
                                <div>
                                    <span>Pay Online — Razorpay</span>
                                    <small>UPI / Card / Net Banking / Wallet</small>
                                </div>
                                <i className="fas fa-shield-alt" style={{ color: '#16a34a' }}></i>
                            </label>

                            {/* Order summary recap */}
                            <div className="cd-summary" style={{ marginTop: '16px' }}>
                                <div className="cd-sum-row"><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
                                <div className="cd-sum-row"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
                                {discount > 0 && <div className="cd-sum-row" style={{ color: '#16a34a' }}><span>Discount</span><span>−₹{discount}</span></div>}
                                <div className="cd-sum-row total"><span>Total</span><strong>₹{finalTotal}</strong></div>
                            </div>

                            <button
                                type="submit"
                                className="cd-place-order-btn"
                                disabled={cartItems.length === 0 || orderPlacing}
                            >
                                {orderPlacing
                                    ? <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                                    : <><i className="fas fa-lock"></i> Place Order • ₹{finalTotal}</>
                                }
                            </button>
                        </form>
                    </div>
                )}

                {/* ─ Footer (only in cart view) ─ */}
                {view === 'cart' && cartItems.length > 0 && (
                    <div className="cart-foot">
                        <button
                            className="cart-checkout-btn"
                            onClick={() => {
                                if (!user) { setIsCartOpen(false); navigate('/login'); return; }
                                setView('checkout');
                            }}
                        >
                            <i className="fas fa-arrow-right"></i> Proceed to Checkout — ₹{finalTotal}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
