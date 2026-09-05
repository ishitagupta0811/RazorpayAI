import React from 'react';

export default function OrderSuccessModal({ orderDetails, onClose }) {
  if (!orderDetails) return null;

  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";
  const items = orderDetails.items || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-success-card" onClick={(e) => e.stopPropagation()}>
        <div className="success-header">
          <div className="success-icon-badge">✓</div>
          <h2>Payment Successful!</h2>
          <p className="order-subtext">Thank you for your order with RazorpayAI Store</p>
        </div>

        <div className="order-details-box">
          <div className="detail-meta-row">
            <span className="meta-label">Razorpay Order ID:</span>
            <span className="meta-val">{orderDetails.order_id || 'order_rzp_test'}</span>
          </div>
          <div className="detail-meta-row">
            <span className="meta-label">Payment ID:</span>
            <span className="meta-val">{orderDetails.payment_id || 'pay_rzp_test'}</span>
          </div>
          <div className="detail-meta-row">
            <span className="meta-label">Customer:</span>
            <span className="meta-val">Ishita Gupta (ishitagupta0811@gmail.com)</span>
          </div>
          {orderDetails.ai_attributed && (
            <div className="ai-attributed-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <img
                src="/chatbot-avatar-hd.png"
                alt="AI Agent"
                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/chatbot-avatar.png'; }}
              />
              <span>AI Agent Assisted Order (+15% AOV Attribution)</span>
            </div>
          )}
        </div>

        {/* Visual Item List */}
        <div className="success-items-list">
          <h3>Purchased Items ({items.length})</h3>
          <div className="items-scroll">
            {items.map((item, idx) => (
              <div key={idx} className="success-item-row">
                <img
                  src={item.image_url || defaultFallbackImage}
                  alt={item.title}
                  className="success-item-thumb"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultFallbackImage;
                  }}
                />
                <div className="success-item-info">
                  <div className="success-item-title">{item.title}</div>
                  <div className="success-item-qty">Qty: {item.quantity || 1}</div>
                </div>
                <div className="success-item-price">
                  ₹{(Number(item.price) || 0).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Cashback Perk Banner */}
        <div className="wallet-reward-banner">
          <span>💳 Bonus Perk: ₹250 Wallet Cashback Credited!</span>
        </div>

        {/* Total & Action */}
        <div className="success-footer">
          <div className="total-paid-row">
            <span>Total Paid</span>
            <span className="paid-amount">₹{(Number(orderDetails.amount_inr) || 0).toLocaleString('en-IN')}</span>
          </div>
          <button className="continue-shopping-btn" onClick={onClose}>
            Continue Shopping ➔
          </button>
        </div>
      </div>
    </div>
  );
}
