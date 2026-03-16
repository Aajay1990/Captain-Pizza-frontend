import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../apiConfig';

const BASE_URL = API_URL;

// ── Axios instance ─────────────────────────────────────────────────────────
export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 30000, // 30 s  (Render cold-start can take ~20 s)
});

// Always attach the stored Bearer token
api.interceptors.request.use((config) => {
    try {
        const stored = sessionStorage.getItem('captain_pizza_user');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        }
    } catch { /* silent */ }
    return config;
});

// On 401 / 403 – redirect to the CORRECT login page based on the stored role
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const msg = (error.response?.data?.message || '').toLowerCase();

        if ((status === 401 || status === 403) &&
            (msg.includes('not authorized') || msg.includes('no token') || msg.includes('invalid token'))) {
            try {
                const stored = sessionStorage.getItem('captain_pizza_user');
                const parsed = stored ? JSON.parse(stored) : null;
                const role = parsed?.role;

                // Redirect to the correct login for the role (skip for admin to prevent annoying kicks)
                if (role === 'admin') {
                    // Admin stays logged in in the frontend (backend will just deny specific actions if completely expired, but doesn't wipe session)
                    console.warn("Admin token error, but keeping session active.");
                } else if (role === 'staff' || role === 'pos') {
                    sessionStorage.removeItem('captain_pizza_user');
                    window.location.href = '/staff-login';
                } else {
                    sessionStorage.removeItem('captain_pizza_user');
                    window.location.href = '/login';
                }
            } catch {
                sessionStorage.removeItem('captain_pizza_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const AuthContext = createContext();

const STORAGE_KEY = 'captain_pizza_user';

const readUserFromStorage = () => {
    try {
        const data = sessionStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
};

const saveUserToStorage = (userData) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
};

const clearAllStorage = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('captain_pizza_cart'); // also clear guest cart on logout
};

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => readUserFromStorage());
    const [token, setToken] = useState(() => readUserFromStorage()?.token || null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const currentToken = token || readUserFromStorage()?.token;
            if (!currentToken) {
                setAuthLoading(false);
                return;
            }

            try {
                // Use a short timeout so cold-start doesn't block the UI for 30 s
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 s

                const res = await api.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${currentToken}` },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.data.success) {
                    const userData = res.data.user;
                    const merged = { ...userData, token: userData.token || currentToken };
                    setUser(merged);
                    setToken(merged.token);
                    saveUserToStorage(merged);
                }
            } catch (err) {
                if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
                    // Network timeout (Render sleeping) – keep cached user, don't logout
                    console.warn('Auth verify timed out – using cached session');
                } else if (err.response?.status === 401 || err.response?.status === 403) {
                    // Genuinely invalid token - only wipe session if NOT admin
                    if (user && user.role === 'admin') {
                        console.warn("Admin verify failed, retaining session.");
                    } else {
                        setUser(null);
                        setToken(null);
                        clearAllStorage();
                    }
                }
                // Any other network error → keep cached user (offline resilience)
            } finally {
                setAuthLoading(false);
            }
        };
        verifySession();
    }, []); // eslint-disable-line

    const loginAuth = (userData) => {
        setUser(userData);
        setToken(userData.token || null);
        saveUserToStorage(userData);

        if (userData.role === 'admin') navigate('/admin');
        else if (userData.role === 'staff' || userData.role === 'pos') navigate('/pos');
        else navigate('/');
    };

    const logoutAuth = async () => {
        try { await api.post('/api/auth/logout'); } catch { /* silent */ }
        setUser(null);
        setToken(null);
        clearAllStorage();
        // Navigate to the right login for the role
        const role = user?.role;
        if (role === 'admin') navigate('/admin-login');
        else if (role === 'staff' || role === 'pos') navigate('/staff-login');
        else navigate('/login');
    };

    const refreshUser = (userData) => {
        setUser(userData);
        setToken(userData.token || null);
        saveUserToStorage(userData);
    };

    // Utility: always get the freshest token (from state OR localStorage)
    const getToken = useCallback(() => {
        return token || readUserFromStorage()?.token || null;
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, authLoading, loginAuth, logoutAuth, refreshUser, getToken, api }}>
            {children}
        </AuthContext.Provider>
    );
};
