import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import Filters from './components/catalog/Filters';
import ProductGrid from './components/catalog/ProductGrid';
import ChatDrawer from './components/chat/ChatDrawer';
import { getProducts } from './services/api';

export default function App() {
  // Filter States
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3500);
  const [style, setStyle] = useState('');
  const [search, setSearch] = useState('');
  const [gridTitle, setGridTitle] = useState('Product Catalog');

  // Catalog Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch products whenever any filter state changes
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    const params = {};

    if (category && category !== 'all') {
      params.category = category;
    }
    if (maxPrice) {
      params.max_price = maxPrice;
    }
    if (style) {
      params.style = style;
    }
    if (search) {
      params.search = search;
    }

    try {
      const data = await getProducts(params);
      if (Array.isArray(data)) {
        setProducts(data);
      }
      setGridTitle(search ? `Search results for "${search}"` : 'Product Catalog');
    } catch (err) {
      console.error("Error loading filtered catalog products:", err);
    } finally {
      setLoading(false);
    }
  }, [category, maxPrice, style, search]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  // Handle AI Agent recommended products update
  const handleProductsRecommended = (recommendedProducts, queryText) => {
    if (recommendedProducts && recommendedProducts.length > 0) {
      setProducts(recommendedProducts);
      setGridTitle(`AI Recommendations for "${queryText}"`);
    }
  };

  return (
    <div className="app-layout">
      <Header search={search} setSearch={setSearch} />
      <Hero />
      <main className="main-2col-layout">
        {/* Left Sidebar Filters (~250px) */}
        <Filters
          category={category}
          setCategory={setCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          style={style}
          setStyle={setStyle}
        />

        {/* Right Product Grid (Fills remaining space) */}
        <ProductGrid
          products={products}
          loading={loading}
          title={gridTitle}
        />
      </main>

      {/* Floating AI Chat Drawer at root level */}
      <ChatDrawer onProductsRecommended={handleProductsRecommended} />
    </div>
  );
}
