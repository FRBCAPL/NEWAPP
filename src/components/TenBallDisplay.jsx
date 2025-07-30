import React from 'react';
import RealisticPoolBall from './RealisticPoolBall';
import styles from './TenBallDisplay.module.css';

const TenBallDisplay = ({ 
  size = 40, 
  currentBall = null, 
  pocketedBalls = [], 
  highlightTargetBall = false,
  showNumbers = true,
  interactive = false,
  onBallClick = null 
}) => {
  // 10-ball game sequence: shoot 1-10 in order
  const ballNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  // Find the current target ball (lowest numbered ball still on table)
  const targetBall = ballNumbers.find(num => !pocketedBalls.includes(num)) || '1';
  
  const handleBallClick = (ballNumber) => {
    if (interactive && onBallClick) {
      onBallClick(ballNumber);
    }
  };

  const getBallClassName = (ballNumber) => {
    let classNames = [];
    
    if (pocketedBalls.includes(ballNumber)) {
      classNames.push(styles.pocketed);
    } else if (highlightTargetBall && ballNumber === targetBall) {
      classNames.push(styles.targetBall);
    } else if (currentBall === ballNumber) {
      classNames.push(styles.currentBall);
    }
    
    if (interactive) {
      classNames.push(styles.interactive);
    }
    
    return classNames.join(' ');
  };

  return (
    <div className={styles.container}>
      {showNumbers && (
        <div className={styles.header}>
          <h3 className={styles.title}>10-Ball Game</h3>
          <p className={styles.subtitle}>Shoot balls 1 through 10 in numerical order</p>
        </div>
      )}
      
      <div className={styles.ballsContainer}>
        {/* Cue Ball */}
        <div className={styles.cueBallSection}>
          <RealisticPoolBall
            number="cue"
            size={size}
            className={currentBall === 'cue' ? styles.currentBall : ''}
            style={{ 
              cursor: interactive ? 'pointer' : 'default'
            }}
            onClick={() => handleBallClick('cue')}
          />
          {showNumbers && <div className={styles.ballLabel}>Cue Ball</div>}
        </div>
        
        {/* Object Balls 1-10 */}
        <div className={styles.objectBalls}>
          {ballNumbers.map(number => (
            <div key={number} className={styles.ballWrapper}>
              <RealisticPoolBall
                number={number}
                size={size}
                className={getBallClassName(number)}
                style={{ 
                  cursor: interactive ? 'pointer' : 'default',
                  opacity: pocketedBalls.includes(number) ? 0.3 : 1
                }}
                onClick={() => handleBallClick(number)}
              />
              {showNumbers && (
                <div className={styles.ballLabel}>
                  Ball {number}
                  {highlightTargetBall && number === targetBall && (
                    <span className={styles.targetLabel}> (Target)</span>
                  )}
                  {pocketedBalls.includes(number) && (
                    <span className={styles.pocketedLabel}> ✓</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Game Status */}
      {showNumbers && (
        <div className={styles.gameStatus}>
          <div className={styles.statusItem}>
            <strong>Target Ball:</strong> {targetBall}
          </div>
          <div className={styles.statusItem}>
            <strong>Pocketed:</strong> {pocketedBalls.length}/10
          </div>
          <div className={styles.statusItem}>
            <strong>Remaining:</strong> {10 - pocketedBalls.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenBallDisplay;