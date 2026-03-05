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
        if (!user) {
            alert('Please login to place an order!');
            navigate('/login');
            return;
        }
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
        if (!user) { alert('Please login to place an order!'); navigate('/login'); return; }
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

            {/* BOGO Modal — 4-step flow */}
            {bogoModalOpen && (
                <div className="size-popup-overlay bogo-modal-overlay">
                    <div className="size-popup bogo-popup animate-pop-in" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="popup-header">
                            <h3><i className="fas fa-gift" style={{ color: 'var(--primary)' }}></i> Buy 1 Get 1 — Customise</h3>
                            <button className="close-popup" onClick={() => setBogoModalOpen(false)}><i className="fas fa-times"></i></button>
                        </div>

                        {/* Step 1: Size */}
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontWeight: '800', color: '#1A1A1A', marginBottom: '10px', fontSize: '0.9rem' }}>STEP 1 — Choose Size (applies to both pizzas)</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['medium', 'large'].map(sz => (
                                    <button
                                        key={sz}
                                        onClick={() => setBogoSelection(prev => ({ ...prev, size: sz, pizza1: null, pizza2: null }))}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem',
                                            border: `2px solid ${bogoSelection.size === sz ? 'var(--primary)' : '#DDD'}`,
                                            background: bogoSelection.size === sz ? 'var(--primary)' : '#FFF',
                                            color: bogoSelection.size === sz ? '#FFF' : '#333', transition: 'all 0.15s'
                                        }}
                                    >{sz === 'medium' ? '🍕 Medium' : '🍕🍕 Large'}</button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Category */}
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontWeight: '800', color: '#1A1A1A', marginBottom: '10px', fontSize: '0.9rem' }}>STEP 2 — Choose Category (both pizzas will be from this category)</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Deluxe Veg', 'Supreme Veg'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setBogoSelection(prev => ({ ...prev, category: cat, pizza1: null, pizza2: null }))}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem',
                                            border: `2px solid ${bogoSelection.category === cat ? 'var(--primary)' : '#DDD'}`,
                                            background: bogoSelection.category === cat ? 'var(--primary)' : '#FFF',
                                            color: bogoSelection.category === cat ? '#FFF' : '#333', transition: 'all 0.15s'
                                        }}
                                    >⭐ {cat}</button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3 & 4: Pick both pizzas from same pool */}
                        {bogoSelection.category && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                {[1, 2].map(slot => {
                                    const selected = slot === 1 ? bogoSelection.pizza1 : bogoSelection.pizza2;
                                    const other = slot === 1 ? bogoSelection.pizza2 : bogoSelection.pizza1;
                                    return (
                                        <div key={slot}>
                                            <p style={{ fontWeight: '800', color: '#1A1A1A', marginBottom: '8px', fontSize: '0.88rem' }}>STEP {slot + 2} — Pizza {slot}</p>
                                            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '12px', padding: '8px' }}>
                                                {bogoPizzaPool.length === 0
                                                    ? <p style={{ color: '#888', padding: '20px', textAlign: 'center' }}>Loading {bogoSelection.category} pizzas...</p>
                                                    : bogoPizzaPool.map(p => {
                                                        const isMe = selected?.id === p.id;
                                                        const isOther = other?.id === p.id;
                                                        return (
                                                            <div
                                                                key={p.id}
                                                                onClick={() => {
                                                                    if (isOther) return; // can't pick same pizza twice
                                                                    if (slot === 1) setBogoSelection(prev => ({ ...prev, pizza1: isMe ? null : p }));
                                                                    else setBogoSelection(prev => ({ ...prev, pizza2: isMe ? null : p }));
                                                                }}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                                                                    marginBottom: '4px', borderRadius: '10px', cursor: isOther ? 'not-allowed' : 'pointer',
                                                                    border: `2px solid ${isMe ? 'var(--primary)' : '#EEE'}`,
                                                                    background: isMe ? 'rgba(183,28,28,0.06)' : isOther ? '#F5F5F5' : '#FFF',
                                                                    opacity: isOther ? 0.45 : 1, transition: 'all 0.12s'
                                                                }}
                                                            >
                                                                <img
                                                                    src={(p.image?.startsWith('http') || p.image?.startsWith('/') || p.image?.startsWith('data:')) ? p.image : `/images/menu/${p.image}`}
                                                                    alt={p.name}
                                                                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }}
                                                                />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1A1A1A' }}>{p.name}</div>
                                                                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>₹{p.price[bogoSelection.size]}</div>
                                                                </div>
                                                                {isMe && <i className="fas fa-check-circle" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>}
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Summary + Add */}
                        <div style={{ borderTop: '1px solid #EEE', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Offer Price</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A' }}>
                                    {bogoSelection.pizza1 && bogoSelection.pizza2
                                        ? `₹${Math.max(bogoSelection.pizza1.price[bogoSelection.size] || 0, bogoSelection.pizza2.price[bogoSelection.size] || 0)}`
                                        : '₹—'}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#888' }}>(Pay for the higher-priced pizza only)</div>
                            </div>
                            <button
                                onClick={handleBogoAddToCart}
                                disabled={!bogoSelection.pizza1 || !bogoSelection.pizza2}
                                style={{
                                    padding: '14px 28px', background: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? '#DDD' : 'var(--primary)',
                                    color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1rem',
                                    cursor: (!bogoSelection.pizza1 || !bogoSelection.pizza2) ? 'not-allowed' : 'pointer', transition: 'all 0.15s'
                                }}
                            >
                                <i className="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
