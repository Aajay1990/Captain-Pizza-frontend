import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import instagramLogo from '../assets/instgram logo.png';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>Captain Pizza</h3>
                    <p>Hot, Fresh & Delicious</p>
                    <div className="fssai-badge">fssai Certified</div>
                    <div className="veg-badge">
                        <div className="veg-dot"></div>
                        100% Pure Veg
                    </div>
                </div>

                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/menu">Menu</Link></li>
                        <li><Link to="/order">Order Now</Link></li>
                        <li><Link to="/offers">Offers</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Contact Us</h4>
                    <ul>
                        <li><i className="fas fa-phone"></i> 9220367325</li>
                        <li><i className="fas fa-phone"></i> 9220367425</li>
                        <li><i className="fas fa-map-marker-alt"></i> F-11 Main Road Dayalpur, Opposite Rajmandir Hypermarket, Near Hero Bike Showroom, Delhi</li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Legal</h4>
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/terms">Terms & Conditions</Link></li>
                        <li><Link to="/refund-policy">Refund Policy</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Follow Us</h4>
                    <div className="social-links">
                        <a
                            href="https://www.instagram.com/captain_pizza03?igsh=OGIyNThpbWp3c2Y1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="instagram-custom-link"
                        >
                            <img src={instagramLogo} alt="Instagram" />
                        </a>
                    </div>
                    <p className="mt-2">Available on:</p>
                    <div className="delivery-partners" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
                        <a href="https://www.zomato.com/ncr/captain-pizza-1-karawal-nagar-new-delhi/order" target="_blank" rel="noopener noreferrer" className="delivery-btn delivery-zomato">Zomato</a>
                        <a href="https://www.swiggy.com/city/delhi/captain-pizza-dilshad-gardens-karawal-nagar-rest1299975" target="_blank" rel="noopener noreferrer" className="delivery-btn delivery-swiggy">Swiggy</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Captain Pizza. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
