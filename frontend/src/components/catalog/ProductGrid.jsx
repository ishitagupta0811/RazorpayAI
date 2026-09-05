import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getProducts } from '../../services/api';

export default function ProductGrid({
  products: propsProducts,
  loading: propsLoading,
  title = "Product Catalog",
  wishlistItems = [],
  onAddToCart,
  onAddToWishlist,
  onSelectProduct
}) {
  const [internalProducts, setInternalProducts] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);

  const isControlled = propsProducts !== undefined;
  const products = isControlled ? propsProducts : internalProducts;
  const loading = isControlled ? propsLoading : internalLoading;

  useEffect(() => {
    if (!isControlled) {
      async function loadCatalog() {
        setInternalLoading(true);
        try {
          const data = await getProducts();
          if (Array.isArray(data)) {
            setInternalProducts(data);
          }
        } catch (err) {
          console.error("Failed to load catalog products:", err);
        } finally {
          setInternalLoading(false);
        }
      }
      loadCatalog();
    }
  }, [isControlled]);

  if (loading) {
    return (
      <div className="grid-loading-container">
        <p className="loading-text">Loading products...</p>
      </div>
    );
  }

  return (
    <section className="catalog-section">
      {/* Grid Header */}
      <div className="grid-header">
        <h2 className="grid-title">{title}</h2>
        <span className="grid-count">
          Showing {products.length} item{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!products || products.length === 0 ? (
        <div className="grid-empty-box">
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h3 style={{ marginTop: '0.5rem' }}>No products match your criteria</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Try adjusting your search or budget slider.</p>
        </div>
      ) : (
        <div className="product-grid-3col">
          {products.map((product) => {
            const prodId = product.id || product.product_id;
            const isWishlisted = wishlistItems.some(
              item => (item.id || item.product_id) === prodId
            );

            return (
              <ProductCard
                key={prodId}
                product={product}
                onAddToCart={onAddToCart}
                onAddToWishlist={onAddToWishlist}
                isWishlisted={isWishlisted}
                onSelectProduct={onSelectProduct}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
