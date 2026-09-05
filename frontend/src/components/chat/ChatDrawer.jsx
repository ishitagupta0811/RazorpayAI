import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { sendChat } from '../../services/api';
import RecommendationCard from '../recommendations/RecommendationCard';

const ChatDrawer = forwardRef(function ChatDrawer({ onProductsRecommended, onProactiveAction, onSelectProduct }, ref) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your RazorAI. Looking for style advice?'
    }
  ]);

  const chatStreamRef = useRef(null);
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  // Allow parent component (App.jsx) to append proactive recommendations
  useImperativeHandle(ref, () => ({
    addProactiveRecommendation: (proactiveRes) => {
      if (!proactiveRes || proactiveRes.type === "SILENT") return;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: proactiveRes.explanation?.headline || 'Proactive Recommendation',
          recommendation: proactiveRes
        }
      ]);
    }
  }));

  // Auto-scroll AI Co-Pilot panel internally to show new recommendations
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTo({
        top: chatStreamRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || inputText).trim();
    if (!queryText || loading) return;

    setInputText('');

    // Append User Message
    const updatedMessages = [...messages, { role: 'user', text: queryText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Build history for API
      const historyPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.text
      }));

      // Call sendChat API wrapper
      const response = await sendChat(queryText, historyPayload);

      if (response && response.reply) {
        // Append AI Reply Message
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: response.reply,
            products: response.products || [],
            quickActions: response.quick_actions || []
          }
        ]);

        if (onProductsRecommended && response.products && response.products.length > 0) {
          onProductsRecommended(response.products, queryText);
        }
      }
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Apologies, I encountered an issue reaching the reasoning server. Please verify the backend is running at http://localhost:8000!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleProactiveActionClick = (action) => {
    if (action.action_type === 'HIGHLIGHT_PRODUCT_IN_GRID' || action.id === 'view_product') {
      const prodId = action.payload?.product_id;
      if (prodId && onSelectProduct) {
        onSelectProduct(prodId);
        return;
      }
    }
    if (onProactiveAction) {
      onProactiveAction(action);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <aside className="ai-side-panel">
      {/* Panel Header */}
      <div className="chat-drawer-header">
        <div className="chat-header-title-group">
          <div className="ai-copilot-avatar">
            <img 
              src="/chatbot-avatar-hd.png" 
              alt="RazorAI Avatar" 
              className="ai-avatar-header-img"
              onError={(e) => { e.target.onerror = null; e.target.src = '/chatbot-avatar.png'; }}
            />
          </div>
          <div>
            <h3 className="chat-header-heading">RazorAI</h3>
            <span className="chat-online-status">
              <span className="online-green-dot" /> Active & Ready
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Message Stream */}
      <div className="chat-message-stream" ref={chatStreamRef}>
        {messages.map((msg, index) => (
          <div key={index} className="message-wrapper">
            <div className={`chat-bubble-box ${msg.role === 'user' ? 'user-chat-bubble' : 'ai-chat-bubble'}`}>
              {msg.role === 'assistant' && (
                <div className="ai-chat-sender-header" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <img
                    src="/chatbot-avatar-hd.png"
                    alt="RazorAI"
                    style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/chatbot-avatar.png'; }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', letterSpacing: '0.02em' }}>RazorAI</span>
                </div>
              )}
              <p>{msg.text}</p>

              {/* Render Proactive Recommendation Card inside AI Chat */}
              {msg.recommendation && (
                <RecommendationCard
                  recommendation={msg.recommendation}
                  onActionClick={handleProactiveActionClick}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Inline Small Horizontal Product Cards for AI Messages (Clicking opens big detailed view in middle!) */}
              {msg.products && msg.products.length > 0 && (
                <div className="inline-mini-products-list">
                  {msg.products.slice(0, 4).map((prod) => {
                    const targetId = prod.id || prod.product_id;
                    return (
                      <div
                        key={targetId}
                        className="mini-card-horizontal"
                        title="Click to view full detailed product view"
                        onClick={() => onSelectProduct && onSelectProduct(targetId)}
                      >
                        <img
                          src={prod.image_url || defaultFallbackImage}
                          alt={prod.title}
                          className="mini-card-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultFallbackImage;
                          }}
                        />
                        <div className="mini-card-details">
                          <div className="mini-card-title">{prod.title}</div>
                          <div className="mini-card-price">
                            ₹{typeof prod.price === 'number' ? prod.price.toLocaleString('en-IN') : prod.price}
                          </div>
                        </div>
                        <span className="mini-card-arrow">➔</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action Pill Buttons below AI Message */}
            {msg.quickActions && msg.quickActions.length > 0 && (
              <div className="quick-actions-pill-container">
                {msg.quickActions.map((action, actIdx) => (
                  <button
                    key={actIdx}
                    className="quick-action-pill-btn"
                    onClick={() => handleSendMessage(action.query || action.label)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-box ai-chat-bubble">
            <span className="thinking-typing-indicator">RazorAI is thinking...</span>
          </div>
        )}
      </div>

      {/* Bottom Text Input & Send Button */}
      <form className="chat-bottom-input-form" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="chat-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask RazorAI for style advice..."
          autoComplete="off"
        />
        <button type="submit" className="chat-send-submit-btn" disabled={loading}>
          <span>Send</span>
        </button>
      </form>
    </aside>
  );
});

export default ChatDrawer;
