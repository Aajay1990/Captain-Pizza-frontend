import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

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
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/auth/verify-email', {
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

    return (
        <div className="login-page animate-fade-in">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Verify Your Email</h2>
                        <p>Enter the 6-digit code sent to {email || 'your email'}.</p>
                    </div>

                    {message && <div style={{ color: 'green', marginBottom: '15px', textAlign: 'center', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>{message}</div>}
                    {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>{error}</div>}

                    <form className="login-form" onSubmit={handleVerify}>
                        {!location.state?.email && (
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Confirm your email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Verification Code</label>
                            <input
                                type="text"
                                placeholder="6-digit code"
                                required
                                maxLength="6"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Account'}
                        </button>

                        <div className="login-footer">
                            <p>Didn't get code? <span onClick={() => navigate('/login')} className="toggle-link">Back to Registration</span></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
