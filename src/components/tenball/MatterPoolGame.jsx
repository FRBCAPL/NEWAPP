import React, { useState, useRef, useCallback, useEffect } from 'react';
import Matter from 'matter-js';
import styles from './SimplePoolGame.module.css';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  BALL_SIZE,
  FELT_LEFT,
  FELT_RIGHT,
  FELT_TOP,
  FELT_BOTTOM,
  POCKET_RADIUS,
  FRICTION,
  RAIL_FRICTION,
  CUSHION_BOUNCE
} from './constants';

const MatterPoolGame = ({ onGameEnd }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const ballsRef = useRef({});
  const wallsRef = useRef([]);
  const pocketsRef = useRef([]);
  
  // Game state
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    gamePhase: 'break',
    isAnimating: false,
    ballInHand: false,
    cueBall: { x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2 }
  });
  
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [aimLocked, setAimLocked] = useState(false);
  const [english, setEnglish] = useState(0);
  const [englishDirection, setEnglishDirection] = useState(0);
  const [isDraggingEnglish, setIsDraggingEnglish] = useState(false);
  
  // Initialize Matter.js engine
  const initializePhysics = useCallback(() => {
    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    });
    engineRef.current = engine;
    
    // Create walls (cushions)
    const wallThickness = 20;
    const wallOptions = {
      isStatic: true,
      render: { fillStyle: '#8B4513' }
    };
    
    // Top and bottom walls
    const topWall = Matter.Bodies.rectangle(TABLE_WIDTH / 2, FELT_TOP - wallThickness / 2, TABLE_WIDTH, wallThickness, wallOptions);
    const bottomWall = Matter.Bodies.rectangle(TABLE_WIDTH / 2, FELT_BOTTOM + wallThickness / 2, TABLE_WIDTH, wallThickness, wallOptions);
    
    // Left and right walls
    const leftWall = Matter.Bodies.rectangle(FELT_LEFT - wallThickness / 2, TABLE_HEIGHT / 2, wallThickness, TABLE_HEIGHT, wallOptions);
    const rightWall = Matter.Bodies.rectangle(FELT_RIGHT + wallThickness / 2, TABLE_HEIGHT / 2, wallThickness, TABLE_HEIGHT, wallOptions);
    
    wallsRef.current = [topWall, bottomWall, leftWall, rightWall];
    Matter.World.add(engine.world, wallsRef.current);
    
    // Create pockets
    const pocketPositions = [
      { x: FELT_LEFT, y: FELT_TOP },
      { x: TABLE_WIDTH / 2, y: FELT_TOP },
      { x: FELT_RIGHT, y: FELT_TOP },
      { x: FELT_LEFT, y: FELT_BOTTOM },
      { x: TABLE_WIDTH / 2, y: FELT_BOTTOM },
      { x: FELT_RIGHT, y: FELT_BOTTOM }
    ];
    
    pocketsRef.current = pocketPositions.map(pos => ({
      x: pos.x,
      y: pos.y,
      radius: POCKET_RADIUS
    }));
    
    // Create cue ball
    const cueBall = Matter.Bodies.circle(
      gameState.cueBall.x,
      gameState.cueBall.y,
      BALL_SIZE / 2,
      {
        restitution: 0.9,
        friction: 0.1,
        frictionAir: 0.02,
        render: { fillStyle: '#FFFFFF' }
      }
    );
    cueBall.isCueBall = true;
    ballsRef.current.cue = cueBall;
    Matter.World.add(engine.world, cueBall);
    
    // Create object balls in 10-ball rack formation
    const rackApexX = TABLE_WIDTH * 0.75;
    const rackApexY = TABLE_HEIGHT / 2;
    const rackSpacing = BALL_SIZE * 0.95;
    
    const rackPositions = [
      { x: rackApexX, y: rackApexY }, // 1-ball
      { x: rackApexX + rackSpacing, y: rackApexY - rackSpacing * 0.5 },
      { x: rackApexX + rackSpacing, y: rackApexY + rackSpacing * 0.5 },
      { x: rackApexX + 2 * rackSpacing, y: rackApexY - rackSpacing },
      { x: rackApexX + 2 * rackSpacing, y: rackApexY }, // 10-ball
      { x: rackApexX + 2 * rackSpacing, y: rackApexY + rackSpacing },
      { x: rackApexX + 3 * rackSpacing, y: rackApexY - rackSpacing * 1.5 },
      { x: rackApexX + 3 * rackSpacing, y: rackApexY - rackSpacing * 0.5 },
      { x: rackApexX + 3 * rackSpacing, y: rackApexY + rackSpacing * 0.5 },
      { x: rackApexX + 3 * rackSpacing, y: rackApexY + rackSpacing * 1.5 }
    ];
    
    const ballColors = ['#FFFF00', '#0000FF', '#FF0000', '#800080', '#FFA500', '#008000', '#8B4513', '#000000', '#FFC0CB', '#FFD700'];
    
    rackPositions.forEach((pos, index) => {
      const ball = Matter.Bodies.circle(pos.x, pos.y, BALL_SIZE / 2, {
        restitution: 0.9,
        friction: 0.1,
        frictionAir: 0.02,
        render: { fillStyle: ballColors[index] }
      });
      ball.ballNumber = index + 1;
      ballsRef.current[`ball${index + 1}`] = ball;
      Matter.World.add(engine.world, ball);
    });
    
    // Add collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Handle ball-pocket collisions
        if (bodyA.isCueBall || bodyB.isCueBall) {
          const ball = bodyA.isCueBall ? bodyA : bodyB;
          const other = bodyA.isCueBall ? bodyB : bodyA;
          
          // Check if ball fell in pocket
          pocketsRef.current.forEach(pocket => {
            const dx = ball.position.x - pocket.x;
            const dy = ball.position.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < pocket.radius) {
              // Ball fell in pocket
              if (ball.isCueBall) {
                // Scratch - cue ball in pocket
                console.log('Scratch!');
              } else {
                // Object ball in pocket
                console.log(`Ball ${ball.ballNumber} pocketed!`);
                Matter.World.remove(engine.world, ball);
                delete ballsRef.current[`ball${ball.ballNumber}`];
              }
            }
          });
        }
      });
    });
    
    return engine;
  }, []);
  
  // Handle mouse movement for aiming
  const handleMouseMove = useCallback((e) => {
    if (aimLocked || gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current.cue;
    if (!cueBall) return;
    
    const dx = x - cueBall.position.x;
    const dy = y - cueBall.position.y;
    const angle = Math.atan2(dy, dx);
    
    setAimAngle(angle);
  }, [aimLocked, gameState.isAnimating]);
  
  // Handle mouse click to lock aim
  const handleMouseClick = useCallback(() => {
    if (gameState.isAnimating) return;
    setAimLocked(!aimLocked);
  }, [aimLocked, gameState.isAnimating]);
  
  // Handle shot execution
  const handleShoot = useCallback(() => {
    if (!aimLocked || gameState.isAnimating) return;
    
    const cueBall = ballsRef.current.cue;
    if (!cueBall) return;
    
    setGameState(prev => ({ ...prev, isAnimating: true }));
    
    // Calculate shot velocity
    const speed = power * 15;
    const vx = Math.cos(aimAngle) * speed;
    const vy = Math.sin(aimAngle) * speed;
    
    // Apply English (spin)
    if (english > 0) {
      const englishRadians = (englishDirection * Math.PI) / 180;
      const spinX = Math.cos(englishRadians) * english * 0.1;
      const spinY = Math.sin(englishRadians) * english * 0.1;
      
      // Apply spin as angular velocity
      cueBall.angularVelocity = (spinX + spinY) * 0.01;
    }
    
    // Apply force to cue ball
    Matter.Body.setVelocity(cueBall, { x: vx, y: vy });
    
    // Reset aim
    setAimLocked(false);
    setEnglish(0);
    setEnglishDirection(0);
  }, [aimLocked, gameState.isAnimating, power, aimAngle, english, englishDirection]);
  
  // English control handlers
  const handleEnglishMouseDown = useCallback((event) => {
    event.preventDefault();
    setIsDraggingEnglish(true);
  }, []);
  
  const handleEnglishMouseMove = useCallback((event) => {
    if (!isDraggingEnglish) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.min(rect.width, rect.height) / 2;
    const intensity = Math.min(distance / maxDistance, 1);
    
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const degrees = (angle + 360) % 360;
    
    setEnglish(intensity);
    setEnglishDirection(degrees);
  }, [isDraggingEnglish]);
  
  const handleEnglishMouseUp = useCallback(() => {
    setIsDraggingEnglish(false);
  }, []);
  
  // Helper functions for spin display
  const getSpinColor = useCallback((direction) => {
    const degrees = direction % 360;
    
    if (degrees >= 225 && degrees <= 315) return '#4CAF50'; // Top
    else if (degrees >= 45 && degrees <= 135) return '#F44336'; // Back
    else if (degrees > 135 && degrees < 225) return '#9C27B0'; // Left
    else return '#FF9800'; // Right
  }, []);
  
  const getSpinType = useCallback((direction) => {
    const degrees = direction % 360;
    
    if (degrees >= 225 && degrees <= 315) return 'Top Spin';
    else if (degrees >= 45 && degrees <= 135) return 'Back Spin';
    else if (degrees > 135 && degrees < 225) return 'Left Spin';
    else return 'Right Spin';
  }, []);
  
  // Initialize physics on mount
  useEffect(() => {
    const engine = initializePhysics();
    
    // Start the engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    
    // Animation loop
    const animate = () => {
      // Check if all balls have stopped moving
      const balls = Object.values(ballsRef.current);
      const allStopped = balls.every(ball => {
        const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
        return speed < 0.1;
      });
      
      if (allStopped && gameState.isAnimating) {
        setGameState(prev => ({ ...prev, isAnimating: false }));
      }
      
      requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [initializePhysics, gameState.isAnimating]);
  
  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;
    
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0F5132';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      
      // Draw felt
      ctx.fillStyle = '#2D5A27';
      ctx.fillRect(FELT_LEFT, FELT_TOP, FELT_RIGHT - FELT_LEFT, FELT_BOTTOM - FELT_TOP);
      
      // Draw pockets
      ctx.fillStyle = '#000000';
      pocketsRef.current.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocket.radius, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // Draw balls
      Object.values(ballsRef.current).forEach(ball => {
        ctx.fillStyle = ball.render.fillStyle;
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, BALL_SIZE / 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw ball number for object balls
        if (ball.ballNumber) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(ball.ballNumber.toString(), ball.position.x, ball.position.y + 4);
        }
      });
      
      // Draw aim line
      if (!gameState.isAnimating) {
        const cueBall = ballsRef.current.cue;
        if (cueBall) {
          const lineLength = 100;
          const endX = cueBall.position.x + Math.cos(aimAngle) * lineLength;
          const endY = cueBall.position.y + Math.sin(aimAngle) * lineLength;
          
          ctx.strokeStyle = aimLocked ? '#00FF00' : '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cueBall.position.x, cueBall.position.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
      
      requestAnimationFrame(render);
    };
    render();
  }, [aimAngle, aimLocked, gameState.isAnimating]);
  
  return (
    <div className={styles.gameContainer}>
      <canvas
        ref={canvasRef}
        width={TABLE_WIDTH}
        height={TABLE_HEIGHT}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
        style={{ cursor: aimLocked ? 'pointer' : 'crosshair' }}
      />
      
      <div className={styles.controls}>
        <div className={styles.powerControl}>
          <label>Power: {Math.round(power * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>
        
        <div className={styles.englishControl}>
          <label>English: Drag to set spin</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <div
              onMouseDown={handleEnglishMouseDown}
              onMouseMove={handleEnglishMouseMove}
              onMouseUp={handleEnglishMouseUp}
              onMouseLeave={handleEnglishMouseUp}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '2px solid #333',
                background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#333',
                cursor: isDraggingEnglish ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              {english > 0 ? '+' : ''}{Math.round(english * 100)}%
              
              {english !== 0 && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${Math.cos(englishDirection * Math.PI / 180) * 20}px, ${Math.sin(englishDirection * Math.PI / 180) * 20}px)`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getSpinColor(englishDirection),
                    border: '1px solid #fff'
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${englishDirection}deg)`,
                    width: '2px',
                    height: '20px',
                    background: getSpinColor(englishDirection),
                    borderRadius: '1px'
                  }}></div>
                </>
              )}
            </div>
            
            {english !== 0 && (
              <div style={{
                fontSize: '12px',
                color: getSpinColor(englishDirection),
                fontWeight: 'bold'
              }}>
                {getSpinType(englishDirection)}
              </div>
            )}
            {english === 0 && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                No Spin
              </div>
            )}
            
            {english !== 0 && (
              <button
                onClick={() => {
                  setEnglish(0);
                  setEnglishDirection(0);
                }}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.shootButton}>
          <button
            onClick={handleShoot}
            disabled={gameState.isAnimating || !aimLocked}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: aimLocked ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: aimLocked ? 'pointer' : 'not-allowed'
            }}
          >
            {!aimLocked ? 'CLICK TO LOCK AIM' : 'SHOOT!'}
          </button>
        </div>
        
        <div className={styles.gameInfo}>
          <span>Player: {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
          <span>Status: {gameState.isAnimating ? 'Animating' : aimLocked ? 'Aim Locked - Ready to Shoot' : 'Move Mouse to Aim'}</span>
        </div>
      </div>
    </div>
  );
};

export default MatterPoolGame;





