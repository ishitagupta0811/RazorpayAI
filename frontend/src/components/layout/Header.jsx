import React from 'react';
import { useCart } from '../../context/CartContext';

export default function Header({ 
  search = '', 
  setSearch = () => {}, 
  wishlistCount = 0, 
  onOpenCartDrawer = () => {}, 
  onOpenWishlist = () => {},
  onOpenMerchantDashboard = () => {} 
}) {
  const { cartCount } = useCart();

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="logo" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <img src="/razorpay-logo.svg" alt="Razorpay Logo" style={{ height: '30px', objectFit: 'contain' }} />
          <span className="logo-text" style={{ fontSize: '1.35rem', fontWeight: '800', fontStyle: 'italic', letterSpacing: '-0.02em', color: '#072654' }}>
            <span className="highlight-ai" style={{ color: '#0284c7', fontStyle: 'normal', fontWeight: '800' }}>AI</span> Store
          </span>
        </div>

        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by style, fabric, or product..."
          />
        </div>

        <div className="nav-actions">
          <button className="merchant-dashboard-trigger-btn" title="View Merchant Analytics Dashboard" onClick={onOpenMerchantDashboard}>
            <span>📊 Merchant Analytics</span>
          </button>
          <button className="nav-action-btn" title="View Wishlist" onClick={onOpenWishlist}>
            <span>Wishlist</span>
            <span className="badge">{wishlistCount}</span>
          </button>
          <button className="nav-action-btn" title="View Bag" onClick={onOpenCartDrawer}>
            <span>Bag</span>
            <span className="badge">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
