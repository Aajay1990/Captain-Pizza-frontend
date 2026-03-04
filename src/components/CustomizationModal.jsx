import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './CustomizationModal.css';

const VEG_TOPPINGS = [
    { id: 'tomato', name: 'Tomato' },
    { id: 'onion', name: 'Onion' },
    { id: 'corn', name: 'Sweet Corn' },
    { id: 'capsicum', name: 'Capsicum' }
];

const ADDON_PRICES = {
    veg: { small: 25, medium: 35, large: 45 },
    cheese: { small: 40, medium: 60, large: 90 },
    burst: { small: 50, medium: 60, large: 90 },
    ketchup: 1
};

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Determine if item has sizes
    const isPizza = item.category === 'pizza' || (item.price && typeof item.price === 'object');

    const [selectedSize, setSelectedSize] = useState('medium');
    const [selectedVegToppings, setSelectedVegToppings] = useState({});

    const [extraCheese, setExtraCheese] = useState(null);
    const [cheeseBurst, setCheeseBurst] = useState(null);

    // Ketchup Addon
    const [ketchupEnabled, setKetchupEnabled] = useState(false);
    const [ketchupQty, setKetchupQty] = useState(1);

    const [expandedSection, setExpandedSection] = useState('veg');
    const [totalPrice, setTotalPrice] = useState(0);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        let basePrice = isPizza ? (item.price[selectedSize] || 0) : Number(item.price);

        let addonsPrice = 0;
        if (isPizza) {
            Object.values(selectedVegToppings).forEach(size => {
                addonsPrice += ADDON_PRICES.veg[size];
            });
            if (extraCheese) addonsPrice += ADDON_PRICES.cheese[extraCheese];
            if (cheeseBurst) addonsPrice += ADDON_PRICES.burst[cheeseBurst];
            if (ketchupEnabled) addonsPrice += (ketchupQty * ADDON_PRICES.ketchup);
        }

        setTotalPrice(basePrice + addonsPrice);
    }, [selectedSize, selectedVegToppings, extraCheese, cheeseBurst, ketchupEnabled, ketchupQty, item, isPizza]);

    const handleVegToggle = (id) => {
        setSelectedVegToppings(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id]; // unselect
            } else {
                next[id] = selectedSize; // default to pizza size
            }
            return next;
        });
    };

    const handleVegSizeChange = (id, size) => {
        setSelectedVegToppings(prev => ({
            ...prev,
            [id]: size
        }));
    };

    const handleAdd = () => {
        if (!user) {
            alert("Please login to customize and add to cart!");
            onClose();
            navigate('/login');
            return;
        }

        const formattedToppings = [];

        Object.entries(selectedVegToppings).forEach(([id, size]) => {
            const toppingName = VEG_TOPPINGS.find(t => t.id === id)?.name;
            if (toppingName) {
                formattedToppings.push({
                    name: `${toppingName} (${size.charAt(0).toUpperCase()})`,
                    price: ADDON_PRICES.veg[size],
                    baseName: toppingName,
                    size: size
                });
            }
        });

        if (extraCheese) {
            formattedToppings.push({
                name: `Extra Cheese (${extraCheese.charAt(0).toUpperCase()})`,
                price: ADDON_PRICES.cheese[extraCheese],
                baseName: 'Extra Cheese',
                size: extraCheese
            });
        }

        if (cheeseBurst) {
            formattedToppings.push({
                name: `Cheese Burst Crust (${cheeseBurst.charAt(0).toUpperCase()})`,
                price: ADDON_PRICES.burst[cheeseBurst],
                baseName: 'Cheese Burst Crust',
                size: cheeseBurst
            });
        }

        if (ketchupEnabled) {
            formattedToppings.push({
                name: `Ketchup Packets (x${ketchupQty})`,
                price: ketchupQty * ADDON_PRICES.ketchup,
                baseName: 'Ketchup',
                size: 'regular'
            });
        }

        onAddToCart({
            ...item,
            id: item._id || item.id,
            selectedSize: selectedSize,
            toppings: formattedToppings,
            price: totalPrice,
            totalPrice: totalPrice,
            cartItemId: Date.now()
        });
        onClose();
    };

    return (
        <div className="customization-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="customization-modal animate-fade-scale" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <img src={item.image} alt={item.name} className="modal-image" />
                    <div className="modal-title-area">
                        <h3>Customize {item.name}</h3>
                        <p>{item.desc}</p>
                    </div>
                </div>

                <div className="modal-body-scroll">
                    {isPizza && (
                        <div className="custom-section">
                            <h4>1. Select Size</h4>
                            <div className="size-selector">
                                {['small', 'medium', 'large'].map(size => (
                                    <label key={size} className={`size-radio ${selectedSize === size ? 'selected' : ''}`}>
                                        <input type="radio" name="size" checked={selectedSize === size} onChange={() => setSelectedSize(size)} />
                                        <div className="size-label-box">
                                            <span>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                                            <div className="size-price">₹{item.price[size]}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {isPizza && (
                        <div className="custom-section addon-system">
                            <h4>2. Pizza Add-Ons</h4>

                            {/* Ketchup Add-On */}
                            <div className="addon-card dropdown-card">
                                <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'ketchup' ? null : 'ketchup')}>
                                    <div>
                                        <strong>Ketchup Packets</strong>
                                        <div className="selected-preview">
                                            {ketchupEnabled ? `Selected (x${ketchupQty}) +₹${ketchupQty * ADDON_PRICES.ketchup}` : 'Not Selected'}
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-${expandedSection === 'ketchup' ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSection === 'ketchup' && (
                                    <div className="dropdown-list">
                                        <div className="dropdown-item-complex">
                                            <label className="dropdown-item-header">
                                                <input type="checkbox" checked={ketchupEnabled} onChange={(e) => setKetchupEnabled(e.target.checked)} />
                                                <span className="topping-name">Include Ketchup</span>
                                            </label>
                                            {ketchupEnabled && (
                                                <div className="topping-size-selector" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                    <div className="addon-qty-controls" style={{ margin: 0, padding: 0, border: 'none' }}>
                                                        <button onClick={() => setKetchupQty(Math.max(1, ketchupQty - 1))}>-</button>
                                                        <span style={{ color: 'black' }}>{ketchupQty}</span>
                                                        <button onClick={() => setKetchupQty(ketchupQty + 1)}>+</button>
                                                        <span style={{ marginLeft: '10px', fontWeight: 'bold', color: 'var(--primary)' }}>+₹{ketchupQty * ADDON_PRICES.ketchup}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Veg Toppings Accordion */}
                            <div className="addon-card dropdown-card">
                                <div
                                    className="dropdown-header"
                                    onClick={() => setExpandedSection(expandedSection === 'veg' ? null : 'veg')}
                                >
                                    <div>
                                        <strong>Veg Toppings</strong>
                                        <div className="selected-preview">
                                            {Object.keys(selectedVegToppings).length > 0
                                                ? `${Object.keys(selectedVegToppings).length} selected (+₹${Object.values(selectedVegToppings).reduce((acc, sz) => acc + ADDON_PRICES.veg[sz], 0)})`
                                                : 'Not Selected'
                                            }
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-${expandedSection === 'veg' ? 'up' : 'down'}`}></i>
                                </div>

                                {expandedSection === 'veg' && (
                                    <div className="dropdown-list">
                                        {VEG_TOPPINGS.map(topping => (
                                            <div key={topping.id} className="dropdown-item-complex">
                                                <label className="dropdown-item-header">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selectedVegToppings[topping.id]}
                                                        onChange={() => handleVegToggle(topping.id)}
                                                    />
                                                    <span className="topping-name">{topping.name}</span>
                                                </label>
                                                {selectedVegToppings[topping.id] && (
                                                    <div className="topping-size-selector">
                                                        {['small', 'medium', 'large'].map(sz => (
                                                            <label key={sz} className="nested-size-radio">
                                                                <input
                                                                    type="radio"
                                                                    name={`size-${topping.id}`}
                                                                    checked={selectedVegToppings[topping.id] === sz}
                                                                    onChange={() => handleVegSizeChange(topping.id, sz)}
                                                                />
                                                                <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.veg[sz]})</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Extra Cheese */}
                            <div className="addon-card dropdown-card">
                                <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'cheese' ? null : 'cheese')}>
                                    <div>
                                        <strong>Extra Cheese Topping</strong>
                                        <div className="selected-preview">
                                            {extraCheese ? `Selected (${extraCheese.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.cheese[extraCheese]}` : 'Not Selected'}
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-${expandedSection === 'cheese' ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSection === 'cheese' && (
                                    <div className="dropdown-list">
                                        <div className="dropdown-item-complex">
                                            <label className="dropdown-item-header">
                                                <input
                                                    type="checkbox"
                                                    checked={!!extraCheese}
                                                    onChange={(e) => setExtraCheese(e.target.checked ? selectedSize : null)}
                                                />
                                                <span className="topping-name">Add Extra Cheese</span>
                                            </label>
                                            {extraCheese && (
                                                <div className="topping-size-selector">
                                                    {['small', 'medium', 'large'].map(sz => (
                                                        <label key={sz} className="nested-size-radio">
                                                            <input
                                                                type="radio"
                                                                name="cheese-size"
                                                                checked={extraCheese === sz}
                                                                onChange={() => setExtraCheese(sz)}
                                                            />
                                                            <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.cheese[sz]})</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cheese Burst Crust */}
                            <div className="addon-card dropdown-card">
                                <div className="dropdown-header" onClick={() => setExpandedSection(expandedSection === 'burst' ? null : 'burst')}>
                                    <div>
                                        <strong>Cheese Burst Crust</strong>
                                        <div className="selected-preview">
                                            {cheeseBurst ? `Selected (${cheeseBurst.charAt(0).toUpperCase()}) +₹${ADDON_PRICES.burst[cheeseBurst]}` : 'Not Selected'}
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-${expandedSection === 'burst' ? 'up' : 'down'}`}></i>
                                </div>
                                {expandedSection === 'burst' && (
                                    <div className="dropdown-list">
                                        <div className="dropdown-item-complex">
                                            <label className="dropdown-item-header">
                                                <input
                                                    type="checkbox"
                                                    checked={!!cheeseBurst}
                                                    onChange={(e) => setCheeseBurst(e.target.checked ? selectedSize : null)}
                                                />
                                                <span className="topping-name">Add Cheese Burst Crust</span>
                                            </label>
                                            {cheeseBurst && (
                                                <div className="topping-size-selector">
                                                    {['small', 'medium', 'large'].map(sz => (
                                                        <label key={sz} className="nested-size-radio">
                                                            <input
                                                                type="radio"
                                                                name="burst-size"
                                                                checked={cheeseBurst === sz}
                                                                onChange={() => setCheeseBurst(sz)}
                                                            />
                                                            <span>{sz.charAt(0).toUpperCase()} (+₹{ADDON_PRICES.burst[sz]})</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <div className="total-display">
                        <span className="total-label">Subtotal</span>
                        <span className="total-amount">₹{totalPrice}</span>
                    </div>
                    <button className="btn btn-primary add-custom-btn" onClick={handleAdd}>
                        Add to Cart <span className="cart-icon">🛒</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomizationModal;

