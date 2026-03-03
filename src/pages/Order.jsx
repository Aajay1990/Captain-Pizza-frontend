import React, { useState, useContext, useEffect } from 'react';
import './Order.css';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Order = () => {
    const { cartItems, updateQuantity, clearCart, toggleAddonSML, bogoDiscount } = useContext(CartContext);
    const { user, refreshUser } = useContext(AuthContext);

    const ADDONS_CONFIG = [
        { name: 'Ketchup x10', isToggle: true, prices: { default: 10 } },
        { name: 'Veg Topping', isToggle: false, prices: { small: 25, medium: 35, large: 45 } },
        { name: 'Extra Cheese', isToggle: false, prices: { small: 40, medium: 60, large: 90 } },
        { name: 'Cheese Burst', isToggle: false, prices: { small: 50, medium: 60, large: 90 } }
    ];
    const navigate = useNavigate();

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [distance, setDistance] = useState(1); // Default 1km

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState({ charge: 40, threshold: 300 });
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [razorpayKeyId, setRazorpayKeyId] = useState('');

    // Load Razorpay Script
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Order/Delivery Settings
                const resSetting = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings');
                const dataSetting = await resSetting.json();
                if (dataSetting.success) {
                    const findVal = (key, def) => dataSetting.data.find(s => s.key === key)?.value || def;
                    setDeliverySettings({
                        charge: findVal('delivery_charge', 40),
                        threshold: findVal('free_delivery_min_order', 300)
                    });
                    // Also get Razorpay Public Key if stored in settings
                    setRazorpayKeyId(findVal('razorpay_key_id', ''));
                }

                // 2. Fetch Available Coupons for Quick Apply
                const resCoupons = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/offers/all-coupons');
                const dataCoupons = await resCoupons.json();
                if (dataCoupons.success) {
                    setAvailableCoupons(dataCoupons.data);
                }
            } catch (e) { console.error(e); }
        };
        fetchData();

        // Prefill user details if logged in
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    // Derived totals
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const isFreeDelivery = distance <= 3 && cartSubtotal >= (deliverySettings.threshold || 300);
    const deliveryFee = isFreeDelivery ? 0 : (deliverySettings.charge || 40);
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount - bogoDiscount);

    // Handle Coupon Check
    const handleApplyCoupon = async (codeFromCard = null) => {
        const finalCode = codeFromCard || couponCode;
        if (!finalCode.trim()) return;
        if (codeFromCard) setCouponCode(finalCode);

        setIsApplying(true);
        setCouponMessage('');

        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: finalCode, orderTotal: cartSubtotal })
            });
            const data = await res.json();

            if (data.success) {
                setDiscount(data.discount);
                setCouponMessage(`✅ ${data.message} (-₹${data.discount})`);
            } else {
                setDiscount(0);
                setCouponMessage(`❌ ${data.message}`);
            }
        } catch (error) {
            setDiscount(0);
            setCouponMessage("❌ Error validating coupon");
        } finally {
            setIsApplying(false);
        }
    };

    // Verify Payment with Backend
    const verifyPayment = async (paymentData, internalOrderId) => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentData,
                    orderId: internalOrderId
                })
            });
            const data = await res.json();
            return data.success;
        } catch (error) {
            console.error("Verification failed", error);
            return false;
        }
    };

    // Handle Order Submission
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return alert("Your cart is empty!");

        setOrderPlacing(true);

        const orderData = {
            userId: user ? user._id : null,
            customerInfo: { name, phone, address, email: user ? user.email : '' },
            orderItems: cartItems.map(i => ({
                menuItem: i._id,
                name: i.name,
                quantity: i.quantity,
                size: i.selectedSize || 'regular',
                price: i.price,
                toppings: i.toppings ? i.toppings.map(t => t.name) : []
            })),
            discount: discount + bogoDiscount,
            deliveryFee,
            distance,
            subTotal: cartSubtotal,
            totalAmount: finalTotal,
            orderType: 'delivery',
            paymentMethod,
            paymentStatus: 'pending' // Default starts as pending
        };

        try {
            // 1. Create Order in Database first
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();

            if (!data.success) {
                setOrderPlacing(false);
                return alert("Failed to place order: " + data.message);
            }

            const internalOrderId = data.data._id;

            // 2. Handle Online Payment if selected
            if (paymentMethod === 'online') {
                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    setOrderPlacing(false);
                    return alert("Razorpay SDK failed to load. Are you online?");
                }

                // Get Razorpay Order from Backend
                const rpOrderRes = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: finalTotal, receipt: internalOrderId })
                });
                const rpOrderData = await rpOrderRes.json();

                if (!rpOrderData.success) {
                    setOrderPlacing(false);
                    return alert("Failed to initiate online payment. Try COD.");
                }

                const options = {
                    key: razorpayKeyId || 'rzp_test_YOUR_KEY_HERE', // Fallback for dev
                    amount: rpOrderData.data.amount,
                    currency: rpOrderData.data.currency,
                    name: "Captain Pizza",
                    description: `Order #${internalOrderId}`,
                    order_id: rpOrderData.data.id,
                    handler: async (response) => {
                        const isVerified = await verifyPayment(response, internalOrderId);
                        if (isVerified) {
                            if (user) refreshUser({ ...user, hasUsedWelcomeOffer: true });
                            clearCart();
                            alert("🎉 Payment Successful & Order Placed!");
                            navigate('/');
                        } else {
                            alert("❌ Payment Verification Failed. Please contact support.");
                        }
                    },
                    prefill: {
                        name: name,
                        email: user ? user.email : '',
                        contact: phone
                    },
                    theme: { color: "#E53935" },
                    modal: {
                        ondismiss: () => {
                            setOrderPlacing(false);
                        }
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.open();

            } else {
                // 3. Handle Cash on Delivery
                if (user) refreshUser({ ...user, hasUsedWelcomeOffer: true });
                clearCart();
                alert(`🎉 Order Placed Successfully (COD)! Your Order ID is: ${internalOrderId}`);
                navigate('/');
            }

        } catch (error) {
            console.error("Order error", error);
            alert("Checkout Error. Please check your connection.");
        } finally {
            if (paymentMethod !== 'online') setOrderPlacing(false);
        }
    };

    return (
        <div className="order-page animate-fade-in">
            <div className="order-header">
                <h1>Complete Your Order</h1>
                <p>Fast delivery right to your doorstep</p>
            </div>

            <div className="order-content">
                <div className="cart-section card">
                    <h2 className="section-title-sm">Your Cart</h2>
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>Your cart is empty.</p>
                            <Link to="/menu" className="btn-primary" style={{ marginTop: '30px', display: 'inline-block' }}>Browse Menu</Link>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {cartItems.map((item, index) => (
                                <div key={item.cartItemId} className="cart-item" style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{index + 1}. {item.name}</h4>
                                    </div>
                                    <div className="item-addons-list">
                                        <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '12px', fontWeight: 'bold' }}>Add-ons</p>
                                        {ADDONS_CONFIG.map((addon, i) => {
                                            if (addon.isToggle) {
                                                const isSelected = item.toppings?.some(t => t.baseName === addon.name);
                                                return (
                                                    <label key={i} style={{ padding: '12px 15px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>{addon.name} <span style={{ color: '#666', fontSize: '0.85rem' }}> (+₹{addon.prices.default})</span></div>
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleAddonSML(item.cartItemId, addon.name, 'default', addon.prices.default)} />
                                                    </label>
                                                );
                                            } else {
                                                const selectedSizeForThisAddon = item.toppings?.find(t => t.baseName === addon.name)?.size;
                                                return (
                                                    <div key={i} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                        <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem' }}>{addon.name}</div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {['small', 'medium', 'large'].map(sz => {
                                                                const price = addon.prices[sz];
                                                                const isSelected = selectedSizeForThisAddon === sz;
                                                                return (
                                                                    <button key={sz} type="button" onClick={() => toggleAddonSML(item.cartItemId, addon.name, sz, price)}
                                                                        style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem', borderRadius: '6px', backgroundColor: isSelected ? 'var(--primary)' : '#fff', color: isSelected ? 'white' : '#444', border: `1px solid ${isSelected ? 'var(--primary)' : '#ddd'}`, cursor: 'pointer' }}>
                                                                        {sz.charAt(0).toUpperCase() + sz.slice(1)} (+₹{price})
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                    <div className="item-bottom-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                                        <div className="quantity-controls">
                                            <button onClick={() => updateQuantity(item.cartItemId, -1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, -item.quantity)} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="coupon-section" style={{ margin: '20px 0', padding: '15px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Promo Code</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" placeholder="Enter Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                    <button onClick={() => handleApplyCoupon()} disabled={isApplying || !couponCode} className="btn-primary" style={{ padding: '10px 20px' }}>{isApplying ? '...' : 'Apply'}</button>
                                </div>
                                {couponMessage && <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: discount > 0 ? 'green' : 'red', fontWeight: 'bold' }}>{couponMessage}</p>}
                                {availableCoupons.length > 0 && (
                                    <div className="quick-coupons" style={{ marginTop: '20px' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px', fontWeight: '600' }}>Available Offers:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {availableCoupons.map((cp, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: couponCode === cp.code && discount > 0 ? '#fff5f5' : '#fff',
                                                    padding: '10px 15px',
                                                    borderRadius: '8px',
                                                    border: couponCode === cp.code && discount > 0 ? '1px solid var(--primary)' : '1px solid #eee'
                                                }}>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', border: '1px dashed var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{cp.code}</span>
                                                        <p style={{ fontSize: '0.75rem', color: '#666', margin: '4px 0 0' }}>{cp.description}</p>
                                                    </div>
                                                    {couponCode === cp.code && discount > 0 ? (
                                                        <span style={{ fontSize: '0.8rem', color: 'green', fontWeight: 'bold' }}><i className="fas fa-check-circle"></i> Applied</span>
                                                    ) : (
                                                        <button onClick={() => handleApplyCoupon(cp.code)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>APPLY</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="cart-summary">
                                <div className="summary-row"><span>Subtotal</span><span>₹{cartSubtotal}</span></div>
                                <div className="summary-row"><span>Delivery Fee ({distance} KM)</span><span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span></div>
                                {bogoDiscount > 0 && <div className="summary-row" style={{ color: '#b71c1c', fontWeight: 'bold' }}><span>BOGO Discount</span><span>-₹{bogoDiscount}</span></div>}
                                {discount > 0 && <div className="summary-row" style={{ color: 'green', fontWeight: 'bold' }}><span>Coupon Discount</span><span>-₹{discount}</span></div>}
                                <div className="summary-row total"><span>Total Amount</span><span>₹{finalTotal}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="checkout-section card">
                    <h2 className="section-title-sm">Delivery Details</h2>
                    <form className="checkout-form" onSubmit={handlePlaceOrder}>
                        <div className="form-group"><label>Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
                        <div className="form-group"><label>Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
                        <div className="form-group"><label>Delivery Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} rows="3" required></textarea></div>
                        <div className="form-group">
                            <label>Distance</label>
                            <select value={distance} onChange={e => setDistance(Number(e.target.value))}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (<option key={d} value={d}>{d} KM</option>))}
                            </select>
                            {distance <= 3 && cartSubtotal >= 300 && <p style={{ fontSize: '0.8rem', color: 'green', marginTop: '5px' }}>✨ Free Delivery Applied!</p>}
                        </div>

                        <h2 className="section-title-sm mt-4">Payment Method</h2>
                        <div className="payment-options">
                            <label><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Cash on Delivery</label>
                            <label><input type="radio" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} /> Pay Online (Razorpay)</label>
                        </div>

                        <button type="submit" className="btn-primary checkout-btn" disabled={cartItems.length === 0 || orderPlacing} style={{ marginTop: '20px', width: '100%' }}>
                            {orderPlacing ? 'Processing...' : `Confirm Order • ₹${finalTotal}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Order;
