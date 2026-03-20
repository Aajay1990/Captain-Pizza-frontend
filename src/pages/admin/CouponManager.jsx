import API_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState(null);

    // Form State
    const defaultFormState = { code: '', discountType: 'AMOUNT', discountValue: '', minOrderAmount: 0, isActive: true, expiryDate: '', validDays: [], validStartTime: '', validEndTime: '' };
    const [formData, setFormData] = useState(defaultFormState);
    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/coupons`);
            const data = await res.json();
            if (data.success) {
                setCoupons(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 600);
        }
    };

    const openEditor = (coupon = null) => {
        if (coupon) {
            setFormData({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                isActive: coupon.isActive,
                expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
                validDays: coupon.validDays || [],
                validStartTime: coupon.validStartTime || '',
                validEndTime: coupon.validEndTime || ''
            });
            setCurrentCoupon(coupon);
        } else {
            setFormData(defaultFormState);
            setCurrentCoupon(null);
        }
        setIsEditing(true);
    };

    const closeEditor = () => {
        setIsEditing(false);
        setCurrentCoupon(null);
    };

    const getToken = () => {
        try {
            const s = sessionStorage.getItem('captain_pizza_user') || localStorage.getItem('captain_pizza_user');
            if (s) {
                const parsed = JSON.parse(s);
                if (parsed?.token) return parsed.token;
            }
        } catch (_) {}
        return localStorage.getItem('adminToken') || localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const method = currentCoupon ? 'PUT' : 'POST';
        const url = currentCoupon ? `${API_URL}/api/admin/coupons/${currentCoupon._id}` : `${API_URL}/api/admin/coupons`;
        const token = getToken();

        try {
            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                fetchCoupons();
                closeEditor();
            } else {
                alert(result.message || 'Save failed');
            }
        } catch (error) {
            console.error(error);
            alert("Error saving coupon.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this coupon permanently?")) return;
        const token = getToken();
        try {
            const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            if (data.success) { alert('Coupon deleted!'); fetchCoupons(); }
            else alert('Delete failed: ' + (data.message || 'Unknown error'));
        } catch (error) {
            console.error(error);
            alert('Error deleting coupon');
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/admin/coupons/${coupon._id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            if ((await res.json()).success) {
                fetchCoupons();
            }
        } catch (error) {
            console.error("Error toggling coupon status", error);
        }
    };

    return (
        <div className="coupon-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Promocode Options</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchCoupons}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2b2b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', opacity: refreshing ? 0.7 : 1 }}
                    >
                        <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button className="btn-primary" onClick={() => openEditor()}>
                        <i className="fas fa-plus"></i> Create Code
                    </button>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Coupon Code</th>
                            <th>Discount</th>
                            <th>Min. Order</th>
                            <th>Usage</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading data...</td></tr>}
                        {!loading && coupons.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No coupons exist yet.</td></tr>}

                        {coupons.map(coupon => (
                            <tr key={coupon._id}>
                                <td><strong style={{ letterSpacing: '1px' }}>{coupon.code}</strong></td>
                                <td>{coupon.discountType === 'AMOUNT' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}</td>
                                <td>₹{coupon.minOrderAmount}</td>
                                <td>{coupon.usageCount} times</td>
                                <td>
                                    {coupon.isActive ? <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span> : <span style={{ color: 'red' }}>Disabled</span>}
                                </td>
                                <td style={{ display: 'flex', gap: '15px' }}>
                                    <button 
                                        className="action-btn" 
                                        onClick={() => handleToggleActive(coupon)} 
                                        style={{ background: coupon.isActive ? '#fff3cd' : '#d4edda', color: coupon.isActive ? '#856404' : '#155724', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button className="action-btn edit" onClick={() => openEditor(coupon)}><i className="fas fa-edit"></i></button>
                                    <button className="action-btn delete" onClick={() => handleDelete(coupon._id)}><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Editor Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up">
                        <h3 className="section-title">{currentCoupon ? 'Edit Promocode' : 'New Promo Code'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Secret Code Text</label>
                                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE50" required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Discount Type</label>
                                    <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                        <option value="AMOUNT">Flat Amount (₹)</option>
                                        <option value="PERCENT">Percentage (%)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Value ({formData.discountType === 'AMOUNT' ? '₹' : '%'})</label>
                                    <input type="number" min="1" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Minimum Cart Amount Required (₹)</label>
                                    <input type="number" min="0" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date (Optional)</label>
                                    <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div className="form-group">
                                    <label>Valid Start Time</label>
                                    <input type="time" value={formData.validStartTime} onChange={(e) => setFormData({ ...formData, validStartTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Valid End Time</label>
                                    <input type="time" value={formData.validEndTime} onChange={(e) => setFormData({ ...formData, validEndTime: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '15px' }}>
                                <label>Valid Days (Leave empty for all days)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                    {DAYS_OF_WEEK.map(day => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.validDays.includes(day)}
                                                onChange={(e) => {
                                                    const newDays = e.target.checked 
                                                        ? [...formData.validDays, day] 
                                                        : formData.validDays.filter(d => d !== day);
                                                    setFormData({ ...formData, validDays: newDays });
                                                }}
                                            /> {day.substring(0, 3)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                    Make this coupon active and usable right now
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={closeEditor} style={{ padding: '8px 15px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '8px 25px' }}>{currentCoupon ? 'Update Coupon' : 'Save Coupon'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponManager;
