import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './CustomizationModal.css';

const TOPPING_CATEGORIES = {
    veg: {
        id: 'veg',
        name: 'Veg Toppings',
        items: [
            { id: 'tomato', name: 'Tomato', prices: { small: 25, medium: 35, large: 45 } },
            { id: 'corn', name: 'Sweet Corn', prices: { small: 25, medium: 35, large: 45 } },
            { id: 'onion', name: 'Onion', prices: { small: 25, medium: 35, large: 45 } },
            { id: 'capsicum', name: 'Capsicum', prices: { small: 25, medium: 35, large: 45 } }
        ]
    },
    cheese: {
        id: 'cheese_addon',
        name: 'Extra Cheese',
        items: [
            { id: 'cheese', name: 'Extra Cheese Topping', prices: { small: 40, medium: 60, large: 90 } }
        ]
    },
    burst: {
        id: 'cheese_burst',
        name: 'Cheese Burst',
        items: [
            { id: 'burst', name: 'Cheese Burst', prices: { small: 50, medium: 60, large: 90 } }
        ]
    }
};

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Determine if item has sizes
    const isPizza = item.category === 'pizza' || (item.price && typeof item.price === 'object');

    const [selectedSize, setSelectedSize] = useState('medium');
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [activeToppingCat, setActiveToppingCat] = useState('veg');
    const [totalPrice, setTotalPrice] = useState(0);

    // Flatten toppings for easy search
    const ALL_TOPPINGS = [...TOPPING_CATEGORIES.veg.items, ...TOPPING_CATEGORIES.cheese.items, ...TOPPING_CATEGORIES.burst.items];

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        let basePrice = isPizza ? (item.price[selectedSize] || 0) : Number(item.price);
        let toppingsPrice = 0;

        selectedToppings.forEach(tId => {
            const topping = ALL_TOPPINGS.find(t => t.id === tId);
            if (topping) {
                toppingsPrice += topping.prices[selectedSize] || topping.prices.medium || 0;
            }
        });

        setTotalPrice(basePrice + toppingsPrice);
    }, [selectedSize, selectedToppings, item, isPizza]);

    const handleToppingToggle = (tId) => {
        if (selectedToppings.includes(tId)) {
            setSelectedToppings(selectedToppings.filter(id => id !== tId));
        } else {
            setSelectedToppings([...selectedToppings, tId]);
        }
    };

    const handleAdd = () => {
        if (!user) {
            alert("Please login to customize and add to cart!");
            onClose();
            navigate('/login');
            return;
        }

        const selectedToppingObjects = selectedToppings.map(id => {
            const t = ALL_TOPPINGS.find(topp => topp.id === id);
            return t ? { name: t.name, price: t.prices[selectedSize], baseName: t.name, size: selectedSize } : null;
        }).filter(Boolean);

        onAddToCart({
            ...item,
            id: item._id || item.id,
            selectedSize: selectedSize,
            toppings: selectedToppingObjects,
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
                            <h4>Select Size</h4>
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
                        <div className="custom-section">
                            <h4>2. Choose Toppings Category</h4>
                            <div className="topping-cat-switcher" style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                                {Object.keys(TOPPING_CATEGORIES).map(catKey => (
                                    <button
                                        key={catKey}
                                        className={`cat-tab-btn ${activeToppingCat === catKey ? 'active' : ''}`}
                                        onClick={() => setActiveToppingCat(catKey)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 5px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            background: activeToppingCat === catKey ? 'var(--primary)' : 'white',
                                            color: activeToppingCat === catKey ? 'white' : '#444',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {TOPPING_CATEGORIES[catKey].name.split(' ')[0].toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="toppings-list">
                                {TOPPING_CATEGORIES[activeToppingCat].items.map(topping => {
                                    const tPrice = topping.prices[selectedSize];
                                    return (
                                        <label key={topping.id} className={`topping-checkbox-card ${selectedToppings.includes(topping.id) ? 'checked' : ''}`}>
                                            <div className="topping-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedToppings.includes(topping.id)}
                                                    onChange={() => handleToppingToggle(topping.id)}
                                                />
                                                <span className="custom-checkbox"></span>
                                                <span className="topping-name">{topping.name}</span>
                                            </div>
                                            <div className="topping-price">+₹{tPrice}</div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <div className="total-display">
                        <span className="total-label">Total Amount</span>
                        <span className="total-amount">₹{totalPrice}</span>
                    </div>
                    <button className="btn btn-primary add-custom-btn" onClick={handleAdd}>
                        Add to Cart <span className="cart-icon">🛒</span>
                    </button>
                    <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: '10px' }}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomizationModal;
