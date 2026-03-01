import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page-container">
            <h1 className="legal-title">Privacy Policy</h1>
            <div className="legal-content">
                <p><strong>Effective Date:</strong> January 1, 2024</p>

                <h3>1. Introduction</h3>
                <p>At Captain Pizza, we are committed to protecting the privacy and security of our customers' personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.</p>

                <h3>2. Information We Collect</h3>
                <ul>
                    <li><strong>Personal Data:</strong> Name, email address, phone number, and delivery address when you place an order or register.</li>
                    <li><strong>Payment Data:</strong> Payment handling is processed securely through encrypted third-party payment gateways (e.g., Razorpay). We do not store sensitive credit card details on our servers.</li>
                </ul>

                <h3>3. How We Use Your Information</h3>
                <p>We primarily use the collected data to process your orders, communicate regarding delivery, and occasionally send promotional materials (which you can opt out of).</p>

                <h3>4. Data Protection</h3>
                <p>We implement necessary security measures to prevent unauthorized access, alteration, or sharing of your personal data.</p>

                <h3>5. Contact Us</h3>
                <p>For any privacy-related queries, email us at support@captainpizza.in.</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
