import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Home.css';
import API_URL from '../apiConfig';
import menuImg1 from '../assets/pizza menu 1.png';
import menuImg2 from '../assets/pizza menu 2.png';
import offer1 from '../assets/Buy 1 Get 1 FREE.png';
import offer2 from '../assets/Super Value Friends Meal.png';
import offer3 from '../assets/Family Combo.png';
import qrCode from '../assets/qr code.png';
import pizzaImg1 from '../assets/MERGHERITA.png'; 
import pizzaImg2 from '../assets/FARM HOUSE.png';
import pizzaImg3 from '../assets/ONION& JALAPENO.png';
import heroPizza from '../assets/hero-user-pizza.jpg';
import onionImg from '../assets/ONION.png';
import tomatoImg from '../assets/TOMATO.png';
import logo from '../assets/logo.png';
import burgerImg from '../assets/CHEESY BURGER.png';
import wrapImg from '../assets/PANEER WRAP.png';
import sandwichImg from '../assets/CHEESE GRILL SANDWICH.png';
import sideImg from '../assets/CHEESY GARLIC BREAD.png';
import shakeImg from '../assets/BUTTER SCOTCH SHAKE .png';
import { CartContext } from '../context/CartContext';
import { menuData } from '../assets/data';

const Home = () => {
    const navigate = useNavigate();
    const { addToCart, cartCount, setIsCartOpen } = useContext(CartContext);
    const [dbItems, setDbItems] = useState([]);
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); 
    const [isLoading, setIsLoading] = useState(true);
    const [seasonalOffer, setSeasonalOffer] = useState({ enabled: 'false', title: '', desc: '', image: '', coupon: '', new_user_discount: 20, badge_text: 'HOT DEAL', badge_visible: 'true' });
    const [deliveryInfo, setDeliveryInfo] = useState({ 
        charge: 40, threshold: 300, 
        marquee_text: '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY ON MINIMUM ORDER OF ₹300! 🚚 ORDER NOW!',
        banner_heading: 'Free Home Delivery',
        banner_subheading: 'Within 3KM on all orders above ₹300'
    });

    const [activeOffers, setActiveOffers] = useState([]);
    const sliderRef = useRef(null);

    const getImgSrc = (img) => {
        if (!img) return 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300';
        if (typeof img !== 'string') return img; 
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        if (img.startsWith('/uploads')) return `${API_URL}${img}`;
        // Fallback for local paths without leading slash
        if (img.includes('assets/') || img.includes('images/')) return img;
        return img;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        fetch(`${API_URL}/api/menu?all=true`)
            .then(res => res.json())
            .then(data => { if (data?.success) setDbItems(data.data); })
            .catch(() => {});

        return () => clearTimeout(loadingTimer);
    }, []);

    const [bogoOpen, setBogoOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };
    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2; 
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };
    const [bogoSel, setBogoSel] = useState({ category: null, size: 'medium', pizza1: null, pizza2: null });

    const bogoPizzasByCategory = React.useMemo(() => {
        const found = (keyword) => {
            const staticCat = menuData.pizzas.find(c => 
                (c.category || c.title || "").toLowerCase().includes(keyword.toLowerCase())
            );
            if (!staticCat) return [];
            return staticCat.items.map(staticItem => {
                const live = dbItems.find(dbItem => dbItem.name === staticItem.name);
                return {
                    ...staticItem,
                    name: live?.name || staticItem.name,
                    price: live?.prices || live?.price || staticItem.price,
                    image: live?.image ? getImgSrc(live.image) : staticItem.image
                };
            });
        };
        return {
            'Deluxe Veg': found('Deluxe'),
            'Supreme Veg': found('Supreme')
        };
    }, [dbItems]);

    const getDisplayPrice = (price) => {
        if (!price) return 0;
        if (typeof price === 'object') return price.regular || price.medium || price.small || Object.values(price)[0] || 0;
        return price;
    };

    const handleBogoAddToCart = () => {
        if (!bogoSel.pizza1 || !bogoSel.pizza2 || !bogoSel.category) return;
        const p1P = bogoSel.pizza1.price?.[bogoSel.size] || getDisplayPrice(bogoSel.pizza1.price);
        const p2P = bogoSel.pizza2.price?.[bogoSel.size] || getDisplayPrice(bogoSel.pizza2.price);
        const finalPrice = Math.max(Number(p1P), Number(p2P));

        addToCart({
            id: `bogo-${Date.now()}`,
            name: `🎁 BOGO (${bogoSel.category}): ${bogoSel.pizza1.name} + ${bogoSel.pizza2.name}`,
            desc: `Buy 1 Get 1 — ${bogoSel.size} size`,
            price: finalPrice,
            image: getImgSrc(bogoSel.pizza1.image),
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSel.size,
        });
        setBogoOpen(false);
        setBogoSel({ category: null, size: 'medium', pizza1: null, pizza2: null });
    };

    const marqueeOffers = React.useMemo(() => {
        const staticOffers = [
            { id: 'new-user', type: 'welcome', title: 'First Order Magic', desc: `Get ${seasonalOffer.new_user_discount || 20}% OFF instantly • Code: WELCOME${seasonalOffer.new_user_discount || 20}`, image: pizzaImg1, badge: 'NEW USER', badgeClass: 'gold-badge', link: '/menu', isWelcome: true },
            { id: 'bogo', type: 'bogo', title: 'Buy 1 Get 1 FREE', desc: 'On Medium & Large Pizzas', image: offer1, badge: 'TIME_LEFT', isBogo: true },
            { id: 'friends', type: 'action', title: 'Super Value Friends Meal', desc: 'Burger + Fries + Coke', image: offer2, badge: 'Limited Deal', badgeClass: 'limit', price: 100, item: { id: 'combo1', name: 'Friends Meal', price: 100, image: offer2 } },
            { id: 'family', type: 'action', title: 'Family Combo Special', desc: 'Pizza + Burgers + Coke', image: offer3, badge: 'Best Seller', badgeClass: 'highlight', price: 340, item: { id: 'combo2', name: 'Family Combo', price: 340, image: offer3 } }
        ];
        const dynamic = (activeOffers || []).map((o, idx) => ({
            id: o._id || `db-off-${idx}`, type: 'promo', title: o.title, desc: o.description, image: getImgSrc(o.bannerImage), badge: 'DEAL', badgeClass: 'highlight', price: o.discountValue, item: { id: o._id, name: o.title, price: o.discountValue || 100, image: getImgSrc(o.bannerImage) }
        }));
        const full = [...staticOffers, ...dynamic];
        return [...full, ...full, ...full];
    }, [seasonalOffer, activeOffers]);

    useEffect(() => {
        if (isDragging) return;
        const interval = setInterval(() => {
            if (sliderRef.current) {
                const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
                if (sliderRef.current.scrollLeft >= maxScroll - 50) {
                    sliderRef.current.scrollTo({ left: 0, behavior: 'auto' });
                } else {
                    sliderRef.current.scrollBy({ left: 260, behavior: 'smooth' }); 
                }
            }
        }, 3500);
        return () => clearInterval(interval);
    }, [isDragging]);

    useEffect(() => {
        const fetchHomeSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/settings`);
                const data = await res.json();
                const offerRes = await fetch(`${API_URL}/api/offers/active`);
                const offerData = await offerRes.json();
                if (offerData.success && offerData.data.length > 0) {
                    setActiveOffers(offerData.data);
                }
                if (data.success) {
                    const findVal = (key, def) => data.data.find(s => s.key === key)?.value || def;
                    setSeasonalOffer({
                        enabled: findVal('seasonal_offer_enabled', 'false'),
                        title: findVal('seasonal_offer_title', 'Special Offer'),
                        desc: findVal('seasonal_offer_desc', 'Grab your favorite pizzas!'),
                        new_user_discount: findVal('new_user_discount', 20),
                        badge_text: findVal('hot_deal_badge_text', 'HOT DEAL'),
                        badge_visible: findVal('hot_deal_badge_visible', 'true'),
                        badge_display: findVal('hot_deal_badge_display', 'inline-block'),
                        badge_color: findVal('hot_deal_badge_color', '#B71C1C'),
                        image: findVal('seasonal_offer_image', '')
                    });
                    setDeliveryInfo({
                        charge: findVal('delivery_charge', 40),
                        threshold: findVal('free_delivery_min_order', 300),
                        radius: findVal('delivery_max_distance_km', 3),
                        marquee_text: findVal('delivery_marquee_text', '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY ON MINIMUM ORDER OF ₹300! 🚚 ORDER NOW!'),
                        banner_heading: findVal('delivery_banner_heading', 'Free Home Delivery'),
                        banner_subheading: findVal('delivery_banner_subheading', 'Within 3KM on all orders above ₹300')
                    });
                }
            } catch (e) { console.error("Error fetching home configs:", e); }
        };
        fetchHomeSettings();
    }, []);

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

                <div className="delivery-marquee" style={{ background: '#6a0dad', color: 'white', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-block', animation: 'marquee 15s linear infinite', fontWeight: 'bold', fontSize: '1rem' }}>
                        {deliveryInfo.marquee_text}
                    </div>
                </div>

                <section className="hero-two-col">
                    <div className="hero-bg-circle hero-bg-circle-1"></div>
                    <div className="hero-bg-circle hero-bg-circle-2"></div>

                    <div className="hero-left animate-fade-in">
                        {seasonalOffer.badge_visible === 'true' && (
                            <div className="hot-deal-badge animate-bounce-soft" style={{
                                background: seasonalOffer.badge_color === '#B71C1C' ? 'linear-gradient(135deg, #fff3cd, #ffe8a1)' : seasonalOffer.badge_color,
                                color: seasonalOffer.badge_color === '#B71C1C' ? '#856404' : '#fff'
                            }}>
                                🔥 <span>{seasonalOffer.badge_text}</span>
                            </div>
                        )}
                        <h1 className="hero-h1">
                            {seasonalOffer.enabled === 'true' ? (
                                <>
                                    <span className="hero-h1-accent" style={{ fontSize: '3.5rem' }}>{seasonalOffer.title}</span><br />
                                    <span className="hero-h1-sub" style={{ fontSize: '2.5rem' }}>{seasonalOffer.desc}</span>
                                </>
                            ) : (
                                <>
                                    <span className="hero-h1-accent">Hot &amp; Fresh</span><br />
                                    Pizza<br />
                                    <span className="hero-h1-sub">Delivered Fast.</span>
                                </>
                            )}
                        </h1>
                        <p className="hero-para">
                            {seasonalOffer.enabled === 'true' ? "Special deal for our valued customers. Limited time offer!" : "Premium ingredients. Wood-fired taste. Straight to your door in under 30 minutes."}
                        </p>
                        <div className="hero-cta-row">
                            <Link to="/menu" className="hero-btn-primary">Order Now 🍕</Link>
                            <a href="#offers" className="hero-btn-secondary">View Offers</a>
                        </div>
                        <div className="hero-trust">
                            <span>🛵 Fast Delivery</span>
                            <span>🥬 Fresh Daily</span>
                            <span>⭐ 4.9 Rated</span>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-pizza-glow"></div>
                        <img 
                            src={
                                (seasonalOffer.enabled === 'true' && seasonalOffer.image) 
                                    ? getImgSrc(seasonalOffer.image)
                                    : heroPizza
                            } 
                            alt="Captain Pizza" 
                            className="hero-pizza-img" 
                        />
                    </div>
                </section>

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

                    <div 
                        className={`css-marquee-root ${isDragging ? 'active' : ''}`} 
                        ref={sliderRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                        <div className="css-marquee-track">
                            {marqueeOffers.map((off, idx) => (
                                <div key={`m-${off.id}-${idx}`} className="premium-slider-card css-marquee-card dominos-style">
                                    <div className="d-badge">Captain's<br/><span>TOP 10</span></div>
                                    <img src={getImgSrc(off.image)} className="d-bg-img" alt={off.title} />
                                    
                                    <div className="d-content-wrapper">
                                        <div className="d-custom-wrap">
                                            <button className="d-customise-btn">Customise <i className="fas fa-chevron-right"></i></button>
                                        </div>
                                        
                                        <div className="d-text-content">
                                            <div className="d-title-group">
                                                <div className="d-veg-icon"></div>
                                                <h3 className="d-title">{off.title}</h3>
                                            </div>
                                            <p className="d-desc">{off.desc}</p>
                                        </div>
                                        
                                        <div className="d-footer">
                                            <div className="d-price-col">
                                                <div className="d-price">₹{off.price || 150}</div>
                                                <div className="d-meta">Regular | New Hand... <i className="fas fa-chevron-right"></i></div>
                                            </div>
                                            <div className="d-actions">
                                                {off.isWelcome && <Link to="/menu" className="d-add-btn">Add +</Link>}
                                                {off.isBogo && <button onClick={() => setBogoOpen(true)} className="d-add-btn">Add +</button>}
                                                {(off.type === 'action' || off.type === 'promo') && !off.isBogo && (
                                                    <button className="d-add-btn" onClick={() => addToCart(off.item)}>Add +</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

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

                <section className="cravings-section">
                    <h2 className="section-title" style={{ fontSize: '1.8rem', textAlign: 'left', padding: '0 20px', marginBottom: '20px' }}>Craving Something Delicious?</h2>
                    <div className="cravings-grid">
                        {[
                            { id: 'deluxe-veg', name: 'Deluxe Veg Pizzas', img: pizzaImg1 },
                            { id: 'burgers', name: 'Burgers', img: burgerImg },
                            { id: 'wraps', name: 'Wraps', img: wrapImg },
                            { id: 'sandwiches', name: 'Sandwiches', img: sandwichImg },
                            { id: 'sides', name: 'Garlic Breads', img: sideImg },
                            { id: 'beverages', name: 'Shakes', img: shakeImg },
                        ].map(cat => (
                            <div key={cat.id} className="craving-item" onClick={() => navigate('/menu', { state: { scrollTo: cat.id } })} style={{ cursor: 'pointer' }}>
                                <div className="category-img">
                                    <img src={cat.img} alt={cat.name} />
                                </div>
                                <span className="craving-name">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="delivery-banner premium-delivery-banner">
                    <div className="delivery-blur-bg"></div>
                    <div className="delivery-content" style={{ zIndex: 2, position: 'relative' }}>
                        <div className="delivery-badges">
                            <span className="badge-item"><i className="fas fa-motorcycle"></i> Lighting Fast</span>
                            <span className="badge-item"><i className="fas fa-box"></i> Safe Packaging</span>
                        </div>
                        <h2 className="delivery-heading">{deliveryInfo.banner_heading}</h2>
                        <p className="delivery-subheading">{deliveryInfo.banner_subheading}</p>
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

                <div className="mobile-sticky-bar">
                    <Link to="/menu" className="mobile-order-btn">Start Ordering Now 🍕</Link>
                </div>

            </div>

            {bogoOpen && (() => {
                const cat = bogoSel.category;
                const pizzaPool = cat ? (bogoPizzasByCategory[cat] || []) : [];
                const isD = cat === 'Deluxe Veg';
                const grad = !cat ? 'linear-gradient(135deg,#B71C1C,#E53935)'
                    : isD ? 'linear-gradient(135deg,#1B5E20,#2E7D32)'
                        : 'linear-gradient(135deg,#4527A0,#7E57C2)';
                const primaryColor = !cat ? '#B71C1C' : isD ? '#2E7D32' : '#7E57C2';
                const bg = !cat ? '#FFEBEE' : isD ? '#E8F5E9' : '#EDE7F6';

                const p1P = bogoSel.pizza1?.price?.[bogoSel.size] || 0;
                const p2P = bogoSel.pizza2?.price?.[bogoSel.size] || 0;
                const oP = Math.max(Number(p1P), Number(p2P));

                return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10px 15px', paddingTop: '88px' }} onClick={() => setBogoOpen(false)}>
                        <div style={{ width: '100%', maxWidth: '780px', maxHeight: '88vh', background: '#fff', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'popIn 0.3s' }} onClick={e => e.stopPropagation()}>

                            <div style={{ background: grad, padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>🎁 Buy 1 Get 1 FREE</h2>
                                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.82rem' }}>Choose 2 pizzas • Pay only for the higher-priced one</p>
                                </div>
                                <button onClick={() => setBogoOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            </div>

                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                        Step 1 — Choose Pizza Category
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {['Deluxe Veg', 'Supreme Veg'].map(c => (
                                            <button key={c} onClick={() => setBogoSel(p => ({ ...p, category: c, pizza1: null, pizza2: null }))}
                                                style={{
                                                    padding: '16px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem',
                                                    border: `2.5px solid ${bogoSel.category === c ? primaryColor : '#DDD'}`,
                                                    background: bogoSel.category === c ? bg : '#FAFAFA',
                                                    color: bogoSel.category === c ? primaryColor : '#666',
                                                    transition: 'all 0.2s', fontFamily: 'inherit'
                                                }}>
                                                {c === 'Deluxe Veg' ? '⭐ Deluxe Veg' : '👑 Supreme Veg'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {cat && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                            Step 2 — Choose Size
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {['medium', 'large'].map(sz => (
                                                <button key={sz} onClick={() => setBogoSel(p => ({ ...p, size: sz, pizza1: null, pizza2: null }))}
                                                    style={{ padding: '14px', border: `2px solid ${bogoSel.size === sz ? primaryColor : '#EEE'}`, background: bogoSel.size === sz ? bg : '#f9f9f9', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                                                    {sz === 'medium' ? '🔵 Medium' : '🔴 Large'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {cat && (
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                                            Step 3 — Pick 2 Pizzas
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                            {pizzaPool.map(pz => {
                                                const s1 = bogoSel.pizza1?.name === pz.name;
                                                const s2 = bogoSel.pizza2?.name === pz.name;
                                                const isSel = s1 || s2;
                                                const pP = pz.price?.[bogoSel.size] || getDisplayPrice(pz.price);

                                                return (
                                                    <div key={pz.name} onClick={() => {
                                                        if (isSel) {
                                                            if (s1) setBogoSel(p => ({ ...p, pizza1: null }));
                                                            if (s2) setBogoSel(p => ({ ...p, pizza2: null }));
                                                        } else {
                                                            if (!bogoSel.pizza1) setBogoSel(p => ({ ...p, pizza1: pz }));
                                                            else if (!bogoSel.pizza2) setBogoSel(p => ({ ...p, pizza2: pz }));
                                                        }
                                                    }}
                                                        style={{
                                                            border: `2px solid ${isSel ? primaryColor : '#E0E0E0'}`, borderRadius: '16px', padding: '10px',
                                                            background: isSel ? bg : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', position: 'relative'
                                                        }}>
                                                        {isSel && <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: primaryColor, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>✓</div>}
                                                        <img src={getImgSrc(pz.image)} alt={pz.name} style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }} />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', lineHeight: '1.2', marginBottom: '4px', color: '#333' }}>{pz.name}</span>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FF5722' }}>Rs.{pP}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 20px', borderTop: '1px solid #EEE', background: '#FAFAFA' }}>
                                {bogoSel.pizza1 && bogoSel.pizza2 ? (
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px', textAlign: 'center' }}>
                                            {bogoSel.pizza1.name} + {bogoSel.pizza2.name} ({bogoSel.size}) • Pay only <strong style={{ color: primaryColor }}>Rs.{oP}</strong>
                                        </div>
                                        <button onClick={handleBogoAddToCart} style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '14px', background: grad, color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
                                            🎉 Add BOGO Deal — Pay Rs.{oP}
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontWeight: 700, color: '#aaa', fontSize: '0.88rem', textAlign: 'center' }}>
                                        {!cat ? 'Select category & pizzas to continue →' : (bogoSel.pizza1 ? 'Now select Pizza 2 →' : 'Select Pizza 1 to continue →')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

        </>
    );
};

export default Home;
