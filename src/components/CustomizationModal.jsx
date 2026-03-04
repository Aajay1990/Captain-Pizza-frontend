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
    const [selectedVegToppings, setSelectedVegToppings] = useState([]);
    const [showVegDropdown, setShowVegDropdown] = useState(false);

    const [extraCheese, setExtraCheese] = useState(false);
    const [cheeseBurst, setCheeseBurst] = useState(false);

    // Ketchup Addon
    const [ketchupEnabled, setKetchupEnabled] = useState(false);
    const [ketchupQty, setKetchupQty] = useState(1);

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
            addonsPrice += selectedVegToppings.length * ADDON_PRICES.veg[selectedSize];
            if (extraCheese) addonsPrice += ADDON_PRICES.cheese[selectedSize];
            if (cheeseBurst) addonsPrice += ADDON_PRICES.burst[selectedSize];
            if (ketchupEnabled) addonsPrice += (ketchupQty * ADDON_PRICES.ketchup);
        }

        setTotalPrice(basePrice + addonsPrice);
    }, [selectedSize, selectedVegToppings, extraCheese, cheeseBurst, ketchupEnabled, ketchupQty, item, isPizza]);

    const handleVegToggle = (id) => {
        if (selectedVegToppings.includes(id)) {
            setSelectedVegToppings(selectedVegToppings.filter(t => t !== id));
        } else {
            setSelectedVegToppings([...selectedVegToppings, id]);
        }
    };

    const handleAdd = () => {
        if (!user) {
            alert("Please login to customize and add to cart!");
            onClose();
            navigate('/login');
            return;
        }

        const formattedToppings = [];

        selectedVegToppings.forEach(id => {
            const toppingName = VEG_TOPPINGS.find(t => t.id === id)?.name;
            if (toppingName) {
                formattedToppings.push({
                    name: toppingName,
                    price: ADDON_PRICES.veg[selectedSize],
                    baseName: toppingName,
                    size: selectedSize
                });
            }
        });

        if (extraCheese) {
            formattedToppings.push({
                name: 'Extra Cheese',
                price: ADDON_PRICES.cheese[selectedSize],
                baseName: 'Extra Cheese',
                size: selectedSize
            });
        }

        if (cheeseBurst) {
            formattedToppings.push({
                name: 'Cheese Burst Crust',
                price: ADDON_PRICES.burst[selectedSize],
                baseName: 'Cheese Burst Crust',
                size: selectedSize
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
                            <div className="addon-card">
                                <label className="addon-checkbox-label">
                                    <div className="addon-info">
                                        <input type="checkbox" checked={ketchupEnabled} onChange={(e) => setKetchupEnabled(e.target.checked)} />
                                        <span className="custom-checkbox"></span>
                                        <strong>Ketchup Packets</strong>
                                    </div>
                                    <span className="addon-price-tag">+₹{ADDON_PRICES.ketchup}/ea</span>
                                </label>
                                {ketchupEnabled && (
                                    <div className="addon-qty-controls">
                                        <button onClick={() => setKetchupQty(Math.max(1, ketchupQty - 1))}>-</button>
                                        <span>{ketchupQty}</span>
                                        <button onClick={() => setKetchupQty(ketchupQty + 1)}>+</button>
                                    </div>
                                )}
                            </div>

                            {/* Veg Toppings Dropdown */}
                            <div className="addon-card dropdown-card">
                                <div
                                    className="dropdown-header"
                                    onClick={() => setShowVegDropdown(!showVegDropdown)}
                                >
                                    <div>
                                        <strong>Veg Toppings</strong>
                                        <div className="selected-preview">
                                            {selectedVegToppings.length > 0
                                                ? `${selectedVegToppings.length} selected (+₹${selectedVegToppings.length * ADDON_PRICES.veg[selectedSize]})`
                                                : 'Select Topping Type'
                                            }
                                        </div>
                                    </div>
                                    <i className={`fas fa-chevron-${showVegDropdown ? 'up' : 'down'}`}></i>
                                </div>

                                {showVegDropdown && (
                                    <div className="dropdown-list">
                                        {VEG_TOPPINGS.map(topping => (
                                            <label key={topping.id} className="dropdown-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVegToppings.includes(topping.id)}
                                                    onChange={() => handleVegToggle(topping.id)}
                                                />
                                                <span className="topping-name">{topping.name}</span>
                                                <span className="topping-price">+₹{ADDON_PRICES.veg[selectedSize]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Extra Cheese toggle */}
                            <div className="addon-card">
                                <label className="addon-checkbox-label toggle-style">
                                    <div className="addon-info">
                                        <strong>Extra Cheese Topping</strong>
                                    </div>
                                    <div className="addon-toggle-right">
                                        <span className="addon-price-tag">+₹{ADDON_PRICES.cheese[selectedSize]}</span>
                                        <div className="toggle-switch">
                                            <input type="checkbox" checked={extraCheese} onChange={e => setExtraCheese(e.target.checked)} />
                                            <span className="slider round"></span>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Cheese Burst Crust toggle */}
                            <div className="addon-card">
                                <label className="addon-checkbox-label toggle-style">
                                    <div className="addon-info">
                                        <strong>Cheese Burst Crust</strong>
                                    </div>
                                    <div className="addon-toggle-right">
                                        <span className="addon-price-tag">+₹{ADDON_PRICES.burst[selectedSize]}</span>
                                        <div className="toggle-radio">
                                            <input type="radio" checked={cheeseBurst} onChange={() => setCheeseBurst(!cheeseBurst)} onClick={() => setCheeseBurst(!cheeseBurst)} />
                                            <span className="radio-circle"></span>
                                        </div>
                                    </div>
                                </label>
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

