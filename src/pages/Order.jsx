import React, { useState, useContext, useEffect, useRef } from 'react';
import './Order.css';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import pizzaImg1 from '../assets/MERGHERITA.png';
import burgerImg from '../assets/CHEESY BURGER.png';
import shakeImg from '../assets/BUTTER SCOTCH SHAKE .png';
import offer2 from '../assets/Super Value Friends Meal.png';
import offer3 from '../assets/Family Combo.png';
import garlic from '../assets/CHEESY GARLIC BREAD.png';

const API = 'https://pizza-backend-api-a5mm.onrender.com';
const TOPPING_TYPES = ['Tomato', 'Corn', 'Onion', 'Capsicum'];
const SIZE_ADDONS = [
    { name: 'Veg Topping', prices: { small: 25, medium: 35, large: 45 } },
    { name: 'Extra Cheese', prices: { small: 40, medium: 60, large: 90 } },
    { name: 'Cheese Burst', prices: { small: 50, medium: 60, large: 90 } },
];

const Order = () => {
    const { cartItems, addToCart, updateQuantity, clearCart, toggleAddonSML, toggleToppingType } = useContext(CartContext);
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('online');

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState({ charge: 40, threshold: 300 });
    const [adminWhatsApp, setAdminWhatsApp] = useState('919220367325');

    // WhatsApp confirmation state
    const [orderConfirm, setOrderConfirm] = useState(null); // { orderId, paymentId, waUrl }
    const waUrlRef = useRef('');

    useEffect(() => {
        if (user) { setName(user.name || ''); setPhone(user.phone || ''); }
        (async () => {
            try {
                const res = await fetch(`${API}/api/admin/settings`);
                const data = await res.json();
                if (data.success) {
                    const fv = (k, d) => data.data.find(s => s.key === k)?.value || d;
                    setDeliverySettings({ charge: fv('delivery_charge', 40), threshold: fv('free_delivery_min_order', 300) });
                    setAdminWhatsApp(fv('admin_whatsapp_number', '919220367325'));
                }
            } catch (e) { console.error(e); }
        })();
    }, [user]);

    const cartSubtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryFee = cartSubtotal >= deliverySettings.threshold ? 0 : Number(deliverySettings.charge);
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

    const buildWhatsAppText = (orderResp, paymentId, items) => {
        let text = `🍕 *NEW ORDER* — CAPTAIN PIZZA\n━━━━━━━━━━━━━━━━\n🆔 Order #${orderResp._id.slice(-6).toUpperCase()}\n💳 Payment ID: ${paymentId || 'N/A'}\n👤 ${name} | 📞 ${phone}\n📍 ${address}\n━━━━━━━━━━━━━━━━\n`;
        items.forEach((item, i) => {
            text += `${i + 1}. ${item.name} x${item.quantity} — Rs.${item.price * item.quantity}\n`;
            const types = item.toppingTypes?.join(', ');
            if (types) text += `   Veg Toppings: ${types}\n`;
            const ketchupEntry = item.toppings?.find(t => t.baseName === 'Ketchup Packets');
            if (ketchupEntry && ketchupEntry.price > 0) text += `   Ketchup x${Math.round(ketchupEntry.price)}\n`;
            const addons = item.toppings?.filter(t => t.baseName !== 'Ketchup Packets').map(t => `${t.name || t.baseName}${t.size ? ` (${t.size})` : ''}`).join(', ');
            if (addons) text += `   Add-ons: ${addons}\n`;
        });
        if (specialInstructions.trim()) text += `\n📝 *Special Instructions:* ${specialInstructions.trim()}\n`;
        text += `━━━━━━━━━━━━━━━━\nSubtotal: Rs.${cartSubtotal}\nDelivery: Rs.${deliveryFee}\n`;
        if (discount > 0) text += `Discount: -Rs.${discount}\n`;
        text += `💰 *TOTAL PAID: Rs.${finalTotal}* ✅`;
        return text;
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplying(true); setCouponMessage('');
        try {
            const res = await fetch(`${API}/api/admin/coupons/validate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, orderTotal: cartSubtotal })
            });
            const data = await res.json();
            if (data.success) { setDiscount(data.discount); setCouponMessage(`✅ ${data.message} (-Rs.${data.discount})`); }
            else { setDiscount(0); setCouponMessage(`❌ ${data.message}`); }
        } catch { setCouponMessage('❌ Error validating coupon'); }
        finally { setIsApplying(false); }
    };

    const makeObjectId = (id) => {
        const s = String(id);
        if (/^[a-fA-F0-9]{24}$/.test(s)) return s;
        let h = '';
        for (let i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16);
        return h.padEnd(24, '0').slice(0, 24);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        // Phone validation — must be exactly 10 digits
        if (!/^[6-9]\d{9}$/.test(phone)) {
            alert('⚠️ Please enter a valid 10-digit Indian mobile number.');
            return;
        }

        const invalid = cartItems.find(item => {
            const hasVegTopping = item.toppings?.some(t => t.baseName === 'Veg Topping');
            return hasVegTopping && (!item.toppingTypes || item.toppingTypes.length === 0);
        });
        if (invalid) {
            alert(`⚠️ Please select at least one veg topping type (Tomato, Corn, Onion, Capsicum) for "${invalid.name}"`);
            return;
        }

        setOrderPlacing(true);
        const snapshotItems = [...cartItems];
        
        let deviceId = localStorage.getItem('cp_device_id');
        if (!deviceId) {
            deviceId = `DEV-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
            localStorage.setItem('cp_device_id', deviceId);
        }

        const orderData = {
            userId: user?._id || null,
            deviceUUID: deviceId,
            customerInfo: { name, phone, address, email: user?.email || '', specialInstructions },
            orderItems: snapshotItems.map(i => ({
                menuItem: makeObjectId(i._id || i.id), name: i.name,
                quantity: i.quantity, size: i.selectedSize || 'regular', price: i.price,
                toppings: [
                    ...(i.toppings?.map(t => t.name || t.baseName) || []),
                    ...(i.toppingTypes || [])
                ]
            })),
            totalAmount: finalTotal, orderType: 'delivery', paymentMethod,
            discount, tax: 0, subTotal: cartSubtotal, paymentStatus: 'pending'
        };

        try {
            const { key } = await (await fetch(`${API}/api/orders/razorpay/key`)).json();
            if (!key) { alert('Razorpay not configured.'); setOrderPlacing(false); return; }
            const { success, order: rzpOrder } = await (await fetch(`${API}/api/orders/razorpay/create`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: finalTotal })
            })).json();
            if (!success) { alert('Failed to create payment order.'); setOrderPlacing(false); return; }

            new window.Razorpay({
                key, amount: rzpOrder.amount, currency: 'INR',
                name: 'Captain Pizza', description: 'Order Payment', order_id: rzpOrder.id,
                handler: async (response) => {
                    setOrderPlacing(true);
                    try {
                        const vd = await (await fetch(`${API}/api/orders/razorpay/verify`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...response, orderData })
                        })).json();
                        if (vd.success) {
                            if (user) refreshUser({ ...user, hasUsedWelcomeOffer: true });
                            const waText = buildWhatsAppText(vd.data, response.razorpay_payment_id, snapshotItems);
                            const waUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(waText)}`;
                            waUrlRef.current = waUrl;

                            const waWindow = window.open(waUrl, '_blank');
                            localStorage.setItem('cp_order_phone', phone);
                            clearCart();

                            // Track when user comes back to the website from WhatsApp
                            const checkFocus = () => {
                                if (document.hidden) return;
                                setOrderConfirm(prev => prev ? prev : {
                                    orderId: vd.data._id, waUrl, waBlocked: !waWindow || waWindow.closed
                                });
                                document.removeEventListener('visibilitychange', checkFocus);
                                window.removeEventListener('focus', checkFocus);
                            };
                            document.addEventListener('visibilitychange', checkFocus);
                            window.addEventListener('focus', checkFocus);

                            // Fallback timeout in case browser gets stuck or waPopup blocked
                            setTimeout(() => {
                                setOrderConfirm(prev => prev ? prev : { orderId: vd.data._id, waUrl, waBlocked: !waWindow || waWindow.closed });
                            }, 3500);

                        } else {
                            alert('Payment verification failed. Please screenshot and contact us.');
                        }
                    } catch (err) {
                        alert('Order verification error. Please contact support.');
                    }
                    setOrderPlacing(false);
                },
                prefill: { name, contact: phone, email: user?.email || '' },
                theme: { color: '#B71C1C' },
                modal: { ondismiss: () => setOrderPlacing(false) }
            }).open();
            setOrderPlacing(false);
        } catch (err) {
            alert('Could not load payment gateway. Please try again.');
            setOrderPlacing(false);
        }
    };

    // Ketchup stepper helper
    const getKetchupQty = (item) => {
        const k = item.toppings?.find(t => t.baseName === 'Ketchup Packets');
        return k ? Math.round(k.price) : 0;
    };

    return (
        <div className="order-page animate-fade-in">
            {/* ── Order Confirmed Overlay ── */}
            {orderConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '24px', padding: '36px 32px', maxWidth: '440px', width: '100%',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.4)', textAlign: 'center',
                        animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                    }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎉</div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: '900', color: '#B71C1C' }}>Order Placed!</h2>
                        <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#555', fontWeight: '600' }}>
                            Order ID: <strong style={{ color: '#B71C1C' }}>{orderConfirm.orderId.slice(-6).toUpperCase()}</strong>
                        </p>
                        <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#888' }}>
                            Your payment was successful. We're preparing your order! 🍕
                        </p>

                        {orderConfirm.waBlocked && (
                            <div style={{ background: '#FFF3E0', border: '1px solid #FFB300', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.83rem', color: '#E65100' }}>
                                <strong>⚠️ WhatsApp was blocked by your browser.</strong><br />
                                Click the button below to send your order details to us.
                            </div>
                        )}

                        <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#444', fontWeight: '600' }}>
                            Did your WhatsApp open with order details?
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <button
                                onClick={() => { setOrderConfirm(null); navigate('/order-history'); }}
                                style={{
                                    flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                                    color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '0.95rem',
                                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(27,94,32,0.3)'
                                }}
                            >
                                Track My Order
                            </button>
                            <button
                                onClick={() => { setOrderConfirm(null); navigate('/'); }}
                                style={{
                                    flex: 1, padding: '14px', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                                    color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '0.95rem',
                                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(27,94,32,0.3)'
                                }}
                            >
                                ✅ Yes, All Good!
                            </button>
                            <button
                                onClick={() => {
                                    // Force open WhatsApp with full pre-filled details
                                    window.open(orderConfirm.waUrl, '_blank', 'noopener');
                                    setTimeout(() => { setOrderConfirm(null); navigate('/'); }, 500);
                                }}
                                style={{
                                    flex: 1, padding: '14px',
                                    background: 'linear-gradient(135deg, #1A6E35, #25D366)',
                                    color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '0.88rem',
                                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(37,211,102,0.3)'
                                }}
                            >
                                <i className="fab fa-whatsapp" style={{ marginRight: '6px' }}></i>No, Open WhatsApp
                            </button>
                        </div>
                        <button
                            onClick={() => { setOrderConfirm(null); navigate('/'); }}
                            style={{ background: 'none', border: 'none', color: '#AAA', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            Skip and go to Home
                        </button>
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <div className="order-hero">
                <h1><i className="fas fa-shopping-bag" style={{ marginRight: '10px' }}></i>Your Order</h1>
                <p>Review your items • Customize • Pay securely</p>
            </div>

            <div className="order-body">
                {/* ─── LEFT COLUMN ─── */}
                <div>
                    <div className="op-card">
                        <div className="op-card-head">
                            <div className="head-icon"><i className="fas fa-shopping-cart"></i></div>
                            <h2>Cart Items</h2>
                            <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="op-card-body">
                            {cartItems.length === 0 ? (
                                <div className="op-empty">
                                    <div className="op-empty-icon">🛒</div>
                                    <p>Your cart is empty</p>
                                    <Link to="/menu">Browse Menu</Link>
                                </div>
                            ) : (
                                <>
                                    {cartItems.map((item, index) => {
                                        const ketchupQty = getKetchupQty(item);
                                        return (
                                            <div key={item.cartItemId} className="op-cart-item">
                                                <div className="op-item-top">
                                                    <div className="op-item-num">{index + 1}</div>
                                                    <div className="op-item-info">
                                                        <div className="op-item-name">{item.name}</div>
                                                        {item.selectedSize && <div className="op-item-size">{item.selectedSize.charAt(0).toUpperCase() + item.selectedSize.slice(1)} size</div>}
                                                        {item.toppings?.filter(t => t.baseName !== 'Ketchup Packets').length > 0 && (
                                                            <div style={{ fontSize: '0.75rem', color: '#B71C1C', marginTop: '2px', fontWeight: '600' }}>
                                                                + {item.toppings.filter(t => t.baseName !== 'Ketchup Packets').map(t => t.name || t.baseName).join(', ')}
                                                            </div>
                                                        )}
                                                        {item.toppingTypes?.length > 0 && (
                                                            <div style={{ fontSize: '0.72rem', color: '#2E7D32', marginTop: '2px', fontWeight: '600' }}>
                                                                Veg: {item.toppingTypes.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="op-item-price-qty">
                                                        <div className="op-qty-ctrl">
                                                            <button onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                                                            <span>{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                                        </div>
                                                        <div className="op-item-total">Rs.{item.price * item.quantity}</div>
                                                        <button className="op-remove-btn" onClick={() => updateQuantity(item.cartItemId, -item.quantity)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Add-ons customizer */}
                                                <div className="op-addons-block animate-slide-up" style={{ marginTop: '12px' }}>
                                                    <div className="op-addons-label"><i className="fas fa-magic"></i> Customize Add-ons</div>
                                                    <div className="op-addons-list">
                                                    {/* Ketchup packets stepper */}
                                                    <div className="op-addon-row">
                                                        <div className="op-addon-name">🍅 Ketchup Packets (Rs.1 each)</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <button
                                                                className="op-sz-btn"
                                                                onClick={() => toggleAddonSML(item.cartItemId, 'Ketchup Packets', 'default', Math.max(0, ketchupQty - 1))}
                                                                disabled={ketchupQty === 0}
                                                                style={{ minWidth: '30px' }}
                                                            >−</button>
                                                            <span style={{ fontWeight: '800', minWidth: '24px', textAlign: 'center', fontSize: '1rem' }}>{ketchupQty}</span>
                                                            <button
                                                                className="op-sz-btn active"
                                                                onClick={() => toggleAddonSML(item.cartItemId, 'Ketchup Packets', 'default', ketchupQty + 1)}
                                                                style={{ minWidth: '30px' }}
                                                            >+</button>
                                                            {ketchupQty > 0 && <span style={{ fontSize: '0.78rem', color: '#B71C1C', fontWeight: '700' }}>+Rs.{ketchupQty}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Size-based addons */}
                                                    {SIZE_ADDONS.map(addon => {
                                                        const selSz = item.toppings?.find(t => t.baseName === addon.name)?.size;
                                                        return (
                                                            <div key={addon.name}>
                                                                <div className="op-addon-row">
                                                                    <div className="op-addon-name">{addon.name}</div>
                                                                    <div className="op-size-btns">
                                                                        {['small', 'medium', 'large'].map(sz => (
                                                                            <button
                                                                                key={sz}
                                                                                className={`op-sz-btn ${selSz === sz ? 'active' : ''}`}
                                                                                onClick={() => toggleAddonSML(item.cartItemId, addon.name, sz, addon.prices[sz])}
                                                                            >
                                                                                {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}
                                                                                <span style={{ opacity: 0.8, fontSize: '0.65rem', marginLeft: '2px' }}>+Rs.{addon.prices[sz]}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    {selSz && <span style={{ fontSize: '0.75rem', color: '#B71C1C', fontWeight: '700', marginLeft: '6px' }}>+Rs.{addon.prices[selSz]}</span>}
                                                                </div>

                                                                {addon.name === 'Veg Topping' && selSz && (
                                                                    <div className="op-topping-types">
                                                                        <div className="op-topping-types-label">Select Veg Topping Type <span style={{ color: '#B71C1C' }}>*required</span></div>
                                                                        <div className="op-type-chips">
                                                                            {TOPPING_TYPES.map(type => {
                                                                                const active = item.toppingTypes?.includes(type);
                                                                                return (
                                                                                    <button
                                                                                        key={type}
                                                                                        className={`op-type-chip ${active ? 'active' : ''}`}
                                                                                        onClick={() => toggleToppingType(item.cartItemId, type)}
                                                                                    >
                                                                                        {active && '✓ '}{type}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Coupon */}
                                    <div className="op-coupon">
                                        <div className="op-coupon-title">🎟️ Have a Promo Code?</div>
                                        <div className="op-coupon-row">
                                            <input
                                                type="text"
                                                placeholder="ENTER CODE"
                                                className="op-coupon-input"
                                                value={couponCode}
                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            />
                                            <button className="op-coupon-btn" onClick={handleApplyCoupon} disabled={isApplying || !couponCode}>
                                                {isApplying ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponMessage && <p className={`op-coupon-msg ${discount > 0 ? 'ok' : 'err'}`}>{couponMessage}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div className="op-sticky">
                    {/* Order Summary */}
                    <div className="op-card" style={{ marginBottom: '20px' }}>
                        <div className="op-card-head">
                            <div className="head-icon"><i className="fas fa-receipt"></i></div>
                            <h2>Order Summary</h2>
                        </div>
                        <div className="op-card-body">
                            <div className="op-summary-block">
                                <div className="op-sum-row">
                                    <span>Subtotal</span>
                                    <span>Rs.{cartSubtotal}</span>
                                </div>
                                <div className="op-sum-row">
                                    <span>Delivery</span>
                                    <span>{deliveryFee === 0 ? <span className="op-free-badge">FREE</span> : `Rs.${deliveryFee}`}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="op-sum-row" style={{ color: '#2E7D32', fontWeight: '700' }}>
                                        <span>Coupon Discount</span>
                                        <span>−Rs.{discount}</span>
                                    </div>
                                )}
                                <div className="op-sum-row total">
                                    <span>Total Payable</span>
                                    <strong>Rs.{finalTotal}</strong>
                                </div>
                            </div>
                            {cartSubtotal > 0 && cartSubtotal < deliverySettings.threshold && (
                                <div style={{ fontSize: '0.78rem', color: '#666', textAlign: 'center', marginTop: '12px', padding: '8px', background: '#FFF8E1', borderRadius: '8px' }}>
                                    Add Rs.{deliverySettings.threshold - cartSubtotal} more for <strong>FREE delivery</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="op-card">
                        <div className="op-card-head">
                            <div className="head-icon"><i className="fas fa-map-marker-alt"></i></div>
                            <h2>Delivery Details</h2>
                        </div>
                        <div className="op-card-body">
                            <form className="op-form" onSubmit={handlePlaceOrder}>
                                <div className="op-form-group">
                                    <label><i className="fas fa-user"></i> Full Name</label>
                                    <input type="text" placeholder="e.g. Rahul Sharma" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="op-form-group">
                                    <label><i className="fas fa-phone"></i> Mobile Number (10 digits)</label>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phone}
                                        maxLength={10}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        pattern="[6-9][0-9]{9}"
                                        title="Enter a valid 10-digit Indian mobile number"
                                        required
                                        style={{ letterSpacing: '0.1em' }}
                                    />
                                </div>
                                <div className="op-form-group">
                                    <label><i className="fas fa-map-pin"></i> Delivery Address</label>
                                    <textarea placeholder="House No., Street, Area, City..." rows="3" value={address} onChange={e => setAddress(e.target.value)} required></textarea>
                                </div>

                                {/* Special Instructions */}
                                <div className="op-form-group">
                                    <label><i className="fas fa-pencil-alt"></i> Special Instructions <span style={{ color: '#999', fontSize: '0.8em' }}>(optional)</span></label>
                                    <textarea
                                        placeholder="e.g. Extra spicy, no onions, ring the bell twice..."
                                        rows="2"
                                        value={specialInstructions}
                                        onChange={e => setSpecialInstructions(e.target.value)}
                                        maxLength={300}
                                        style={{ fontSize: '0.88rem' }}
                                    ></textarea>
                                    {specialInstructions.length > 0 && (
                                        <span style={{ fontSize: '0.72rem', color: '#999', textAlign: 'right', display: 'block' }}>{specialInstructions.length}/300</span>
                                    )}
                                </div>

                                <div className="op-form-group">
                                    <label><i className="fas fa-credit-card"></i> Payment Method</label>
                                    <div className="op-payment-opts">
                                        <div className="op-pay-opt active">
                                            <span className="pay-icon">💳</span>
                                            <span className="pay-label">Online (Razorpay)</span>
                                        </div>
                                        <div className="op-pay-opt coming-soon">
                                            <span className="pay-icon">💵</span>
                                            <span className="pay-label">Cash (Coming Soon)</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="op-place-btn"
                                    disabled={cartItems.length === 0 || orderPlacing}
                                >
                                    {orderPlacing
                                        ? <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                                        : <><i className="fas fa-lock"></i> Pay Securely — Rs.{finalTotal}</>
                                    }
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#888', margin: '8px 0 0' }}>
                                    <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '4px' }}></i>
                                    Order details will be sent to our WhatsApp after payment
                                </p>

                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ──── PREMIUM MENU SUGGESTIONS ──── */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 60px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🍕 Add More Delicious Items
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {[
                        { id: 's1', name: 'Margherita Pizza', price: 150, image: pizzaImg1, selectedSize: 'medium' },
                        { id: 's2', name: 'Cheesy Burger', price: 120, image: burgerImg, selectedSize: 'regular' },
                        { id: 's3', name: 'Butter Scotch Shake', price: 90, image: shakeImg, selectedSize: 'regular' },
                        { id: 's4', name: 'Friends Meal Combo', price: 100, image: offer2, selectedSize: 'regular' },
                        { id: 's5', name: 'Family Combo', price: 340, image: offer3, selectedSize: 'regular' },
                        { id: 's6', name: 'Cheesy Garlic Bread', price: 80, image: garlic, selectedSize: 'regular' },
                    ].map(item => (
                        <div key={item.id} style={{
                            background: '#fff', borderRadius: '18px', overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.3s',
                            display: 'flex', flexDirection: 'column'
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                            <div style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#222', marginBottom: '6px', lineHeight: 1.3 }}>{item.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, color: '#e31837', fontSize: '1rem' }}>₹{item.price}</span>
                                    <button
                                        onClick={() => addToCart({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            image: item.image,
                                            selectedSize: item.selectedSize
                                        })}
                                        style={{
                                            background: '#e31837', color: '#fff', border: 'none', borderRadius: '8px',
                                            padding: '6px 12px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                            fontFamily: 'inherit', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#c5122b'}
                                        onMouseLeave={e => e.target.style.background = '#e31837'}
                                    >+ Add</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Order;

