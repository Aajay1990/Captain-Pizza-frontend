import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const StaffRoute = ({ children }) => {
    const { user } = useContext(AuthContext);

    // If user is not logged in, or purely a customer, redirect them out
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default StaffRoute;
