import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import DashboardStats from './DashboardStats';
import MenuManager from './MenuManager';
import UserManager from './UserManager';
import CouponManager from './CouponManager';
import OrderManager from './OrderManager';
import ReviewManager from './ReviewManager';
import SettingsManager from './SettingsManager';
import OfferManager from './OfferManager';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
    const location = useLocation();
    const { user, authLoading, logoutAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    if (authLoading) return <div className="admin-loading">Checking permissions...</div>;
    if (!user || user.role !== 'admin') return null;

    // We can extract the final part of path to know active tab, e.g. /admin/menu maps to 'menu'
    const currentTab = location.pathname.split('/').pop();

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <h2>Captain Admin</h2>
                    <p>Manager Panel</p>
                </div>

                <nav className="admin-nav">
                    <Link to="/admin" className={`admin-nav-link ${currentTab === 'admin' ? 'active' : ''}`}>
                        <i className="fas fa-home"></i> Overview
                    </Link>

                    <Link to="/admin/menu" className={`admin-nav-link ${currentTab === 'menu' ? 'active' : ''}`}>
                        <i className="fas fa-pizza-slice"></i> Menu & Inventory
                    </Link>
                    <Link to="/admin/orders" className={`admin-nav-link ${currentTab === 'orders' ? 'active' : ''}`}>
                        <i className="fas fa-receipt"></i> Order History
                    </Link>
                    <Link to="/admin/users" className={`admin-nav-link ${currentTab === 'users' ? 'active' : ''}`}>
                        <i className="fas fa-users"></i> Users Setup
                    </Link>
                    <Link to="/admin/coupons" className={`admin-nav-link ${currentTab === 'coupons' ? 'active' : ''}`}>
                        <i className="fas fa-ticket-alt"></i> Coupons
                    </Link>
                    <Link to="/admin/offers" className={`admin-nav-link ${currentTab === 'offers' ? 'active' : ''}`}>
                        <i className="fas fa-bullhorn"></i> Seasonal Offers
                    </Link>
                    <Link to="/admin/reviews" className={`admin-nav-link ${currentTab === 'reviews' ? 'active' : ''}`}>
                        <i className="fas fa-star"></i> Reviews Moderation
                    </Link>
                    <Link to="/admin/settings" className={`admin-nav-link ${currentTab === 'settings' ? 'active' : ''}`}>
                        <i className="fas fa-cog"></i> System Settings
                    </Link>
                </nav>

                <div className="admin-logout">
                    <button
                        onClick={logoutAuth}
                        className="btn-primary"
                        style={{ width: '100%', textAlign: 'center', display: 'block', cursor: 'pointer', border: 'none' }}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                <header className="admin-header">
                    <h2>Admin Dashboard</h2>
                    <div className="admin-profile">
                        <span>Welcome, Aajay Sharma</span>
                        <div className="admin-avatar">AS</div>
                    </div>
                </header>

                <div className="admin-content-wrapper">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/menu" element={<MenuManager />} />
                        <Route path="/orders" element={<OrderManager />} />
                        <Route path="/users" element={<UserManager />} />
                        <Route path="/coupons" element={<CouponManager />} />
                        <Route path="/offers" element={<OfferManager />} />
                        <Route path="/reviews" element={<ReviewManager />} />
                        <Route path="/settings" element={<SettingsManager />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
