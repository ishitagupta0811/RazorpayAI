import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import MerchantApp from './MerchantApp.jsx';

createRoot(document.getElementById('merchant-root')).render(
  <StrictMode>
    <MerchantApp />
  </StrictMode>,
);
