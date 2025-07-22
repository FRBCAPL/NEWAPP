import React, { useState } from 'react';

/**
 * 🧪 Error Tester Component - Development Only
 * 
 * This component helps test error boundaries during development.
 * Add it temporarily to any component to test error handling.
 * 
 * Usage:
 * import ErrorTester from './ErrorTester';
 * <ErrorTester />
 */
export default function ErrorTester() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (shouldThrow) {
    throw new Error('🧪 Test Error: This is a simulated error to test error boundaries!');
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: '#ff6b6b',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
        🧪 Dev Tools
      </div>
      <button
        onClick={() => setShouldThrow(true)}
        style={{
          background: '#fff',
          color: '#ff6b6b',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold'
        }}
      >
        Test Error Boundary
      </button>
    </div>
  );
}
