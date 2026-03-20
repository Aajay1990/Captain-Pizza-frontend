import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount, isIconAnimating, setIsCartOpen } = useContext(CartContext);
    const { user, logoutAuth } = useContext(AuthContext);

    const closeMenu = () => setIsMenuOpen(false);
    const showBack = location.pathname !== '/';

    // Admin and staff do NOT appear in public navbar
    // They access their panels via direct URL (/admin or /pos) after login
    const isPublicUser = !user || user.role === 'customer' || user.role === 'user';

    return (
        <>
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand-group" style={{ display: 'flex', alignItems: 'center' }}>
                    {showBack && (
                        <button className="nav-back-btn" onClick={() => { navigate(-1); setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 10); }} title="Go back">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    )}
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        <img src={logo} alt="Captain Pizza Logo" className="logo-img" />
                        Captain Pizza
                    </Link>
                </div>

                <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <i className={isMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                </div>

                <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
                    <li className="nav-item">
                        <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/menu" className="nav-link" onClick={closeMenu}>Menu</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/order-history" className="nav-link" onClick={closeMenu}>Track Order</Link>
                    </li>

                    {/* Cart Icon removed as per request */}

                    {user && (user.role === 'admin' || user.role === 'staff' || user.role === 'pos') && (
                        <li className="nav-item">
                            <button
                                onClick={() => { logoutAuth(); closeMenu(); }}
                                className="nav-link logout-btn"
                            >
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </li>
                    )}

                </ul>
            </div>
        </nav>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="bottom-navbar">
            <Link to="/" className={`bottom-nav-item ${location.pathname==='/' ? 'active' : ''}`} onClick={closeMenu}>
                <i className="fas fa-home"></i>
                <span>Home</span>
            </Link>
            <Link to="/menu" className={`bottom-nav-item ${location.pathname==='/menu' ? 'active' : ''}`} onClick={closeMenu}>
                <i className="fas fa-bars"></i>
                <span>Menu</span>
            </Link>
            <Link to="/order-history" className={`bottom-nav-item ${location.pathname==='/order-history' ? 'active' : ''}`} onClick={closeMenu}>
                <i className="far fa-clock"></i>
                <span>Orders</span>
            </Link>
        </nav>
        </>
    );
};

export default Navbar;
