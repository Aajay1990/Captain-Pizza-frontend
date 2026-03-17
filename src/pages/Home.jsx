import API_URL from '../apiConfig';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
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
import burgerImg from '../assets/CHEESY BURGER.png';
import wrapImg from '../assets/PANEER WRAP.png';
import sandwichImg from '../assets/CHEESE GRILL SANDWICH.png';
import sideImg from '../assets/CHEESY GARLIC BREAD.png';
import shakeImg from '../assets/BUTTER SCOTCH SHAKE .png';
import logo from '../assets/logo.png';
import { CartContext } from '../context/CartContext';
import { menuData } from '../assets/data';

const Home = () => {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const [dbItems, setDbItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeOffers, setActiveOffers] = useState([]);
    const sliderRef = useRef(null);

    const [seasonalOffer, setSeasonalOffer] = useState({ 
        badge_visible: 'true', 
        badge_text: 'HOT DEAL', 
        badge_color: '#B71C1C',
        new_user_discount: 20
    });

    const [deliveryInfo, setDeliveryInfo] = useState({ 
        marquee_text: '🎉 FREE DELIVERY ON MINIMUM ORDER OF ₹300! 🚚',
        banner_heading: 'Free Home Delivery',
        banner_subheading: 'Within 3KM on all orders above ₹300'
    });

    const getImgSrc = (img) => {
        if (!img) return 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300';
        if (typeof img !== 'string') return img;
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        if (img.startsWith('/uploads')) return `${API_URL}${img}`;
        return img;
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        
        fetch(`${API_URL}/api/menu?all=true`)
            .then(res => res.json())
            .then(data => { if (data?.success) setDbItems(data.data); })
            .catch(() => {});

        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/settings`);
                const d = await res.json();
                const oRes = await fetch(`${API_URL}/api/offers/active`);
                const oD = await oRes.json();
                if (oD.success) setActiveOffers(oD.data);
                if (d.success) {
                    const f = (k, def) => d.data.find(s => s.key === k)?.value || def;
                    setSeasonalOffer({
                        badge_visible: f('hot_deal_badge_visible', 'true'),
                        badge_text: f('hot_deal_badge_text', 'HOT DEAL'),
                        badge_color: f('hot_deal_badge_color', '#B71C1C'),
                        new_user_discount: f('new_user_discount', 20)
                    });
                    setDeliveryInfo({
                        marquee_text: f('delivery_marquee_text', '🎉 FREE DELIVERY ON MINIMUM ORDER OF ₹300! 🚚'),
                        banner_heading: f('delivery_banner_heading', 'Free Home Delivery'),
                        banner_subheading: f('delivery_banner_subheading', 'Within 3KM on all orders above ₹300')
                    });
                }
            } catch(e) {}
        };
        fetchSettings();
        return () => clearTimeout(timer);
    }, []);

    const marqueeOffers = React.useMemo(() => {
        const base = [
            { id: 'w', title: 'First Order Magic', desc: `Get ${seasonalOffer.new_user_discount}% OFF Code: WELCOME${seasonalOffer.new_user_discount}`, image: pizzaImg1, isWelcome: true },
            { id: 'b', title: 'Buy 1 Get 1 FREE', desc: 'On Medium & Large Pizzas', image: offer1, isBogo: true },
            { id: 'fm', title: 'Friends Meal', desc: 'Burger + Fries + Coke', image: offer2, price: 100, item: { id: 'c1', name: 'Friends Meal', price: 100, image: offer2 } },
            { id: 'fc', title: 'Family Combo', desc: 'Pizza + Burger + Coke', image: offer3, price: 340, item: { id: 'c2', name: 'Family Combo', price: 340, image: offer3 } }
        ];
        const dynamic = activeOffers.map(o => ({
            id: o._id, title: o.title, desc: o.description, image: getImgSrc(o.bannerImage), price: o.discountValue, item: { id: o._id, name: o.title, price: o.discountValue, image: getImgSrc(o.bannerImage) }
        }));
        return [...base, ...dynamic];
    }, [seasonalOffer, activeOffers]);

    // Auto-scroll logic for slider
    useEffect(() => {
        const interval = setInterval(() => {
            if (sliderRef.current) {
                const max = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
                if (sliderRef.current.scrollLeft >= max - 20) sliderRef.current.scrollTo({ left: 0, behavior: 'auto' });
                else sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="home-wrapper">
            {isLoading && <div className="loader">Loading...</div>}
            
            <div className="delivery-marquee" style={{ background: '#6a0dad', color: '#fff', padding: '10px 0' }}>
                <div className="marquee-text">{deliveryInfo.marquee_text}</div>
            </div>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    {seasonalOffer.badge_visible === 'true' && <div className="badge" style={{ background: seasonalOffer.badge_color }}>🔥 {seasonalOffer.badge_text}</div>}
                    <h1>Hot & Fresh Pizza<br /><span>Delivered in 30 Mins.</span></h1>
                    <p>Order the best pizzas in Delhi with fresh ingredients and fast delivery.</p>
                    <Link to="/menu" className="btn-primary">Order Now 🍕</Link>
                </div>
                <div className="hero-image">
                    <img src={heroPizza} alt="Pizza" />
                </div>
            </section>

            {/* Offers Slider */}
            <section className="offers-section">
                <h2 className="section-title">Exclusive Deals</h2>
                <div className="offers-slider" ref={sliderRef}>
                    {marqueeOffers.map(off => (
                        <div key={off.id} className="offer-card">
                            <div className="card-img"><img src={off.image} alt={off.title} /></div>
                            <div className="card-info">
                                <h3>{off.title}</h3>
                                <p>{off.desc}</p>
                                <button className="add-btn" onClick={() => off.item ? addToCart(off.item) : navigate('/menu')}>Add +</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Trending Section */}
            <section className="trending-section">
                <h2 className="section-title">Trending Now 🔥</h2>
                <div className="trending-grid">
                    <div className="t-card">
                        <img src={pizzaImg2} alt="Farm House" />
                        <h4>Farm House Pizza</h4>
                        <button onClick={() => addToCart({ id: 'p2', name: 'Farm House', price: 220, image: pizzaImg2 })}>₹220 +</button>
                    </div>
                    <div className="t-card">
                        <img src={pizzaImg1} alt="Margherita" />
                        <h4>Margherita Pizza</h4>
                        <button onClick={() => addToCart({ id: 'p1', name: 'Margherita', price: 150, image: pizzaImg1 })}>₹150 +</button>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="categories-section">
                <h2 className="section-title">Categories</h2>
                <div className="categories-grid">
                    {[
                        { name: 'Burgers', img: burgerImg, id: 'burgers' },
                        { name: 'Wraps', img: wrapImg, id: 'wraps' },
                        { name: 'Sides', img: sideImg, id: 'sides' },
                        { name: 'Shakes', img: shakeImg, id: 'beverages' }
                    ].map(c => (
                        <div key={c.id} className="cat-item" onClick={() => navigate('/menu', { state: { scrollTo: c.id } })}>
                            <img src={c.img} alt={c.name} />
                            <span>{c.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Location / QR */}
            <section className="location-banner">
                <div className="l-content">
                    <h2>{deliveryInfo.banner_heading}</h2>
                    <p>{deliveryInfo.banner_subheading}</p>
                    <div className="contact">📞 9220367325</div>
                </div>
                <div className="l-qr">
                    <img src={qrCode} alt="QR Code" />
                    <p>F-11 Main Road Dayalpur, Delhi</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
