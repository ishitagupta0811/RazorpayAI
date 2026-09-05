import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { createCheckoutOrder, verifyCheckoutPayment } from '../../services/api';

export default function CartOutfitDrawer({ isOpen, onClose, onOrderSuccess, onAddToWishlist }) {
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart, aiAttributed, aiRecommendationType } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  if (!isOpen) return null;

  // Evaluate Outfit Completion Tracker Slots
  const hasTopwear = items.some(item => {
    const cat = (item.category || item.subcategory || item.title || "").toLowerCase();
    return cat.includes("shirt") || cat.includes("top") || cat.includes("apparel") || cat.includes("t-shirt");
  });

  const hasBottomwear = items.some(item => {
    const cat = (item.category || item.subcategory || item.title || "").toLowerCase();
    return cat.includes("trouser") || cat.includes("pant") || cat.includes("bottom") || cat.includes("jeans");
  });

  const hasFootwearOrAccessory = items.some(item => {
    const cat = (item.category || item.subcategory || item.title || "").toLowerCase();
    return cat.includes("shoe") || cat.includes("footwear") || cat.includes("accessory") || cat.includes("belt") || cat.includes("watch");
  });

  const completedSlotsCount = [hasTopwear, hasBottomwear, hasFootwearOrAccessory].filter(Boolean).length;
  const outfitCompletionPercentage = Math.round((completedSlotsCount / 3) * 100);

  // Trigger Razorpay Checkout Order Flow
  const handleProceedToRazorpay = async () => {
    if (items.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      // Step 1: Call backend create-order API
      const checkoutPayload = {
        items: items.map(item => ({
          product_id: item.id || item.product_id,
          title: item.title,
          price: Number(item.price),
          quantity: item.quantity || 1,
          image_url: item.image_url || defaultFallbackImage
        })),
        customer_name: "Ishita Gupta",
        customer_email: "ishitagupta0811@gmail.com",
        ai_attributed: aiAttributed,
        ai_recommendation_type: aiRecommendationType
      };

      const orderData = await createCheckoutOrder(checkoutPayload);

      if (!orderData || !orderData.order_id) {
        throw new Error("Failed to create order on checkout backend server");
      }

      // Step 2: Open Razorpay Test Mode Modal or Fallback Handler
      const options = {
        key: orderData.key_id || "rzp_test_growth_agent_key",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "RazorpayAI Store",
        description: "Complete your outfit order with Razorpay",
        image: "https://razorpay.com/favicon.ico",
        order_id: orderData.order_id,
        prefill: {
          name: "Ishita Gupta",
          email: "ishitagupta0811@gmail.com",
          contact: "+91 98765 43210"
        },
        theme: {
          color: "#0284c7"
        },
        handler: async function (response) {
          try {
            // Step 3: Verify Payment Signature via Backend
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: response.razorpay_signature || "dummy_test_signature"
            };

            const verifyRes = await verifyCheckoutPayment(verifyPayload);

            if (verifyRes && verifyRes.success) {
              clearCart();
              onClose();
              if (onOrderSuccess) {
                onOrderSuccess({
                  order_id: response.razorpay_order_id || orderData.order_id,
                  payment_id: response.razorpay_payment_id || verifyPayload.razorpay_payment_id,
                  amount_inr: orderData.amount_inr || (orderData.amount / 100),
                  items: orderData.items || checkoutPayload.items,
                  ai_attributed: aiAttributed
                });
              }
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setCheckoutError("Payment verification failed. Please try again.");
          } finally {
            setCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
          }
        }
      };

      // Check if Razorpay script is loaded on window
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulate test mode completion directly if script failed to load
        console.warn("Razorpay script not found on window, invoking test-mode fallback callback");
        const mockResponse = {
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 11)}`,
          razorpay_signature: "dummy_test_signature"
        };
        options.handler(mockResponse);
      }
    } catch (err) {
      console.error("Checkout initiation error:", err);
      setCheckoutError(err.message || "Failed to initiate Razorpay checkout");
      setCheckoutLoading(false);
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
            <h2>Your Shopping Bag</h2>
            <span className="cart-count-pill">{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
          </div>
        </div>

        {/* Full Screen Main Container */}
        <div className="cart-fullscreen-wrapper">
          {items.length === 0 ? (
            <div className="cart-empty-box" style={{ padding: '4rem 2rem' }}>
              <span className="empty-icon">🛍️</span>
              <h2 style={{ color: '#0f172a', fontWeight: '800' }}>Your shopping bag is empty</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Explore our catalog or ask RazorAI for personalized style recommendations!
              </p>
              <button className="back-to-catalog-btn" onClick={onClose} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                Explore Product Catalog
              </button>
            </div>
          ) : (
            <div className="cart-fullscreen-grid">
              {/* Left Column: List of Items in Bag */}
              <div className="cart-items-column">
                <div className="column-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Items in Bag ({items.length} {items.length === 1 ? 'Product' : 'Products'})
                  </h3>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                    Total Quantities: {cartCount} units
                  </span>
                </div>

                <div className="cart-items-list">
                  {items.map((item) => {
                    const targetId = item.id || item.product_id;
                    const itemQty = item.quantity || 1;
                    const itemUnitPrice = Number(item.price) || 0;
                    const itemSubtotal = itemUnitPrice * itemQty;

                    return (
                      <div key={targetId} className="cart-item-row-fullscreen" style={{ position: 'relative' }}>
                        {/* Top-Right Small Trash Bin Button */}
                        <button
                          className="top-right-bin-btn"
                          onClick={() => removeFromCart(targetId)}
                          title="Remove item"
                        >
                          🗑️
                        </button>

                        <img
                          src={item.image_url || defaultFallbackImage}
                          alt={item.title}
                          className="cart-item-thumb-large"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultFallbackImage;
                          }}
                        />

                        <div className="cart-item-details-flex">
                          <div className="item-title-section" style={{ paddingRight: '2rem' }}>
                            <h4 className="cart-item-title-lg">{item.title}</h4>
                            <span className="item-category-tag">{item.category || 'Apparel'}</span>
                          </div>

                          <div className="item-price-qty-grid">
                            <div className="price-single-box">
                              <span className="price-label">Price per unit:</span>
                              <span className="unit-price-val">₹{itemUnitPrice.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="qty-control-box-lg">
                              <button
                                className="qty-btn"
                                onClick={() => updateQuantity(targetId, -1)}
                                title="Decrease Quantity"
                              >
                                -
                              </button>
                              <span className="qty-val-lg">{itemQty}</span>
                              <button
                                className="qty-btn"
                                onClick={() => updateQuantity(targetId, 1)}
                                title="Increase Quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Subtotal calculated for this product */}
                            <div className="subtotal-item-box">
                              <span className="subtotal-label">Subtotal:</span>
                              <span className="subtotal-val">₹{itemSubtotal.toLocaleString('en-IN')}</span>
                            </div>

                            <button
                              className="move-to-wishlist-btn"
                              onClick={() => {
                                if (onAddToWishlist) {
                                  onAddToWishlist(item);
                                }
                                removeFromCart(targetId);
                              }}
                            >
                              Move to Wishlist
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Order Summary & Razorpay Checkout */}
              <div className="cart-summary-column">
                {/* Outfit Completion Tracker Card */}
                <div className="outfit-tracker-card" style={{ margin: '0 0 1.25rem 0' }}>
                  <div className="tracker-top-row">
                    <span className="tracker-label">Outfit Completion</span>
                    <span className="tracker-pct">{outfitCompletionPercentage}% Complete</span>
                  </div>
                  
                  <div className="tracker-progress-bar-bg">
                    <div className="tracker-progress-bar-fill" style={{ width: `${outfitCompletionPercentage}%` }} />
                  </div>

                  <div className="tracker-slots-row">
                    <div className={`slot-chip ${hasTopwear ? 'completed' : ''}`}>
                      <span>{hasTopwear ? '✓' : '○'} Topwear</span>
                    </div>
                    <div className={`slot-chip ${hasBottomwear ? 'completed' : ''}`}>
                      <span>{hasBottomwear ? '✓' : '○'} Bottomwear</span>
                    </div>
                    <div className={`slot-chip ${hasFootwearOrAccessory ? 'completed' : ''}`}>
                      <span>{hasFootwearOrAccessory ? '✓' : '○'} Footwear</span>
                    </div>
                  </div>

                  {outfitCompletionPercentage < 100 && (
                    <div className="tracker-ai-hint">
                      <span>💡 Ask RazorAI for matching {hasBottomwear ? 'shoes' : 'trousers'} to complete your outfit!</span>
                    </div>
                  )}
                </div>

                {/* Summary Card Panel */}
                <div className="summary-card-panel">
                  <h3 className="summary-card-title">Order Summary</h3>

                  <div className="summary-details-list">
                    <div className="summary-row">
                      <span className="summary-label">Total Unique Products</span>
                      <span className="summary-val">{items.length} {items.length === 1 ? 'Product' : 'Products'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Quantity Units</span>
                      <span className="summary-val">{cartCount} {cartCount === 1 ? 'Unit' : 'Units'}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Subtotal Price</span>
                      <span className="summary-val">₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-row shipping-row">
                      <span className="summary-label">Express Delivery</span>
                      <span className="free-shipping-tag">FREE</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Taxes & Fees</span>
                      <span className="summary-val" style={{ color: '#16a34a', fontWeight: '700' }}>Inclusive</span>
                    </div>

                    <div className="summary-divider" />

                    <div className="summary-row total-payable-row">
                      <span className="total-label-lg">Total Amount Payable</span>
                      <span className="total-val-lg">₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Error Alert if Checkout Fails */}
                  {checkoutError && (
                    <div className="checkout-error-banner" style={{ margin: '1rem 0 0 0' }}>
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <button
                    className="razorpay-checkout-btn-lg"
                    onClick={handleProceedToRazorpay}
                    disabled={checkoutLoading}
                    style={{
                      background: '#c2e59c',
                      color: '#0f172a',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '1.05rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 6px 20px rgba(194, 229, 156, 0.4)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {checkoutLoading ? (
                      <span>Processing Razorpay Checkout...</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        Proceed with
                        <img src="/razorpay-logo.svg" alt="Razorpay Logo" style={{ height: '24px', objectFit: 'contain' }} />
                      </span>
                    )}
                  </button>

                  <div className="secured-by-razorpay" style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                    🔒 100% Secure Test-Mode Payment by Razorpay
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
