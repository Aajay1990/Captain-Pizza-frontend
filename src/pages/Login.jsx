import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import './Login.css';

const Login = ({ adminOnly = false, staffOnly = false }) => {
    const { user, loginAuth } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Page title based on mode
    const pageTitle = adminOnly
        ? '🛡️ Admin Login'
        : staffOnly
            ? '🖥️ Staff / POS Login'
            : '👋 Welcome Back!';

    const pageSubtitle = adminOnly
        ? 'Admin access only'
        : staffOnly
            ? 'Staff panel access'
            : 'Login to your account to continue.';

    // If already logged in, redirect appropriately
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin', { replace: true });
            else if (user.role === 'staff' || user.role === 'pos') navigate('/pos', { replace: true });
            else navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setMessage(''); setError(''); setName(''); setEmail(''); setPassword('');
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setMessage(''); setError('');

        if (!isLogin) {
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
            if (!strongPasswordRegex.test(password)) {
                setError('Password must be at least 6 characters with uppercase, lowercase, and a special symbol.');
                setLoading(false);
                return;
            }
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        try {
            const payload = isLogin ? { email, password } : { name, email, password };
            const res = await api.post(endpoint, payload);
            const data = res.data;

            if (data.success) {
                if (data.redirect) {
                    navigate(data.redirect, { state: { email } });
                } else {
                    // Validate role for restricted login pages
                    if (adminOnly && data.user?.role !== 'admin') {
                        setError('Access denied. Admin credentials required.');
                        setLoading(false);
                        return;
                    }
                    if (staffOnly && data.user?.role !== 'staff' && data.user?.role !== 'pos') {
                        setError('Access denied. Staff credentials required.');
                        setLoading(false);
                        return;
                    }
                    loginAuth(data.user);
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page animate-fade-in">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>{pageTitle}</h2>
                        <p>{pageSubtitle}</p>
                        {(adminOnly || staffOnly) && (
                            <div style={{
                                background: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                marginTop: '10px',
                                fontSize: '0.8rem',
                                color: '#856404'
                            }}>
                                🔒 Restricted access — session valid for this tab only
                            </div>
                        )}
                    </div>

                    {message && <div className="auth-alert success-alert">{message}</div>}
                    {error && <div className="auth-alert error-alert">{error}</div>}

                    <form className="login-form" onSubmit={handleEmailSubmit}>
                        {/* Only show signup tab for regular customer login */}
                        {!adminOnly && !staffOnly && !isLogin && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="Enter your full name" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" placeholder="Enter password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        {isLogin && (
                            <div className="forgot-password" style={{ textAlign: 'right', marginBottom: '15px' }}>
                                <span
                                    onClick={() => navigate('/forgot-password')}
                                    style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                        )}

                        <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>

                        {/* Only show signup toggle for regular login page */}
                        {!adminOnly && !staffOnly && (
                            <div className="login-footer">
                                <p>
                                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                                    <span onClick={toggleMode} className="toggle-link">
                                        {isLogin ? 'Sign up' : 'Log in'}
                                    </span>
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
