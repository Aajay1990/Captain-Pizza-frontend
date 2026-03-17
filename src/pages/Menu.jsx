import API_URL from '../apiConfig';
﻿import React, { useState, useContext, useRef, useEffect } from 'react';
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

    // --- Two separate BOGO modals ---
    const [bogoOpen, setBogoOpen] = useState(null); // 'Deluxe Veg' | 'Supreme Veg' | null
    const [bogoSel, setBogoSel] = useState({ size: 'medium', pizza1: null, pizza2: null });
    const bogoOfferItem = useRef(null);

    useEffect(() => {
        fetch(`${API_URL}/api/menu?all=true`)
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

    // Pizzas in the currently open BOGO offer
    const bogoPizzaPool = bogoOpen ? (bogoPizzasByCategory[bogoOpen] || []) : [];

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
                                    src={pizza.image && (pizza.image.startsWith('http') || pizza.image.startsWith('data:'))
                                        ? pizza.image
                                        : pizza.image && pizza.image.startsWith('/uploads')
                                            ? `${API_URL}${pizza.image}`
                                            : `/images/menu/${pizza.image}`}
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
                                    src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                                        ? item.image
                                        : item.image && item.image.startsWith('/uploads')
                                            ? `${API_URL}${item.image}`
                                            : `/images/menu/${item.image}`}
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&w=300&q=80' }}
                                    alt={item.name}
                                    className="item-image" loading="lazy"
                                />
                            </div>
                            <div className="item-content">
                                <h4>{item.name}</h4>
                                {item.desc && <p className="item-desc" style={{ marginBottom: '15px' }}>{item.desc}</p>}
                                <div className="simple-price-action" style={item.desc ? { marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}>
                                    <span className="price">â‚¹{item.price}</span>
                                    {item.name === 'Buy 1 Get 1 FREE (Deluxe Veg)' ? (
                                        <button className="add-btn" style={{ fontSize: '0.82rem' }} onClick={() => openBogo('Deluxe Veg')}>â­ Select Pizzas</button>
                                    ) : item.name === 'Buy 1 Get 1 FREE (Supreme Veg)' ? (
                                        <button className="add-btn" style={{ fontSize: '0.82rem' }} onClick={() => openBogo('Supreme Veg')}>ðŸ‘‘ Select Pizzas</button>
                                    ) : item.name === 'Buy 1 Get 1 FREE' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                            <button className="add-btn" style={{ fontSize: '0.78rem', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }} onClick={() => openBogo('Deluxe Veg')}>â­ Deluxe BOGO</button>
                                            <button className="add-btn" style={{ fontSize: '0.78rem' }} onClick={() => openBogo('Supreme Veg')}>ðŸ‘‘ Supreme BOGO</button>
                                        </div>
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

    const openBogo = (category) => {
        setBogoOpen(category);
        setBogoSel({ size: 'medium', pizza1: null, pizza2: null });
    };

    const closeBogo = () => { setBogoOpen(null); setBogoSel({ size: 'medium', pizza1: null, pizza2: null }); };

    const handleBogoAddToCart = () => {
        if (!bogoSel.pizza1 || !bogoSel.pizza2) { alert('Please select both pizzas!'); return; }
        if (bogoSel.pizza1.id === bogoSel.pizza2.id) { alert('Please select two different pizzas!'); return; }

        const p1Price = bogoSel.pizza1.price?.[bogoSel.size] || 0;
        const p2Price = bogoSel.pizza2.price?.[bogoSel.size] || 0;
        const offerPrice = Math.max(p1Price, p2Price);

        addToCart({
            id: `bogo-${Date.now()}`,
            name: `ðŸŽ BOGO (${bogoOpen}): ${bogoSel.pizza1.name} + ${bogoSel.pizza2.name}`,
            desc: `Buy 1 Get 1 â€” ${bogoSel.size} size`,
            price: offerPrice,
            image: bogoSel.pizza1.image && bogoSel.pizza1.image.startsWith('/uploads') ? `${API_URL}${bogoSel.pizza1.image}` : bogoSel.pizza1.image || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300',
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSel.size,
        });
        setIsCartOpen(true);
        closeBogo();
    };

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

            {/* â”€â”€ TWO BOGO Modals â”€â”€ */}
            {bogoOpen && (() => {
                const p1Price = bogoSel.pizza1?.price?.[bogoSel.size] || 0;
                const p2Price = bogoSel.pizza2?.price?.[bogoSel.size] || 0;
                const offerPrice = Math.max(p1Price, p2Price);
                const isDeluxe = bogoOpen === 'Deluxe Veg';
                const gradHead = isDeluxe
                    ? 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #43A047 100%)'
                    : 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 60%, #E64A19 100%)';
                return (
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                        }}
                        onClick={closeBogo}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', maxWidth: '740px', maxHeight: '92vh',
                                background: '#fff', borderRadius: '24px',
                                boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
                            }}
                        >
                            {/* â”€â”€ Modal Header â”€â”€ */}
                            <div style={{ background: gradHead, padding: '22px 28px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{isDeluxe ? 'â­' : 'ðŸ‘‘'}</span>
                                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '900' }}>BOGO â€” {bogoOpen}</h2>
                                            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px' }}>Buy 1 Get 1 FREE</span>
                                        </div>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.83rem' }}>Select size â†’ choose 2 {bogoOpen} pizzas â€” pay for the higher priced one only</p>
                                    </div>
                                    <button
                                        onClick={closeBogo}
                                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    >Ã—</button>
                                </div>

                                {/* Step indicators */}
                                <div style={{ display: 'flex', gap: '0', marginTop: '16px', position: 'relative' }}>
                                    {['1. Size', '2. Pizza 1', '3. Pizza 2', '4. Confirm'].map((label, i) => {
                                        const done = (i === 0 && bogoSel.size) || (i === 1 && bogoSel.pizza1) || (i === 2 && bogoSel.pizza2);
                                        const active = (i === 0 && !bogoSel.pizza1) || (i === 1 && bogoSel.size && !bogoSel.pizza1) || (i === 2 && bogoSel.pizza1 && !bogoSel.pizza2) || (i === 3 && bogoSel.pizza1 && bogoSel.pizza2);
                                        return (
                                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                                <div style={{
                                                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                                    background: done ? 'rgba(255,255,255,0.9)' : active ? '#fff' : 'rgba(255,255,255,0.25)',
                                                    color: done || active ? (isDeluxe ? '#1B5E20' : '#B71C1C') : 'rgba(255,255,255,0.6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.62rem', fontWeight: '900', transition: 'all 0.2s',
                                                    boxShadow: active ? '0 0 0 3px rgba(255,255,255,0.25)' : 'none'
                                                }}>{done ? 'âœ“' : i + 1}</div>
                                                <span style={{ fontSize: '0.68rem', color: active || done ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: active ? '700' : '500', whiteSpace: 'nowrap' }}>{label}</span>
                                                {i < 3 && <div style={{ flex: 1, height: '1.5px', background: done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)', borderRadius: '2px', marginLeft: '4px' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* â”€â”€ Modal Body â”€â”€ */}
                            <div style={{ overflowY: 'auto', padding: '22px 28px', flex: 1 }}>

                                {/* Size */}
                                <p style={{ fontSize: '0.73rem', fontWeight: '800', color: isDeluxe ? '#1B5E20' : '#B71C1C', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>Step 1 â€” Choose Size</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
                                    {['medium', 'large'].map(sz => {
                                        const active = bogoSel.size === sz;
                                        const accentColor = isDeluxe ? '#2E7D32' : '#B71C1C';
                                        return (
                                            <button
                                                key={sz}
                                                onClick={() => setBogoSel(prev => ({ ...prev, size: sz, pizza1: null, pizza2: null }))}
                                                style={{
                                                    padding: '14px', borderRadius: '14px', cursor: 'pointer', fontWeight: '800',
                                                    border: `2px solid ${active ? accentColor : '#E8E8E8'}`,
                                                    background: active ? `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)` : '#F8F8F8',
                                                    color: active ? '#fff' : '#333', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                    boxShadow: active ? `0 6px 16px ${accentColor}40` : 'none',
                                                    transform: active ? 'scale(1.02)' : 'scale(1)', fontFamily: 'inherit'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.3rem' }}>ðŸ•</span>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: '900' }}>{sz === 'medium' ? 'Medium' : 'Large'}</div>
                                                    <div style={{ fontSize: '0.73rem', opacity: 0.8 }}>
                                                        {bogoPizzaPool.length > 0
                                                            ? `from â‚¹${Math.min(...bogoPizzaPool.map(p => p.price?.[sz] || 999))}`
                                                            : sz === 'medium' ? 'Perfect for 2' : 'Perfect for 3-4'
                                                        }
                                                    </div>
                                                </div>
                                                {active && <span style={{ marginLeft: 'auto' }}>âœ“</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Pizza picker â€” side by side */}
                                <p style={{ fontSize: '0.73rem', fontWeight: '800', color: isDeluxe ? '#1B5E20' : '#B71C1C', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px' }}>Steps 2 & 3 â€” Pick Your 2 {bogoOpen} Pizzas</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    {[1, 2].map(slot => {
                                        const selected = slot === 1 ? bogoSel.pizza1 : bogoSel.pizza2;
                                        const other = slot === 1 ? bogoSel.pizza2 : bogoSel.pizza1;
                                        const accentColor = isDeluxe ? '#2E7D32' : '#B71C1C';
                                        return (
                                            <div key={slot}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: selected ? accentColor : '#E0E0E0', color: selected ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', flexShrink: 0 }}>
                                                        {selected ? 'âœ“' : slot}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: selected ? accentColor : '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {selected ? selected.name : `Pizza ${slot}`}
                                                        {selected && <span style={{ color: '#B71C1C', marginLeft: '6px', fontWeight: '900' }}>â‚¹{selected.price?.[bogoSel.size] || 'â€”'}</span>}
                                                    </p>
                                                </div>
                                                <div style={{
                                                    maxHeight: '260px', overflowY: 'auto',
                                                    border: `2px solid ${selected ? accentColor : '#EEE'}`,
                                                    borderRadius: '14px', padding: '6px', background: '#FAFAFA', transition: 'border-color 0.2s'
                                                }}>
                                                    {bogoPizzaPool.length === 0
                                                        ? <div style={{ padding: '24px', textAlign: 'center', color: '#AAA', fontSize: '0.85rem' }}>No {bogoOpen} pizzas yet</div>
                                                        : bogoPizzaPool.map(p => {
                                                            const isMe = selected?.id === p.id;
                                                            const isOther = other?.id === p.id;
                                                            const pPrice = p.price?.[bogoSel.size];
                                                            return (
                                                                <div
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        if (isOther) return;
                                                                        if (slot === 1) setBogoSel(prev => ({ ...prev, pizza1: isMe ? null : p }));
                                                                        else setBogoSel(prev => ({ ...prev, pizza2: isMe ? null : p }));
                                                                    }}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px',
                                                                        marginBottom: '4px', borderRadius: '10px',
                                                                        cursor: isOther ? 'not-allowed' : 'pointer',
                                                                        border: `2px solid ${isMe ? accentColor : 'transparent'}`,
                                                                        background: isMe ? `${accentColor}0D` : isOther ? '#F0F0F0' : '#fff',
                                                                        opacity: isOther ? 0.4 : 1, transition: 'all 0.12s',
                                                                        boxShadow: isMe ? `0 2px 8px ${accentColor}20` : 'none'
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={(p.image?.startsWith('http') || p.image?.startsWith('data:'))
                                                                            ? p.image
                                                                            : p.image?.startsWith('/uploads')
                                                                                ? `${API_URL}${p.image}`
                                                                                : `/images/menu/${p.image}`}
                                                                        alt={p.name}
                                                                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '9px', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100'; }}
                                                                    />
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                                        <div style={{ color: accentColor, fontSize: '0.77rem', fontWeight: '800', marginTop: '2px' }}>â‚¹{pPrice || 'â€”'}</div>
                                                                    </div>
                                                                    {isMe && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.6rem' }}></i>
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

                            {/* â”€â”€ Modal Footer â”€â”€ */}
                            <div style={{ padding: '18px 28px', borderTop: '1px solid #F0F0F0', background: '#FAFAFA', flexShrink: 0 }}>
                                {bogoSel.pizza1 && bogoSel.pizza2 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px 14px', background: '#fff', borderRadius: '12px', border: '1px solid #F0E8E8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: '600' }}>ðŸŽ‰ Your {bogoOpen} BOGO Deal ({bogoSel.size})</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1A1A1A', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {bogoSel.pizza1.name} <span style={{ color: '#B71C1C' }}>+</span> {bogoSel.pizza2.name}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '0.68rem', color: '#888' }}>You pay only</div>
                                            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#B71C1C', lineHeight: 1 }}>â‚¹{offerPrice}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#AAA', marginTop: '1px' }}>was â‚¹{p1Price + p2Price}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '12px', padding: '9px 14px', background: '#FFF8E1', borderRadius: '10px', border: '1px dashed #FFB300', fontSize: '0.8rem', color: '#795548', fontWeight: '600' }}>
                                        ðŸ‘† {!bogoSel.pizza1 ? 'Select your first pizza' : 'Now select the second pizza'}
                                    </div>
                                )}
                                <button
                                    onClick={handleBogoAddToCart}
                                    disabled={!bogoSel.pizza1 || !bogoSel.pizza2}
                                    style={{
                                        width: '100%', padding: '15px', border: 'none', borderRadius: '14px',
                                        background: (!bogoSel.pizza1 || !bogoSel.pizza2) ? '#E0E0E0' : (isDeluxe ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : 'linear-gradient(135deg, #B71C1C, #D32F2F)'),
                                        color: (!bogoSel.pizza1 || !bogoSel.pizza2) ? '#AAA' : '#fff',
                                        fontWeight: '900', fontSize: '0.95rem',
                                        cursor: (!bogoSel.pizza1 || !bogoSel.pizza2) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: (!bogoSel.pizza1 || !bogoSel.pizza2) ? 'none' : '0 6px 20px rgba(0,0,0,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'inherit'
                                    }}
                                >
                                    <i className="fas fa-shopping-cart"></i>
                                    {(!bogoSel.pizza1 || !bogoSel.pizza2) ? 'Select Both Pizzas' : `Add BOGO to Cart â€” Pay â‚¹${offerPrice} ðŸŽ‰`}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Menu;
