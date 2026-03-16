import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './OrderHistory.css';
import API_URL from '../apiConfig';

const API = API_URL;

const STATUS_INDEX = {
    'pending': 0,
    'received': 0,
    'confirmed': 1,
    'kitchen': 1,
    'preparing': 2,
    'ready': 3,
    'outForDelivery': 3,
    'out_for_delivery': 3,
    'delivered': 4,
    'cancelled': -1,
};

const OrderHistory = () => {
    // Section 1: Previous Orders
    const [prevOrders, setPrevOrders] = useState([]);
    const [prevLoading, setPrevLoading] = useState(false);
    
    // Section 2: Track Order
    const [trackIdInput, setTrackIdInput] = useState('');
    const [trackedOrder, setTrackedOrder] = useState(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [trackError, setTrackError] = useState('');
    
    // Auth context (stored phone or device ID)
    const userPhone = localStorage.getItem('cp_order_phone');
    const deviceId = localStorage.getItem('cp_device_id');
    const lookupId = userPhone || deviceId;
    
    // Polling Ref
    const pollingRef = useRef(null);

    // Initial load: fetch previous orders and restore tracking session
    useEffect(() => {
        if (lookupId) {
            fetchPreviousOrders(lookupId);
        }

        const activeTrackId = localStorage.getItem('cp_active_track_id');
        if (activeTrackId) {
            setTrackIdInput(activeTrackId.slice(-6).toUpperCase());
            resumeTracking(activeTrackId);
        }
    }, [lookupId]);

    const resumeTracking = async (id) => {
        try {
            const res = await fetch(`${API}/api/orders/${id}`);
            const data = await res.json();
            if (data.success) {
                setTrackedOrder(data.data);
            }
        } catch (e) {
            console.warn("Could not resume tracking", e);
        }
    };

    // Polling for real-time updates when an order is being tracked
    useEffect(() => {
        if (trackedOrder) {
            if (trackedOrder.status !== 'delivered' && trackedOrder.status !== 'cancelled') {
                startPolling(trackedOrder._id);
                localStorage.setItem('cp_active_track_id', trackedOrder._id);
            } else {
                stopPolling();
                localStorage.removeItem('cp_active_track_id');
            }
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [trackedOrder]);

    const fetchPreviousOrders = async (ph) => {
        setPrevLoading(true);
        try {
            const res = await fetch(`${API}/api/orders/by-phone/${ph}`);
            const data = await res.json();
            if (data.success) {
                setPrevOrders(data.orders || []);
            }
        } catch (e) {
            console.error("Error fetching history", e);
        } finally {
            setPrevLoading(false);
        }
    };

    const handleTrackSubmit = async (e) => {
        if (e) e.preventDefault();
        const input = trackIdInput.trim().toUpperCase();
        if (!input) return;
        
        setTrackLoading(true);
        setTrackError('');
        try {
            // Priority 1: Direct endpoint fetch (requires new backend)
            const res = await fetch(`${API}/api/orders/${input}`);
            const data = await res.json();
            
            if (data.success) {
                setTrackedOrder(data.data);
                scrollToResult();
                return;
            }

            // Priority 2: Fallback search in already loaded previous orders 
            // useful if user clicks a card or if backend ID match fails due to format
            const localMatch = prevOrders.find(o => 
                o._id.toUpperCase().endsWith(input) || 
                o._id.toUpperCase() === input
            );

            if (localMatch) {
                setTrackedOrder(localMatch);
                scrollToResult();
            } else {
                setTrackedOrder(null);
                setTrackError('Order ID not found. Please check your Order ID.');
            }
        } catch (e) {
            // Priority 3: Final fallback try searching all if endpoint 404'd
            await searchAllOrdersFallback(input);
        } finally {
            setTrackLoading(false);
        }
    };

    const searchAllOrdersFallback = async (id) => {
        try {
            const res = await fetch(`${API}/api/orders`);
            const data = await res.json();
            if (data.success) {
                const found = data.data.find(o => 
                    o._id.toUpperCase().endsWith(id) || 
                    o._id.toUpperCase() === id
                );
                if (found) {
                    setTrackedOrder(found);
                    scrollToResult();
                } else {
                    setTrackError('Order ID not found. Please check your Order ID.');
                }
            }
        } catch (err) {
            setTrackError('Order ID not found. Please check your Order ID.');
        }
    };

    const scrollToResult = () => {
        setTimeout(() => {
            document.getElementById('track-result')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const startPolling = (id) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API}/api/orders/${id}`);
                const data = await res.json();
                if (data.success) {
                    setTrackedOrder(data.data);
                }
            } catch (e) {
                console.warn("Polling error", e);
            }
        }, 8000); // Poll every 8 seconds
    };

    const stopPolling = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const getStepIndex = (status) => STATUS_INDEX[status] ?? 0;

    const renderOrderCard = (order) => {
        const status = order.status || 'pending';
        const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const shortId = order._id.slice(-6).toUpperCase();

        return (
            <div key={order._id} className="oh-v2-card">
                <div className="oh-v2-card-header">
                    <span className="oh-v2-id">ID: {shortId}</span>
                    <span className={`oh-v2-badge status-${status}`}>{status.toUpperCase()}</span>
                </div>
                <div className="oh-v2-card-body">
                    <div className="oh-v2-date">{dateStr}</div>
                    <div className="oh-v2-items">
                        {order.orderItems?.map((it, idx) => (
                            <span key={idx}>{it.name}{idx < order.orderItems.length-1 ? ', ' : ''}</span>
                        ))}
                    </div>
                    <div className="oh-v2-footer">
                        <span className="oh-v2-price">₹{order.totalAmount}</span>
                        <span className="oh-v2-pay">{order.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}</span>
                    </div>
                </div>
                <button className="oh-v2-track-btn" onClick={() => {
                    setTrackIdInput(shortId);
                    setTrackedOrder(order);
                    document.getElementById('track-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                    Track Real-time →
                </button>
            </div>
        );
    };

    return (
        <div className="oh-v2-page animate-fade-in">
            <div className="oh-v2-hero">
                <h1>📦 Order History</h1>
                <p>Manage your previous orders and track active ones</p>
            </div>

            <div className="oh-v2-container">
                {/* 1. PREVIOUS ORDERS SECTION */}
                <section className="oh-v2-section">
                    <h2 className="oh-v2-section-title">
                        <i className="fas fa-history"></i> Previous Orders
                    </h2>
                    
                    {prevLoading ? (
                        <div className="oh-v2-loading">
                            <div className="oh-v2-spinner"></div>
                            <p>Fetching your history...</p>
                        </div>
                    ) : prevOrders.length > 0 ? (
                        <div className="oh-v2-grid">
                            {prevOrders.map(order => renderOrderCard(order))}
                        </div>
                    ) : (
                        <div className="oh-v2-empty">
                            <div className="oh-v2-empty-icon">🍕</div>
                            <h3>No previous orders found</h3>
                            <p>When you place an order, it will appear here.</p>
                            <Link to="/menu" className="oh-v2-cta">Start Ordering</Link>
                        </div>
                    )}
                </section>

                <hr className="oh-v2-divider" />

                {/* 2. TRACK ORDER SECTION */}
                <section id="track-section" className="oh-v2-section">
                    <h2 className="oh-v2-section-title">
                        <i className="fas fa-satellite-dish"></i> Track Your Order
                    </h2>
                    
                    <div className="oh-v2-track-form-card">
                        <p>Enter your Order ID to see real-time status and live updates.</p>
                        <form className="oh-v2-track-form" onSubmit={handleTrackSubmit}>
                            <input 
                                type="text" 
                                placeholder="Enter Order ID (e.g. 64b2...)"
                                value={trackIdInput}
                                onChange={(e) => setTrackIdInput(e.target.value)}
                                required
                            />
                            <button type="submit" disabled={trackLoading}>
                                {trackLoading ? 'Searching...' : 'Track Order Now'}
                            </button>
                        </form>
                        {trackError && <p className="oh-v2-error">{trackError}</p>}
                    </div>

                    {/* TRACK RESULT */}
                    {trackedOrder && (
                        <div id="track-result" className="oh-v2-result-card animate-slide-up">
                            <div className="oh-v2-result-head">
                                <h3>Order Details</h3>
                                <div className={`oh-v2-status-banner status-${trackedOrder.status}`}>
                                    {trackedOrder.status.toUpperCase()}
                                </div>
                            </div>
                            
                            <div className="oh-v2-result-body">
                                <div className="oh-v2-res-row">
                                    <span className="label">Order ID:</span>
                                    <span className="value">{trackedOrder._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="oh-v2-res-row">
                                    <span className="label">Customer Name:</span>
                                    <span className="value">{trackedOrder.customerInfo?.name || 'Customer'}</span>
                                </div>
                                <div className="oh-v2-res-row">
                                    <span className="label">Amount Paid:</span>
                                    <span className="value">₹{trackedOrder.totalAmount} ({trackedOrder.paymentMethod === 'online' ? 'Online' : 'Cash'})</span>
                                </div>
                                
                                <div className="oh-v2-res-items">
                                    <div className="label">Items Ordered:</div>
                                    <div className="oh-v2-res-items-list">
                                        {trackedOrder.orderItems?.map((it, i) => (
                                            <div key={i} className="oh-v2-res-item">
                                                <span>{it.name} × {it.quantity}</span>
                                                <span>₹{it.price * it.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tracking Progress Bar */}
                                <div className="oh-v2-tracking-visual">
                                    <div className="oh-v2-tracking-bar">
                                        <div 
                                            className="oh-v2-tracking-fill" 
                                            style={{ width: `${(getStepIndex(trackedOrder.status) / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="oh-v2-tracking-labels">
                                        <div className={`step ${getStepIndex(trackedOrder.status) >= 0 ? 'active' : ''}`}>Received</div>
                                        <div className={`step ${getStepIndex(trackedOrder.status) >= 1 ? 'active' : ''}`}>Confirmed</div>
                                        <div className={`step ${getStepIndex(trackedOrder.status) >= 2 ? 'active' : ''}`}>Preparing</div>
                                        <div className={`step ${getStepIndex(trackedOrder.status) >= 3 ? 'active' : ''}`}>On Way</div>
                                        <div className={`step ${getStepIndex(trackedOrder.status) >= 4 ? 'active' : ''}`}>Delivered</div>
                                    </div>
                                </div>

                                <div className="oh-v2-live-indicator">
                                    <span className="dot"></span> Live status updates enabled
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OrderHistory;
