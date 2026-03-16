import API_URL from '../../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const ReviewManager = () => {
    const { token } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setRefreshing(true);
        try {
            const res = await axios.get('${API_URL}/api/reviews');
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
            const res = await axios.delete(`${API_URL}/api/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setReviews(reviews.filter(r => r._id !== id));
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
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
                                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.text}</td>
                                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleDelete(review._id)} title="Delete Review">
                                            <i className="fas fa-trash" style={{ color: 'red' }}></i>
                                        </button>
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
