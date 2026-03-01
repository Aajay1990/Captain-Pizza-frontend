import React, { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Context changes based on route
    const getStoragePrefix = (path) => {
        if (path.startsWith('/admin')) return 'admin_';
        if (path.startsWith('/pos')) return 'staff_';
        return 'customer_';
    };

    const currentPrefix = getStoragePrefix(location.pathname);

    useEffect(() => {
        const storage = currentPrefix === 'customer_' ? localStorage : sessionStorage;
        const storedUser = storage.getItem(`${currentPrefix}user`);
        const storedToken = storage.getItem(`${currentPrefix}token`);
        setUser(storedUser ? JSON.parse(storedUser) : null);
        setToken(storedToken || null);
    }, [currentPrefix]);

    // Helper functions to manage the auth state globally
    const loginAuth = (userData, authToken) => {
        let prefix = 'customer_';
        let targetRoute = '/';
        if (userData.role === 'admin') { prefix = 'admin_'; targetRoute = '/admin'; }
        else if (userData.role === 'staff') { prefix = 'staff_'; targetRoute = '/pos'; }

        const storage = prefix === 'customer_' ? localStorage : sessionStorage;
        storage.setItem(`${prefix}token`, authToken);
        storage.setItem(`${prefix}user`, JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);

        // Smooth transition
        navigate(targetRoute);
    };

    const refreshUser = (userData) => {
        const storage = currentPrefix === 'customer_' ? localStorage : sessionStorage;
        storage.setItem(`${currentPrefix}user`, JSON.stringify(userData));
        setUser(userData);
    };

    const logoutAuth = () => {
        const storage = currentPrefix === 'customer_' ? localStorage : sessionStorage;
        storage.removeItem(`${currentPrefix}token`);
        storage.removeItem(`${currentPrefix}user`);
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, loginAuth, logoutAuth, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
