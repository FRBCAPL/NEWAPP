import React from 'react';

export default function AppHeader() {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 2,
      background: 'rgba(20,20,20,0.92)',
      backdropFilter: 'blur(2px)',
      borderBottom: '1.5px solid #333'
    }}>
      <span className="app-header-title">
        Front Range Pool League
      </span>
    </div>
  );
} 