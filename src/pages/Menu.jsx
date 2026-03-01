import React, { useState, useContext, useRef, useEffect } from 'react';
import './Menu.css';
import { menuData } from '../assets/data';
import { CartContext } from '../context/CartContext';
import classNames from 'classnames';

const Menu = () => {
    const [activeSection, setActiveSection] = useState('simple-veg');
    const { addToCart } = useContext(CartContext);

    // Create refs for every section dynamically
    const sectionRefs = useRef({});

    const [dbItems, setDbItems] = useState([]);

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
                cheapMeals: mergeArr(menuData.cheapMeals, 'cheapMeal'),
                burgers: mergeArr(menuData.burgers, 'burger'),
                wraps: mergeArr(menuData.wraps, 'wrap'),
                sandwiches: mergeArr(menuData.sandwiches, 'sandwich'),
                sides: mergeArr(menuData.sides, 'side'),
                beverages: mergeArr(menuData.beverages, 'beverage'),
                pizzas: pizzasMapped
            };

            // Custom non-default Categories 
            const defaultCats = ['cheapMeal', 'burger', 'wrap', 'sandwich', 'side', 'beverage', 'pizza'];
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
            { id: 'cheapMeals', title: 'CHEAP MEALS', type: 'other', data: mergedData.cheapMeals },
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
                                    <div style={{ display: 'flex', gap: '5px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button className="add-btn var-btn" style={{ flex: 1, height: '40px', fontSize: '0.9rem', borderRadius: '6px', padding: '0' }} onClick={() => addToCart({ ...pizza, selectedSize: 'small' })}>
                                            S <div>₹{pizza.price.small}</div>
                                        </button>
                                        <button className="add-btn var-btn" style={{ flex: 1, height: '40px', fontSize: '0.9rem', borderRadius: '6px', padding: '0' }} onClick={() => addToCart({ ...pizza, selectedSize: 'medium' })}>
                                            M <div>₹{pizza.price.medium}</div>
                                        </button>
                                        <button className="add-btn var-btn" style={{ flex: 1, height: '40px', fontSize: '0.9rem', borderRadius: '6px', padding: '0' }} onClick={() => addToCart({ ...pizza, selectedSize: 'large' })}>
                                            L <div>₹{pizza.price.large}</div>
                                        </button>
                                    </div>
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
                                    <button className="add-btn" onClick={() => addToCart(item)}>Add</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="menu-page animate-fade-in">
            {/* Bold Left Navigation Sidebar */}
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
        </div>
    );
};

export default Menu;
