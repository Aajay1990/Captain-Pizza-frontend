import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Load from localStorage on mount
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('captain_pizza_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isIconAnimating, setIsIconAnimating] = useState(false);

    // Persist to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('captain_pizza_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item) => {
        // Base price calculation depending if item has sizes or direct price
        let itemPrice = item.price;
        let itemName = item.name;

        // If it's a pizza with sizes, and size is passed along with `item` optionally
        if (typeof item.price === 'object') {
            const size = item.selectedSize || 'medium';
            itemPrice = item.price[size];
            itemName = `${item.name} (${size.charAt(0).toUpperCase() + size.slice(1)})`;
        } else if (item.selectedSize) {
            itemName = `${item.name} (${item.selectedSize.charAt(0).toUpperCase() + item.selectedSize.slice(1)})`;
        }

        const cartItemId = item.cartId || (item.id + (item.selectedSize ? `-${item.selectedSize}` : ''));

        setCartItems(prev => {
            const existing = prev.find(i => i.cartItemId === cartItemId);
            if (existing) {
                return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, cartItemId, name: itemName, price: itemPrice, quantity: 1 }];
        });

        // Trigger Icon Animation
        setIsIconAnimating(true);
        setTimeout(() => setIsIconAnimating(false), 300);
    };

    const updateQuantity = (id, change) => {
        setCartItems(items =>
            items.map(item =>
                item.cartItemId === id
                    ? { ...item, quantity: Math.max(0, item.quantity + change) }
                    : item
            ).filter(item => item.quantity > 0)
        );
    };

    const toggleAddon = (cartItemId, toppingObj) => {
        setCartItems(items => items.map(item => {
            if (item.cartItemId === cartItemId) {
                const currentToppings = item.toppings || [];
                const hasTopping = currentToppings.some(t => t.name === toppingObj.name);

                let newToppings;
                let priceDiff = toppingObj.price;

                if (hasTopping) {
                    newToppings = currentToppings.filter(t => t.name !== toppingObj.name);
                    priceDiff = -toppingObj.price;
                } else {
                    newToppings = [...currentToppings, toppingObj];
                }

                // Make sure to maintain a basePrice correctly or calculate total based on basePrice.
                // It's safer to store basePrice if not already there:
                const basePrice = item.basePrice || item.price;

                return {
                    ...item,
                    basePrice: basePrice,
                    toppings: newToppings,
                    price: basePrice + newToppings.reduce((sum, t) => sum + t.price, 0)
                };
            }
            return item;
        }));
    };

    const toggleAddonSML = (cartItemId, addonBaseName, sizeName, price) => {
        setCartItems(items => items.map(item => {
            if (item.cartItemId === cartItemId) {
                const currentToppings = item.toppings || [];
                const fullName = `${addonBaseName} (${sizeName.charAt(0).toUpperCase()})`;
                const existingIndex = currentToppings.findIndex(t => t.baseName === addonBaseName);

                let newToppings = [...currentToppings];

                if (existingIndex >= 0) {
                    if (newToppings[existingIndex].size === sizeName) {
                        // User clicked the same size, so remove it entirely (toggle off)
                        newToppings.splice(existingIndex, 1);
                    } else {
                        // User clicked a different size, so update it
                        newToppings[existingIndex] = { baseName: addonBaseName, name: fullName, size: sizeName, price };
                    }
                } else {
                    // Not added yet, add new
                    newToppings.push({ baseName: addonBaseName, name: fullName, size: sizeName, price });
                }

                const basePrice = item.basePrice || item.price;
                return {
                    ...item,
                    basePrice: basePrice,
                    toppings: newToppings,
                    price: basePrice + newToppings.reduce((sum, t) => sum + t.price, 0)
                };
            }
            return item;
        }));
    };

    const bogoDiscount = React.useMemo(() => {
        let discount = 0;

        const calculateGroupBOGO = (items) => {
            // Flat list of items (accounting for quantity)
            const flatItems = [];
            items.forEach(item => {
                for (let i = 0; i < item.quantity; i++) {
                    flatItems.push(item);
                }
            });

            // Sort by price descending
            flatItems.sort((a, b) => b.price - a.price);

            // Every 2nd item is free (index 1, 3, 5...)
            for (let i = 1; i < flatItems.length; i += 2) {
                discount += flatItems[i].price;
            }
        };

        const deluxeVegPizzas = cartItems.filter(item =>
            item.category === 'pizza' &&
            item.subCategory === 'Deluxe Veg' &&
            (item.selectedSize === 'medium' || item.selectedSize === 'large')
        );
        calculateGroupBOGO(deluxeVegPizzas);

        const supremeVegPizzas = cartItems.filter(item =>
            item.category === 'pizza' &&
            item.subCategory === 'Supreme Veg' &&
            (item.selectedSize === 'medium' || item.selectedSize === 'large')
        );
        calculateGroupBOGO(supremeVegPizzas);

        return discount;
    }, [cartItems]);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, toggleAddon, toggleAddonSML, cartCount, clearCart, isCartOpen, setIsCartOpen, isIconAnimating, bogoDiscount }}>
            {children}
        </CartContext.Provider>
    );
};
