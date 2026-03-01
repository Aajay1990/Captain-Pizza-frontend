import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SettingsManager = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings');
            if (res.data.success) {
                setSettings(res.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setLoading(false);
        }
    };

    const handleUpdate = async (key, value) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`https://pizza-backend-api-a5mm.onrender.com/api/admin/settings/${key}`, { value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMessage('Setting updated successfully!');
                setTimeout(() => setMessage(''), 3000);
                fetchSettings();
            }
        } catch (error) {
            setMessage('Error updating setting.');
        }
    };

    const getSettingValue = (key, defaultValue) => {
        const s = settings.find(item => item.key === key);
        return s ? s.value : defaultValue;
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="settings-manager card-style">
            <h3 className="section-title">System Settings</h3>
            {message && <div className="alert-message">{message}</div>}

            <div className="settings-grid">
                <div className="setting-item">
                    <div className="setting-info">
                        <h4>New User Discount (%)</h4>
                        <p>Controls the percentage shown in the welcome popup.</p>
                    </div>
                    <div className="setting-action">
                        <input
                            type="number"
                            defaultValue={getSettingValue('new_user_discount', 20)}
                            onBlur={(e) => handleUpdate('new_user_discount', Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <h4>Show Welcome Popup</h4>
                        <p>Enable/Disable the discount popup for visitors.</p>
                    </div>
                    <div className="setting-action">
                        <select
                            defaultValue={getSettingValue('show_welcome_popup', 'true')}
                            onChange={(e) => handleUpdate('show_welcome_popup', e.target.value)}
                        >
                            <option value="true">Enable</option>
                            <option value="false">Disable</option>
                        </select>
                    </div>
                </div>
            </div>

            <style>{`
                .settings-grid { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
                .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #f8f9fa; border-radius: 12px; }
                .setting-info h4 { margin: 0; color: #B71C1C; }
                .setting-info p { margin: 5px 0 0; font-size: 14px; color: #666; }
                .setting-action input, .setting-action select { padding: 10px; border-radius: 8px; border: 1px solid #ddd; width: 100px; font-weight: bold; }
                .alert-message { padding: 10px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
            `}</style>
        </div>
    );
};

export default SettingsManager;
