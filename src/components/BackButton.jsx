import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

const BackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Do not show back button on Home, Admin Login, or Staff Login
    if (location.pathname === '/' || location.pathname === '/admin-login' || location.pathname === '/staff-login') {
        return null;
    }

    return (
        <button className="universal-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={24} color="var(--primary, #B71C1C)" strokeWidth={3} />
        </button>
    );
};

export default BackButton;
