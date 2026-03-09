import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';

const UserManager = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user && user.role === 'admin') fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/api/auth/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 600);
        }
    };

    const handleUpdatePassword = async (id, newPassword) => {
        try {
            const res = await api.put(`/api/auth/users/${id}/password`, { newPassword });
            if (res.data.success) {
                alert(res.data.message);
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert("Error updating password.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            console.log("Attempting to delete user:", id);
            const res = await api.delete(`/api/auth/users/${id}`);

            if (res.data.success) {
                setUsers(users.filter(u => u._id !== id));
                alert("User deleted successfully.");
            } else {
                alert(`Error: ${res.data.message || "Something went wrong on the server."}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting the user. Check the console.");
        }
    };

    if (!user) {
        return (
            <div className="user-manager" style={{ textAlign: 'center', padding: '50px' }}>
                <i className="fas fa-lock" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
                <h3>Authentication Required</h3>
                <p>Please wait while we verify your session...</p>
            </div>
        );
    }

    return (
        <div className="user-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Registered Users</h3>
                <button
                    onClick={fetchUsers}
                    disabled={refreshing}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#2b2b2b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        opacity: refreshing ? 0.7 : 1
                    }}
                >
                    <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Email Address</th>
                            <th>Registration Date</th>
                            <th>Verification Status</th>
                            <th>Actions</th>
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
                                        <span style={{ color: 'orange', fontWeight: 'bold' }}><i className="fas fa-clock"></i> Verification Pending</span>
                                    }
                                </td>
                                <td>
                                    <button
                                        onClick={() => {
                                            const newPass = prompt("Enter new strong password (Min 6 chars, upper, lower, special):");
                                            if (newPass) handleUpdatePassword(user._id, newPass);
                                        }}
                                        className="btn-icon"
                                        style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}
                                        title="Change Password"
                                    >
                                        <i className="fas fa-key"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user._id)}
                                        className="btn-icon"
                                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}
                                        title="Delete User"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>Admin Dashboard Tips</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Registration is now verified via 6-digit Email OTP. Users can verify themselves immediately after signup.<br /><br />
                    <strong>Testing Tip:</strong> You can use the master code <code>123456</code> for any user to verify them instantly during development.
                </p>
            </div>
        </div>
    );
};

export default UserManager;
