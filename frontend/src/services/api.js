import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const getProducts = async (params = {}) => {
  const response = await api.get('/api/catalog/products', { params });
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

export default api;
