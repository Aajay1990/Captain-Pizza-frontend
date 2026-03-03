import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const FloatingActions = () => {
    const { cartCount } = useContext(CartContext);
    const location = useLocation();

    // Hide on admin and staff routes
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isPosRoute = location.pathname.startsWith('/pos');

    if (isAdminRoute || isPosRoute) return null;

    return (
        <>
            <a
                href="https://wa.me/919220367325"
                target="_blank"
                rel="noopener noreferrer"
                className="floating-whatsapp animate-pulse-whatsapp"
                aria-label="Contact on WhatsApp"
            >
                <i className="fab fa-whatsapp"></i>
            </a>

            <Link to="/order" className="floating-cart-bucket" aria-label="Go to Checkout">
                <div className="cart-bucket-icon">
                    <i className="fas fa-shopping-cart"></i>
                </div>
                {cartCount > 0 && (
                    <span className="cart-bucket-count">{cartCount}</span>
                )}
            </Link>
        </>
    );
};

export default FloatingActions;
