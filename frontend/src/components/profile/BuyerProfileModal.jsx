import React, { useState, useEffect } from 'react';

export default function BuyerProfileModal({
  isOpen,
  onClose,
  buyerProfile,
  cartItems,
  initialTab = 'wallet'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content buyer-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Profile Header */}
        <div className="profile-modal-header">
          <div className="profile-user-info">
            <div className="profile-avatar-large">{buyerProfile?.avatar || '👤'}</div>
            <div>
              <h2 className="profile-user-name">{buyerProfile?.name || 'Ishita Gupta'}</h2>
              <span className="profile-user-email">{buyerProfile?.email || 'ishitagupta0811@gmail.com'}</span>
            </div>
          </div>
          <div className="profile-wallet-badge">
            <span className="wallet-badge-label">Wallet Credits</span>
            <span className="wallet-badge-amount">₹{(buyerProfile?.walletBalance || 1250).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="profile-tabs-nav">
          <button
            className={`profile-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallet')}
          >
            💳 Wallet & Credits
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Order History ({buyerProfile?.orders?.length || 0})
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            🛒 Cart ({cartItems.length})
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            🏠 Saved Addresses ({buyerProfile?.addresses?.length || 0})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="profile-tab-content">
          {/* 1. Wallet & Credits Tab */}
          {activeTab === 'wallet' && (
            <div className="wallet-tab-view">
              <div className="wallet-balance-card">
                <div>
                  <span className="balance-subtitle">Available Wallet Balance</span>
                  <div className="balance-main-amount">₹{(buyerProfile?.walletBalance || 1250).toLocaleString('en-IN')}</div>
                </div>
                <button className="wallet-add-btn" onClick={() => alert("Razorpay Wallet Top-up feature triggered!")}>
                  + Add Credits
                </button>
              </div>

              <h4 className="section-subheading">Recent Credit Activity</h4>
              <div className="activity-list">
                {buyerProfile?.walletTransactions?.map((tx) => (
                  <div key={tx.id} className="activity-item">
                    <div>
                      <div className="activity-title">{tx.description}</div>
                      <div className="activity-date">{tx.date}</div>
                    </div>
                    <div className={`activity-amount ${tx.type === 'credit' ? 'text-green' : 'text-red'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Order History Tab */}
          {activeTab === 'orders' && (
            <div className="orders-tab-view">
              {buyerProfile?.orders?.length === 0 ? (
                <p className="empty-text">No orders placed yet.</p>
              ) : (
                <div className="orders-list">
                  {buyerProfile?.orders?.map((order) => (
                    <div key={order.orderId} className="order-history-card">
                      <div className="order-card-header">
                        <div>
                          <span className="order-id-tag">#{order.orderId}</span>
                          <span className="order-date-text">• {order.date}</span>
                        </div>
                        <span className={`order-status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-items-preview">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <span className="item-title">{item.title}</span>
                            <span className="item-qty">x{item.quantity}</span>
                            <span className="item-price">₹{item.price.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-card-footer">
                        <span>Total Paid: <strong>₹{order.totalAmount.toLocaleString('en-IN')}</strong></span>
                        <span className="payment-method-tag">Paid via {order.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Shopping Cart Summary Tab */}
          {activeTab === 'cart' && (
            <div className="cart-tab-view">
              {cartItems.length === 0 ? (
                <p className="empty-text">Your cart is currently empty.</p>
              ) : (
                <div>
                  <div className="cart-summary-list">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="cart-summary-item">
                        <span className="item-name">{item.title}</span>
                        <span className="item-price">₹{item.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="cart-total-box">
                    <span>Subtotal ({cartItems.length} items):</span>
                    <strong>₹{cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Saved Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="addresses-tab-view">
              <div className="addresses-grid">
                {buyerProfile?.addresses?.map((addr) => (
                  <div key={addr.id} className={`address-card ${addr.isDefault ? 'default-address' : ''}`}>
                    <div className="address-header">
                      <span className="address-label">{addr.label}</span>
                      {addr.isDefault && <span className="default-pill">Primary</span>}
                    </div>
                    <p className="address-text">{addr.fullAddress}</p>
                    <span className="address-phone">📞 {addr.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
