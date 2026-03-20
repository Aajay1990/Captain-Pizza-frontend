import API_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';

const OfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Built-in strip items controlled via localStorage (no backend needed)
    const [staticStripItems, setStaticStripItems] = useState(() => {
        try {
            const saved = localStorage.getItem('visible_strip_items');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return [
            { _id: 'bogo', title: 'Buy 1 Get 1 FREE', description: 'Built-in Captain\'s Strip Item scrolling on Home', isActive: true, isStatic: true, image: '🍕🍕' },
            { _id: 'friends', title: 'Super Value Friends Meal', description: 'Built-in Captain\'s Strip Item scrolling on Home', isActive: true, isStatic: true, image: '🍔🍟🥤' },
            { _id: 'family', title: 'Family Combo Special', description: 'Built-in Captain\'s Strip Item scrolling on Home', isActive: true, isStatic: true, image: '👨‍👩‍👧‍👦🍕' }
        ];
    });

    const getImgSrc = (img) => {
        if (!img) return '';
        if (typeof img !== 'string') return img;
        let n = img.replace(/\\/g, '/');
        if (n.startsWith('uploads/')) n = '/' + n;
        if (n.startsWith('http') || n.startsWith('data:')) return n;
        if (n.startsWith('/uploads')) return `${API_URL}${n}`;
        return n;
    };

    const defaultFormState = {
        title: '', description: '', discountType: 'PERCENT', discountValue: '',
        startDate: '', endDate: '', isActive: true, bannerImage: '', couponCode: ''
    };
    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => { 
        fetchOffers(); 
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/offers`);
            const data = await res.json();
            if (data.success) setOffers(data.data);
            else setOffers([]);
        } catch (err) { setOffers([]); }
        finally { setLoading(false); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('image', file);
        setUploadingImage(true);
        try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=ef4d521dda2415ee1aa0b75fcaa275c6', { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success) setFormData(prev => ({ ...prev, bannerImage: result.data.url }));
            else alert('Upload Failed: ' + (result.error?.message || 'Unknown'));
        } catch { alert('Upload network error.'); }
        finally { setUploadingImage(false); e.target.value = null; }
    };

    const openEditor = (offer = null) => {
        if (offer) {
            setFormData({
                title: offer.title, description: offer.description,
                discountType: offer.discountType, discountValue: offer.discountValue,
                startDate: new Date(offer.startDate).toISOString().split('T')[0],
                endDate: new Date(offer.endDate).toISOString().split('T')[0],
                isActive: offer.isActive, bannerImage: offer.bannerImage || '', couponCode: offer.couponCode || ''
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

    const closeEditor = () => { setIsEditing(false); setCurrentOffer(null); };

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
        const method = currentOffer ? 'PUT' : 'POST';
        const url = currentOffer
            ? `${API_URL}/api/admin/offers/${currentOffer._id}`
            : `${API_URL}/api/admin/offers`;
        
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
            const data = await res.json();
            if (data.success) { fetchOffers(); closeEditor(); }
            else alert('Save failed: ' + (data.message || 'Unknown error'));
        } catch { alert('Network error saving offer.'); }
    };

    const handleDelete = async (id, isStatic = false) => {
        if (!window.confirm('Delete this item completely?')) return;
        
        if (isStatic) {
            // Remove from local array
            const newStatic = staticStripItems.filter(s => s._id !== id);
            setStaticStripItems(newStatic);
            localStorage.setItem('visible_strip_items', JSON.stringify(newStatic));
            alert('✅ Built-in strip item removed!');
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/admin/offers/${id}`, { 
                method: 'DELETE', 
                credentials: 'include',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ Offer deleted!');
                setOffers(prev => prev.filter(o => o._id !== id));
            } else {
                alert('❌ Delete failed: ' + (data.message || 'Unknown error'));
            }
        } catch { alert('❌ Network error deleting offer.'); }
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

                        {[...staticStripItems, ...offers].map(offer => {
                            const now = new Date();
                            const isLive = offer.isStatic ? true : (offer.isActive && new Date(offer.startDate) <= now && new Date(offer.endDate) >= now);
                            return (
                                <tr key={offer._id}>
                                    <td>
                                        {offer.isStatic ? (
                                            <span style={{ fontSize:'2rem' }}>{offer.image}</span>
                                        ) : offer.bannerImage ? (
                                            <img src={getImgSrc(offer.bannerImage)} alt="offer banner"
                                                style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <span style={{ color: '#999', fontSize: '0.8rem' }}>No Image</span>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{offer.title}</strong><br />
                                        <small style={{ color: '#666' }}>{offer.description}</small>
                                    </td>
                                    <td style={{ color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {offer.couponCode || (offer.isStatic ? 'Built-in' : 'N/A')}
                                    </td>
                                    <td>
                                        {offer.isStatic ? 'N/A' : (offer.discountType === 'AMOUNT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`)}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {offer.isStatic ? 'Always' : `${new Date(offer.startDate).toLocaleDateString()} to ${new Date(offer.endDate).toLocaleDateString()}`}
                                    </td>
                                    <td>
                                        {isLive
                                            ? <span style={{ color: 'green', fontWeight: 'bold' }}><i className="fas fa-circle"></i> Live Now</span>
                                            : !offer.isActive
                                                ? <span style={{ color: 'red' }}>Disabled</span>
                                                : <span style={{ color: 'orange' }}>Scheduled/Expired</span>}
                                    </td>
                                    <td style={{ display: 'flex', gap: '15px' }}>
                                        {!offer.isStatic && <button className="action-btn edit" onClick={() => openEditor(offer)}><i className="fas fa-edit"></i></button>}
                                        <button className="action-btn delete" onClick={() => handleDelete(offer._id, offer.isStatic)}><i className="fas fa-trash"></i></button>
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
                                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Diwali Dhamaka" required />
                            </div>
                            <div className="form-group">
                                <label>Short Description</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Get 20% off on all Veg Pizzas!" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Discount Type</label>
                                    <select value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="AMOUNT">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Discount Value</label>
                                    <input type="number" min="1" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Campaign Banner Image</label>
                                <div className="admin-upload-zone"
                                    onClick={() => document.getElementById('offer-image-upload').click()}
                                    style={{ border: '2px dashed #ddd', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#fcfcfc', marginBottom: '10px' }}>
                                    <input type="file" id="offer-image-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                                    {uploadingImage ? (
                                        <div style={{ padding: '10px' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                                            <p style={{ marginTop: '10px' }}>Uploading...</p>
                                        </div>
                                    ) : formData.bannerImage ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img src={getImgSrc(formData.bannerImage)} alt="Preview" style={{ height: '120px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                                            <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>Change Banner</p>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '10px' }}>
                                            <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: '#eee', marginBottom: '10px', display: 'block' }}></i>
                                            <p style={{ margin: 0, fontWeight: '700', color: '#555' }}>Click to Upload Banner Image</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: 0.8 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'bold' }}>BANNER URL/PATH:</span>
                                    <input type="text" value={formData.bannerImage || ''} onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                                        style={{ fontSize: '0.75rem', flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #eee' }} placeholder="Path or external link" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Coupon Code (Opt.)</label>
                                <input type="text" value={formData.couponCode} onChange={e => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })} placeholder="e.g. DIWALI20" style={{ textTransform: 'uppercase' }} />
                                <small style={{ color: '#666' }}>If provided, customers must enter this code at checkout to apply the discount.</small>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
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
