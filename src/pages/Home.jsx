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
    const [isLoading, setIsLoading] = useState(true);
    const [seasonalOffer, setSeasonalOffer] = useState({ enabled: 'false', title: '', desc: '', coupon: '', new_user_discount: 20, badge_text: 'HOT DEAL', badge_visible: 'true' });
    const [deliveryInfo, setDeliveryInfo] = useState({ 
        charge: 40, threshold: 500, 
        marquee_text: '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY ON MINIMUM ORDER OF ₹500 only! 🚚 ORDER NOW!',
        banner_heading: 'Free Home Delivery',
        banner_subheading: 'Within 3KM on all orders above ₹500'
    });

    const [activeOffers, setActiveOffers] = useState([]);
    const sliderRef = useRef(null);

    const getImgSrc = (img, staticFallback = null) => {
        if (!img) return staticFallback || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=500';
        if (typeof img !== 'string') return img; 
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        if (img.startsWith('/uploads')) return `${API_URL}${img}`;
        
        if (!img.includes('/') && !img.includes('\\') && staticFallback) {
            return staticFallback;
        }
        
        return img;
    };

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
                    image: live?.image ? getImgSrc(live.image, staticItem.image) : staticItem.image
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
            image: getImgSrc(bogoSel.pizza1.image, pizzaImg1),
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSel.size,
        });
        setBogoOpen(false);
        setBogoSel({ category: null, size: 'medium', pizza1: null, pizza2: null });
    };

    const marqueeOffers = React.useMemo(() => {
        const staticOffers = [
            { id: 'friends', type: 'action', title: 'Super Value Friends Meal', desc: 'Burger + Fries + Coke', image: offer2, badge: 'TOP 10', price: 100, item: { id: 'combo1', name: 'Friends Meal', price: 100, image: offer2 } },
            { id: 'family', type: 'action', title: 'Family Combo Special', desc: 'Pizza + Burgers + Coke', image: offer3, badge: 'TOP 10', price: 340, item: { id: 'combo2', name: 'Family Combo', price: 340, image: offer3 } },
            { id: 'welcome', type: 'welcome', title: 'First Order Magic', desc: 'Get 20% OFF instantly • Code: WELCOME20', image: pizzaImg1, badge: 'TOP 10', price: 150, item: { id: 'welcome', name: 'First Order Magic', price: 150, image: pizzaImg1 } },
            { id: 'bogo', type: 'bogo', title: 'Buy 1 Get 1 FREE', desc: 'On Medium & Large Pizzas', image: offer1, badge: 'TOP 10', price: 150, isBogo: true }
        ];
        const dynamic = (activeOffers || []).map((o, idx) => ({
            id: o._id || `db-off-${idx}`, type: 'promo', title: o.title, desc: o.description, image: getImgSrc(o.bannerImage, offer1), badge: 'TOP 10', price: o.discountValue, item: { id: o._id, name: o.title, price: o.discountValue || 100, image: getImgSrc(o.bannerImage, offer1) }
        }));
        const full = [...staticOffers, ...dynamic];
        return [...full, ...full, ...full]; // Duplicated for marquee smoothness
    }, [seasonalOffer, activeOffers]); 

    useEffect(() => {
        if (isDragging) return;
        const interval = setInterval(() => {
            if (sliderRef.current) {
                const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
                if (sliderRef.current.scrollLeft >= maxScroll - 50) {
                    sliderRef.current.scrollTo({ left: 0, behavior: 'auto' });
                } else {
                    sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' }); 
                }
            }
        }, 4000);
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
                        badge_color: findVal('hot_deal_badge_color', '#B71C1C')
                    });
                    setDeliveryInfo({
                        charge: findVal('delivery_charge', 40),
                        threshold: findVal('free_delivery_min_order', 500),
                        marquee_text: findVal('delivery_marquee_text', '🎉 SPECIAL OFFER: 3 KM FREE DELIVERY ON MINIMUM ORDER OF ₹500 only! 🚚 ORDER NOW!'),
                        banner_heading: findVal('delivery_banner_heading', 'Free Home Delivery'),
                        banner_subheading: findVal('delivery_banner_subheading', 'Within 3KM on all orders above ₹500')
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

                <div className="delivery-marquee" style={{ background: '#6a0dad', color: 'white', padding: '10px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <div className="marquee-content" style={{ display: 'inline-block', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                        {deliveryInfo.marquee_text}
                    </div>
                </div>

                <section className="hero-two-col">
                    <div className="hero-bg-circle hero-bg-circle-1"></div>
                    <div className="hero-bg-circle hero-bg-circle-2"></div>

                    <div className="hero-left animate-fade-in">
                        {seasonalOffer.badge_visible === 'true' && (
                            <div className="hot-deal-badge animate-bounce-soft">
                                🔥 <span>{seasonalOffer.badge_text}</span>
                            </div>
                        )}
                        <h1 className="hero-h1">
                            <span className="hero-h1-accent">Hot &amp; Fresh</span><br />
                            Pizza<br />
                            <span className="hero-h1-sub">Delivered Fast.</span>
                        </h1>
                        <p className="hero-para">
                            Premium ingredients. Wood-fired taste. Straight to your door in under 30 minutes.
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
                        <img src={heroPizza} alt="Captain Pizza" className="hero-pizza-img" />
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
                                <div key={`m-${off.id}-${idx}`} className="premium-slider-card">
                                    <img src={getImgSrc(off.image)} className="offer-bg-img" alt={off.title} />
                                    <div className="offer-gradient-overlay"></div>
                                    <div className="top-10-tag">Captain's <span>TOP 10</span></div>
                                    
                                    <div className="offer-card-content">
                                        <div className="diet-icon-mini"></div>
                                        <h3 className="offer-title-overlay">{off.title}</h3>
                                        <p className="offer-desc-overlay">{off.desc}</p>
                                        
                                        <div className="offer-footer-overlay">
                                            <div className="offer-price-overlay">₹{off.price || 150}</div>
                                            <div className="offer-actions-overlay">
                                                {off.isBogo ? (
                                                    <button onClick={() => setBogoOpen(true)} className="add-btn-red">Add +</button>
                                                ) : (
                                                    <button className="add-btn-red" onClick={() => addToCart(off.item || { id: off.id, name: off.title, price: off.price, image: off.image })}>Add +</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="customise-link">Regular | New Hand Tossed <i className="fas fa-chevron-right"></i></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="trending-section">
                    <div className="section-header-left">
                        <h2 className="section-title-left">Trending 🔥</h2>
                        <div className="section-line"></div>
                    </div>
                    
                    <div className="trending-grid">
                        <div className="trending-card-new">
                            <div className="trending-img-container">
                                <img src={pizzaImg1} alt="Margherita" />
                            </div>
                            <div className="trending-content-new">
                                <div className="trending-header-new">
                                    <h4>Margherita Pizza</h4>
                                    <span className="rating-tag">⭐ 4.8</span>
                                </div>
                                <div className="trending-footer-new">
                                    <span className="price-tag">₹150</span>
                                    <button className="add-btn-circle" onClick={() => addToCart({ id: 'p1', name: 'Margherita Pizza', price: 150, image: pizzaImg1, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="trending-card-new">
                            <div className="trending-img-container">
                                <img src={pizzaImg2} alt="Farm House" />
                            </div>
                            <div className="trending-content-new">
                                <div className="trending-header-new">
                                    <h4>Farm House Pizza</h4>
                                    <span className="rating-tag">⭐ 4.9</span>
                                </div>
                                <div className="trending-footer-new">
                                    <span className="price-tag">₹220</span>
                                    <button className="add-btn-circle" onClick={() => addToCart({ id: 'p2', name: 'Farm House Pizza', price: 220, image: pizzaImg2, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="trending-card-new">
                            <div className="trending-img-container">
                                <img src={pizzaImg3} alt="Onion & Jalapeno" />
                            </div>
                            <div className="trending-content-new">
                                <div className="trending-header-new">
                                    <h4>Onion & Jalapeno</h4>
                                    <span className="rating-tag">⭐ 4.7</span>
                                </div>
                                <div className="trending-footer-new">
                                    <span className="price-tag">₹180</span>
                                    <button className="add-btn-circle" onClick={() => addToCart({ id: 'p3', name: 'Onion & Jalapeno', price: 180, image: pizzaImg3, selectedSize: 'medium' })}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cravings-section">
                    <div className="section-header-left">
                        <h2 className="section-title-left">Craving Something Delicious?</h2>
                        <div className="section-line"></div>
                    </div>
                    <div className="cravings-circles-grid">
                        {[
                            { id: 'deluxe-veg', name: 'Deluxe Veg Pizzas', img: pizzaImg1 },
                            { id: 'burgers', name: 'Burgers', img: burgerImg },
                            { id: 'wraps', name: 'Wraps', img: wrapImg },
                            { id: 'sandwiches', name: 'Sandwiches', img: sandwichImg },
                            { id: 'sides', name: 'Garlic Breads', img: sideImg },
                            { id: 'beverages', name: 'Shakes', img: shakeImg },
                        ].map(cat => (
                            <div key={cat.id} className="craving-circle-item" onClick={() => navigate('/menu', { state: { scrollTo: cat.id } })}>
                                <div className="circle-img-wrapper">
                                    <img src={cat.img} alt={cat.name} />
                                </div>
                                <span className="circle-name">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="delivery-banner-premium">
                    <div className="delivery-banner-content">
                        <div className="delivery-badges">
                            <span className="badge-pill">🚀 Lighting Fast</span>
                            <span className="badge-pill">📦 Safe Packaging</span>
                        </div>
                        <h2 className="banner-h2">{deliveryInfo.banner_heading}</h2>
                        <p className="banner-p">{deliveryInfo.banner_subheading}</p>
                        <div className="banner-contact">
                            <a href="tel:9220367325" className="call-btn-red"><i className="fas fa-phone-alt"></i> 9220367325</a>
                        </div>
                    </div>
                    <div className="delivery-banner-qr">
                        <div className="qr-box">
                            <img src={qrCode} alt="Scan Location" />
                        </div>
                        <p className="qr-loc"><i className="fas fa-map-marker-alt"></i> F-11 Main Road Dayalpur, Delhi</p>
                    </div>
                </section>
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
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setBogoOpen(false)}>
                        <div style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', background: '#fff', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'popIn 0.3s' }} onClick={e => e.stopPropagation()}>
                            <div style={{ background: grad, padding: '20px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>🎁 Buy 1 Get 1 FREE</h2>
                                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Choose 2 pizzas • Pay only for the higher-priced one</p>
                                </div>
                                <button onClick={() => setBogoOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            </div>
                            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Step 1 — Choose Category</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        {['Deluxe Veg', 'Supreme Veg'].map(c => (
                                            <button key={c} onClick={() => setBogoSel(p => ({ ...p, category: c, pizza1: null, pizza2: null }))}
                                                style={{ padding: '18px 12px', borderRadius: '18px', cursor: 'pointer', fontWeight: 900, border: `2.5px solid ${bogoSel.category === c ? primaryColor : '#EEE'}`, background: bogoSel.category === c ? bg : '#FAFAFA', color: bogoSel.category === c ? primaryColor : '#666', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                                                {c === 'Deluxe Veg' ? '⭐ Deluxe Veg' : '👑 Supreme Veg'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {cat && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Step 2 — Choose Size</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {['medium', 'large'].map(sz => (
                                                <button key={sz} onClick={() => setBogoSel(p => ({ ...p, size: sz, pizza1: null, pizza2: null }))}
                                                    style={{ padding: '16px', border: `2px solid ${bogoSel.size === sz ? primaryColor : '#EEE'}`, background: bogoSel.size === sz ? bg : '#f9f9f9', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                                                    {sz === 'medium' ? '🔵 Medium' : '🔴 Large'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {cat && (
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Step 3 — Pick 2 Pizzas</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                                            {pizzaPool.map(pz => {
                                                const isS1 = bogoSel.pizza1?.name === pz.name;
                                                const isS2 = bogoSel.pizza2?.name === pz.name;
                                                const isSel = isS1 || isS2;
                                                const pP = pz.price?.[bogoSel.size] || getDisplayPrice(pz.price);
                                                return (
                                                    <div key={pz.name} onClick={() => {
                                                        if (isSel) {
                                                            if (isS1) setBogoSel(p => ({ ...p, pizza1: null }));
                                                            if (isS2) setBogoSel(p => ({ ...p, pizza2: null }));
                                                        } else {
                                                            if (!bogoSel.pizza1) setBogoSel(p => ({ ...p, pizza1: pz }));
                                                            else if (!bogoSel.pizza2) setBogoSel(p => ({ ...p, pizza2: pz }));
                                                        }
                                                    }}
                                                        style={{ border: `2px solid ${isSel ? primaryColor : '#EEE'}`, borderRadius: '20px', padding: '12px', background: isSel ? bg : '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', position: 'relative' }}>
                                                        {isSel && <div style={{ position: 'absolute', top: '8px', right: '8px', background: primaryColor, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>✓</div>}
                                                        <img src={getImgSrc(pz.image)} alt={pz.name} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 900, textAlign: 'center', color: '#222' }}>{pz.name}</span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#B71C1C', marginTop: '4px' }}>₹{pP}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '20px 28px', borderTop: '1px solid #EEE', background: '#FAFAFA' }}>
                                {bogoSel.pizza1 && bogoSel.pizza2 ? (
                                    <button onClick={handleBogoAddToCart} style={{ width: '100%', padding: '18px', border: 'none', borderRadius: '18px', background: grad, color: '#fff', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
                                        🎁 Add BOGO Deal — Pay ₹{oP}
                                    </button>
                                ) : (
                                    <p style={{ margin: 0, fontWeight: 800, color: '#999', textAlign: 'center' }}>
                                        {!cat ? 'Select category & pizzas →' : (bogoSel.pizza1 ? 'Now select Pizza 2 →' : 'Select Pizza 1 →')}
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
