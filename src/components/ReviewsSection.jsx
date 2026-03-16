import { AuthContext } from '../context/AuthContext';
import API_URL from '../apiConfig';

const ReviewsSection = () => {
    const { user } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reviews`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please login to post a review");

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: user._id,
                    userName: user.email.split('@')[0], // Simulate a name
                    rating: newReview.rating,
                    comment: newReview.comment
                })
            });
            const data = await res.json();
            if (data.success) {
                setNewReview({ rating: 5, comment: '' });
                fetchReviews();
            }
        } catch (error) {
            alert('Failed to post review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={i < rating ? "fas fa-star" : "far fa-star"} style={{ color: '#f59e0b', fontSize: '0.9rem' }}></i>
        ));
    };

    return (
        <section className="reviews-section" style={{ padding: '50px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '40px' }}>What Customers Say</h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>

                {/* Review Presentation List */}
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    {loading ? <p style={{ textAlign: 'center' }}>Loading feedback...</p> :
                        reviews.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Be the first one to leave a review!</p> :
                            reviews.map(review => (
                                <div key={review._id} className="card animate-fade-in" style={{ padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}><i className="fas fa-user-circle"></i> {review.userName}</span>
                                        <div>{renderStars(review.rating)}</div>
                                    </div>
                                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>"{review.comment}"</p>
                                    <span style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginTop: '10px', textAlign: 'right' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                </div>

                {/* Submit New Review Form */}
                {user && (
                    <div className="card" style={{ flex: '1 1 300px', padding: '25px', backgroundColor: '#f8f9fa', borderRadius: '15px', border: '1px solid #ddd', alignSelf: 'flex-start' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--primary)' }}>Leave a Review</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rating (1-5)</label>
                                <select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                    <option value="4">⭐⭐⭐⭐ Good</option>
                                    <option value="3">⭐⭐⭐ Average</option>
                                    <option value="2">⭐⭐ Poor</option>
                                    <option value="1">⭐ Terrible</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Your Feedback</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                    required
                                    maxLength="150"
                                    rows="4"
                                    placeholder="The food was great..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'none' }}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '12px' }}>
                                {isSubmitting ? 'Posting...' : 'Submit Feedback'}
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </section>
    );
};

export default ReviewsSection;
