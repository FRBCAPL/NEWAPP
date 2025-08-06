import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import styles from './GameModeSelector.module.css';

const GameModeSelector = ({ onModeSelect, fromLogin = false }) => {
  const gameModes = [
    {
      id: 'tutorial',
      title: 'Interactive Tutorial',
      description: 'Learn the official CSI 10-Ball rules step by step with interactive examples and tips.',
      icon: FaGraduationCap,
      color: '#4CAF50',
      recommended: true
    }
  ];

  return (
    <div 
      className={styles.gameModeSelector}
      style={{
        maxWidth: '280px',
        width: '280px',
        margin: '0 auto',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div className={styles.header}>
        {!fromLogin && (
          <button 
            className={styles.backToDashboardButton}
            onClick={() => window.location.href = '/dashboard'}
          >
            ← Back to Dashboard
          </button>
        )}
        <h2>10-Ball Tutorial</h2>
        <p>Learn and master the official CSI 10-Ball rules</p>
      </div>

      <div className={styles.modesGrid}>
        {gameModes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <div
              key={mode.id}
              className={`${styles.modeCard} ${mode.recommended ? styles.recommended : ''}`}
              onClick={() => onModeSelect(mode.id)}
            >
              {mode.recommended && (
                <div className={styles.recommendedBadge}>Recommended</div>
              )}
              <div className={styles.modeIcon} style={{ backgroundColor: mode.color }}>
                <IconComponent />
              </div>
              <div className={styles.modeContent}>
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
              </div>
              <div className={styles.modeArrow}>→</div>
            </div>
          );
        })}
      </div>

      <div className={styles.whatYoullLearn}>
        <h3>What You'll Learn</h3>
        <ul>
          <li>Official CSI 10-Ball Rules</li>
          <li>Break/Push Out Requirements</li>
          <li>Call Shot/Ball in Hand Requirements</li>
          <li>Illegally Pocketed Balls/Opponent's Option</li>
          <li>Foul Detection and Penalties</li>
          <li>Advanced Shot Planning</li>
        </ul>
      </div>
    </div>
  );
};

export default GameModeSelector; 