import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Professional Role-Based Route Protection
 * @param {Array} allowedRoles - List of roles that can access this route (e.g. ['admin', 'staff'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, authLoading } = useContext(AuthContext);
    const location = useLocation();

    // 1. Prevents UI flickering while session is being verified from cookie
    if (authLoading) {
        return (
            <div className="auth-loading-spinner" style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div className="spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ fontWeight: '500', color: '#666' }}>Verifying your secure session...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // 2. Redirect to Login if NOT authenticated
    if (!user) {
        // We save the original path (state) to redirect them back after they login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Check for specific Role Permission (e.g. admin trying to access POS or vice-versa)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Log unauthorized attempt
        console.warn(`[AUTH GUARD] Unauthorized role ${user.role} tried to access ${location.pathname}`);

        // Role-based redirection logic for "mismatch" access
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'staff' || user.role === 'pos') return <Navigate to="/pos" replace />;
        return <Navigate to="/" replace />; // Everyone else back home
    }

    // 4. Authorized Access - Render the protected content
    return children;
};

export default ProtectedRoute;
