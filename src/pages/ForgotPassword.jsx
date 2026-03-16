import API_URL from '../apiConfig';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message);
                setStep(2);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to send OTP. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setStep(3);
        setError('');
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            setError('Password must be at least 6 characters and include uppercase, lowercase, and a special symbol.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page animate-fade-in">
            <div className="login-container">
                <div className="login-card p-reset-card">
                    <div className="login-header">
                        <div className="otp-icon-wrapper" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '15px' }}>
                            <i className={step === 1 ? "fas fa-user-lock" : step === 2 ? "fas fa-key" : "fas fa-shield-alt"}></i>
                        </div>
                        <h2>{step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}</h2>
                        <p style={{ color: '#666' }}>
                            {step === 1 ? 'Enter your registered email to receive a recovery code.' :
                                step === 2 ? `We've sent a 6-digit code to ${email}` :
                                    'Create a new strong password for your account.'}
                        </p>
                    </div>

                    {message && <div className="auth-alert success-alert animate-bounce-soft"><i className="fas fa-check-circle"></i> {message}</div>}
                    {error && <div className="auth-alert error-alert animate-shake-soft"><i className="fas fa-exclamation-circle"></i> {error}</div>}

                    {step === 1 && (
                        <form className="login-form" onSubmit={handleSendOTP}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Send Recovery Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="login-form" onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    className="otp-input-field"
                                    maxLength="6"
                                    placeholder="· · · · · ·"
                                    required
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '10px', fontWeight: 'bold' }}
                                />
                            </div>
                            <button type="submit" className="btn-primary login-submit-btn">Verify & Continue</button>
                            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
                                Didn't get it? <span onClick={handleSendOTP} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Resend</span>
                            </p>
                        </form>
                    )}

                    {step === 3 && (
                        <form className="login-form" onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" placeholder="Min 6 characters" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" placeholder="Repeat new password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Update Password'}
                            </button>
                        </form>
                    )}

                    <div className="login-footer" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <p>Remember your password? <span onClick={() => navigate('/login')} className="toggle-link">Login</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
