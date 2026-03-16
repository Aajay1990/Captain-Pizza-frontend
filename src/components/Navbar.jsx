import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Home, Menu as MenuIcon, Clock, User, LogOut } from 'lucide-react';
import './Navbar.css';
import logo from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isIconAnimating } = useContext(CartContext);
    const { user, logoutAuth } = useContext(AuthContext);

    const isCustomer = user && (user.role === 'customer' || user.role === 'user');

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={logo} alt="Captain Pizza Logo" className="logo-img" />
                    <span>Captain Pizza</span>
                </Link>

                <ul className="nav-menu">
                    <li className="nav-item hide-mobile">
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                    </li>
                    <li className="nav-item hide-mobile">
                        <Link to="/menu" className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>Menu</Link>
                    </li>
                    <li className="nav-item hide-mobile">
                        <Link to="/order-history" className={`nav-link ${location.pathname === '/order-history' ? 'active' : ''}`}>
                            Order History
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Mobile Bottom Navigation — Home, Menu, Order History only */}
            <div className="mobile-bottom-nav">
                <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <Home size={22} />
                    <span>Home</span>
                </Link>
                <Link to="/menu" className={`mobile-nav-item ${location.pathname === '/menu' ? 'active' : ''}`}>
                    <MenuIcon size={22} />
                    <span>Menu</span>
                </Link>
                <Link to="/order-history" className={`mobile-nav-item ${location.pathname === '/order-history' ? 'active' : ''}`}>
                    <Clock size={22} />
                    <span>Orders</span>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
