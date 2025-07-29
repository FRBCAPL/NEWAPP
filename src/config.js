// Use local backend for development, production backend for deployed app
// Use local backend for development, production backend for deployed app
export const BACKEND_URL = import.meta.env.DEV 
  ? "http://localhost:8080" 
  : "https://atlasbackend-bnng.onrender.com"; 