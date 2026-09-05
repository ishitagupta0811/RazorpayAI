import React, { useState, useEffect } from 'react';
import { getAovSummary, seedDemoAnalytics } from '../../services/api';

export default function MerchantDashboardModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getAovSummary();
      if (res && res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error("Failed to load merchant analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const handleReseedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemoAnalytics();
      await fetchAnalytics();
    } catch (err) {
      console.error("Failed to seed demo analytics:", err);
    } finally {
      setSeeding(false);
    }
  };

  if (!isOpen) return null;

  const summary = analyticsData?.summary || {
    total_orders: 0,
    total_revenue_inr: 0,
    baseline_aov: 0,
    ai_assisted_aov: 0,
    aov_uplift_percent: 0,
    incremental_ai_revenue_inr: 0,
    wishlist_recovery_revenue_inr: 0,
    overall_acceptance_rate_percent: 0
  };

  const attribution = analyticsData?.attribution_breakdown || [];
  const trends = analyticsData?.daily_trends || [];
  const orders = analyticsData?.recent_orders || [];

  // Max value calculation for trend chart scaling
  const maxTrendRevenue = Math.max(...trends.map(t => (t.baseline_revenue + t.ai_revenue)), 1000);

  return (
    <div className="merchant-dashboard-overlay" onClick={onClose}>
      <div className="merchant-dashboard-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <header className="merchant-dashboard-header">
          <div className="merchant-header-brand">
            <img src="/razorpay-logo.svg" alt="Razorpay Logo" className="merchant-header-logo" />
            <div>
              <h2>Merchant Analytics & AOV Attribution</h2>
            </div>
          </div>

          <div className="merchant-header-actions">
            <button 
              className="reseed-demo-btn" 
              onClick={handleReseedDemo} 
              disabled={seeding || loading}
              title="Reseed 45 realistic orders over 30 days"
            >
              {seeding ? 'Reseeding Data...' : 'Reseed Demo Data'}
            </button>
            <button className="merchant-close-btn" onClick={onClose} title="Close Dashboard">✕</button>
          </div>
        </header>

        {/* Dashboard Navigation Tabs */}
        {loading ? (
          <div className="merchant-loading-spinner-box">
            <div className="merchant-spinner"></div>
            <p>Aggregating merchant AOV attribution metrics...</p>
          </div>
        ) : (
          <div className="merchant-dashboard-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 4 Metric Cards Row */}
            <div className="merchant-kpi-grid">
              <div className="merchant-kpi-card highlight-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Average Order Value (AOV)</span>
                  <span className="kpi-badge uplift">+ {summary.aov_uplift_percent}% Uplift</span>
                </div>
                <div className="kpi-main-compare">
                  <div className="kpi-val-box">
                    <span className="kpi-label">AI-Assisted</span>
                    <span className="kpi-value ai-val">₹{summary.ai_assisted_aov.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="kpi-divider">vs</div>
                  <div className="kpi-val-box">
                    <span className="kpi-label">Standard Grid</span>
                    <span className="kpi-value baseline-val">₹{summary.baseline_aov.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="merchant-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Incremental AI Revenue</span>
                </div>
                <div className="kpi-single-value">
                  ₹{summary.incremental_ai_revenue_inr.toLocaleString('en-IN')}
                </div>
                <span className="kpi-subtext">Net revenue added via AI upselling & cross-selling</span>
              </div>

              <div className="merchant-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">Wishlist Recovery Revenue</span>
                </div>
                <div className="kpi-single-value">
                  ₹{summary.wishlist_recovery_revenue_inr.toLocaleString('en-IN')}
                </div>
                <span className="kpi-subtext">Saved items converted into active cart purchases</span>
              </div>

              <div className="merchant-kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-title">AI Acceptance Rate</span>
                </div>
                <div className="kpi-single-value">
                  {summary.overall_acceptance_rate_percent}%
                </div>
                <span className="kpi-subtext">Recommendations accepted by shoppers in chat</span>
              </div>
            </div>

            {/* 2 Column Visual Charts Row */}
            <div className="merchant-charts-row">
              
              {/* Left Chart: AOV & Conversion Breakdown Bar Chart */}
              <div className="merchant-chart-card">
                <h3>Conversion Attribution Breakdown</h3>
                <div className="attribution-breakdown-list">
                  {attribution.map((item, idx) => {
                    const totalRev = summary.total_revenue_inr || 1;
                    const pct = Math.round((item.revenue_inr / totalRev) * 100);

                    return (
                      <div key={idx} className="attribution-item">
                        <div className="attribution-info">
                          <span className="attribution-label" style={{ color: item.color }}>
                            {item.label} ({item.count} orders)
                          </span>
                          <span className="attribution-amount">
                            ₹{item.revenue_inr.toLocaleString('en-IN')} ({pct}%)
                          </span>
                        </div>
                        <div className="attribution-bar-bg">
                          <div 
                            className="attribution-bar-fill"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Chart: Baseline vs AI AOV Visual Comparison */}
              <div className="merchant-chart-card">
                <h3>AOV Comparison (Baseline vs AI-Assisted)</h3>
                <div className="aov-bar-comparison">
                  <div className="aov-compare-bar-container">
                    <div className="aov-bar-group">
                      <div 
                        className="aov-bar baseline-bar" 
                        style={{ height: `${Math.min(100, Math.max(30, (summary.baseline_aov / Math.max(summary.ai_assisted_aov, 1)) * 100))}%` }}
                      >
                        <span className="aov-bar-value">₹{summary.baseline_aov}</span>
                      </div>
                      <span className="aov-bar-label">Standard Grid</span>
                    </div>

                    <div className="aov-bar-group">
                      <div 
                        className="aov-bar ai-bar" 
                        style={{ height: '100%' }}
                      >
                        <span className="aov-bar-value">₹{summary.ai_assisted_aov}</span>
                      </div>
                      <span className="aov-bar-label">AI-Assisted</span>
                    </div>
                  </div>
                  <div className="aov-uplift-callout">
                    <span>AI Assistant increases Average Order Value by <strong>+{summary.aov_uplift_percent}%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 30-Day Revenue Trend Chart */}
            <div className="merchant-chart-card full-width-chart">
              <div className="chart-header-flex">
                <h3>30-Day Revenue & Conversion Trend</h3>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot ai-dot"></span> AI-Attributed Revenue</span>
                  <span className="legend-item"><span className="legend-dot baseline-dot"></span> Standard Grid Revenue</span>
                </div>
              </div>

              <div className="trend-svg-container">
                {trends.length > 0 && (
                  <div className="trend-bars-wrapper">
                    {trends.map((t, idx) => {
                      const totalRev = t.baseline_revenue + t.ai_revenue;
                      const heightPct = totalRev > 0 ? Math.max(12, Math.round((totalRev / maxTrendRevenue) * 100)) : 4;
                      const aiPct = totalRev > 0 ? (t.ai_revenue / totalRev) * 100 : 0;

                      return (
                        <div key={idx} className="trend-bar-column" title={`${t.date}: ₹${totalRev.toLocaleString('en-IN')} (${t.orders_count} orders)`}>
                          <div className="trend-bar-track" style={{ height: `${heightPct}%` }}>
                            {t.ai_revenue > 0 && (
                              <div 
                                className="trend-ai-portion" 
                                style={{ height: `${aiPct}%` }}
                              ></div>
                            )}
                            {t.baseline_revenue > 0 && (
                              <div 
                                className="trend-baseline-portion" 
                                style={{ height: `${100 - aiPct}%` }}
                              ></div>
                            )}
                          </div>
                          <span className="trend-date-label">{t.date.split(' ')[1]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Attributed Orders Audit Table Section */}
            <div className="merchant-orders-table-wrapper" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>Attributed Orders Audit Log ({orders.length})</h3>
                <table className="merchant-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items Summary</th>
                      <th>Amount</th>
                      <th>AI Attribution Tag</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      let tagLabel = "Standard Grid";
                      let tagClass = "tag-standard";

                      if (ord.ai_attributed) {
                        if (ord.ai_recommendation_type === "upsell") {
                          tagLabel = "Upsell Upgrade";
                          tagClass = "tag-upsell";
                        } else if (ord.ai_recommendation_type === "cross_sell") {
                          tagLabel = "Outfit Cross-Sell";
                          tagClass = "tag-cross-sell";
                        } else if (ord.ai_recommendation_type === "wishlist_recovery") {
                          tagLabel = "Wishlist Recovered";
                          tagClass = "tag-wishlist";
                        } else {
                          tagLabel = "AI Attributed";
                          tagClass = "tag-ai-general";
                        }
                      }

                      return (
                        <tr key={ord.id}>
                          <td className="order-id-cell">
                            <code>{ord.order_id}</code>
                            {ord.is_seed && <span className="seed-pill">Demo Seed</span>}
                          </td>
                          <td>
                            <div className="customer-info-box">
                              <span className="cust-name">{ord.customer_name}</span>
                              <span className="cust-email">{ord.customer_email}</span>
                            </div>
                          </td>
                          <td className="items-summary-cell" title={ord.items_summary}>
                            {ord.items_summary} ({ord.items_count} item{ord.items_count > 1 ? 's' : ''})
                          </td>
                          <td className="amount-cell">
                            ₹{ord.amount_inr.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className={`attribution-tag-pill ${tagClass}`}>
                              {tagLabel}
                            </span>
                          </td>
                          <td className="date-cell">{ord.date}</td>
                          <td>
                            <span className="status-paid-badge">
                              {ord.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

          </div>
        )}

      </div>
    </div>
  );
}
