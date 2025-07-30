import React, { useState, useEffect } from 'react';
import SimpleRealisticBall from './SimpleRealisticBall';

const TenBallTutorial = () => {
  const [gameState, setGameState] = useState({
    pocketedBalls: [],
    currentTarget: '1',
    gamePhase: 'tutorial', // 'tutorial', 'playing', 'finished'
    score: 0,
    shots: 0
  });

  const [showInstructions, setShowInstructions] = useState(true);

  // Game logic
  const getNextTarget = (pocketed) => {
    const allBalls = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const remaining = allBalls.filter(ball => !pocketed.includes(ball));
    return remaining[0] || null;
  };

  const handleBallPocketed = (ballNumber) => {
    if (ballNumber === gameState.currentTarget) {
      const newPocketed = [...gameState.pocketedBalls, ballNumber];
      const nextTarget = getNextTarget(newPocketed);
      
      setGameState(prev => ({
        ...prev,
        pocketedBalls: newPocketed,
        currentTarget: nextTarget,
        score: prev.score + parseInt(ballNumber),
        gamePhase: nextTarget ? 'playing' : 'finished'
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      pocketedBalls: [],
      currentTarget: '1',
      gamePhase: 'tutorial',
      score: 0,
      shots: 0
    });
    setShowInstructions(true);
  };

  const startGame = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'playing' }));
    setShowInstructions(false);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      padding: '2rem',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: '0 0 0.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🎱 10-Ball Tutorial
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#ccc', margin: 0 }}>
          Learn to play 10-ball pool with realistic balls!
        </p>
      </div>

      {/* Instructions Panel */}
      {showInstructions && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ color: '#4CAF50', marginBottom: '1rem' }}>How to Play 10-Ball</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Basic Rules:</h3>
              <ul style={{ lineHeight: '1.8', color: '#ccc' }}>
                <li>Shoot balls in numerical order (1 through 10)</li>
                <li>Always hit the lowest numbered ball first</li>
                <li>Pocket the 10-ball to win</li>
                <li>If you miss, your opponent gets to shoot</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Ball Order:</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(num => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <SimpleRealisticBall number={num} size={25} />
                    {num !== '10' && <span style={{ color: '#666' }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={startGame}
              style={{
                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                border: 'none',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Start Tutorial Game
            </button>
          </div>
        </div>
      )}

      {/* Game Table */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '2px solid #333'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', margin: 0 }}>Game Table</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={resetGame}
              style={{
                background: '#666',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reset Game
            </button>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                background: '#2196F3',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </button>
          </div>
        </div>

        {/* Current Target */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {gameState.currentTarget ? (
            <div>
              <h3 style={{ color: '#4CAF50', marginBottom: '1rem' }}>
                Target Ball: {gameState.currentTarget}
              </h3>
              <div style={{ 
                display: 'inline-block',
                animation: 'glow 2s ease-in-out infinite'
              }}>
                <SimpleRealisticBall number={gameState.currentTarget} size={80} />
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>🏆 Congratulations!</h2>
              <p style={{ color: '#ccc', fontSize: '1.2rem' }}>
                You've completed the 10-ball tutorial!
              </p>
              <p style={{ color: '#4CAF50', fontSize: '1.1rem' }}>
                Final Score: {gameState.score} points
              </p>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          minHeight: '150px',
          background: 'rgba(0,100,0,0.1)',
          borderRadius: '8px',
          padding: '2rem',
          border: '2px dashed rgba(76, 175, 80, 0.3)'
        }}>
          {/* Cue Ball */}
          <div style={{ textAlign: 'center' }}>
            <SimpleRealisticBall number="cue" size={60} />
            <div style={{ color: '#ccc', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Cue Ball
            </div>
          </div>

          {/* Target Ball */}
          {gameState.currentTarget && (
            <div style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => handleBallPocketed(gameState.currentTarget)}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <SimpleRealisticBall number={gameState.currentTarget} size={60} />
              </div>
              <div style={{ color: '#4CAF50', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Click to pocket!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ball Progress */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '1.5rem',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>Ball Progress</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
          gap: '1rem',
          justifyItems: 'center',
          marginBottom: '1rem'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(ballNum => {
            const isPocketed = gameState.pocketedBalls.includes(ballNum);
            const isTarget = ballNum === gameState.currentTarget;
            
            return (
              <div key={ballNum} style={{ textAlign: 'center' }}>
                <div style={{ 
                  opacity: isPocketed ? 0.3 : 1,
                  filter: isPocketed ? 'grayscale(100%)' : 'none',
                  animation: isTarget ? 'glow 2s ease-in-out infinite' : 'none'
                }}>
                  <SimpleRealisticBall number={ballNum} size={40} />
                </div>
                <div style={{ 
                  color: isPocketed ? '#4CAF50' : isTarget ? '#FFD700' : '#ccc',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  {isPocketed ? '✓' : isTarget ? 'Target' : ballNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Game Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {gameState.pocketedBalls.length}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Pocketed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {10 - gameState.pocketedBalls.length}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Remaining</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {gameState.score}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Score</div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes glow {
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

export default TenBallTutorial;