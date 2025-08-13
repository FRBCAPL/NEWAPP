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

// Pool table constants
const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_RADIUS = 7.5;
const FELT_LEFT = 30;
const FELT_RIGHT = TABLE_WIDTH - 30;
const FELT_TOP = 30;
const FELT_BOTTOM = TABLE_HEIGHT - 30;
const POCKET_RADIUS = 12;

const MatterPoolGameImproved = ({ onGameEnd }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const ballsRef = useRef({});
  const wallsRef = useRef([]);
  const pocketsRef = useRef([]);
  const animationRef = useRef(null);
  
  // Game state
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    gamePhase: 'break',
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
  const [english, setEnglish] = useState(0);
  const [englishDirection, setEnglishDirection] = useState(0);
  const [showAimLine, setShowAimLine] = useState(true);
  const [aimLocked, setAimLocked] = useState(false);
  
  // 10-Ball specific rules
  const [calledBall, setCalledBall] = useState(null);
  const [calledPocket, setCalledPocket] = useState(null);
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

  // Initialize Matter.js engine with pool-specific settings
  const initializePhysics = useCallback(() => {
    // Create engine with realistic pool physics
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      timing: { 
        timeScale: 1,
        timestamp: 0 
      }
    });
    engineRef.current = engine;

    // Create walls with realistic cushion properties
    const wallThickness = 15;
    const wallOptions = {
      isStatic: true,
      render: { fillStyle: '#8B4513' },
      restitution: 0.6, // Cushion bounce
      friction: 0.3,     // Cushion friction
      frictionAir: 0.01
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
    
    // Create cue ball with realistic properties
    const cueBall = Matter.Bodies.circle(
      100, // Kitchen position
      150,
      BALL_RADIUS,
      {
        restitution: 0.9,    // Ball bounce
        friction: 0.1,       // Ball friction
        frictionAir: 0.02,   // Air resistance
        density: 0.001,      // Ball density
        render: { fillStyle: '#FFFFFF' }
      }
    );
    cueBall.isCueBall = true;
    cueBall.number = 'cue';
    ballsRef.current.cue = cueBall;
    Matter.World.add(engine.world, cueBall);
    
    // Create object balls in 10-ball rack formation
    const rackApexX = TABLE_WIDTH * 0.75;
    const rackApexY = TABLE_HEIGHT / 2;
    const ballSpacing = BALL_RADIUS * 2.1; // Slightly overlapping for realistic rack
    
    // 10-ball rack positions (triangle formation)
    const rackPositions = [
      { x: rackApexX, y: rackApexY }, // Row 1: 1-ball (apex)
      { x: rackApexX + ballSpacing * 0.866, y: rackApexY - ballSpacing * 0.5 }, // Row 2: left
      { x: rackApexX + ballSpacing * 0.866, y: rackApexY + ballSpacing * 0.5 }, // Row 2: right
      { x: rackApexX + ballSpacing * 1.732, y: rackApexY - ballSpacing }, // Row 3: left
      { x: rackApexX + ballSpacing * 1.732, y: rackApexY }, // Row 3: center (10-ball)
      { x: rackApexX + ballSpacing * 1.732, y: rackApexY + ballSpacing }, // Row 3: right
      { x: rackApexX + ballSpacing * 2.598, y: rackApexY - ballSpacing * 1.5 }, // Row 4: left end
      { x: rackApexX + ballSpacing * 2.598, y: rackApexY - ballSpacing * 0.5 }, // Row 4: left center
      { x: rackApexX + ballSpacing * 2.598, y: rackApexY + ballSpacing * 0.5 }, // Row 4: right center
      { x: rackApexX + ballSpacing * 2.598, y: rackApexY + ballSpacing * 1.5 }  // Row 4: right end
    ];

    // Create object balls
    const ballNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    ballNumbers.forEach((number, index) => {
      const pos = rackPositions[index];
      const ball = Matter.Bodies.circle(
        pos.x,
        pos.y,
        BALL_RADIUS,
        {
          restitution: 0.9,
          friction: 0.1,
          frictionAir: 0.02,
          density: 0.001,
          render: { fillStyle: getBallColor(number) }
        }
      );
      ball.number = number;
      ball.visible = true;
      ball.pocketed = false;
      ballsRef.current[number] = ball;
      Matter.World.add(engine.world, ball);
    });

    // Set up collision detection
    Matter.Events.on(engine, 'collisionStart', handleCollision);
    
    return engine;
  }, []);

  // Get ball color for rendering
  const getBallColor = (number) => {
    const colors = {
      1: '#FFD700', 2: '#0000FF', 3: '#FF0000', 4: '#800080', 5: '#FFA500',
      6: '#008000', 7: '#8B4513', 8: '#000000', 9: '#FFFF00', 10: '#FF69B4'
    };
    return colors[number] || '#FFFFFF';
  };

  // Handle collisions
  const handleCollision = useCallback((event) => {
    const pairs = event.pairs;
    pairs.forEach((pair) => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for pocket collisions
      pocketsRef.current.forEach((pocket, pocketIndex) => {
        const distA = Matter.Vector.magnitude(Matter.Vector.sub(bodyA.position, { x: pocket.x, y: pocket.y }));
        const distB = Matter.Vector.magnitude(Matter.Vector.sub(bodyB.position, { x: pocket.x, y: pocket.y }));
        
        if (distA < POCKET_RADIUS && bodyA.number && bodyA.number !== 'cue') {
          handleBallPocketed(bodyA, pocketIndex);
        }
        if (distB < POCKET_RADIUS && bodyB.number && bodyB.number !== 'cue') {
          handleBallPocketed(bodyB, pocketIndex);
        }
      });
    });
  }, []);

  // Handle ball pocketed
  const handleBallPocketed = useCallback((ball, pocketIndex) => {
    if (ball.pocketed) return;
    
    ball.pocketed = true;
    ball.visible = false;
    Matter.World.remove(engineRef.current.world, ball);
    
    console.log(`Ball ${ball.number} pocketed in pocket ${pocketIndex}`);
    
    // Handle 10-ball win
    if (ball.number === 10) {
      if (calledBall === 10 && calledPocket === pocketIndex) {
        handleGameEnd(gameState.currentPlayer);
      } else {
        // Early 10-ball - game over
        handleGameEnd(gameState.currentPlayer === 1 ? 2 : 1);
      }
    }
  }, [calledBall, calledPocket, gameState.currentPlayer]);

  // Handle game end
  const handleGameEnd = useCallback((winner) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'end',
      player1Score: winner === 1 ? prev.player1Score + 1 : prev.player1Score,
      player2Score: winner === 2 ? prev.player2Score + 1 : prev.player2Score
    }));

    if (onGameEnd) {
      onGameEnd(winner);
    }
  }, [onGameEnd]);

  // Load images
  const loadImages = useCallback(async () => {
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    };

    // Load table image
    tableImageCache.current = await loadImage(predatorTable);

    // Load ball images
    for (const [key, src] of Object.entries(ballImages)) {
      imageCache.current[key] = await loadImage(src);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadImages().then(() => {
      const engine = initializePhysics();
      
      // Start animation loop
      const animate = () => {
        Matter.Engine.update(engine, 1000 / 60);
        render();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loadImages, initializePhysics]);

  // Render function
  const render = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw table
    if (tableImageCache.current) {
      ctx.drawImage(tableImageCache.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw balls
    Object.values(ballsRef.current).forEach(ball => {
      if (ball.visible && !ball.pocketed) {
        drawBall(ctx, ball);
      }
    });

    // Draw aim line
    if (showAimLine && !gameState.isAnimating && !aimLocked) {
      drawAimLine(ctx);
    }

    // Draw cue
    if (!gameState.isAnimating && !aimLocked) {
      drawCue(ctx);
    }
  }, [showAimLine, gameState.isAnimating, aimLocked]);

  // Draw ball
  const drawBall = useCallback((ctx, ball) => {
    const image = imageCache.current[ball.number] || imageCache.current.cue;
    if (image) {
      ctx.save();
      ctx.translate(ball.position.x, ball.position.y);
      ctx.rotate(ball.angle);
      ctx.drawImage(image, -BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      ctx.restore();
    }
  }, []);

  // Draw aim line
  const drawAimLine = useCallback((ctx) => {
    const cueBall = ballsRef.current.cue;
    if (!cueBall) return;

    const aimLength = 50 + power * 100;
    const endX = cueBall.position.x + Math.cos(aimAngle) * aimLength;
    const endY = cueBall.position.y + Math.sin(aimAngle) * aimLength;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cueBall.position.x, cueBall.position.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }, [aimAngle, power]);

  // Draw cue
  const drawCue = useCallback((ctx) => {
    const cueBall = ballsRef.current.cue;
    if (!cueBall) return;

    const cueLength = 80;
    const cueEndX = cueBall.position.x - Math.cos(aimAngle) * cueLength;
    const cueEndY = cueBall.position.y - Math.sin(aimAngle) * cueLength;

    ctx.save();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cueBall.position.x, cueBall.position.y);
    ctx.lineTo(cueEndX, cueEndY);
    ctx.stroke();
    ctx.restore();
  }, [aimAngle]);

  // Handle mouse events
  const handleMouseMove = useCallback((e) => {
    if (gameState.isAnimating || aimLocked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = ballsRef.current.cue;
    if (!cueBall) return;

    // Calculate aim angle
    const dx = x - cueBall.position.x;
    const dy = y - cueBall.position.y;
    const angle = Math.atan2(dy, dx);
    setAimAngle(angle);
  }, [gameState.isAnimating, aimLocked]);

  // Handle mouse click
  const handleMouseClick = useCallback((e) => {
    if (gameState.isAnimating) return;

    if (!aimLocked) {
      setAimLocked(true);
    } else {
      // Take shot
      const cueBall = ballsRef.current.cue;
      if (cueBall && engineRef.current) {
        const velocity = power * 800; // Adjust based on your needs
        const vx = Math.cos(aimAngle) * velocity;
        const vy = Math.sin(aimAngle) * velocity;
        
        // Apply english
        const englishX = Math.cos(englishDirection * Math.PI / 180) * english * 150;
        const englishY = Math.sin(englishDirection * Math.PI / 180) * english * 150;
        
        Matter.Body.setVelocity(cueBall, { x: vx + englishX, y: vy + englishY });
        
        setGameState(prev => ({ ...prev, isAnimating: true }));
        setAimLocked(false);
        setPower(0.5);
        setEnglish(0);
      }
    }
  }, [gameState.isAnimating, aimLocked, aimAngle, power, english, englishDirection]);

  // Handle key events
  const handleKeyDown = useCallback((e) => {
    if (gameState.isAnimating) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (!aimLocked) {
          setAimLocked(true);
        } else {
          // Take shot
          const cueBall = ballsRef.current.cue;
          if (cueBall && engineRef.current) {
            const velocity = power * 800;
            const vx = Math.cos(aimAngle) * velocity;
            const vy = Math.sin(aimAngle) * velocity;
            const englishX = Math.cos(englishDirection * Math.PI / 180) * english * 150;
            const englishY = Math.sin(englishDirection * Math.PI / 180) * english * 150;
            
            Matter.Body.setVelocity(cueBall, { x: vx + englishX, y: vy + englishY });
            setGameState(prev => ({ ...prev, isAnimating: true }));
            setAimLocked(false);
            setPower(0.5);
            setEnglish(0);
          }
        }
        break;
      case 'Escape':
        setAimLocked(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setPower(prev => Math.min(1, prev + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setPower(prev => Math.max(0, prev - 0.1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setEnglishDirection(prev => (prev - 10) % 360);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setEnglishDirection(prev => (prev + 10) % 360);
        break;
      case 'Shift':
        e.preventDefault();
        setEnglish(prev => Math.min(1, prev + 0.1));
        break;
      case 'Control':
        e.preventDefault();
        setEnglish(prev => Math.max(-1, prev - 0.1));
        break;
    }
  }, [gameState.isAnimating, aimLocked, aimAngle, power, english, englishDirection]);

  // Reset game
  const resetGame = useCallback(() => {
    if (engineRef.current) {
      // Remove all balls
      Object.values(ballsRef.current).forEach(ball => {
        Matter.World.remove(engineRef.current.world, ball);
      });
      
      // Reinitialize physics
      initializePhysics();
      
      setGameState(prev => ({
        ...prev,
        gamePhase: 'break',
        isAnimating: false,
        ballInHand: false,
        scratchOccurred: false,
        consecutiveFouls: { 1: 0, 2: 0 }
      }));
      setAimAngle(0);
      setPower(0.5);
      setEnglish(0);
      setEnglishDirection(0);
      setAimLocked(false);
      setCalledBall(null);
      setCalledPocket(null);
      setIsPushOut(false);
      setPushOutAvailable(false);
      setFirstShotAfterBreak(false);
    }
  }, [initializePhysics]);

  return (
    <div className={styles.gameContainer}>
      <canvas
        ref={canvasRef}
        width={TABLE_WIDTH}
        height={TABLE_HEIGHT}
        className={styles.gameCanvas}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
      
      {/* Game controls */}
      <div className={styles.gameControls}>
        <div className={styles.controlGroup}>
          <label>Power: {Math.round(power * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>
        
        <div className={styles.controlGroup}>
          <label>English: {english.toFixed(1)}</label>
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
        
        <div className={styles.controlGroup}>
          <label>English Direction: {englishDirection}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="10"
            value={englishDirection}
            onChange={(e) => setEnglishDirection(parseInt(e.target.value))}
            disabled={gameState.isAnimating}
          />
        </div>
      </div>

      {/* Game info */}
      <div className={styles.gameInfo}>
        <div className={styles.scoreBoard}>
          <div className={styles.playerScore}>
            <span>Player 1: {gameState.player1Score}</span>
          </div>
          <div className={styles.playerScore}>
            <span>Player 2: {gameState.player2Score}</span>
          </div>
        </div>
        
        <div className={styles.gameStatus}>
          <span>Current Player: {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
          {gameState.ballInHand && <span>Ball in Hand</span>}
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <p>Mouse: Aim | Click: Lock/Shoot | Space: Shoot | Arrow Keys: Adjust Power/English</p>
        <p>Shift/Ctrl: Adjust English | Escape: Cancel Shot</p>
      </div>
    </div>
  );
};

export default MatterPoolGameImproved;

