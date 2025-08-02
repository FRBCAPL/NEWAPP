import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaLightbulb, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import styles from './TenBallTable.module.css';

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

// Import predator table image
import predatorTable from '../PoolTableSVG/PredatorTable.png';

const TenBallTable = ({ 
  tutorialMode = false, 
  currentStep = 0, 
  showHints = true, 
  difficulty = 'beginner',
  onShotComplete,
  onFoul,
  onGameEnd
}) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    balls: [],
    cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true },
    currentPlayer: 1,
    gamePhase: 'break',
    selectedBall: null,
    calledPocket: null,
    fouls: { 1: 0, 2: 0 },
    lastFoul: null,
    pushOutAvailable: false,
    isAnimating: false
  });
  
  // Enhanced Miniclip-style aiming system state
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [english, setEnglish] = useState({ x: 0, y: 0 }); // Renamed from spin for consistency
  const [selectedTargetBall, setSelectedTargetBall] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [aimLine, setAimLine] = useState(null); // Separate state for aim line
  const [aimLocked, setAimLocked] = useState(false);
  const [lockedAimAngle, setLockedAimAngle] = useState(0);
  const aimLockedRef = useRef(aimLocked);
  useEffect(() => {
    aimLockedRef.current = aimLocked;
  }, [aimLocked]);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  // Enhanced Miniclip-style control states
  const [showSpinControl, setShowSpinControl] = useState(false);
  const [showPowerBar, setShowPowerBar] = useState(false);
  const [showAimLine, setShowAimLine] = useState(false);
  
  // Cue attributes (Miniclip style)
  const [cueStats, setCueStats] = useState({
    force: 8,    // Affects maximum power - higher for tutorial
    spin: 7,     // Affects maximum spin amount
    aim: 9,      // Affects aim line length  
    time: 6      // Affects shot timer
  });
  
  // Trajectory update ref (kept for compatibility)
  const trajectoryUpdateRef = useRef(null);
  const lastAimAngleRef = useRef(0);

  // Table dimensions
  const TABLE_WIDTH = 600;
  const TABLE_HEIGHT = 300;
  const BALL_SIZE = 8;
  const POCKET_SIZE = 16;

  // Ball images mapping
  const ballImages = {
    cue: cueBall,
    1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
    6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: tenBall
  };

  // Image cache to prevent flashing
  const imageCache = useRef({});
  const tableImageCache = useRef(null);

  // Initialize balls in 10-ball rack formation - CSI rules: 10-ball in middle, 2&3 in corners
  const initializeBalls = useCallback(() => {
    const balls = [];
    const rackPositions = [
      { x: 450, y: 150 }, // 1-ball (apex)
      { x: 462, y: 144 }, // 2-ball (left corner)
      { x: 462, y: 156 }, // 3-ball (right corner)
      { x: 474, y: 138 }, // 4-ball
      { x: 474, y: 150 }, // 10-ball (middle position)
      { x: 474, y: 162 }, // 5-ball
      { x: 486, y: 132 }, // 6-ball
      { x: 486, y: 144 }, // 7-ball
      { x: 486, y: 156 }, // 8-ball
      { x: 486, y: 168 }  // 9-ball
    ];

    // CSI 10-ball racking: 1-ball at apex, 10-ball in middle, 2&3 randomly in corners, others random
    const ballOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // Create available positions (excluding middle position 4 which is for 10-ball, and apex position 0 for 1-ball)
    const availablePositions = [1, 2, 3, 5, 6, 7, 8, 9];
    
    // Randomly shuffle available positions
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    // Ensure 2 and 3 balls are in corner positions (6 and 9 - the actual back corners)
    const cornerPositions = [6, 9];
    
    // Randomly assign 2 and 3 to different corners
    const shuffledCorners = [...cornerPositions].sort(() => Math.random() - 0.5);
    const ball2Corner = shuffledCorners[0];
    const ball3Corner = shuffledCorners[1];
    
    // Get non-corner positions for other balls
    const nonCornerPositions = availablePositions.filter(pos => pos !== ball2Corner && pos !== ball3Corner);
    
    // Create position mapping
    const positionOrder = [];
    let nonCornerIndex = 0;
    
    ballOrder.forEach((ballId, index) => {
      if (ballId === 1) {
        positionOrder.push(0); // 1-ball always at apex
      } else if (ballId === 10) {
        positionOrder.push(4); // 10-ball always in middle
      } else if (ballId === 2) {
        positionOrder.push(ball2Corner);
      } else if (ballId === 3) {
        positionOrder.push(ball3Corner);
      } else {
        if (nonCornerIndex < nonCornerPositions.length) {
          positionOrder.push(nonCornerPositions[nonCornerIndex++]);
        } else {
          const remainingPositions = [1, 2, 3, 5, 6, 7, 8, 9].filter(pos => 
            !positionOrder.includes(pos) && pos !== 0 && pos !== 4
          );
          if (remainingPositions.length > 0) {
            positionOrder.push(remainingPositions[0]);
          } else {
            positionOrder.push(1);
          }
        }
      }
    });
    
    ballOrder.forEach((ballId, index) => {
      const positionIndex = positionOrder[index];
      if (positionIndex !== undefined && rackPositions[positionIndex]) {
        balls.push({
          id: ballId,
          x: rackPositions[positionIndex].x,
          y: rackPositions[positionIndex].y,
          vx: 0,
          vy: 0,
          visible: true,
          pocketed: false
        });
      }
    });

    return balls;
  }, []);

  // Get tutorial hints based on current step
  const getTutorialHint = useCallback(() => {
    const hints = {
      0: "Welcome! This is a 10-ball table. Notice the 10-ball is the money ball.",
      1: "Click the cue ball to start aiming, then click SHOOT!",
      2: "After the break, you must always hit the lowest numbered ball first.",
      3: "Use the power slider and English controls to adjust your shot.",
      4: "After a legal break, you can 'push out' - move the cue ball anywhere.",
      5: "Watch out for fouls! Not hitting the lowest ball first is a foul.",
      6: "Three consecutive fouls result in loss of game.",
      7: "Pocket the 10-ball legally to win the game!"
    };
    return hints[currentStep] || "Take your shot!";
  }, [currentStep]);

  // Enhanced Miniclip-style trajectory prediction with spin effects
  const predictTrajectory = useCallback((startX, startY, angle, power, englishData, maxSteps = 150) => {
    const trajectory = [{ x: startX, y: startY }];
    let x = startX;
    let y = startY;
    
    // Calculate initial velocity with spin effects and cue stats
    const basePower = power * (cueStats.force / 10) * 18; // Cue force affects power
    let vx = Math.cos(angle) * basePower;
    let vy = Math.sin(angle) * basePower;
    
    // Apply enhanced spin effects (English)
    const spinMultiplier = cueStats.spin / 10;
    vx += englishData.x * basePower * 0.3 * spinMultiplier;
    vy += englishData.y * basePower * 0.3 * spinMultiplier;
    
    const friction = 0.99;
    let spinDecay = 0.98; // Spin gradually reduces
    let currentSpin = { x: englishData.x, y: englishData.y };
    
    // Felt bounds (same as physics simulation)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;
    
    // Predict path for enhanced steps
    for (let i = 0; i < maxSteps; i++) {
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
      
      // Update position
      x += vx;
      y += vy;
      
      // Enhanced rail collision with spin effects
      let bounced = false;
      
      if (x <= FELT_LEFT + BALL_SIZE) {
        vx = Math.abs(vx) * 0.85;
        x = FELT_LEFT + BALL_SIZE;
        // Side spin affects rail bounce
        if (currentSpin.x < 0) vy += currentSpin.x * 2; // Left spin affects vertical bounce
        bounced = true;
      } else if (x >= FELT_RIGHT - BALL_SIZE) {
        vx = -Math.abs(vx) * 0.8;
        x = FELT_RIGHT - BALL_SIZE;
        // Side spin affects rail bounce  
        if (currentSpin.x > 0) vy += currentSpin.x * 2; // Right spin affects vertical bounce
        bounced = true;
      }
      
      if (y <= FELT_TOP + BALL_SIZE) {
        vy = Math.abs(vy) * 0.85;
        y = FELT_TOP + BALL_SIZE;
        // Top/bottom spin affects rail bounce
        if (currentSpin.y < 0) vx += currentSpin.y * 2; // Bottom spin affects horizontal bounce
        bounced = true;
      } else if (y >= FELT_BOTTOM - BALL_SIZE) {
        vy = -Math.abs(vy) * 0.8;
        y = FELT_BOTTOM - BALL_SIZE;
        // Top/bottom spin affects rail bounce
        if (currentSpin.y > 0) vx += currentSpin.y * 2; // Top spin affects horizontal bounce
        bounced = true;
      }
      
      // Add trajectory point with bounce info
      trajectory.push({ x, y, bounced });
      
      // Stop if ball is too slow
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) break;
    }
    
    return trajectory;
  }, [cueStats]);

  const predictBallCollisions = useCallback((trajectory, balls) => {
    const collisions = [];
    
    for (let i = 0; i < trajectory.length - 1; i++) {
      const point = trajectory[i];
      const nextPoint = trajectory[i + 1];
      
      balls.forEach(ball => {
        if (ball.visible && !collisions.find(c => c.ballId === ball.id)) {
          // Check if trajectory line segment intersects with ball
          const dx = nextPoint.x - point.x;
          const dy = nextPoint.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length === 0) return;
          
          // Vector from trajectory start to ball center
          const ballDx = ball.x - point.x;
          const ballDy = ball.y - point.y;
          
          // Project ball position onto trajectory line
          const projection = (ballDx * dx + ballDy * dy) / (length * length);
          
          if (projection >= 0 && projection <= 1) {
            // Closest point on trajectory line to ball center
            const closestX = point.x + projection * dx;
            const closestY = point.y + projection * dy;
            
            // Distance from ball center to closest point
            const distance = Math.sqrt(
              Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2)
            );
            
            if (distance <= BALL_SIZE * 2) {
              // Calculate the actual collision point (where cue ball hits target ball)
              // This is the point on the trajectory that's exactly BALL_SIZE * 2 away from ball center
              const collisionDistance = BALL_SIZE * 2;
              const ratio = collisionDistance / distance;
              
              const collisionX = ball.x + (closestX - ball.x) * ratio;
              const collisionY = ball.y + (closestY - ball.y) * ratio;
              
              console.log(`Collision detected with ball ${ball.id} at distance ${distance}, collision point: (${collisionX}, ${collisionY})`);
              
              collisions.push({
                ballId: ball.id,
                point: { x: collisionX, y: collisionY },
                step: i,
                angle: Math.atan2(dy, dx)
              });
            }
          }
        }
      });
    }
    
    return collisions;
  }, []);

  // Get ball color for trajectory lines
  const getBallColor = useCallback((ballId) => {
    const colors = {
      1: '#ffd700', // Yellow
      2: '#0000ff', // Blue
      3: '#ff0000', // Red
      4: '#800080', // Purple
      5: '#ffa500', // Orange
      6: '#008000', // Green
      7: '#8b4513', // Brown
      8: '#000000', // Black
      9: '#ffff00', // Yellow
      10: '#ff4500' // Orange-Red (10-ball color)
    };
    return colors[ballId] || '#ffffff';
  }, []);

  // Update trajectory predictions
  const updateTrajectories = useCallback((angle, power, english) => {
    const cueBall = gameState.cueBall;
    const trajectories = [];
    
    // Create aim line (simple line from cue ball in aim direction)
    const aimLineLength = 100;
    const aimLineEndX = cueBall.x + Math.cos(angle) * aimLineLength;
    const aimLineEndY = cueBall.y + Math.sin(angle) * aimLineLength;
    const newAimLine = {
      startX: cueBall.x,
      startY: cueBall.y,
      endX: aimLineEndX,
      endY: aimLineEndY
    };
    setAimLine(newAimLine);
    
    // Predict cue ball trajectory
    const cueTrajectory = predictTrajectory(cueBall.x, cueBall.y, angle, power, english);
    const collisions = predictBallCollisions(cueTrajectory, gameState.balls);
    
    console.log('Trajectory Debug:', {
      cueBallPos: { x: cueBall.x, y: cueBall.y },
      angle: angle,
      power: power,
      collisions: collisions,
      balls: gameState.balls.map(b => ({ id: b.id, x: b.x, y: b.y, visible: b.visible }))
    });
    
    // Always add cue ball trajectory
    trajectories.push({
      ballId: 'cue',
      trajectory: cueTrajectory,
      color: '#ffffff'
    });
    
    // Predict trajectories for balls that will be hit
    collisions.forEach(collision => {
      const ball = gameState.balls.find(b => b.id === collision.ballId);
      if (ball) {
        console.log(`Processing collision with ball ${ball.id} (1-ball check: ${ball.id === 1})`);
        
        // Calculate the direction vector from collision point to ball center
        const dx = ball.x - collision.point.x;
        const dy = ball.y - collision.point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          // Normalize the direction vector
          const nx = dx / distance;
          const ny = dy / distance;

          // Calculate the cue ball's velocity at collision
          const cueBallSpeed = power * 18;
          const cueBallVx = Math.cos(angle) * cueBallSpeed;
          const cueBallVy = Math.sin(angle) * cueBallSpeed;

          // Project cue ball velocity onto the normal vector to get the transfer velocity
          const normalVelocity = cueBallVx * nx + cueBallVy * ny;

          // The hit ball moves in the direction of the normal vector (away from collision point)
          const ballAngle = Math.atan2(ny, nx);

          // Convert normalVelocity to a power value (0-1 range, clamp to 1.0)
          const ballPower = Math.min(Math.abs(normalVelocity) / 18, 1.0);

          console.log(`Ball ${ball.id} - normalVelocity: ${normalVelocity}, ballPower: ${ballPower}, ballAngle: ${ballAngle}`);

          // Use predictTrajectory to simulate the object ball's path from the ball center (not collision point)
          const ballTrajectory = predictTrajectory(
            ball.x,
            ball.y,
            ballAngle,
            ballPower,
            { x: 0, y: 0 }
          );

          console.log(`Ball ${ball.id} trajectory length: ${ballTrajectory.length}`);

          trajectories.push({
            ballId: collision.ballId,
            trajectory: ballTrajectory,
            color: getBallColor(collision.ballId)
          });
        }
      }
    });
    
    console.log('Final Trajectories to be set:', trajectories);
    setTrajectories(trajectories);
  }, [gameState.cueBall, gameState.balls, predictTrajectory, predictBallCollisions, getBallColor]);

  // Direct trajectory update - no throttling
  const throttledUpdateTrajectories = useCallback((angle, power, english) => {
    updateTrajectories(angle, power, english);
  }, [updateTrajectories]);

  // Check if ball is in pocket
  const isInPocket = useCallback((ball) => {
    const pockets = [
      { x: 0, y: 0 },
      { x: TABLE_WIDTH / 2, y: 0 },
      { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH, y: TABLE_HEIGHT }
    ];
    
    return pockets.some(pocket => {
      const distance = Math.sqrt((ball.x - pocket.x) ** 2 + (ball.y - pocket.y) ** 2);
      return distance < POCKET_SIZE;
    });
  }, []);

  // Resolve ball collision between two balls
  const resolveBallCollision = useCallback((a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist >= BALL_SIZE * 2) return;

    // 1. Resolve overlap
    const overlap = BALL_SIZE * 2 - dist + 0.01;
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
  }, []);

  // Check ball collisions
  const checkCollisions = useCallback((state) => {
    // Check cue ball vs other balls
    state.balls.forEach(ball => {
      if (ball.visible) {
        resolveBallCollision(state.cueBall, ball);
      }
    });

    // Check ball vs ball collisions
    for (let i = 0; i < state.balls.length; i++) {
      for (let j = i + 1; j < state.balls.length; j++) {
        const a = state.balls[i];
        const b = state.balls[j];
        if (a.visible && b.visible) {
          resolveBallCollision(a, b);
        }
      }
    }
  }, [resolveBallCollision]);

  // Evaluate shot result
  const evaluateShotResult = useCallback((state) => {
    const fouls = [];
    
    if (isInPocket(state.cueBall)) {
      fouls.push('Cue ball pocketed');
    }
    
    const lowestBall = Math.min(...state.balls.filter(b => b.visible).map(b => b.id));
    if (state.gamePhase !== 'break' && !state.balls.some(b => b.id === lowestBall && b.vx !== 0)) {
      fouls.push('Did not hit lowest ball first');
    }
    
    if (fouls.length > 0) {
      setHint(`Foul: ${fouls.join(', ')}`);
      setShowHint(true);
      onFoul && onFoul(fouls);
    } else {
      setHint('Good shot!');
      setShowHint(true);
    }
    
    const tenBallPocketed = state.balls.find(b => b.id === 10 && b.pocketed);
    if (tenBallPocketed && fouls.length === 0) {
      onGameEnd && onGameEnd(state.currentPlayer);
    }
  }, [isInPocket, onFoul, onGameEnd]);

  // Physics simulation
  const startPhysicsSimulation = useCallback(() => {
    // Set animating to true when starting
    setGameState(prev => ({ ...prev, isAnimating: true }));
    
    const friction = 0.99; // Increased friction for shorter ball movement
    const subSteps = 4; // Reduced sub-steps for smoother animation
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    // Felt bounds in simulation coordinates (like PoolSimulation)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;

    const animate = (currentTime) => {
      // Calculate delta time for consistent animation speed
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        
        setGameState(prev => {
          const newState = { ...prev };
          let pocketedThisFrame = [];

          for (let s = 0; s < subSteps; s++) {
            // Update cue ball
            let nextX = newState.cueBall.x + newState.cueBall.vx / subSteps;
            let nextY = newState.cueBall.y + newState.cueBall.vy / subSteps;

            // Rail collision for cue ball
            if (nextX < FELT_LEFT + BALL_SIZE) {
              newState.cueBall.x = FELT_LEFT + BALL_SIZE;
              newState.cueBall.vx = Math.abs(newState.cueBall.vx) * 0.85;
            } else if (nextX > FELT_RIGHT - BALL_SIZE) {
              newState.cueBall.x = FELT_RIGHT - BALL_SIZE;
              newState.cueBall.vx = -Math.abs(newState.cueBall.vx) * 0.8;
            } else {
              newState.cueBall.x = nextX;
            }

            if (nextY < FELT_TOP + BALL_SIZE) {
              newState.cueBall.y = FELT_TOP + BALL_SIZE;
              newState.cueBall.vy = Math.abs(newState.cueBall.vy) * 0.85;
            } else if (nextY > FELT_BOTTOM - BALL_SIZE) {
              newState.cueBall.y = FELT_BOTTOM - BALL_SIZE;
              newState.cueBall.vy = -Math.abs(newState.cueBall.vy) * 0.8;
            } else {
              newState.cueBall.y = nextY;
            }

            // Apply friction to cue ball
            newState.cueBall.vx *= Math.pow(friction, 1 / subSteps);
            newState.cueBall.vy *= Math.pow(friction, 1 / subSteps);
            
            // Update other balls
            newState.balls.forEach(ball => {
              if (ball.visible) {
                let ballNextX = ball.x + ball.vx / subSteps;
                let ballNextY = ball.y + ball.vy / subSteps;

                // Rail collision for other balls
                if (ballNextX < FELT_LEFT + BALL_SIZE) {
                  ball.x = FELT_LEFT + BALL_SIZE;
                  ball.vx = Math.abs(ball.vx) * 0.85;
                } else if (ballNextX > FELT_RIGHT - BALL_SIZE) {
                  ball.x = FELT_RIGHT - BALL_SIZE;
                  ball.vx = -Math.abs(ball.vx) * 0.8;
                } else {
                  ball.x = ballNextX;
                }

                if (ballNextY < FELT_TOP + BALL_SIZE) {
                  ball.y = FELT_TOP + BALL_SIZE;
                  ball.vy = Math.abs(ball.vy) * 0.85;
                } else if (ballNextY > FELT_BOTTOM - BALL_SIZE) {
                  ball.y = FELT_BOTTOM - BALL_SIZE;
                  ball.vy = -Math.abs(ball.vy) * 0.8;
                } else {
                  ball.y = ballNextY;
                }

                // Apply friction
                ball.vx *= Math.pow(friction, 1 / subSteps);
                ball.vy *= Math.pow(friction, 1 / subSteps);
                
                // Pocket detection
                if (isInPocket(ball)) {
                  ball.visible = false;
                  ball.pocketed = true;
                  if (!pocketedThisFrame.includes(ball.id)) {
                    pocketedThisFrame.push(ball.id);
                  }
                }
              }
            });

            // Check collisions
            checkCollisions(newState);
          }

          // Check if all balls have stopped
          const allStopped = Math.abs(newState.cueBall.vx) < 0.1 && 
                            Math.abs(newState.cueBall.vy) < 0.1 &&
                            newState.balls.every(ball => 
                              Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1
                            );
          
          if (allStopped) {
            evaluateShotResult(newState);
            // Don't clear aim line here - let it persist until next shot
            // Set animating to false when all balls have stopped
            return { ...newState, isAnimating: false };
          }
          
          requestAnimationFrame(animate);
          return newState;
        });
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInPocket, checkCollisions, evaluateShotResult, resolveBallCollision]);

  // Execute the shot
  const executeShot = useCallback((angle, power, english) => {
    const basePower = power * 18; // Slightly increased from 15 to 18 for better feel
    const vx = Math.cos(angle) * basePower;
    const vy = Math.sin(angle) * basePower;
    
    const englishVx = english.x * basePower * 0.3; // Reduced english effect
    const englishVy = english.y * basePower * 0.3;
    
    setGameState(prev => ({
      ...prev,
      cueBall: {
        ...prev.cueBall,
        vx: vx + englishVx,
        vy: vy + englishVy
      }
    }));
    
    // Clear trajectories but keep aim line
    setTrajectories([]);
    // Don't clear aimLine - let it persist
    startPhysicsSimulation();
  }, [startPhysicsSimulation]);

  // Enhanced Miniclip-style mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (gameState.gamePhase === 'end' || gameState.isAnimating) return;

    // Show enhanced controls
    setShowAimLine(true);
    setShowPowerBar(true);
    setShowSpinControl(true);

    // Lock the current aim angle
    setAimLocked(true);
    setLockedAimAngle(aimAngle);
    
    console.log('🎯 Aim locked at angle:', aimAngle * (180/Math.PI), 'degrees');
  }, [gameState.gamePhase, gameState.isAnimating, aimAngle]);

  const handleMouseMove = useCallback((e) => {
    if (gameState.isAnimating) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = gameState.cueBall;
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    
    if (!aimLocked) {
      setAimAngle(angle);
      lastAimAngleRef.current = angle;
      setShowAimLine(true); // Show aim line when hovering

      if (trajectoryUpdateRef.current) {
        clearTimeout(trajectoryUpdateRef.current);
      }
      trajectoryUpdateRef.current = setTimeout(() => {
        updateTrajectories(angle, power, english);
      }, 50);
    }
  }, [gameState.isAnimating, gameState.cueBall, power, english, updateTrajectories, aimLocked]);

  const handleMouseLeave = useCallback(() => {
    if (!aimLocked) {
      setShowAimLine(false);
    }
  }, [aimLocked]);

  const handleMouseUp = useCallback(() => {
    // Enhanced mouse up behavior
  }, []);

  // Initialize game
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      balls: initializeBalls()
    }));
    // Clear aim line on new game
    setAimLine(null);
  }, [initializeBalls]);

  // Update tutorial hint
  useEffect(() => {
    if (tutorialMode && showHints) {
      setHint(getTutorialHint());
      setShowHint(true);
    }
  }, [tutorialMode, showHints, getTutorialHint, currentStep]);

  // Update trajectories based on power/english changes when not locked
  useEffect(() => {
    if (!aimLocked) {
      updateTrajectories(aimAngle, power, english);
    }
  }, [aimAngle, power, english, updateTrajectories, aimLocked]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Draw the table
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
              // Use cached table image if available
     if (tableImageCache.current) {
       ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
       ctx.drawImage(tableImageCache.current, 0, 0, TABLE_WIDTH, TABLE_HEIGHT);
       
              // Draw pockets
       const pockets = [
         { x: 0, y: 0 },
         { x: TABLE_WIDTH / 2, y: 0 },
         { x: TABLE_WIDTH, y: 0 },
         { x: 0, y: TABLE_HEIGHT },
         { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
         { x: TABLE_WIDTH, y: TABLE_HEIGHT }
       ];
       
       ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
       pockets.forEach(pocket => {
         ctx.beginPath();
         ctx.arc(pocket.x, pocket.y, POCKET_SIZE, 0, 2 * Math.PI);
         ctx.fill();
       });
       
       gameState.balls.forEach(ball => {
         if (ball.visible) {
           drawBall(ctx, ball, ballImages[ball.id]);
         }
       });
       
       if (gameState.cueBall.visible) {
         drawBall(ctx, gameState.cueBall, ballImages.cue);
       }
       
       if (trajectories.length > 0) {
         trajectories.forEach(trajectory => {
           if (trajectory.trajectory.length > 1) {
             ctx.strokeStyle = trajectory.color;
             ctx.lineWidth = 2;
             ctx.setLineDash([3, 3]);
             ctx.beginPath();
             ctx.moveTo(trajectory.trajectory[0].x, trajectory.trajectory[0].y);
             
             for (let i = 1; i < trajectory.trajectory.length; i++) {
               ctx.lineTo(trajectory.trajectory[i].x, trajectory.trajectory[i].y);
             }
             
             ctx.stroke();
           }
         });
         ctx.setLineDash([]);
       }
       
       // Draw aim line (persists after collision)
       if (aimLine) {
         ctx.strokeStyle = '#ffffff';
         ctx.lineWidth = 3;
         ctx.setLineDash([5, 5]);
         ctx.beginPath();
         ctx.moveTo(aimLine.startX, aimLine.startY);
         ctx.lineTo(aimLine.endX, aimLine.endY);
         ctx.stroke();
         ctx.setLineDash([]);
       }
       

       
       if (tutorialMode && showHints) {
         highlightTutorialElements(ctx);
       }
     } else {
       // Load and cache table image
       const tableImg = new Image();
       tableImg.onload = () => {
         tableImageCache.current = tableImg;
         // Trigger a re-render to draw with cached image
         setGameState(prev => ({ ...prev }));
       };
       tableImg.src = predatorTable;
     }
  }, [gameState, aimAngle, trajectories, aimLine, tutorialMode, showHints, currentStep, aimLocked]);

  // Draw a ball with image caching
  const drawBall = (ctx, ball, imageSrc) => {
    // Check if image is already cached
    if (!imageCache.current[imageSrc]) {
      const img = new Image();
      img.onload = () => {
        imageCache.current[imageSrc] = img;
        // Draw the ball once the image is loaded
        drawBallFromCache(ctx, ball, img);
      };
      img.src = imageSrc;
    } else {
      // Use cached image
      drawBallFromCache(ctx, ball, imageCache.current[imageSrc]);
    }
  };

  // Draw ball using cached image
  const drawBallFromCache = (ctx, ball, img) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(img, ball.x - BALL_SIZE, ball.y - BALL_SIZE, BALL_SIZE * 2, BALL_SIZE * 2);
    ctx.restore();
  };

  // Highlight tutorial elements
  const highlightTutorialElements = (ctx) => {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    switch (currentStep) {
      case 1:
        const oneBall = gameState.balls.find(b => b.id === 1);
        if (oneBall && oneBall.visible) {
          ctx.beginPath();
          ctx.arc(oneBall.x, oneBall.y, BALL_SIZE + 5, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 2:
        const lowestBall = Math.min(...gameState.balls.filter(b => b.visible).map(b => b.id));
        const lowestBallObj = gameState.balls.find(b => b.id === lowestBall);
        if (lowestBallObj) {
          ctx.beginPath();
          ctx.arc(lowestBallObj.x, lowestBallObj.y, BALL_SIZE + 5, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 3:
        const pockets = [
          { x: 0, y: 0 },
          { x: TABLE_WIDTH / 2, y: 0 },
          { x: TABLE_WIDTH, y: 0 },
          { x: 0, y: TABLE_HEIGHT },
          { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
          { x: TABLE_WIDTH, y: TABLE_HEIGHT }
        ];
        pockets.forEach(pocket => {
          ctx.beginPath();
          ctx.arc(pocket.x, pocket.y, POCKET_SIZE + 3, 0, 2 * Math.PI);
          ctx.stroke();
        });
        break;
      case 7:
        const tenBall = gameState.balls.find(b => b.id === 10);
        if (tenBall && tenBall.visible) {
          ctx.strokeStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(tenBall.x, tenBall.y, BALL_SIZE + 8, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
    }
    
    ctx.setLineDash([]);
  };

  console.log('🎯 TenBallTable rendering with enhanced UI:', { aimLocked, power, english, cueStats });
  
  return (
    <div className={styles.tenBallTable}>
      <div className={styles.tableContainer}>
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={styles.tableCanvas}
        />
        
        {showHint && hint && (
          <div className={styles.hintBox}>
            <FaLightbulb className={styles.hintIcon} />
            <span>{hint}</span>
            <button 
              className={styles.hintClose}
              onClick={() => setShowHint(false)}
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {/* Cue Stats Display (Miniclip style) */}
      <div className={styles.cueSelector}>
        <h4>Cue Attributes</h4>
        <div className={styles.cueOptions}>
          <button 
            className={`${styles.cueOption} ${styles.active}`}
            onClick={() => setCueStats({force: 8, spin: 7, aim: 9, time: 6})}
          >
            Beginner Cue
          </button>
          <button 
            className={styles.cueOption}
            onClick={() => setCueStats({force: 9, spin: 8, aim: 10, time: 7})}
          >
            Pro Cue
          </button>
        </div>
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
      
      <div className={styles.gameInfo}>
        <div className={styles.playerInfo}>
          <span>Player {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
          <span>Aim: {aimLocked ? 'Locked' : 'Free'}</span>
        </div>
        
        {/* Enhanced Miniclip-Style Controls */}
        <div className={styles.controls} style={{border: '2px solid red', margin: '10px', padding: '10px'}}>
          <div className={styles.shootControl}>
            <button 
              className={`${styles.shootButton} ${!aimLocked || gameState.isAnimating ? styles.disabled : ''}`}
              onClick={() => {
                if (aimLocked && !gameState.isAnimating) {
                  executeShot(lockedAimAngle, power, english);
                  setAimLocked(false);
                  setShowAimLine(false);
                  setShowPowerBar(false);
                  setShowSpinControl(false);
                }
              }}
              disabled={!aimLocked || gameState.isAnimating}
            >
              {aimLocked ? 'SHOOT!' : 'Aim & Click to Lock'}
            </button>
          </div>
          
          {/* Enhanced Power Control */}
          <div className={styles.powerControl}>
            <div className={styles.powerBarContainer}>
              <label>Power: {Math.round(power * 100)}%</label>
              <div className={styles.powerVisualBar}>
                <div 
                  className={styles.powerFill} 
                  style={{width: `${power * 100}%`}}
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={power}
                onChange={(e) => {
                  const newPower = parseFloat(e.target.value);
                  setPower(newPower);
                  if (!aimLocked) {
                    updateTrajectories(aimAngle, newPower, english);
                  }
                }}
                className={styles.powerSlider}
              />
            </div>
          </div>
          
          {/* Enhanced Spin Control (Miniclip-style) */}
          <div className={styles.spinControl}>
            <label>English (Spin)</label>
            <div className={styles.spinPad}>
              <div 
                className={styles.spinArea}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
                  const y = (e.clientY - rect.top - rect.height/2) / (rect.height/2);
                  
                  // Limit to circle
                  const distance = Math.sqrt(x*x + y*y);
                  const maxSpin = cueStats.spin / 10;
                  
                  if (distance <= 1) {
                    const newSpin = { 
                      x: Math.max(-maxSpin, Math.min(maxSpin, x * maxSpin)), 
                      y: Math.max(-maxSpin, Math.min(maxSpin, y * maxSpin))
                    };
                    setEnglish(newSpin);
                    if (!aimLocked) {
                      updateTrajectories(aimAngle, power, newSpin);
                    }
                  }
                }}
              >
                <div className={styles.spinCircle}>
                  <div 
                    className={styles.spinDot}
                    style={{
                      left: `${50 + (english.x / (cueStats.spin / 10)) * 40}%`,
                      top: `${50 + (english.y / (cueStats.spin / 10)) * 40}%`
                    }}
                  />
                </div>
                <div className={styles.spinLabels}>
                  <span className={`${styles.spinLabel} ${styles.top}`}>Follow</span>
                  <span className={`${styles.spinLabel} ${styles.bottom}`}>Draw</span>
                  <span className={`${styles.spinLabel} ${styles.left}`}>Left</span>
                  <span className={`${styles.spinLabel} ${styles.right}`}>Right</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Target Ball Selection */}
          <div className={styles.controlGroup}>
            <label>Target Ball: {selectedTargetBall || 'None'}</label>
            <div className={styles.targetBalls}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(ballId => (
                <button
                  key={ballId}
                  className={`${styles.targetBall} ${selectedTargetBall === ballId ? styles.selected : ''}`}
                  onClick={() => setSelectedTargetBall(ballId)}
                  style={{ backgroundColor: getBallColor(ballId) }}
                >
                  {ballId}
                </button>
              ))}
            </div>
          </div>
          

        </div>
        
        {gameState.pushOutAvailable && (
          <button className={styles.pushOutButton}>
            Push Out
          </button>
        )}
      </div>
    </div>
  );
};

export default TenBallTable; 