import React, { useState, useEffect } from 'react';

const POS = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [customerPhone, setCustomerPhone] = useState('0000000000');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/menu');
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.data.filter(i => i.availability));
            }
        } catch (error) {
            console.error('POS menu error:', error);
        }
    };

    const addToPOSCart = (item) => {
        // Simple direct pricing for POS speed
        let price = typeof item.price === 'object' ? item.price.medium : item.price;

        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1, posPrice: price }];
        });
    };

    const removeFromPOSCart = (id) => {
        setCart(prev => prev.filter(i => i._id !== id));
    };

    const total = cart.reduce((acc, item) => acc + (item.posPrice * item.quantity), 0);

    const handlePrintAndPay = async () => {
        if (cart.length === 0) return alert('No items in POS cart!');

        const orderData = {
            userId: null,
            customerInfo: { name: customerName, phone: customerPhone, address: 'In-Store POS', email: '' },
            orderItems: cart.map(i => ({
                menuItem: i._id,
                name: i.name,
                quantity: i.quantity,
                size: typeof i.price === 'object' ? 'medium' : 'regular',
                price: i.posPrice
            })),
            totalAmount: total,
            orderType: 'dine_in',
            paymentMethod: paymentMethod,
            paymentStatus: 'paid', // Walk-in is paid
            status: 'preparing' // directly send to kitchen
        };

        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();

            if (data.success) {
                // Mock printing
                const receipt = `
                =============================
                       CAPTAIN PIZZA       
                =============================
                Order ID: #${data.data._id.substring(data.data._id.length - 6).toUpperCase()}
                Date: ${new Date().toLocaleString()}
                -----------------------------
                ${cart.map(c => `${c.quantity}x ${c.name} - ₹${c.posPrice * c.quantity}`).join('\n')}
                -----------------------------
                TOTAL: ₹${total}
                PMT: ${paymentMethod.toUpperCase()}
                =============================
                Thank you for visiting!
                `;
                console.log(receipt);
                alert("Receipt sent to printer!\n" + receipt);

                // Reset POS
                setCart([]);
                setCustomerName('Walk-in Customer');
                setCustomerPhone('0000000000');
            }
        } catch (error) {
            console.error(error);
            alert("POS Submission Error");
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', height: 'calc(100vh - 80px)', gap: '20px' }}>

            {/* Left Screen: Fast Grid Details */}
            <div className="pos-items" style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '15px', overflowY: 'auto' }}>
                <h2 style={{ marginTop: 0 }}>Fast Item Grid (POS)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                    {menuItems.map(item => (
                        <div key={item._id} onClick={() => addToPOSCart(item)} style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: '10px', padding: '15px', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.2s', userSelect: 'none' }} className="pos-item-hover">
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>{item.name}</h4>
                            <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary)' }}>₹{typeof item.price === 'object' ? item.price.medium : item.price}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Screen: POS Biller */}
            <div className="pos-cart" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Current Ticket</h3>

                {/* Cart View */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {cart.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #ccc' }}>
                            <div>
                                <strong>{item.quantity}x</strong> {item.name}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span>₹{item.posPrice * item.quantity}</span>
                                <i className="fas fa-times" style={{ color: 'red', cursor: 'pointer' }} onClick={() => removeFromPOSCart(item._id)}></i>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals & Actions */}
                <div style={{ borderTop: '2px solid #000', paddingTop: '15px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>
                        <span>TOTAL</span>
                        <span>₹{total}</span>
                    </div>

                    <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
                    <input type="tel" placeholder="Customer Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />

                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <option value="cash">💵 Cash / Walk-in</option>
                        <option value="card">💳 Credit/Debit Card</option>
                        <option value="upi">📱 UPI Scanner</option>
                    </select>

                    <button
                        onClick={handlePrintAndPay}
                        style={{ width: '100%', padding: '15px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        PRINT RECEIPT & FIRE
                    </button>
                </div>
            </div>

            <style jsx>{`.pos-item-hover:hover { transform: scale(1.05); border-color: var(--primary); }`}</style>
        </div>
    );
};

export default POS;
