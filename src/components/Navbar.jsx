import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount, isIconAnimating } = useContext(CartContext);
    const { user, logoutAuth } = useContext(AuthContext);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logo} alt="Captain Pizza Logo" className="logo-img" />
                    Captain Pizza
                </Link>

                <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <i className={isMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
                </div>

                <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
                    <li className="nav-item">
                        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/menu" className="nav-link" onClick={() => setIsMenuOpen(false)}>Menu</Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/order" className="nav-link cart-link" onClick={() => setIsMenuOpen(false)}>
                            <div className={`cart-icon-wrapper ${isIconAnimating ? 'animate-vibrate' : ''}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="cart-svg">
                                    <circle cx="9" cy="21" r="1.5"></circle>
                                    <circle cx="20" cy="21" r="1.5"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                <span className="custom-cart-badge">{cartCount}</span>
                            </div>
                        </Link>
                    </li>
                    <li className="nav-item">
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="nav-link btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 15px' }} onClick={() => setIsMenuOpen(false)}>
                                        Admin Panel <i className="fas fa-arrow-right"></i>
                                    </Link>
                                )}
                                <Link to="/profile" className="nav-link" style={{ color: 'white', fontWeight: 'bold' }} onClick={() => setIsMenuOpen(false)}>
                                    <i className="fas fa-user-circle"></i> {user.name || user.email.split('@')[0]}
                                </Link>
                                <button
                                    onClick={() => { logoutAuth(); setIsMenuOpen(false); }}
                                    className="nav-link btn-primary login-btn"
                                    style={{ backgroundColor: '#2b2b2b', color: 'white', border: '1px solid #444' }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="nav-link btn-primary login-btn" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        )}
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
