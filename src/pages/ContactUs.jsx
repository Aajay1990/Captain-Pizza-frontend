import React from 'react';
import './Legal.css';

const ContactUs = () => {
    return (
        <div className="legal-page-container">
            <h1 className="legal-title">Contact Us</h1>
            <div className="legal-content">
                <p>We would love to hear from you! If you have any questions, feedback, or need assistance with your order, please do not hesitate to contact us using the details below.</p>

                <div className="contact-info-card">
                    <h3>Operational Address</h3>
                    <p>F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket, Near Hero Bike Showroom</p>
                    <p>New Delhi, Delhi - 110094 (India)</p>

                    <h3>Phone Number</h3>
                    <p>+91 9220367325</p>
                    <p>+91 9220367425</p>

                    <h3>Email Address</h3>
                    <p>support@captainpizza.in</p>
                </div>

                <p className="mt-3"><strong>Business Hours:</strong> Monday to Sunday, 11:00 AM to 11:00 PM</p>
            </div>
        </div>
    );
};

export default ContactUs;
