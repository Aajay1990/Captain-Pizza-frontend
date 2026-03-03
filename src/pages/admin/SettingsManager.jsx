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
                setSettings(prev => {
                    const exists = prev.find(s => s.key === key);
                    if (exists) {
                        return prev.map(s => s.key === key ? { ...s, value } : s);
                    } else {
                        return [...prev, { key, value }];
                    }
                });
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
            <div className="settings-header-banner">
                <i className="fas fa-tools header-icon"></i>
                <div>
                    <h3 className="section-title">Global System Configuration</h3>
                    <p className="section-subtitle">Manage store offers, logistics, and payments</p>
                </div>
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
                            <span className="symbol">₹</span>
                            <input
                                type="number"
                                className="premium-input-number"
                                value={getSettingValue('delivery_charge', 40)}
                                onChange={(e) => setSettings(prev => prev.map(s => s.key === 'delivery_charge' ? { ...s, value: Number(e.target.value) } : s))}
                                onBlur={(e) => handleUpdate('delivery_charge', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Free Delivery Threshold</strong>
                            <p>Min order for ₹0 Delivery.</p>
                        </div>
                        <div className="input-with-symbol">
                            <span className="symbol">₹</span>
                            <input
                                type="number"
                                className="premium-input-number"
                                value={getSettingValue('free_delivery_min_order', 300)}
                                onChange={(e) => setSettings(prev => prev.map(s => s.key === 'free_delivery_min_order' ? { ...s, value: Number(e.target.value) } : s))}
                                onBlur={(e) => handleUpdate('free_delivery_min_order', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* UI Experience */}
                <div className="settings-section-card ui-card">
                    <div className="section-card-header">
                        <i className="fas fa-eye"></i> Visual Experience
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Welcome Discount %</strong>
                            <p>Coupon: <strong>WELCOME{getSettingValue('new_user_discount', 20)}</strong></p>
                        </div>
                        <div className="input-with-symbol">
                            <input
                                type="number"
                                className="premium-input-number"
                                value={getSettingValue('new_user_discount', 20)}
                                onChange={(e) => setSettings(prev => prev.map(s => s.key === 'new_user_discount' ? { ...s, value: Number(e.target.value) } : s))}
                                onBlur={(e) => handleUpdate('new_user_discount', Number(e.target.value))}
                            />
                            <span className="symbol-right">%</span>
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Floating Popup Status</strong>
                            <p>Show welcome offer to new visitors.</p>
                        </div>
                        <select
                            className="premium-select"
                            value={getSettingValue('show_welcome_popup', 'true')}
                            onChange={(e) => handleUpdate('show_welcome_popup', e.target.value)}
                        >
                            <option value="true">Visible</option>
                            <option value="false">Hidden</option>
                        </select>
                    </div>
                </div>

                {/* Payment Configuration */}
                <div className="settings-section-card payment-card">
                    <div className="section-card-header" style={{ color: '#2e7d32' }}>
                        <i className="fas fa-credit-card"></i> Payment Settings (Razorpay)
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Razorpay Key ID</strong>
                            <p>Your Public API Key (Required for online payments).</p>
                        </div>
                        <input
                            type="text"
                            className="premium-input-text"
                            placeholder="rzp_test_..."
                            value={getSettingValue('razorpay_key_id', '')}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSettings(prev => {
                                    const exists = prev.find(s => s.key === 'razorpay_key_id');
                                    if (exists) return prev.map(s => s.key === 'razorpay_key_id' ? { ...s, value: val } : s);
                                    return [...prev, { key: 'razorpay_key_id', value: val }];
                                });
                            }}
                            onBlur={(e) => handleUpdate('razorpay_key_id', e.target.value)}
                            style={{ maxWidth: '250px' }}
                        />
                    </div>

                    <div className="setting-row">
                        <p style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                            Note: The Secret Key must be added to the server's .env file for security.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .settings-manager { padding: 20px; }
                .settings-header-banner { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .header-icon { font-size: 2.5rem; color: var(--primary); }
                .section-title { margin: 0; font-size: 1.5rem; }
                .section-subtitle { margin: 2px 0 0; font-size: 0.9rem; color: #666; }
                .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; }
                .settings-section-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); }
                .section-card-header { font-weight: 700; font-size: 1.1rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
                .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f5f5f5; gap: 15px; }
                .setting-row:last-child { border-bottom: none; }
                .setting-info strong { display: block; font-size: 14px; }
                .setting-info p { margin: 3px 0 0; font-size: 12px; color: #888; }
                .premium-select, .premium-input-text, .premium-input-number { padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
                .premium-input-number { width: 80px; text-align: center; }
                .input-with-symbol { display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
                .input-with-symbol .symbol { padding: 10px; background: #eee; }
                .alert-message { padding: 15px; background: #e8f5e9; color: #2e7d32; border-radius: 12px; margin-bottom: 20px; }
                .loading-spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default SettingsManager;
