import axios from 'axios';

const merchantApi = axios.create({
  baseURL: 'http://localhost:8001',
});

export const getMerchantAovSummary = async () => {
  const response = await merchantApi.get('/api/analytics/aov-summary');
  return response.data;
};

export const logMerchantAiEvent = async (eventData) => {
  const response = await merchantApi.post('/api/analytics/log-event', eventData);
  return response.data;
};

export const seedMerchantDemoAnalytics = async () => {
  const response = await merchantApi.post('/api/analytics/seed-demo');
  return response.data;
};

export default merchantApi;
