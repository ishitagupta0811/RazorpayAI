import React, { useState, useEffect } from 'react';
import { getProductDetail } from '../../services/api';
import { useCart } from '../../context/CartContext';

export default function ProductDetailView({ productId, onBack, onAddToCart, onAddToWishlist, onSelectProduct }) {
  const { addToCart } = useCart();
  const [productDetail, setProductDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [pincode, setPincode] = useState('560038');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  useEffect(() => {
    if (!productId) return;

    async function loadDetail() {
      setLoading(true);
      setActiveImgIndex(0);
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
  }, [productId]);

  if (loading) {
    return (
      <section className="catalog-section detail-view-container">
        <button className="back-to-catalog-btn" onClick={onBack}>
          ← Back to Catalog
        </button>
        <div className="grid-loading-container" style={{ marginTop: '1.5rem' }}>
          <p className="loading-text">Loading product details...</p>
        </div>
      </section>
    );
  }

  const prod = productDetail?.product || productDetail || {};
  const attrs = prod.attributes || {};
  const upsells = productDetail?.upsells || [];
  const crossSells = productDetail?.cross_sells || [];

  // Keep the exact same high-res picture in all 3 thumbnails as requested
  const mainImage = prod.image_url || defaultFallbackImage;
  const galleryImages = [mainImage, mainImage, mainImage];

  const currentDisplayedImage = galleryImages[activeImgIndex] || mainImage;

  const mrpPrice = Math.round((prod.price || 549) * 2.2);
  const discountPercent = Math.round(((mrpPrice - (prod.price || 549)) / mrpPrice) * 100);

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Exact 2 Customer Reviews
  const reviewsList = [
    {
      id: 1,
      name: "Aarav Sharma",
      rating: 5,
      date: "28 Aug 2026",
      verified: true,
      headline: "Superb Fabric Quality & Perfect Fit!",
      comment: "The fabric feels extremely soft and premium. Stitches are neat and structured. Fits true to size and looks great for office wear!",
      helpful: 42
    },
    {
      id: 2,
      name: "Meera Nair",
      rating: 4,
      date: "22 Aug 2026",
      verified: true,
      headline: "Great Look & Color Finish",
      comment: "Exactly as shown in the picture. Loved the sheen on the fabric and how comfortable it is for all-day wear.",
      helpful: 29
    }
  ];

  const handleWishlistClick = () => {
    const nextWishState = !isWishlisted;
    setIsWishlisted(nextWishState);
    if (nextWishState && onAddToWishlist) {
      onAddToWishlist(prod);
    }
  };

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="catalog-section detail-view-container">
      {/* Top Navigation */}
      <div className="detail-view-header">
        <button className="back-to-catalog-btn" onClick={onBack}>
          ← Back to Product Catalog
        </button>
      </div>

      {/* Main Product Detail Layout */}
      <div className="myntra-detail-panel">
        {/* Left Column: Main High-Res Image + Exactly 3 Small Thumbnails below */}
        <div className="product-gallery-container">
          <div className="single-image-container">
            <button className="gallery-nav-arrow prev-arrow" onClick={handlePrevImage} title="Previous image">
              ‹
            </button>
            <img
              src={currentDisplayedImage}
              alt={prod.title}
              className="single-main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultFallbackImage;
              }}
            />
            <button className="gallery-nav-arrow next-arrow" onClick={handleNextImage} title="Next image">
              ›
            </button>
            {attrs.style && <span className="detail-style-badge">{attrs.style}</span>}
          </div>

          {/* 3 Small Thumbnail Pictures below Main Picture (All displaying the same picture) */}
          <div className="product-thumbnails-row">
            {galleryImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className={`thumbnail-box ${activeImgIndex === idx ? 'active-thumbnail' : ''}`}
                onClick={() => setActiveImgIndex(idx)}
              >
                <img
                  src={imgUrl}
                  alt={`${prod.title} view ${idx + 1}`}
                  className="thumbnail-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultFallbackImage;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Specifications & Purchasing Panel */}
        <div className="product-spec-panel">
          <div className="brand-subtitle">RazorpayAI Premium</div>
          <h1 className="product-main-title">{prod.title}</h1>

          {/* Rating & Reviews Summary Badge */}
          <div className="rating-summary-badge">
            <span className="rating-score">4.4 ★</span>
            <span className="rating-divider">|</span>
            <span className="rating-count">348 Ratings & Reviews</span>
          </div>

          {/* Price & MRP Discount Row */}
          <div className="price-tag-row">
            <span className="current-selling-price">₹{typeof prod.price === 'number' ? prod.price.toLocaleString('en-IN') : prod.price}</span>
            <span className="original-mrp-price">MRP ₹{mrpPrice.toLocaleString('en-IN')}</span>
            <span className="discount-tag">({discountPercent}% OFF)</span>
          </div>
          <div className="tax-inclusive-text">inclusive of all taxes</div>

          {/* Size Selector */}
          <div className="spec-section">
            <div className="size-header-row">
              <span className="spec-section-title">SELECT SIZE</span>
              <button className="size-chart-btn" onClick={() => alert("Size Chart: S (38), M (40), L (42), XL (44), XXL (46)")}>
                SIZE CHART
              </button>
            </div>
            <div className="size-pills-row">
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  className={`size-pill-btn ${selectedSize === sz ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="primary-actions-row">
            <button
              className="add-to-bag-primary-btn"
              onClick={() => {
                addToCart(prod);
                if (onAddToCart) onAddToCart(prod);
              }}
            >
              ADD TO BAG
            </button>
            <button
              className={`wishlist-secondary-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleWishlistClick}
            >
              {isWishlisted ? 'WISHLISTED' : 'WISHLIST'}
            </button>
          </div>

          {/* Delivery Pincode Checker */}
          <div className="delivery-checker-card">
            <div className="delivery-header">
              <span>DELIVERY OPTIONS</span>
            </div>
            <div className="pincode-input-box">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="pincode-input"
              />
              {pincodeChecked && <span className="green-check-icon">✔</span>}
              <button className="change-pincode-btn" onClick={() => setPincodeChecked(true)}>
                {pincodeChecked ? 'CHANGE' : 'CHECK'}
              </button>
            </div>
            <div className="delivery-estimate-text">
              Express Delivery by <strong>Fri, Sep 11</strong>
            </div>
          </div>

          {/* Fabric & Product Specifications List */}
          <div className="spec-section">
            <div className="spec-section-title">PRODUCT DETAILS & FABRIC</div>
            <p className="detail-desc-text">{prod.description}</p>
            <div className="key-specs-grid">
              <div className="key-spec-item">
                <span className="key-label">Fabric</span>
                <span className="key-val">{attrs.fabric || 'Premium Cotton Blend'}</span>
              </div>
              <div className="key-spec-item">
                <span className="key-label">Fit</span>
                <span className="key-val">{attrs.fit || 'Structured Fit'}</span>
              </div>
              <div className="key-spec-item">
                <span className="key-label">Occasion</span>
                <span className="key-val">{attrs.occasion || 'Formal / Smart Casual'}</span>
              </div>
              <div className="key-spec-item">
                <span className="key-label">Pattern</span>
                <span className="key-val">{attrs.style || 'Solid / Textured'}</span>
              </div>
            </div>
          </div>

          {/* AI Upgrades & Complete Outfit Recommendations */}
          {(upsells.length > 0 || crossSells.length > 0) && (
            <div className="spec-section ai-combos-section">
              <div className="spec-section-title">PAIR IT WITH (AI OUTFIT RECOMMENDED)</div>
              <div className="combo-items-list">
                {[...upsells, ...crossSells].slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="combo-item-card"
                    onClick={() => onSelectProduct && onSelectProduct(item.id)}
                  >
                    <img src={item.image_url || defaultFallbackImage} alt={item.title} className="combo-img" />
                    <div className="combo-info">
                      <div className="combo-title">{item.title}</div>
                      <div className="combo-price">₹{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section (Exactly 2 Reviews) */}
      <div className="customer-reviews-section">
        <h2 className="reviews-section-heading">Customer Ratings & Reviews (2)</h2>

        {/* Rating Breakdown Bar */}
        <div className="ratings-breakdown-card">
          <div className="rating-big-score">
            <span className="big-num">4.5</span>
            <span className="big-star">★</span>
            <div className="total-ratings-text">2 Verified Reviews</div>
          </div>
          <div className="rating-bars-group">
            <div className="rating-bar-row">
              <span>5 ★</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '50%' }} /></div>
              <span>1</span>
            </div>
            <div className="rating-bar-row">
              <span>4 ★</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: '50%' }} /></div>
              <span>1</span>
            </div>
          </div>
        </div>

        {/* Customer Reviews List */}
        <div className="reviews-scroll-list">
          {reviewsList.map((rev) => (
            <div key={rev.id} className="review-card-item">
              <div className="review-card-top">
                <div className="review-rating-tag">{rev.rating} ★</div>
                <div className="review-headline">{rev.headline}</div>
              </div>
              <p className="review-comment-body">{rev.comment}</p>
              <div className="review-meta-row">
                <span className="reviewer-name">{rev.name}</span>
                {rev.verified && <span className="verified-badge">✔ Verified Buyer</span>}
                <span className="review-date">• {rev.date}</span>
                <span className="helpful-count">👍 {rev.helpful} found helpful</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
