import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';
import { menuData } from '../assets/data';
import { CartContext } from '../context/CartContext';
import classNames from 'classnames';
import { ShoppingCart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Menu = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('simple-veg');
    const { addToCart, setIsCartOpen } = useContext(CartContext);
    const { user } = useContext(AuthContext);


    // Create refs for every section dynamically
    const sectionRefs = useRef({});

    const [dbItems, setDbItems] = useState([]);

    // --- BOGO State ---
    const [bogoModalOpen, setBogoModalOpen] = useState(false);
    const [bogoSelection, setBogoSelection] = useState({
        size: 'medium',
        category: null, // 'Deluxe Veg' | 'Supreme Veg'
        pizza1: null,
        pizza2: null,
    });
    const bogoOfferItem = useRef(null);

    useEffect(() => {
        fetch('https://pizza-backend-api-a5mm.onrender.com/api/menu?all=true')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setDbItems(data.data);
                }
            })
            .catch(console.error);
    }, []);

    // Generate flattened list of all categories for sidebar, merging Live DB data!
    const allCategories = React.useMemo(() => {
        let mergedData = { ...menuData };
        let customCategories = [];

        if (dbItems.length > 0) {
            const mergeArr = (arr, catType, subCatType = null) => {
                const updatedStatic = arr.map(staticItem => {
                    const live = dbItems.find(dbItem => dbItem.name === staticItem.name && (dbItem.category === catType || catType === 'pizza'));
                    if (live) {
                        const hasCustomImage = live.image && typeof live.image === 'string' && (live.image.startsWith('http') || live.image.startsWith('data:') || live.image.startsWith('/'));
                        return {
                            ...staticItem,
                            name: live.name,
                            desc: live.desc,
                            price: live.prices || live.price,
                            isAvailable: live.isAvailable,
                            image: hasCustomImage ? live.image : staticItem.image
                        };
                    }
                    return staticItem;
                });

                // Add completely NEW items that exist in dbItems but NOT in static arr
                const newLiveItems = dbItems.filter(dbItem => {
                    if (dbItem.category !== catType) return false;
                    if (subCatType && dbItem.subCategory !== subCatType) return false;

                    const staticExists = arr.find(sItem => sItem.name === dbItem.name);
                    return !staticExists;
                }).map(dbItem => {
                    const hasCustomImage = dbItem.image && typeof dbItem.image === 'string' && (dbItem.image.startsWith('http') || dbItem.image.startsWith('data:') || dbItem.image.startsWith('/'));
                    return {
                        id: dbItem._id,
                        name: dbItem.name,
                        desc: dbItem.desc,
                        price: dbItem.prices || dbItem.price,
                        image: hasCustomImage ? dbItem.image : 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                        isAvailable: dbItem.isAvailable
                    };
                });

                return [...updatedStatic, ...newLiveItems].filter(item => item.isAvailable !== false);
            };

            const pizzasMapped = menuData.pizzas.map(cat => {
                let tItems = mergeArr(cat.items, 'pizza', cat.category);
                // Remove duplicates by name just in case
                const uniquePizzas = Array.from(new Map(tItems.map(item => [item.name, item])).values());
                return { ...cat, items: uniquePizzas };
            });

            mergedData = {
                specialOffers: mergeArr(menuData.specialOffers, 'specialOffer'),
                burgers: mergeArr(menuData.burgers, 'burger'),
                wraps: mergeArr(menuData.wraps, 'wrap'),
                sandwiches: mergeArr(menuData.sandwiches, 'sandwich'),
                sides: mergeArr(menuData.sides, 'side'),
                beverages: mergeArr(menuData.beverages, 'beverage'),
                pizzas: pizzasMapped
            };

            // Custom non-default Categories 
            const defaultCats = ['specialOffer', 'burger', 'wrap', 'sandwich', 'side', 'beverage', 'pizza'];
            const customItemsDB = dbItems.filter(item => !defaultCats.includes(item.category) && item.isAvailable !== false);

            const customGroups = {};
            customItemsDB.forEach(item => {
                if (!customGroups[item.category]) customGroups[item.category] = [];
                const hasCustomImage = item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('/'));
                customGroups[item.category].push({
                    id: item._id,
                    name: item.name,
                    desc: item.desc,
                    price: item.prices || item.price,
                    image: hasCustomImage ? item.image : 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                    isAvailable: item.isAvailable
                });
            });

            customCategories = Object.keys(customGroups).map(catName => ({
                id: `custom-${catName}`,
                title: catName.toUpperCase(),
                type: 'other',
                data: customGroups[catName]
            }));
        }

        return [
            { id: 'specialOffers', title: 'SPECIAL OFFERS', type: 'other', data: mergedData.specialOffers },
            { id: 'pizzas-header', title: 'PIZZAS', type: 'header' },
            ...mergedData.pizzas.map(p => ({ id: p.id, title: p.category, type: 'pizza', data: p })),
            { id: 'burgers', title: 'Burgers', type: 'other', data: mergedData.burgers },
            { id: 'wraps', title: 'Wraps', type: 'other', data: mergedData.wraps },
            { id: 'sandwiches', title: 'Grill Sandwiches', type: 'other', data: mergedData.sandwiches },
            { id: 'sides', title: 'Side Orders', type: 'other', data: mergedData.sides },
            { id: 'beverages', title: 'Shakes & Mocktails', type: 'other', data: mergedData.beverages },
            ...customCategories
        ].filter(cat => cat.type === 'header' || (cat.data && cat.data.length > 0) || (cat.data && cat.data.items && cat.data.items.length > 0));
        // filter out empty categories
    }, [dbItems]);

    const bogoPizzasByCategory = React.useMemo(() => {
        const found = (title) => {
            const cat = allCategories.find(c => c.title === title);
            return (cat && cat.data && cat.data.items) ? cat.data.items : [];
        };
        return {
            'Deluxe Veg': found('Deluxe Veg'),
            'Supreme Veg': found('Supreme Veg'),
        };
    }, [allCategories]);

    // Pizzas available for the selected BOGO category
    const bogoPizzaPool = bogoSelection.category ? (bogoPizzasByCategory[bogoSelection.category] || []) : [];

    // Scroll Spy Effect
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;

            // Find the current active section
            for (let i = allCategories.length - 1; i >= 0; i--) {
                const category = allCategories[i];
                const element = sectionRefs.current[category.id];
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection((prev) => {
                        if (prev !== category.id) {
                            const btn = document.getElementById(`nav-btn-${category.id}`);
                            if (btn && window.innerWidth <= 960) {
                                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                            }
                            return category.id;
                        }
                        return prev;
                    });
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [allCategories]);

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = sectionRefs.current[id];
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100, // Offset for sticky nav
                behavior: 'smooth'
            });
        }
    };

    const handleAddToCartWithCheck = (item) => {
        addToCart(item);
        setIsCartOpen(true); // Open cart drawer after adding
    };

    const renderPizzaSection = (category) => (
        <div
            key={category.id}
            id={category.id}
            className="menu-section"
            ref={el => sectionRefs.current[category.id] = el}
        >
            <h3 className="category-title">{category.category}</h3>
            <div className="product-grid">
                {category.items.map(pizza => {
                    const isBestseller = ['Farm House', 'Extravaganza Veg', 'Margherita', 'Monster Club Burger', 'Family Combo'].includes(pizza.name);
                    return (
                        <div key={pizza.id} className="menu-item-card card">
                            <div className="item-image-container">
                                {isBestseller && <span className="bestseller-badge">Bestseller</span>}
                                <img
                                    src={pizza.image && (pizza.image.startsWith('http') || pizza.image.startsWith('data:') || pizza.image.startsWith('/')) ? pizza.image : `/images/menu/${pizza.image}`}
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&w=300&q=80' }}
                                    alt={pizza.name}
                                    className="item-image" loading="lazy"
                                />
                            </div>
                            <div className="item-content">
                                <h4>{pizza.name}</h4>
                                <p className="item-desc">{pizza.desc}</p>
                                <div className="simple-price-action" style={{ paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                                    <button
                                        className="add-btn"
                                        style={{ width: '100%', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                        onClick={() => handleAddToCartWithCheck(pizza)}
                                    >
                                        <ShoppingCart size={16} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderOtherSection = (id, title, items) => (
        <div
            key={id}
            id={id}
            className="menu-section"
            ref={el => sectionRefs.current[id] = el}
        >
            <h3 className="category-title">{title}</h3>
            <div className="product-grid">
                {items.map(item => {
                    const isBestseller = ['Farm House', 'Extravaganza Veg', 'Margherita', 'Monster Club Burger', 'Family Combo', 'Couple Combo'].includes(item.name);
                    return (
                        <div key={item.id} className="menu-item-card card">
                            <div className="item-image-container">
                                {isBestseller && <span className="bestseller-badge">Bestseller</span>}
                                <img
                                    src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('/')) ? item.image : `/images/menu/${item.image}`}
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&w=300&q=80' }}
                                    alt={item.name}
                                    className="item-image" loading="lazy"
                                />
                            </div>
                            <div className="item-content">
                                <h4>{item.name}</h4>
                                {item.desc && <p className="item-desc" style={{ marginBottom: '15px' }}>{item.desc}</p>}
                                <div className="simple-price-action" style={item.desc ? { marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}>
                                    <span className="price">₹{item.price}</span>
                                    {item.name === 'Buy 1 Get 1 FREE' ? (
                                        <button className="add-btn" onClick={() => {
                                            bogoOfferItem.current = item;
                                            setBogoModalOpen(true);
                                        }}>Select Pizzas</button>
                                    ) : (
                                        <button className="add-btn" onClick={() => handleAddToCartWithCheck(item)}>Add</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const handleBogoAddToCart = () => {
        if (!bogoSelection.category) { alert('Please select a pizza category!'); return; }
        if (!bogoSelection.pizza1 || !bogoSelection.pizza2) { alert('Please select both pizzas!'); return; }
        if (bogoSelection.pizza1.id === bogoSelection.pizza2.id) { alert('Please select two different pizzas!'); return; }

        const p1Price = bogoSelection.pizza1.price[bogoSelection.size] || 0;
        const p2Price = bogoSelection.pizza2.price[bogoSelection.size] || 0;
        const offerPrice = Math.max(p1Price, p2Price);

        addToCart({
            id: `bogo-${Date.now()}`,
            name: `BOGO: ${bogoSelection.pizza1.name} + ${bogoSelection.pizza2.name} (${bogoSelection.size})`,
            desc: 'Buy 1 Get 1 Special Offer',
            price: offerPrice,
            image: bogoOfferItem.current?.image || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSelection.size
        });
        setBogoModalOpen(false);
        setBogoSelection({ size: 'medium', category: null, pizza1: null, pizza2: null });
    };

    const bogoStep = !bogoSelection.category ? 1 : (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? 2 : 3;

    return (
        <div className="menu-page animate-fade-in">
            {/* ... Sidebar and Content Area ... */}
            <aside className="menu-sidebar">
                <div className="sidebar-title">Categories</div>
                {allCategories.map(cat => {
                    if (cat.type === 'header') {
                        return <div key={cat.id} className="sidebar-group-title">{cat.title}</div>;
                    }
                    return (
                        <button
                            key={cat.id}
                            id={`nav-btn-${cat.id}`}
                            className={classNames('sidebar-btn', { active: activeSection === cat.id, 'sub-category': cat.type === 'pizza' })}
                            onClick={() => scrollToSection(cat.id)}
                        >
                            {cat.title}
                        </button>
                    );
                })}
            </aside>

            {/* Main Scrolling Content Area */}
            <div className="menu-content-area">
                <div className="menu-content-header">
                    <h1>Explore the Menu</h1>
                    <p>Scroll down or select a category from the left</p>
                </div>

                <div className="menu-items-container">
                    {allCategories.map(cat => {
                        if (cat.type === 'header') return null;
                        if (cat.type === 'pizza') {
                            return renderPizzaSection(cat.data);
                        } else {
                            return renderOtherSection(cat.id, cat.title, cat.data);
                        }
                    })}
                </div>
            </div>

            {/* ── PREMIUM BOGO Modal ── */}
            {bogoModalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setBogoModalOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '720px', maxHeight: '92vh',
                            background: '#fff', borderRadius: '24px',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 50%, #FF6F00 100%)',
                            padding: '24px 28px', position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '1.6rem' }}>🎁</span>
                                        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Buy 1 Get 1 FREE</h2>
                                    </div>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Choose your 2 pizzas — pay for the higher priced one only</p>
                                </div>
                                <button
                                    onClick={() => setBogoModalOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                >×</button>
                            </div>

                            {/* Step progress */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '18px', position: 'relative' }}>
                                {['Size', 'Category', 'Pizzas', 'Confirm'].map((label, i) => {
                                    const stepNum = i + 1;
                                    const done = bogoStep > stepNum;
                                    const active = bogoStep === stepNum;
                                    return (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                                background: done ? 'rgba(255,255,255,0.9)' : active ? '#fff' : 'rgba(255,255,255,0.3)',
                                                color: done || active ? '#B71C1C' : 'rgba(255,255,255,0.6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: '900',
                                                boxShadow: active ? '0 0 0 3px rgba(255,255,255,0.3)' : 'none',
                                                transition: 'all 0.3s'
                                            }}>
                                                {done ? '✓' : stepNum}
                                            </div>
                                            <span style={{ fontSize: '0.72rem', color: active || done ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? '700' : '500', whiteSpace: 'nowrap' }}>{label}</span>
                                            {i < 3 && <div style={{ flex: 1, height: '2px', background: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', borderRadius: '2px', marginLeft: '4px' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>

                            {/* Step 1 — Size */}
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#B71C1C', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 1 — Choose Size</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {['medium', 'large'].map(sz => {
                                        const active = bogoSelection.size === sz;
                                        return (
                                            <button
                                                key={sz}
                                                onClick={() => setBogoSelection(prev => ({ ...prev, size: sz, pizza1: null, pizza2: null }))}
                                                style={{
                                                    padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '800',
                                                    border: `2px solid ${active ? '#B71C1C' : '#E8E8E8'}`,
                                                    background: active ? 'linear-gradient(135deg, #B71C1C, #D32F2F)' : '#F8F8F8',
                                                    color: active ? '#fff' : '#333',
                                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                    boxShadow: active ? '0 8px 20px rgba(183,28,28,0.25)' : 'none',
                                                    transform: active ? 'scale(1.02)' : 'scale(1)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>{sz === 'medium' ? '🍕' : '🍕'}</span>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '1rem', fontWeight: '900' }}>{sz === 'medium' ? 'Medium' : 'Large'}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{sz === 'medium' ? 'Perfect for 2' : 'Great for 3-4'}</div>
                                                </div>
                                                {active && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2 — Category */}
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#B71C1C', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 2 — Choose Category</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {['Deluxe Veg', 'Supreme Veg'].map(cat => {
                                        const active = bogoSelection.category === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setBogoSelection(prev => ({ ...prev, category: cat, pizza1: null, pizza2: null }))}
                                                style={{
                                                    padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '800',
                                                    border: `2px solid ${active ? '#B71C1C' : '#E8E8E8'}`,
                                                    background: active ? 'linear-gradient(135deg, #B71C1C, #D32F2F)' : '#F8F8F8',
                                                    color: active ? '#fff' : '#333',
                                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px',
                                                    boxShadow: active ? '0 8px 20px rgba(183,28,28,0.25)' : 'none',
                                                    transform: active ? 'scale(1.02)' : 'scale(1)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.4rem' }}>{cat === 'Deluxe Veg' ? '⭐' : '👑'}</span>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '900' }}>{cat}</div>
                                                    <div style={{ fontSize: '0.73rem', opacity: 0.8 }}>{cat === 'Deluxe Veg' ? 'Our signature range' : 'Premium selection'}</div>
                                                </div>
                                                {active && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 3 — Pick Pizzas */}
                            {bogoSelection.category && (
                                <div style={{ marginBottom: '8px' }}>
                                    <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#B71C1C', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Step 3 — Select Your 2 Pizzas</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        {[1, 2].map(slot => {
                                            const selected = slot === 1 ? bogoSelection.pizza1 : bogoSelection.pizza2;
                                            const other = slot === 1 ? bogoSelection.pizza2 : bogoSelection.pizza1;
                                            return (
                                                <div key={slot}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: selected ? '#B71C1C' : '#E0E0E0', color: selected ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '900', flexShrink: 0 }}>
                                                            {selected ? '✓' : slot}
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '700', color: selected ? '#B71C1C' : '#555' }}>
                                                            {selected ? selected.name : `Pizza ${slot}`}
                                                        </p>
                                                    </div>
                                                    <div style={{ maxHeight: '260px', overflowY: 'auto', border: `2px solid ${selected ? '#B71C1C' : '#EEE'}`, borderRadius: '16px', padding: '6px', background: '#FAFAFA', transition: 'border-color 0.2s' }}>
                                                        {bogoPizzaPool.length === 0
                                                            ? <div style={{ padding: '20px', textAlign: 'center', color: '#AAA', fontSize: '0.85rem' }}>Loading pizzas...</div>
                                                            : bogoPizzaPool.map(p => {
                                                                const isMe = selected?.id === p.id;
                                                                const isOther = other?.id === p.id;
                                                                return (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => {
                                                                            if (isOther) return;
                                                                            if (slot === 1) setBogoSelection(prev => ({ ...prev, pizza1: isMe ? null : p }));
                                                                            else setBogoSelection(prev => ({ ...prev, pizza2: isMe ? null : p }));
                                                                        }}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                                                                            marginBottom: '4px', borderRadius: '12px',
                                                                            cursor: isOther ? 'not-allowed' : 'pointer',
                                                                            border: `2px solid ${isMe ? '#B71C1C' : 'transparent'}`,
                                                                            background: isMe ? 'rgba(183,28,28,0.06)' : isOther ? '#F0F0F0' : '#fff',
                                                                            opacity: isOther ? 0.4 : 1,
                                                                            transition: 'all 0.15s',
                                                                            boxShadow: isMe ? '0 2px 8px rgba(183,28,28,0.12)' : 'none'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={(p.image?.startsWith('http') || p.image?.startsWith('/') || p.image?.startsWith('data:')) ? p.image : `/images/menu/${p.image}`}
                                                                            alt={p.name}
                                                                            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                                                                        />
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                                            <div style={{ color: '#B71C1C', fontSize: '0.78rem', fontWeight: '800', marginTop: '2px' }}>₹{p.price[bogoSelection.size]}</div>
                                                                        </div>
                                                                        {isMe && <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#B71C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                            <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.65rem' }}></i>
                                                                        </div>}
                                                                    </div>
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Summary + CTA */}
                        <div style={{ padding: '20px 28px', borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                            {bogoSelection.pizza1 && bogoSelection.pizza2 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', padding: '12px 16px', background: '#fff', borderRadius: '14px', border: '1px solid #F0E0E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.73rem', color: '#888', fontWeight: '600' }}>🎉 Your BOGO Deal</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1A1A1A', marginTop: '2px' }}>
                                            {bogoSelection.pizza1.name} <span style={{ color: '#B71C1C' }}>+</span> {bogoSelection.pizza2.name}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.72rem', color: '#888' }}>Pay only</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#B71C1C', lineHeight: 1 }}>
                                            ₹{Math.max(bogoSelection.pizza1.price[bogoSelection.size] || 0, bogoSelection.pizza2.price[bogoSelection.size] || 0)}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#AAA' }}>({bogoSelection.size})</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '14px', padding: '10px 16px', background: '#FFF8E1', borderRadius: '12px', border: '1px dashed #FFB300', fontSize: '0.82rem', color: '#795548', fontWeight: '600' }}>
                                    👆 {!bogoSelection.category ? 'Choose a size and category to get started' : 'Select both pizzas to see your deal price'}
                                </div>
                            )}
                            <button
                                onClick={handleBogoAddToCart}
                                disabled={!bogoSelection.pizza1 || !bogoSelection.pizza2}
                                style={{
                                    width: '100%', padding: '16px', border: 'none', borderRadius: '16px',
                                    background: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? '#E0E0E0' : 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                                    color: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? '#AAA' : '#fff',
                                    fontWeight: '900', fontSize: '1rem', cursor: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? 'none' : '0 8px 24px rgba(183,28,28,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <i className="fas fa-shopping-cart"></i>
                                {(!bogoSelection.pizza1 || !bogoSelection.pizza2) ? 'Select Both Pizzas First' : 'Add BOGO Deal to Cart 🎉'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
