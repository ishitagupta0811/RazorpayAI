import React, { useState } from 'react';

export default function Filters({
  category,
  setCategory,
  maxPrice,
  setMaxPrice,
  isCollapsed,
  setIsCollapsed,
  buyerProfile,
  cartCount,
  onOpenProfileModal,
  onOpenMerchantDashboard
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = [
    { label: "All Items", value: "all" },
    { label: "Apparel", value: "cat_apparel" },
    { label: "Footwear", value: "cat_footwear" },
    { label: "Accessories", value: "cat_accessories" }
  ];

  // Collapsed Sidebar Rail View (Spotify-style)
  if (isCollapsed) {
    return (
      <aside className="filters-sidebar collapsed-rail">
        {/* Toggle Button to Expand */}
        <button
          className="sidebar-toggle-btn collapsed-toggle"
          title="Expand Sidebar (to 260px)"
          onClick={() => setIsCollapsed(false)}
        >
          <span className="toggle-icon" style={{ fontSize: '1rem', fontWeight: '800' }}>▶</span>
        </button>

        {/* Collapsed Category Icon Buttons */}
        <div className="collapsed-icons-group">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`collapsed-icon-btn ${category === cat.value ? 'active-purple' : ''}`}
              title={`${cat.label} (Click to select/expand)`}
              onClick={() => {
                setCategory(cat.value);
                setIsCollapsed(false);
              }}
            >
              <span className="cat-emoji" style={{ fontWeight: '700', fontSize: '0.85rem' }}>{cat.label.charAt(0)}</span>
            </button>
          ))}
        </div>

        {/* Price Trigger Icon */}
        <div className="collapsed-tools-group">
          <button
            className="collapsed-icon-btn"
            title={`Price Filter (Max: ₹${maxPrice}) - Click to expand`}
            onClick={() => setIsCollapsed(false)}
          >
            💰
          </button>
        </div>

        {/* Collapsed Wallet Balance Trigger */}
        <div className="collapsed-tools-group">
          <button
            className="collapsed-icon-btn"
            title={`Wallet Balance: ₹${(buyerProfile?.walletBalance || 1250).toLocaleString('en-IN')} (Click to open)`}
            onClick={() => onOpenProfileModal('wallet')}
            style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15))', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            💳
          </button>
        </div>

        {/* Collapsed Profile Avatar Trigger */}
        <div className="collapsed-profile-group">
          <button
            className="collapsed-icon-btn profile-rail-btn"
            title={`Buyer Profile: ${buyerProfile?.name || 'Ishita Gupta'} (Click to open menu)`}
            onClick={() => onOpenProfileModal()}
          >
            👤
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Sidebar View
  return (
    <aside className="filters-sidebar expanded-sidebar">
      {/* Top Header with Toggle Hide Button */}
      <div className="sidebar-top-header">
        <h2 className="sidebar-main-title">Categories</h2>
        <button
          className="sidebar-toggle-btn"
          title="Shrink Sidebar (Collapse to Icon Rail)"
          onClick={() => setIsCollapsed(true)}
        >
          <span className="toggle-icon" style={{ fontSize: '1rem', fontWeight: '800' }}>◀</span>
        </button>
      </div>

      {/* Section (a): Categories */}
      <div className="filter-card">
        <div className="category-pills-list">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`cat-pill-btn ${category === cat.value ? 'selected-purple' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section (b): Filter by Price */}
      <div className="filter-card">
        <h3 className="filter-heading">Filter by Price</h3>
        <div className="price-slider-box">
          <input
            type="range"
            min="300"
            max="3500"
            step="50"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="price-range-input"
          />
          <div className="price-range-labels">
            <span>₹300</span>
            <span>Max: ₹{maxPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Section (c): Wallet Card on top of Profile */}
      <div
        className="filter-card wallet-balance-card"
        onClick={() => onOpenProfileModal('wallet')}
        style={{
          cursor: 'pointer',
          background: '#c2e59c',
          border: 'none',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 14px rgba(194, 229, 156, 0.4)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.03em', textAlign: 'center' }}>
          Wallet
        </span>
      </div>

      {/* Section (d): Account & Profile Card */}
      <div className="filter-card buyer-profile-bar-card">
        <h3 className="filter-heading">Account & Profile</h3>
        <div
          className={`profile-bar-trigger ${isMenuOpen ? 'active-border' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="profile-bar-left">
            <div className="profile-avatar-small">👤</div>
            <div className="profile-bar-info">
              <span className="profile-bar-name">{buyerProfile?.name || 'Ishita Gupta'}</span>
              <span className="profile-bar-role">{buyerProfile?.email || 'ishitagupta0811@gmail.com'}</span>
            </div>
          </div>
          <span className={`profile-arrow-icon ${isMenuOpen ? 'open' : ''}`}>▾</span>
        </div>

        {/* Popover Profile Menu (Matching screenshot design) */}
        {isMenuOpen && (
          <div className="profile-popover-menu">
            <div className="popover-user-header">
              <div className="profile-avatar-medium">👤</div>
              <div className="popover-user-text">
                <div className="popover-user-name">{buyerProfile?.name || 'Ishita Gupta'}</div>
                <div className="popover-user-email">{buyerProfile?.email || 'ishitagupta0811@gmail.com'}</div>
              </div>
            </div>

            <div className="popover-menu-items">
              <button
                className="popover-item-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenProfileModal('wallet');
                }}
              >
                <span className="item-left"><span className="menu-icon">💳</span> Wallet & Credits</span>
                <span className="item-badge-green">₹{(buyerProfile?.walletBalance || 1250).toLocaleString('en-IN')}</span>
              </button>

              <button
                className="popover-item-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenProfileModal('orders');
                }}
              >
                <span className="item-left"><span className="menu-icon">📦</span> My Orders</span>
                <span className="item-badge-gray">{buyerProfile?.orders?.length || 2} Orders</span>
              </button>

              <button
                className="popover-item-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenProfileModal('cart');
                }}
              >
                <span className="item-left"><span className="menu-icon">🛒</span> Active Cart</span>
                <span className="item-badge-purple">{cartCount || 0} Items</span>
              </button>

              <button
                className="popover-item-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenProfileModal('addresses');
                }}
              >
                <span className="item-left"><span className="menu-icon">🏠</span> Saved Addresses</span>
                <span className="item-badge-gray">{buyerProfile?.addresses?.length || 2} Saved</span>
              </button>

              <div className="popover-divider" />

              <button
                className="popover-item-btn logout-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  alert("Logged out successfully!");
                }}
              >
                <span className="item-left"><span className="menu-icon">🚪</span> Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
