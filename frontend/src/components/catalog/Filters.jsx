import React, { useState, useEffect } from 'react';
import { getStyles } from '../../services/api';

export default function Filters({
  category,
  setCategory,
  maxPrice,
  setMaxPrice,
  style,
  setStyle
}) {
  const [stylesList, setStylesList] = useState([]);

  useEffect(() => {
    async function loadStyles() {
      try {
        const stylesData = await getStyles();
        if (Array.isArray(stylesData)) {
          setStylesList(stylesData);
        }
      } catch (err) {
        console.error("Failed to load styles list:", err);
      }
    }
    loadStyles();
  }, []);

  const categories = [
    { label: "All Items", value: "all" },
    { label: "Apparel", value: "cat_apparel" },
    { label: "Footwear", value: "cat_footwear" },
    { label: "Accessories", value: "cat_accessories" }
  ];

  return (
    <aside className="filters-sidebar">
      {/* Section (a): Categories */}
      <div className="filter-card">
        <h3 className="filter-heading">Categories</h3>
        <div className="category-pills-list">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`cat-pill-btn ${category === cat.value ? 'selected-purple' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section (b): Filter by Price */}
      <div className="filter-card">
        <h3 className="filter-heading">Filter by Price</h3>
        <div className="price-slider-box">
          <input
            type="range"
            min="300"
            max="3500"
            step="50"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="price-range-input"
          />
          <div className="price-range-labels">
            <span>₹300</span>
            <span>Max: ₹{maxPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Section (c): Style Dropdown */}
      <div className="filter-card">
        <h3 className="filter-heading">Style</h3>
        <select
          className="style-dropdown-select"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          <option value="">All Styles</option>
          {stylesList.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
