import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount, isIconAnimating, setIsCartOpen } = useContext(CartContext);
    const { user, logoutAuth } = useContext(AuthContext);

    const closeMenu = () => setIsMenuOpen(false);

    // Admin and staff do NOT appear in public navbar
    // They access their panels via direct URL (/admin or /pos) after login
    const isPublicUser = !user || user.role === 'customer' || user.role === 'user';

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

                    {/* Cart Icon removed as per request */}

                    {user ? (
                        <>
                            {/* Customer profile link */}
                            {isPublicUser && (
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link profile-link" onClick={closeMenu}>
                                        <i className="fas fa-user-circle"></i> {user.name?.split(' ')[0] || 'Profile'}
                                    </Link>
                                </li>
                            )}

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
                .logout-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white !important; border-radius: 6px; padding: 8px 15px !important; margin-left: 10px; cursor: pointer; }
                .login-btn { background: var(--primary); color: white !important; border-radius: 6px; padding: 8px 25px !important; font-weight: 600; }
                .profile-link { font-weight: 500; display: flex; align-items: center; gap: 8px; }
                .cart-link { display: flex; align-items: center; }

                @media (max-width: 960px) {
                    .nav-item { width: 100%; text-align: center; padding: 10px 0; }
                    .logout-btn, .login-btn { margin: 10px auto; width: 80%; display: block; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
