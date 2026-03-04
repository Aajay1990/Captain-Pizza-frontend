import React, { useState, useContext, useEffect } from 'react';
import './Order.css';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Order = () => {
    const { cartItems, updateQuantity, clearCart, toggleAddonSML } = useContext(CartContext);
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
    const [paymentMethod, setPaymentMethod] = useState('online'); // Locked to online

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [deliverySettings, setDeliverySettings] = useState({ charge: 40, threshold: 300 });
    const [adminWhatsApp, setAdminWhatsApp] = useState('919220367325');

    // Enforce Login
    useEffect(() => {
        if (!user && !localStorage.getItem('captain_pizza_user')) {
            navigate('/login?redirect=order');
        }
    }, [user, navigate]);

    // Initial prefill if user is logged in
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
        const fetchOrderSettings = async () => {
            try {
                const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings');
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
        };
        fetchOrderSettings();
    }, []);

    // Derived totals
    const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = cartSubtotal >= deliverySettings.threshold ? 0 : deliverySettings.charge;
    const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discount);

    // Handle Coupon Check
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplying(true);
        setCouponMessage('');

        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, orderTotal: cartSubtotal })
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

    const makeObjectId = (id) => {
        const idStr = String(id);
        if (/^[a-fA-F0-9]{24}$/.test(idStr)) return idStr;
        let hexKey = "";
        for (let i = 0; i < idStr.length; i++) hexKey += idStr.charCodeAt(i).toString(16);
        return hexKey.padEnd(24, '0').slice(0, 24);
    };

    const redirectToWhatsApp = (orderDataResp, paymentId) => {
        const adminPhone = adminWhatsApp; // Admin phone number for WhatsApp
        let text = `🍕 *NEW ORDER FROM CAPTAIN PIZZA* 🍕\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🆔 *Order ID:* #${orderDataResp._id.slice(-6).toUpperCase()}\n`;
        text += `💳 *Transaction ID:* ${paymentId || 'N/A'}\n`;
        text += `📅 *Date:* ${new Date().toLocaleString()}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `👤 *Name:* ${name}\n`;
        text += `📞 *Phone:* ${phone}\n`;
        text += `📍 *Address:* ${address}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `🛍️ *Order Items:*\n`;

        cartItems.forEach((item, index) => {
            text += `*${index + 1}. ${item.name}*\n`;
            text += `   Qty: ${item.quantity} | Size: ${item.selectedSize || 'Regular'}\n`;
            if (item.toppings && item.toppings.length > 0) {
                const toppingNames = item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ');
                text += `   ➕ Add-ons: ${toppingNames}\n`;
            }
            text += `   Price: ₹${item.price * item.quantity}\n`;
        });

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 *Subtotal:* ₹${cartSubtotal}\n`;
        if (discount > 0) text += `🎟️ *Coupon Discount:* -₹${discount}\n`;
        text += `🚚 *Delivery Fee:* ₹${deliveryFee}\n`;
        text += `⭐ *TOTAL PAYABLE:* ₹${finalTotal}\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `✅ *Payment Status:* PAID (Online)\n`;
        text += `Thank you for ordering with us!`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/${adminPhone}?text=${encodedText}`, '_blank');
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
                menuItem: makeObjectId(i._id || i.id),
                name: i.name,
                quantity: i.quantity,
                size: i.selectedSize || 'regular',
                price: i.price,
                toppings: i.toppings ? i.toppings.map(t => t.name || t.baseName) : []
            })),
            totalAmount: finalTotal,
            orderType: 'delivery',
            paymentMethod,
            discount,
            tax: 0,
            subTotal: cartSubtotal,
            paymentStatus: 'pending' // Just simulating for now, or real razorpay
        };

        if (paymentMethod === 'online') {
            try {
                // Fetch Key
                const resKey = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders/razorpay/key');
                const keyData = await resKey.json();

                if (!keyData.key) {
                    alert("Razorpay is not configured on the backend. Please use Cash on Delivery.");
                    setOrderPlacing(false);
                    return;
                }

                // Create Order on Backend
                const resOrder = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders/razorpay/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: finalTotal })
                });

                const orderResult = await resOrder.json();

                if (!orderResult.success) {
                    alert("Failed to create Razorpay order.");
                    setOrderPlacing(false);
                    return;
                }

                const options = {
                    key: keyData.key,
                    amount: orderResult.order.amount,
                    currency: "INR",
                    name: "Captain Pizza",
                    description: "Pizza Order",
                    order_id: orderResult.order.id,
                    handler: async function (response) {
                        setOrderPlacing(true); // Re-show loading during verification
                        try {
                            const verifyRes = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders/razorpay/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderData
                                })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                                if (user) { refreshUser({ ...user, hasUsedWelcomeOffer: true }); }
                                clearCart();
                                alert(`🎉 Order Placed Successfully! Your Order ID is: ${verifyData.data._id}`);
                                redirectToWhatsApp(verifyData.data, response.razorpay_payment_id);
                                navigate('/');
                            } else {
                                alert("Payment verification failed. Please contact support.");
                            }
                        } catch (err) {
                            console.error("Verification error", err);
                            alert("Verification error. If money was deducted, please refer to support.");
                        } finally {
                            setOrderPlacing(false);
                        }
                    },
                    prefill: {
                        name: name,
                        contact: phone,
                        email: user ? user.email : ''
                    },
                    theme: {
                        color: "#B71C1C"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    alert('Payment Failed: ' + response.error.description);
                });
                rzp.open();
                setOrderPlacing(false); // Enable button once window opens

            } catch (error) {
                console.error("Razorpay error", error);
                alert("Could not load payment gateway. Try Cash on Delivery.");
                setOrderPlacing(false);
            }
        } else {
            // Cash on Delivery
            try {
                const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                const data = await res.json();

                if (data.success) {
                    if (user) {
                        refreshUser({ ...user, hasUsedWelcomeOffer: true });
                    }
                    clearCart();
                    alert(`🎉 Order Placed Successfully! Your Order ID is: ${data.data._id}`);
                    navigate('/'); // Redirect back home
                } else {
                    alert("Failed to place order: " + (data.message || "Unknown server error"));
                }
            } catch (error) {
                console.error("Order error", error);
                alert("Checkout Error. Please check your connection.");
            } finally {
                setOrderPlacing(false);
            }
        }
    };

    return (
        <div className="order-page animate-fade-in">
            <div className="order-header">
                <h1>Complete Your Order</h1>
                <p>Fast delivery right to your doorstep</p>
            </div>

            <div className="order-content">
                {/* Cart Snapshot Area */}
                <div className="cart-section card">
                    <h2 className="section-title-sm">Your Cart</h2>
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>Your cart is empty.</p>
                            <Link to="/menu" className="btn-primary" style={{ marginTop: '30px', display: 'inline-block' }}>Browse Menu</Link>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {cartItems.map((item, index) => {
                                return (
                                    <div key={item.cartItemId} className="cart-item" style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
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
                                                            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>{addon.name} <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 'normal' }}> (+₹{addon.prices.default})</span></div>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAddonSML(item.cartItemId, addon.name, 'default', addon.prices.default)}
                                                                style={{ width: '20px', height: '20px', accentColor: '#E53935', cursor: 'pointer' }}
                                                            />
                                                        </label>
                                                    );
                                                } else {
                                                    const selectedSizeForThisAddon = item.toppings?.find(t => t.baseName === addon.name)?.size;
                                                    return (
                                                        <div key={i} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                            <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem', color: '#333' }}>{addon.name}</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {['small', 'medium', 'large'].map(sz => {
                                                                    const price = addon.prices[sz];
                                                                    const isSelected = selectedSizeForThisAddon === sz;
                                                                    const sizeLabel = sz === 'small' ? 'Small' : sz === 'medium' ? 'Medium' : 'Large';
                                                                    return (
                                                                        <button
                                                                            key={sz}
                                                                            type="button"
                                                                            onClick={() => toggleAddonSML(item.cartItemId, addon.name, sz, price)}
                                                                            style={{
                                                                                flex: 1, padding: '10px 5px', fontSize: '0.85rem', borderRadius: '6px',
                                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                                                                backgroundColor: isSelected ? 'var(--primary)' : '#fff',
                                                                                color: isSelected ? 'white' : '#444',
                                                                                border: `1px solid ${isSelected ? 'var(--primary)' : '#ddd'}`,
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease',
                                                                                boxShadow: isSelected ? '0 3px 6px rgba(229,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'
                                                                            }}
                                                                        >
                                                                            <span style={{ fontWeight: isSelected ? 'bold' : '500' }}>{sizeLabel}</span>
                                                                            <span style={{ fontSize: '0.8rem', opacity: isSelected ? 1 : 0.8 }}>+₹{price}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>

                                        {/* Bottom Controls */}
                                        <div className="item-bottom-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                                            <div className="quantity-controls" style={{ margin: 0 }}>
                                                <button onClick={() => updateQuantity(item.cartItemId, -1)} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>-</button>
                                                <span style={{ width: '25px', textAlign: 'center', fontSize: '1.1rem' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.cartItemId, 1)} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.cartItemId, -item.quantity)} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}>
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Coupon Input UI */}
                            <div className="coupon-section" style={{ margin: '20px 0', padding: '15px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '0.9rem' }}>Have a Promo Code?</h4>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', textTransform: 'uppercase' }}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={isApplying || !couponCode}
                                        className="btn-primary"
                                        style={{ padding: '10px 20px' }}
                                    >
                                        {isApplying ? 'Checking...' : 'Apply'}
                                    </button>
                                </div>
                                {couponMessage && <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: discount > 0 ? 'green' : 'red', fontWeight: 'bold' }}>{couponMessage}</p>}
                            </div>

                            <div className="cart-summary">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{cartSubtotal}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Fee</span>
                                    <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="summary-row" style={{ color: 'green', fontWeight: 'bold' }}>
                                        <span>Coupon Discount</span>
                                        <span>-₹{discount}</span>
                                    </div>
                                )}
                                <div className="summary-row total">
                                    <span>Total Final Amount</span>
                                    <span>₹{finalTotal}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Secure Checkout Form */}
                <div className="checkout-section card">
                    <h2 className="section-title-sm">Delivery Details</h2>
                    <form className="checkout-form" onSubmit={handlePlaceOrder}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Delivery Address</label>
                            <textarea placeholder="Enter complete address..." rows="3" value={address} onChange={e => setAddress(e.target.value)} required></textarea>
                        </div>

                        <h2 className="section-title-sm mt-4">Payment Method</h2>
                        <div className="payment-options">
                            <label className="payment-radio" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                <input type="radio" name="payment" disabled checked={false} />
                                <span>Cash on Delivery (Coming Soon)</span>
                            </label>
                            <label className="payment-radio">
                                <input type="radio" name="payment" checked={true} readOnly />
                                <span>Pay Online (Razorpay)</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary checkout-btn"
                            disabled={cartItems.length === 0 || orderPlacing}
                            style={{ marginTop: '20px', width: '100%', fontSize: '1.1rem' }}
                        >
                            {orderPlacing ? 'Processing Database...' : `Place Order • ₹${finalTotal}`}
                        </button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default Order;
