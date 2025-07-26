import React from 'react';
import Elite10Ball from './Elite10Ball';

export default function Elite10BallDemo() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      padding: '20px'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#e53e3e',
        marginBottom: '30px',
        fontSize: '2.5rem',
        textShadow: '0 0 20px rgba(229, 62, 62, 0.5)'
      }}>
        Elite 10 Ball - Path Visualization
      </h1>
      
      <Elite10Ball showPaths={true} showAngles={true} />
      
      <div style={{
        maxWidth: '600px',
        margin: '40px auto 0',
        padding: '20px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '15px' }}>How to Play:</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Move your mouse over the table to aim</li>
          <li>Click on any ball to select it</li>
          <li>The yellow dashed line shows your aim direction</li>
          <li>The green line shows the predicted ball path</li>
          <li>Adjust the power slider to control shot strength</li>
          <li>Click "Shoot!" or click on the table to take your shot</li>
          <li>Toggle "Path Guides" to show/hide the trajectory lines</li>
        </ul>
      </div>
    </div>
  );
}