import API_URL from '../../apiConfig';
import React, { useState, useEffect } from 'react';

const MenuManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isRenamingCategory, setIsRenamingCategory] = useState(false);
    const [catRenameData, setCatRenameData] = useState({ oldName: '', newName: '' });

    const getImgSrc = (img) => {
        if (!img) return 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=100';
        if (typeof img !== 'string') return img;
        
        let normalizedImg = img.replace(/\\/g, '/');
        if (normalizedImg.startsWith('uploads/')) normalizedImg = '/' + normalizedImg;
        if (normalizedImg.startsWith('http') || normalizedImg.startsWith('data:')) return normalizedImg;
        if (normalizedImg.startsWith('/uploads')) return `${API_URL}${normalizedImg}`;
        
        return normalizedImg.startsWith('/') ? normalizedImg : `/images/menu/${normalizedImg}`;
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setRefreshing(true);
        try {
            const [memRes, offRes] = await Promise.all([
                fetch(`${API_URL}/api/menu?all=true`),
                fetch(`${API_URL}/api/admin/offers`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                }).catch(() => null)
            ]);

            let combined = [];
            
            if (memRes && memRes.ok) {
                const result = await memRes.json();
                if (result.success) combined = [...result.data];
            }

            if (offRes && offRes.ok) {
                 const offersResult = await offRes.json();
                 if (offersResult.success) {
                      const formattedOffers = offersResult.data.map(o => ({
                          _id: o._id,
                          name: '⭐ [Offer] ' + o.title,
                          category: 'Seasonal Offer',
                          price: o.discountValue,
                          isAvailable: o.isActive,
                          image: o.bannerImage,
                          isSeasonalModel: true
                      }));
                      combined = [...combined, ...formattedOffers];
                 }
            }

            setItems(combined);
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(() => { setLoading(false); setRefreshing(false); }, 600);
        }
    };

    const handleRenameCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/menu/category-rename`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catRenameData)
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setIsRenamingCategory(false);
                fetchMenu();
            }
        } catch (error) { alert("Error renaming"); }
    };

    const defaultFormState = {
        name: '', category: 'pizza', subCategory: '', desc: '', price: '',
        prices: { small: '', medium: '', large: '' }, image: ''
    };
    const [formData, setFormData] = useState(defaultFormState);

    const openEditor = (item = null) => {
        const standard = ['pizza', 'burger', 'wrap', 'sandwich', 'side'];
        if (item) {
            setFormData(item);
            setIsCustomCategory(!standard.includes(item.category));
        } else {
            setFormData(defaultFormState);
            setIsCustomCategory(false);
        }
        setIsEditing(true);
        setCurrentItem(item);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('image', file);
        setUploadingImage(true);
        try {
            const IMGBB_KEY = 'ef4d521dda2415ee1aa0b75fcaa275c6';
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.data.url }));
            } else {
                alert('Upload Failed: ' + (result.error?.message || 'Unknown error'));
            }
        } catch (err) { alert('Upload network error. Please try again.'); }
        finally { setUploadingImage(false); }
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
        const method = currentItem ? 'PUT' : 'POST';
        const url = currentItem ? `${API_URL}/api/menu/${currentItem._id}` : `${API_URL}/api/menu`;
        
        const payload = { ...formData };
        if (payload.category === 'pizza' && !payload.subCategory) {
            payload.subCategory = 'Deluxe Veg';
        }

        const token = getToken();

        try {
            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) { fetchMenu(); setIsEditing(false); alert('Saved!'); }
            else alert('Save failed: ' + (result.message || result.error || 'Unknown error'));
        } catch (err) { alert('Network error saving: ' + err.message); }
    };

    const confirmDelete = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/api/menu/${itemToDelete._id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const result = await res.json();
            if (result.success) { alert('Item deleted!'); fetchMenu(); }
            else alert('Delete failed: ' + (result.message || 'Unknown error'));
        } catch (err) { alert("Error deleting: " + err.message); }
        finally { setItemToDelete(null); }
    };

    return (
        <div className="menu-manager" style={{ padding: '20px' }}>
            <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3 className="section-title">Menu Database</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchMenu} className="btn-refresh" style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}>
                        <i className={`fas fa-sync ${refreshing ? 'fa-spin' : ''}`}></i>
                    </button>
                    <button className="btn-primary" onClick={() => openEditor()} style={{ background: '#B71C1C', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Add Item
                    </button>
                </div>
            </div>

            <div className="admin-table-container" style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '40%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead style={{ background: '#f8f9fa', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '12px 15px', fontWeight: 700, fontSize: '0.85rem', color: '#555' }}>Item Name</th>
                            <th style={{ padding: '12px 8px', fontWeight: 700, fontSize: '0.85rem', color: '#555' }}>Category</th>
                            <th style={{ padding: '12px 8px', fontWeight: 700, fontSize: '0.85rem', color: '#555' }}>Price</th>
                            <th style={{ padding: '12px 8px', fontWeight: 700, fontSize: '0.85rem', color: '#555' }}>Status</th>
                            <th style={{ padding: '12px 8px', fontWeight: 700, fontSize: '0.85rem', color: '#555' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr> :
                        items.map(item => (
                            <tr key={item._id} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: '12px 15px', fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-word', overflow: 'hidden' }}>
                                    {item.name}
                                </td>
                                <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#555', textTransform: 'capitalize' }}>{item.category}</td>
                                <td style={{ padding: '12px 8px', fontSize: '0.85rem', fontWeight: 700 }}>₹{item.category === 'pizza' ? (item.prices?.medium || item.price) : item.price}</td>
                                <td style={{ padding: '12px 8px', fontSize: '0.82rem' }}>{item.isAvailable ? '✅ Stock' : '❌ Out'}</td>
                                <td style={{ padding: '12px 8px' }}>
                                    {item.isSeasonalModel ? (
                                        <span style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>Offers Panel</span>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openEditor(item)} style={{ background: '#e3f2fd', color: '#1976d2', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}><i className="fas fa-edit"></i></button>
                                            <button onClick={() => setItemToDelete(item)} style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}><i className="fas fa-trash"></i></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Editor Modal */}
            {isEditing && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>{currentItem ? 'Edit Item' : 'New Item'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Category</label>
                                    <select value={isCustomCategory ? 'custom' : formData.category} onChange={e => {
                                        if(e.target.value === 'custom') { setIsCustomCategory(true); setFormData({...formData, category: ''}); }
                                        else { setIsCustomCategory(false); setFormData({...formData, category: e.target.value}); }
                                    }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="pizza">Pizza</option>
                                        <option value="burger">Burger</option>
                                        <option value="wrap">Wrap</option>
                                        <option value="sandwich">Sandwich</option>
                                        <option value="side">Sides/Drinks</option>
                                        <option value="custom">Create New...</option>
                                    </select>
                                    {isCustomCategory && <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Category name..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #B71C1C', marginTop: '10px' }} />}
                                </div>
                                <div className="form-group">
                                    <label>Availability</label>
                                    <select value={formData.isAvailable ? 'true' : 'false'} onChange={e => setFormData({...formData, isAvailable: e.target.value === 'true'})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                        <option value="true">In Stock</option>
                                        <option value="false">Out of Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Image</label>
                                <div onClick={() => document.getElementById('file-up').click()} style={{ border: '2px dashed #ddd', padding: '20px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', background: '#fcfcfc' }}>
                                    {uploadingImage ? 'Uploading...' : formData.image ? <img 
                                        src={getImgSrc(formData.image)} 
                                        style={{ height: '100px', borderRadius: '8px' }} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=100'; }}
                                    /> : 'Click to upload image'}
                                    <input type="file" id="file-up" style={{ display: 'none' }} onChange={handleImageUpload} />
                                </div>
                                <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="Or enter URL/path here" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee', marginTop: '8px', fontSize: '0.8rem' }} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Description</label>
                                <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>

                            {formData.category === 'pizza' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    <div><label>Small</label><input type="number" value={formData.prices?.small} onChange={e => setFormData({...formData, prices: {...formData.prices, small: e.target.value}})} style={{ width: '100%', padding: '8px' }} /></div>
                                    <div><label>Medium</label><input type="number" value={formData.prices?.medium} onChange={e => setFormData({...formData, prices: {...formData.prices, medium: e.target.value}})} style={{ width: '100%', padding: '8px' }} /></div>
                                    <div><label>Large</label><input type="number" value={formData.prices?.large} onChange={e => setFormData({...formData, prices: {...formData.prices, large: e.target.value}})} style={{ width: '100%', padding: '8px' }} /></div>
                                </div>
                            ) : (
                                <div><label>Price</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '10px' }} /></div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save Item</button>
                                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {itemToDelete && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
                        <h3>Delete {itemToDelete.name}?</h3>
                        <p>This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '10px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                            <button onClick={() => setItemToDelete(null)} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManager;
