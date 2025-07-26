# SIMPLE PoolBalls.jsx - Copy This Exactly

```jsx
import React from 'react';

const BALL_COLORS = {
  1: { background: '#FFD700', number: '1', textColor: '#000' },
  2: { background: '#0066CC', number: '2', textColor: '#FFF' },
  3: { background: '#FF0000', number: '3', textColor: '#FFF' },
  4: { background: '#800080', number: '4', textColor: '#FFF' },
  5: { background: '#FF8C00', number: '5', textColor: '#FFF' },
  6: { background: '#228B22', number: '6', textColor: '#FFF' },
  7: { background: '#8B0000', number: '7', textColor: '#FFF' }
};

export function CSSPoolBall({ number, size = 14 }) {
  const ballConfig = BALL_COLORS[number];
  
  if (!ballConfig) {
    return null;
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, #ffffff40, ${ballConfig.background})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.3)',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        fontSize: `${size * 0.6}px`,
        fontWeight: 'bold',
        color: ballConfig.textColor,
        textShadow: ballConfig.textColor === '#FFF' ? '1px 1px 1px rgba(0,0,0,0.7)' : '1px 1px 1px rgba(255,255,255,0.7)',
        fontFamily: 'Arial, sans-serif',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {ballConfig.number}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: '30%',
          height: '20%',
          background: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          filter: 'blur(1px)'
        }}
      />
    </div>
  );
}

export function PoolBallRenderer({ number, size = 14, svgSrc, alt }) {
  if (number >= 1 && number <= 7) {
    return <CSSPoolBall number={number} size={size} />;
  }
  
  return (
    <img
      src={svgSrc}
      alt={alt}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block'
      }}
    />
  );
}
```