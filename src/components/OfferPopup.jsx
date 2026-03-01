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
            setIsOpen(false);
            return;
        }

        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings/new_user_discount');
            const data = await res.json();
            if (data.success && data.data) {
                setDiscount(data.data.value);
            }
            setIsOpen(true);
        } catch (error) {
            setIsOpen(true); // Show default 20% on error
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
                    <span className="badge">Limited Offer</span>
                    <h2>Special Welcome!</h2>
                    <div className="discount-circle">
                        <span className="percent">{discount}%</span>
                        <span className="off">OFF</span>
                    </div>
                    <p style={{ color: '#ffffff' }}>On your first order today!</p>
                    <button className="claim-btn" onClick={handleClaim}>Claim Now</button>
                    <p className="terms" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Available on all pizza varieties.</p>
                </div>
            </div>
        </div>
    );
};

export default OfferPopup;
