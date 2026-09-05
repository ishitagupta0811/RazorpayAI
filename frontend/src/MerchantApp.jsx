import React, { useState, useEffect } from 'react';
import { getMerchantAovSummary, seedMerchantDemoAnalytics } from './services/merchantApi';

export default function MerchantApp() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getMerchantAovSummary();
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
    fetchAnalytics();
  }, []);

  const handleReseedDemo = async () => {
    setSeeding(true);
    try {
      await seedMerchantDemoAnalytics();
      await fetchAnalytics();
    } catch (err) {
      console.error("Failed to seed demo analytics:", err);
    } finally {
      setSeeding(false);
    }
  };

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
  const dailyTrend = trends;
  const orders = analyticsData?.recent_orders || [];

  const maxTrendRevenue = Math.max(...trends.map(t => (t.baseline_revenue + t.ai_revenue)), 1000);

  return (
    <div className="standalone-merchant-page">
      {/* Full-Width Merchant Header */}
      <header className="merchant-dashboard-header">
        <div className="merchant-header-brand">
          <img src="/razorpay-logo.svg" alt="Razorpay Logo" className="merchant-header-logo" />
          <div>
            <h2>Merchant Revenue & AOV Attribution Dashboard</h2>
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
          <a
            href="http://localhost:5173"
            className="back-to-store-btn"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '0.55rem 0.95rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.82rem'
            }}
          >
            Storefront (Port 5173)
          </a>
        </div>
      </header>

      {loading ? (
        <div className="merchant-loading-spinner-box" style={{ padding: '6rem 2rem' }}>
          <div className="merchant-spinner"></div>
          <p>Connecting to Merchant Backend API on port 8001...</p>
        </div>
      ) : (
        <main className="merchant-dashboard-body" style={{ maxWidth: '1280px', margin: '1.5rem auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

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

          <div className="merchant-charts-row">

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
                <div className="aov-uplift-summary-box">
                  <span className="uplift-text">AI-driven recommendations deliver a <strong>+{summary.aov_uplift_percent}% higher AOV</strong> per order</span>
                </div>
              </div>
            </div>
          </div>

          <div className="merchant-chart-card full-width-card">
            <h3>30-Day Daily Revenue & Attribution Trend</h3>
            {dailyTrend.length === 0 ? (
              <p className="no-trend-data">No historical order trend available yet.</p>
            ) : (
              <div className="trend-bar-chart-container">
                <div className="trend-bars-wrapper">
                  {dailyTrend.map((t, idx) => {
                    const aiRev = t.ai_revenue;
                    const baseRev = t.baseline_revenue;
                    const totalD = aiRev + baseRev;
                    const maxVal = Math.max(...dailyTrend.map(d => (d.ai_revenue + d.baseline_revenue)), 1);
                    const barHeightPct = Math.round((totalD / maxVal) * 100);
                    const aiPct = totalD > 0 ? Math.round((aiRev / totalD) * 100) : 0;

                    return (
                      <div key={idx} className="trend-bar-col" title={`${t.date}: ₹${totalD.toLocaleString('en-IN')} (AI: ${aiPct}%)`}>
                        <div className="trend-stacked-bar" style={{ height: `${Math.max(12, barHeightPct)}%` }}>
                          <div
                            className="trend-ai-portion"
                            style={{ height: `${aiPct}%` }}
                          ></div>
                          {100 - aiPct > 0 && (
                            <div
                              className="trend-baseline-portion"
                              style={{ height: `${100 - aiPct}%` }}
                            ></div>
                          )}
                        </div>
                        <span className="trend-date-label">{t.date ? (String(t.date).split(' ')[1] || t.date) : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="merchant-orders-section-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>Attributed Orders Audit Log ({orders.length})</h3>
            </div>
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

        </main>
      )}
    </div>
  );
}
