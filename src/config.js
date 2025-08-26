// Use local backend for development, production backend for deployed app
// Ensure HTTPS for production to avoid mixed content issues on mobile
export const BACKEND_URL = import.meta.env.DEV 
  ? "http://localhost:8080" 
  : "https://atlasbackend-bnng.onrender.com";

// Add a fallback mechanism for mobile connections
export const getBackendUrl = () => {
  if (import.meta.env.DEV) {
    return "http://localhost:8080";
  }
  
  // Ensure HTTPS for production
  return "https://atlasbackend-bnng.onrender.com";
};

import logger from './utils/logger.js';

// Enhanced debugging for mobile issues
logger.debug("BACKEND_URL in use:", BACKEND_URL);
logger.debug("Current origin:", window.location.origin);
logger.debug("User agent:", navigator.userAgent);

// Test backend connectivity immediately
fetch(`${BACKEND_URL}/health`)
  .then(response => {
    logger.backendCheck("✅ Backend health check successful:", response.status);
  })
  .catch(error => {
    logger.error("❌ Backend health check failed:", error);
  }); 