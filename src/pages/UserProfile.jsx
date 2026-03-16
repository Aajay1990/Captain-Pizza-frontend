import API_URL from '../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const UserProfile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [amount, setAmount] = useState('');
    const [addressForm, setAddressForm] = useState({ label: 'Home', street: '', city: '', pinCode: '' });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/${user._id}/profile`);
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setOrders(data.orders);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecharge = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/users/${user._id}/wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Wallet recharged! New Balance: ₹${data.walletBalance}`);
                setAmount('');
                fetchProfile(); // Refresh
            }
        } catch (err) {
            alert('Recharge Error');
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/users/${user._id}/address`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressForm)
            });
            const data = await res.json();
            if (data.success) {
                alert('Address Added Successfully!');
                setAddressForm({ label: 'Home', street: '', city: '', pinCode: '' });
                fetchProfile();
            }
        } catch (err) {
            alert('Address Error');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading My Profile...</div>;

    if (!user) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Please Login first.</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }} className="animate-fade-in">
            <h2 style={{ color: 'var(--text-main)', marginBottom: '30px' }}>My Account Overview</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                {/* Profile Settings & Wallet Block */}
                {/* Address Management Block */}
                <div className="card" style={{ padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '15px' }}>
                    <h3><i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i> My Addresses</h3>

                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                        {profile?.addresses?.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No saved addresses yet.</p>
                        ) : (
                            profile?.addresses?.map((addr, idx) => (
                                <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.05)', padding: '3px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{addr.label}</span>
                                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{addr.street}, {addr.city} - {addr.pinCode}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddAddress} style={{ display: 'grid', gap: '10px' }}>
                        <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} style={{ padding: '10px', borderRadius: '5px' }}>
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                        </select>
                        <input type="text" placeholder="Street Address" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                            <input type="text" placeholder="Pin Code" value={addressForm.pinCode} onChange={e => setAddressForm({ ...addressForm, pinCode: e.target.value })} required style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ backgroundColor: '#2b2b2b' }}>Save Address</button>
                    </form>
                </div>
            </div>

            {/* Tracking & Output Block */}
            <div className="card" style={{ marginTop: '30px', padding: '25px', backgroundColor: 'var(--bg-card)', borderRadius: '15px' }}>
                <h3><i className="fas fa-truck-fast" style={{ color: 'var(--primary)' }}></i> Order Tracking & History</h3>
                {orders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>You haven't ordered anything yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                        {orders.map(o => (
                            <div key={o._id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Order #{o._id.substring(o._id.length - 6).toUpperCase()}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(o.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                                            backgroundColor: o.paymentMethod === 'online' ? '#e8f5e9' : '#fff3e0',
                                            color: o.paymentMethod === 'online' ? '#2e7d32' : '#e65100',
                                            border: `1px solid ${o.paymentMethod === 'online' ? '#a5d6a7' : '#ffcc80'}`
                                        }}>
                                            <i className={`fas ${o.paymentMethod === 'online' ? 'fa-check-circle' : 'fa-money-bill-wave'}`}></i> {o.paymentMethod === 'online' ? 'Prepaid (Online)' : 'Cash / Pay at Store'}
                                        </span>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
                                            backgroundColor: o.status === 'delivered' ? '#e8f5e9' : (o.status === 'cancelled' ? '#ffebee' : o.status === 'out_for_delivery' ? '#f3e8ff' : '#e0f2fe'),
                                            color: o.status === 'delivered' ? '#2e7d32' : (o.status === 'cancelled' ? '#c62828' : o.status === 'out_for_delivery' ? '#7e22ce' : '#0369a1')
                                        }}>
                                            {o.status === 'out_for_delivery' ? <><i className="fas fa-motorcycle"></i> Out for Delivery</> :
                                                o.status === 'preparing' ? <><i className="fas fa-fire"></i> Preparing</> :
                                                    o.status === 'delivered' ? <><i className="fas fa-check-double"></i> Delivered</> :
                                                        o.status === 'cancelled' ? <><i className="fas fa-times"></i> Cancelled</> :
                                                            <><i className="fas fa-clock"></i> Order Accepted</>}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontWeight: '700', marginBottom: '5px', fontSize: '0.9rem' }}>Items Ordered:</div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#444' }}>
                                            {o.orderItems.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '600' }}>{item.quantity}x</span> {item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}
                                                    {item.toppings && item.toppings.length > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                                                            + {item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Amount Paid</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>₹{o.totalAmount}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
