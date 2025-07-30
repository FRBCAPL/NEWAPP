import React from 'react';
import styles from './RealisticPoolBall.module.css';

const RealisticPoolBall = ({ 
  number, 
  size = 40, 
  style = {},
  className = '',
  showShadow = true 
}) => {
  // Define ball colors and patterns for each number
  const ballConfigs = {
    'cue': {
      color: '#f8f8f8',
      textColor: '#000',
      isStriped: false,
      displayText: '',
    },
    '1': {
      color: '#ffeb3b',
      textColor: '#000',
      isStriped: false,
      displayText: '1',
    },
    '2': {
      color: '#2196f3',
      textColor: '#fff',
      isStriped: false,
      displayText: '2',
    },
    '3': {
      color: '#f44336',
      textColor: '#fff',
      isStriped: false,
      displayText: '3',
    },
    '4': {
      color: '#9c27b0',
      textColor: '#fff',
      isStriped: false,
      displayText: '4',
    },
    '5': {
      color: '#ff9800',
      textColor: '#fff',
      isStriped: false,
      displayText: '5',
    },
    '6': {
      color: '#4caf50',
      textColor: '#fff',
      isStriped: false,
      displayText: '6',
    },
    '7': {
      color: '#795548',
      textColor: '#fff',
      isStriped: false,
      displayText: '7',
    },
    '8': {
      color: '#000000',
      textColor: '#fff',
      isStriped: false,
      displayText: '8',
    },
    '9': {
      color: '#ffeb3b',
      textColor: '#000',
      isStriped: true,
      displayText: '9',
    },
    '10': {
      color: '#2196f3',
      textColor: '#fff',
      isStriped: true,
      displayText: '10',
    },
    '11': {
      color: '#f44336',
      textColor: '#fff',
      isStriped: true,
      displayText: '11',
    },
    '12': {
      color: '#9c27b0',
      textColor: '#fff',
      isStriped: true,
      displayText: '12',
    },
    '13': {
      color: '#ff9800',
      textColor: '#fff',
      isStriped: true,
      displayText: '13',
    },
    '14': {
      color: '#4caf50',
      textColor: '#fff',
      isStriped: true,
      displayText: '14',
    },
    '15': {
      color: '#795548',
      textColor: '#fff',
      isStriped: true,
      displayText: '15',
    },
  };

  const config = ballConfigs[number] || ballConfigs['cue'];
  
  const ballStyle = {
    width: `${size}px`,
    height: `${size}px`,
    background: config.isStriped 
      ? `linear-gradient(135deg, 
          ${config.color} 0%, 
          ${config.color} 35%, 
          #ffffff 35%, 
          #ffffff 40%, 
          ${config.color} 40%, 
          ${config.color} 60%, 
          #ffffff 60%, 
          #ffffff 65%, 
          ${config.color} 65%, 
          ${config.color} 100%)`
      : `radial-gradient(circle at 30% 30%, 
          rgba(255,255,255,0.8) 0%, 
          rgba(255,255,255,0.4) 20%, 
          ${config.color} 35%, 
          ${adjustBrightness(config.color, -20)} 70%, 
          ${adjustBrightness(config.color, -40)} 100%)`,
    ...style
  };

  const textStyle = {
    color: config.textColor,
    fontSize: `${size * 0.4}px`,
  };

  return (
    <div className={`${styles.ballContainer} ${className}`}>
      {showShadow && (
        <div 
          className={styles.ballShadow}
          style={{
            width: `${size * 0.8}px`,
            height: `${size * 0.3}px`,
          }}
        />
      )}
      <div className={styles.ball} style={ballStyle}>
        {/* Main highlight */}
        <div 
          className={styles.ballHighlight}
          style={{
            width: `${size * 0.3}px`,
            height: `${size * 0.3}px`,
          }}
        />
        
        {/* Secondary highlight */}
        <div 
          className={styles.ballSecondaryHighlight}
          style={{
            width: `${size * 0.15}px`,
            height: `${size * 0.15}px`,
          }}
        />
        
        {/* Number circle background */}
        {config.displayText && (
          <div className={styles.numberCircle}>
            <div className={styles.numberText} style={textStyle}>
              {config.displayText}
            </div>
          </div>
        )}
        
        {/* Rim highlight */}
        <div className={styles.ballRim} />
      </div>
    </div>
  );
};

// Helper function to adjust color brightness
function adjustBrightness(color, percent) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + percent));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + percent));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default RealisticPoolBall;