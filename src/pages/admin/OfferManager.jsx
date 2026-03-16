import API_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';

const OfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form State
    const defaultFormState = {
        title: '',
        description: '',
        discountType: 'PERCENT',
        discountValue: '',
        startDate: '',
        endDate: '',
        isActive: true,
        bannerImage: '',
        couponCode: ''
    };
    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/api/admin/offers');
            if (res.data.success) {
                setOffers(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching offers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataFile = new FormData();
        formDataFile.append('image', file);
        setUploadingImage(true);

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formDataFile
            });
            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, bannerImage: result.image }));
            } else {
                alert(result.message || 'Image upload failed');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload image.');
        } finally {
            setUploadingImage(false);
            e.target.value = null;
        }
    };

    const openEditor = (offer = null) => {
        if (offer) {
            setFormData({
                title: offer.title,
                description: offer.description,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                startDate: new Date(offer.startDate).toISOString().split('T')[0],
                endDate: new Date(offer.endDate).toISOString().split('T')[0],
                isActive: offer.isActive,
                bannerImage: offer.bannerImage || '',
                couponCode: offer.couponCode || ''
            });
            setCurrentOffer(offer);
        } else {
            setFormData({
                ...defaultFormState,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
            });
            setCurrentOffer(null);
        }
        setIsEditing(true);
    };

    const closeEditor = () => {
        setIsEditing(false);
        setCurrentOffer(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const method = currentOffer ? 'PUT' : 'POST';
        const url = currentOffer ? `/api/admin/offers/${currentOffer._id}` : '/api/admin/offers';

        try {
            const res = await api({ method, url, data: formData });
            if (res.data.success) {
                fetchOffers();
                closeEditor();
            }
        } catch (error) {
            console.error("Save offer error", error);
            alert("Failed to save seasonal offer. Please check all fields.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this seasonal offer permanently?")) return;
        try {
            const res = await api.delete(`/api/admin/offers/${id}`);
            if (res.data.success) fetchOffers();
        } catch (error) {
            console.error("Delete error", error);
            alert("Error deleting offer.");
        }
    };

    return (
        <div className="coupon-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Dynamic Seasonal Offers</h3>
                <button className="btn-primary" onClick={() => openEditor()}>
                    <i className="fas fa-plus"></i> New Offer Campaign
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Banner Image</th>
                            <th>Campaign Title</th>
                            <th>Coupon Code</th>
                            <th>Discount</th>
                            <th>Valid Dates</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading campaigns...</td></tr>}
                        {!loading && offers.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center' }}>No seasonal offers configured.</td></tr>}

                        {offers.map(offer => {
                            const now = new Date();
                            const isLive = offer.isActive && new Date(offer.startDate) <= now && new Date(offer.endDate) >= now;

                            return (
                                <tr key={offer._id}>
                                    <td>
                                        {offer.bannerImage ? (
                                            <img src={offer.bannerImage} alt="offer banner" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <span style={{ color: '#999', fontSize: '0.8rem' }}>No Image</span>
                                        )}
                                    </td>
                                    <td><strong>{offer.title}</strong><br /><small style={{ color: '#666' }}>{offer.description}</small></td>
                                    <td style={{ color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{offer.couponCode || 'N/A'}</td>
                                    <td>{offer.discountType === 'AMOUNT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}</td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {new Date(offer.startDate).toLocaleDateString()} to {new Date(offer.endDate).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {isLive ? <span style={{ color: 'green', fontWeight: 'bold' }}><i className="fas fa-circle"></i> Live Now</span>
                                            : (!offer.isActive ? <span style={{ color: 'red' }}>Disabled</span> : <span style={{ color: 'orange' }}>Scheduled/Expired</span>)}
                                    </td>
                                    <td style={{ display: 'flex', gap: '15px' }}>
                                        <button className="action-btn edit" onClick={() => openEditor(offer)}><i className="fas fa-edit"></i></button>
                                        <button className="action-btn delete" onClick={() => handleDelete(offer._id)}><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Editor Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
                        <h3 className="section-title">{currentOffer ? 'Edit Seasonal Campaign' : 'Create Seasonal Campaign'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Campaign Title</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Diwali Dhamaka" required />
                            </div>

                            <div className="form-group">
                                <label>Short Description</label>
                                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Get 20% off on all Veg Pizzas!" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Discount Type</label>
                                    <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="AMOUNT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Discount Value</label>
                                    <input type="number" min="1" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Banner Image (Opt.)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="text" value={formData.bannerImage || ''} onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })} style={{ flex: 1 }} placeholder="URL or upload image..." />
                                    <label className="btn-secondary" style={{ padding: '10px 15px', cursor: 'pointer', margin: 0, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem' }}>
                                        <i className="fas fa-upload"></i> Browse...
                                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '5px' }}>Uploading...</span>}
                            </div>

                            <div className="form-group">
                                <label>Coupon Code (Opt.)</label>
                                <input type="text" value={formData.couponCode} onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })} placeholder="e.g. DIWALI20" style={{ textTransform: 'uppercase' }} />
                                <small style={{ color: '#666' }}>If provided, customers must enter this code at checkout to apply the discount.</small>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                    Enable Campaign (Must also fall within date range to show)
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={closeEditor} style={{ padding: '8px 15px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '8px 25px' }}>{currentOffer ? 'Update Campaign' : 'Launch Campaign'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferManager;
