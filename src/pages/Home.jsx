import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import menuImg1 from '../assets/pizza menu 1.png';
import menuImg2 from '../assets/pizza menu 2.png';
import offer1 from '../assets/Buy 1 Get 1 FREE.png';
import offer2 from '../assets/Super Value Friends Meal.png';
import offer3 from '../assets/Family Combo.png';
import qrCode from '../assets/qr code.png';
import pizzaImg1 from '../assets/MERGHERITA.png'; // Using existing asset for trending
import pizzaImg2 from '../assets/FARM HOUSE.png';
import pizzaImg3 from '../assets/ONION& JALAPENO.png';
import heroPizza from '../assets/hero-user-pizza.jpg';
import onionImg from '../assets/ONION.png';
import tomatoImg from '../assets/TOMATO.png';
import logo from '../assets/logo.png';
import { CartContext } from '../context/CartContext';
import ReviewEcosystem from '../components/ReviewEcosystem';

const Home = () => {
    const { addToCart, cartCount } = useContext(CartContext);
    const [showPopup, setShowPopup] = useState(false);
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
    const [isLoading, setIsLoading] = useState(true);
    const [seasonalOffer, setSeasonalOffer] = useState({ enabled: 'false', title: '', desc: '', coupon: '', new_user_discount: 20 });
    const [deliveryInfo, setDeliveryInfo] = useState({ charge: 40, threshold: 300 });

    const sliderRef = useRef(null);

    useEffect(() => {
        // Countdown timer logic
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Page Loading sequence (1 second)
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(loadingTimer);
    }, []);

    useEffect(() => {
        const checkPopup = async () => {
            try {
                const res = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings/show_welcome_popup');
                const data = await res.json();
                if (data.success && data.data?.value === 'false') return;

                const hasVisited = localStorage.getItem('hasVisitedCaptainPizza');
                if (!hasVisited) {
                    const timer = setTimeout(() => {
                        setShowPopup(true);
                        localStorage.setItem('hasVisitedCaptainPizza', 'true');
                    }, 3000); // show after 3 seconds
                    return () => clearTimeout(timer);
                }
            } catch (e) { }
        };
        checkPopup();
    }, []);

    // Infinite Auto-Scroll Logic for Offers & Testimonials
    useEffect(() => {
        const setupAutoScroll = (ref) => {
            const el = ref.current;
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
        };

        const cleanupSlider = setupAutoScroll(sliderRef);

        const fetchHomeSettings = async () => {
            try {
                // 1. Fetch General Settings
                const resSettings = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/admin/settings');
                const dataSettings = await resSettings.json();
                if (dataSettings.success) {
                    const findVal = (key, def) => dataSettings.data.find(s => s.key === key)?.value || def;
                    setSeasonalOffer(prev => ({
                        ...prev,
                        new_user_discount: findVal('new_user_discount', 20)
                    }));
                    setDeliveryInfo({
                        charge: findVal('delivery_charge', 40),
                        threshold: findVal('free_delivery_min_order', 300),
                        radius: findVal('delivery_max_distance_km', 3)
                    });
                }

                // 2. Fetch Active Seasonal Offers
                const resOffers = await fetch('https://pizza-backend-api-a5mm.onrender.com/api/offers/active');
                const dataOffers = await resOffers.json();
                if (dataOffers.success) {
                    setActiveOffers(dataOffers.data);
                }
            } catch (e) { console.error(e); }
        };
        fetchHomeSettings();

        return () => {
            if (cleanupSlider) cleanupSlider();
        };
    }, []);



    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {isLoading && (
                <div className="premium-loader-screen">
                    <div className="loader-content">
                        <img src={logo} alt="Captain Pizza" className="loader-logo-reveal" />
                        <div className="loader-progress-bar">
                            <div className="loader-progress-fill"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`home-container ${!isLoading ? 'page-fade-in-smooth' : 'hidden-initially'}`}>
                {/* Hero Section */}
                <div className="hero-wrapper">
                    <section className="hero-section animate-fade-in">
                        <div className="hero-content">
                            <div className="hot-deal-badge animate-bounce-soft">
                                🔥 <span style={{ fontWeight: 'bold' }}>
                                    {activeOffers.length > 0
                                        ? `${activeOffers[0].title}: ${activeOffers[0].description} ${activeOffers[0].couponCode ? `(Code: ${activeOffers[0].couponCode})` : ''}`
                                        : `Free Delivery on ₹${deliveryInfo.threshold}+`}
                                </span>
                            </div>
                            <h1 className="hero-title">
                                <span className="text-gradient">Hot, Fresh &</span><br /> Delicious Pizza
                            </h1>
                            <p className="hero-subtitle">
                                Experience the taste of Captain Pizza. From Classic Veg to Supreme, we bring the best ingredients to your plate.
                            </p>
                            <div className="hero-buttons">
                                <Link to="/menu" className="btn-primary hero-order-btn">Order Now</Link>
                                <a href="#offers" className="btn-secondary hero-offer-btn">View Offers</a>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="pizza-blob">
                                <img src={heroPizza} alt="Captain Pizza Hero" className="hero-animated-pizza" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Premium Trust Strip */}
                <div className="trust-strip animate-slide-up">
                    <div className="trust-item"><span className="trust-icon">🛵</span> Fast Delivery</div>
                    <div className="trust-divider"></div>
                    <div className="trust-item"><span className="trust-icon">🥬</span> Fresh Ingredients</div>
                    <div className="trust-divider"></div>
                    <div className="trust-item"><span className="trust-icon">✨</span> Hygienic Kitchen</div>
                    <div className="trust-divider"></div>
                    <div className="trust-item"><span className="trust-icon">❤️</span> Loved by Customers</div>
                </div>

                <section id="offers" className="premium-offers-section">

                    <div className="section-header">
                        <h2 className="section-title">Irresistible Deals</h2>
                        <p className="section-subtitle">Grab these limited time offers before they're gone!</p>
                    </div>

                    <div className="offers-slider-container" ref={sliderRef}>
                        <div className="offers-slider">

                            {/* ⭐ FIRST USER OFFER (NOW FIRST) */}
                            <div className="premium-offer-card first-user-card gold-glow">
                                <img src={pizzaImg1} className="offer-bg" alt="First User Offer" />
                                <div className="offer-overlay gold-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag gold-badge">NEW USER</span>
                                    <h3>First Order Magic</h3>
                                    <p>Get 20% OFF instantly</p>

                                    <Link to="/menu" className="offer-btn gold-btn" style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto', display: 'block', padding: '8px 0' }}>
                                        Claim Now
                                    </Link>
                                </div>
                            </div>

                            {/* Offer 1 */}
                            <div className="premium-offer-card">
                                <img src={offer1} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag">Ends in {formatTime(timeLeft)}</span>
                                    <h3>Buy 1 Get 1 FREE</h3>
                                    <p>On Medium & Large Pizza</p>

                                    <div className="offer-bottom">
                                        <span className="offer-price">₹340</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'cm1', name: 'BOGO', price: 340, image: offer1 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Offer 2 */}
                            <div className="premium-offer-card">
                                <img src={offer2} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag limit">Limited Deal</span>
                                    <h3>Super Value Friends Meal</h3>
                                    <p>Burger + Fries + Coke</p>

                                    <div className="offer-bottom" style={{ marginTop: 'auto' }}>
                                        <span className="offer-price">₹100</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'combo1', name: 'Friends Meal', price: 100, image: offer2 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Offer 3 */}
                            <div className="premium-offer-card">
                                <img src={offer3} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag highlight">Best Seller</span>
                                    <h3>Family Combo Special</h3>
                                    <p>Pizza + Burgers + Coke</p>

                                    <div className="offer-bottom" style={{ marginTop: 'auto' }}>
                                        <span className="offer-price">₹340</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'combo2', name: 'Family Combo', price: 340, image: offer3 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* === DUPLICATE CARDS FOR SEAMLESS LOOP === */}
                            {/* ⭐ FIRST USER OFFER (DUPLICATE) */}
                            <div className="premium-offer-card first-user-card gold-glow">
                                <img src={pizzaImg1} className="offer-bg" alt="First User Offer" />
                                <div className="offer-overlay gold-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag gold-badge">NEW USER</span>
                                    <h3>First Order Magic</h3>
                                    <p>Get {seasonalOffer.new_user_discount || 20}% OFF instantly</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.9 }}>Code: WELCOME{seasonalOffer.new_user_discount || 20}</p>

                                    <Link to="/menu" className="offer-btn gold-btn" style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto', display: 'block', padding: '8px 0' }}>
                                        Claim Now
                                    </Link>
                                </div>
                            </div>

                            {/* Offer 1 (DUPLICATE) */}
                            <div className="premium-offer-card">
                                <img src={offer1} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag">Ends in {formatTime(timeLeft)}</span>
                                    <h3>Buy 1 Get 1 FREE</h3>
                                    <p>On Medium & Large Pizza</p>

                                    <div className="offer-bottom">
                                        <span className="offer-price">₹340</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'cm1', name: 'BOGO', price: 340, image: offer1 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Offer 2 (DUPLICATE) */}
                            <div className="premium-offer-card">
                                <img src={offer2} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag limit">Limited Deal</span>
                                    <h3>Super Value Friends Meal</h3>
                                    <p>Burger + Fries + Coke</p>

                                    <div className="offer-bottom" style={{ marginTop: 'auto' }}>
                                        <span className="offer-price">₹100</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'combo1', name: 'Friends Meal', price: 100, image: offer2 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Offer 3 (DUPLICATE) */}
                            <div className="premium-offer-card">
                                <img src={offer3} className="offer-bg" alt="" />
                                <div className="offer-overlay"></div>

                                <div className="offer-content glass-bottom">
                                    <span className="urgency-tag highlight">Best Seller</span>
                                    <h3>Family Combo Special</h3>
                                    <p>Pizza + Burgers + Coke</p>

                                    <div className="offer-bottom" style={{ marginTop: 'auto' }}>
                                        <span className="offer-price">₹340</span>
                                        <button className="offer-btn"
                                            onClick={() => addToCart({ id: 'combo2', name: 'Family Combo', price: 340, image: offer3 })}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* TRENDING SECTION */}
                <section className="trending-section">
                    <h2 className="section-title">Trending 🔥</h2>
                    <div className="trending-slider">

                        <div className="trending-card">
                            <img src={pizzaImg1} alt="Margherita" className="trending-img" />
                            <div className="trending-info">
                                <div className="trending-title-row">
                                    <h4>Margherita Pizza</h4>
                                    <span className="trending-rating">⭐ 4.8</span>
                                </div>
                                <div className="trending-action">
                                    <span className="trending-price">₹150</span>
                                    <button className="add-quick-btn" onClick={() => addToCart({ id: 'p1', name: 'Margherita Pizza', price: 150, image: pizzaImg1, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="trending-card">
                            <img src={pizzaImg2} alt="Farm House" className="trending-img" />
                            <div className="trending-info">
                                <div className="trending-title-row">
                                    <h4>Farm House Pizza</h4>
                                    <span className="trending-rating">⭐ 4.9</span>
                                </div>
                                <div className="trending-action">
                                    <span className="trending-price">₹220</span>
                                    <button className="add-quick-btn" onClick={() => addToCart({ id: 'p2', name: 'Farm House Pizza', price: 220, image: pizzaImg2, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="trending-card">
                            <img src={pizzaImg3} alt="Onion & Jalapeno" className="trending-img" />
                            <div className="trending-info">
                                <div className="trending-title-row">
                                    <h4>Onion & Jalapeno</h4>
                                    <span className="trending-rating">⭐ 4.7</span>
                                </div>
                                <div className="trending-action">
                                    <span className="trending-price">₹180</span>
                                    <button className="add-quick-btn" onClick={() => addToCart({ id: 'p3', name: 'Onion & Jalapeno', price: 180, image: pizzaImg3, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>



                {/* Featured Categories / Explore Menu */}
                <section className="categories-section" style={{ padding: '60px 20px', backgroundColor: 'var(--bg-card)', width: '100%', overflow: 'hidden' }}>
                    <h2 className="section-title">Explore Full Menu</h2>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                        <Link to="/menu" style={{ flex: '1 1 100%', maxWidth: '500px', transition: 'var(--transition)' }} className="menu-image-link premium-hover-lift">
                            <img src={menuImg1} style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }} alt="Pizza Menu Part 1" />
                        </Link>
                        <Link to="/menu" style={{ flex: '1 1 100%', maxWidth: '500px', transition: 'var(--transition)' }} className="menu-image-link premium-hover-lift">
                            <img src={menuImg2} style={{ width: '100%', height: 'auto', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }} alt="Pizza Menu Part 2" />
                        </Link>
                    </div>
                </section>

                {/* Delivery Info */}
                <section className="delivery-banner premium-delivery-banner">
                    <div className="delivery-blur-bg"></div>
                    <div className="delivery-content" style={{ zIndex: 2, position: 'relative' }}>
                        <div className="delivery-badges">
                            <span className="badge-item"><i className="fas fa-motorcycle"></i> Lighting Fast</span>
                            <span className="badge-item"><i className="fas fa-box"></i> Safe Packaging</span>
                        </div>
                        <h2 className="delivery-heading">Free Home Delivery</h2>
                        <p className="delivery-subheading">Within 3KM on all orders above ₹{deliveryInfo.threshold}</p>
                        <div className="contact-info">
                            <a href="tel:9220367325" className="contact-pill"><i className="fas fa-phone-alt"></i> 9220367325</a>
                        </div>
                    </div>
                    <div className="delivery-qr-container" style={{ zIndex: 2, position: 'relative' }}>
                        <div className="qr-wrapper">
                            <img src={qrCode} alt="Scan for Location" className="premium-qr" />
                        </div>
                        <p className="qr-text" style={{ fontSize: '0.9rem', marginTop: '15px' }}>
                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }}></i> F-11 Main Road Dayalpur, Delhi
                        </p>
                    </div>
                </section>

                {/* Unified Custom Review Ecosystem (Google + Website) */}
                <ReviewEcosystem />


                {/* Smart First Order Popup */}
                {showPopup && (
                    <div className="popup-overlay animate-fade-in" onClick={() => setShowPopup(false)}>
                        <div className="popup-content animated-confetti-bg" onClick={(e) => e.stopPropagation()}>
                            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
                            <div className="popup-icon">🎁</div>
                            <h2>Welcome to Captain Pizza!</h2>
                            <p>Get <strong>{seasonalOffer.new_user_discount || 20}% OFF</strong> on your first order. Use code <strong>WELCOME{seasonalOffer.new_user_discount || 20}</strong> & treat yourself!</p>
                            <Link to="/login" className="btn-primary popup-btn">Claim Offer & Login</Link>
                        </div>
                    </div>
                )}

                <div className="mobile-sticky-bar">
                    <Link to="/menu" className="mobile-order-btn">Start Ordering Now 🍕</Link>
                </div>

            </div>
        </>
    );
};

export default Home;
