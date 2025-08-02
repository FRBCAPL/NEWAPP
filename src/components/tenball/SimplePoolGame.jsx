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
  console.log('🎯 SimplePoolGame component loaded with Miniclip-style mechanics!');
  const canvasRef = useRef(null);
  
  // Enhanced game state with Miniclip-style features
  const [gameState, setGameState] = useState({
    balls: [],
    cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false },
    isAnimating: false,
    currentPlayer: 1,
    gamePhase: 'break'
  });
  
  // Miniclip-style aiming and control system
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [spin, setSpin] = useState({ x: 0, y: 0 }); // English/spin control
  const [isAiming, setIsAiming] = useState(false);
  const [showAimLine, setShowAimLine] = useState(false);
  const [aimLocked, setAimLocked] = useState(false);
  const [lockedAimAngle, setLockedAimAngle] = useState(0);
  
  // Cue attributes (Miniclip style)
  const [cueStats, setCueStats] = useState({
    force: 7,    // Affects maximum power
    spin: 6,     // Affects maximum spin amount
    aim: 8,      // Affects aim line length  
    time: 5      // Affects shot timer (not implemented yet)
  });
  
  // Visual feedback states
  const [showSpinControl, setShowSpinControl] = useState(false);
  const [showPowerBar, setShowPowerBar] = useState(false);
  const [trajectory, setTrajectory] = useState([]);
  
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
   
     // Enhanced Miniclip-style trajectory prediction with spin effects
  const predictTrajectory = useCallback((startX, startY, angle, power, spinData, maxSteps = 150) => {
    const trajectory = [{ x: startX, y: startY }];
    let x = startX;
    let y = startY;
    
    // Calculate initial velocity with spin effects
    const basePower = power * (cueStats.force / 10) * 15; // Cue force affects power
    let vx = Math.cos(angle) * basePower;
    let vy = Math.sin(angle) * basePower;
    
    // Apply spin effects (English)
    const spinMultiplier = cueStats.spin / 10;
    vx += spinData.x * basePower * 0.2 * spinMultiplier;
    vy += spinData.y * basePower * 0.2 * spinMultiplier;
    
    const friction = 0.99;
    let spinDecay = 0.98; // Spin gradually reduces
    let currentSpin = { x: spinData.x, y: spinData.y };
    
    console.log('🎯 Enhanced trajectory prediction:', {
      startX, startY, angle, power, spin: spinData, 
      initialSpeed: Math.sqrt(vx * vx + vy * vy),
      cueStats
    });
    
    // Felt bounds (same as in animation)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;
    
    for (let step = 0; step < maxSteps; step++) {
      // Apply friction
      vx *= friction;
      vy *= friction;
      
      // Apply spin effects during motion
      if (Math.abs(currentSpin.x) > 0.01 || Math.abs(currentSpin.y) > 0.01) {
        vx += currentSpin.x * 0.1;
        vy += currentSpin.y * 0.1;
        currentSpin.x *= spinDecay;
        currentSpin.y *= spinDecay;
      }
      
      // Stop if very slow
      if (Math.abs(vx) < 0.03 && Math.abs(vy) < 0.03) {
        break;
      }
      
      // Calculate next position
      let nextX = x + vx;
      let nextY = y + vy;
      
      // Enhanced rail collision with spin effects
      let bounced = false;
      
      if (nextX < FELT_LEFT + BALL_RADIUS) {
        nextX = FELT_LEFT + BALL_RADIUS;
        vx = Math.abs(vx) * 0.85;
        // Side spin affects rail bounce
        if (currentSpin.x < 0) vy += currentSpin.x * 2; // Left spin affects vertical bounce
        bounced = true;
      } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
        nextX = FELT_RIGHT - BALL_RADIUS;
        vx = -Math.abs(vx) * 0.8;
        // Side spin affects rail bounce  
        if (currentSpin.x > 0) vy += currentSpin.x * 2; // Right spin affects vertical bounce
        bounced = true;
      }
      
      if (nextY < FELT_TOP + BALL_RADIUS) {
        nextY = FELT_TOP + BALL_RADIUS;
        vy = Math.abs(vy) * 0.85;
        // Top/bottom spin affects rail bounce
        if (currentSpin.y < 0) vx += currentSpin.y * 2; // Bottom spin affects horizontal bounce
        bounced = true;
      } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
        nextY = FELT_BOTTOM - BALL_RADIUS;
        vy = -Math.abs(vy) * 0.8;
        // Top/bottom spin affects rail bounce
        if (currentSpin.y > 0) vx += currentSpin.y * 2; // Top spin affects horizontal bounce
        bounced = true;
      }
      
      // Check pocket detection
      const ball = { x: nextX, y: nextY };
      if (isInPocket(ball)) {
        trajectory.push({ x: nextX, y: nextY, pocketed: true });
        break;
      }
      
      // Enhanced ball collision detection with spin transfer
      let ballCollision = false;
      let hitBall = null;
      let collisionPoint = null;
      
      gameState.balls.forEach(ball => {
        if (ball.visible && !ball.pocketed) {
          const dx = ball.x - nextX;
          const dy = ball.y - nextY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALL_SIZE) {
            ballCollision = true;
            hitBall = ball;
            collisionPoint = { x: nextX, y: nextY };
          }
        }
      });
      
      if (ballCollision && hitBall) {
        // Add collision point
        trajectory.push({ x: collisionPoint.x, y: collisionPoint.y, collision: true, hitBall: hitBall.id });
        
        // Enhanced collision physics with spin transfer
        const dx = hitBall.x - collisionPoint.x;
        const dy = hitBall.y - collisionPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          // Normal vector
          const nx = dx / dist;
          const ny = dy / dist;
          
          // Relative velocity
          const relVelX = vx - 0; // Assuming hit ball is stationary
          const relVelY = vy - 0;
          
          // Dot product for impulse calculation
          const relVelDot = relVelX * nx + relVelY * ny;
          
          // Apply impulse with spin effects
          const impulse = -relVelDot * 0.8; // Reduced for more realistic collision
          vx += impulse * nx;
          vy += impulse * ny;
          
          // Spin affects post-collision direction
          if (Math.abs(currentSpin.x) > 0.1) {
            vy += currentSpin.x * 1.5; // Side spin creates deflection
          }
          if (Math.abs(currentSpin.y) > 0.1) {
            // Top spin: ball follows more forward, Bottom spin: ball draws back
            const spinEffect = currentSpin.y > 0 ? 1.2 : 0.6;
            vx *= spinEffect;
            vy *= spinEffect;
          }
          
          // Continue trajectory with new velocity
          let postCollisionX = collisionPoint.x;
          let postCollisionY = collisionPoint.y;
          let postCollisionVx = vx;
          let postCollisionVy = vy;
            
                       // Continue for a shorter post-collision trajectory
           for (let postStep = 0; postStep < 50; postStep++) {
             // Apply friction
             postCollisionVx *= friction;
             postCollisionVy *= friction;
              
              // Stop if very slow
              if (Math.abs(postCollisionVx) < 0.03 && Math.abs(postCollisionVy) < 0.03) {
                break;
              }
              
              // Calculate next position
              let nextPostX = postCollisionX + postCollisionVx;
              let nextPostY = postCollisionY + postCollisionVy;
              
              // Check rail collisions
              let postBounced = false;
              
              if (nextPostX < FELT_LEFT + BALL_RADIUS) {
                nextPostX = FELT_LEFT + BALL_RADIUS;
                postCollisionVx = Math.abs(postCollisionVx) * 0.85;
                postBounced = true;
              } else if (nextPostX > FELT_RIGHT - BALL_RADIUS) {
                nextPostX = FELT_RIGHT - BALL_RADIUS;
                postCollisionVx = -Math.abs(postCollisionVx) * 0.8;
                postBounced = true;
              }
              
              if (nextPostY < FELT_TOP + BALL_RADIUS) {
                nextPostY = FELT_TOP + BALL_RADIUS;
                postCollisionVy = Math.abs(postCollisionVy) * 0.85;
                postBounced = true;
              } else if (nextPostY > FELT_BOTTOM - BALL_RADIUS) {
                nextPostY = FELT_BOTTOM - BALL_RADIUS;
                postCollisionVy = -Math.abs(postCollisionVy) * 0.8;
                postBounced = true;
              }
              
              // Check pocket detection
              const postBall = { x: nextPostX, y: nextPostY };
              if (isInPocket(postBall)) {
                trajectory.push({ x: nextPostX, y: nextPostY, pocketed: true, postCollision: true });
                break;
              }
              
              // Update position
              postCollisionX = nextPostX;
              postCollisionY = nextPostY;
              trajectory.push({ x: postCollisionX, y: postCollisionY, bounced: postBounced, postCollision: true });
              
              // Stop if ball is too slow after bounce
              if (postBounced && (Math.abs(postCollisionVx) < 0.1 || Math.abs(postCollisionVy) < 0.1)) {
                break;
              }
            }
          }
          
          // Return the trajectory now - don't continue the main loop
          return trajectory;
        }
       
       // Update position
       x = nextX;
       y = nextY;
       trajectory.push({ x, y, bounced });
       
       // Stop if ball is too slow after bounce
       if (bounced && (Math.abs(vx) < 0.1 || Math.abs(vy) < 0.1)) {
         break;
       }
     }
     
     console.log('🎯 Trajectory prediction completed:', {
       finalLength: trajectory.length,
       finalPoint: trajectory[trajectory.length - 1],
       finalSpeed: Math.sqrt(vx * vx + vy * vy),
       stoppedEarly: trajectory.length < maxSteps
     });
     
     return trajectory;
   }, [gameState.balls, isInPocket, cueStats]);
  
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
  
  // Enhanced Miniclip-style mouse events for aiming
  const handleMouseDown = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on cue ball for aiming/spin control
    const cueBall = gameState.cueBall;
    const distToCueBall = Math.sqrt((x - cueBall.x) ** 2 + (y - cueBall.y) ** 2);
    
    if (distToCueBall <= BALL_RADIUS + 20) { // Clicking near cue ball
      setShowSpinControl(true);
      setShowPowerBar(true);
      if (!aimLocked) {
        setAimLocked(true);
        setLockedAimAngle(aimAngle);
        setShowAimLine(true);
      }
    } else {
      // Lock the current aim angle
      setAimLocked(true);
      setLockedAimAngle(aimAngle);
      setShowAimLine(true);
      setShowPowerBar(true);
    }
  }, [gameState.isAnimating, gameState.cueBall, aimAngle, aimLocked]);
  
  const handleMouseMove = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cueBall = gameState.cueBall;
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
    
    // Update trajectory prediction in real-time
    if (showAimLine && !gameState.isAnimating) {
      const predTrajectory = predictTrajectory(cueBall.x, cueBall.y, angle, power, spin);
      setTrajectory(predTrajectory);
    }
    
    // Show aim line when mouse is over the table
    if (!aimLocked) {
      setShowAimLine(true);
    }
  }, [gameState.isAnimating, gameState.cueBall, aimLocked, showAimLine, power, spin, predictTrajectory]);
  
  const handleMouseLeave = useCallback(() => {
    if (!aimLocked) {
      setShowAimLine(false);
      setTrajectory([]);
    }
  }, [aimLocked]);
  
  // Enhanced shot execution with spin effects
  const handleShoot = useCallback(() => {
    if (gameState.isAnimating || !aimLocked) return;
    
    const cueBall = gameState.cueBall;
    
    // Calculate enhanced power with cue stats
    const basePower = power * (cueStats.force / 10) * 15;
    let vx = Math.cos(lockedAimAngle) * basePower;
    let vy = Math.sin(lockedAimAngle) * basePower;
    
    // Apply spin effects
    const spinMultiplier = cueStats.spin / 10;
    vx += spin.x * basePower * 0.2 * spinMultiplier;
    vy += spin.y * basePower * 0.2 * spinMultiplier;
    
    setGameState(prev => ({
      ...prev,
      cueBall: {
        ...prev.cueBall,
        vx: vx,
        vy: vy,
        isMoving: true,
        spin: { ...spin } // Store spin for physics
      },
      isAnimating: true
    }));
    
    // Reset aiming state
    setAimLocked(false);
    setShowSpinControl(false);
    setShowPowerBar(false);
    setTrajectory([]);
    // Keep aim line visible for feedback
  }, [gameState.isAnimating, aimLocked, gameState.cueBall, power, lockedAimAngle, spin, cueStats]);
  
  const handleResetAim = useCallback(() => {
    setAimLocked(false);
    setShowAimLine(false);
    setShowSpinControl(false);
    setShowPowerBar(false);
    setTrajectory([]);
    setSpin({ x: 0, y: 0 });
    setPower(0.5);
  }, []);
  
  // Spin control handlers
  const handleSpinChange = useCallback((newSpin) => {
    const maxSpin = cueStats.spin / 10; // Normalize to 0-1
    const clampedSpin = {
      x: Math.max(-maxSpin, Math.min(maxSpin, newSpin.x)),
      y: Math.max(-maxSpin, Math.min(maxSpin, newSpin.y))
    };
    setSpin(clampedSpin);
    
    // Update trajectory with new spin
    if (showAimLine && !gameState.isAnimating) {
      const cueBall = gameState.cueBall;
      const predTrajectory = predictTrajectory(cueBall.x, cueBall.y, aimAngle, power, clampedSpin);
      setTrajectory(predTrajectory);
    }
  }, [cueStats.spin, showAimLine, gameState.isAnimating, gameState.cueBall, aimAngle, power, predictTrajectory]);
  
  // Power control handler
  const handlePowerChange = useCallback((newPower) => {
    const maxPower = cueStats.force / 10; // Normalize based on cue force
    const clampedPower = Math.max(0.1, Math.min(maxPower, newPower));
    setPower(clampedPower);
    
    // Update trajectory with new power
    if (showAimLine && !gameState.isAnimating) {
      const cueBall = gameState.cueBall;
      const predTrajectory = predictTrajectory(cueBall.x, cueBall.y, aimAngle, clampedPower, spin);
      setTrajectory(predTrajectory);
    }
  }, [cueStats.force, showAimLine, gameState.isAnimating, gameState.cueBall, aimAngle, spin, predictTrajectory]);
  
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
    
    // Enhanced Miniclip-style trajectory and aiming visualization
    if (showAimLine && !gameState.isAnimating) {
      const cueBall = gameState.cueBall;
      const currentAngle = aimLocked ? lockedAimAngle : aimAngle;
      
      // Draw enhanced aim line based on cue stats
      const aimLineLength = (cueStats.aim / 10) * 150; // Length based on cue aim stat
      const endX = cueBall.x + Math.cos(currentAngle) * aimLineLength;
      const endY = cueBall.y + Math.sin(currentAngle) * aimLineLength;
      
      // Main aim line
      ctx.save();
      ctx.strokeStyle = aimLocked ? '#ff4444' : '#ffffff';
      ctx.lineWidth = aimLocked ? 4 : 3;
      ctx.globalAlpha = aimLocked ? 0.9 : 0.7;
      
      // Create gradient for aim line
      const gradient = ctx.createLinearGradient(cueBall.x, cueBall.y, endX, endY);
      gradient.addColorStop(0, aimLocked ? '#ff4444' : '#ffffff');
      gradient.addColorStop(1, aimLocked ? '#ff888888' : '#ffffff44');
      ctx.strokeStyle = gradient;
      
      ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
      
      // Power indicator circles along aim line
      const powerSteps = Math.floor(power * 8) + 3;
      for (let i = 1; i <= powerSteps; i++) {
        const distance = i * 15;
        const circleX = cueBall.x + Math.cos(currentAngle) * distance;
        const circleY = cueBall.y + Math.sin(currentAngle) * distance;
        
        ctx.save();
        ctx.fillStyle = aimLocked ? '#ff6666' : '#ffffff';
        ctx.globalAlpha = 1 - (i / powerSteps) * 0.5;
        ctx.beginPath();
        ctx.arc(circleX, circleY, Math.max(1, 3 - i * 0.2), 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
      
      // Draw predicted trajectory if available
      if (trajectory.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(trajectory[0].x, trajectory[0].y);
        
        for (let i = 1; i < trajectory.length; i++) {
          const point = trajectory[i];
          ctx.lineTo(point.x, point.y);
          
          // Enhanced collision visualization
          if (point.collision) {
            ctx.save();
            ctx.fillStyle = '#ff0066';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(point.x, point.y, BALL_RADIUS + 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
            
            // Show which ball will be hit
            if (point.hitBall) {
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px Arial';
              ctx.fillText(`${point.hitBall}`, point.x + 10, point.y - 10);
              ctx.restore();
            }
          }
          
          // Enhanced pocket visualization
          if (point.pocketed) {
            ctx.save();
            ctx.fillStyle = '#00ff00';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
          
          // Rail bounce indicators
          if (point.bounced) {
            ctx.save();
            ctx.fillStyle = '#ffaa00';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
        }
        
        ctx.stroke();
        ctx.restore();
      }
    }
      
    // Draw cue ball with enhanced spin visualization
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
        
        // Draw spin indicator on cue ball (Miniclip style)
        if (showSpinControl && (Math.abs(spin.x) > 0.05 || Math.abs(spin.y) > 0.05)) {
          ctx.save();
          
          // Draw spin position dot
          const spinRadius = BALL_RADIUS * 0.6;
          const spinX = ball.x + spin.x * spinRadius;
          const spinY = ball.y + spin.y * spinRadius;
          
          // Spin indicator background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_RADIUS + 3, 0, 2 * Math.PI);
          ctx.fill();
          
          // Spin position indicator
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(spinX, spinY, 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Spin direction lines
          if (Math.abs(spin.x) > 0.1) {
            ctx.strokeStyle = spin.x > 0 ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y - BALL_RADIUS - 8);
            ctx.lineTo(ball.x, ball.y + BALL_RADIUS + 8);
            ctx.stroke();
          }
          
          if (Math.abs(spin.y) > 0.1) {
            ctx.strokeStyle = spin.y > 0 ? '#0088ff' : '#ffaa00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ball.x - BALL_RADIUS - 8, ball.y);
            ctx.lineTo(ball.x + BALL_RADIUS + 8, ball.y);
            ctx.stroke();
          }
          
          ctx.restore();
        }
      }
    }
     }, [gameState, showAimLine, aimAngle, ballImages, power, aimLocked, lockedAimAngle, predictTrajectory, trajectory, showSpinControl, spin, cueStats]);
  
  // Draw on state changes
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Load table image
  useEffect(() => {
    const tableImg = new Image();
    tableImg.onload = () => {
      tableImageCache.current = tableImg;
      draw();
    };
    tableImg.src = predatorTable;
  }, [draw]);
  
  return (
    <div className={styles.simplePoolGame}>
      <div className={styles.tableContainer}>
                 <canvas
           ref={canvasRef}
           width={TABLE_WIDTH}
           height={TABLE_HEIGHT}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseLeave={handleMouseLeave}
           className={styles.tableCanvas}
         />
      </div>
      
                   {/* Enhanced Miniclip-style Controls */}
      <div className={styles.controls}>
        {/* Main Shoot Button */}
        <div className={styles.shootControl}>
          <button 
            className={`${styles.shootButton} ${!aimLocked || gameState.isAnimating ? styles.disabled : ''}`}
            onClick={handleShoot}
            disabled={!aimLocked || gameState.isAnimating}
          >
            {aimLocked ? 'SHOOT!' : 'Click Table to Aim'}
          </button>
        </div>

        {/* Enhanced Power Control with Visual Bar */}
        {showPowerBar && (
          <div className={styles.powerControl}>
            <label>Power: {Math.round(power * 100)}%</label>
            <div className={styles.powerBarContainer}>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={power}
                onChange={(e) => handlePowerChange(parseFloat(e.target.value))}
                className={styles.powerSlider}
              />
              <div className={styles.powerVisualBar}>
                <div 
                  className={styles.powerFill}
                  style={{ width: `${power * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Miniclip-style Spin Control */}
        {showSpinControl && (
          <div className={styles.spinControl}>
            <label>English (Spin)</label>
            <div className={styles.spinPad}>
              <div 
                className={styles.spinArea}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const x = (e.clientX - rect.left - centerX) / centerX;
                  const y = (e.clientY - rect.top - centerY) / centerY;
                  
                  // Clamp to circle
                  const distance = Math.sqrt(x * x + y * y);
                  if (distance <= 1) {
                    handleSpinChange({ x, y });
                  } else {
                    const normalizedX = x / distance;
                    const normalizedY = y / distance;
                    handleSpinChange({ x: normalizedX, y: normalizedY });
                  }
                }}
              >
                <div className={styles.spinCenter} />
                <div 
                  className={styles.spinIndicator}
                  style={{
                    left: `${50 + (spin.x * 40)}%`,
                    top: `${50 + (spin.y * 40)}%`
                  }}
                />
              </div>
              <div className={styles.spinLabels}>
                <span className={styles.spinLabel} style={{top: '10%', left: '50%', transform: 'translateX(-50%)'}}>
                  Top Spin
                </span>
                <span className={styles.spinLabel} style={{bottom: '10%', left: '50%', transform: 'translateX(-50%)'}}>
                  Back Spin
                </span>
                <span className={styles.spinLabel} style={{left: '10%', top: '50%', transform: 'translateY(-50%)'}}>
                  Left
                </span>
                <span className={styles.spinLabel} style={{right: '10%', top: '50%', transform: 'translateY(-50%)'}}>
                  Right
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cue Selector (Miniclip style) */}
        <div className={styles.cueSelector}>
          <h4>Select Cue</h4>
          <div className={styles.cueOptions}>
            <button 
              className={`${styles.cueOption} ${cueStats.force === 5 ? styles.selected : ''}`}
              onClick={() => setCueStats({ force: 5, spin: 4, aim: 6, time: 8 })}
            >
              Beginner Cue
            </button>
            <button 
              className={`${styles.cueOption} ${cueStats.force === 7 ? styles.selected : ''}`}
              onClick={() => setCueStats({ force: 7, spin: 6, aim: 8, time: 5 })}
            >
              Standard Cue
            </button>
            <button 
              className={`${styles.cueOption} ${cueStats.force === 9 ? styles.selected : ''}`}
              onClick={() => setCueStats({ force: 9, spin: 8, aim: 9, time: 3 })}
            >
              Pro Cue
            </button>
            <button 
              className={`${styles.cueOption} ${cueStats.force === 10 ? styles.selected : ''}`}
              onClick={() => setCueStats({ force: 10, spin: 10, aim: 10, time: 2 })}
            >
              Master Cue
            </button>
          </div>
        </div>

        {/* Cue Stats Display (Miniclip style) */}
        <div className={styles.cueStats}>
          <h4>Cue Attributes</h4>
          <div className={styles.statBars}>
            <div className={styles.statRow}>
              <span>Force:</span>
              <div className={styles.statBar}>
                <div className={styles.statFill} style={{width: `${(cueStats.force / 10) * 100}%`}} />
              </div>
              <span>{cueStats.force}/10</span>
            </div>
            <div className={styles.statRow}>
              <span>Spin:</span>
              <div className={styles.statBar}>
                <div className={styles.statFill} style={{width: `${(cueStats.spin / 10) * 100}%`}} />
              </div>
              <span>{cueStats.spin}/10</span>
            </div>
            <div className={styles.statRow}>
              <span>Aim:</span>
              <div className={styles.statBar}>
                <div className={styles.statFill} style={{width: `${(cueStats.aim / 10) * 100}%`}} />
              </div>
              <span>{cueStats.aim}/10</span>
            </div>
            <div className={styles.statRow}>
              <span>Time:</span>
              <div className={styles.statBar}>
                <div className={styles.statFill} style={{width: `${(cueStats.time / 10) * 100}%`}} />
              </div>
              <span>{cueStats.time}/10</span>
            </div>
          </div>
        </div>
        
        {/* Game Information */}
        <div className={styles.gameInfo}>
          <span>Player: {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
          <span>Status: {gameState.isAnimating ? 'Animating' : aimLocked ? 'Aim Locked' : 'Ready'}</span>
        </div>
        
        {/* Control Buttons */}
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
              handleResetAim();
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