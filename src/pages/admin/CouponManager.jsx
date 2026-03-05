import React, { useState, useEffect } from 'react';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState(null);

    // Form State
    const defaultFormState = { code: '', discountType: 'AMOUNT', discountValue: '', minOrderAmount: 0, isActive: true };
    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons');
            const data = await res.json();
            if (data.success) {
                setCoupons(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openEditor = (coupon = null) => {
        if (coupon) {
            setFormData({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                isActive: coupon.isActive
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

    const handleSave = async (e) => {
        e.preventDefault();

        const method = currentCoupon ? 'PUT' : 'POST';
        const url = currentCoupon ? `https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons/${currentCoupon._id}` : 'https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                fetchCoupons();
                closeEditor();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error saving coupon.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this coupon permanently?")) return;
        try {
            const res = await fetch(`https://pizza-backend-api-a5mm.onrender.com/api/admin/coupons/${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchCoupons();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="coupon-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Promocode Options</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchCoupons}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2b2b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-sync-alt"></i> Refresh
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

                            <div className="form-group">
                                <label>Minimum Cart Amount Required (₹)</label>
                                <input type="number" min="0" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} required />
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
