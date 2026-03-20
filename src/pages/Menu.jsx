import React, { useState, useContext, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Menu.css';
import API_URL from '../apiConfig';
import { menuData } from '../assets/data';
import { CartContext } from '../context/CartContext';
import classNames from 'classnames';
import { ShoppingCart } from 'lucide-react';

const Menu = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('specialOffers');
    const { addToCart, setIsCartOpen } = useContext(CartContext);
    const sectionRefs = useRef({});
    const [dbItems, setDbItems] = useState([]);
    const [apiLoading, setApiLoading] = useState(true);
    const [apiSlow, setApiSlow] = useState(false);

    const [bogoOpen, setBogoOpen] = useState(false);
    const [bogoSel, setBogoSel] = useState({ category: null, size: 'medium', pizza1: null, pizza2: null });

    const getImgSrc = (img, staticFallback = null) => {
        if (!img) return staticFallback || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=500';
        if (typeof img !== 'string') return img; 
        
        let normalizedImg = img.replace(/\\/g, '/');
        if (normalizedImg.startsWith('uploads/')) normalizedImg = '/' + normalizedImg;
        if (normalizedImg.startsWith('http') || normalizedImg.startsWith('data:')) return normalizedImg;
        if (normalizedImg.startsWith('/uploads')) return `${API_URL}${normalizedImg}`;
        
        if (!normalizedImg.includes('/') && staticFallback) {
            return staticFallback;
        }
        return normalizedImg;
    };

    useEffect(() => {
        if (location.state?.openBogo) {
            setBogoOpen(true);
            window.history.replaceState({}, document.title);
        }
        if (location.state?.scrollTo) {
            const targetId = location.state.scrollTo;
            const timer = setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSection(targetId);
                } else {
                    const ref = sectionRefs.current[targetId];
                    if (ref) window.scrollTo({ top: ref.offsetTop - 100, behavior: 'smooth' });
                }
            }, 600);
            window.history.replaceState({}, document.title);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    useEffect(() => {
        let slowTimer = setTimeout(() => setApiSlow(true), 5000); 
        fetch(`${API_URL}/api/menu?all=true`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setDbItems(data.data);
                }
            })
            .catch(() => {})
            .finally(() => { clearTimeout(slowTimer); setApiLoading(false); setApiSlow(false); });
        return () => clearTimeout(slowTimer);
    }, []);

    const getDisplayPrice = (price) => {
        if (price === null || price === undefined) return '';
        if (typeof price === 'object') {
            return price.regular || price.medium || price.small || Object.values(price)[0] || '';
        }
        return price;
    };

    const allCategories = React.useMemo(() => {
        let mergedData = { ...menuData };
        let customCategories = [];

        if (dbItems.length > 0) {
            const mergeArr = (arr, catType, subCatType = null) => {
                const updatedStatic = arr.map(staticItem => {
                    const live = dbItems.find(dbItem =>
                        dbItem.name === staticItem.name && (dbItem.category === catType || catType === 'pizza')
                    );
                    if (live) {
                        return {
                            ...staticItem,
                            name: live.name || staticItem.name,
                            desc: live.desc || staticItem.desc,
                            price: live.prices || live.price || staticItem.price,
                            isAvailable: live.isAvailable,
                            image: live.image && (live.image.startsWith('/uploads') || live.image.startsWith('http')) 
                                ? getImgSrc(live.image) 
                                : staticItem.image
                        };
                    }
                    return staticItem;
                });

                const newLive = dbItems.filter(dbItem => {
                    if (dbItem.category !== catType) return false;
                    const fallbackSub = dbItem.subCategory || (catType === 'pizza' ? 'Deluxe Veg' : null);
                    if (subCatType && fallbackSub !== subCatType) return false;
                    return !arr.find(s => s.name === dbItem.name);
                }).map(dbItem => {
                    return {
                        id: dbItem._id,
                        name: dbItem.name || 'Item',
                        desc: dbItem.desc || '',
                        price: dbItem.prices || dbItem.price,
                        image: getImgSrc(dbItem.image),
                        isAvailable: dbItem.isAvailable
                    };
                });
                return [...updatedStatic, ...newLive].filter(item => item.isAvailable !== false);
            };

            const pizzasMapped = menuData.pizzas.map(cat => {
                const tItems = mergeArr(cat.items, 'pizza', cat.category);
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

            const defaultCats = ['specialOffer', 'burger', 'wrap', 'sandwich', 'side', 'beverage', 'pizza'];
            const customItemsDB = dbItems.filter(item => !defaultCats.includes(item.category) && item.isAvailable !== false);
            const customGroups = {};
            customItemsDB.forEach(item => {
                if (!customGroups[item.category]) customGroups[item.category] = [];
                customGroups[item.category].push({
                    id: item._id,
                    name: item.name || 'Item',
                    desc: item.desc || '',
                    price: item.prices || item.price,
                    image: getImgSrc(item.image),
                    isAvailable: item.isAvailable
                });
            });
            customCategories = Object.keys(customGroups).map(catName => ({
                id: `custom-${catName}`, title: catName.toUpperCase(), type: 'other', data: customGroups[catName]
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
        ].filter(cat =>
            cat.type === 'header' ||
            (cat.data && Array.isArray(cat.data) && cat.data.length > 0) ||
            (cat.data && cat.data.items && cat.data.items.length > 0)
        );
    }, [dbItems]);

    const bogoPizzasByCategory = React.useMemo(() => {
        const found = (keyword) => {
            const cat = allCategories.find(c =>
                c.type === 'pizza' &&
                (c.title || "").toLowerCase().includes(keyword.toLowerCase())
            );
            if (!cat) return [];
            return cat.data?.items || [];
        };
        return {
            'Deluxe Veg': found('Deluxe'),
            'Supreme Veg': found('Supreme')
        };
    }, [allCategories]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            for (let i = allCategories.length - 1; i >= 0; i--) {
                const category = allCategories[i];
                const element = sectionRefs.current[category.id];
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(prev => {
                        if (prev !== category.id) {
                            const btn = document.getElementById(`nav-btn-${category.id}`);
                            if (btn && window.innerWidth <= 960) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
        if (element) window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
    };

    const handleAddToCart = (item) => { addToCart(item); };

    const isBestseller = (name) => ['Farm House', 'Extravaganza Veg', 'Margherita', 'Monster Club Burger', 'Family Combo', 'Double Cheese Margherita'].includes(name);

    const renderPizzaSection = (category) => (
        <div key={category.id} id={category.id} className="menu-section" ref={el => sectionRefs.current[category.id] = el}>
            <h3 className="category-title">{category.category}</h3>
            <div className="product-grid">
                {(category.items || []).map(pizza => {
                    const isBestseller = ['Farm House', 'Extravaganza Veg', 'Margherita'].includes(pizza.name);
                    const imgSrc = getImgSrc(pizza.image);
                    const priceObj = (typeof pizza.price === 'object' && pizza.price !== null) ? pizza.price : null;
                    const flatPrice = priceObj ? null : pizza.price;
                    const sizeLabels = priceObj
                        ? Object.entries(priceObj).map(([sz, pr]) => ({ sz, pr: Number(pr) }))
                        : (flatPrice ? [{ sz: 'regular', pr: Number(flatPrice) }] : []);
                    const sizeDisplay = { small: 'R', medium: 'M', large: 'L', regular: 'R' };

                    return (
                        <div key={pizza.id || pizza.name} className="premium-menu-card">
                            <div className="premium-card-media">
                                {isBestseller && <span className="bestseller-badge">⭐ Bestseller</span>}
                                <img src={imgSrc} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=400&q=70'; }} alt={pizza.name} className="premium-img" />
                                
                                <div className="premium-overlay">
                                    <div className="premium-info">
                                        <h4>{pizza.name}</h4>
                                        <p className="premium-desc">{pizza.desc}</p>
                                    </div>
                                    
                                    <div className="premium-actions">
                                        {sizeLabels.length > 0 ? (
                                            <div className="premium-size-row">
                                                {sizeLabels.map(({ sz, pr }) => (
                                                    <button
                                                        key={sz}
                                                        onClick={() => handleAddToCart({ ...pizza, selectedSize: sz, price: pr })}
                                                        className="premium-size-btn"
                                                    >
                                                        <span className="sz-label">{sizeDisplay[sz] || sz}</span>
                                                        <span className="sz-price">₹{pr}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="premium-flat-row">
                                                <span className="premium-price">₹{flatPrice}</span>
                                                <button className="premium-red-add" onClick={() => handleAddToCart(pizza)}>Add +</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="size-selector-row">
                            {['small', 'medium', 'large'].map(sz => {
                                const p = pizza.price?.[sz];
                                if (!p) return null;
                                return (
                                    <div key={sz} className="size-btn-v2" onClick={() => handleAddToCartWithCheck(pizza, sz)}>
                                        <span className="letter">{sz.charAt(0).toUpperCase()}</span>
                                        <span className="price">₹{p}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOtherSection = (id, title, items) => (
        <div key={id} id={id} className="menu-section" ref={el => sectionRefs.current[id] = el}>
            <h3 className="category-title">{title}</h3>
            <div className="product-grid">
                {(items || []).map(item => {
                    const itemName = item.name || '';
                    const isBestseller = ['Farm House', 'Extravaganza Veg', 'Margherita', 'Monster Club Burger', 'Family Combo'].includes(itemName);
                    const isBogo = itemName.includes('Buy 1 Get 1') || itemName.includes('BOGO');
                    const displayPrice = getDisplayPrice(item.price);
                    const imgSrc = getImgSrc(item.image);
                    return (
                        <div key={item.id || itemName} className="premium-menu-card">
                            <div className="premium-card-media">
                                {isBestseller && <span className="bestseller-badge">⭐ Bestseller</span>}
                                {isBogo && <span className="bogo-badge">🎁 BOGO</span>}
                                <img src={imgSrc} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=400&q=70'; }} alt={itemName} className="premium-img" />
                                
                                <div className="premium-overlay">
                                    <div className="premium-info">
                                        <h4>{itemName}</h4>
                                        {item.desc && <p className="premium-desc">{item.desc}</p>}
                                    </div>
                                    
                                    <div className="premium-actions">
                                        <div className="premium-flat-row">
                                            {!isBogo && displayPrice && (
                                                <span className="premium-price">₹{displayPrice}</span>
                                            )}
                                            {isBogo ? (
                                                <button className="premium-red-add" onClick={() => setBogoOpen(true)}>
                                                    Select +
                                                </button>
                                            ) : (
                                                <button className="premium-red-add" onClick={() => handleAddToCart(item)}>
                                                    Add +
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="offer-actions">
                                <span className="offer-price">₹{typeof item.price === 'object' ? (item.price.medium || item.price.regular) : item.price}</span>
                                {item.name.includes('Deluxe Veg') ? (
                                    <button className="red-add-btn" onClick={() => openBogo('Deluxe Veg')}>Select +</button>
                                ) : item.name.includes('Supreme Veg') ? (
                                    <button className="red-add-btn" onClick={() => openBogo('Supreme Veg')}>Select +</button>
                                ) : item.name === 'Buy 1 Get 1 FREE' ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="red-add-btn" style={{ padding: '8px 12px', fontSize: '0.75rem' }} onClick={() => openBogo('Deluxe Veg')}>Deluxe +</button>
                                        <button className="red-add-btn" style={{ padding: '8px 12px', fontSize: '0.75rem' }} onClick={() => openBogo('Supreme Veg')}>Supreme +</button>
                                    </div>
                                ) : (
                                    <button className="red-add-btn" onClick={() => handleAddToCartWithCheck(item)}>Add +</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const handleBogoAddToCart = () => {
        if (!bogoSel.pizza1 || !bogoSel.pizza2 || !bogoSel.category) return;
        const p1P = bogoSel.pizza1.price?.[bogoSel.size] || getDisplayPrice(bogoSel.pizza1.price) || 0;
        const p2P = bogoSel.pizza2.price?.[bogoSel.size] || getDisplayPrice(bogoSel.pizza2.price) || 0;
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
        setIsCartOpen(true);
        setBogoOpen(false);
        setBogoSel({ category: null, size: 'medium', pizza1: null, pizza2: null });
    };

    return (
        <div className="menu-page animate-fade-in">
            {apiSlow && (
                <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontSize: '0.85rem', zIndex: 9999, animation: 'fadeIn 0.5s', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    🔄 Server warming up… menu will load in a moment
                </div>
            )}

            <aside className="menu-sidebar">
                <div className="sidebar-title">Categories</div>
                {allCategories.map(cat => {
                    if (cat.type === 'header') return <div key={cat.id} className="sidebar-group-title">{cat.title}</div>;
                    return (
                        <button key={cat.id} id={`nav-btn-${cat.id}`}
                            className={classNames('sidebar-btn', { active: activeSection === cat.id, 'sub-category': cat.type === 'pizza' })}
                            onClick={() => scrollToSection(cat.id)}>
                            {cat.title}
                        </button>
                    );
                })}
            </aside>

            <div className="menu-content-area">

                <div className="menu-content-header">
                    <h1>Explore the Menu</h1>
                    <p>Scroll down or select a category from the left</p>
                </div>
                <div className="menu-items-container">
                    {allCategories.map(cat => {
                        if (cat.type === 'header') return null;
                        return cat.type === 'pizza'
                            ? renderPizzaSection(cat.data)
                            : renderOtherSection(cat.id, cat.title, cat.data);
                    })}
                </div>
            </div>

            {bogoOpen && (() => {
                const cat = bogoSel.category;
                const pizzaPool = cat ? (bogoPizzasByCategory[cat] || []) : [];
                const isD = cat === 'Deluxe Veg';
                const grad = !cat ? 'linear-gradient(135deg,#B71C1C,#E53935)'
                    : isD ? 'linear-gradient(135deg,#1B5E20,#2E7D32)'
                        : 'linear-gradient(135deg,#4527A0,#7E57C2)';
                const primary = !cat ? '#B71C1C' : isD ? '#2E7D32' : '#7E57C2';
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
                                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Step 1 — Choose Pizza Category</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {['Deluxe Veg', 'Supreme Veg'].map(c => (
                                            <button key={c} onClick={() => setBogoSel(p => ({ ...p, category: c, pizza1: null, pizza2: null }))}
                                                style={{ padding: '16px 12px', borderRadius: '16px', border: `2.5px solid ${bogoSel.category === c ? primary : '#DDD'}`, background: bogoSel.category === c ? bg : '#FAFAFA', color: bogoSel.category === c ? primary : '#666', fontWeight: 800, transition: 'all 0.2s' }}>
                                                {c === 'Deluxe Veg' ? '⭐ Deluxe Veg' : '👑 Supreme Veg'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {cat && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Step 2 — Choose Size</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {['medium', 'large'].map(sz => (
                                                <button key={sz} onClick={() => setBogoSel(p => ({ ...p, size: sz, pizza1: null, pizza2: null }))}
                                                    style={{ padding: '14px', border: `2px solid ${bogoSel.size === sz ? primary : '#EEE'}`, background: bogoSel.size === sz ? bg : '#f9f9f9', borderRadius: '14px', fontWeight: 800 }}>
                                                    {sz === 'medium' ? '🔵 Medium' : '🔴 Large'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {cat && (
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Step 3 — Pick Your 2 Pizzas</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            {[1, 2].map(slot => {
                                                const sel = slot === 1 ? bogoSel.pizza1 : bogoSel.pizza2;
                                                const other = slot === 1 ? bogoSel.pizza2 : bogoSel.pizza1;
                                                return (
                                                    <div key={slot}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '8px', color: sel ? primary : '#555' }}>Pizza {slot} {sel ? `— ✓ ${sel.name}` : '(Select below)'}</div>
                                                        <div style={{ maxHeight: '240px', overflowY: 'auto', border: `2px solid ${sel ? primary : '#EEE'}`, borderRadius: '14px', padding: '6px' }}>
                                                            {pizzaPool.map(p => {
                                                                const isMe = sel?.id === p.id || sel?.name === p.name;
                                                                const isO = other?.id === p.id || other?.name === p.name;
                                                                const pPrice = p.price?.[bogoSel.size] || getDisplayPrice(p.price);
                                                                return (
                                                                    <div key={p.id || p.name} onClick={() => !isO && (slot === 1 ? setBogoSel(v => ({ ...v, pizza1: isMe ? null : p })) : setBogoSel(v => ({ ...v, pizza2: isMe ? null : p })))}
                                                                        style={{ padding: '9px 11px', marginBottom: '5px', borderRadius: '10px', border: `1.5px solid ${isMe ? primary : 'transparent'}`, background: isMe ? bg : isO ? '#f5f5f5' : '#fff', opacity: isO ? 0.4 : 1, cursor: isO ? 'not-allowed' : 'pointer' }}>
                                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.name}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: primary, fontWeight: 700 }}>Rs.{pPrice} ({bogoSel.size})</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px', textAlign: 'center' }}>{bogoSel.pizza1.name} + {bogoSel.pizza2.name} ({bogoSel.size}) • Pay only <strong style={{ color: primary }}>Rs.{oP}</strong></div>
                                        <button onClick={handleBogoAddToCart} style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '14px', background: grad, color: '#fff', fontWeight: 900, fontSize: '1rem' }}>🎉 Add BOGO Deal — Pay Rs.{oP}</button>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontWeight: 700, color: '#aaa', fontSize: '0.88rem', textAlign: 'center' }}>{!cat ? 'Select category & pizzas' : 'Select pizzas to continue'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
