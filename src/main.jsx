import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import "./App.css";
import "./styles/chat-theme.css";  // Correct relative path to your override CSS


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
