import React, { useState, useContext, useEffect } from 'react';
import './Order.css';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const API = 'https://pizza-backend-api-a5mm.onrender.com';
const TOPPING_TYPES = ['Tomato', 'Corn', 'Onion', 'Capsicum'];
const SIZE_ADDONS = [
    { name: 'Veg Topping', prices: { small: 25, medium: 35, large: 45 } },
    { name: 'Extra Cheese', prices: { small: 40, medium: 60, large: 90 } },
    { name: 'Cheese Burst', prices: { small: 50, medium: 60, large: 90 } },
];

const Order = () => {
    const { cartItems, updateQuantity, clearCart, toggleAddonSML, toggleToppingType } = useContext(CartContext);
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('online');

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState({ charge: 40, threshold: 300 });
    const [adminWhatsApp, setAdminWhatsApp] = useState('919220367325');

    // Guests are welcome — no login required

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
        (async () => {
            try {
                const res = await fetch(`${API}/api/admin/settings`);
                const data = await res.json();
                if (data.success) {
                    const findVal = (key, def) => data.data.find(s => s.key === key)?.value || def;
                    setDeliverySettings({
                        charge: findVal('delivery_charge', 40),
                        threshold: findVal('free_delivery_min_order', 300)
                    });
                    setAdminWhatsApp(findVal('admin_whatsapp_number', '919220367325'));
                }
            } catch (e) { console.error(e); }
        })();
    }, [user]);

    // Totals
    const cartSubtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryFee = cartSubtotal >= deliverySettings.threshold ? 0 : deliverySettings.charge;
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplying(true); setCouponMessage('');
        try {
            const res = await fetch(`${API}/api/admin/coupons/validate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, orderTotal: cartSubtotal })
            });
            const data = await res.json();
            if (data.success) { setDiscount(data.discount); setCouponMessage(`✅ ${data.message} (-₹${data.discount})`); }
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

    const redirectToWhatsApp = (orderResp, paymentId) => {
        let text = `🍕 *NEW ORDER* - CAPTAIN PIZZA\n━━━━━━━━━━━━━━━━\n🆔 #${orderResp._id.slice(-6).toUpperCase()}\n💳 ${paymentId || 'N/A'}\n👤 ${name} | 📞 ${phone}\n📍 ${address}\n━━━━━━━━━━━━━━━━\n`;
        cartItems.forEach((item, i) => {
            text += `${i + 1}. ${item.name} x${item.quantity} — ₹${item.price * item.quantity}\n`;
            const types = item.toppingTypes?.join(', ');
            if (types) text += `   🥗 Toppings: ${types}\n`;
            if (item.toppings?.length) text += `   ➕ ${item.toppings.map(t => t.name || t).join(', ')}\n`;
        });
        text += `━━━━━━━━━━━━━━━━\n💰 Total: ₹${finalTotal} ✅ PAID`;
        window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        // Validate topping types: If any item has Veg Topping selected, must also have toppingTypes
        const invalid = cartItems.find(item => {
            const hasVegTopping = item.toppings?.some(t => t.baseName === 'Veg Topping');
            return hasVegTopping && (!item.toppingTypes || item.toppingTypes.length === 0);
        });
        if (invalid) {
            alert(`⚠️ Please select at least one veg topping type (Tomato, Corn, Onion, Capsicum) for "${invalid.name}"`);
            return;
        }

        setOrderPlacing(true);
        const orderData = {
            userId: user?._id || null,
            customerInfo: { name, phone, address, email: user?.email || '' },
            orderItems: cartItems.map(i => ({
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
                    const vd = await (await fetch(`${API}/api/orders/razorpay/verify`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...response, orderData })
                    })).json();
                    if (vd.success) {
                        if (user) refreshUser({ ...user, hasUsedWelcomeOffer: true });
                        clearCart(); alert(`🎉 Order Placed! ID: ${vd.data._id}`);
                        redirectToWhatsApp(vd.data, response.razorpay_payment_id);
                        navigate('/');
                    } else { alert('Payment verification failed.'); }
                    setOrderPlacing(false);
                },
                prefill: { name, contact: phone, email: user?.email || '' },
                theme: { color: '#B71C1C' }
            }).open();
            setOrderPlacing(false);
        } catch { alert('Could not load payment gateway.'); setOrderPlacing(false); }
    };

    return (
        <div className="order-page animate-fade-in">
            {/* Hero Header */}
            <div className="order-hero">
                <h1><i className="fas fa-shopping-bag" style={{ marginRight: '10px' }}></i>Your Order</h1>
                <p>Review your items • Customize • Pay securely</p>
            </div>

            <div className="order-body">
                {/* ─── LEFT COLUMN: Cart & Addons ─── */}
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
                                        const vegToppingEntry = item.toppings?.find(t => t.baseName === 'Veg Topping');
                                        return (
                                            <div key={item.cartItemId} className="op-cart-item">
                                                <div className="op-item-top">
                                                    <div className="op-item-num">{index + 1}</div>
                                                    <div className="op-item-info">
                                                        <div className="op-item-name">{item.name}</div>
                                                        {item.selectedSize && <div className="op-item-size">{item.selectedSize.charAt(0).toUpperCase() + item.selectedSize.slice(1)} size</div>}
                                                        {item.toppings?.length > 0 && (
                                                            <div style={{ fontSize: '0.75rem', color: '#B71C1C', marginTop: '2px', fontWeight: '600' }}>
                                                                + {item.toppings.map(t => t.name || t.baseName).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="op-item-price-qty">
                                                        <div className="op-qty-ctrl">
                                                            <button onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                                                            <span>{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                                        </div>
                                                        <div className="op-item-total">₹{item.price * item.quantity}</div>
                                                        <button className="op-remove-btn" onClick={() => updateQuantity(item.cartItemId, -item.quantity)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Add-ons customizer */}
                                                <div className="op-addons-block">
                                                    <div className="op-addons-label">✨ Customize Add-ons</div>

                                                    {/* Ketchup stepper */}
                                                    <div className="op-addon-row">
                                                        <div className="op-addon-name">🍅 Ketchup Packets (₹1 each)</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {(() => {
                                                                const k = item.toppings?.find(t => t.baseName === 'Ketchup Packets');
                                                                const qty = k ? Math.round(k.price) : 0;
                                                                return (
                                                                    <>
                                                                        <button className="op-sz-btn" onClick={() => {
                                                                            const n = Math.max(0, qty - 1);
                                                                            if (n === 0) toggleAddonSML(item.cartItemId, 'Ketchup Packets', 'default', 1);
                                                                            else toggleAddonSML(item.cartItemId, 'Ketchup Packets', 'default', n);
                                                                        }} disabled={qty === 0}>−</button>
                                                                        <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                                                                        <button className="op-sz-btn active" onClick={() => {
                                                                            const n = qty + 1;
                                                                            // simplified: use updateAddonQty via toggleAddonSML workaround
                                                                            toggleAddonSML(item.cartItemId, 'Ketchup Packets', 'default', n);
                                                                        }}>+</button>
                                                                        {qty > 0 && <span style={{ fontSize: '0.75rem', color: '#B71C1C', fontWeight: '700' }}>+₹{qty}</span>}
                                                                    </>
                                                                );
                                                            })()}
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
                                                                                <span style={{ opacity: 0.8, fontSize: '0.65rem', marginLeft: '2px' }}>+₹{addon.prices[sz]}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    {selSz && <span style={{ fontSize: '0.75rem', color: '#B71C1C', fontWeight: '700', marginLeft: '6px' }}>+₹{addon.prices[selSz]}</span>}
                                                                </div>

                                                                {/* Topping type selector only for Veg Topping */}
                                                                {addon.name === 'Veg Topping' && selSz && (
                                                                    <div className="op-topping-types">
                                                                        <div className="op-topping-types-label">Select Veg Type</div>
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

                {/* ─── RIGHT COLUMN: Order Summary + Checkout ─── */}
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
                                    <span>₹{cartSubtotal}</span>
                                </div>
                                <div className="op-sum-row">
                                    <span>Delivery</span>
                                    <span>{deliveryFee === 0 ? <span className="op-free-badge">🎉 FREE</span> : `₹${deliveryFee}`}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="op-sum-row" style={{ color: '#2E7D32', fontWeight: '700' }}>
                                        <span>🎟️ Coupon Discount</span>
                                        <span>−₹{discount}</span>
                                    </div>
                                )}
                                <div className="op-sum-row total">
                                    <span>Total Payable</span>
                                    <strong>₹{finalTotal}</strong>
                                </div>
                            </div>
                            {cartSubtotal > 0 && cartSubtotal < deliverySettings.threshold && (
                                <div style={{ fontSize: '0.78rem', color: '#666', textAlign: 'center', marginTop: '12px', padding: '8px', background: '#FFF8E1', borderRadius: '8px' }}>
                                    Add ₹{deliverySettings.threshold - cartSubtotal} more for <strong>FREE delivery</strong> 🛵
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
                                    <label><i className="fas fa-phone"></i> Phone Number</label>
                                    <input type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
                                </div>
                                <div className="op-form-group">
                                    <label><i className="fas fa-map-pin"></i> Delivery Address</label>
                                    <textarea placeholder="House No., Street, Area, City..." rows="3" value={address} onChange={e => setAddress(e.target.value)} required></textarea>
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
                                        : <><i className="fas fa-lock"></i> Pay Securely • ₹{finalTotal}</>
                                    }
                                </button>

                                {!user && (
                                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#888', margin: '4px 0 0' }}>
                                        <Link to="/login" style={{ color: '#B71C1C', fontWeight: '700' }}>Login</Link> to earn rewards & track orders
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Order;
