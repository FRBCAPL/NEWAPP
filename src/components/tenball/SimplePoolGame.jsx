import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const SimplePoolGame = () => {
  // Remove the console.log that's causing spam
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    balls: [],
    cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false },
    isAnimating: false,
    currentPlayer: 1,
    gamePhase: 'break'
  });
  
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [isAiming, setIsAiming] = useState(false);
  const [showAimLine, setShowAimLine] = useState(false);
  const [aimLocked, setAimLocked] = useState(false);
  const [lockedAimAngle, setLockedAimAngle] = useState(0);
  
  // Table dimensions (from working simulation)
  const TABLE_WIDTH = 600;
  const TABLE_HEIGHT = 300;
  const BALL_SIZE = 15;
  const BALL_RADIUS = BALL_SIZE / 2;
  const PLAYFIELD_OFFSET_X = 0;
  const PLAYFIELD_OFFSET_Y = 0;
  const CORNER_MARGIN_FACTOR = 3.0;
  const SIDE_MARGIN_FACTOR = 1.8;
  
  // Animation refs
  const animationFrame = useRef(null);
  
  // Ball images mapping
  const ballImages = {
    cue: cueBall,
    1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
    6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: tenBall
  };
  
     // Image cache
   const imageCache = useRef({});
   const tableImageCache = useRef(null);
  
     // Pocket detection (from working simulation)
   const isInPocket = useCallback((ball) => {
     const pockets = [
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * SIDE_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * SIDE_MARGIN_FACTOR }
     ];
     const cx = ball.x;
     const cy = ball.y;
     return pockets.some(
       pocket => Math.hypot(cx - pocket.x, cy - pocket.y) < pocket.margin + BALL_RADIUS * 0.85
     );
   }, []);
   
   // Multi-ball trajectory prediction system
   const predictAllBallTrajectories = useCallback((cueBallVx, cueBallVy) => {
     const trajectories = {};
     const friction = 0.99;
     const FELT_LEFT = 30.0;
     const FELT_RIGHT = 570.77;
     const FELT_TOP = 24.5;
     const FELT_BOTTOM = 270.18;
     
     // Ball colors for trajectory lines
     const ballColors = {
       1: '#ffff00', // Yellow
       2: '#0000ff', // Blue
       3: '#ff0000', // Red
       4: '#800080', // Purple
       5: '#ffa500', // Orange
       6: '#008000', // Green
       7: '#8b4513', // Brown
       8: '#000000', // Black
       9: '#ffff00', // Yellow stripe
       10: '#ff0000' // Red (10-ball)
     };
     
     // Simulate the entire shot sequence
     const simulateShot = () => {
       const ballStates = new Map();
       
       // Initialize all balls with current positions
       gameState.balls.forEach(ball => {
         if (ball.visible && !ball.pocketed) {
           ballStates.set(ball.id, {
             x: ball.x,
             y: ball.y,
             vx: 0,
             vy: 0,
             visible: true,
             trajectory: [{ x: ball.x, y: ball.y }]
           });
         }
       });
       
       // Add cue ball
       ballStates.set('cue', {
         x: gameState.cueBall.x,
         y: gameState.cueBall.y,
         vx: cueBallVx,
         vy: cueBallVy,
         visible: true,
         trajectory: [{ x: gameState.cueBall.x, y: gameState.cueBall.y }]
       });
       
                // Run physics simulation
         for (let step = 0; step < 500; step++) {
           const activeBalls = Array.from(ballStates.values()).filter(ball => ball.visible);
           
           // Update ball positions
           activeBalls.forEach(ball => {
             if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
               ball.vx = 0;
               ball.vy = 0;
               return;
             }
           
           // Apply friction
           ball.vx *= friction;
           ball.vy *= friction;
           
           // Calculate next position
           let nextX = ball.x + ball.vx;
           let nextY = ball.y + ball.vy;
           
                        // Check rail collisions
             let bounced = false;
             if (nextX < FELT_LEFT + BALL_RADIUS) {
               nextX = FELT_LEFT + BALL_RADIUS;
               ball.vx = Math.abs(ball.vx) * 0.85;
               bounced = true;
             } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
               nextX = FELT_RIGHT - BALL_RADIUS;
               ball.vx = -Math.abs(ball.vx) * 0.8;
               bounced = true;
             }
             
             if (nextY < FELT_TOP + BALL_RADIUS) {
               nextY = FELT_TOP + BALL_RADIUS;
               ball.vy = Math.abs(ball.vy) * 0.85;
               bounced = true;
             } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
               nextY = FELT_BOTTOM - BALL_RADIUS;
               ball.vy = -Math.abs(ball.vy) * 0.8;
               bounced = true;
             }
           
           // Check pocket detection
           const pocketBall = { x: nextX, y: nextY };
           if (isInPocket(pocketBall)) {
             ball.visible = false;
             ball.trajectory.push({ x: nextX, y: nextY, pocketed: true });
             return;
           }
           
                        // Update position
             ball.x = nextX;
             ball.y = nextY;
             ball.trajectory.push({ x: nextX, y: nextY, bounced });
         });
         
         // Check ball-ball collisions
         for (let i = 0; i < activeBalls.length; i++) {
           for (let j = i + 1; j < activeBalls.length; j++) {
             const ballA = activeBalls[i];
             const ballB = activeBalls[j];
             
             if (!ballA.visible || !ballB.visible) continue;
             
             const dx = ballB.x - ballA.x;
             const dy = ballB.y - ballA.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             
             if (dist < BALL_SIZE) {
               // Resolve collision
               const nx = dx / dist;
               const ny = dy / dist;
               
               const dvx = ballA.vx - ballB.vx;
               const dvy = ballA.vy - ballB.vy;
               const relVel = dvx * nx + dvy * ny;
               
               if (relVel > 0) {
                 const impulse = -relVel;
                 ballA.vx += impulse * nx;
                 ballA.vy += impulse * ny;
                 ballB.vx -= impulse * nx;
                 ballB.vy -= impulse * ny;
                 
                 // Mark collision point
                 ballA.trajectory[ballA.trajectory.length - 1].collision = true;
                 ballB.trajectory[ballB.trajectory.length - 1].collision = true;
               }
             }
           }
         }
         
                    // Stop if all balls are stationary
           const allStopped = activeBalls.every(ball => 
             Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01
           );
         
         if (allStopped) break;
       }
       
       // Convert to trajectories object
       ballStates.forEach((ball, id) => {
         if (ball.trajectory.length > 1) {
           trajectories[id] = {
             points: ball.trajectory,
             color: ballColors[id] || '#ffffff'
           };
         }
       });
     };
     
     simulateShot();
     return trajectories;
   }, [gameState.balls, gameState.cueBall, isInPocket]);
  
  // Ball collision resolution (from working simulation)
  const resolveBallCollision = useCallback((a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist >= BALL_SIZE) return;

    // 1. Resolve overlap
    const overlap = BALL_SIZE - dist + 0.01;
    const nx = dx / dist;
    const ny = dy / dist;
    a.x -= nx * (overlap / 2);
    a.y -= ny * (overlap / 2);
    b.x += nx * (overlap / 2);
    b.y += ny * (overlap / 2);

    // 2. Always update velocities (even if relVel ~ 0)
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const relVel = dvx * nx + dvy * ny;
    const impulse = -relVel || 0.01;
    a.vx += impulse * nx;
    a.vy += impulse * ny;
    b.vx -= impulse * nx;
    b.vy -= impulse * ny;

    a.isMoving = true;
    b.isMoving = true;
  }, []);
  
  // Initialize balls in 10-ball rack formation
  const initializeBalls = useCallback(() => {
    const balls = [];
    const rackApexX = TABLE_WIDTH * 0.75;
    const rackApexY = TABLE_HEIGHT / 2;
    const rackSpacingX = BALL_SIZE * 0.87;
    const rackSpacingY = BALL_SIZE / 2;

         function jitter() {
       return (Math.random() - 0.5) * 1.5;
     }

              // 10-ball rack formation (proper triangle, apex pointing toward cue ball)
     const rackPositions = [
       { x: rackApexX, y: rackApexY }, // 1-ball (apex) - front center
       { x: rackApexX + BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.48 }, // Row 2 left
       { x: rackApexX + BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.48 }, // Row 2 right
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.95 }, // Row 3 left
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY }, // 10-ball (middle)
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.95 }, // Row 3 right
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 1.43 }, // Row 4 left (2-ball corner)
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.48 }, // Row 4 center-left
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.48 }, // Row 4 center-right
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 1.43 }  // Row 4 right (3-ball corner)
     ];

     // Official CSI 10-ball rack order: 1 at front, 10 in middle, 2&3 in back corners, rest random
     const backCornerPositions = [
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 1.43 }, // Back left corner (2-ball)
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 1.43 }  // Back right corner (3-ball)
     ];
     
     // Randomly place 2 and 3 in back corners
     const cornerBalls = [2, 3];
     const shuffledCorners = cornerBalls.sort(() => Math.random() - 0.5);
     
     // Create random order for balls 4-9
     const remainingBalls = [4, 5, 6, 7, 8, 9];
     const shuffledRemaining = remainingBalls.sort(() => Math.random() - 0.5);
     
     // Final ball order: 1, 10, 2&3 in corners, rest random
     const ballOrder = [1, 10, ...shuffledCorners, ...shuffledRemaining];

         // Place balls according to CSI rules
     ballOrder.forEach((ballId, index) => {
       let position;
       
       if (index === 0) {
         // 1-ball at apex
         position = rackPositions[0];
       } else if (index === 1) {
         // 10-ball in middle (third row center)
         position = rackPositions[4];
       } else if (index === 2 || index === 3) {
         // 2 and 3 balls in back corners (last row)
         const cornerIndex = index - 2;
         position = backCornerPositions[cornerIndex];
                } else {
           // Remaining balls (4-9) in random positions
           const remainingPositions = [
             rackPositions[1], // Row 2 left
             rackPositions[2], // Row 2 right
             rackPositions[3], // Row 3 left (but not center - that's 10-ball)
             rackPositions[5], // Row 3 right
             rackPositions[7], // Row 4 center-left
             rackPositions[8]  // Row 4 center-right
           ];
           position = remainingPositions[index - 4];
         }
       
       if (position) {
         balls.push({
           id: ballId,
           x: position.x + jitter(),
           y: position.y + jitter(),
           vx: 0,
           vy: 0,
           visible: true,
           pocketed: false,
           isMoving: false
         });
       }
     });

    return balls;
  }, []);
  
  // Main animation loop (from working simulation)
  const animateBalls = useCallback(() => {
    const friction = 0.99;
    const subSteps = 16;

    // Felt bounds in simulation coordinates (from working simulation)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;

    function step() {
      let pocketedThisFrame = [];

      for (let s = 0; s < subSteps; s++) {
        // Update cue ball
        if (gameState.cueBall.visible) {
          let nextX = gameState.cueBall.x + gameState.cueBall.vx / subSteps;
          let nextY = gameState.cueBall.y + gameState.cueBall.vy / subSteps;

          // Rail collision using felt bounds
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            gameState.cueBall.x = FELT_LEFT + BALL_RADIUS;
            gameState.cueBall.vx = Math.abs(gameState.cueBall.vx) * 0.85;
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            gameState.cueBall.x = FELT_RIGHT - BALL_RADIUS;
            gameState.cueBall.vx = -Math.abs(gameState.cueBall.vx) * 0.8;
          } else {
            gameState.cueBall.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            gameState.cueBall.y = FELT_TOP + BALL_RADIUS;
            gameState.cueBall.vy = Math.abs(gameState.cueBall.vy) * 0.85;
          } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
            gameState.cueBall.y = FELT_BOTTOM - BALL_RADIUS;
            gameState.cueBall.vy = -Math.abs(gameState.cueBall.vy) * 0.8;
          } else {
            gameState.cueBall.y = nextY;
          }

          // Apply friction
          gameState.cueBall.vx *= Math.pow(friction, 1 / subSteps);
          gameState.cueBall.vy *= Math.pow(friction, 1 / subSteps);

          // Pocket detection
          if (isInPocket(gameState.cueBall)) {
            gameState.cueBall.isMoving = false;
            gameState.cueBall.visible = false;
          }

          // Stop if very slow
          if (gameState.cueBall.isMoving && Math.abs(gameState.cueBall.vx) < 0.03 && Math.abs(gameState.cueBall.vy) < 0.03) {
            gameState.cueBall.vx = 0;
            gameState.cueBall.vy = 0;
            gameState.cueBall.isMoving = false;
          }
        }

        // Update other balls
        gameState.balls.forEach(ball => {
          if (!ball.visible) return;

          let nextX = ball.x + ball.vx / subSteps;
          let nextY = ball.y + ball.vy / subSteps;

          // Rail collision using felt bounds
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            ball.x = FELT_LEFT + BALL_RADIUS;
            ball.vx = Math.abs(ball.vx) * 0.85;
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            ball.x = FELT_RIGHT - BALL_RADIUS;
            ball.vx = -Math.abs(ball.vx) * 0.8;
          } else {
            ball.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            ball.y = FELT_TOP + BALL_RADIUS;
            ball.vy = Math.abs(ball.vy) * 0.85;
          } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
            ball.y = FELT_BOTTOM - BALL_RADIUS;
            ball.vy = -Math.abs(ball.vy) * 0.8;
          } else {
            ball.y = nextY;
          }

          // Apply friction
          ball.vx *= Math.pow(friction, 1 / subSteps);
          ball.vy *= Math.pow(friction, 1 / subSteps);

          // Pocket detection
          if (isInPocket(ball)) {
            ball.isMoving = false;
            ball.visible = false;
            ball.pocketed = true;
            if (!pocketedThisFrame.includes(ball.id)) pocketedThisFrame.push(ball.id);
          }

          // Stop if very slow
          if (ball.isMoving && Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
          }
        });

        // Ball-ball collision
        if (gameState.cueBall.visible) {
          gameState.balls.forEach(ball => {
            if (ball.visible) {
              resolveBallCollision(gameState.cueBall, ball);
            }
          });
        }

        gameState.balls.forEach((ball1, i) => {
          if (!ball1.visible) return;
          gameState.balls.slice(i + 1).forEach(ball2 => {
            if (ball2.visible) {
              resolveBallCollision(ball1, ball2);
            }
          });
        });
      }

      // Check if all balls stopped
      const allStopped = gameState.balls.every(ball => !ball.isMoving) && !gameState.cueBall.isMoving;

      setGameState(prev => ({
        ...prev,
        isAnimating: !allStopped
      }));

      // Continue animation if any balls moving
      if (!allStopped) {
        animationFrame.current = requestAnimationFrame(step);
      }
    }

    animationFrame.current = requestAnimationFrame(step);
  }, [gameState, isInPocket, resolveBallCollision]);
  
  // Universal aiming system (works on both PC and mobile)
  const handlePointerDown = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    // Lock the current aim angle
    setAimLocked(true);
    setLockedAimAngle(aimAngle);
    setShowAimLine(true);
  }, [gameState.isAnimating, aimAngle]);
  
  const handlePointerMove = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = gameState.cueBall;
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
    
    // Show aim line when pointer is over the table
    if (!aimLocked) {
      setShowAimLine(true);
    }
  }, [gameState.isAnimating, gameState.cueBall.x, gameState.cueBall.y, aimLocked]);
  
  const handlePointerLeave = useCallback(() => {
    if (!aimLocked) {
      setShowAimLine(false);
    }
  }, [aimLocked]);
  
  // Touch-specific handlers for better mobile support
  const handleTouchStart = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const cueBall = gameState.cueBall;
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
    setAimLocked(true);
    setLockedAimAngle(angle);
    setShowAimLine(true);
  }, [gameState.isAnimating, gameState.cueBall.x, gameState.cueBall.y]);
  
  const handleTouchMove = useCallback((e) => {
    if (gameState.isAnimating || !aimLocked) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const cueBall = gameState.cueBall;
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
    setLockedAimAngle(angle);
  }, [gameState.isAnimating, aimLocked, gameState.cueBall.x, gameState.cueBall.y]);
  
  const handleTouchEnd = useCallback((e) => {
    // Keep aim locked for touch - user will use shoot button
  }, []);
  
  const handleShoot = useCallback(() => {
    if (gameState.isAnimating || !aimLocked) return;
    
    // Execute shot
    const cueBall = gameState.cueBall;
    const speed = power * 12; // Good speed for realistic play
    
    setGameState(prev => ({
      ...prev,
      cueBall: {
        ...prev.cueBall,
        vx: Math.cos(lockedAimAngle) * speed,
        vy: Math.sin(lockedAimAngle) * speed,
        isMoving: true
      },
      isAnimating: true
    }));
    
    // Reset aiming state
    setAimLocked(false);
    // setShowAimLine(false); // Keep aim line visible during and after shot
  }, [gameState.isAnimating, aimLocked, gameState.cueBall, power, lockedAimAngle]);
  
  const handleResetAim = useCallback(() => {
    setAimLocked(false);
    setShowAimLine(false);
  }, []);
  
  // Initialize game
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      balls: initializeBalls()
    }));
  }, [initializeBalls]);
  
  // Physics animation loop
  useEffect(() => {
    if (!gameState.isAnimating) return;
    
    animateBalls();
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameState.isAnimating, animateBalls]);
  
  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
    // Draw table background
    if (tableImageCache.current) {
      ctx.drawImage(tableImageCache.current, 0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    } else {
      // Fallback background
      ctx.fillStyle = '#0d5c0d';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    }
    
    // Draw pockets
    const pockets = [
      { x: 0, y: 0 },
      { x: TABLE_WIDTH / 2, y: 0 },
      { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH, y: TABLE_HEIGHT }
    ];
    
    pockets.forEach(pocket => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 20, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw balls
    const drawBall = (ball, imageSrc) => {
      if (!imageCache.current[imageSrc]) {
        const img = new Image();
        img.onload = () => {
          imageCache.current[imageSrc] = img;
          drawBall(ball, imageSrc);
        };
        img.src = imageSrc;
      } else {
        const img = imageCache.current[imageSrc];
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, ball.x - BALL_RADIUS, ball.y - BALL_RADIUS, BALL_SIZE, BALL_SIZE);
        ctx.restore();
      }
    };
    
    // Draw other balls
    gameState.balls.forEach(ball => {
      if (ball.visible && !ball.pocketed) {
        drawBall(ball, ballImages[ball.id]);
      }
    });
    
         // Draw multi-ball trajectory predictions FIRST (before balls)
     if (showAimLine && !gameState.isAnimating) {
       const cueBall = gameState.cueBall;
       const currentAngle = aimLocked ? lockedAimAngle : aimAngle;
       
       // Calculate initial velocity based on power
       const baseSpeed = power * 12;
       const startVx = Math.cos(currentAngle) * baseSpeed;
       const startVy = Math.sin(currentAngle) * baseSpeed;
       
       // Predict all ball trajectories
       const allTrajectories = predictAllBallTrajectories(startVx, startVy);
       
       // Draw each ball's trajectory (only show significant ones)
       Object.entries(allTrajectories).forEach(([ballId, trajectory]) => {
         // At higher power, only show trajectories that travel a longer distance
         const minPoints = power > 0.7 ? 8 : 3;
         if (trajectory.points.length > minPoints) {
           ctx.save();
           ctx.strokeStyle = trajectory.color;
           ctx.lineWidth = 2;
           // Reduce opacity more at higher power to prevent clutter
           const powerFactor = Math.max(0.3, 0.8 - (power * 0.4));
           ctx.globalAlpha = powerFactor;
           ctx.setLineDash([]);
           
           ctx.beginPath();
           ctx.moveTo(trajectory.points[0].x, trajectory.points[0].y);
           
           // Draw trajectory path (skip some points to reduce density)
           for (let i = 1; i < trajectory.points.length; i += 2) {
             const point = trajectory.points[i];
             ctx.lineTo(point.x, point.y);
           }
           
           // Draw final point
           const lastPoint = trajectory.points[trajectory.points.length - 1];
           ctx.lineTo(lastPoint.x, lastPoint.y);
           
           ctx.stroke();
           ctx.restore();
           
           // Draw collision indicators (only for significant collisions)
           for (let i = 1; i < trajectory.points.length; i++) {
             const point = trajectory.points[i];
             if (point.collision) {
               ctx.save();
               ctx.fillStyle = trajectory.color;
               ctx.globalAlpha = 0.6;
               ctx.beginPath();
               ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
               ctx.fill();
               ctx.restore();
             }
             
             // Draw pocket indicators
             if (point.pocketed) {
               ctx.save();
               ctx.fillStyle = '#00ff00';
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
               ctx.fill();
               ctx.restore();
               break;
             }
           }
         }
       });
     }
      
      // Draw cue ball LAST (on top of everything, without measles effect)
      if (gameState.cueBall.visible) {
        const ball = gameState.cueBall;
        const imageSrc = ballImages.cue;
        
        if (!imageCache.current[imageSrc]) {
          const img = new Image();
          img.onload = () => {
            imageCache.current[imageSrc] = img;
            draw();
          };
          img.src = imageSrc;
        } else {
          const img = imageCache.current[imageSrc];
          ctx.save();
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(img, ball.x - BALL_RADIUS, ball.y - BALL_RADIUS, BALL_SIZE, BALL_SIZE);
          ctx.restore();
        }
      }
     }, [gameState, showAimLine, aimAngle, ballImages, power, aimLocked, lockedAimAngle, predictAllBallTrajectories]);
  
  // Draw on state changes - only when necessary
  useEffect(() => {
    draw();
  }, [gameState.isAnimating, showAimLine, aimAngle, power, aimLocked, lockedAimAngle]);
  
  // Load table image
  useEffect(() => {
    const tableImg = new Image();
    tableImg.onload = () => {
      tableImageCache.current = tableImg;
      draw();
    };
    tableImg.src = predatorTable;
  }, [draw]);
  
  // Add touch event listeners with non-passive option
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchStartNonPassive = (e) => {
      e.preventDefault();
      handleTouchStart(e);
    };
    
    const handleTouchMoveNonPassive = (e) => {
      e.preventDefault();
      handleTouchMove(e);
    };
    
    const handleTouchEndNonPassive = (e) => {
      e.preventDefault();
      handleTouchEnd(e);
    };
    
    canvas.addEventListener('touchstart', handleTouchStartNonPassive, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });
    canvas.addEventListener('touchend', handleTouchEndNonPassive, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStartNonPassive);
      canvas.removeEventListener('touchmove', handleTouchMoveNonPassive);
      canvas.removeEventListener('touchend', handleTouchEndNonPassive);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return (
    <div className={styles.simplePoolGame}>
      <div className={styles.tableContainer}>
                 <canvas
           ref={canvasRef}
           width={TABLE_WIDTH}
           height={TABLE_HEIGHT}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerLeave={handlePointerLeave}
           className={styles.tableCanvas}
         />
      </div>
      
             <div className={styles.controls}>
         <div className={styles.shootControl}>
           <button 
             className={`${styles.shootButton} ${!aimLocked || gameState.isAnimating ? styles.disabled : ''}`}
             onClick={handleShoot}
             disabled={!aimLocked || gameState.isAnimating}
           >
             {aimLocked ? 'SHOOT!' : 'Aim & Click to Lock'}
           </button>
         </div>
         
         <div className={styles.powerControl}>
           <label>Power: {Math.round(power * 100)}%</label>
           <input
             type="range"
             min="0.1"
             max="1"
             step="0.01"
             value={power}
             onChange={(e) => setPower(parseFloat(e.target.value))}
             className={styles.powerSlider}
           />
         </div>
         
         <div className={styles.gameInfo}>
           <span>Player: {gameState.currentPlayer}</span>
           <span>Phase: {gameState.gamePhase}</span>
           <span>Status: {gameState.isAnimating ? 'Animating' : aimLocked ? 'Aim Locked' : 'Ready'}</span>
         </div>
         
         <div className={styles.buttonRow}>
           <button 
             className={styles.resetAimButton}
             onClick={handleResetAim}
             disabled={gameState.isAnimating}
           >
             Reset Aim
           </button>
           
           <button 
             className={styles.resetButton}
             onClick={() => {
               setGameState(prev => ({
                 ...prev,
                 balls: initializeBalls(),
                 cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false },
                 isAnimating: false
               }));
               setAimLocked(false);
               setShowAimLine(false);
             }}
           >
             Reset Game
           </button>
         </div>
       </div>
    </div>
  );
};

export default SimplePoolGame; 