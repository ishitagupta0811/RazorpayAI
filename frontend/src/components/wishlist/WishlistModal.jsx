import React from 'react';
import { useCart } from '../../context/CartContext';

export default function WishlistModal({
  isOpen,
  onClose,
  wishlistItems = [],
  products = [],
  onRemoveFromWishlist,
  onMoveToBag,
  onSelectProduct
}) {
  const { addToCart } = useCart();
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  // Build product lookup map to ensure image_url is always populated
  const catalogMap = React.useMemo(() => {
    const map = {};
    (products || []).forEach(p => {
      if (p.id) map[p.id] = p;
      if (p.product_id) map[p.product_id] = p;
    });
    return map;
  }, [products]);

  if (!isOpen) return null;

  const handleMoveToCartClick = (item) => {
    const targetId = item.id || item.product_id;
    const catalogMatch = catalogMap[targetId] || {};
    const fullProduct = {
      ...catalogMatch,
      ...item,
      image_url: catalogMatch.image_url || item.image_url || defaultFallbackImage
    };
    addToCart(fullProduct);
    if (onMoveToBag) {
      onMoveToBag(fullProduct);
    }
  };

  const handleRemoveClick = (productId) => {
    if (onRemoveFromWishlist) {
      onRemoveFromWishlist(productId);
    }
  };

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <aside className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Full-Screen Header Bar */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <button className="back-to-catalog-btn" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ← Continue Shopping
            </button>
            <h2>Your Wishlist</h2>
            <span className="cart-count-pill">{wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}</span>
          </div>
        </div>

        {/* Full Screen Main Container */}
        <div className="cart-fullscreen-wrapper">
          {wishlistItems.length === 0 ? (
            <div className="cart-empty-box" style={{ padding: '4rem 2rem' }}>
              <span className="empty-icon" style={{ fontSize: '3.5rem' }}>❤️</span>
              <h2 style={{ color: '#0f172a', fontWeight: '800', marginTop: '1rem' }}>Your wishlist is empty</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Save items you love by clicking the heart icon on any product in our store!
              </p>
              <button className="back-to-catalog-btn" onClick={onClose} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                Explore Product Catalog
              </button>
            </div>
          ) : (
            <div>
              <div className="column-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Saved Items ({wishlistItems.length} {wishlistItems.length === 1 ? 'Product' : 'Products'})
                </h3>
              </div>

              {/* Wishlist Grid */}
              <div className="wishlist-fullscreen-grid">
                {wishlistItems.map((item) => {
                  const targetId = item.id || item.product_id;
                  const catalogMatch = catalogMap[targetId] || {};
                  const itemImgUrl = catalogMatch.image_url || item.image_url || defaultFallbackImage;

                  return (
                    <div key={targetId} className="wishlist-item-card-fullscreen">
                      <div
                        className="wishlist-img-wrapper"
                        onClick={() => {
                          onClose();
                          if (onSelectProduct) onSelectProduct(targetId);
                        }}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        title="Click to view details"
                      >
                        <img
                          src={itemImgUrl}
                          alt={item.title}
                          className="wishlist-item-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultFallbackImage;
                          }}
                        />

                        {/* Top-Right Small Trash Bin Button */}
                        <button
                          className="top-right-bin-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveClick(targetId);
                          }}
                          title="Remove from wishlist"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="wishlist-item-info">
                        <h4
                          className="wishlist-item-title"
                          onClick={() => {
                            onClose();
                            if (onSelectProduct) onSelectProduct(targetId);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.title}
                        </h4>
                        <div className="wishlist-item-price">
                          ₹{typeof item.price === 'number' ? item.price.toLocaleString('en-IN') : item.price}
                        </div>

                        {/* Primary Action Button: Move to Bag */}
                        <div className="wishlist-actions-row">
                          <button
                            className="move-to-bag-btn"
                            onClick={() => handleMoveToCartClick(item)}
                          >
                            Move to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
