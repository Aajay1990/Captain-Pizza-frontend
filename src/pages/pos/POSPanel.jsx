import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './POSPanel.css';
import logo from '../../assets/logo.png';

const POSPanel = () => {
    const { user, token, logoutAuth } = useContext(AuthContext);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isVibrating, setIsVibrating] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeView, setActiveView] = useState('menu'); // 'menu' | 'orders'
    const [orderHistory, setOrderHistory] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Category Icons Mapping
    const catIcons = {
        'All': 'fas fa-th-large',
        'pizza': 'fas fa-pizza-slice',
        'burger': 'fas fa-hamburger',
        'sides': 'fas fa-pepper-hot',
        'drinks': 'fas fa-glass-whiskey',
        'desserts': 'fas fa-ice-cream'
    };

    // Digital Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cart & Billing State
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [taxRate] = useState(0); // Tax removed as requested
    const [paymentMethod, setPaymentMethod] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Modal state for Customization
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedSize, setSelectedSize] = useState('medium');
    const [itemQuantity, setItemQuantity] = useState(1);

    // Add-on State (Matching User Menu)
    const [selectedVegToppings, setSelectedVegToppings] = useState({});
    const [extraCheese, setExtraCheese] = useState(null);
    const [cheeseBurst, setCheeseBurst] = useState(null);
    const [ketchupEnabled, setKetchupEnabled] = useState(false);
    const [ketchupQty, setKetchupQty] = useState(1);
    const [expandedSection, setExpandedSection] = useState('veg');

    const VEG_TOPPINGS = [
        { id: 'tomato', name: 'Tomato' },
        { id: 'onion', name: 'Onion' },
        { id: 'corn', name: 'Sweet Corn' },
        { id: 'capsicum', name: 'Capsicum' }
    ];

    const ADDON_PRICES = {
        veg: { small: 25, medium: 35, large: 45 },
        cheese: { small: 40, medium: 60, large: 90 },
        burst: { small: 50, medium: 60, large: 90 },
        ketchup: 1
    };

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat);
    };

    // Calculations
    const subTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const taxAmount = subTotal * taxRate;
    const finalTotal = subTotal + taxAmount - discount;

    const printReceipt = (order) => {
        const receiptWindow = window.open('', 'PRINT', 'height=600,width=400');
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt #${order._id.slice(-6).toUpperCase()}</title>
                    <style>
                        body { font-family: monospace; padding: 20px; text-align: center; }
                        .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .item { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total { font-weight: bold; font-size: 1.2rem; margin-top: 10px; }
                        .footer { font-size: 0.8rem; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h2>CAPTAIN PIZZA</h2>
                    <p>Bill #${order._id.slice(-6).toUpperCase()}</p>
                    <p>${new Date(order.createdAt).toLocaleString()}</p>
                    <div class="line"></div>
                    ${order.orderItems.map(i => `
                        <div class="item">
                            <span>${i.quantity}x ${i.name} ${i.size !== 'regular' ? `(${i.size})` : ''}</span>
                            <span>₹${i.price * i.quantity}</span>
                        </div>
                        ${i.toppings && i.toppings.length > 0 ? `<div style="font-size: 0.8rem; text-align: left; padding-left: 20px;">+ ${i.toppings.join(', ')}</div>` : ''}
                    `).join('')}
                    <div class="line"></div>
                    <div class="item"><span>Subtotal</span><span>₹${order.subTotal.toFixed(2)}</span></div>
                    ${order.discount ? `<div class="item"><span>Discount</span><span>-₹${order.discount}</span></div>` : ''}
                    <div class="total">TOTAL: ₹${order.totalAmount.toFixed(2)}</div>
                    <div class="line"></div>
                    <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
                    <p>Staff: ${user?.name || 'POS'}</p>
                    <div class="footer">Thank you for your visit!<br/>www.captainpizza.com</div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        receiptWindow.document.close();
    };

    const makeObjectId = (id) => {
        const idStr = String(id);
        if (/^[a-fA-F0-9]{24}$/.test(idStr)) return idStr;
        let hexKey = "";
        for (let i = 0; i < idStr.length; i++) hexKey += idStr.charCodeAt(i).toString(16);
        return hexKey.padEnd(24, '0').slice(0, 24);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        if (!paymentMethod) return alert("Please select a payment method");

        const orderData = {
            customerInfo: {
                name: customerName || 'Walk-in',
                phone: customerPhone || '0000000000'
            },
            orderItems: cart.map(c => ({
                menuItem: makeObjectId(c.menuItemId),
                name: c.name,
                quantity: c.quantity,
                size: c.size,
                price: c.price,
                toppings: c.toppings
            })),
            totalAmount: finalTotal,
            subTotal,
            tax: taxAmount,
            discount,
            orderType: 'pos',
            paymentMethod,
            paymentStatus: 'paid',
            staffId: user?._id || null
        };

        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (data.success) {
                printReceipt(data.data);
                // Reset cart
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setDiscount(0);
                setPaymentMethod('');
            } else {
                alert(`Failed to process order: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Error during checkout.");
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F9') {
                e.preventDefault();
                handleCheckout();
            }
            if (e.key === 'Escape') {
                setSelectedItem(null);
            }
            // Category shortcuts F1-F4
            if (e.key === 'F1' && categories[0]) {
                e.preventDefault();
                handleCategoryClick(categories[0]);
            }
            if (e.key === 'F2' && categories[1]) {
                e.preventDefault();
                handleCategoryClick(categories[1]);
            }
            if (e.key === 'F3' && categories[2]) {
                e.preventDefault();
                handleCategoryClick(categories[2]);
            }
            if (e.key === 'F4' && categories[3]) {
                e.preventDefault();
                handleCategoryClick(categories[3]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, paymentMethod, categories, finalTotal, customerName, customerPhone, taxAmount, subTotal, discount, token, user]);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchOrderHistory = async () => {
        setOrdersLoading(true);
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setOrderHistory(data.data);
        } catch (e) {
            console.error('Order history fetch failed', e);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'orders') fetchOrderHistory();
    };

    const fetchMenu = async () => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/menu?all=true');
            const data = await res.json();
            console.log('POS Menu Data:', data);
            if (data.success) {
                setMenuItems(data.data);
                const rawCats = data.data.map(item => (item.category || '').trim());
                const uniqueCats = ['All', ...new Set(rawCats.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()))];
                console.log('POS Unique Categories:', uniqueCats);
                setCategories(uniqueCats);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
            setLoading(false);
        }
    };



    const filteredItems = (menuItems || []).filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        const activeCat = (activeCategory || '').toLowerCase();

        // If searching, ignore category filter
        if (searchQuery) {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && item.isAvailable !== false;
        }

        if (activeCat !== 'all' && itemCat !== activeCat) return false;
        return item.isAvailable !== false;
    });

    console.log('Filtered Items for display:', filteredItems.length);

    // Handle Item Selection -> Add directly if no options, else open options
    const handleItemClick = (item) => {
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 300);

        if (item.category === 'pizza' && item.prices && Object.keys(item.prices).length > 0) {
            setSelectedItem(item);
            setSelectedSize('medium'); // Default
            setItemQuantity(1);

            // Reset addons
            setSelectedVegToppings({});
            setExtraCheese(null);
            setCheeseBurst(null);
            setKetchupEnabled(false);
            setKetchupQty(1);
            setExpandedSection('veg');
        } else {
            // Direct Add
            const newItem = {
                id: Date.now().toString(),
                menuItemId: item._id,
                name: item.name,
                price: item.price || (item.prices ? item.prices['medium'] : 0),
                quantity: 1,
                size: 'regular',
                toppings: []
            };
            setCart([...cart, newItem]);
        }
    };

    const addToCartWithCustomization = () => {
        if (!selectedItem) return;
        let basePrice = selectedItem.prices ? selectedItem.prices[selectedSize] : selectedItem.price;

        let addonsPrice = 0;
        const formattedToppings = [];

        if (selectedItem.category === 'pizza') {
            Object.entries(selectedVegToppings).forEach(([id, size]) => {
                const name = VEG_TOPPINGS.find(t => t.id === id)?.name;
                if (name) {
                    addonsPrice += ADDON_PRICES.veg[size];
                    formattedToppings.push(`${name} (${size.charAt(0).toUpperCase()})`);
                }
            });

            if (extraCheese) {
                addonsPrice += ADDON_PRICES.cheese[extraCheese];
                formattedToppings.push(`Extra Cheese (${extraCheese.charAt(0).toUpperCase()})`);
            }
            if (cheeseBurst) {
                addonsPrice += ADDON_PRICES.burst[cheeseBurst];
                formattedToppings.push(`Cheese Burst (${cheeseBurst.charAt(0).toUpperCase()})`);
            }
            if (ketchupEnabled) {
                addonsPrice += (ketchupQty * ADDON_PRICES.ketchup);
                formattedToppings.push(`Ketchup (x${ketchupQty})`);
            }
        }

        const finalItemPrice = basePrice + addonsPrice;

        const newItem = {
            id: Date.now().toString(),
            menuItemId: selectedItem._id,
            name: selectedItem.name,
            price: finalItemPrice,
            quantity: itemQuantity,
            size: selectedSize,
            toppings: formattedToppings
        };
        setCart([...cart, newItem]);
        setSelectedItem(null);
    };

    const handleVegToggle = (id) => {
        setSelectedVegToppings(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id]; // unselect
            } else {
                next[id] = selectedSize; // default to pizza size
            }
            return next;
        });
    };

    const handleVegSizeChange = (id, size) => {
        setSelectedVegToppings(prev => ({
            ...prev,
            [id]: size
        }));
    };

    const calculateModalTotal = () => {
        if (!selectedItem) return 0;
        let basePrice = selectedItem.prices ? selectedItem.prices[selectedSize] : selectedItem.price;
        let addonsPrice = 0;

        if (selectedItem.category === 'pizza') {
            Object.values(selectedVegToppings).forEach(size => {
                addonsPrice += ADDON_PRICES.veg[size];
            });
            if (extraCheese) addonsPrice += ADDON_PRICES.cheese[extraCheese];
            if (cheeseBurst) addonsPrice += ADDON_PRICES.burst[cheeseBurst];
            if (ketchupEnabled) addonsPrice += (ketchupQty * ADDON_PRICES.ketchup);
        }

        return (basePrice + addonsPrice) * itemQuantity;
    };

    const incrementQuantity = (cartId) => {
        setCart(cart.map(c => c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c));
    };

    const decrementQuantity = (cartId) => {
        setCart(cart.map(c => {
            if (c.id === cartId && c.quantity > 1) {
                return { ...c, quantity: c.quantity - 1 };
            }
            return c;
        }).filter(c => c.quantity > 0));
    };

    const removeItem = (cartId) => {
        setCart(cart.filter(c => c.id !== cartId));
    };



    return (
        <div className={`pos-container ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Top Bar */}
            <header className="pos-header">
                <div className="pos-brand">
                    <img src={logo} alt="Captain Pizza" className="pos-logo" />
                    <span>Captain <strong>Pizza</strong></span>
                </div>
                <div className="pos-search">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search items or scan barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="pos-top-right">
                    <div className="pos-clock">
                        <i className="far fa-clock"></i> {currentTime}
                    </div>
                    <div className="pos-staff-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Order History Toggle */}
                        <button
                            onClick={() => handleViewChange(activeView === 'orders' ? 'menu' : 'orders')}
                            style={{ background: activeView === 'orders' ? 'var(--pos-primary)' : 'rgba(183,28,28,0.1)', color: activeView === 'orders' ? 'white' : 'var(--pos-primary)', border: 'none', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Toggle Order History"
                        >
                            <i className={`fas fa-${activeView === 'orders' ? 'pizza-slice' : 'receipt'}`}></i>
                            {activeView === 'orders' ? 'Menu' : 'Orders'}
                        </button>
                        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'none', border: 'none', color: 'var(--pos-text)', fontSize: '1.2rem', cursor: 'pointer' }}>
                            {isDarkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
                        </button>
                        <div className="staff-avatar" style={{ width: '40px', height: '40px', background: 'var(--pos-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}
                        </div>
                        <div className="staff-meta" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="staff-name" style={{ color: 'var(--pos-text)', fontWeight: 'bold' }}>{user?.name || user?.email?.split('@')[0] || 'Staff'}</span>
                            <span className="staff-role" style={{ color: 'var(--pos-text-muted)', fontSize: '0.8rem' }}>Staff on Duty</span>
                        </div>
                        <button onClick={logoutAuth} className="btn-exit-pos" title="Logout" style={{ background: 'rgba(183,28,28,0.1)', color: 'var(--pos-primary)', border: 'none', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '10px' }}>
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </header>

            <main className="pos-main">
                {loading ? (
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', fontSize: '2rem', color: 'var(--pos-primary)' }}>
                        <i className="fas fa-spinner fa-spin"></i> &nbsp; Loading Menu...
                    </div>
                ) : activeView === 'orders' ? (
                    // === ORDER HISTORY VIEW ===
                    <div style={{ flex: 1, overflowY: 'auto', padding: '25px', background: 'var(--pos-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: 'var(--pos-text)' }}>POS Order History</h2>
                            <button onClick={fetchOrderHistory} className="btn-refresh"><i className="fas fa-sync-alt"></i> Refresh</button>
                        </div>
                        {ordersLoading ? (
                            <div style={{ textAlign: 'center', padding: '60px', fontSize: '1.5rem', color: 'var(--pos-primary)' }}>
                                <i className="fas fa-spinner fa-spin"></i> Loading...
                            </div>
                        ) : orderHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--pos-text-muted)' }}>No orders found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {orderHistory.map(order => (
                                    <div key={order._id} style={{
                                        background: 'var(--pos-card-bg)',
                                        borderRadius: '12px',
                                        padding: '18px 22px',
                                        boxShadow: 'var(--pos-shadow)',
                                        border: '1px solid var(--pos-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ color: 'var(--pos-primary)', fontSize: '1rem' }}>#{order._id.slice(-6).toUpperCase()}</strong>
                                            <span style={{
                                                background: order.status === 'delivered' ? '#e8f5e9' : order.status === 'cancelled' ? '#ffebee' : '#fff8e1',
                                                color: order.status === 'delivered' ? '#2e7d32' : order.status === 'cancelled' ? '#c62828' : '#e65100',
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700'
                                            }}>{order.status.toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--pos-text-muted)', marginBottom: '6px' }}>
                                            {new Date(order.createdAt).toLocaleString()} &nbsp;|&nbsp; {order.orderType?.toUpperCase()} &nbsp;|&nbsp; {order.paymentMethod?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                                            <strong>Customer:</strong> {order.customerInfo?.name} ({order.customerInfo?.phone})
                                        </div>
                                        <div style={{ borderTop: '1px dashed var(--pos-border)', paddingTop: '8px', fontSize: '0.85rem' }}>
                                            {order.orderItems.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{item.quantity}x {item.name} {item.size && item.size !== 'regular' ? `(${item.size})` : ''}</span>
                                                    <span style={{ color: 'var(--pos-primary)', fontWeight: '700' }}>₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                            <strong style={{ fontSize: '1.1rem', color: 'var(--pos-primary)' }}>Total: ₹{order.totalAmount?.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Left Sidebar Categories */}
                        <aside className="pos-sidebar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`pos-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => handleCategoryClick(cat)}
                                >
                                    <div className="cat-icon">
                                        <i className={catIcons[cat.toLowerCase()] || 'fas fa-utensils'}></i>
                                    </div>
                                    <span>{cat.toUpperCase()}</span>
                                </button>
                            ))}
                        </aside>

                        {/* Center Menu Grid */}
                        <section className="pos-grid-container">
                            <div className="pos-grid-header">
                                <h3>{activeCategory} Items ({filteredItems.length})</h3>
                                <button onClick={fetchMenu} className="btn-refresh"><i className="fas fa-sync-alt"></i></button>
                            </div>
                            <div className="pos-grid">
                                {filteredItems.map(item => (
                                    <div key={item._id} className="pos-text-card" onClick={() => handleItemClick(item)}>
                                        <div className="pos-text-name">
                                            {item.name}
                                        </div>
                                        <div className="pos-text-bottom">
                                            <span className={`pos-tag ${item.category.toLowerCase()}`}>{item.category.toUpperCase()}</span>
                                            <span className="pos-text-price">
                                                ₹{item.price || (item.prices && item.prices['medium']) || 0}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Right Billing Panel */}
                        <aside className="pos-billing">
                            <div className="billing-scroll-container">
                                <div className={`billing-cart-items ${isVibrating ? 'animate-vibrate-soft' : ''}`}>
                                    <h3 style={{ marginBottom: '15px' }}>Current Order</h3>
                                    {cart.length === 0 ? <p style={{ color: '#888' }}>Cart is empty.</p> : null}
                                    {cart.map(c => (
                                        <div key={c.id} className="pos-cart-item">
                                            <div className="cart-item-info">
                                                <div className="cart-item-name">{c.name} {c.size !== 'regular' ? `(${c.size})` : ''}</div>
                                                {c.toppings && c.toppings.length > 0 && (
                                                    <div className="cart-item-toppings" style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                                                        + {c.toppings.join(', ')}
                                                    </div>
                                                )}
                                                <div className="cart-item-price">₹{c.price * c.quantity}</div>
                                            </div>
                                            <div className="cart-item-controls">
                                                <button onClick={() => decrementQuantity(c.id)}>-</button>
                                                <span>{c.quantity}</span>
                                                <button onClick={() => incrementQuantity(c.id)}>+</button>
                                                <button className="del-btn" onClick={() => removeItem(c.id)}>x</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="billing-summary">
                                    <div className="summary-row total-row" style={{ borderTop: 'none', paddingTop: '0' }}>
                                        <span>Subtotal</span>
                                        <span>₹{subTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row discount-row">
                                        <span>Discount</span>
                                        <input
                                            type="number"
                                            value={discount === 0 ? '' : discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="summary-row total-row">
                                        <span>Grand Total</span>
                                        <span>₹{finalTotal > 0 ? finalTotal.toFixed(2) : 0}</span>
                                    </div>
                                </div>

                                <div className="billing-customer">
                                    <div className="customer-field">
                                        <label>Customer Name</label>
                                        <input type="text" placeholder="e.g. Rahul Kumar" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                    </div>
                                    <div className="customer-field">
                                        <label>Phone Number</label>
                                        <input type="text" placeholder="e.g. 98XXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                                    </div>
                                </div>

                                <div className="payment-methods">
                                    <button className={`pm-btn pm-cash ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>
                                        <i className="fas fa-money-bill-wave"></i> CASH
                                    </button>
                                    <button className={`pm-btn pm-upi ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                                        <i className="fas fa-mobile-alt"></i> UPI
                                    </button>
                                    <button className={`pm-btn pm-card ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                                        <i className="fas fa-credit-card"></i> CARD
                                    </button>
                                </div>
                            </div>

                            <button
                                className="btn-complete-order"
                                onClick={handleCheckout}
                            >
                                Complete Order (F9)
                            </button>
                        </aside>
                    </>
                )}
            </main>

            {/* Customization Modal */}
            {selectedItem && (
                <div className="pos-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="pos-modal" style={{ maxHeight: '90vh', width: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div className="pos-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, color: 'var(--pos-primary)' }}>Customize: {selectedItem.name}</h3>
                            <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
                        </div>

                        <div className="pos-modal-body" style={{ overflowY: 'auto', padding: '20px 0', flex: 1 }}>
                            <div className="pos-modal-section">
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>1. Choose Size:</label>
                                <div className="size-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {['small', 'medium', 'large'].map(sz => {
                                        if (!selectedItem.prices || !selectedItem.prices[sz]) return null;
                                        return (
                                            <div
                                                key={sz}
                                                className={`size-option ${selectedSize === sz ? 'active' : ''}`}
                                                style={{
                                                    padding: '15px',
                                                    border: `2px solid ${selectedSize === sz ? 'var(--pos-primary)' : '#ddd'}`,
                                                    borderRadius: '10px',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    background: selectedSize === sz ? 'rgba(183,28,28,0.05)' : '#fff'
                                                }}
                                                onClick={() => setSelectedSize(sz)}
                                            >
                                                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '1.1rem' }}>{sz}</div>
                                                <div style={{ color: 'var(--pos-primary)', marginTop: '5px' }}>₹{selectedItem.prices[sz]}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pos-modal-section addon-system" style={{ marginTop: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>2. Pizza Add-Ons:</label>

                                {/* Ketchup Add-On */}
                                <div className="addon-card dropdown-card">
                                    <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'ketchup' ? null : 'ketchup')}>
                                        <div>
                                            <strong>Ketchup Packets</strong>
                                            <div className="selected-preview">
                                                {ketchupEnabled ? `Selected (x${ketchupQty}) +₹${ketchupQty * ADDON_PRICES.ketchup}` : 'Not Selected'}
                                            </div>
                                        </div>
                                        <i className={`fas fa-chevron-${expandedSection === 'ketchup' ? 'up' : 'down'}`}></i>
                                    </div>
                                    {expandedSection === 'ketchup' && (
                                        <div className="dropdown-list">
                                            <div className="dropdown-item-complex">
                                                <label className="dropdown-item-header">
                                                    <input type="checkbox" checked={ketchupEnabled} onChange={(e) => setKetchupEnabled(e.target.checked)} />
                                                    <span className="topping-name">Include Ketchup</span>
                                                </label>
                                                {ketchupEnabled && (
                                                    <div className="topping-size-selector" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                        <div className="addon-qty-controls" style={{ margin: 0, padding: 0, border: 'none' }}>
                                                            <button onClick={() => setKetchupQty(Math.max(1, ketchupQty - 1))}>-</button>
                                                            <span style={{ color: 'black' }}>{ketchupQty}</span>
                                                            <button onClick={() => setKetchupQty(ketchupQty + 1)}>+</button>
                                                            <span style={{ marginLeft: '10px', fontWeight: 'bold', color: 'var(--pos-primary)' }}>+₹{ketchupQty * ADDON_PRICES.ketchup}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Veg Toppings Accordion */}
                                <div className="addon-card dropdown-card">
                                    <div
                                        className="dropdown-header"
                                        onClick={() => setExpandedSection(expandedSection === 'veg' ? null : 'veg')}
                                    >
                                        <div>
                                            <strong>Veg Toppings</strong>
                                            <div className="selected-preview">
                                                {Object.keys(selectedVegToppings).length > 0
                                                    ? `${Object.keys(selectedVegToppings).length} selected (+₹${Object.values(selectedVegToppings).reduce((acc, sz) => acc + ADDON_PRICES.veg[sz], 0)})`
                                                    : 'Not Selected'
                                                }
                                            </div>
                                        </div>
                                        <i className={`fas fa-chevron-${expandedSection === 'veg' ? 'up' : 'down'}`}></i>
                                    </div>

                                    {expandedSection === 'veg' && (
                                        <div className="dropdown-list">
                                            {VEG_TOPPINGS.map(topping => (
                                                <div key={topping.id} className="dropdown-item-complex">
                                                    <label className="dropdown-item-header">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedVegToppings[topping.id]}
                                                            onChange={() => handleVegToggle(topping.id)}
                                                        />
                                                        <span className="topping-name">{topping.name}</span>
                                                    </label>
                                                    {selectedVegToppings[topping.id] && (
                                                        <div className="topping-size-selector">
                                                            {['small', 'medium', 'large'].map(sz => (
                                                                <label key={sz} className="nested-size-radio">
                                                                    <input
                                                                        type="radio"
                                                                        name={`size-${topping.id}`}
                                                                        checked={selectedVegToppings[topping.id] === sz}
                                                                        onChange={() => handleVegSizeChange(topping.id, sz)}
                                                                    />
                                                                    <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.veg[sz]})</span>
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
                                <div className="addon-card dropdown-card">
                                    <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'cheese' ? null : 'cheese')}>
                                        <div>
                                            <strong>Extra Cheese Topping</strong>
                                            <div className="selected-preview">
                                                {extraCheese ? `Selected (${extraCheese.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.cheese[extraCheese]}` : 'Not Selected'}
                                            </div>
                                        </div>
                                        <i className={`fas fa-chevron-${expandedSection === 'cheese' ? 'up' : 'down'}`}></i>
                                    </div>
                                    {expandedSection === 'cheese' && (
                                        <div className="dropdown-list">
                                            <div className="dropdown-item-complex">
                                                <label className="dropdown-item-header">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!extraCheese}
                                                        onChange={(e) => setExtraCheese(e.target.checked ? selectedSize : null)}
                                                    />
                                                    <span className="topping-name">Add Extra Cheese</span>
                                                </label>
                                                {extraCheese && (
                                                    <div className="topping-size-selector">
                                                        {['small', 'medium', 'large'].map(sz => (
                                                            <label key={sz} className="nested-size-radio">
                                                                <input
                                                                    type="radio"
                                                                    name="cheese-size"
                                                                    checked={extraCheese === sz}
                                                                    onChange={() => setExtraCheese(sz)}
                                                                />
                                                                <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.cheese[sz]})</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cheese Burst Crust */}
                                <div className="addon-card dropdown-card">
                                    <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'burst' ? null : 'burst')}>
                                        <div>
                                            <strong>Cheese Burst Crust</strong>
                                            <div className="selected-preview">
                                                {cheeseBurst ? `Selected (${cheeseBurst.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.burst[cheeseBurst]}` : 'Not Selected'}
                                            </div>
                                        </div>
                                        <i className={`fas fa-chevron-${expandedSection === 'burst' ? 'up' : 'down'}`}></i>
                                    </div>
                                    {expandedSection === 'burst' && (
                                        <div className="dropdown-list">
                                            <div className="dropdown-item-complex">
                                                <label className="dropdown-item-header">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!cheeseBurst}
                                                        onChange={(e) => setCheeseBurst(e.target.checked ? selectedSize : null)}
                                                    />
                                                    <span className="topping-name">Add Cheese Burst Crust</span>
                                                </label>
                                                {cheeseBurst && (
                                                    <div className="topping-size-selector">
                                                        {['small', 'medium', 'large'].map(sz => (
                                                            <label key={sz} className="nested-size-radio">
                                                                <input
                                                                    type="radio"
                                                                    name="burst-size"
                                                                    checked={cheeseBurst === sz}
                                                                    onChange={() => setCheeseBurst(sz)}
                                                                />
                                                                <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.burst[sz]})</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pos-modal-section quantity-section" style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <label style={{ fontWeight: 'bold', margin: 0 }}>Item Quantity:</label>
                                <div className="pos-qty-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#eee', fontSize: '1.2rem', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{itemQuantity}</span>
                                    <button onClick={() => setItemQuantity(q => q + 1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--pos-primary)', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="pos-modal-actions" style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="modal-total-preview" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Grand Total:</span>
                                <span>₹{calculateModalTotal()}</span>
                            </div>
                            <div className="action-btns" style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-cancel" onClick={() => setSelectedItem(null)} style={{ flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>Go Back</button>
                                <button className="btn-add" onClick={addToCartWithCustomization} style={{ flex: 2, padding: '15px', border: 'none', borderRadius: '8px', background: 'var(--pos-primary)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>Add to Cart <i className="fas fa-shopping-cart"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSPanel;
