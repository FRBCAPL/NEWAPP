import React from 'react';
import { FaGraduationCap, FaGamepad, FaRobot, FaUsers, FaGlobe, FaCog } from 'react-icons/fa';
import styles from './GameModeSelector.module.css';

const GameModeSelector = ({ onModeSelect, onDifficultyChange, difficulty }) => {
  const gameModes = [
    {
      id: 'tutorial',
      title: 'Interactive Tutorial',
      description: 'Learn the official CSI 10-Ball rules step by step with interactive examples and tips.',
      icon: FaGraduationCap,
      color: '#4CAF50',
      recommended: true
    },
    {
      id: 'practice',
      title: 'Practice Mode',
      description: 'Practice your skills against yourself with helpful hints and no pressure.',
      icon: FaGamepad,
      color: '#2196F3'
    },
    {
      id: 'vsComputer',
      title: 'vs Computer',
      description: 'Challenge the AI opponent with adjustable difficulty levels.',
      icon: FaRobot,
      color: '#FF9800'
    },
    {
      id: 'vsLocal',
      title: 'Local Multiplayer',
      description: 'Play against a friend on the same device - perfect for learning together.',
      icon: FaUsers,
      color: '#9C27B0'
    },
    {
      id: 'vsOnline',
      title: 'Online Multiplayer',
      description: 'Connect with players worldwide and test your skills in real matches.',
      icon: FaGlobe,
      color: '#F44336'
    }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Perfect for learning the basics' },
    { value: 'intermediate', label: 'Intermediate', description: 'For players who know the rules' },
    { value: 'advanced', label: 'Advanced', description: 'Challenge yourself with complex scenarios' }
  ];

  return (
    <div className={styles.gameModeSelector}>
      <div className={styles.header}>
        <h2>Choose Your Game Mode</h2>
        <p>Select how you'd like to learn and play 10-Ball</p>
      </div>

      <div className={styles.difficultySection}>
        <h3>Difficulty Level</h3>
        <div className={styles.difficultyOptions}>
          {difficulties.map((diff) => (
            <button
              key={diff.value}
              className={`${styles.difficultyButton} ${difficulty === diff.value ? styles.active : ''}`}
              onClick={() => onDifficultyChange(diff.value)}
            >
              <span className={styles.difficultyLabel}>{diff.label}</span>
              <span className={styles.difficultyDescription}>{diff.description}</span>
            </button>
          ))}
        </div>
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

      <div className={styles.features}>
        <h3>What You'll Learn</h3>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <FaCog />
            <span>Official CSI Rules</span>
          </div>
          <div className={styles.feature}>
            <FaCog />
            <span>Call Pocket Requirements</span>
          </div>
          <div className={styles.feature}>
            <FaCog />
            <span>Push Out Strategy</span>
          </div>
          <div className={styles.feature}>
            <FaCog />
            <span>Three Foul Rule</span>
          </div>
          <div className={styles.feature}>
            <FaCog />
            <span>Break Shot Techniques</span>
          </div>
          <div className={styles.feature}>
            <FaCog />
            <span>Defensive Play</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector; 