import API_URL from '../apiConfig';
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
        // Admin/staff/users who already used the offer → skip
        if (user && (user.hasUsedWelcomeOffer || user.role === 'admin' || user.role === 'staff')) {
            return;
        }

        // Show at most ONCE per browser session (prevents double popup)
        if (sessionStorage.getItem('welcome_popup_shown')) return;

        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const visRes = await fetch(`${API_URL}/api/admin/settings/show_welcome_popup`);
            const visData = await visRes.json();
            if (visData.success && visData.data?.value === 'false') return;

            const res = await fetch(`${API_URL}/api/admin/settings/new_user_discount`);
            const data = await res.json();
            if (data.success && data.data) {
                setDiscount(data.data.value);
            }
            // Mark shown for this session
            sessionStorage.setItem('welcome_popup_shown', '1');
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
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                <div className="popup-inner">
                    <span className="badge">🔥 First Order Offer</span>
                    <h2>Hungry? Save Big!</h2>
                    <div className="discount-circle">
                        <span className="percent">{discount}%</span>
                        <span className="off">OFF</span>
                    </div>
                    <div className="coupon-reveal-box">
                        <p>USE COUPON CODE:</p>
                        <strong>WELCOME{discount}</strong>
                    </div>
                    <p className="popup-tagline">On your first order today!</p>
                    <button className="claim-btn" onClick={handleClaim}>ORDER NOW</button>
                    <p className="terms">*T&C Apply. Applicable on minimum order of ₹300.</p>
                </div>
            </div>
        </div>
    );
};

export default OfferPopup;
