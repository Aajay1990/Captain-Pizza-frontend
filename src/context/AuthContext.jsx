import React, { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Professional axios instance
export const api = axios.create({
    baseURL: 'https://pizza-backend-api-a5mm.onrender.com', // Replace with your permanent Render URL
    withCredentials: true // MANDATORY for cookies
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // Hybrid Persistence: Load user from localStorage immediately to show UI, 
    // but verify with Cookie in background for security.
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('captain_pizza_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                // Background verification with HttpOnly cookie
                const res = await api.get('/api/auth/me');
                if (res.data.success) {
                    setUser(res.data.user);
                    localStorage.setItem('captain_pizza_user', JSON.stringify(res.data.user));
                }
            } catch (err) {
                console.log("Session verification failed. Clearing local data.");
                setUser(null);
                localStorage.removeItem('captain_pizza_user');
            } finally {
                setAuthLoading(false);
            }
        };

        verifySession();
    }, []);

    const loginAuth = (userData) => {
        setUser(userData);
        localStorage.setItem('captain_pizza_user', JSON.stringify(userData));

        // Redirect logic
        if (userData.role === 'admin') navigate('/admin');
        else if (userData.role === 'staff' || userData.role === 'pos') navigate('/pos');
        else navigate('/');
    };

    const logoutAuth = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error("Server logout error", err);
        } finally {
            setUser(null);
            localStorage.removeItem('captain_pizza_user');
            navigate('/login');
        }
    };

    const refreshUser = (userData) => {
        setUser(userData);
        localStorage.setItem('captain_pizza_user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, authLoading, loginAuth, logoutAuth, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
