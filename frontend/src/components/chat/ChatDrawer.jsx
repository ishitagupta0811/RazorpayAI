import React, { useState, useRef, useEffect } from 'react';
import { sendChat } from '../../services/api';

export default function ChatDrawer({ onProductsRecommended }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hello! I am your AI Sales Co-Pilot. Looking for style advice, specific fabrics, or recommendations under budget?',
      quickActions: [
        { id: 'formal_600', label: 'Formal shirt under ₹600', query: 'Formal shirt under ₹600' },
        { id: 'build_outfit', label: 'Build outfit under ₹2500', query: 'Build me a complete formal outfit under ₹2500' },
        { id: 'party_wear', label: 'Show Party Wear', query: 'Show evening party wear' }
      ]
    }
  ]);

  const messagesEndRef = useRef(null);
  const defaultFallbackImage = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80";

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
      // Build history for API (excluding products DTOs)
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

        // Optional callback to highlight recommended products in main grid
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <>
      {/* Floating Gradient Button in Bottom-Right Corner */}
      <button
        className="ai-fab-btn"
        title="Open AI Sales Co-Pilot"
        onClick={() => setIsOpen(true)}
      >
        <span className="fab-sparkle-icon">✨</span>
        <span className="fab-label-text">Ask AI Co-Pilot</span>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`drawer-backdrop-overlay ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-In Drawer from Right (~400px wide, full height) */}
      <aside className={`chat-slide-drawer ${isOpen ? 'active' : ''}`}>
        {/* Drawer Header */}
        <div className="chat-drawer-header">
          <div className="chat-header-title-group">
            <div className="ai-copilot-avatar">✨</div>
            <div>
              <h3 className="chat-header-heading">AI Sales Co-Pilot</h3>
              <span className="chat-online-status">
                <span className="online-green-dot" /> Active & Ready
              </span>
            </div>
          </div>
          <button className="chat-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
        </div>

        {/* Scrollable Message History Area */}
        <div className="chat-message-stream">
          {messages.map((msg, index) => (
            <div key={index} className="message-wrapper">
              <div className={`chat-bubble-box ${msg.role === 'user' ? 'user-chat-bubble' : 'ai-chat-bubble'}`}>
                <p>{msg.text}</p>

                {/* Inline Small Horizontal Product Cards for AI Messages */}
                {msg.products && msg.products.length > 0 && (
                  <div className="inline-mini-products-list">
                    {msg.products.slice(0, 4).map((prod) => (
                      <div key={prod.id || prod.product_id} className="mini-card-horizontal">
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
                      </div>
                    ))}
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
              <span className="thinking-typing-indicator">AI Co-Pilot is thinking... ✨</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Text Input & Send Button */}
        <form className="chat-bottom-input-form" onSubmit={handleFormSubmit}>
          <input
            type="text"
            className="chat-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI (e.g. 'Formal shirt under ₹600')..."
            autoComplete="off"
          />
          <button type="submit" className="chat-send-submit-btn" disabled={loading}>
            <span>Send</span>
            <span className="send-arrow-icon">➔</span>
          </button>
        </form>
      </aside>
    </>
  );
}
