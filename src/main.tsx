import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './shared/styles/globals.css';
import { initializePerformanceOptimizations, measureWebVitals } from './utils/performance-optimizer';
import { initializeBundleOptimizations } from './utils/bundle-optimizer';

// Initialize all optimizations immediately
initializePerformanceOptimizations();
initializeBundleOptimizations();

// Start measuring Web Vitals
measureWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);