import API_URL from '../../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const DashboardStats = () => {
    const { token } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        cancelledOrders: 0,
        totalUsers: 0,
        completeOrders: 0,
        activeCoupons: 0,
        popularItems: [],
        staffSummary: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/dashboard`, {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('adminToken') || localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const statCards = [
        { id: 1, title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: 'fas fa-rupee-sign', color: '#10b981' },
        { id: 2, title: 'Total Orders', value: stats.totalOrders, icon: 'fas fa-shopping-bag', color: '#3b82f6' },
        { id: 3, title: 'Total Users', value: stats.totalUsers || 0, icon: 'fas fa-users', color: '#6366f1' },
        { id: 4, title: 'Complete Orders', value: stats.completeOrders, icon: 'fas fa-check-circle', color: '#8b5cf6' },
        { id: 5, title: 'Cancelled Orders', value: stats.cancelledOrders, icon: 'fas fa-times-circle', color: '#ef4444' },
        { id: 6, title: 'Active Coupons', value: stats.activeCoupons, icon: 'fas fa-percent', color: '#f59e0b' }
    ];

    if (loading) {
        return <div className="placeholder-pane">Loading live dashboard metrics...</div>;
    }

    return (
        <div className="dashboard-stats">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Store Overview (<span style={{ color: 'var(--primary)' }}>Real-time Sync</span>)</h3>
                <button
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', opacity: refreshing ? 0.7 : 1 }}
                >
                    <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div className="stats-grid">
                {statCards.map(stat => (
                    <div key={stat.id} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                            <i className={stat.icon}></i>
                        </div>
                        <div className="stat-details">
                            <h4>{stat.title}</h4>
                            <p>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="recent-activity">
                <h3 className="section-title">Sales Intel & Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="activity-list card" style={{ padding: '20px', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--primary)' }}><i className="fas fa-fire"></i> Best Sellers</h4>
                        {(!stats.popularItems || stats.popularItems.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)' }}>Not enough data to calculate best sellers yet.</p>
                        ) : (
                            <ul style={{ width: '100%', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                                {stats.popularItems.map((item, id) => (
                                    <li key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dotted #ccc' }}>
                                        <strong>{item.name}</strong>
                                        <span style={{ color: 'green', fontWeight: 'bold' }}>{item.sold} sold</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="activity-list card" style={{ padding: '20px', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--primary)' }}><i className="fas fa-users-cog"></i> Staff Tracking</h4>
                        {(!stats.staffSummary || stats.staffSummary.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)' }}>No staff sales data recorded yet.</p>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '8px 0' }}>Staff Member</th>
                                            <th>Orders</th>
                                            <th>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.staffSummary.map((staff, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                <td style={{ padding: '8px 0' }}>{staff.name}</td>
                                                <td>{staff.orderCount}</td>
                                                <td style={{ fontWeight: 'bold' }}>₹{staff.revenue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        Currently, revenue and best-seller calculations are sourced from all Orders set to the "Delivered" status.<br />
                        <b>Pro Tip:</b> Use the POS Panel for fast walk-in orders to sync staff performance in real-time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
