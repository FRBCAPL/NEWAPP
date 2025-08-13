import React, { useState, useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import styles from './SimplePoolGame.module.css';

// Import ball images
import cueBall from '../../assets/cueball.svg';
import tenBall from '../../assets/tenball.svg';
import ball1 from '../../assets/ball1.svg';
import ball2 from '../../assets/ball2.svg';
import ball3 from '../../assets/ball3.svg';
import ball4 from '../../assets/ball4.svg';
import ball5 from '../../assets/ball5.svg';
import ball6 from '../../assets/ball6.svg';
import ball7 from '../../assets/ball7.svg';
import ball8 from '../../assets/ball8.svg';
import ball9 from '../../assets/ball9.svg';

// Import table image
import predatorTable from '../PoolTableSVG/PredatorTable.png';

const RealisticPoolGame = ({ onGameEnd }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const animationRef = useRef(null);
  
  // Game state
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    gamePhase: 'break', // break, play, pushOut, end
    isAnimating: false,
    ballInHand: false,
    scratchOccurred: false,
    consecutiveFouls: { 1: 0, 2: 0 },
    player1Score: 0,
    player2Score: 0
  });

  // Aiming state
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [english, setEnglish] = useState(0); // -1 to 1
  const [englishDirection, setEnglishDirection] = useState(0); // 0-360 degrees
  const [showAimLine, setShowAimLine] = useState(true);
  const [aimLocked, setAimLocked] = useState(false);
  
  // 10-Ball specific rules
  const [calledBall, setCalledBall] = useState(null);
  const [calledPocket, setCalledPocket] = useState(null);
  const [showCallShotModal, setShowCallShotModal] = useState(false);
  const [isPushOut, setIsPushOut] = useState(false);
  const [pushOutAvailable, setPushOutAvailable] = useState(false);
  const [firstShotAfterBreak, setFirstShotAfterBreak] = useState(false);
  
  // Ball images mapping
  const ballImages = {
    cue: cueBall,
    1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
    6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: tenBall
  };

  // Image cache
  const imageCache = useRef({});
  const tableImageCache = useRef(null);

  // Initialize Matter.js physics engine
  const initializePhysics = useCallback(() => {
    if (!canvasRef.current) return;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    });
    engineRef.current = engine;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 600,
        height: 300,
        wireframes: false,
        background: '#2d5a27'
      }
    });
    renderRef.current = render;

    // Create table boundaries (cushions)
    const tableWidth = 600;
    const tableHeight = 300;
    const cushionThickness = 20;

    const cushions = [
      // Top cushion
      Matter.Bodies.rectangle(tableWidth / 2, cushionThickness / 2, tableWidth, cushionThickness, { 
        isStatic: true,
        restitution: 0.6,
        friction: 0.3,
        render: { fillStyle: '#8B4513' }
      }),
      // Bottom cushion
      Matter.Bodies.rectangle(tableWidth / 2, tableHeight - cushionThickness / 2, tableWidth, cushionThickness, { 
        isStatic: true,
        restitution: 0.6,
        friction: 0.3,
        render: { fillStyle: '#8B4513' }
      }),
      // Left cushion
      Matter.Bodies.rectangle(cushionThickness / 2, tableHeight / 2, cushionThickness, tableHeight, { 
        isStatic: true,
        restitution: 0.6,
        friction: 0.3,
        render: { fillStyle: '#8B4513' }
      }),
      // Right cushion
      Matter.Bodies.rectangle(tableWidth - cushionThickness / 2, tableHeight / 2, cushionThickness, tableHeight, { 
        isStatic: true,
        restitution: 0.6,
        friction: 0.3,
        render: { fillStyle: '#8B4513' }
      })
    ];

    // Add cushions to world
    Matter.World.add(engine.world, cushions);

    // Create 10-ball rack
    const ballRadius = 7.5;
    const rackBalls = [];
    const rackPositions = [
      // 10-ball (apex ball)
      { x: 450, y: 150 },
      // Second row
      { x: 435, y: 142.5 }, { x: 435, y: 157.5 },
      // Third row
      { x: 420, y: 135 }, { x: 420, y: 150 }, { x: 420, y: 165 },
      // Fourth row
      { x: 405, y: 127.5 }, { x: 405, y: 142.5 }, { x: 405, y: 157.5 }, { x: 405, y: 172.5 }
    ];

    const ballNumbers = [10, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    ballNumbers.forEach((ballNum, index) => {
      const ball = Matter.Bodies.circle(
        rackPositions[index].x,
        rackPositions[index].y,
        ballRadius,
        {
          restitution: 0.9,
          friction: 0.2,
          frictionAir: 0.01,
          render: {
            fillStyle: ballNum === 10 ? '#ff6b35' : '#ffffff',
            sprite: {
              texture: ballImages[ballNum],
              xScale: 1,
              yScale: 1
            }
          },
          label: `ball_${ballNum}`
        }
      );
      rackBalls.push(ball);
    });

    // Create cue ball
    const cueBall = Matter.Bodies.circle(100, 150, ballRadius, {
      restitution: 0.9,
      friction: 0.2,
      frictionAir: 0.01,
      render: {
        fillStyle: '#ffffff',
        sprite: {
          texture: ballImages.cue,
          xScale: 1,
          yScale: 1
        }
      },
      label: 'cue_ball'
    });

    // Add all balls to world
    Matter.World.add(engine.world, [...rackBalls, cueBall]);

    // Set up collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Check for ball-pocket collisions (simplified)
        if ((bodyA.label.includes('ball') && bodyB.label.includes('pocket')) ||
            (bodyB.label.includes('ball') && bodyA.label.includes('pocket'))) {
          const ball = bodyA.label.includes('ball') ? bodyA : bodyB;
          handleBallPocketed(ball);
        }
      });
    });

    // Start the engine and renderer
    Matter.Engine.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
    };
  }, []);

  const handleBallPocketed = (ball) => {
    const ballNumber = ball.label.split('_')[1];
    
    if (ballNumber === '10') {
      // 10-ball pocketed - check if it's a legal shot
      if (gameState.gamePhase === 'break' || 
          (gameState.gamePhase === 'play' && calledBall === 10)) {
        // Legal 10-ball - game over
        setGameState(prev => ({
          ...prev,
          gamePhase: 'end',
          player1Score: gameState.currentPlayer === 1 ? prev.player1Score + 1 : prev.player1Score,
          player2Score: gameState.currentPlayer === 2 ? prev.player2Score + 1 : prev.player2Score
        }));
        if (onGameEnd) onGameEnd();
      } else {
        // Illegal 10-ball - foul
        handleFoul('illegal_10_ball');
      }
    } else if (ballNumber === 'cue') {
      // Cue ball scratched
      handleFoul('scratch');
    } else {
      // Regular ball pocketed
      if (gameState.gamePhase === 'break') {
        // Legal break shot
        setGameState(prev => ({
          ...prev,
          gamePhase: 'play',
          firstShotAfterBreak: true
        }));
      } else if (gameState.gamePhase === 'play') {
        // Check if it's the called ball
        if (calledBall === parseInt(ballNumber)) {
          // Legal shot
          setGameState(prev => ({
            ...prev,
            consecutiveFouls: {
              ...prev.consecutiveFouls,
              [prev.currentPlayer]: 0
            }
          }));
        } else {
          // Wrong ball - foul
          handleFoul('wrong_ball');
        }
      }
    }
  };

  const handleFoul = (foulType) => {
    setGameState(prev => ({
      ...prev,
      scratchOccurred: true,
      ballInHand: true,
      consecutiveFouls: {
        ...prev.consecutiveFouls,
        [prev.currentPlayer]: prev.consecutiveFouls[prev.currentPlayer] + 1
      }
    }));

    // Check for 3-foul rule
    if (gameState.consecutiveFouls[gameState.currentPlayer] >= 3) {
      // 3-foul rule - opponent wins
      setGameState(prev => ({
        ...prev,
        gamePhase: 'end',
        player1Score: prev.currentPlayer === 2 ? prev.player1Score + 1 : prev.player1Score,
        player2Score: prev.currentPlayer === 1 ? prev.player2Score + 1 : prev.player2Score
      }));
      if (onGameEnd) onGameEnd();
    }
  };

  const shoot = useCallback(() => {
    if (!engineRef.current || gameState.isAnimating) return;

    const cueBall = engineRef.current.world.bodies.find(body => body.label === 'cue_ball');
    if (!cueBall) return;

    // Calculate shot force and direction
    const force = power * 0.1;
    const angleRad = (aimAngle * Math.PI) / 180;
    
    // Apply english
    const englishForce = english * 0.02;
    const englishAngleRad = (englishDirection * Math.PI) / 180;
    
    const totalForceX = Math.cos(angleRad) * force + Math.cos(englishAngleRad) * englishForce;
    const totalForceY = Math.sin(angleRad) * force + Math.sin(englishAngleRad) * englishForce;

    // Apply force to cue ball
    Matter.Body.applyForce(cueBall, cueBall.position, {
      x: totalForceX,
      y: totalForceY
    });

    setGameState(prev => ({
      ...prev,
      isAnimating: true
    }));

    // Check for ball movement to end turn
    const checkMovement = () => {
      const movingBalls = engineRef.current.world.bodies.filter(body => 
        body.label.includes('ball') && 
        (Math.abs(body.velocity.x) > 0.1 || Math.abs(body.velocity.y) > 0.1)
      );

      if (movingBalls.length === 0) {
        // All balls stopped - end turn
        setGameState(prev => ({
          ...prev,
          isAnimating: false,
          currentPlayer: prev.currentPlayer === 1 ? 2 : 1
        }));
        return;
      }

      animationRef.current = requestAnimationFrame(checkMovement);
    };

    setTimeout(checkMovement, 100);
  }, [power, aimAngle, english, englishDirection, gameState.isAnimating]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (renderRef.current) {
        Matter.Render.run(renderRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize physics on mount
  useEffect(() => {
    const cleanup = initializePhysics();
    return cleanup;
  }, [initializePhysics]);

  // Load images
  const loadImage = (src) => {
    if (imageCache.current[src]) {
      return imageCache.current[src];
    }

    const img = new Image();
    img.src = src;
    imageCache.current[src] = img;
    return img;
  };

  // Load table image
  useEffect(() => {
    if (!tableImageCache.current) {
      const img = new Image();
      img.src = predatorTable;
      tableImageCache.current = img;
    }
  }, []);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameInfo}>
        <div className={styles.playerInfo}>
          <span>Player {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
        </div>
        <div className={styles.scoreInfo}>
          <span>P1: {gameState.player1Score}</span>
          <span>P2: {gameState.player2Score}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <canvas
          ref={canvasRef}
          className={styles.poolTable}
          width={600}
          height={300}
        />
        
        {showAimLine && !gameState.isAnimating && (
          <div className={styles.aimingOverlay}>
            <div 
              className={styles.aimLine}
              style={{
                transform: `rotate(${aimAngle}deg)`,
                width: `${power * 100}px`
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.aimControls}>
          <label>Angle: {aimAngle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={aimAngle}
            onChange={(e) => setAimAngle(parseInt(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>

        <div className={styles.powerControls}>
          <label>Power: {Math.round(power * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>

        <div className={styles.englishControls}>
          <label>English: {english}</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={english}
            onChange={(e) => setEnglish(parseFloat(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>

        <button
          className={styles.shootButton}
          onClick={shoot}
          disabled={gameState.isAnimating}
        >
          Shoot
        </button>
      </div>

      {gameState.ballInHand && (
        <div className={styles.ballInHand}>
          <p>Ball in hand - click to place cue ball</p>
        </div>
      )}
    </div>
  );
};

export default RealisticPoolGame;
