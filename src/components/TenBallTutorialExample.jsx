// Example: How to upgrade your existing tutorial with realistic balls

import React, { useState } from 'react';
import RealisticPoolBall from './RealisticPoolBall';
import TenBallDisplay from './TenBallDisplay';

const TenBallTutorialExample = () => {
  const [gameState, setGameState] = useState({
    pocketedBalls: [],
    currentTarget: '1',
    isPlayerTurn: true,
    gamePhase: 'tutorial' // 'tutorial', 'playing', 'finished'
  });

  // Replace your old ball images with these:
  const BallImage = ({ number, size = 40, className = '' }) => (
    <RealisticPoolBall 
      number={number} 
      size={size} 
      className={className}
      showShadow={true}
    />
  );

  const handleBallPocketed = (ballNumber) => {
    setGameState(prev => ({
      ...prev,
      pocketedBalls: [...prev.pocketedBalls, ballNumber],
      currentTarget: getNextTarget([...prev.pocketedBalls, ballNumber])
    }));
  };

  const getNextTarget = (pocketed) => {
    const remaining = ['1','2','3','4','5','6','7','8','9','10']
      .filter(num => !pocketed.includes(num));
    return remaining[0] || 'game-complete';
  };

  return (
    <div style={{ padding: '2rem', background: '#1a1a2e', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', textAlign: 'center' }}>
        10-Ball Tutorial - Realistic Balls
      </h1>
      
      {/* Method 1: Individual realistic balls */}
      <div style={{ margin: '2rem 0' }}>
        <h3 style={{ color: '#fff' }}>Current Target Ball:</h3>
        <BallImage 
          number={gameState.currentTarget} 
          size={80} 
          className="target-glow"
        />
      </div>

      {/* Method 2: Complete game display */}
      <TenBallDisplay 
        pocketedBalls={gameState.pocketedBalls}
        highlightTargetBall={true}
        interactive={true}
        size={50}
        onBallClick={handleBallPocketed}
      />

      {/* Method 3: Game instructions with realistic balls */}
      <div style={{ margin: '2rem 0', color: '#fff' }}>
        <h3>How to Play 10-Ball:</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
          <span>1. Shoot the balls in order:</span>
          <BallImage number="1" size={25} />
          <span>→</span>
          <BallImage number="2" size={25} />
          <span>→</span>
          <BallImage number="3" size={25} />
          <span>...</span>
          <BallImage number="10" size={25} />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
          <span>2. Always hit the lowest numbered ball first with</span>
          <BallImage number="cue" size={25} />
        </div>
      </div>

      {/* Replace your existing table with realistic balls */}
      <div style={{ 
        background: 'rgba(0,0,0,0.3)', 
        padding: '2rem', 
        borderRadius: '1rem',
        border: '2px solid #333'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Game Table:</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Cue ball */}
          <div>
            <BallImage number="cue" size={50} />
            <div style={{ color: '#ccc', textAlign: 'center', marginTop: '0.5rem' }}>
              Your cue ball
            </div>
          </div>
          
          {/* Target ball */}
          <div>
            <BallImage 
              number={gameState.currentTarget} 
              size={60} 
              className="target-glow"
            />
            <div style={{ color: '#4CAF50', textAlign: 'center', marginTop: '0.5rem' }}>
              Target: {gameState.currentTarget}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .target-glow {
          animation: targetGlow 2s ease-in-out infinite;
        }
        
        @keyframes targetGlow {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 25px rgba(76, 175, 80, 1)) 
                   drop-shadow(0 0 35px rgba(76, 175, 80, 0.6));
          }
        }
      `}</style>
    </div>
  );
};

export default TenBallTutorialExample;