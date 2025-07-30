import React, { useState } from 'react';
import RealisticPoolBall from './RealisticPoolBall';
import styles from './PoolBallDemo.module.css';

const PoolBallDemo = () => {
  const [selectedBall, setSelectedBall] = useState(null);
  const [ballSize, setBallSize] = useState(60);
  const [showEffects, setShowEffects] = useState(true);

  const allBalls = [
    'cue', '1', '2', '3', '4', '5', '6', '7', '8', 
    '9', '10', '11', '12', '13', '14', '15'
  ];

  const tenBallRack = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return (
    <div className={styles.demoContainer}>
      <h2 className={styles.title}>🎱 Super Realistic Pool Balls</h2>
      
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="ball-size">Ball Size:</label>
          <input
            id="ball-size"
            type="range"
            min="20"
            max="100"
            value={ballSize}
            onChange={(e) => setBallSize(parseInt(e.target.value))}
            className={styles.slider}
          />
          <span>{ballSize}px</span>
        </div>
        
        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={showEffects}
              onChange={(e) => setShowEffects(e.target.checked)}
            />
            Show Shadow Effects
          </label>
        </div>
      </div>

      {/* Complete Set */}
      <div className={styles.section}>
        <h3>Complete Ball Set (1-15 + Cue)</h3>
        <div className={styles.ballGrid}>
          {allBalls.map(number => (
            <div key={number} className={styles.ballWrapper}>
              <RealisticPoolBall
                number={number}
                size={ballSize}
                showShadow={showEffects}
                className={selectedBall === number ? styles.selected : ''}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedBall(selectedBall === number ? null : number)}
              />
              <div className={styles.ballLabel}>
                {number === 'cue' ? 'Cue' : `Ball ${number}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10-Ball Rack */}
      <div className={styles.section}>
        <h3>10-Ball Rack Formation</h3>
        <div className={styles.rackContainer}>
          <div className={styles.tenBallRack}>
            {/* Row 1 - Apex ball (1) */}
            <div className={styles.rackRow}>
              <RealisticPoolBall number="1" size={ballSize * 0.8} showShadow={showEffects} />
            </div>
            
            {/* Row 2 */}
            <div className={styles.rackRow}>
              <RealisticPoolBall number="2" size={ballSize * 0.8} showShadow={showEffects} />
              <RealisticPoolBall number="3" size={ballSize * 0.8} showShadow={showEffects} />
            </div>
            
            {/* Row 3 */}
            <div className={styles.rackRow}>
              <RealisticPoolBall number="4" size={ballSize * 0.8} showShadow={showEffects} />
              <RealisticPoolBall number="5" size={ballSize * 0.8} showShadow={showEffects} />
              <RealisticPoolBall number="6" size={ballSize * 0.8} showShadow={showEffects} />
            </div>
            
            {/* Row 4 - 10 ball in center */}
            <div className={styles.rackRow}>
              <RealisticPoolBall number="7" size={ballSize * 0.8} showShadow={showEffects} />
              <RealisticPoolBall 
                number="10" 
                size={ballSize * 0.8} 
                showShadow={showEffects}
                className={styles.tenBall}
              />
              <RealisticPoolBall number="8" size={ballSize * 0.8} showShadow={showEffects} />
              <RealisticPoolBall number="9" size={ballSize * 0.8} showShadow={showEffects} />
            </div>
          </div>
          
          {/* Cue ball */}
          <div className={styles.cueBallPosition}>
            <RealisticPoolBall 
              number="cue" 
              size={ballSize * 0.8} 
              showShadow={showEffects}
              className={styles.cueBall}
            />
            <div className={styles.ballLabel}>Cue Ball</div>
          </div>
        </div>
      </div>

      {/* Special Effects Demo */}
      <div className={styles.section}>
        <h3>Special Effects</h3>
        <div className={styles.effectsDemo}>
          <div className={styles.effectGroup}>
            <h4>Glowing Ball (Target)</h4>
            <RealisticPoolBall
              number="10"
              size={ballSize}
              showShadow={showEffects}
              className={styles.glowingBall}
            />
          </div>
          
          <div className={styles.effectGroup}>
            <h4>Spinning Ball</h4>
            <RealisticPoolBall
              number="8"
              size={ballSize}
              showShadow={showEffects}
              className={styles.spinningBall}
            />
          </div>
          
          <div className={styles.effectGroup}>
            <h4>Pulsing Ball (Your Turn)</h4>
            <RealisticPoolBall
              number="cue"
              size={ballSize}
              showShadow={showEffects}
              className={styles.pulsingBall}
            />
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className={styles.section}>
        <h3>How to Use in Your Tutorial</h3>
        <div className={styles.codeBlock}>
          <pre>{`import RealisticPoolBall from './RealisticPoolBall';

// Basic usage
<RealisticPoolBall number="10" size={40} />

// With custom styling
<RealisticPoolBall 
  number="cue" 
  size={60} 
  showShadow={true}
  className="my-custom-class"
  style={{ margin: '10px' }}
/>

// All available numbers: 'cue', '1'-'15'`}</pre>
        </div>
      </div>
    </div>
  );
};

export default PoolBallDemo;