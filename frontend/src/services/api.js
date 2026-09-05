import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const getProducts = async (params = {}) => {
  const response = await api.get('/api/catalog/products', { params });
  return response.data;
};

export const getProductDetail = async (id) => {
  const response = await api.get(`/api/catalog/products/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/api/catalog/categories');
  return response.data;
};

export const getStyles = async () => {
  const response = await api.get('/api/catalog/styles');
  return response.data;
};

export const sendChat = async (message, history = []) => {
  const response = await api.post('/api/agent/chat', {
    message,
    history,
  });
  return response.data;
};

export const sendProactiveTrigger = async (eventType, productId, cartItems = [], wishlistItems = [], sessionId = "sess_default") => {
  const response = await api.post('/api/agent/proactive-trigger', {
    event_type: eventType,
    product_id: productId,
    cart_items: cartItems,
    wishlist_items: wishlistItems,
    session_id: sessionId
  });
  return response.data;
};

export const createCheckoutOrder = async (orderPayload) => {
  const response = await api.post('/api/checkout/create-order', orderPayload);
  return response.data;
};

export const verifyCheckoutPayment = async (verifyPayload) => {
  const response = await api.post('/api/checkout/verify-payment', verifyPayload);
  return response.data;
};

export const getAllOrders = async () => {
  const response = await api.get('/api/orders');
  return response.data;
};

export const getAovSummary = async () => {
  const response = await api.get('/api/analytics/aov-summary');
  return response.data;
};

export const logAiEvent = async (eventData) => {
  const response = await api.post('/api/analytics/log-event', eventData);
  return response.data;
};

export const seedDemoAnalytics = async () => {
  const response = await api.post('/api/analytics/seed-demo');
  return response.data;
};

export default api;
