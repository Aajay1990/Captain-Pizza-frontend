import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    // If user is not logged in, or not an admin, redirect them out
    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;
