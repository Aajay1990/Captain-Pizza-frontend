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

const readUserFromStorage = () => {
    const localUser = localStorage.getItem(STORAGE_KEY);
    if (localUser) {
        try { return JSON.parse(localUser); } catch { return null; }
    }
    return null;
};

const saveUserToStorage = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
};

const clearAllStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
};

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
            const currentToken = token || readUserFromStorage()?.token;
            if (!currentToken) {
                setAuthLoading(false);
                return;
            }

            try {
                const res = await api.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${currentToken}` }
                });
                if (res.data.success) {
                    const userData = res.data.user;
                    setUser(userData);
                    setToken(userData.token || currentToken);
                    saveUserToStorage({ ...userData, token: userData.token || currentToken });
                }
            } catch (err) {
                // If 401/403, clear. If network error, maybe keep it?
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setUser(null);
                    setToken(null);
                    clearAllStorage();
                }
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
