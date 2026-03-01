import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const UserManager = () => {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/auth/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await res.json();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Registered Users</h3>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Email Address</th>
                            <th>Registration Date</th>
                            <th>Verification Status</th>
                            <th>Preview URL (Testing)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading registered users...</td></tr>}
                        {!loading && users.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No users registered yet.</td></tr>}

                        {users.map(user => (
                            <tr key={user._id}>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user._id}</td>
                                <td><strong>{user.email}</strong></td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {user.isVerified ?
                                        <span style={{ color: 'green', fontWeight: 'bold' }}><i className="fas fa-check-circle"></i> Verified</span> :
                                        <span style={{ color: 'orange', fontWeight: 'bold' }}><i className="fas fa-clock"></i> Pending Action</span>
                                    }
                                </td>
                                <td>
                                    {!user.isVerified && user.verificationToken ? (
                                        <a href={`https://pizza-backend-api-a5mm.onrender.com/api/auth/verify/${user.verificationToken}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                            Manual Verify Link
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Why didn't I get an email on my real Gmail?</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Normally, sending a real email requires setting up a paid mailing service (like SendGrid) and completing Domain Verifications.
                    Since you are developing locally on your PC, the backend automatically intercepts outgoing emails and uses a Fake Testing Interface called "Ethereal".<br /><br />
                    To see the fake email that was "sent" when you registered, check your backend Terminal Console logs. It will print a Preview URL.<br />
                    Alternatively, for Development speed, you can just click the "Manual Verify Link" directly in the table above to fake clicking the email button!
                </p>
            </div>
        </div>
    );
};

export default UserManager;
