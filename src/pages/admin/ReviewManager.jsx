import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, api } from '../../context/AuthContext';

const ReviewManager = () => {
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/reviews');
            if (res.data.success) {
                setReviews(res.data.websiteData.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
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

    if (!user || user.role !== 'admin') return <div>Access Denied</div>;
    if (loading) return <div>Loading reviews...</div>;

    return (
        <div className="admin-content-card">
            <h2>Website Reviews Management</h2>
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
