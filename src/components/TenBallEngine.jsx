import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './TenBallEngine.module.css';

// Import ball assets
import ball1 from '../assets/balls/1ball.svg';
import ball2 from '../assets/balls/2ball.svg';
import ball3 from '../assets/balls/3ball.svg';
import ball4 from '../assets/balls/4ball.svg';
import ball5 from '../assets/balls/5ball.svg';
import ball6 from '../assets/balls/6ball.svg';
import ball7 from '../assets/balls/7ball.svg';
import ball8 from '../assets/balls/8ball.svg';
import ball9 from '../assets/balls/9ball.svg';
import ball10 from '../assets/balls/10ball.svg';
import cueBall from '../assets/cueball.svg';

// Ball asset mapping
const BALL_ASSETS = {
  1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
  6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: ball10,
  cue: cueBall
};

// Game constants
const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 400;
const BALL_SIZE = 20;
const BALL_RADIUS = BALL_SIZE / 2;
const POCKET_RADIUS = 25;

// Physics constants
const FRICTION = 0.985;
const RAIL_BOUNCE = 0.8;
const BALL_BOUNCE = 0.9;

// Pocket positions
const POCKETS = [
  { x: 25, y: 25, type: 'corner' },           // Top-left
  { x: TABLE_WIDTH - 25, y: 25, type: 'corner' },      // Top-right
  { x: 25, y: TABLE_HEIGHT - 25, type: 'corner' },     // Bottom-left
  { x: TABLE_WIDTH - 25, y: TABLE_HEIGHT - 25, type: 'corner' }, // Bottom-right
  { x: TABLE_WIDTH / 2, y: 25, type: 'side' },         // Top-middle
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 25, type: 'side' }     // Bottom-middle
];

const TenBallEngine = forwardRef(({
  gameMode,
  gameState,
  onGameStateChange,
  onPlayerWin,
  difficulty = 'medium',
  playerNames
}, ref) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const ballsRef = useRef([]);
  const gameStateRef = useRef(gameState);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cueLineRef = useRef({ visible: false, startX: 0, startY: 0, endX: 0, endY: 0 });
  const [showCallShot, setShowCallShot] = useState(false);
  const [callShotData, setCallShotData] = useState({ ball: null, pocket: null });

  // Initialize balls for ten ball
  const initializeBalls = () => {
    // Ten ball rack formation (triangle)
    const rackX = TABLE_WIDTH * 0.7;
    const rackY = TABLE_HEIGHT / 2;
    const spacing = BALL_SIZE * 1.1;
    
    const balls = [
      // Cue ball
      {
        id: 'cue',
        number: 'cue',
        x: TABLE_WIDTH * 0.25,
        y: TABLE_HEIGHT / 2,
        vx: 0,
        vy: 0,
        visible: true,
        pocketed: false
      }
    ];

    // Ten ball rack formation according to CSI rules
    const rackPositions = [
      // Row 1 (apex)
      { number: 1, row: 0, pos: 0 },
      // Row 2
      { number: 2, row: 1, pos: 0 },
      { number: 3, row: 1, pos: 1 },
      // Row 3
      { number: 4, row: 2, pos: 0 },
      { number: 10, row: 2, pos: 1 }, // 10-ball in middle
      { number: 5, row: 2, pos: 2 },
      // Row 4
      { number: 6, row: 3, pos: 0 },
      { number: 7, row: 3, pos: 1 },
      { number: 8, row: 3, pos: 2 },
      { number: 9, row: 3, pos: 3 }
    ];

    rackPositions.forEach(({ number, row, pos }) => {
      const offsetY = (pos - row/2) * spacing;
      balls.push({
        id: number,
        number: number,
        x: rackX + row * spacing * 0.87,
        y: rackY + offsetY,
        vx: 0,
        vy: 0,
        visible: true,
        pocketed: false
      });
    });

    ballsRef.current = balls;
    return balls;
  };

  // Game state management
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Initialize game
  useEffect(() => {
    const balls = initializeBalls();
    onGameStateChange({
      balls: balls,
      isBreak: true,
      currentShooter: 1,
      gamePhase: 'break'
    });
  }, []);

  // Physics engine
  const updatePhysics = () => {
    const balls = ballsRef.current;
    let anyMoving = false;

    // Update ball positions
    balls.forEach(ball => {
      if (!ball.visible || ball.pocketed) return;

      // Apply velocity
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Apply friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // Check if ball is moving
      if (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1) {
        anyMoving = true;
      } else {
        ball.vx = 0;
        ball.vy = 0;
      }

      // Rail collisions
      if (ball.x < BALL_RADIUS + 30) {
        ball.x = BALL_RADIUS + 30;
        ball.vx = Math.abs(ball.vx) * RAIL_BOUNCE;
      }
      if (ball.x > TABLE_WIDTH - BALL_RADIUS - 30) {
        ball.x = TABLE_WIDTH - BALL_RADIUS - 30;
        ball.vx = -Math.abs(ball.vx) * RAIL_BOUNCE;
      }
      if (ball.y < BALL_RADIUS + 30) {
        ball.y = BALL_RADIUS + 30;
        ball.vy = Math.abs(ball.vy) * RAIL_BOUNCE;
      }
      if (ball.y > TABLE_HEIGHT - BALL_RADIUS - 30) {
        ball.y = TABLE_HEIGHT - BALL_RADIUS - 30;
        ball.vy = -Math.abs(ball.vy) * RAIL_BOUNCE;
      }

      // Pocket detection
      POCKETS.forEach(pocket => {
        const dist = Math.hypot(ball.x - pocket.x, ball.y - pocket.y);
        if (dist < POCKET_RADIUS) {
          ball.visible = false;
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          
          // Handle ball pocketed
          handleBallPocketed(ball);
        }
      });
    });

    // Ball-ball collisions
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const ballA = balls[i];
        const ballB = balls[j];
        
        if (!ballA.visible || !ballB.visible || ballA.pocketed || ballB.pocketed) continue;

        const dx = ballB.x - ballA.x;
        const dy = ballB.y - ballA.y;
        const dist = Math.hypot(dx, dy);

        if (dist < BALL_SIZE) {
          // Resolve collision
          const overlap = BALL_SIZE - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Separate balls
          const separation = overlap / 2;
          ballA.x -= nx * separation;
          ballA.y -= ny * separation;
          ballB.x += nx * separation;
          ballB.y += ny * separation;

          // Exchange velocities
          const relativeVx = ballA.vx - ballB.vx;
          const relativeVy = ballA.vy - ballB.vy;
          const impulse = (relativeVx * nx + relativeVy * ny) * BALL_BOUNCE;

          ballA.vx -= impulse * nx;
          ballA.vy -= impulse * ny;
          ballB.vx += impulse * nx;
          ballB.vy += impulse * ny;
        }
      }
    }

    // If no balls moving, handle turn end
    if (!anyMoving && gameStateRef.current.gamePhase !== 'break') {
      handleTurnEnd();
    }

    return anyMoving;
  };

  // Handle ball pocketed
  const handleBallPocketed = (ball) => {
    const currentGame = gameStateRef.current;
    
    if (ball.number === 'cue') {
      // Cue ball pocketed - foul
      handleFoul('scratch');
    } else if (ball.number === 10) {
      // 10-ball pocketed
      if (currentGame.gamePhase === 'break') {
        // 10-ball on break - spot it
        spotBall(ball);
      } else if (getLowestBallNumber() === 10) {
        // Legal 10-ball win
        onPlayerWin(currentGame.currentShooter);
      } else {
        // Early 10-ball - spot it
        spotBall(ball);
      }
    } else {
      // Regular numbered ball
      if (currentGame.gamePhase !== 'break' && !isCorrectBallFirst(ball.number)) {
        // Wrong ball first - foul
        handleFoul('wrongBall');
      }
    }
  };

  // Spot a ball (place back on table)
  const spotBall = (ball) => {
    ball.visible = true;
    ball.pocketed = false;
    ball.x = TABLE_WIDTH * 0.7;
    ball.y = TABLE_HEIGHT / 2;
    ball.vx = 0;
    ball.vy = 0;
  };

  // Get lowest numbered ball still on table
  const getLowestBallNumber = () => {
    const visibleBalls = ballsRef.current.filter(b => b.visible && b.number !== 'cue' && !b.pocketed);
    if (visibleBalls.length === 0) return null;
    
    const numbers = visibleBalls.map(b => parseInt(b.number)).filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.min(...numbers) : null;
  };

  // Check if correct ball was hit first
  const isCorrectBallFirst = (ballNumber) => {
    const lowestBall = getLowestBallNumber();
    return parseInt(ballNumber) === lowestBall;
  };

  // Handle fouls
  const handleFoul = (foulType) => {
    const currentGame = gameStateRef.current;
    const currentPlayer = currentGame.currentShooter;
    const newFouls = { ...currentGame.successivefouls };
    newFouls[`player${currentPlayer}`] = (newFouls[`player${currentPlayer}`] || 0) + 1;

    // Check for three successive fouls
    if (newFouls[`player${currentPlayer}`] >= 3) {
      onPlayerWin(currentPlayer === 1 ? 2 : 1);
      return;
    }

    // Switch players and give ball in hand
    const nextShooter = currentPlayer === 1 ? 2 : 1;
    
    onGameStateChange({
      currentShooter: nextShooter,
      gamePhase: 'normalPlay',
      successivefouls: newFouls,
      ballInHand: true
    });

    // Reset cue ball if scratched
    if (foulType === 'scratch') {
      const cueBall = ballsRef.current.find(b => b.number === 'cue');
      if (cueBall) {
        cueBall.visible = true;
        cueBall.pocketed = false;
        cueBall.x = TABLE_WIDTH * 0.25;
        cueBall.y = TABLE_HEIGHT / 2;
        cueBall.vx = 0;
        cueBall.vy = 0;
      }
    }
  };

  // Handle turn end
  const handleTurnEnd = () => {
    const currentGame = gameStateRef.current;
    
    // Check for game ending conditions
    const tenBall = ballsRef.current.find(b => b.number === 10);
    if (!tenBall || !tenBall.visible) {
      // Game may be over - check if it was legal
      if (getLowestBallNumber() === null || getLowestBallNumber() === 10) {
        onPlayerWin(currentGame.currentShooter);
        return;
      }
    }

    // Normal turn switch
    const nextShooter = currentGame.currentShooter === 1 ? 2 : 1;
    onGameStateChange({
      currentShooter: nextShooter,
      gamePhase: 'normalPlay',
      ballInHand: false
    });

    // AI turn
    if (gameMode === 'singlePlayer' && nextShooter === 2) {
      setTimeout(() => aiTakeShot(), 1000);
    }
  };

  // AI shooting logic
  const aiTakeShot = () => {
    const cueBall = ballsRef.current.find(b => b.number === 'cue');
    const lowestBall = getLowestBallNumber();
    const targetBall = ballsRef.current.find(b => b.number === lowestBall);

    if (!cueBall || !targetBall) return;

    // Simple AI - aim for the target ball with some variation based on difficulty
    const dx = targetBall.x - cueBall.x;
    const dy = targetBall.y - cueBall.y;
    const angle = Math.atan2(dy, dx);
    
    // Add randomness based on difficulty
    const errorFactor = {
      easy: 0.3,
      medium: 0.2,
      hard: 0.1,
      expert: 0.05
    }[difficulty];
    
    const finalAngle = angle + (Math.random() - 0.5) * errorFactor;
    const power = 8 + Math.random() * 4;

    cueBall.vx = Math.cos(finalAngle) * power;
    cueBall.vy = Math.sin(finalAngle) * power;
  };

  // Render function
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Draw table background
    ctx.fillStyle = '#0d5d2b';
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Draw rails
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, TABLE_WIDTH, 30);
    ctx.fillRect(0, TABLE_HEIGHT - 30, TABLE_WIDTH, 30);
    ctx.fillRect(0, 0, 30, TABLE_HEIGHT);
    ctx.fillRect(TABLE_WIDTH - 30, 0, 30, TABLE_HEIGHT);

    // Draw pockets
    ctx.fillStyle = '#000';
    POCKETS.forEach(pocket => {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw aiming line
    if (cueLineRef.current.visible) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cueLineRef.current.startX, cueLineRef.current.startY);
      ctx.lineTo(cueLineRef.current.endX, cueLineRef.current.endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw balls
    ballsRef.current.forEach(ball => {
      if (!ball.visible || ball.pocketed) return;

      const img = new Image();
      img.src = BALL_ASSETS[ball.number];
      
      ctx.drawImage(
        img,
        ball.x - BALL_RADIUS,
        ball.y - BALL_RADIUS,
        BALL_SIZE,
        BALL_SIZE
      );
    });
  };

  // Animation loop
  const animate = () => {
    const stillMoving = updatePhysics();
    render();
    
    if (stillMoving) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Mouse/touch event handlers
  const handleMouseDown = (e) => {
    if (gameStateRef.current.currentShooter !== 1 && gameMode === 'singlePlayer') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current.find(b => b.number === 'cue');
    if (!cueBall) return;
    
    const dist = Math.hypot(x - cueBall.x, y - cueBall.y);
    if (dist < BALL_RADIUS + 10) {
      isDraggingRef.current = true;
      dragStartRef.current = { x, y };
      cueLineRef.current = {
        visible: true,
        startX: cueBall.x,
        startY: cueBall.y,
        endX: x,
        endY: y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current.find(b => b.number === 'cue');
    if (cueBall) {
      cueLineRef.current.endX = x;
      cueLineRef.current.endY = y;
      render();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDraggingRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = ballsRef.current.find(b => b.number === 'cue');
    if (cueBall) {
      const dx = x - cueBall.x;
      const dy = y - cueBall.y;
      const dist = Math.hypot(dx, dy);
      const power = Math.min(dist / 20, 15);
      
      cueBall.vx = -dx / dist * power;
      cueBall.vy = -dy / dist * power;
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    isDraggingRef.current = false;
    cueLineRef.current.visible = false;
    render();
  };

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = TABLE_WIDTH;
    canvas.height = TABLE_HEIGHT;
    
    render();

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvas.dispatchEvent(mouseEvent);
    });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    rackBalls: initializeBalls,
    getCurrentBalls: () => ballsRef.current
  }));

  return (
    <div className={styles.gameEngine}>
      <canvas
        ref={canvasRef}
        className={styles.gameCanvas}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '2px solid #8B4513',
          borderRadius: '8px'
        }}
      />
      
      {showCallShot && (
        <div className={styles.callShotModal}>
          <h3>Call Your Shot</h3>
          <p>Which ball and pocket?</p>
          {/* Call shot interface would go here */}
          <button onClick={() => setShowCallShot(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
});

export default TenBallEngine;