import React from 'react';

const SimpleRealisticBall = ({ number, size = 40 }) => {
  const ballColors = {
    'cue': '#f8f8f8',
    '1': '#ffeb3b',
    '2': '#2196f3', 
    '3': '#f44336',
    '4': '#9c27b0',
    '5': '#ff9800',
    '6': '#4caf50',
    '7': '#795548',
    '8': '#000000',
    '9': '#ffeb3b',
    '10': '#2196f3'
  };

  const isStriped = ['9', '10', '11', '12', '13', '14', '15'].includes(number);
  const color = ballColors[number] || '#ccc';

  const ballStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: isStriped 
      ? `linear-gradient(135deg, ${color} 35%, #ffffff 35%, #ffffff 40%, ${color} 40%, ${color} 60%, #ffffff 60%, #ffffff 65%, ${color} 65%)`
      : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 20%, ${color} 35%, ${adjustBrightness(color, -20)} 70%, ${adjustBrightness(color, -40)} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.3), inset 4px 4px 8px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const numberStyle = {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '50%',
    width: '60%',
    height: '60%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.3}px`,
    fontWeight: 'bold',
    color: '#000',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  };

  const highlightStyle = {
    position: 'absolute',
    top: '15%',
    left: '25%',
    width: '30%',
    height: '30%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 40%, transparent 70%)',
    pointerEvents: 'none'
  };

  function adjustBrightness(color, percent) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + percent));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + percent));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return (
    <div style={ballStyle}>
      <div style={highlightStyle} />
      {number !== 'cue' && (
        <div style={numberStyle}>
          {number}
        </div>
      )}
    </div>
  );
};

export default SimpleRealisticBall;