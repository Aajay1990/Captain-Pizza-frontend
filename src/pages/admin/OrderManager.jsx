import React, { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';

const CookingTimer = ({ createdAt, status }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (status === 'delivered' || status === 'cancelled') {
            setTimeLeft('Finished');
            return;
        }

        const interval = setInterval(() => {
            const orderTime = new Date(createdAt).getTime();
            const targetTime = orderTime + (15 * 60 * 1000); // 15 mins prep time
            const now = new Date().getTime();
            const difference = targetTime - now;

            if (difference < 0) {
                setTimeLeft('OVERDUE');
            } else {
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s left`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt, status]);

    const isOverdue = timeLeft === 'OVERDUE';
    return (
        <div style={{
            marginTop: '8px',
            padding: '3px 8px',
            borderRadius: '5px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'inline-block',
            backgroundColor: isOverdue ? '#fee2e2' : '#e0e7ff',
            color: isOverdue ? '#ef4444' : '#4f46e5',
            border: `1px solid ${isOverdue ? '#ef4444' : '#4f46e5'}`
        }}>
            <i className="fas fa-clock"></i> {timeLeft}
        </div>
    );
};

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setRefreshing(true);
        try {
            const res = await api.get('/api/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            console.error("Fetch orders failed", error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setRefreshing(false);
            }, 600);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.put(`/api/orders/${id}/status`, { status: newStatus });
            if (res.data.success) {
                // Instantly update UI without heavy refetch
                setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            alert(`Error updating status: ${error.response?.data?.message || 'Server error'}`);
            console.error("Update status failed", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'orange';
            case 'preparing': return '#3b82f6'; // blue
            case 'out_for_delivery': return '#8b5cf6'; // purple
            case 'delivered': return 'green';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    return (
        <div className="order-manager">
            <div className="admin-toolbar">
                <h3 className="section-title">Live Kitchen Board</h3>
                <button
                    className="btn-primary"
                    onClick={fetchOrders}
                    disabled={refreshing}
                    style={{ backgroundColor: '#2b2b2b', color: 'white', opacity: refreshing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> {refreshing ? 'Refreshing...' : 'Refresh Orders'}
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID & Time</th>
                            <th>Customer Info</th>
                            <th>Items Passed</th>
                            <th>Amount Paid</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="5" style={{ textAlign: 'center' }}>Syncing database...</td></tr>}
                        {!loading && orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No orders found. Sit tight for customers!</td></tr>}

                        {orders.map(order => (
                            <tr key={order._id}>
                                <td>
                                    <strong>#{order._id.substring(order._id.length - 6).toUpperCase()}</strong>
                                    <br />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <br />
                                    {order.orderType === 'pos' && (
                                        <span style={{ backgroundColor: '#2b2b2b', color: '#fff', fontSize: '0.7rem', padding: '2px 5px', borderRadius: '3px', marginTop: '5px', display: 'inline-block' }}>POS Walk-in</span>
                                    )}
                                </td>
                                <td>
                                    <strong>{order.customerInfo.name}</strong><br />
                                    <span style={{ fontSize: '0.85rem', color: '#555' }}><i className="fas fa-phone"></i> {order.customerInfo.phone}</span>
                                </td>
                                <td>
                                    <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.9rem' }}>
                                        {order.orderItems.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: '5px' }}>
                                                <strong>{item.quantity}x {item.name}</strong>
                                                {item.toppings && item.toppings.length > 0 && (
                                                    <div style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
                                                        + {item.toppings.join(', ')}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td>
                                    <strong>₹{order.totalAmount}</strong><br />
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{order.paymentMethod}</span>
                                </td>
                                <td>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        style={{ 
                                            padding: '6px 10px', 
                                            borderRadius: '6px', 
                                            border: '1px solid #ddd',
                                            fontWeight: 'bold',
                                            color: '#fff',
                                            backgroundColor: order.status === 'pending' ? '#f59e0b' :
                                                             order.status === 'preparing' ? '#3b82f6' :
                                                             order.status === 'out_for_delivery' ? '#8b5cf6' :
                                                             order.status === 'delivered' ? '#10b981' :
                                                             order.status === 'cancelled' ? '#ef4444' : '#6b7280',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="pending" style={{ color: '#000', backgroundColor: '#fff' }}>Pending</option>
                                        <option value="preparing" style={{ color: '#000', backgroundColor: '#fff' }}>Preparing</option>
                                        <option value="out_for_delivery" style={{ color: '#000', backgroundColor: '#fff' }}>Out for Delivery</option>
                                        <option value="delivered" style={{ color: '#000', backgroundColor: '#fff' }}>Delivered</option>
                                        <option value="cancelled" style={{ color: '#000', backgroundColor: '#fff' }}>Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default OrderManager;
