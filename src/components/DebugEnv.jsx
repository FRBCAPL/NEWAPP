import React from 'react';

const DebugEnv = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Environment Debug:</h4>
      <div>VITE_SUPER_ADMIN_PIN: "{import.meta.env.VITE_SUPER_ADMIN_PIN}"</div>
      <div>VITE_SUPER_ADMIN_PIN (with fallback): "{import.meta.env.VITE_SUPER_ADMIN_PIN || '777777'}"</div>
      <div>VITE_BACKEND_URL: "{import.meta.env.VITE_BACKEND_URL}"</div>
      <div>VITE_ENABLE_DEBUG_MODE: "{import.meta.env.VITE_ENABLE_DEBUG_MODE}"</div>
      <div>VITE_ENABLE_CONSOLE_LOGGING: "{import.meta.env.VITE_ENABLE_CONSOLE_LOGGING}"</div>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>Dev: {import.meta.env.DEV ? 'true' : 'false'}</div>
      <div>Prod: {import.meta.env.PROD ? 'true' : 'false'}</div>
      <div>All env vars: {JSON.stringify(import.meta.env)}</div>
    </div>
  );
};

export default DebugEnv;
