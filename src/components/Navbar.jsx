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

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo" onClick={closeMenu}>
                    <img src={logo} alt="Captain Pizza Logo" className="logo-img" />
                    Captain Pizza
                </Link>

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
                        <Link to="/order" className="nav-link cart-link" onClick={closeMenu}>
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

                    {user ? (
                        <>
                            {/* Role-Based Navigation Buttons */}
                            {user.role === 'admin' && (
                                <li className="nav-item">
                                    <Link to="/admin" className="nav-link admin-btn" onClick={closeMenu}>
                                        <i className="fas fa-user-shield"></i> Admin Panel
                                    </Link>
                                </li>
                            )}

                            {(user.role === 'staff' || user.role === 'pos') && (
                                <li className="nav-item">
                                    <Link to="/pos" className="nav-link pos-btn" onClick={closeMenu}>
                                        <i className="fas fa-desktop"></i> POS Panel
                                    </Link>
                                </li>
                            )}

                            {user.role === 'customer' || user.role === 'user' ? (
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link profile-link" onClick={closeMenu}>
                                        <i className="fas fa-user-circle"></i> {user.name || 'Profile'}
                                    </Link>
                                </li>
                            ) : null}

                            <li className="nav-item">
                                <button
                                    onClick={() => { logoutAuth(); closeMenu(); }}
                                    className="nav-link logout-btn"
                                >
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <li className="nav-item">
                            <Link to="/login" className="nav-link login-btn" onClick={closeMenu}>
                                <i className="fas fa-sign-in-alt"></i> Login
                            </Link>
                        </li>
                    )}
                </ul>
            </div>

            <style>{`
                .admin-btn { background: #f59e0b !important; color: white !important; border-radius: 6px; padding: 8px 15px !important; font-weight: 600; margin: 0 5px; }
                .pos-btn { background: #10b981 !important; color: white !important; border-radius: 6px; padding: 8px 15px !important; font-weight: 600; margin: 0 5px; }
                .logout-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white !important; border-radius: 6px; padding: 8px 15px !important; margin-left: 10px; cursor: pointer; }
                .login-btn { background: var(--primary); color: white !important; border-radius: 6px; padding: 8px 25px !important; font-weight: 600; }
                .profile-link { font-weight: 500; display: flex; align-items: center; gap: 8px; }
                
                @media (max-width: 960px) {
                    .nav-item { width: 100%; text-align: center; padding: 10px 0; }
                    .admin-btn, .pos-btn, .logout-btn, .login-btn { margin: 10px auto; width: 80%; display: block; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
