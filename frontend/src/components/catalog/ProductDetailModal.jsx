import React, { useState, useEffect } from 'react';
import { getProductDetail } from '../../services/api';

export default function ProductDetailModal({ productId, isOpen, onClose, onAddToCart }) {
  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  useEffect(() => {
    if (!productId || !isOpen) return;

    async function loadDetail() {
      setLoading(true);
      try {
        const data = await getProductDetail(productId);
        setProductDetail(data);
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [productId, isOpen]);

  if (!isOpen) return null;

  const prod = productDetail?.product || productDetail || {};
  const attrs = prod.attributes || {};
  const upsells = productDetail?.upsells || [];
  const crossSells = productDetail?.cross_sells || [];

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {loading ? (
          <div className="detail-loading-box">
            <span>Loading product details...</span>
          </div>
        ) : (
          <div className="product-detail-grid">
            {/* Left Column: Big Product Image */}
            <div className="detail-image-box">
              <img
                src={prod.image_url || defaultFallbackImage}
                alt={prod.title}
                className="detail-large-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultFallbackImage;
                }}
              />
              {attrs.style && <span className="detail-style-badge">{attrs.style}</span>}
            </div>

            {/* Right Column: Full Specifications & Actions */}
            <div className="detail-info-box">
              <div className="detail-category-tag">{prod.category} • {prod.subcategory}</div>
              <h2 className="detail-title">{prod.title}</h2>
              <div className="detail-price-row">
                <span className="detail-price">₹{typeof prod.price === 'number' ? prod.price.toLocaleString('en-IN') : prod.price}</span>
                <span className="detail-stock-badge">{prod.in_stock !== false ? 'In Stock' : 'Out of Stock'}</span>
              </div>

              <p className="detail-description">{prod.description}</p>

              {/* Attributes Specifications */}
              <div className="detail-attributes-group">
                <h4 className="specs-heading">Specifications & Fabric</h4>
                <div className="specs-grid">
                  {attrs.fabric && <div className="spec-item"><span>Fabric:</span> <strong>{attrs.fabric}</strong></div>}
                  {attrs.fit && <div className="spec-item"><span>Fit:</span> <strong>{attrs.fit}</strong></div>}
                  {attrs.occasion && <div className="spec-item"><span>Occasion:</span> <strong>{attrs.occasion}</strong></div>}
                  {attrs.color && <div className="spec-item"><span>Color:</span> <strong>{attrs.color}</strong></div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="detail-actions-row">
                <button
                  className="detail-add-cart-btn"
                  onClick={() => {
                    onAddToCart(prod);
                    alert(`Added "${prod.title}" to Bag! 🛍️`);
                  }}
                >
                  Add to Bag 🛍️
                </button>
                <button
                  className="detail-buy-now-btn"
                  onClick={() => {
                    onAddToCart(prod);
                    alert(`Proceeding to checkout with "${prod.title}"! ⚡`);
                  }}
                >
                  Buy Now ⚡
                </button>
              </div>

              {/* AI Upsells & Cross-Sells section */}
              {(upsells.length > 0 || crossSells.length > 0) && (
                <div className="detail-ai-recommendations-box">
                  <h4 className="specs-heading">AI Suggested Upgrades & Complete Look</h4>
                  <div className="detail-rec-list">
                    {[...upsells, ...crossSells].slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="detail-mini-rec-card"
                        onClick={() => {
                          // Switch modal to this recommended product
                          setProductDetail(null);
                          getProductDetail(item.id).then(setProductDetail);
                        }}
                      >
                        <img src={item.image_url || defaultFallbackImage} alt={item.title} className="detail-rec-thumb" />
                        <div>
                          <div className="detail-rec-title">{item.title}</div>
                          <div className="detail-rec-price">₹{item.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
