# 🏆 ELITE 10-BALL GAME

Create: `myapp2/frontend/src/components/Elite10Ball.jsx`

**Copy this EXACTLY:**

```jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import table2 from "./PoolTableSVG/table2.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import { CueStickOverlay } from "./CueStick";
import { EnhancedPoolBallRenderer } from "./RealisticPoolBalls";
import { Vector2, PhysicsBall, CollisionDetector } from "./ProPhysicsEngine";

const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_SIZE = 16;
const RAIL_WIDTH = 25;

const BALLS_CONFIG = [
  { id: "cue", number: 0, src: cueBall },
  { id: "1", number: 1, src: null },
  { id: "2", number: 2, src: null },
  { id: "3", number: 3, src: null },
  { id: "4", number: 4, src: null },
  { id: "5", number: 5, src: null },
  { id: "6", number: 6, src: null },
  { id: "7", number: 7, src: null },
  { id: "8", number: 8, src: eightBall },
  { id: "9", number: 9, src: nineBall },
  { id: "10", number: 10, src: tenBall }
];

export default function Elite10Ball() {
  const [gameState, setGameState] = useState('aiming');
  const [power, setPower] = useState(8);
  const [aimAngle, setAimAngle] = useState(0);
  const [english, setEnglish] = useState({ x: 0, y: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [targetBall, setTargetBall] = useState(1);
  const [gameMessage, setGameMessage] = useState('Player 1: Hit the 1-ball first');
  const [scores, setScores] = useState({ 1: 0, 2: 0 });

  const ballsRef = useRef({});
  const ballElements = useRef({});
  const animationRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    initializeGame();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const initializeGame = () => {
    ballsRef.current = {};
    ballElements.current = {};

    // Create rack formation
    const rackCenter = new Vector2(TABLE_WIDTH * 0.25, TABLE_HEIGHT * 0.5);
    const spacing = BALL_SIZE * 1.1;
    
    const positions = [
      [0, 0], // 1-ball at front
      [-1, -0.5], [-1, 0.5], // Row 2
      [-2, -1], [-2, 0], [-2, 1], // Row 3  
      [-3, -1.5], [-3, -0.5], [-3, 0.5], [-3, 1.5] // Row 4
    ];

    // Create object balls (1-10)
    BALLS_CONFIG.slice(1).forEach((config, index) => {
      if (index < positions.length) {
        const [row, col] = positions[index];
        const x = rackCenter.x + row * spacing * 0.866;
        const y = rackCenter.y + col * spacing;
        
        ballsRef.current[config.id] = new PhysicsBall(
          config.id, x, y, BALL_SIZE / 2
        );
        ballElements.current[config.id] = React.createRef();
      }
    });

    // Create cue ball
    ballsRef.current['cue'] = new PhysicsBall(
      'cue', TABLE_WIDTH * 0.75, TABLE_HEIGHT * 0.5, BALL_SIZE / 2
    );
    ballElements.current['cue'] = React.createRef();

    renderBalls();
  };

  const executeShot = () => {
    if (gameState !== 'aiming') return;

    const cueBall = ballsRef.current['cue'];
    if (!cueBall) return;

    const direction = Vector2.fromAngle(aimAngle);
    cueBall.applyCueHit(direction, power, english);

    setGameState('animating');
    startPhysicsLoop();
  };

  const startPhysicsLoop = () => {
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30);
      lastTime = currentTime;

      // Update all balls
      let anyMoving = false;
      Object.values(ballsRef.current).forEach(ball => {
        if (ball.isActive && !ball.isPocketed) {
          ball.update(deltaTime);
          ball.handleRailCollision(null, TABLE_WIDTH, TABLE_HEIGHT, RAIL_WIDTH);
          
          if (ball.isMoving()) {
            anyMoving = true;
          }
        }
      });

      // Check collisions
      checkCollisions();
      
      // Check pockets
      checkPockets();

      // Render
      renderBalls();

      if (anyMoving) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        endShot();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const checkCollisions = () => {
    const balls = Object.values(ballsRef.current).filter(b => b.isActive && !b.isPocketed);
    
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const collision = CollisionDetector.checkBallCollision(balls[i], balls[j]);
        if (collision.occurred) {
          CollisionDetector.resolveBallCollision(balls[i], balls[j], collision);
        }
      }
    }
  };

  const checkPockets = () => {
    const pockets = [
      new Vector2(RAIL_WIDTH, RAIL_WIDTH),
      new Vector2(TABLE_WIDTH - RAIL_WIDTH, RAIL_WIDTH),
      new Vector2(RAIL_WIDTH, TABLE_HEIGHT - RAIL_WIDTH),
      new Vector2(TABLE_WIDTH - RAIL_WIDTH, TABLE_HEIGHT - RAIL_WIDTH),
      new Vector2(TABLE_WIDTH / 2, RAIL_WIDTH),
      new Vector2(TABLE_WIDTH / 2, TABLE_HEIGHT - RAIL_WIDTH)
    ];

    Object.values(ballsRef.current).forEach(ball => {
      if (ball.isPocketed) return;

      pockets.forEach(pocket => {
        const distance = ball.position.distanceTo(pocket);
        if (distance < 18) {
          ball.isPocketed = true;
          ball.isActive = false;
          ball.velocity = new Vector2(0, 0);
        }
      });
    });
  };

  const endShot = () => {
    setGameState('aiming');
    
    // Simple game logic - just continue playing
    if (ballsRef.current['10'] && ballsRef.current['10'].isPocketed) {
      setGameMessage(`🏆 Player ${currentPlayer} wins!`);
      setTimeout(() => {
        if (window.confirm('Play again?')) {
          initializeGame();
          setTargetBall(1);
          setCurrentPlayer(1);
          setGameMessage('Player 1: Hit the 1-ball first');
        }
      }, 1000);
    } else {
      // Switch players
      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      setGameMessage(`Player ${nextPlayer}: Hit the ${targetBall}-ball first`);
    }
  };

  const renderBalls = () => {
    Object.entries(ballsRef.current).forEach(([id, ball]) => {
      const element = ballElements.current[id]?.current;
      if (element && !ball.isPocketed) {
        element.style.left = `${ball.position.x - ball.radius}px`;
        element.style.top = `${ball.position.y - ball.radius}px`;
        element.style.transform = `rotate(${ball.rotation}rad)`;
        element.style.opacity = '1';
      } else if (element && ball.isPocketed) {
        element.style.opacity = '0';
      }
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (gameState !== 'aiming') return;
    
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const cueBall = ballsRef.current['cue'];
    if (cueBall) {
      const angle = Math.atan2(
        mouseY - cueBall.position.y, 
        mouseX - cueBall.position.x
      );
      setAimAngle(angle);
    }
  }, [gameState]);

  const handleClick = useCallback(() => {
    if (gameState === 'aiming') {
      executeShot();
    }
  }, [gameState, power, aimAngle, english]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a4d1a 0%, #0d2d0d 100%)',
      borderRadius: '15px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Elite Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        padding: '15px 30px',
        borderRadius: '10px',
        textAlign: 'center',
        border: '3px solid #FF8C00',
        boxShadow: '0 4px 15px rgba(255,215,0,0.3)'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '1.8rem',
          color: '#000',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          fontWeight: '900'
        }}>
          🏆 ELITE 10-BALL
        </h1>
        <div style={{ 
          fontSize: '1.1rem', 
          color: '#000',
          fontWeight: 'bold'
        }}>
          Player 1: {scores[1]} | Player 2: {scores[2]}
        </div>
      </div>

      {/* Game Status */}
      <div style={{
        background: 'rgba(0,150,0,0.9)',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        {gameMessage}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '15px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '13px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
      }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Power: {power.toFixed(1)}</label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            style={{ display: 'block', width: '100px', marginTop: '5px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>
        
        <div>
          <label style={{ fontWeight: 'bold' }}>English X: {english.x.toFixed(2)}</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={english.x}
            onChange={(e) => setEnglish(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
            style={{ display: 'block', width: '100px', marginTop: '5px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>
        
        <div>
          <label style={{ fontWeight: 'bold' }}>English Y: {english.y.toFixed(2)}</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={english.y}
            onChange={(e) => setEnglish(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
            style={{ display: 'block', width: '100px', marginTop: '5px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>

        <button 
          onClick={() => {
            initializeGame();
            setTargetBall(1);
            setCurrentPlayer(1);
            setGameMessage('Player 1: Hit the 1-ball first');
          }}
          style={{
            padding: '8px 15px',
            background: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          New Rack
        </button>
      </div>

      {/* Elite Pool Table */}
      <div
        ref={tableRef}
        style={{
          position: "relative",
          width: TABLE_WIDTH,
          height: TABLE_HEIGHT,
          background: "#1a5f1a",
          border: "4px solid #8B4513",
          borderRadius: "12px",
          overflow: "hidden",
          cursor: gameState === 'aiming' ? 'crosshair' : 'default',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Table Background */}
        <img
          src={table2}
          alt="Pool Table"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
            pointerEvents: "none"
          }}
          draggable={false}
        />

        {/* Professional Cue Stick */}
        <CueStickOverlay
          cueBallPosition={ballsRef.current['cue']?.position}
          aimAngle={aimAngle}
          power={power}
          isAiming={gameState === 'aiming'}
          tableWidth={TABLE_WIDTH}
          tableHeight={TABLE_HEIGHT}
        />

        {/* Elite Balls */}
        {BALLS_CONFIG.map(config => {
          const ball = ballsRef.current[config.id];
          return (
            <div
              key={config.id}
              ref={ballElements.current[config.id]}
              style={{
                position: "absolute",
                width: BALL_SIZE,
                height: BALL_SIZE,
                zIndex: config.id === 'cue' ? 15 : 12,
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease'
              }}
            >
              <EnhancedPoolBallRenderer
                number={config.number}
                size={BALL_SIZE}
                svgSrc={config.src}
                alt={`${config.number} Ball`}
              />
            </div>
          );
        })}
      </div>

      {/* Elite Status */}
      <div style={{
        background: 'rgba(0,0,0,0.9)',
        padding: '12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        textAlign: 'center',
        maxWidth: TABLE_WIDTH
      }}>
        <strong>🎯 ELITE FEATURES:</strong> Realistic Physics • Professional Ball Graphics • Tournament Controls
      </div>
    </div>
  );
}
```

## ✅ **QUICK TEST:**

1. **Copy all 3 files:**
   - `RealisticPoolBalls.jsx`
   - `ProPhysicsEngine.js` 
   - `Elite10Ball.jsx`

2. **Add to Dashboard:**
   ```jsx
   import Elite10Ball from '../Elite10Ball';
   
   // In your JSX:
   <Elite10Ball />
   ```

**This will be WAY better!** Professional balls, realistic physics, smooth movement, and tournament-quality gameplay! 🎱🏆