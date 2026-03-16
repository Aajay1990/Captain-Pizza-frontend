import API_URL from '../apiConfig';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ReviewEcosystem.css';

const ReviewEcosystem = () => {
    const { user, token } = useContext(AuthContext);
    const [reviewsData, setReviewsData] = useState({ google: null, website: null });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, text: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const testimonialRef = useRef(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch('${API_URL}/api/reviews');
            const data = await res.json();
            if (data.success) {
                setReviewsData({
                    google: data.googleData,
                    website: data.websiteData
                });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-Scroll Logic for Testimonials
    useEffect(() => {
        if (loading) return;
        const el = testimonialRef.current;
        if (!el) return;

        let interval;
        const startScroll = () => {
            interval = setInterval(() => {
                if (el) {
                    el.scrollLeft += 1;
                    if (el.scrollLeft >= (el.scrollWidth / 2)) {
                        el.scrollLeft = 0;
                    }
                }
            }, 20); // speed
        };
        startScroll();

        el.addEventListener('mouseenter', () => clearInterval(interval));
        el.addEventListener('mouseleave', startScroll);
        el.addEventListener('touchstart', () => clearInterval(interval), { passive: true });
        el.addEventListener('touchend', startScroll);

        return () => {
            clearInterval(interval);
            el.removeEventListener('mouseenter', () => clearInterval(interval));
            el.removeEventListener('mouseleave', startScroll);
            el.removeEventListener('touchstart', () => clearInterval(interval));
            el.removeEventListener('touchend', startScroll);
        };
    }, [loading, reviewsData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!user || !token) {
            setErrorMsg("Please login to post a review.");
            return;
        }

        if (newReview.text.length < 10) {
            setErrorMsg("Review must be at least 10 characters long.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('${API_URL}/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: newReview.rating,
                    text: newReview.text
                })
            });
            const data = await res.json();

            if (data.success) {
                setSuccessMsg(data.message);
                setNewReview({ rating: 5, text: '' });
                // Re-fetch to show new review
                fetchReviews();
                setTimeout(() => setShowForm(false), 2000);
            } else {
                setErrorMsg(data.message || 'Failed to post review');
            }
        } catch (error) {
            setErrorMsg('Network error. Failed to post review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: 'gray' }}>Loading trusted reviews...</div>;

    // Standardize review objects
    const gReviews = (reviewsData.google?.reviews || []).map(r => ({
        id: r.author_name,
        name: r.author_name,
        profilePic: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        source: 'Google',
        verified: false
    }));

    const wReviews = (reviewsData.website?.reviews || []).map(r => ({
        id: r._id,
        name: r.userName,
        profilePic: r.profilePic,
        rating: r.rating,
        text: r.text,
        source: 'Website',
        verified: r.verifiedOrder
    }));

    const allReviewsCombined = [...gReviews, ...wReviews];

    // Compute Overall Stats
    const totalGCount = reviewsData.google?.totalReviews || 0;
    const totalWCount = reviewsData.website?.totalReviews || 0;
    const totalReviews = totalGCount + totalWCount;

    const gAvg = reviewsData.google?.rating || 0;
    const wAvg = reviewsData.website?.rating || 0;

    // Weighted Average
    let overallAvg = 0;
    if (totalReviews > 0) {
        overallAvg = ((gAvg * totalGCount) + (wAvg * totalWCount)) / totalReviews;
    }

    // Distribution dummy map based on available fetched reviews to show some visual bars
    const distCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviewsCombined.forEach(r => {
        const ceil = Math.ceil(r.rating);
        if (ceil >= 1 && ceil <= 5) distCounts[ceil]++;
    });
    const totalLocalReviews = allReviewsCombined.length || 1; // avoid / 0

    return (
        <section className="review-ecosystem-container">
            <div className="section-header">
                <h2 className="section-title">Trusted by Thousands</h2>
                <p className="section-subtitle">Real feedback from our amazing customers</p>
            </div>

            <div className="ecosystem-layout">
                {/* Left: Summary & Distributions */}
                <div className="review-summary-panel">
                    <div className="overall-rating-header">
                        <div className="big-rating">{overallAvg.toFixed(1)}</div>
                        <div className="rating-meta">
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <i key={num} className={`fa-star ${Math.round(overallAvg) >= num ? 'fas' : 'far'}`} style={{ color: '#ffb400', fontSize: '0.9rem' }}></i>
                                ))}
                            </div>
                            <div className="count-text">{totalReviews} Global Reviews</div>
                        </div>
                    </div>

                    <div className="rating-sources">
                        <div className="source-badge google-source">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
                            <span><strong>{gAvg.toFixed(1)}</strong> ({totalGCount})</span>
                        </div>
                        <div className="source-badge website-source">
                            <i className="fas fa-pizza-slice"></i>
                            <span>Menu Ratings <strong>({totalWCount})</strong></span>
                        </div>
                    </div>

                    <div className="rating-distribution">
                        {[5, 4, 3, 2, 1].map(num => (
                            <div className="dist-row" key={num}>
                                <span>{num} ★</span>
                                <div className="bar-bg">
                                    <div className="bar-fill" style={{ width: `${(distCounts[num] / totalLocalReviews) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cta-wrapper">
                        <button className="btn-primary write-btn" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel Review' : 'Write a Review'}
                        </button>
                    </div>
                </div>

                {/* Right/Bottom: Form OR Reviews Slider */}
                <div className="review-content-panel">
                    {showForm ? (
                        <div className="review-form-container animate-fade-in">
                            <h3>Share Your Experience</h3>
                            {errorMsg && <div className="alert-error">{errorMsg}</div>}
                            {successMsg && <div className="alert-success">{successMsg}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Rating</label>
                                    <div className="star-rating-select">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <i
                                                key={num}
                                                className={`fa-star ${newReview.rating >= num ? 'fas' : 'far'}`}
                                                onClick={() => setNewReview({ ...newReview, rating: num })}
                                            ></i>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Your Review</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Tell us what you loved..."
                                        value={newReview.text}
                                        onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-primary submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="testimonial-slider-wrapper" ref={testimonialRef}>
                            <div className="testimonial-slider">
                                {/* Original Reviews Array */}
                                {allReviewsCombined.map((review, idx) => (
                                    <ReviewCard review={review} key={`orig-${idx}`} />
                                ))}

                                {/* Duplicated Reviews for Seamless Loop */}
                                {allReviewsCombined.map((review, idx) => (
                                    <ReviewCard review={review} key={`dup-${idx}`} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const ReviewCard = ({ review }) => {
    return (
        <div className="testimonial-card">
            <div className="t-card-header">
                <img
                    src={review.profilePic}
                    alt={review.name}
                    className="t-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + review.name + '&background=random'; }}
                />
                <div className="t-card-meta">
                    <h5 className="reviewer-name">
                        {review.name}
                        {review.verified && <i className="fas fa-check-circle verified-badge" title="Verified Order"></i>}
                        {!review.verified && review.source === 'Website' && <i className="fas fa-check-circle auth-badge" title="Authenticated User"></i>}
                    </h5>
                    <div className="t-stars">
                        {[1, 2, 3, 4, 5].map(num => (
                            <i key={num} className={`fa-star ${Math.round(review.rating) >= num ? 'fas' : 'far'}`} style={{ color: '#ffb400', fontSize: '0.8rem' }}></i>
                        ))}
                    </div>
                </div>
                <div className={`source-icon ${review.source.toLowerCase()}`}>
                    {review.source === 'Google' ? <i className="fab fa-google"></i> : <i className="fas fa-desktop"></i>}
                </div>
            </div>
            <p className="review-text">
                "{review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text}"
                {review.text.length > 100 && <span className="read-more"> Read more</span>}
            </p>
        </div>
    );
};

export default ReviewEcosystem;
