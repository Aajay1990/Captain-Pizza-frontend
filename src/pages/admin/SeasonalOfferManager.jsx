import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';

const SeasonalOfferManager = () => {
    const { user } = useContext(AuthContext);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editOffer, setEditOffer] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        couponCode: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
        active: true
    });

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/offers');
            if (res.data.success) {
                setOffers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editOffer) {
                await api.put(`/api/admin/offers/${editOffer._id}`, form);
            } else {
                await api.post('/api/admin/offers', form);
            }
            setShowModal(false);
            setEditOffer(null);
            setForm({
                title: '',
                description: '',
                couponCode: '',
                discountType: 'percentage',
                discountValue: 0,
                startDate: '',
                endDate: '',
                active: true
            });
            fetchOffers();
        } catch (error) {
            alert('Error saving offer: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            await api.delete(`/api/admin/offers/${id}`);
            fetchOffers();
        } catch (error) {
            alert('Error deleting offer');
        }
    };

    const handleEdit = (offer) => {
        setEditOffer(offer);
        setForm({
            title: offer.title,
            description: offer.description,
            couponCode: offer.couponCode || '',
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
            endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
            active: offer.active
        });
        setShowModal(true);
    };

    if (!user || user.role !== 'admin') return <div>Access Denied</div>;

    return (
        <div className="manager-container">
            <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Seasonal Offers</h2>
                <button className="btn-primary" onClick={() => { setEditOffer(null); setShowModal(true); }}>
                    + New Offer
                </button>
            </div>

            {loading ? <p>Loading offers...</p> : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Coupon</th>
                                <th>Discount</th>
                                <th>Dates</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map(offer => (
                                <tr key={offer._id}>
                                    <td>
                                        <strong>{offer.title}</strong>
                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{offer.description}</p>
                                    </td>
                                    <td><code style={{ background: '#eee', padding: '2px 5px', borderRadius: '4px' }}>{offer.couponCode || 'N/A'}</code></td>
                                    <td>{offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' Flat'}</td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${offer.active ? 'active' : 'inactive'}`}>
                                            {offer.active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="edit-btn" onClick={() => handleEdit(offer)}><i className="fas fa-edit"></i></button>
                                            <button className="delete-btn" onClick={() => handleDelete(offer._id)}><i className="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '500px' }}>
                        <h3>{editOffer ? 'Edit' : 'New'} Seasonal Offer</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Offer Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows="2"
                                />
                            </div>
                            <div className="form-group">
                                <label>Coupon Code (Optional)</label>
                                <input
                                    type="text"
                                    value={form.couponCode}
                                    onChange={e => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                                    placeholder="e.g. SUMMER2024"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Discount Type</label>
                                    <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                                        <option value="percentage">Percentage</option>
                                        <option value="flat">Flat Amount</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Value</label>
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={e => setForm({ ...form, discountValue: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group checkbox-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={e => setForm({ ...form, active: e.target.checked })}
                                    />
                                    Active / Enabled
                                </label>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Offer</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeasonalOfferManager;

