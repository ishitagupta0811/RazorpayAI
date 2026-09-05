import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/layout/Header';
import Hero from './components/layout/Hero';
import Filters from './components/catalog/Filters';
import ProductGrid from './components/catalog/ProductGrid';
import ProductDetailView from './components/catalog/ProductDetailView';
import ChatDrawer from './components/chat/ChatDrawer';
import BuyerProfileModal from './components/profile/BuyerProfileModal';
import CartOutfitDrawer from './components/cart/CartOutfitDrawer';
import WishlistModal from './components/wishlist/WishlistModal';
import OrderSuccessModal from './components/checkout/OrderSuccessModal';
import MerchantDashboardModal from './components/merchant/MerchantDashboardModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import Toast from './components/common/Toast';
import { getProducts, sendProactiveTrigger } from './services/api';
import { useCart } from './context/CartContext';

function App() {
  const { markAiRecommendation } = useCart();
  // Filter States
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3500);
  const [search, setSearch] = useState('');
  const [gridTitle, setGridTitle] = useState('Product Catalog');

  // Sidebar Collapsed State (Spotify-style Icon Rail)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Cart, Wishlist Modal, Merchant Dashboard & Order Success Modal States
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isMerchantDashboardOpen, setIsMerchantDashboardOpen] = useState(false);
  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);

  // In-Place Product Detailed View State (Rendered in Center Column)
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Buyer Profile State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('wallet');
  const [buyerProfile] = useState({
    name: "Ishita Gupta",
    email: "ishitagupta0811@gmail.com",
    avatar: "👤",
    walletBalance: 1250,
    walletTransactions: [
      { id: "tx_101", description: "Referral Bonus Credit", amount: 500, date: "2026-08-28", type: "credit" },
      { id: "tx_102", description: "Order #RZP-9912 Cash Cashback", amount: 250, date: "2026-08-15", type: "credit" },
      { id: "tx_103", description: "Purchased Cotton Shirt", amount: 500, date: "2026-08-10", type: "debit" }
    ],
    orders: [
      {
        orderId: "RZP-9912",
        date: "15 Aug 2026",
        status: "Delivered",
        totalAmount: 549,
        paymentMethod: "Razorpay UPI",
        items: [{ title: "Classic White Formal Shirt", quantity: 1, price: 549 }]
      },
      {
        orderId: "RZP-9945",
        date: "28 Aug 2026",
        status: "In Transit",
        totalAmount: 899,
        paymentMethod: "Wallet Credits",
        items: [{ title: "Formal Straight-Fit Trousers", quantity: 1, price: 899 }]
      }
    ],
    addresses: [
      { id: "addr_1", label: "Home", fullAddress: "Flat 402, Skyline Towers, Indiranagar, Bengaluru - 560038", phone: "+91 98765 43210", isDefault: true },
      { id: "addr_2", label: "Office", fullAddress: "3rd Floor, Tech Park Campus, Outer Ring Rd, Bengaluru - 560103", phone: "+91 98765 43210", isDefault: false }
    ]
  });

  // Shopping Cart & Wishlist State
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: "prod_221",
      product_id: "prod_221",
      title: "Formal Straight-Fit Trousers",
      price: 899,
      image_url: "https://images.pexels.com/photos/32279880/pexels-photo-32279880.jpeg",
      category: "Apparel"
    }
  ]);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));

  // Catalog Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reference to AI Side Panel
  const chatRef = useRef(null);

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
    if (search) {
      params.search = search;
    }

    try {
      const data = await getProducts(params);
      if (Array.isArray(data)) {
        setProducts(data);
        // Sync wishlist items image_url with catalog data from products.csv
        setWishlistItems(prev => prev.map(wItem => {
          const match = data.find(p => (p.id || p.product_id) === (wItem.id || wItem.product_id));
          return match ? { ...wItem, image_url: match.image_url || wItem.image_url } : wItem;
        }));
      }
      setGridTitle(search ? `Search results for "${search}"` : 'Product Catalog');
    } catch (err) {
      console.error("Error loading filtered catalog products:", err);
    } finally {
      setLoading(false);
    }
  }, [category, maxPrice, search]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const handleOpenProfileModal = (tabName = 'wallet') => {
    if (tabName === 'cart') {
      setIsCartDrawerOpen(true);
      return;
    }
    setActiveProfileTab(tabName);
    setIsProfileModalOpen(true);
  };

  // Handle Product Selection (Opens detailed view in Center Column!)
  const handleSelectProduct = (productId) => {
    if (productId) {
      setSelectedProductId(productId);
    }
  };

  // Handle Add to Cart & Proactive Sales Agent Event Dispatch
  const handleAddToCart = async (product) => {
    const prodId = product.id || product.product_id;
    const updatedCart = [...cartItems, { product_id: prodId, title: product.title, price: product.price }];
    setCartItems(updatedCart);

    // Wake up Proactive Sales Agent and trigger recommendations!
    try {
      const proactiveRes = await sendProactiveTrigger("add_to_bag", prodId, updatedCart, wishlistItems, sessionId);
      
      if (proactiveRes && proactiveRes.type !== "SILENT" && proactiveRes.product) {
        // Append recommendation to permanent AI side panel
        if (chatRef.current) {
          chatRef.current.addProactiveRecommendation(proactiveRes);
        }
      }
    } catch (err) {
      console.warn("Proactive trigger event notice:", err);
    }
  };

  // Handle Add to Wishlist & Proactive Sales Agent Event Dispatch
  const handleAddToWishlist = async (product) => {
    const prodId = product.id || product.product_id;
    const catalogMatch = products.find(p => (p.id || p.product_id) === prodId) || product;

    const isAlreadyWishlisted = wishlistItems.some(
      item => (item.id || item.product_id) === prodId
    );

    let updatedWishlist;
    if (isAlreadyWishlisted) {
      updatedWishlist = wishlistItems.filter(
        item => (item.id || item.product_id) !== prodId
      );
    } else {
      updatedWishlist = [...wishlistItems, {
        id: prodId,
        product_id: prodId,
        title: catalogMatch.title || product.title,
        price: catalogMatch.price || product.price,
        image_url: catalogMatch.image_url || product.image_url,
        category: catalogMatch.category || product.category || catalogMatch.subcategory || "Apparel",
        description: catalogMatch.description || product.description
      }];
    }

    setWishlistItems(updatedWishlist);

    if (!isAlreadyWishlisted) {
      // Wake up Proactive Sales Agent for Wishlist event!
      try {
        const proactiveRes = await sendProactiveTrigger("wishlist_add", prodId, cartItems, updatedWishlist, sessionId);
        
        if (proactiveRes && proactiveRes.type !== "SILENT" && proactiveRes.product) {
          if (chatRef.current) {
            chatRef.current.addProactiveRecommendation(proactiveRes);
          }
        }
      } catch (err) {
        console.warn("Proactive wishlist trigger event notice:", err);
      }
    }
  };

  const handleRemoveFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => (item.id || item.product_id) !== productId));
  };

  const handleMoveWishlistToBag = (product) => {
    const prodId = product.id || product.product_id;
    setWishlistItems(prev => prev.filter(item => (item.id || item.product_id) !== prodId));
  };

  // Handle Proactive Recommendation Actions with Iterative Sales Funnel Loop
  const handleProactiveAction = async (action) => {
    if (!action) return;
    const { id, action_type, payload } = action;

    let targetIdForNextTrigger = null;
    let nextEventType = "add_to_bag";
    let updatedCart = [...cartItems];

    if (action_type === 'SWAP_CART_ITEM' || id === 'accept_upsell_replace') {
      // Option 1: Yes, upgrade & replace earlier item in cart
      markAiRecommendation('upsell');
      const removeId = payload?.remove_id;
      const addId = payload?.add_id;
      const filtered = cartItems.filter(item => item.product_id !== removeId && item.id !== removeId);
      const targetProd = products.find(p => p.id === addId) || { product_id: addId, title: "Upgraded Product", price: 1199 };
      updatedCart = [...filtered, { product_id: addId, title: targetProd.title, price: targetProd.price }];
      setCartItems(updatedCart);
      
      targetIdForNextTrigger = addId;
      nextEventType = "upgrade_accepted";
    } else if (action_type === 'UPGRADE_AND_WISHLIST_PREV' || id === 'accept_upsell_wishlist_prev') {
      // Option 2: Upgrade & move earlier item into Wishlist
      markAiRecommendation('upsell');
      const removeId = payload?.remove_id;
      const addId = payload?.add_id;
      
      const prevItem = cartItems.find(item => item.product_id === removeId || item.id === removeId);
      if (prevItem) {
        setWishlistItems(wish => [...wish, prevItem]);
      }
      const filtered = cartItems.filter(item => item.product_id !== removeId && item.id !== removeId);
      const targetProd = products.find(p => p.id === addId) || { product_id: addId, title: "Upgraded Product", price: 1199 };
      updatedCart = [...filtered, { product_id: addId, title: targetProd.title, price: targetProd.price }];
      setCartItems(updatedCart);

      targetIdForNextTrigger = addId;
      nextEventType = "upgrade_accepted";
    } else if (id === 'reject_cross_sell' || action_type === 'STOP_PROACTIVE') {
      // User clicked "Don't add" on Cross-Sell -> Stop Proactive Agent completely!
      const targetId = payload?.target_id || cartItems[cartItems.length - 1]?.product_id || cartItems[cartItems.length - 1]?.id;
      targetIdForNextTrigger = targetId;
      nextEventType = "cross_sell_rejected";
    } else if (id === 'reject_upsell' || action_type === 'DISMISS') {
      // User rejected upsell -> Switch immediately to Cross-Selling / Complete the Look!
      const targetId = payload?.target_id || cartItems[cartItems.length - 1]?.product_id || cartItems[cartItems.length - 1]?.id;
      targetIdForNextTrigger = targetId;
      nextEventType = "upsell_rejected";
    } else if (action_type === 'ADD_TO_CART' || id === 'add_to_outfit') {
      markAiRecommendation('cross_sell');
      const prodId = payload?.product_id;
      const targetProd = products.find(p => p.id === prodId) || { product_id: prodId, title: "Outfit Item", price: 899 };
      updatedCart = [...cartItems, { product_id: prodId, title: targetProd.title, price: targetProd.price }];
      setCartItems(updatedCart);

      targetIdForNextTrigger = prodId;
      nextEventType = "add_to_bag";
    } else if (action_type === 'WISHLIST_RECOVERY' || action_type === 'ADD_WISHLIST_ITEM' || id === 'accept_wishlist') {
      markAiRecommendation('wishlist_recovery');
      const prodId = payload?.product_id;
      const targetProd = products.find(p => p.id === prodId) || { product_id: prodId, title: "Wishlist Item", price: 899 };
      updatedCart = [...cartItems, { product_id: prodId, title: targetProd.title, price: targetProd.price }];
      setCartItems(updatedCart);

      targetIdForNextTrigger = prodId;
      nextEventType = "add_to_bag";
    }

    // Wake up Proactive Agent immediately for the next step in the loop!
    if (targetIdForNextTrigger) {
      try {
        const proactiveRes = await sendProactiveTrigger(nextEventType, targetIdForNextTrigger, updatedCart, wishlistItems, sessionId);
        if (proactiveRes && proactiveRes.type !== "SILENT" && proactiveRes.product) {
          if (chatRef.current) {
            chatRef.current.addProactiveRecommendation(proactiveRes);
          }
        }
      } catch (err) {
        console.warn("Iterative proactive trigger error:", err);
      }
    }
  };

  // Handle AI Agent recommended products update
  const handleProductsRecommended = (recommendedProducts, queryText) => {
    if (recommendedProducts && recommendedProducts.length > 0) {
      setProducts(recommendedProducts);
      setGridTitle(`AI Recommendations for "${queryText}"`);
      setSelectedProductId(null); // Return to grid when search query is performed
    }
  };

  return (
    <div className="app-layout">
      <Header
        search={search}
        setSearch={setSearch}
        wishlistCount={wishlistItems.length}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
        onOpenWishlist={() => setIsWishlistModalOpen(true)}
        onOpenMerchantDashboard={() => setIsMerchantDashboardOpen(true)}
      />
      <Hero />

      {/* Permanent 3-Column Main Layout */}
      <main className={`main-3col-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Left Column: Collapsible Filters Sidebar + Profile Bar Trigger */}
        <Filters
          category={category}
          setCategory={(cat) => {
            setCategory(cat);
            setSelectedProductId(null); // Return to grid view when category changes
          }}
          maxPrice={maxPrice}
          setMaxPrice={(price) => {
            setMaxPrice(price);
            setSelectedProductId(null);
          }}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          buyerProfile={buyerProfile}
          cartCount={cartItems.length}
          onOpenProfileModal={handleOpenProfileModal}
          onOpenMerchantDashboard={() => setIsMerchantDashboardOpen(true)}
        />

        {/* Center Column: Swappable between Product Grid & In-Place Product Detailed View */}
        {selectedProductId ? (
          <ProductDetailView
            productId={selectedProductId}
            onBack={() => setSelectedProductId(null)}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onSelectProduct={handleSelectProduct}
          />
        ) : (
          <ProductGrid
            products={products}
            loading={loading}
            title={gridTitle}
            wishlistItems={wishlistItems}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* Right Column (~330px wide): Permanent AI Sales Co-Pilot Side Panel */}
        <ChatDrawer
          ref={chatRef}
          onProductsRecommended={handleProductsRecommended}
          onProactiveAction={handleProactiveAction}
          onSelectProduct={handleSelectProduct}
        />
      </main>

      {/* Buyer Profile Modal (Orders, Cart, Addresses, Wallet Balance) */}
      <BuyerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        buyerProfile={buyerProfile}
        cartItems={cartItems}
        initialTab={activeProfileTab}
      />

      {/* Full-Screen Shopping Bag Modal View */}
      <CartOutfitDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onOrderSuccess={(details) => setOrderSuccessDetails(details)}
        onAddToWishlist={handleAddToWishlist}
      />

      {/* Full-Screen Wishlist Modal View */}
      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        wishlistItems={wishlistItems}
        products={products}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onMoveToBag={handleMoveWishlistToBag}
        onSelectProduct={handleSelectProduct}
      />

      {/* Merchant Analytics & AOV Attribution Dashboard Modal */}
      <MerchantDashboardModal
        isOpen={isMerchantDashboardOpen}
        onClose={() => setIsMerchantDashboardOpen(false)}
      />

      {/* Order Success Confirmation Receipt Modal */}
      <OrderSuccessModal
        orderDetails={orderSuccessDetails}
        onClose={() => setOrderSuccessDetails(null)}
      />

      <Toast message={null} />
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
