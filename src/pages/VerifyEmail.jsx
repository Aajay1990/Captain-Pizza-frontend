import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import API_URL from '../apiConfig';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`${API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const data = await res.json();

            if (data.success) {
                setMessage(data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Something went wrong. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Please enter your email first.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`${API_URL}/api/auth/resend-verification-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to resend code. Check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page animate-fade-in">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="otp-icon-wrapper" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '15px' }}>
                            <i className="fas fa-envelope-open-text"></i>
                        </div>
                        <h2>Verify Your Email</h2>
                        <p style={{ color: '#666', fontSize: '0.95rem' }}>
                            A 6-digit OTP code has been sent to <br />
                            <strong style={{ color: '#333' }}>{email || 'your email'}</strong>
                        </p>
                    </div>

                    {message && (
                        <div className="auth-alert success-alert animate-bounce-soft">
                            <i className="fas fa-check-circle"></i> {message}
                        </div>
                    )}
                    {error && (
                        <div className="auth-alert error-alert animate-shake-soft">
                            <i className="fas fa-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <form className="login-form otp-specific-form" onSubmit={handleVerify}>
                        <div className="form-group">
                            <label style={{ textAlign: 'center', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Enter 6-Digit Code</label>
                            <input
                                type="text"
                                className="otp-input-field"
                                placeholder="· · · · · ·"
                                required
                                maxLength="6"
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                style={{
                                    fontSize: '2rem',
                                    textAlign: 'center',
                                    letterSpacing: '15px',
                                    fontWeight: '800',
                                    background: '#f8f9fa',
                                    border: '2px solid #eee',
                                    padding: '15px'
                                }}
                            />
                        </div>

                        <button type="submit" className="btn-primary login-submit-btn" disabled={loading} style={{ height: '55px', fontSize: '1.1rem' }}>
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                            ) : (
                                'Verify Account'
                            )}
                        </button>

                        <div className="login-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
                            <p>Didn't get code? <br />
                                <span onClick={handleResend} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                                    Resend New OTP
                                </span>
                            </p>
                            <p style={{ marginTop: '15px' }}>
                                <span onClick={() => navigate('/login')} className="toggle-link" style={{ fontSize: '0.85rem' }}>
                                    <i className="fas fa-arrow-left"></i> Back to Login
                                </span>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
