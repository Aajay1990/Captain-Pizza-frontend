import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Professional axios instance
export const api = axios.create({
    baseURL: 'https://pizza-backend-api-a5mm.onrender.com',
    withCredentials: true
});

export const AuthContext = createContext();

// ─── Storage Strategy ────────────────────────────────────────────────────────
// Admin / Staff (POS) →  sessionStorage  (cleared when tab is closed)
// Customer / User    →  localStorage     (persists across tabs and sessions)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'captain_pizza_user';

const getStorage = (role) => {
    if (role === 'admin' || role === 'staff' || role === 'pos') {
        return sessionStorage;
    }
    return localStorage;
};

const readUserFromStorage = () => {
    // Check sessionStorage first (admin/staff)
    const sessionUser = sessionStorage.getItem(STORAGE_KEY);
    if (sessionUser) {
        try { return JSON.parse(sessionUser); } catch { return null; }
    }
    // Then check localStorage (customers)
    const localUser = localStorage.getItem(STORAGE_KEY);
    if (localUser) {
        try {
            const parsed = JSON.parse(localUser);
            // Safety: if a staff/admin token ended up in localStorage, ignore it
            if (parsed.role === 'admin' || parsed.role === 'staff' || parsed.role === 'pos') {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return parsed;
        } catch { return null; }
    }
    return null;
};

const saveUserToStorage = (userData) => {
    const storage = getStorage(userData.role);
    storage.setItem(STORAGE_KEY, JSON.stringify(userData));
    // Ensure the other storage doesn't have a stale copy
    if (userData.role === 'admin' || userData.role === 'staff' || userData.role === 'pos') {
        localStorage.removeItem(STORAGE_KEY);
    } else {
        sessionStorage.removeItem(STORAGE_KEY);
    }
};

const clearAllStorage = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
};

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => readUserFromStorage());
    const [token, setToken] = useState(() => {
        const u = readUserFromStorage();
        return u?.token || null;
    });
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await api.get('/api/auth/me');
                if (res.data.success) {
                    const userData = res.data.user;
                    setUser(userData);
                    setToken(userData.token || null);
                    saveUserToStorage(userData);
                }
            } catch (err) {
                // Session invalid — clear everything
                setUser(null);
                setToken(null);
                clearAllStorage();
            } finally {
                setAuthLoading(false);
            }
        };
        verifySession();
    }, []);

    const loginAuth = (userData) => {
        setUser(userData);
        setToken(userData.token || null);
        saveUserToStorage(userData);

        // Redirect based on role
        if (userData.role === 'admin') navigate('/admin');
        else if (userData.role === 'staff' || userData.role === 'pos') navigate('/pos');
        else navigate('/');
    };

    const logoutAuth = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error('Server logout error', err);
        } finally {
            setUser(null);
            setToken(null);
            clearAllStorage();
            navigate('/login');
        }
    };

    const refreshUser = (userData) => {
        setUser(userData);
        setToken(userData.token || null);
        saveUserToStorage(userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, authLoading, loginAuth, logoutAuth, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
