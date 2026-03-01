import React from 'react';
import './Legal.css';

const AboutUs = () => {
    return (
        <div className="legal-page-container">
            <h1 className="legal-title">About Us</h1>
            <div className="legal-content">
                <p>Welcome to <strong>Captain Pizza</strong>!</p>
                <p>
                    Located in the heart of Dayalpur, Delhi, we are passionate about serving hot, fresh, and irresistibly delicious pizzas to our community. We pride ourselves on using high-quality ingredients, from our 100% pure veg toppings to our perfect, hand-tossed crusts and generous layers of premium cheese.
                </p>
                <p>
                    More than just a pizzeria, we are a destination for food lovers who value taste, hygiene, and outstanding service. As an FSSAI certified establishment, we adhere to the strictest standards of cleanliness and food safety.
                </p>
                <p>
                    Whether you are grabbing a quick bite, ordering in for family movie night, or seeking out the best deals like our famous 'Buy 1 Get 1 Free', Captain Pizza is here to deliver happiness in every box.
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
