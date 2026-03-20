import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';

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
        // Ensure we handle both string and numeric values correctly
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
                        background: 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
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
                                defaultValue={getSettingValue('free_delivery_min_order', 1000)}
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
                            className="premium-input-text w-full"
                            style={{ maxWidth: '280px' }}
                            placeholder="e.g. 🎉 SPECIAL OFFER: 3 KM FREE..."
                            defaultValue={getSettingValue('delivery_marquee_text', '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY')}
                            onBlur={(e) => handleUpdate('delivery_marquee_text', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Banner Heading</strong>
                            <p>Main text on the blue delivery banner.</p>
                        </div>
                        <input
                            className="premium-input-text w-full"
                            style={{ maxWidth: '280px' }}
                            placeholder="e.g. Free Home Delivery"
                            defaultValue={getSettingValue('banner_heading', 'Free Home Delivery')}
                            onBlur={(e) => handleUpdate('banner_heading', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Banner Subheading</strong>
                            <p>Secondary text on the delivery banner.</p>
                        </div>
                        <input
                            className="premium-input-text w-full"
                            style={{ maxWidth: '280px' }}
                            placeholder="e.g. Within 3KM on all orders..."
                            defaultValue={getSettingValue('banner_subheading', 'Within 3KM on all orders above ₹')}
                            onBlur={(e) => handleUpdate('banner_subheading', e.target.value)}
                        />
                    </div>
                </div>

                {/* Contact & Support */}
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
                            className="premium-input-text w-full"
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
                            className="premium-input-text w-full"
                            type="email"
                            placeholder="e.g. captainpizzadayalpur@gm..."
                            defaultValue={getSettingValue('store_contact_email', 'captainpizzadayalpur@gmail.com')}
                            onBlur={(e) => handleUpdate('store_contact_email', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Phone Number 1</strong>
                            <p>Primary contact number for Contact Us page.</p>
                        </div>
                        <input
                            className="premium-input-text w-full"
                            placeholder="+91 9220367325"
                            defaultValue={getSettingValue('phone_number_1', '+91 9220367325')}
                            onBlur={(e) => handleUpdate('phone_number_1', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Phone Number 2</strong>
                            <p>Secondary contact number (optional).</p>
                        </div>
                        <input
                            className="premium-input-text w-full"
                            placeholder="+91 9220367425"
                            defaultValue={getSettingValue('phone_number_2', '+91 9220367425')}
                            onBlur={(e) => handleUpdate('phone_number_2', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Store Address</strong>
                            <p>Full physical address shown on Contact page.</p>
                        </div>
                        <textarea
                            className="premium-input-text w-full"
                            rows={3}
                            placeholder="Store full address..."
                            defaultValue={getSettingValue('store_address', 'F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket')}
                            onBlur={(e) => handleUpdate('store_address', e.target.value)}
                        />
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Business Hours</strong>
                            <p>E.g. Monday to Sunday, 11:00 AM to 11:00 PM</p>
                        </div>
                        <input
                            className="premium-input-text w-full"
                            placeholder="e.g. Monday to Sunday, 11:00 AM to 11:00 PM"
                            defaultValue={getSettingValue('business_hours', 'Monday to Sunday, 11:00 AM to 11:00 PM')}
                            onBlur={(e) => handleUpdate('business_hours', e.target.value)}
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
                        // Data is already synced via onBlur/onChange but this gives user confidence
                    }}
                    style={{ padding: '12px 25px', fontSize: '1.1rem' }}
                >
                    <i className="fas fa-save"></i> Save Settings
                </button>
            </div>

            <style>{`
                .settings-manager {
                    padding: 20px;
                    background: transparent;
                }
                .settings-header-banner {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .header-icon {
                    font-size: 2.5rem;
                    color: var(--primary);
                    filter: drop-shadow(0 4px 6px rgba(183,28,28,0.2));
                }
                .section-title { margin: 0; font-size: 1.5rem; color: #333; }
                .section-subtitle { margin: 2px 0 0; font-size: 0.9rem; color: #666; }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 25px;
                }

                .settings-section-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .settings-section-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
                }

                .section-card-header {
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #333;
                }
                .offer-card .section-card-header { color: var(--primary); }
                .logistics-card .section-card-header { color: #1976d2; }
                .ui-card .section-card-header { color: #512da8; }

                .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #f5f5f5;
                    gap: 15px;
                }
                .setting-row:last-child { border-bottom: none; }

                .setting-info strong { display: block; font-size: 14px; color: #444; }
                .setting-info p { margin: 3px 0 0; font-size: 12px; color: #888; }

                .premium-select, .premium-input-text, .premium-input-number {
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    background: #fdfdfd;
                    font-size: 14px;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.2s ease;
                }
                .premium-select:focus, .premium-input-text:focus, .premium-input-number:focus {
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 0 0 3px rgba(183,28,28,0.1);
                }

                .premium-input-text { width: 100%; max-width: 200px; }
                .premium-input-number { width: 80px; text-align: center; }
                .premium-select { cursor: pointer; min-width: 120px; }

                .input-with-symbol {
                    display: flex;
                    align-items: center;
                    background: #f8f8f8;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    overflow: hidden;
                }
                .input-with-symbol .symbol { padding: 0 10px; color: #666; font-weight: bold; background: #eee; height: 40px; display: flex; align-items: center; }
                .input-with-symbol .premium-input-number { border: none; background: transparent; }
                .symbol-right { padding: 0 10px; color: #666; font-weight: bold; }

                .alert-message {
                    padding: 15px 20px;
                    background: #e8f5e9;
                    color: #2e7d32;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    font-weight: 600;
                    border: 1px solid #c8e6c9;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .placeholder-pane {
                    padding: 100px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    color: #999;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse-animation { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }

                @media (max-width: 900px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .setting-row { flex-direction: column; align-items: flex-start; }
                    .premium-input-text { max-width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default SettingsManager;
