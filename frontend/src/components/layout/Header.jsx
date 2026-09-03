import React from 'react';

export default function Header({ search = '', setSearch = () => {} }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">
            Razorpay<span className="highlight-ai">AI</span> Store
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
          <button className="icon-btn" title="View Wishlist">
            <span className="icon">❤️</span>
            <span className="badge">1</span>
          </button>
          <button className="icon-btn" title="View Cart / Bag">
            <span className="icon">🛍️</span>
            <span className="badge">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}
