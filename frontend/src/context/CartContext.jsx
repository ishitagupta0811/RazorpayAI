import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'razorpay_ai_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  });

  const [aiAttributed, setAiAttributed] = useState(false);
  const [aiRecommendationType, setAiRecommendationType] = useState(null);

  // Sync to localStorage on every items state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [items]);

  const markAiRecommendation = (type = 'upsell') => {
    setAiAttributed(true);
    setAiRecommendationType(type);
  };

  const addToCart = (product, isFromAiRecommendation = false, recType = null) => {
    if (!product) return;
    const prodId = product.id || product.product_id;
    if (!prodId) return;

    if (isFromAiRecommendation) {
      setAiAttributed(true);
      if (recType) setAiRecommendationType(recType);
    }

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        item => (item.id || item.product_id) === prodId
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + 1
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: prodId,
            product_id: prodId,
            title: product.title || product.name || "Product",
            price: Number(product.price) || 0,
            quantity: 1,
            image_url: product.image_url || null,
            category: product.category || product.subcategory || "Apparel",
            attributes: product.attributes || {}
          }
        ];
      }
    });
  };

  const removeFromCart = (productId) => {
    setItems(prevItems => prevItems.filter(item => (item.id || item.product_id) !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if ((item.id || item.product_id) === productId) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setItems([]);
    setAiAttributed(false);
    setAiRecommendationType(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Could not remove cart key:", e);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        aiAttributed,
        setAiAttributed,
        aiRecommendationType,
        setAiRecommendationType,
        markAiRecommendation
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
