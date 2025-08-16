import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import "./App.css";
import "./styles/global.css";  // Correct relative path to your override CSS
import ResizeObserver from 'resize-observer-polyfill';
window.ResizeObserver = window.ResizeObserver || ResizeObserver;

// Detect if we're running in an iframe and add data attribute
if (typeof window !== 'undefined') {
  const isInIframe = window.self !== window.top;
  if (isInIframe) {
    document.documentElement.setAttribute('data-iframe', 'true');
    document.body.setAttribute('data-iframe', 'true');
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.setAttribute('data-iframe', 'true');
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
