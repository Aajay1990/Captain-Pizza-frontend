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
        size: 'medium', // default
        pizza1: null,
        pizza2: null,
    });
    const bogoOfferItem = useRef(null); // Keep reference to the BOGO item itself

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

    const bogoPizzas1 = React.useMemo(() => {
        const deluxeCat = allCategories.find(c => c.title === 'Deluxe Veg');
        return deluxeCat && deluxeCat.data ? deluxeCat.data.items : [];
    }, [allCategories]);

    const bogoPizzas2 = React.useMemo(() => {
        const supremeCat = allCategories.find(c => c.title === 'Supreme Veg');
        return supremeCat && supremeCat.data ? supremeCat.data.items : [];
    }, [allCategories]);

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
        if (!user) {
            alert("Please login to place an order!");
            navigate('/login');
            return;
        }

        if (!bogoSelection.pizza1 || !bogoSelection.pizza2) {
            alert("Please select both pizzas for the offer!");
            return;
        }

        // We use the highest price of the two pizzas as the base price based on selected size
        const p1Price = bogoSelection.pizza1.price[bogoSelection.size] || 0;
        const p2Price = bogoSelection.pizza2.price[bogoSelection.size] || 0;
        const offerPrice = Math.max(p1Price, p2Price);

        const customBogoItem = {
            id: `bogo-${Date.now()}`,
            name: `BOGO: ${bogoSelection.pizza1.name} + ${bogoSelection.pizza2.name} (${bogoSelection.size})`,
            desc: "Buy 1 Get 1 Special Offer",
            price: offerPrice,
            image: bogoOfferItem.current?.image || 'https://images.unsplash.com/photo-1541745537411-b8046f4d5092?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
            cartId: `bogo-${Date.now()}`,
            selectedSize: bogoSelection.size
        };

        addToCart(customBogoItem);
        setBogoModalOpen(false);
        setBogoSelection({ size: 'medium', pizza1: null, pizza2: null });
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

            {/* BOGO Modal */}
            {bogoModalOpen && (
                <div className="size-popup-overlay bogo-modal-overlay">
                    <div className="size-popup bogo-popup animate-pop-in" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="popup-header">
                            <h3><i className="fas fa-gift" style={{ color: 'var(--primary)' }}></i> Customise Your Buy 1 Get 1</h3>
                            <button className="close-popup" onClick={() => setBogoModalOpen(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <p className="popup-desc">First, choose your size:</p>

                        <div className="size-options bogo-sizing" style={{ flexDirection: 'row', gap: '10px', marginBottom: '20px' }}>
                            <button className={`var-btn ${bogoSelection.size === 'medium' ? 'active-size' : ''}`} style={{ flex: 1, padding: '15px' }} onClick={() => setBogoSelection(prev => ({ ...prev, size: 'medium' }))}>Medium</button>
                            <button className={`var-btn ${bogoSelection.size === 'large' ? 'active-size' : ''}`} style={{ flex: 1, padding: '15px' }} onClick={() => setBogoSelection(prev => ({ ...prev, size: 'large' }))}>Large</button>
                        </div>

                        <div className="bogo-pizza-selectors" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Pizza 1 Selection */}
                            <div className="bogo-column">
                                <h4 style={{ marginBottom: '10px', color: 'var(--text-main)' }}>1. Select Deluxe Veg Pizza</h4>
                                <div className="bogo-list-container" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                                    {bogoPizzas1.length === 0 ? <p>Loading Deluxe Pizzas...</p> : bogoPizzas1.map(p => (
                                        <div
                                            key={p.id}
                                            className={`bogo-list-item ${bogoSelection.pizza1?.id === p.id ? 'selected' : ''}`}
                                            onClick={() => setBogoSelection(prev => ({ ...prev, pizza1: p }))}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: bogoSelection.pizza1?.id === p.id ? 'rgba(229,0,0,0.05)' : 'white' }}
                                        >
                                            <img src={(p.image.startsWith('http') || p.image.startsWith('data:') || p.image.startsWith('/')) ? p.image : `/images/menu/${p.image}`} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</div>
                                                <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>₹{p.price[bogoSelection.size]}</div>
                                            </div>
                                            {bogoSelection.pizza1?.id === p.id && <i className="fas fa-check-circle" style={{ color: 'green' }}></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pizza 2 Selection */}
                            <div className="bogo-column">
                                <h4 style={{ marginBottom: '10px', color: 'var(--text-main)' }}>2. Select Supreme Veg Pizza</h4>
                                <div className="bogo-list-container" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                                    {bogoPizzas2.length === 0 ? <p>Loading Supreme Pizzas...</p> : bogoPizzas2.map(p => (
                                        <div
                                            key={p.id}
                                            className={`bogo-list-item ${bogoSelection.pizza2?.id === p.id ? 'selected' : ''}`}
                                            onClick={() => setBogoSelection(prev => ({ ...prev, pizza2: p }))}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: bogoSelection.pizza2?.id === p.id ? 'rgba(229,0,0,0.05)' : 'white' }}
                                        >
                                            <img src={(p.image.startsWith('http') || p.image.startsWith('data:') || p.image.startsWith('/')) ? p.image : `/images/menu/${p.image}`} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</div>
                                                <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>₹{p.price[bogoSelection.size]}</div>
                                            </div>
                                            {bogoSelection.pizza2?.id === p.id && <i className="fas fa-check-circle" style={{ color: 'green' }}></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <div className="bogo-total-calc">
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>Offer Price:</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                    {bogoSelection.pizza1 && bogoSelection.pizza2 ?
                                        `₹${Math.max(bogoSelection.pizza1.price[bogoSelection.size] || 0, bogoSelection.pizza2.price[bogoSelection.size] || 0)}`
                                        : '₹0'}
                                </div>
                            </div>
                            <button
                                className="btn-primary"
                                style={{ padding: '12px 30px', fontSize: '1.1rem', opacity: (bogoSelection.pizza1 && bogoSelection.pizza2) ? 1 : 0.5 }}
                                onClick={handleBogoAddToCart}
                                disabled={!bogoSelection.pizza1 || !bogoSelection.pizza2}
                            >
                                <ShoppingCart style={{ display: 'inline', marginRight: '5px' }} /> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
