import API_URL from '../apiConfig';
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

    const sectionRefs = useRef({});
    const [dbItems, setDbItems] = useState([]);

    const [bogoOpen, setBogoOpen] = useState(null);
    const [bogoSel, setBogoSel] = useState({ size: 'medium', pizza1: null, pizza2: null });

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

    const allCategories = React.useMemo(() => {
        let mergedData = { ...menuData };
        let customCategories = [];

        if (dbItems.length > 0) {
            const mergeArr = (arr, catType, subCatType = null) => {
                const updatedStatic = arr.map(staticItem => {
                    const live = dbItems.find(dbItem => dbItem.name === staticItem.name && (dbItem.category === catType || catType === 'pizza'));
                    if (live) {
                        return {
                            ...staticItem,
                            name: live.name,
                            desc: live.desc,
                            price: live.prices || live.price,
                            isAvailable: live.isAvailable,
                            image: live.image || staticItem.image
                        };
                    }
                    return staticItem;
                });

                const newLiveItems = dbItems.filter(dbItem => {
                    if (dbItem.category !== catType) return false;
                    if (subCatType && dbItem.subCategory !== subCatType) return false;
                    const staticExists = arr.find(sItem => sItem.name === dbItem.name);
                    return !staticExists;
                }).map(dbItem => {
                    return {
                        id: dbItem._id,
                        name: dbItem.name,
                        desc: dbItem.desc,
                        price: dbItem.prices || dbItem.price,
                        image: dbItem.image || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=500',
                        isAvailable: dbItem.isAvailable
                    };
                });

                return [...updatedStatic, ...newLiveItems].filter(item => item.isAvailable !== false);
            };

            const pizzasMapped = menuData.pizzas.map(cat => {
                let tItems = mergeArr(cat.items, 'pizza', cat.category);
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
                    name: item.name,
                    desc: item.desc,
                    price: item.prices || item.price,
                    image: item.image || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=500',
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
    }, [dbItems]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
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
                top: element.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    const handleAddToCartWithCheck = (item) => {
        addToCart(item);
        setIsCartOpen(true);
    };

    const getImgSrc = (img) => {
        if (!img) return 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300';
        if (typeof img !== 'string') return img; // Bundled asset
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        if (img.startsWith('/uploads')) return `${API_URL}${img}`;
        return img; // Return as is for local or legacy paths
    };

    const renderPizzaSection = (category) => (
        <div key={category.id} id={category.id} className="menu-section" ref={el => sectionRefs.current[category.id] = el}>
            <h3 className="category-title">{category.category}</h3>
            <div className="product-grid">
                {category.items.map(pizza => {
                    const isBestseller = ['Farm House', 'Extravaganza Veg', 'Margherita'].includes(pizza.name);
                    return (
                        <div key={pizza.id} className="menu-item-card card">
                            <div className="item-image-container">
                                {isBestseller && <span className="bestseller-badge">Bestseller</span>}
                                <img
                                    src={getImgSrc(pizza.image)}
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300' }}
                                    alt={pizza.name}
                                    className="item-image" loading="lazy"
                                />
                            </div>
                            <div className="item-content">
                                <h4>{pizza.name}</h4>
                                <p className="item-desc">{pizza.desc}</p>
                                <div className="simple-price-action">
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
        <div key={id} id={id} className="menu-section" ref={el => sectionRefs.current[id] = el}>
            <h3 className="category-title">{title}</h3>
            <div className="product-grid">
                {items.map(item => {
                    const isBestseller = ['Monster Club Burger', 'Family Combo', 'Couple Combo'].includes(item.name);
                    return (
                        <div key={item.id} className="menu-item-card card">
                            <div className="item-image-container">
                                {isBestseller && <span className="bestseller-badge">Bestseller</span>}
                                <img
                                    src={getImgSrc(item.image)}
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?w=300' }}
                                    alt={item.name}
                                    className="item-image" loading="lazy"
                                />
                            </div>
                            <div className="item-content">
                                <h4>{item.name}</h4>
                                {item.desc && <p className="item-desc">{item.desc}</p>}
                                <div className="simple-price-action">
                                    <span className="price">₹{item.price}</span>
                                    {item.name?.includes('Buy 1 Get 1 FREE') ? (
                                        <button className="add-btn" onClick={() => openBogo(item.name.includes('Deluxe') ? 'Deluxe Veg' : 'Supreme Veg')}>⭐ Select</button>
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
        if (!bogoSel.pizza1 || !bogoSel.pizza2) return;
        const p1Price = bogoSel.pizza1.price?.[bogoSel.size] || 0;
        const p2Price = bogoSel.pizza2.price?.[bogoSel.size] || 0;
        const offerPrice = Math.max(p1Price, p2Price);

        addToCart({
            id: `bogo-${Date.now()}`,
            name: `🎁 BOGO (${bogoOpen}): ${bogoSel.pizza1.name} + ${bogoSel.pizza2.name}`,
            desc: `Buy 1 Get 1 — ${bogoSel.size} size`,
            price: offerPrice,
            image: getImgSrc(bogoSel.pizza1.image),
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSel.size,
        });
        setIsCartOpen(true);
        closeBogo();
    };

    const bogoPizzasByCategory = React.useMemo(() => {
        const found = (t) => {
            const c = allCategories.find(cat => cat.title === t);
            return (c && c.data && c.data.items) ? c.data.items : [];
        };
        return { 'Deluxe Veg': found('Deluxe Veg'), 'Supreme Veg': found('Supreme Veg') };
    }, [allCategories]);

    const bogoPizzaPool = bogoOpen ? (bogoPizzasByCategory[bogoOpen] || []) : [];

    return (
        <div className="menu-page animate-fade-in">
            <aside className="menu-sidebar">
                <div className="sidebar-title">Categories</div>
                {allCategories.map(cat => (
                    cat.type === 'header' ? 
                        <div key={cat.id} className="sidebar-group-title">{cat.title}</div> :
                        <button key={cat.id} id={`nav-btn-${cat.id}`} className={classNames('sidebar-btn', { active: activeSection === cat.id, 'sub-category': cat.type === 'pizza' })} onClick={() => scrollToSection(cat.id)}>
                            {cat.title}
                        </button>
                ))}
            </aside>

            <div className="menu-content-area">
                <div className="menu-content-header">
                    <h1>Explore the Menu</h1>
                    <p>Scroll down or select a category from the left</p>
                </div>
                <div className="menu-items-container">
                    {allCategories.map(cat => {
                        if (cat.type === 'header') return null;
                        return cat.type === 'pizza' ? renderPizzaSection(cat.data) : renderOtherSection(cat.id, cat.title, cat.data);
                    })}
                </div>
            </div>

            {bogoOpen && (
                <div className="modal-overlay" onClick={closeBogo}>
                    <div className="modal-content bogo-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ background: bogoOpen === 'Deluxe Veg' ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : 'linear-gradient(135deg, #B71C1C, #D32F2F)' }}>
                            <h3>🎁 BOGO — {bogoOpen}</h3>
                            <button onClick={closeBogo} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="size-selector">
                                {['medium', 'large'].map(sz => (
                                    <button key={sz} className={bogoSel.size === sz ? 'active' : ''} onClick={() => setBogoSel(p => ({ ...p, size: sz, pizza1: null, pizza2: null }))}>
                                        {sz.charAt(0).toUpperCase() + sz.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="pizza-selection-grid">
                                {['pizza1', 'pizza2'].map(slot => (
                                    <div key={slot} className="pizza-slot">
                                        <p>{slot === 'pizza1' ? 'First Pizza' : 'Second Pizza'}</p>
                                        <select value={bogoSel[slot]?.name || ''} onChange={(e) => {
                                            const p = bogoPizzaPool.find(x => x.name === e.target.value);
                                            setBogoSel(prev => ({ ...prev, [slot]: p }));
                                        }}>
                                            <option value="">Select a pizza...</option>
                                            {bogoPizzaPool.map(p => (
                                                <option key={p.id} value={p.name} disabled={bogoSel[slot === 'pizza1' ? 'pizza2' : 'pizza1']?.id === p.id}>
                                                    {p.name} (₹{p.price?.[bogoSel.size]})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {bogoSel.pizza1 && bogoSel.pizza2 ? (
                                <button className="btn-primary" onClick={handleBogoAddToCart}>
                                    Add BOGO — Pay ₹{Math.max(bogoSel.pizza1.price?.[bogoSel.size], bogoSel.pizza2.price?.[bogoSel.size])}
                                </button>
                            ) : (
                                <p>Select both pizzas to continue</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
