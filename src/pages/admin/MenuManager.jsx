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

    // Lock background scroll when any modal open
    useEffect(() => {
        const adminMain = document.querySelector('.admin-main');
        const lockScroll = isEditing || itemToDelete || isRenamingCategory;

        if (lockScroll) {
            if (adminMain) adminMain.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            if (adminMain) adminMain.style.overflow = 'auto';
            document.body.style.overflow = 'unset';
        }
        return () => {
            if (adminMain) adminMain.style.overflow = 'auto';
            document.body.style.overflow = 'unset';
        };
    }, [isEditing, itemToDelete]);

    // Initial Form State
    const defaultFormState = {
        name: '', category: 'pizza', subCategory: '', desc: '', price: '',
        prices: { small: '', medium: '', large: '' }, image: ''
    };
    const [formData, setFormData] = useState(defaultFormState);

    // Fetch complete database load
    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('${API_URL}/api/menu?all=true');
            const result = await res.json();
            if (result.success) {
                setItems(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch menu items", error);
        } finally {
            // Keep spinner for at least 600ms for visual comfort
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 600);
        }
    };

    const handleRenameCategory = async (e) => {
        e.preventDefault();
        if (!catRenameData.oldName || !catRenameData.newName) return;

        try {
            const res = await fetch('${API_URL}/api/menu/category-rename', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catRenameData)
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setIsRenamingCategory(false);
                setCatRenameData({ oldName: '', newName: '' });
                fetchMenu();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Error renaming category");
        }
    };

    // Open/Close Modal
    const openEditor = (item = null) => {
        const defaultCats = ['pizza', 'burger', 'wrap', 'sandwich', 'side'];
        if (item) {
            setFormData(item);
            setIsCustomCategory(!defaultCats.includes(item.category));
        } else {
            setFormData(defaultFormState);
            setIsCustomCategory(false);
        }
        setIsEditing(true);
        setCurrentItem(item);
    };

    const closeEditor = () => {
        setIsEditing(false);
        setCurrentItem(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataFile = new FormData();
        formDataFile.append('image', file);
        setUploadingImage(true);

        try {
            const res = await fetch('${API_URL}/api/upload', {
                method: 'POST',
                body: formDataFile
            });
            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.image }));
            } else {
                alert(result.message || 'Image upload failed');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload image. Please ensure backend is running.');
        } finally {
            setUploadingImage(false);
            e.target.value = null; // Reset input
        }
    };

    // Generic Request Handler
    const handleSave = async (e) => {
        e.preventDefault();

        const method = currentItem ? 'PUT' : 'POST';
        const url = currentItem ? `${API_URL}/api/menu/${currentItem._id}` : '${API_URL}/api/menu';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.success) {
                fetchMenu();
                closeEditor();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error saving item");
        }
    };

    const initiateDelete = (item) => {
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const res = await fetch(`${API_URL}/api/menu/${itemToDelete._id}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (result.success) {
                fetchMenu();
            }
        } catch (error) {
            alert("Error deleting item");
            console.error(error);
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <div className="menu-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Database Menu Items</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={fetchMenu}
                        disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2b2b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', opacity: refreshing ? 0.7 : 1 }}
                    >
                        <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            const uniqueCats = [...new Set(items.map(i => i.category))];
                            setCatRenameData({ oldName: uniqueCats[0] || '', newName: '' });
                            setIsRenamingCategory(true);
                        }}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        <i className="fas fa-tags"></i> Edit Categories
                    </button>
                    <button className="btn-primary" onClick={() => openEditor()}>
                        <i className="fas fa-plus"></i> Add New Item
                    </button>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Base Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading database records...</td></tr>}
                        {!loading && items.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No items in database yet. Add some to get started!</td></tr>}

                        {items.map(item => (
                            <tr key={item._id}>
                                <td><strong>{item.name}</strong></td>
                                <td><span style={{ textTransform: 'capitalize', padding: '5px 10px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '15px', fontSize: '0.8rem' }}>{item.category}</span></td>
                                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }}>{item.desc || '—'}</td>
                                <td>₹{item.category === 'pizza' ? item.prices?.medium || '-' : item.price}</td>
                                <td>{item.isAvailable ? <span style={{ color: 'green' }}><i className="fas fa-check-circle"></i> In Stock</span> : <span style={{ color: 'red' }}><i className="fas fa-times-circle"></i> Out</span>}</td>
                                <td style={{ display: 'flex', gap: '15px' }}>
                                    <button className="action-btn edit" onClick={() => openEditor(item)} title="Edit"><i className="fas fa-edit"></i></button>
                                    <button className="action-btn delete" onClick={() => initiateDelete(item)} title="Delete"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Editing Modal UI Overlay */}
            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-scale">
                        <h3 className="section-title">{currentItem ? `Edit Database Item: ${currentItem.name}` : 'Add New Menu Item'}</h3>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={isCustomCategory ? 'custom' : formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') {
                                                setIsCustomCategory(true);
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setIsCustomCategory(false);
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                        required={!isCustomCategory}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                    >
                                        {/* Standard categories */}
                                        <optgroup label="Standard Categories">
                                            <option value="pizza">🍕 Pizza</option>
                                            <option value="burger">🍔 Burger</option>
                                            <option value="wrap">🌯 Wrap</option>
                                            <option value="sandwich">🥪 Sandwich</option>
                                            <option value="side">🍟 Side Order / Drink</option>
                                        </optgroup>
                                        {/* Existing custom DB categories */}
                                        {(() => {
                                            const defaultCats = ['pizza', 'burger', 'wrap', 'sandwich', 'side'];
                                            const customCats = [...new Set(items.map(i => i.category).filter(c => !defaultCats.includes(c.toLowerCase())))];
                                            if (customCats.length === 0) return null;
                                            return (
                                                <optgroup label="Your Custom Categories">
                                                    {customCats.map(cat => (
                                                        <option key={cat} value={cat}>📁 {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })()}
                                        <optgroup label="Other">
                                            <option value="custom">✏️ Create New Category...</option>
                                        </optgroup>
                                    </select>

                                    {isCustomCategory && (
                                        <input
                                            type="text"
                                            placeholder="Type new category name..."
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #B71C1C', marginTop: '10px', boxSizing: 'border-box' }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Pizza Sub Category for Custom Tabs mapping */}
                            {formData.category === 'pizza' && (
                                <div className="form-group">
                                    <label>Pizza Sub-Category (e.g. Simple Veg, Premium Non-Veg)</label>
                                    <input type="text" value={formData.subCategory || ''} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Image Filename / URL</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="text" value={formData.image || ''} onChange={(e) => setFormData({ ...formData, image: e.target.value })} style={{ flex: 1 }} placeholder="Enter URL or filename..." />
                                    <label className="btn-secondary" style={{ padding: '10px 15px', cursor: 'pointer', margin: 0, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.9rem' }}>
                                        <i className="fas fa-upload"></i> Browse...
                                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '5px', display: 'block' }}>Uploading Please Wait...</span>}
                            </div>

                            <div className="form-group">
                                <label>Short Description</label>
                                <input type="text" value={formData.desc || ''} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} />
                            </div>

                            {formData.category === 'pizza' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                                    <div className="form-group">
                                        <label>Small Price</label>
                                        <input type="number" value={formData.prices?.small || ''} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, small: e.target.value } })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Medium Price</label>
                                        <input type="number" value={formData.prices?.medium || ''} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, medium: e.target.value } })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Large Price</label>
                                        <input type="number" value={formData.prices?.large || ''} onChange={(e) => setFormData({ ...formData, prices: { ...formData.prices, large: e.target.value } })} required />
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Unified Regular Price (₹)</label>
                                    <input type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isAvailable !== false} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} />
                                    Currently In Stock
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={closeEditor} style={{ padding: '8px 15px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '8px 25px' }}>{currentItem ? 'Update Item' : 'Add to Database'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal-content animate-fade-scale">
                        <i className="fas fa-exclamation-triangle"></i>
                        <h3 className="section-title">Delete Menu Item</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                            Are you sure you want to permanently delete <strong>{itemToDelete.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button type="button" className="action-btn" onClick={() => setItemToDelete(null)} style={{ padding: '10px 20px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 'bold' }}>Cancel</button>
                            <button type="button" className="btn-danger" onClick={confirmDelete}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Rename Modal */}
            {isRenamingCategory && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-scale">
                        <h3 className="section-title">Bulk Rename Category</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Choose an existing category and enter its new name. All items in this category will be updated.
                        </p>
                        <form onSubmit={handleRenameCategory}>
                            <div className="form-group">
                                <label>Old Category Name</label>
                                <select
                                    className="premium-select"
                                    value={catRenameData.oldName}
                                    onChange={(e) => setCatRenameData({ ...catRenameData, oldName: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                >
                                    {[...new Set(items.map(i => i.category))].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '15px' }}>
                                <label>New Category Name</label>
                                <input
                                    type="text"
                                    className="premium-input-text"
                                    placeholder="e.g. Italian Crusts"
                                    value={catRenameData.newName}
                                    onChange={(e) => setCatRenameData({ ...catRenameData, newName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions" style={{ marginTop: '25px' }}>
                                <button type="button" className="action-btn" onClick={() => setIsRenamingCategory(false)} style={{ padding: '8px 15px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '8px 25px' }}>Rename All Items</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManager;
