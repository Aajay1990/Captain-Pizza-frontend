import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const { user, loginAuth } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);

    // Email states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // If a valid customer is already logged in and views the login page, redirect them.
        if (user && user.role === 'user') {
            navigate('/');
        }
    }, [user, navigate]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setMessage(''); setError(''); setName(''); setEmail(''); setPassword('');
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setMessage(''); setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        try {
            const payload = isLogin ? { email, password } : { name, email, password };
            const res = await fetch(`https://pizza-backend-api-a5mm.onrender.com${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                if (data.redirect) {
                    navigate(data.redirect, { state: { email } });
                } else {
                    loginAuth(data.user, data.token);
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Something went wrong. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page animate-fade-in">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>{isLogin ? 'Welcome Back!' : 'Join Captain Pizza'}</h2>
                        <p>Login or create an account with your Email.</p>
                    </div>

                    {message && <div style={{ color: 'green', marginBottom: '15px', textAlign: 'center', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>{message}</div>}
                    {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>{error}</div>}

                    <form className="login-form" onSubmit={handleEmailSubmit}>
                        {!isLogin && (
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
                            <input type="password" placeholder="Create or enter password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        {isLogin && <div className="forgot-password"><a href="#">Forgot Password?</a></div>}

                        <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>

                        <div className="login-footer">
                            <p>{isLogin ? "Don't have an account?" : "Already have an account?"} <span onClick={toggleMode} className="toggle-link">{isLogin ? 'Sign up' : 'Log in'}</span></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
