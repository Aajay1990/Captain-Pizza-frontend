import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';

const ReviewManager = () => {
    const { token } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/api/reviews');
            if (res.data.success) {
                setReviews(res.data.websiteData.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 600);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            const res = await api.delete(`/api/reviews/${id}`);
            if (res.data.success) {
                setReviews(reviews.filter(r => r._id !== id));
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return alert('Reply text cannot be empty.');
        try {
            // api instance auto-attaches Bearer token from localStorage
            const res = await api.put(`/api/reviews/${id}/reply`, { reply: replyText, replyText });
            if (res.data.success) {
                setReviews(reviews.map(r => r._id === id ? { ...r, adminReply: replyText } : r));
                setReplyingTo(null);
                setReplyText('');
                alert('Reply sent! ✅');
            } else {
                alert(res.data.message || 'Failed to send reply');
            }
        } catch (error) {
            console.error('Error replying to review:', error);
            // Try fallback with POST if PUT fails
            try {
                const res2 = await api.post(`/api/reviews/${id}/reply`, { reply: replyText, replyText });
                if (res2.data.success) {
                    setReviews(reviews.map(r => r._id === id ? { ...r, adminReply: replyText } : r));
                    setReplyingTo(null); setReplyText('');
                    alert('Reply sent! ✅');
                } else { alert('Failed to send reply: ' + (res2.data.message || 'unknown error')); }
            } catch (err2) { alert('Network error. Failed to send reply.'); }
        }
    };

    if (loading) return <div>Loading reviews...</div>;

    return (
        <div className="admin-content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Website Reviews Management</h2>
                <button
                    onClick={fetchReviews}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2b2b2b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', opacity: refreshing ? 0.7 : 1 }}
                >
                    <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Rating</th>
                            <th>Review Text</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr><td colSpan="5">No reviews yet.</td></tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={review.profilePic} alt={review.userName} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                            {review.userName}
                                        </div>
                                    </td>
                                    <td>{"⭐".repeat(Math.round(review.rating))}</td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.text}</div>
                                        {review.adminReply && (
                                            <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.85rem', color: '#555', borderLeft: '3px solid #B71C1C' }}>
                                                <strong>Admin Reply: </strong> {review.adminReply}
                                            </div>
                                        )}
                                        {replyingTo === review._id && (
                                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <textarea 
                                                    value={replyText} 
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Type your reply to the customer..."
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical', minHeight: '60px' }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleReply(review._id)} style={{ padding: '6px 12px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Send Reply</button>
                                                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '6px 12px', background: '#f1f1f1', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="btn-icon" onClick={() => { setReplyingTo(review._id); setReplyText(review.adminReply || ''); }} title="Reply to Review">
                                                <i className="fas fa-reply" style={{ color: '#007BFF' }}></i>
                                            </button>
                                            <button className="btn-icon" onClick={() => handleDelete(review._id)} title="Delete Review">
                                                <i className="fas fa-trash" style={{ color: 'red' }}></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReviewManager;
