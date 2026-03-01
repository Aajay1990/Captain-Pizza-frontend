import React from 'react';
import './Legal.css';

const TermsConditions = () => {
    return (
        <div className="legal-page-container">
            <h1 className="legal-title">Terms & Conditions</h1>
            <div className="legal-content">
                <p>Welcome to <strong>Captain Pizza</strong>.</p>
                <p>By accessing our website and ordering our food, you agree to comply with the following Terms and Conditions.</p>

                <h3>1. Introduction</h3>
                <p>These terms govern your use of the Captain Pizza platform, our menus, online ordering system, and interactions with our restaurant located in Delhi, India.</p>

                <h3>2. Ordering and Acceptance</h3>
                <p>An order placed by you is considered an offer to purchase food. We reserve the right to accept or decline the order based on availability, timings, or technical issues.</p>

                <h3>3. Pricing and Payments</h3>
                <p>All prices listed are in INR and are inclusive of standard taxes where applicable. Payment for online orders must be completed through our integrated payment gateways. Delivery charges may apply based on the delivery location.</p>

                <h3>4. Food Consumption</h3>
                <p>All our products are 100% vegetarian. Food is prepared fresh and is intended to be consumed shortly after delivery to ensure the best taste and quality.</p>

                <h3>5. Intellectual Property</h3>
                <p>All content on this website, including logos, images, and text, is the property of Captain Pizza and cannot be copied or redistributed without permission.</p>

                <p className="mt-4"><strong>Last updated:</strong> June 2024</p>
            </div>
        </div>
    );
};

export default TermsConditions;
