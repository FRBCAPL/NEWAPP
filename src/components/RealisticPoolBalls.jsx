import React from 'react';

// 🎱 PROFESSIONAL REALISTIC POOL BALLS
// Tournament-quality ball graphics with proper shading and highlights

const BALL_CONFIGS = {
  1: { 
    primary: '#FFD700', 
    secondary: '#FFA500',
    highlight: '#FFFF99',
    shadow: '#CC8800',
    number: '1', 
    textColor: '#000',
    textStroke: '#333'
  },
  2: { 
    primary: '#0066CC', 
    secondary: '#004499',
    highlight: '#3399FF',
    shadow: '#002266',
    number: '2', 
    textColor: '#FFF',
    textStroke: '#000'
  },
  3: { 
    primary: '#FF0000', 
    secondary: '#CC0000',
    highlight: '#FF6666',
    shadow: '#990000',
    number: '3', 
    textColor: '#FFF',
    textStroke: '#000'
  },
  4: { 
    primary: '#800080', 
    secondary: '#600060',
    highlight: '#AA66AA',
    shadow: '#400040',
    number: '4', 
    textColor: '#FFF',
    textStroke: '#000'
  },
  5: { 
    primary: '#FF8C00', 
    secondary: '#CC6600',
    highlight: '#FFAA44',
    shadow: '#994400',
    number: '5', 
    textColor: '#FFF',
    textStroke: '#000'
  },
  6: { 
    primary: '#228B22', 
    secondary: '#1A661A',
    highlight: '#66BB66',
    shadow: '#0F440F',
    number: '6', 
    textColor: '#FFF',
    textStroke: '#000'
  },
  7: { 
    primary: '#8B0000', 
    secondary: '#660000',
    highlight: '#BB4444',
    shadow: '#440000',
    number: '7', 
    textColor: '#FFF',
    textStroke: '#000'
  }
};

export function ProfessionalPoolBall({ number, size = 14 }) {
  const config = BALL_CONFIGS[number];
  
  if (!config) {
    return null; // Use SVG for 8, 9, 10
  }

  const ballId = `ball-${number}-${size}`;
  const gradientId = `gradient-${number}-${size}`;
  const highlightId = `highlight-${number}-${size}`;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* SVG Ball with Professional Gradients */}
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <defs>
          {/* Main Ball Gradient */}
          <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={config.highlight} stopOpacity="1" />
            <stop offset="30%" stopColor={config.primary} stopOpacity="1" />
            <stop offset="70%" stopColor={config.secondary} stopOpacity="1" />
            <stop offset="100%" stopColor={config.shadow} stopOpacity="1" />
          </radialGradient>
          
          {/* Highlight Gradient */}
          <radialGradient id={highlightId} cx="40%" cy="30%" r="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" stopOpacity="1" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Ball Shadow */}
        <circle
          cx={size/2 + 1}
          cy={size/2 + 1}
          r={(size/2) - 1}
          fill="rgba(0,0,0,0.3)"
          filter="blur(1px)"
        />
        
        {/* Main Ball */}
        <circle
          cx={size/2}
          cy={size/2}
          r={(size/2) - 1}
          fill={`url(#${gradientId})`}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.5"
        />
        
        {/* Highlight */}
        <circle
          cx={size/2}
          cy={size/2}
          r={(size/2) - 1}
          fill={`url(#${highlightId})`}
        />
        
        {/* Number */}
        <text
          x={size/2}
          y={size/2 + size*0.15}
          textAnchor="middle"
          fontSize={size * 0.5}
          fontFamily="Arial Black, Arial, sans-serif"
          fontWeight="900"
          fill={config.textColor}
          stroke={config.textStroke}
          strokeWidth="0.5"
        >
          {config.number}
        </text>
      </svg>
    </div>
  );
}

export function EnhancedPoolBallRenderer({ number, size = 14, svgSrc, alt }) {
  // For balls 1-7, use professional CSS balls
  if (number >= 1 && number <= 7) {
    return <ProfessionalPoolBall number={number} size={size} />;
  }
  
  // For balls 8, 9, 10 and cue ball, enhance existing SVG images
  return (
    <div style={{ 
      position: 'relative', 
      width: size, 
      height: size,
      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
    }}>
      <img
        src={svgSrc}
        alt={alt}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block'
        }}
      />
      {/* Add highlight to SVG balls too */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '25%',
          width: '30%',
          height: '25%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}