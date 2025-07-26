import React from 'react';

// 🎱 CSS-BASED POOL BALLS
// Creates realistic pool balls using CSS when SVG images aren't available

const BALL_COLORS = {
  1: { background: '#FFD700', number: '1', textColor: '#000' }, // Yellow
  2: { background: '#0066CC', number: '2', textColor: '#FFF' }, // Blue  
  3: { background: '#FF0000', number: '3', textColor: '#FFF' }, // Red
  4: { background: '#800080', number: '4', textColor: '#FFF' }, // Purple
  5: { background: '#FF8C00', number: '5', textColor: '#FFF' }, // Orange
  6: { background: '#228B22', number: '6', textColor: '#FFF' }, // Green
  7: { background: '#8B0000', number: '7', textColor: '#FFF' }, // Maroon
  // Note: 8, 9, 10 will use existing SVG images
};

export function CSSPoolBall({ number, size = 14 }) {
  const ballConfig = BALL_COLORS[number];
  
  if (!ballConfig) {
    return null; // Use SVG for 8, 9, 10
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
      {/* Highlight effect */}
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

// Combined ball renderer - uses CSS for 1-7, SVG for 8-10
export function PoolBallRenderer({ number, size = 14, svgSrc, alt }) {
  // For balls 1-7, use CSS balls
  if (number >= 1 && number <= 7) {
    return <CSSPoolBall number={number} size={size} />;
  }
  
  // For balls 8, 9, 10 and cue ball, use existing SVG images
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