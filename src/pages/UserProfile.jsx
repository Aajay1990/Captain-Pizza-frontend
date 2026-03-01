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
            const res = await fetch(`https://pizza-backend-api-a5mm.onrender.com/api/users/${user._id}/profile`);
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
            const res = await fetch(`https://pizza-backend-api-a5mm.onrender.com/api/users/${user._id}/wallet`, {
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
            const res = await fetch(`https://pizza-backend-api-a5mm.onrender.com/api/users/${user._id}/address`, {
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Live Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px 0' }}>#{o._id.substring(o._id.length - 6).toUpperCase()}</td>
                                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td>₹{o.totalAmount}</td>
                                    <td style={{ fontWeight: 'bold', color: o.status === 'delivered' ? 'green' : (o.status === 'pending' ? 'orange' : '#3b82f6') }}>
                                        {o.status.toUpperCase()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
