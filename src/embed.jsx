import React from 'react';
import ReactDOM from 'react-dom/client';
import EmbedApp from './EmbedApp.jsx';
import './styles/variables.css';
import './styles/global.css';

// This is a separate entry point for embed functionality
// It completely bypasses the main app's authentication system
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <EmbedApp />
  </React.StrictMode>
);
