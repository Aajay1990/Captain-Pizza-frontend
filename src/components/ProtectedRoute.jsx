import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Role-Based Route Protection
 * @param {Array}  allowedRoles - Roles that can access this route
 * @param {string} redirectTo   - Custom login page for this route (default /login)
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/login' }) => {
    const { user, authLoading } = useContext(AuthContext);
    const location = useLocation();

    // Show spinner while session is being verified
    if (authLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '20px',
                background: '#fff'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #B71C1C',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
                <p style={{ fontWeight: '600', color: '#666', fontSize: '1rem' }}>Verifying session...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not authenticated → send to the appropriate login page
    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Wrong role → redirect to their own home
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn(`[AUTH GUARD] Role "${user.role}" tried to access ${location.pathname}`);
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'staff' || user.role === 'pos') return <Navigate to="/pos" replace />;
        return <Navigate to="/" replace />;
    }

    // ✅ Authorized
    return children;
};

export default ProtectedRoute;
