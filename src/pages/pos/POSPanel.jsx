import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './POSPanel.css';
import logo from '../../assets/logo.png';

const POSPanel = () => {
    const { user, api, logoutAuth } = useContext(AuthContext);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isVibrating, setIsVibrating] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark for premium feel

    // Category Icons Mapping
    const catIcons = {
        'All': 'fas fa-th-large',
        'pizza': 'fas fa-pizza-slice',
        'burger': 'fas fa-hamburger',
        'specialOffer': 'fas fa-star',
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
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [activeToppingCat, setActiveToppingCat] = useState('All');

    const TOPPINGS_CONFIG = [
        { id: 'onion', name: 'Onion Topping', category: 'Toppings', prices: { small: 25, medium: 35, large: 45 } },
        { id: 'capsicum', name: 'Capsicum Topping', category: 'Toppings', prices: { small: 25, medium: 35, large: 45 } },
        { id: 'tomato', name: 'Tomato Topping', category: 'Toppings', prices: { small: 25, medium: 35, large: 45 } },
        { id: 'corn', name: 'Sweet Corn Topping', category: 'Toppings', prices: { small: 25, medium: 35, large: 45 } },
        { id: 'cheese', name: 'Extra Cheese', category: 'Extra', prices: { small: 40, medium: 60, large: 90 } },
        { id: 'burst', name: 'Cheese Burst', category: 'Extra', prices: { small: 50, medium: 60, large: 90 } }
    ];
    const TOPPING_CATS = ['All', 'Toppings', 'Extra'];
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

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        if (!paymentMethod) return alert("Please select a payment method");

        const orderData = {
            customerInfo: {
                name: customerName || 'Walk-in',
                phone: customerPhone || '0000000000'
            },
            orderItems: cart.map(c => ({
                menuItem: c.menuItemId,
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
            const res = await api.post('/api/orders', orderData);
            const data = res.data;
            if (data.success) {
                printReceipt(data.data);
                // Reset cart
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setDiscount(0);
                setPaymentMethod('');
            } else {
                alert("Failed to process order.");
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

    const fetchMenu = async () => {
        try {
            const res = await api.get('/api/menu?all=true');
            const data = res.data;
            console.log('POS Menu Data:', data);
            if (data.success) {
                setMenuItems(data.data);
                const rawCats = data.data.map(item => (item.category || '').trim());
                const uniqueCats = ['All', ...new Set(rawCats.map(c => {
                    const mapped = (c === 'specialOffer' || c === 'cheapMeal' || c === 'cheapmeal') ? 'Best Seller Pizza Offer' : c;
                    return mapped.charAt(0).toUpperCase() + mapped.slice(1).toLowerCase();
                }))];
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

        if (activeCat !== 'all') {
            const isPromoCat = activeCat === 'best seller pizza offer';
            if (isPromoCat) {
                if (itemCat !== 'specialoffer' && itemCat !== 'cheapmeal') return false;
            } else {
                if (itemCat !== activeCat) return false;
            }
        }
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
            setSelectedToppings([]);
            setActiveToppingCat('All');
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

        let toppingsPrice = 0;
        selectedToppings.forEach(tId => {
            const config = TOPPINGS_CONFIG.find(c => c.id === tId);
            if (config && config.prices[selectedSize]) {
                toppingsPrice += config.prices[selectedSize];
            }
        });

        const finalItemPrice = basePrice + toppingsPrice;

        const newItem = {
            id: Date.now().toString(),
            menuItemId: selectedItem._id,
            name: selectedItem.name,
            price: finalItemPrice,
            quantity: itemQuantity,
            size: selectedSize,
            toppings: selectedToppings.map(tId => TOPPINGS_CONFIG.find(c => c.id === tId).name)
        };
        setCart([...cart, newItem]);
        setSelectedItem(null);
    };

    const toggleTopping = (tId) => {
        if (selectedToppings.includes(tId)) {
            setSelectedToppings(selectedToppings.filter(id => id !== tId));
        } else {
            setSelectedToppings([...selectedToppings, tId]);
        }
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
                                Make Checkout (F9)
                            </button>
                        </aside>
                    </>
                )}
            </main>

            {/* Customization Modal */}
            {selectedItem && (
                <div className="pos-modal-overlay">
                    <div className="pos-modal">
                        <h3>Customize: {selectedItem.name}</h3>

                        <div className="pos-modal-section">
                            <label>Product Size:</label>
                            <div className="size-selector">
                                {Object.keys(selectedItem.prices || {}).map(sz => (
                                    <button
                                        key={sz}
                                        className={selectedSize === sz ? 'active' : ''}
                                        onClick={() => setSelectedSize(sz)}
                                    >
                                        <div className="size-label">{sz.toUpperCase()}</div>
                                        <div className="size-price">₹{selectedItem.prices[sz]}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pos-modal-section">
                            <label>Topping Type (Select Veggies):</label>
                            <div className="toppings-list-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                {TOPPINGS_CONFIG.filter(t => t.category === 'Toppings').map(t => (
                                    <div
                                        key={t.id}
                                        className={`pos-topping-unit ${selectedToppings.includes(t.id) ? 'active' : ''}`}
                                        onClick={() => toggleTopping(t.id)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--pos-border)',
                                            background: selectedToppings.includes(t.id) ? 'rgba(183,28,28,0.05)' : 'white',
                                            transition: '0.2s',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                                            {selectedToppings.includes(t.id) && <i className="fas fa-check-circle" style={{ color: 'var(--pos-primary)', marginRight: '5px' }}></i>}
                                            {t.name.replace(' Topping', '')}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--pos-primary)', fontWeight: 'bold' }}>+₹{t.prices[selectedSize]}</div>
                                    </div>
                                ))}
                            </div>

                            <label style={{ marginTop: '20px', display: 'block' }}>Extra Add-ons:</label>
                            <div className="toppings-list-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                {TOPPINGS_CONFIG.filter(t => t.category === 'Extra').map(t => (
                                    <div
                                        key={t.id}
                                        className={`pos-topping-unit ${selectedToppings.includes(t.id) ? 'active' : ''}`}
                                        onClick={() => toggleTopping(t.id)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--pos-border)',
                                            background: selectedToppings.includes(t.id) ? 'rgba(183,28,28,0.05)' : 'white',
                                            transition: '0.2s',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                                            {selectedToppings.includes(t.id) && <i className="fas fa-check-circle" style={{ color: 'var(--pos-primary)', marginRight: '5px' }}></i>}
                                            {t.name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--pos-primary)', fontWeight: 'bold' }}>+₹{t.prices[selectedSize]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pos-modal-section quantity-section">
                            <label>Quantity:</label>
                            <div className="pos-qty-controls">
                                <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))}>-</button>
                                <span>{itemQuantity}</span>
                                <button onClick={() => setItemQuantity(q => q + 1)}>+</button>
                            </div>
                        </div>

                        <div className="pos-modal-actions">
                            <div className="modal-total-preview">
                                Item Total: <span>₹{((selectedItem.prices ? selectedItem.prices[selectedSize] : selectedItem.price) + selectedToppings.reduce((acc, tId) => acc + (TOPPINGS_CONFIG.find(c => c.id === tId)?.prices[selectedSize] || 0), 0)) * itemQuantity}</span>
                            </div>
                            <div className="action-btns">
                                <button className="btn-cancel" onClick={() => setSelectedItem(null)}>Cancel</button>
                                <button className="btn-add" onClick={addToCartWithCustomization}>Add to Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSPanel;
