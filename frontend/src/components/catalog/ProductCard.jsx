import React from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const attrs = product.attributes || {};
  const styleBadge = attrs.style || product.subcategory || 'Fashion';
  const fabricTag = attrs.fabric || attrs.material_fabric || 'Quality Fabric';
  const fitTag = attrs.fit || attrs.fit_or_build || 'Tailored Fit';
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="product-card">
      {/* Product Image Container with 4:5 aspect ratio */}
      <div className="card-image-container">
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
        <span className="card-style-badge">{styleBadge}</span>
      </div>

      {/* Card Content & Details */}
      <div className="card-body">
        <h3 className="card-title">{product.title}</h3>
        <p className="card-description">
          {product.description ? (product.description.length > 80 ? `${product.description.substring(0, 80)}...` : product.description) : ''}
        </p>

        {/* Tag Pills */}
        <div className="card-tags">
          <span className="tag-pill">🧵 {fabricTag}</span>
          <span className="tag-pill">✨ {fitTag}</span>
        </div>

        {/* Footer with Price & Add to Cart button */}
        <div className="card-footer">
          <span className="card-price">₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}</span>
          <button
            className="add-to-cart-btn"
            onClick={() => onAddToCart ? onAddToCart(product) : alert(`Added ${product.title} to cart!`)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
