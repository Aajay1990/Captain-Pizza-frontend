import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import OrderHistory from './pages/OrderHistory';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import POSPanel from './pages/pos/POSPanel';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';

import FloatingActions from './components/FloatingActions';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPosRoute = location.pathname.startsWith('/pos');
  const hideHeaderFooter = isAdminRoute || isPosRoute;

  React.useEffect(() => {
    console.log("%c🚀 PIZZA WING LIVE - VERSION: MARCH 20-REVISED-V1", "color: #ff0000; font-size: 16px; font-weight: bold; background: #000; padding: 5px;");
    if (!localStorage.getItem('cp_guest_id')) {
      const gId = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('cp_guest_id', gId);
    }
  }, []);

  return (
    <div className="app-container">
      <FloatingActions />
      <CartDrawer />

      {!hideHeaderFooter && <Navbar />}

      <main className={isAdminRoute ? 'admin-main-wrapper' : isPosRoute ? 'pos-main-wrapper' : 'main-content'}>
        <Routes>
          {/* ── Public Routes ─────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* Hidden admin login URL — NOT shown in navbar */}
          {/* Hidden admin login URL — NOT shown in navbar */}
          <Route path="/admin-login" element={<Login adminOnly />} />
          <Route path="/staff-login" element={<Login staffOnly />} />


          {/* ── Protected Admin Routes ────────────────────────────── */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin-login">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Protected POS Routes ──────────────────────────────── */}
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['staff', 'pos', 'admin']} redirectTo="/staff-login">
              <POSPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;
