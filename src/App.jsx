import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import POSPanel from './pages/pos/POSPanel';
import AdminRoute from './components/AdminRoute';
import StaffRoute from './components/StaffRoute';
import OfferPopup from './components/OfferPopup';
import './App.css';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPosRoute = location.pathname.startsWith('/pos');
  const hideHeaderFooter = isAdminRoute || isPosRoute;

  return (
    <div className="app-container">
      <OfferPopup />
      {!hideHeaderFooter && <Navbar />}
      <main className={isAdminRoute ? "admin-main-wrapper" : isPosRoute ? "pos-main-wrapper" : "main-content"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* Admin Routes - Protected securely */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          {/* POS Route - Protected for staff/admin */}
          <Route path="/pos" element={
            <StaffRoute>
              <POSPanel />
            </StaffRoute>
          } />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

export default App;
