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
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';
import OfferPopup from './components/OfferPopup';
import FloatingActions from './components/FloatingActions';
import ProtectedRoute from './components/ProtectedRoute'; // Universal Route Guard
import './App.css';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPosRoute = location.pathname.startsWith('/pos');
  const hideHeaderFooter = isAdminRoute || isPosRoute;

  return (
    <div className="app-container">
      <OfferPopup />
      <FloatingActions />
      {!hideHeaderFooter && <Navbar />}
      <main className={isAdminRoute ? "admin-main-wrapper" : isPosRoute ? "pos-main-wrapper" : "main-content"}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* User Profile - Protected for Customers only */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer', 'user']}>
              <UserProfile />
            </ProtectedRoute>
          } />

          {/* Admin Dashboard - Protected for Admins only */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* POS Route - Protected for POS Staff and Admins only */}
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={['staff', 'pos', 'admin']}>
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
