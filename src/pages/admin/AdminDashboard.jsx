import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './AdminDashboard.css';
import DashboardStats from './DashboardStats';
import MenuManager from './MenuManager';
import UserManager from './UserManager';
import CouponManager from './CouponManager';
import OrderManager from './OrderManager';
import ReviewManager from './ReviewManager';
import SettingsManager from './SettingsManager';
import SeasonalOfferManager from './SeasonalOfferManager';
import { AuthContext, api } from '../../context/AuthContext';
import { useContext } from 'react';

const AdminDashboard = () => {
    const location = useLocation();
    const { user, loginAuth, logoutAuth } = useContext(AuthContext);

    const handleFastPOS = async () => {
        try {
            // Use the professional axios instance which handles cookies and baseURL
            const res = await api.post('/api/auth/admin-pos-access');
            const data = res.data;
            if (data.success) {
                // Update local storage/context with POS specific guest session for admin
                // Note: The backend still sets a token cookie, but we send user data back to state
                loginAuth(data.user);
                window.location.href = '/pos';
            } else {
                alert("Failed to grant guest access: " + data.message);
            }
        } catch (error) {
            console.error("Fast POS Error:", error);
            alert("Error accessing POS. Please ensure you are logged in as an admin.");
        }
    };

    // Extract current tab for active styling
    const currentTab = location.pathname.split('/').pop();

    if (!user || user.role !== 'admin') {
        return (
            <div className="admin-dashboard-error" style={{ padding: '100px', textAlign: 'center' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#E53935' }}></i>
                <h2>Access Denied</h2>
                <p>You must be signed in as an administrator to view this page.</p>
                <Link to="/login" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Go to Login</Link>
            </div>
        );
    }

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
                    <div onClick={handleFastPOS} className="admin-nav-link" style={{ backgroundColor: '#e63946', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>
                        <i className="fas fa-desktop"></i> Open Fast POS
                    </div>
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
                    <Link to="/admin/reviews" className={`admin-nav-link ${currentTab === 'reviews' ? 'active' : ''}`}>
                        <i className="fas fa-star"></i> Reviews Moderation
                    </Link>
                    <Link to="/admin/offers" className={`admin-nav-link ${currentTab === 'offers' ? 'active' : ''}`}>
                        <i className="fas fa-percentage"></i> Seasonal Offers
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
                        <span>Welcome, {user.name || 'Aajay Sharma'}</span>
                        <div className="admin-avatar">{user.name ? user.name.substring(0, 2).toUpperCase() : 'AS'}</div>
                    </div>
                </header>

                <div className="admin-content-wrapper">
                    <Routes>
                        <Route path="/" element={<DashboardStats />} />
                        <Route path="/menu" element={<MenuManager />} />
                        <Route path="/orders" element={<OrderManager />} />
                        <Route path="/users" element={<UserManager />} />
                        <Route path="/coupons" element={<CouponManager />} />
                        <Route path="/reviews" element={<ReviewManager />} />
                        <Route path="/offers" element={<SeasonalOfferManager />} />
                        <Route path="/settings" element={<SettingsManager />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
