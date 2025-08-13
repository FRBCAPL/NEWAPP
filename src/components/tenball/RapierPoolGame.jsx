import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SimplePoolGame.module.css';

// Import Rapier physics - will be loaded dynamically
// import * as RAPIER from '@dimforge/rapier2d';

// Try a different import approach for debugging
import RAPIER from '@dimforge/rapier2d';

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
const BALL_RADIUS = 7.5; // 15mm diameter in pixels

const RapierPoolGame = ({ onGameEnd }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    balls: [],
    isAnimating: false,
    currentPlayer: 1,
    gamePhase: 'break',
    ballInHand: false,
    scratchOccurred: false
  });

  // Aiming state
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [aimLocked, setAimLocked] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(true);

  // Ball images mapping
  const ballImages = {
    cue: cueBall,
    1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
    6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: tenBall
  };

  // Image cache
  const imageCache = useRef({});
  const tableImageCache = useRef(null);

  // Physics state
  const [isPhysicsReady, setIsPhysicsReady] = useState(false);
  const [world, setWorld] = useState(null);
  const [ballBodies, setBallBodies] = useState(new Map());
  const [wallBodies, setWallBodies] = useState([]);
  const [rapierFunctions, setRapierFunctions] = useState(null);

  // Initialize balls in 10-ball rack formation
  const initializeBalls = useCallback(() => {
    const balls = [];
    
    // Add cue ball first
    balls.push({
      id: 'cue',
      x: 100,
      y: 150,
      vx: 0,
      vy: 0,
      visible: true,
      pocketed: false
    });
    
    // CSI 10-ball racking positions (triangle formation)
    // Row 1: 1 ball (apex)
    // Row 2: 2 balls
    // Row 3: 3 balls (10-ball in center)
    // Row 4: 4 balls (2-ball and 3-ball on ends)
    const rackPositions = [
      { x: 450, y: 150 }, // Row 1: 1-ball (apex)
      { x: 462, y: 144 }, // Row 2: left
      { x: 462, y: 156 }, // Row 2: right
      { x: 474, y: 138 }, // Row 3: left
      { x: 474, y: 150 }, // Row 3: center (10-ball)
      { x: 474, y: 162 }, // Row 3: right
      { x: 486, y: 132 }, // Row 4: left end (2-ball or 3-ball)
      { x: 486, y: 144 }, // Row 4: left center
      { x: 486, y: 156 }, // Row 4: right center
      { x: 486, y: 168 }  // Row 4: right end (2-ball or 3-ball)
    ];

    // CSI 10-ball racking according to official rules:
    // 1-ball at apex, 10-ball in center of row 3, 2&3 balls randomly on ends of row 4
    // Remaining balls (4,5,6,7,8,9) placed randomly
    
    // Create array of remaining balls to place randomly
    const remainingBalls = [4, 5, 6, 7, 8, 9];
    
    // Shuffle the remaining balls
    for (let i = remainingBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingBalls[i], remainingBalls[j]] = [remainingBalls[j], remainingBalls[i]];
    }
    
    // Randomly decide if 2-ball goes left or right end
    const twoBallLeft = Math.random() < 0.5;
    
    const ballPlacement = [
      1,   // Row 1: apex
      remainingBalls[0],   // Row 2: left (random)
      remainingBalls[1],   // Row 2: right (random)
      remainingBalls[2],   // Row 3: left (random)
      10,  // Row 3: center (10-ball)
      remainingBalls[3],   // Row 3: right (random)
      twoBallLeft ? 2 : 3,   // Row 4: left end (2 or 3 randomly)
      remainingBalls[4],   // Row 4: left center (random)
      remainingBalls[5],   // Row 4: right center (random)
      twoBallLeft ? 3 : 2    // Row 4: right end (3 or 2 randomly)
    ];
    
    ballPlacement.forEach((ballId, index) => {
      if (index < rackPositions.length) {
        balls.push({
          id: ballId,
          x: rackPositions[index].x,
          y: rackPositions[index].y,
          vx: 0,
          vy: 0,
          visible: true,
          pocketed: false
        });
      }
    });

    return balls;
  }, []);

  // Initialize physics world
  const initializePhysics = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Initializing Rapier physics...');
      }
      
      // Use the imported RAPIER directly
      if (process.env.NODE_ENV === 'development') {
        console.log('Using imported RAPIER:', RAPIER);
        console.log('RAPIER type:', typeof RAPIER);
        console.log('RAPIER keys:', Object.keys(RAPIER));
      }
      
      // Check if we have the correct module structure
      let initFunction, WorldClass, RigidBodyDescClass, ColliderDescClass;
      
      if (RAPIER.init && typeof RAPIER.init === 'function') {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using RAPIER.init directly');
        }
        initFunction = RAPIER.init;
        WorldClass = RAPIER.World;
        RigidBodyDescClass = RAPIER.RigidBodyDesc;
        ColliderDescClass = RAPIER.ColliderDesc;
      } else if (RAPIER.default && RAPIER.default.init) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using RAPIER.default.init');
        }
        initFunction = RAPIER.default.init;
        WorldClass = RAPIER.default.World;
        RigidBodyDescClass = RAPIER.default.RigidBodyDesc;
        ColliderDescClass = RAPIER.default.ColliderDesc;
      } else if (typeof RAPIER === 'function') {
        if (process.env.NODE_ENV === 'development') {
          console.log('RAPIER is a function, using it as init');
        }
        initFunction = RAPIER;
        // Try to get classes from the initialized module
        const initializedModule = await RAPIER();
        WorldClass = initializedModule.World;
        RigidBodyDescClass = initializedModule.RigidBodyDesc;
        ColliderDescClass = initializedModule.ColliderDesc;
      } else {
        console.error('RAPIER structure:', RAPIER);
        throw new Error('Could not find Rapier functions in imported module');
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Found Rapier functions:', { 
          hasInitFunction: !!initFunction, 
          hasWorldClass: !!WorldClass, 
          hasRigidBodyDescClass: !!RigidBodyDescClass, 
          hasColliderDescClass: !!ColliderDescClass 
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Calling Rapier init function...');
      }
      await initFunction();
      if (process.env.NODE_ENV === 'development') {
        console.log('Rapier initialization completed');
      }
      
      // Create physics world with gravity
      const gravity = { x: 0.0, y: 0.0 }; // No gravity for pool
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating physics world with gravity:', gravity);
      }
      const world = new WorldClass(gravity);
      if (process.env.NODE_ENV === 'development') {
        console.log('Physics world created:', world);
      }
      setWorld(world);
      
      // Store the Rapier functions for later use
      setRapierFunctions({ 
        World: WorldClass, 
        RigidBodyDesc: RigidBodyDescClass, 
        ColliderDesc: ColliderDescClass 
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Physics world created successfully');
      }
      setIsPhysicsReady(true);
    } catch (error) {
      console.error('Failed to initialize Rapier physics:', error);
      console.error('Error details:', error.message, error.stack);
      setIsPhysicsReady(false);
      
      // Temporary fallback: set physics as ready anyway for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting physics as ready for fallback testing...');
      }
      setIsPhysicsReady(true);
    }
  }, []);

  // Create physics bodies for balls and walls
  const createPhysicsBodies = useCallback(async (balls, physicsWorld) => {
    const targetWorld = physicsWorld || world;
    if (process.env.NODE_ENV === 'development') {
      console.log('createPhysicsBodies called with world:', !!targetWorld, 'balls:', balls.length);
    }
    if (!targetWorld || !rapierFunctions) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No world or Rapier functions available, returning early');
      }
      return;
    }
    
    try {
      const { World: WorldClass, RigidBodyDesc: RigidBodyDescClass, ColliderDesc: ColliderDescClass } = rapierFunctions;
      
      const newBallBodies = new Map();
      const newWallBodies = [];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating ball bodies for', balls.length, 'balls');
      }
      // Create ball bodies
      balls.forEach((ball, index) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Creating body for ball ${ball.id} at position (${ball.x}, ${ball.y})`);
        }
        const rigidBodyDesc = RigidBodyDescClass.dynamic()
          .setTranslation(ball.x, ball.y);
        
        const rigidBody = targetWorld.createRigidBody(rigidBodyDesc);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Created rigid body for ball ${ball.id}:`, rigidBody);
        }
        
        const colliderDesc = ColliderDescClass.ball(BALL_RADIUS)
          .setRestitution(0.9) // Bouncy
          .setFriction(0.1);   // Low friction
        
        const collider = targetWorld.createCollider(colliderDesc, rigidBody);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Created collider for ball ${ball.id}:`, collider);
        }
        
        newBallBodies.set(ball.id, { rigidBody, collider });
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating wall bodies');
      }
      // Create wall bodies (table boundaries)
      const wallThickness = 10;
      const walls = [
        // Top wall
        { x: TABLE_WIDTH / 2, y: wallThickness / 2, width: TABLE_WIDTH, height: wallThickness },
        // Bottom wall
        { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - wallThickness / 2, width: TABLE_WIDTH, height: wallThickness },
        // Left wall
        { x: wallThickness / 2, y: TABLE_HEIGHT / 2, width: wallThickness, height: TABLE_HEIGHT },
        // Right wall
        { x: TABLE_WIDTH - wallThickness / 2, y: TABLE_HEIGHT / 2, width: wallThickness, height: TABLE_HEIGHT }
      ];
      
      walls.forEach((wall, index) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Creating wall ${index} at (${wall.x}, ${wall.y})`);
        }
        const rigidBodyDesc = RigidBodyDescClass.fixed()
          .setTranslation(wall.x, wall.y);
        
        const rigidBody = targetWorld.createRigidBody(rigidBodyDesc);
        
        const colliderDesc = ColliderDescClass.cuboid(wall.width / 2, wall.height / 2)
          .setRestitution(0.8) // Bouncy walls
          .setFriction(0.1);
        
        const collider = targetWorld.createCollider(colliderDesc, rigidBody);
        newWallBodies.push({ rigidBody, collider });
      });
      
      setBallBodies(newBallBodies);
      setWallBodies(newWallBodies);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Physics bodies created successfully:', newBallBodies.size, 'balls,', newWallBodies.length, 'walls');
      }
    } catch (error) {
      console.error('Failed to create physics bodies:', error);
      console.error('Error details:', error.message, error.stack);
    }
  }, [rapierFunctions]);

  // Initialize game
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Game initialization starting...');
    }
    const balls = initializeBalls();
    if (process.env.NODE_ENV === 'development') {
      console.log('Initialized balls:', balls);
    }
    setGameState(prev => ({ ...prev, balls }));
    
    // Test Rapier import first
    if (process.env.NODE_ENV === 'development') {
      console.log('Testing Rapier import...');
      console.log('Imported RAPIER:', RAPIER);
      console.log('RAPIER type:', typeof RAPIER);
      console.log('RAPIER keys:', Object.keys(RAPIER));
      if (RAPIER.default) {
        console.log('RAPIER.default keys:', Object.keys(RAPIER.default));
      }
    }
    
    // Initialize physics
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting physics initialization...');
    }
    initializePhysics().then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Physics initialization completed in useEffect');
      }
      setIsPhysicsReady(true);
    }).catch((error) => {
      console.error('Physics initialization failed in useEffect:', error);
    });
  }, [initializeBalls, initializePhysics]);

  // Handle mouse aiming
  const handleMouseMove = useCallback((e) => {
    if (gameState.isAnimating || aimLocked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cueBall = gameState.balls.find(ball => ball.id === 'cue');
    if (!cueBall) return;
    
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x);
    setAimAngle(angle);
  }, [gameState.isAnimating, aimLocked, gameState.balls]);

  // Handle shot execution
  const executeShot = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('executeShot called with:', {
        aimLocked,
        isAnimating: gameState.isAnimating,
        power,
        angle: aimAngle
      });
    }
    
    if (!aimLocked) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Shot blocked: aim not locked');
      }
      return;
    }
    
    if (gameState.isAnimating) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Shot blocked: already animating');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Executing shot with power:', power, 'angle:', aimAngle);
    }
    setGameState(prev => ({ ...prev, isAnimating: true }));
    setAimLocked(false);
    
    // Apply physics impulse to cue ball
    const cueBallBody = ballBodies.get('cue');
    if (process.env.NODE_ENV === 'development') {
      console.log('Cue ball body found:', !!cueBallBody, 'Ball bodies size:', ballBodies.size);
    }
    
    if (cueBallBody) {
      const impulseX = Math.cos(aimAngle) * power * 500; // Physics impulse
      const impulseY = Math.sin(aimAngle) * power * 500;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Applying impulse to cue ball:', impulseX, impulseY);
      }
      
      // Apply impulse to the physics body
      cueBallBody.rigidBody.applyImpulse({ x: impulseX, y: impulseY }, true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('No cue ball physics body found! Ball bodies:', Array.from(ballBodies.keys()));
        console.log('Using fallback movement for testing...');
      }
      setGameState(prev => ({
        ...prev,
        balls: prev.balls.map(ball => {
          if (ball.id === 'cue') {
            const velocityX = Math.cos(aimAngle) * power * 10;
            const velocityY = Math.sin(aimAngle) * power * 10;
            return {
              ...ball,
              x: ball.x + velocityX,
              y: ball.y + velocityY,
              vx: velocityX,
              vy: velocityY
            };
          }
          return ball;
        })
      }));
    }
    
    // Stop animation after 2 seconds
    setTimeout(() => {
      setGameState(prev => ({ ...prev, isAnimating: false }));
    }, 2000);
  }, [aimLocked, gameState.isAnimating, power, aimAngle, gameState.balls]);

  // Handle mouse click to lock aim
  const handleMouseClick = useCallback(() => {
    if (gameState.isAnimating) return;
    setAimLocked(!aimLocked);
  }, [gameState.isAnimating, aimLocked]);

  // Draw the game - consolidated into a single useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Draw table background
    if (tableImageCache.current) {
      ctx.drawImage(tableImageCache.current, 0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    } else {
      // Draw a fallback green table while image loads
      ctx.fillStyle = '#0a5f0a';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      
      // Draw table rails
      ctx.fillStyle = '#2d1810';
      ctx.fillRect(0, 0, TABLE_WIDTH, 20); // Top rail
      ctx.fillRect(0, TABLE_HEIGHT - 20, TABLE_WIDTH, 20); // Bottom rail
      ctx.fillRect(0, 0, 20, TABLE_HEIGHT); // Left rail
      ctx.fillRect(TABLE_WIDTH - 20, 0, 20, TABLE_HEIGHT); // Right rail
      
      // Load table image
      const tableImg = new Image();
      tableImg.onload = () => {
        tableImageCache.current = tableImg;
        console.log('Table image loaded successfully');
      };
      tableImg.onerror = (error) => {
        console.error('Failed to load table image:', error);
      };
      tableImg.src = predatorTable;
    }

    // Draw balls
    gameState.balls.forEach(ball => {
      if (ball.visible && !ball.pocketed) {
        const imageSrc = ballImages[ball.id];
        if (imageSrc) {
          drawBall(ctx, ball, imageSrc);
        } else {
          console.error('No image found for ball:', ball.id);
        }
      }
    });

    // Draw aim line and trajectory
    if (!gameState.isAnimating) {
      const cueBall = gameState.balls.find(ball => ball.id === 'cue');
      if (cueBall) {
        // Draw trajectory preview if enabled and not locked
        if (showTrajectory && !aimLocked) {
          ctx.save();
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cueBall.x, cueBall.y);
          const endX = cueBall.x + Math.cos(aimAngle) * 30;
          const endY = cueBall.y + Math.sin(aimAngle) * 30;
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
        }

        // Draw aim line if locked
        if (aimLocked) {
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(cueBall.x, cueBall.y);
          const endX = cueBall.x + Math.cos(aimAngle) * 50;
          const endY = cueBall.y + Math.sin(aimAngle) * 50;
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }, [gameState.balls, aimAngle, aimLocked, showTrajectory, gameState.isAnimating, ballImages]);

  // Physics simulation loop - optimized to prevent excessive re-rendering
  useEffect(() => {
    if (!world || !isPhysicsReady || ballBodies.size === 0) {
      return;
    }
    
    const timeStep = 1 / 60; // 60 FPS
    let animationId;
    
    const simulatePhysics = () => {
      // Step the physics simulation
      world.step();
      
      // Update ball positions from physics bodies
      setGameState(prev => {
        const updatedBalls = prev.balls.map(ball => {
          const bodyData = ballBodies.get(ball.id);
          if (bodyData) {
            const position = bodyData.rigidBody.translation();
            const velocity = bodyData.rigidBody.linvel();
            
            return {
              ...ball,
              x: position.x,
              y: position.y,
              vx: velocity.x,
              vy: velocity.y
            };
          }
          return ball;
        });
        
        return { ...prev, balls: updatedBalls };
      });
      
      animationId = requestAnimationFrame(simulatePhysics);
    };
    
    simulatePhysics();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [world, isPhysicsReady, ballBodies.size]); // Removed ballBodies from dependencies
  
  // Create physics bodies when world is ready - optimized dependencies
  useEffect(() => {
    if (world && isPhysicsReady && rapierFunctions && gameState.balls.length > 0 && ballBodies.size === 0) {
      createPhysicsBodies(gameState.balls, world).catch(error => {
        console.error('Failed to create physics bodies:', error);
      });
    }
  }, [world, isPhysicsReady, rapierFunctions, gameState.balls.length, ballBodies.size, createPhysicsBodies]);

  // Draw a ball
  const drawBall = (ctx, ball, imageSrc) => {
    if (!imageCache.current[imageSrc]) {
      const img = new Image();
      img.onload = () => {
        imageCache.current[imageSrc] = img;
        console.log('Ball image loaded:', imageSrc);
      };
      img.onerror = (error) => {
        console.error('Failed to load ball image:', imageSrc, error);
        // Draw a fallback colored circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
        if (ball.id === 'cue') {
          ctx.fillStyle = '#ffffff'; // White for cue ball
        } else {
          ctx.fillStyle = `hsl(${(ball.id * 36) % 360}, 70%, 50%)`; // Different colors for each ball
        }
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      };
      img.src = imageSrc;
    } else {
      const img = imageCache.current[imageSrc];
      ctx.save();
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(img, ball.x - BALL_RADIUS, ball.y - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
      ctx.restore();
    }
  };

  return (
    <div className={styles.simplePoolGame}>
      <div className={styles.gameHeader}>
        <h2>Pool Game</h2>
        <p>Realistic pool game with Rapier physics</p>
        <p>Physics Status: {isPhysicsReady ? 'Ready' : 'Loading...'}</p>
        <p>Debug: Component rendered at {new Date().toLocaleTimeString()}</p>
        <p>Debug: Ball count: {gameState.balls.length}</p>
        <p>Debug: Ball bodies: {ballBodies.size}</p>
      </div>

      <div className={styles.tableContainer}>
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
          className={styles.tableCanvas}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.powerControl}>
          <label>Power: {Math.round(power * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
          />
        </div>

        <button
          onClick={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Shoot button clicked!');
            }
            executeShot();
          }}
          disabled={!aimLocked || gameState.isAnimating}
          className={styles.shootButton}
        >
          {aimLocked ? 'SHOOT!' : 'LOCK AIM FIRST'}
        </button>

        <div className={styles.gameInfo}>
          <span>Player: {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
          <span>Status: {gameState.isAnimating ? 'Animating' : aimLocked ? 'Ready to shoot' : 'Move mouse to aim'}</span>
        </div>
      </div>
    </div>
  );
};

export default RapierPoolGame;
