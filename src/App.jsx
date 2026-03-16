import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import POSPanel from './pages/pos/POSPanel';
import OrderHistory from './pages/OrderHistory';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';

import FloatingActions from './components/FloatingActions';
import ProtectedRoute from './components/ProtectedRoute';
import BackButton from './components/BackButton';
import './App.css';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPosRoute = location.pathname.startsWith('/pos');
  const hideHeaderFooter = isAdminRoute || isPosRoute;

  return (
    <div className="app-container">

      <FloatingActions />
      <BackButton />

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

          {/* ── Login Routes ──────────────────────────────────────── */}
          {/* Customer + general login */}
          <Route path="/login" element={<Login />} />
          {/* Hidden admin login URL — NOT shown in navbar */}
          <Route path="/admin-login" element={<Login adminOnly />} />
          {/* Hidden staff/POS login URL */}
          <Route path="/staff-login" element={<Login staffOnly />} />

          {/* ── Protected Customer Routes ─────────────────────────── */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer', 'user']}>
              <UserProfile />
            </ProtectedRoute>
          } />

          {/* ── Protected Admin Routes ────────────────────────────── */}
          {/* Admin accesses panel via /admin or /admin-login */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin-login">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Protected POS Routes ──────────────────────────────── */}
          {/* Staff accesses POS via /pos or /staff-login */}
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
