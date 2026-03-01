import React from 'react';
import './Legal.css';

const RefundPolicy = () => {
    return (
        <div className="legal-page-container">
            <h1 className="legal-title">Refund & Cancellation Policy</h1>
            <div className="legal-content">
                <p>At Captain Pizza, customer satisfaction is our top priority. We strive to provide the best food quality and delivery experience. However, there may be rare instances where you need to request a cancellation or refund.</p>

                <h3>1. Order Cancellation</h3>
                <ul>
                    <li><strong>Before Preparation:</strong> You may cancel your order immediately after placing it, provided we have not yet started preparing your food. In this case, a full refund will be initiated.</li>
                    <li><strong>After Preparation:</strong> Once the restaurant has accepted the order and started preparing the food, we cannot accept a cancellation, and you will not be eligible for a refund.</li>
                </ul>

                <h3>2. Refund Eligibility</h3>
                <p>Refunds are only processed under the following circumstances:</p>
                <ul>
                    <li>The payment was deducted, but the order failed to generate in our system.</li>
                    <li>The restaurant was unable to fulfill your order due to item unavailability or other operational delays.</li>
                    <li>The delivered food was severely damaged, incorrect, or missing items (requires immediate proof upon delivery).</li>
                </ul>

                <h3>3. Refund Processing Time (Important)</h3>
                <p>
                    All approved refunds are initiated back to the original payment method.
                    <strong> Please note that the refund process typically takes between 5–7 working days</strong> for the amount to reflect in your bank account, wallet, or credit card, depending on your bank's processing timelines.
                </p>

                <h3>4. Contact Support</h3>
                <p>If you have questions about your cancellation or did not receive your refund within 7 working days, please contact us with your Order ID at support@captainpizza.in.</p>
            </div>
        </div>
    );
};

export default RefundPolicy;
