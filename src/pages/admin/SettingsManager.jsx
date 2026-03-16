import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';
import API_URL from '../../apiConfig';

const SettingsManager = () => {
    const { user } = useContext(AuthContext);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setErrorMsg('');
            const res = await api.get('/api/admin/settings');
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setErrorMsg('Failed to load settings from server.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        try {
            setMessage('');
            setErrorMsg('');
            const res = await api.put(`/api/admin/settings/${key}`, { value });
            if (res.data.success) {
                setMessage(`Setting "${key}" updated!`);
                setTimeout(() => setMessage(''), 3000);
                // Update local state without full reload
                setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));

                // If the key wasn't in state, we might need a fetch once
                if (!settings.find(s => s.key === key)) fetchSettings();
            }
        } catch (error) {
            setErrorMsg(`Update failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const getSettingValue = (key, defaultValue) => {
        const s = settings.find(item => item.key === key);
        return (s && s.value !== undefined) ? s.value : defaultValue;
    };

    if (loading) return (
        <div className="placeholder-pane">
            <div className="loading-spinner"></div>
            <p>Syncing secure system settings...</p>
        </div>
    );

    return (
        <div className="settings-manager card-style animate-fade-in">
            <div className="settings-header-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <i className="fas fa-tools header-icon"></i>
                    <div>
                        <h3 className="section-title">Global System Configuration</h3>
                        <p className="section-subtitle">Manage store offers, logistics, and user experience</p>
                    </div>
                </div>
                <button
                    onClick={fetchSettings}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                    }}
                >
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>

            {message && (
                <div className="alert-message pulse-animation">
                    <i className="fas fa-check-circle"></i> {message}
                </div>
            )}

            {errorMsg && (
                <div className="alert-message" style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' }}>
                    <i className="fas fa-exclamation-triangle"></i> {errorMsg}
                </div>
            )}

            <div className="settings-grid">
                {/* Logistics & Charges */}
                <div className="settings-section-card logistics-card">
                    <div className="section-card-header">
                        <i className="fas fa-truck"></i> Delivery & Logistics
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Standard Delivery Charge</strong>
                            <p>Flat fee for low-value orders.</p>
                        </div>
                        <div className="input-with-symbol">
                            <span className="symbol">Rs.</span>
                            <input
                                type="number"
                                className="premium-input-number"
                                defaultValue={getSettingValue('delivery_charge', 40)}
                                onBlur={(e) => handleUpdate('delivery_charge', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Free Delivery Threshold</strong>
                            <p>Min order for free delivery.</p>
                        </div>
                        <div className="input-with-symbol">
                            <span className="symbol">Rs.</span>
                            <input
                                type="number"
                                className="premium-input-number"
                                defaultValue={getSettingValue('free_delivery_min_order', 300)}
                                onBlur={(e) => handleUpdate('free_delivery_min_order', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Delivery Marquee Text</strong>
                            <p>Scrolling text banner on the homepage.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            style={{ maxWidth: '300px' }}
                            placeholder="e.g. 🎉 SPECIAL OFFER: FREE DELIVERY!"
                            defaultValue={getSettingValue('delivery_marquee_text', '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY ON MINIMUM ORDER OF ₹300! 🚚 ORDER NOW!')}
                            onBlur={(e) => handleUpdate('delivery_marquee_text', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Banner Heading</strong>
                            <p>Main text on the blue delivery banner.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            style={{ maxWidth: '300px' }}
                            placeholder="e.g. Free Home Delivery"
                            defaultValue={getSettingValue('delivery_banner_heading', 'Free Home Delivery')}
                            onBlur={(e) => handleUpdate('delivery_banner_heading', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Banner Subheading</strong>
                            <p>Secondary text on the delivery banner.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            style={{ maxWidth: '300px' }}
                            placeholder="e.g. Within 3KM on all orders above ₹300"
                            defaultValue={getSettingValue('delivery_banner_subheading', 'Within 3KM on all orders above ₹300')}
                            onBlur={(e) => handleUpdate('delivery_banner_subheading', e.target.value)}
                        />
                    </div>
                </div>

                {/* Promotions & Seasonal Hero */}
                <div className="settings-section-card promo-card">
                    <div className="section-card-header">
                        <i className="fas fa-bullhorn"></i> Promotions & Seasonal Hero
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Seasonal Offer Toggle</strong>
                            <p>Enable or disable the main hero offer.</p>
                        </div>
                        <select 
                            className="premium-select"
                            defaultValue={getSettingValue('seasonal_offer_enabled', 'false')}
                            onChange={(e) => handleUpdate('seasonal_offer_enabled', e.target.value)}
                        >
                            <option value="true">Show Offer</option>
                            <option value="false">Hide Offer</option>
                        </select>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Hero Image (Seasonal)</strong>
                            <p>Banner shown in the home hero section.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {getSettingValue('seasonal_offer_image', '') && (
                                <img 
                                    src={getSettingValue('seasonal_offer_image', '').startsWith('/uploads') ? `${API_URL}${getSettingValue('seasonal_offer_image', '')}` : getSettingValue('seasonal_offer_image', '')} 
                                    alt="Hero Preview" 
                                    style={{ width: '100px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ddd' }} 
                                />
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    try {
                                        const res = await api.post('/api/upload', formData);
                                        if (res.data.url) {
                                            handleUpdate('seasonal_offer_image', res.data.url);
                                        }
                                    } catch (err) {
                                        setErrorMsg("Image upload failed.");
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Offer Title</strong>
                            <p>Heading text for the hero offer.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            defaultValue={getSettingValue('seasonal_offer_title', 'Special Offer')}
                            onBlur={(e) => handleUpdate('seasonal_offer_title', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Offer Description</strong>
                            <p>Subtext explaining the promo.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            defaultValue={getSettingValue('seasonal_offer_desc', 'Grab your favorite pizzas!')}
                            onBlur={(e) => handleUpdate('seasonal_offer_desc', e.target.value)}
                        />
                    </div>
                    
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>New User Discount (%)</strong>
                            <p>Default discount for welcome popup.</p>
                        </div>
                        <input
                            type="number"
                            className="premium-input-number"
                            defaultValue={getSettingValue('new_user_discount', 20)}
                            onBlur={(e) => handleUpdate('new_user_discount', Number(e.target.value))}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Badge Text</strong>
                            <p>Badge shown on the hero (e.g. HOT DEAL).</p>
                        </div>
                        <input
                            className="premium-input-text"
                            defaultValue={getSettingValue('hot_deal_badge_text', 'HOT DEAL')}
                            onBlur={(e) => handleUpdate('hot_deal_badge_text', e.target.value)}
                        />
                    </div>
                </div>

                {/* Support & Contact */}
                <div className="settings-section-card contact-card">
                    <div className="section-card-header">
                        <i className="fas fa-headset"></i> Store Contact & WhatsApp
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Admin WhatsApp Number</strong>
                            <p>Format: 91XXXXXXXXXX.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            placeholder="e.g. 919220367325"
                            defaultValue={getSettingValue('admin_whatsapp_number', '919220367325')}
                            onBlur={(e) => handleUpdate('admin_whatsapp_number', e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Store Contact Email</strong>
                            <p>For support notifications.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            type="email"
                            placeholder="e.g. admin@captainpizza.com"
                            defaultValue={getSettingValue('store_contact_email', 'admin@captainpizza.com')}
                            onBlur={(e) => handleUpdate('store_contact_email', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Phone Number 1</strong>
                            <p>Primary contact number for Contact Us page.</p>
                        </div>
                        <input
                            className="premium-input-text"
                            placeholder="+91 XXXXXXXXXX"
                            defaultValue={getSettingValue('store_phone_1', '+91 9220367325')}
                            onBlur={(e) => handleUpdate('store_phone_1', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Phone Number 2</strong>
                            <p>Secondary contact number (optional).</p>
                        </div>
                        <input
                            className="premium-input-text"
                            placeholder="+91 XXXXXXXXXX"
                            defaultValue={getSettingValue('store_phone_2', '+91 9220367425')}
                            onBlur={(e) => handleUpdate('store_phone_2', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Store Address</strong>
                            <p>Full physical address shown on Contact page.</p>
                        </div>
                        <textarea
                            className="premium-input-text"
                            style={{ maxWidth: '300px', height: '60px', resize: 'none' }}
                            placeholder="e.g. F-11 Main Road Dayalpur..."
                            defaultValue={getSettingValue('store_address', 'F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket, Near Hero Bike Showroom\nNew Delhi, Delhi - 110094 (India)')}
                            onBlur={(e) => handleUpdate('store_address', e.target.value)}
                        ></textarea>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Business Hours</strong>
                            <p>E.g. Monday to Sunday, 11:00 AM to 11:00 PM</p>
                        </div>
                        <input
                            className="premium-input-text"
                            style={{ maxWidth: '300px' }}
                            defaultValue={getSettingValue('store_hours', 'Monday to Sunday, 11:00 AM to 11:00 PM')}
                            onBlur={(e) => handleUpdate('store_hours', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="settings-footer" style={{ marginTop: '30px', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setMessage("All Settings Saved Successfully!");
                        setTimeout(() => setMessage(''), 3000);
                    }}
                    style={{ padding: '12px 25px', fontSize: '1.1rem' }}
                >
                    <i className="fas fa-save"></i> Save Settings
                </button>
            </div>

            <style>{`
                .settings-manager { padding: 20px; background: transparent; }
                .settings-header-banner { margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .header-icon { font-size: 2.5rem; color: var(--primary); }
                .section-title { margin: 0; font-size: 1.5rem; color: #333; font-weight: 800; }
                .section-subtitle { margin: 2px 0 0; font-size: 0.9rem; color: #666; }

                .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; }
                .settings-section-card {
                    background: white; border-radius: 16px; padding: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05);
                }
                .section-card-header {
                    font-weight: 700; font-size: 1.1rem; margin-bottom: 20px;
                    display: flex; align-items: center; gap: 10px; color: #333;
                }
                .setting-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 15px 0; border-bottom: 1px solid #f5f5f5; gap: 15px;
                }
                .setting-row:last-child { border-bottom: none; }
                .setting-info strong { display: block; font-size: 14px; color: #444; }
                .setting-info p { margin: 3px 0 0; font-size: 12px; color: #888; }

                .premium-select, .premium-input-text, .premium-input-number {
                    padding: 10px 12px; border-radius: 8px; border: 1px solid #ddd;
                    background: #fdfdfd; font-size: 14px; font-weight: 600; outline: none;
                }
                .premium-input-text { width: 100%; max-width: 200px; }
                .premium-input-number { width: 80px; text-align: center; }

                .input-with-symbol {
                    display: flex; align-items: center; background: #f8f8f8;
                    border-radius: 8px; border: 1px solid #ddd; overflow: hidden;
                }
                .input-with-symbol .symbol { padding: 0 10px; color: #666; font-weight: bold; background: #eee; height: 40px; display: flex; align-items: center; }
                .input-with-symbol .premium-input-number { border: none; background: transparent; }

                .alert-message {
                    padding: 15px 20px; background: #e8f5e9; color: #2e7d32;
                    border-radius: 12px; margin-bottom: 25px; font-weight: 600; border: 1px solid #c8e6c9;
                }
                @media (max-width: 900px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .setting-row { flex-direction: column; align-items: flex-start; }
                }
            `}</style>
        </div>
    );
};

export default SettingsManager;
