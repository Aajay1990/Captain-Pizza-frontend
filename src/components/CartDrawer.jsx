import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
    const { cartItems, updateQuantity, isCartOpen, setIsCartOpen, cartCount } = useContext(CartContext);
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const calculateTotal = () => {
        return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/order');
    };

    return (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-drawer-header">
                    <h2>Your Basket ({cartCount})</h2>
                    <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="cart-drawer-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart-drawer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            <p>Your basket is empty!</p>
                            <button className="btn-primary" onClick={() => { setIsCartOpen(false); navigate('/menu'); }} style={{ padding: '10px 20px', marginTop: '10px' }}>
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        <div className="drawer-items">
                            {cartItems.map(item => (
                                <div key={item.cartItemId} className="drawer-item">
                                    <div className="drawer-item-info">
                                        <h4>{item.name}</h4>
                                        {item.toppings && item.toppings.length > 0 && (
                                            <div className="cart-item-toppings" style={{ fontSize: '0.8rem', color: '#888', marginTop: '-3px', marginBottom: '3px' }}>
                                                + {item.toppings.map(t => t.name).join(', ')}
                                            </div>
                                        )}
                                        <p className="drawer-item-price">₹{item.price}</p>
                                    </div>
                                    <div className="quantity-controls drawer-qty">
                                        <button onClick={() => updateQuantity(item.cartItemId, -1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                                    </div>
                                    <div className="drawer-item-total">
                                        ₹{item.price * item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="drawer-subtotal">
                            <span>Subtotal:</span>
                            <span>₹{calculateTotal()}</span>
                        </div>
                        {bogoDiscount > 0 && (
                            <div className="drawer-subtotal bogo-promo" style={{ color: '#b71c1c', fontWeight: 'bold' }}>
                                <span>BOGO Discount:</span>
                                <span>-₹{bogoDiscount}</span>
                            </div>
                        )}
                        <div className="drawer-subtotal grand-total" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                            <span>Total:</span>
                            <span>₹{calculateTotal() - bogoDiscount}</span>
                        </div>
                        <button className="btn-primary checkout-btn-drawer" onClick={handleCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
