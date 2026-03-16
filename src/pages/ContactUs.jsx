import React, { useState, useEffect } from 'react';
import './Legal.css';
import { api } from '../context/AuthContext';

const ContactUs = () => {
    const [settings, setSettings] = useState({
        address: 'F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket, Near Hero Bike Showroom\nNew Delhi, Delhi - 110094 (India)',
        phone1: '+91 9220367325',
        phone2: '+91 9220367425',
        email: 'support@captainpizza.in',
        hours: 'Monday to Sunday, 11:00 AM to 11:00 PM'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/admin/settings');
                if (res.data.success) {
                    const data = res.data.data;
                    const findVal = (key, def) => data.find(s => s.key === key)?.value || def;

                    setSettings({
                        address: findVal('store_address', 'F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket, Near Hero Bike Showroom\nNew Delhi, Delhi - 110094 (India)'),
                        phone1: findVal('store_phone_1', '+91 9220367325'),
                        phone2: findVal('store_phone_2', '+91 9220367425'),
                        email: findVal('store_contact_email', 'support@captainpizza.in'),
                        hours: findVal('store_hours', 'Monday to Sunday, 11:00 AM to 11:00 PM')
                    });
                }
            } catch (e) { console.error("Could not fetch store settings", e); }
        };
        fetchSettings();
    }, []);

    return (
        <div className="legal-page-container">
            <h1 className="legal-title">Contact Us</h1>
            <div className="legal-content">
                <p>We would love to hear from you! If you have any questions, feedback, or need assistance with your order, please do not hesitate to contact us using the details below.</p>

                <div className="contact-info-card">
                    <h3>Operational Address</h3>
                    {settings.address.split('\n').map((line, i) => <p key={i}>{line}</p>)}

                    <h3>Phone Number</h3>
                    <p>{settings.phone1}</p>
                    {settings.phone2 && <p>{settings.phone2}</p>}

                    <h3>Email Address</h3>
                    <p>{settings.email}</p>
                </div>

                <p className="mt-3"><strong>Business Hours:</strong> {settings.hours}</p>
            </div>
        </div>
    );
};

export default ContactUs;
