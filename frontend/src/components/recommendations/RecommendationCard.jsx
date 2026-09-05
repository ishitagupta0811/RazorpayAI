import React from 'react';
import { useCart } from '../../context/CartContext';

export default function RecommendationCard({ recommendation, onActionClick, onSelectProduct }) {
  const { addToCart } = useCart();

  if (!recommendation || recommendation.type === 'SILENT' || !recommendation.product) {
    return null;
  }

  const { product, explanation, quick_actions } = recommendation;
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  // Filter out any "View Product" button as requested
  const filteredActions = (quick_actions || []).filter(act => act.id !== 'view_product' && act.label !== 'View Product');

  const handleCardBodyClick = () => {
    const targetId = product.product_id || product.id;
    if (targetId && onSelectProduct) {
      onSelectProduct(targetId);
    }
  };

  const rawHeadline = explanation?.headline || 'Special Recommendation';
  const cleanHeadline = rawHeadline.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  return (
    <div className="proactive-rec-card">
      <div className="rec-card-header">
        <span className="rec-headline">{cleanHeadline}</span>
        {explanation?.delta_price_label && (
          <span className="rec-delta-tag">{explanation.delta_price_label}</span>
        )}
      </div>

      {/* Clickable Card Body -> Opens Detailed View in Center Column */}
      <div
        className="rec-card-body"
        onClick={handleCardBodyClick}
        style={{ cursor: 'pointer' }}
        title="Click to view full detailed product view"
      >
        <img
          src={product.image_url || defaultFallbackImage}
          alt={product.title}
          className="rec-product-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultFallbackImage;
          }}
        />
        <div className="rec-product-info">
          <h4 className="rec-product-title">{product.title}</h4>
          <div className="rec-product-price">
            ₹{typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
          </div>
          <p className="rec-rationale">{explanation?.rationale}</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      {filteredActions.length > 0 && (
        <div className="rec-actions-group">
          {filteredActions.map((act) => (
            <button
              key={act.id}
              className={`rec-action-btn ${act.id.includes('accept') || act.id === 'add_to_outfit' ? 'primary-btn' : 'secondary-btn'}`}
              onClick={() => {
                if (act.id.includes('accept') || act.id === 'add_to_outfit' || act.action_type === 'ADD_TO_CART' || act.action_type === 'SWAP_CART_ITEM') {
                  addToCart(product, true);
                }
                const enrichedAction = {
                  ...act,
                  payload: {
                    ...act.payload,
                    target_id: act.payload?.target_id || product.product_id || product.id
                  }
                };
                if (onActionClick) onActionClick(enrichedAction);
              }}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
