import React from 'react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product, onAddToCart, onAddToWishlist, isWishlisted = false, onSelectProduct }) {
  const { addToCart } = useCart();
  const attrs = product.attributes || {};
  const fabricTag = attrs.fabric || attrs.material_fabric || 'Quality Fabric';
  const fitTag = attrs.fit || attrs.fit_or_build || 'Tailored Fit';
  const defaultFallbackImage = "/fallback-product.svg";

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product.id || product.product_id);
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  return (
    <div className="product-card">
      {/* Product Image Container with 4:5 aspect ratio */}
      <div className="card-image-container" onClick={handleCardClick} style={{ cursor: 'pointer', position: 'relative' }}>
        <img
          src={product.image_url || defaultFallbackImage}
          alt={product.title}
          className="card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultFallbackImage;
          }}
        />

        {/* Top-Right Clickable Wishlist Heart Button */}
        <button
          className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleHeartClick}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Card Content & Details */}
      <div className="card-body">
        <h3 className="card-title" onClick={handleCardClick} style={{ cursor: 'pointer' }}>{product.title}</h3>
        <p className="card-description" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          {product.description ? (product.description.length > 80 ? `${product.description.substring(0, 80)}...` : product.description) : ''}
        </p>

        {/* Tag Pills */}
        <div className="card-tags">
          <span className="tag-pill">{fabricTag}</span>
          <span className="tag-pill">{fitTag}</span>
        </div>

        {/* Footer with Price & Add to Bag button */}
        <div className="card-footer">
          <span className="card-price">₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}</span>
          <button
            className="add-to-cart-btn"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
              if (onAddToCart) onAddToCart(product);
            }}
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
