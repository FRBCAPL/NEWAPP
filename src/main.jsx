import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import "./App.css";
import "./styles/global.css";  // Correct relative path to your override CSS
import ResizeObserver from 'resize-observer-polyfill';
window.ResizeObserver = window.ResizeObserver || ResizeObserver;

// Debug environment variables
console.log('Environment variables debug:');
console.log('VITE_GOOGLE_SHEETS_API_KEY:', import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_STREAM_API_KEY:', import.meta.env.VITE_STREAM_API_KEY);
console.log('All env vars:', import.meta.env);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
