import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './OfferPopup.css';

const OfferPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [discount, setDiscount] = useState(20);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        // If user is logged in and has already used the offer, or is staff/admin, don't show it
        if (user && (user.hasUsedWelcomeOffer || user.role === 'admin' || user.role === 'staff')) {
            return;
        }

        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            // Check visibility first
            const visRes = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings/show_welcome_popup');
            const visData = await visRes.json();
            if (visData.success && visData.data?.value === 'false') return;

            // Get discount
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings/new_user_discount');
            const data = await res.json();
            if (data.success && data.data) {
                setDiscount(data.data.value);
            }
            setIsOpen(true);
        } catch (error) {
            console.log("OfferPopup settings fail", error);
        }
    };

    const handleClaim = () => {
        setIsOpen(false);
        navigate('/menu');
    };

    if (!isOpen) return null;

    return (
        <div className="popup-overlay animate-fade-in">
            <div className="popup-content animate-zoom-in">
                <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                <div className="popup-inner">
                    <span className="badge neon-pulse">First Order Offer</span>
                    <h2 style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Hungry? Save Big!</h2>
                    <div className="discount-circle">
                        <span className="percent">{discount}%</span>
                        <span className="off">OFF</span>
                    </div>
                    <div className="coupon-reveal-box" style={{ margin: '15px 0', padding: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', border: '1px dashed #fff' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', opacity: 0.9 }}>USE COUPON CODE:</p>
                        <strong style={{ fontSize: '1.4rem', letterSpacing: '2px' }}>WELCOME{discount}</strong>
                    </div>
                    <p style={{ color: '#ffffff', opacity: 0.9 }}>On your first order today!</p>
                    <button className="claim-btn premium-btn" onClick={handleClaim}>ORDER NOW</button>
                    <p className="terms" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', marginTop: '10px' }}>*T&C Apply. Applicable on minimum order of ₹300.</p>
                </div>
            </div>
        </div>
    );
};

export default OfferPopup;
