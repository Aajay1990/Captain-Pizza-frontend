import React, { useState, useEffect } from 'react';
import './CustomizationModal.css';

const MOCK_TOPPINGS = [
    { id: 't1', name: 'Extra Veg Options', prices: { small: 25, medium: 35, large: 45 } },
    { id: 't2', name: 'Extra Cheese', prices: { small: 40, medium: 60, large: 90 } },
    { id: 't3', name: 'Cheese Burst', prices: { small: 50, medium: 60, large: 90 } },
    { id: 't4', name: 'Paneer Topping', prices: { small: 30, medium: 40, large: 60 } }
];

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
    // Determine if item has sizes
    const isPizza = item.price && typeof item.price === 'object';

    const [selectedSize, setSelectedSize] = useState(isPizza ? 'small' : null);
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        let basePrice = isPizza ? (item.price[selectedSize] || item.price.small || 0) : Number(item.price);
        let toppingsPrice = 0;

        selectedToppings.forEach(tId => {
            const topping = MOCK_TOPPINGS.find(t => t.id === tId);
            if (topping) {
                if (isPizza) {
                    toppingsPrice += topping.prices[selectedSize];
                } else {
                    toppingsPrice += topping.prices.medium; // default to medium price for non-pizza
                }
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
        const selectedToppingObjects = selectedToppings.map(id => {
            const t = MOCK_TOPPINGS.find(topp => topp.id === id);
            const price = isPizza ? t.prices[selectedSize] : t.prices.medium;
            return { name: t.name, price };
        });

        onAddToCart({
            ...item,
            selectedSize: selectedSize || undefined,
            toppings: selectedToppingObjects,
            price: totalPrice,
            cartId: `${item.id}-${selectedSize || 'reg'}-${selectedToppings.sort().join('-')}` // Unique CART item ID!
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

                    <div className="custom-section">
                        <h4>Add Extra Toppings</h4>
                        <div className="toppings-list">
                            {MOCK_TOPPINGS.map(topping => {
                                const tPrice = isPizza ? topping.prices[selectedSize] : topping.prices.medium;
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
                </div>

                <div className="modal-footer">
                    <div className="total-display">
                        <span className="total-label">Total Amount</span>
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
