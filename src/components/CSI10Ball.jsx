import React, { useRef, useEffect, useState, useCallback } from "react";
import table2 from "./PoolTableSVG/table2.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import styles from "./modal/PinLogin.module.css";
import { CueStickOverlay } from "./CueStick";
import { PoolBallRenderer } from "./PoolBalls";

// 🎱 CSI 10-BALL GAME - OFFICIAL RULES
// User-controlled 10-ball game following CSI tournament rules

// === CONSTANTS ===
const BALLS = [
  { key: "cue", src: cueBall, alt: "Cue Ball", number: 0, type: "cue" },
  { key: "1", src: null, alt: "1 Ball", number: 1, type: "object" },
  { key: "2", src: null, alt: "2 Ball", number: 2, type: "object" },
  { key: "3", src: null, alt: "3 Ball", number: 3, type: "object" },
  { key: "4", src: null, alt: "4 Ball", number: 4, type: "object" },
  { key: "5", src: null, alt: "5 Ball", number: 5, type: "object" },
  { key: "6", src: null, alt: "6 Ball", number: 6, type: "object" },
  { key: "7", src: null, alt: "7 Ball", number: 7, type: "object" },
  { key: "8", src: eightBall, alt: "8 Ball", number: 8, type: "object" },
  { key: "9", src: nineBall, alt: "9 Ball", number: 9, type: "object" },
  { key: "10", src: tenBall, alt: "10 Ball", number: 10, type: "money" }
];

const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_SIZE = 14;
const BALL_RADIUS = BALL_SIZE / 2;
const RAIL_WIDTH = 25;
const POCKET_RADIUS = 18;

// 🎯 Pro Physics Constants
const PHYSICS = {
  FRICTION: 0.985,
  ROLLING_FRICTION: 0.998,
  CUSHION_RESTITUTION: 0.85,
  BALL_RESTITUTION: 0.95,
  CLOTH_DRAG: 0.002,
  SPIN_DECAY: 0.99,
  MIN_VELOCITY: 0.05,
  MAX_VELOCITY: 25,
  CUE_TIP_FRICTION: 0.8
};

// 🎮 Controls
const CONTROLS = {
  MIN_POWER: 1,
  MAX_POWER: 20,
  ENGLISH_RANGE: 0.8,
  AIM_SENSITIVITY: 0.01,
  POWER_SENSITIVITY: 0.1
};

// === VECTOR2 CLASS ===
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { 
    const len = this.length();
    return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
  }
}

// === BALL CLASS ===
class Ball {
  constructor(key, x, y, number, type) {
    this.key = key;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.spin = new Vector2(0, 0);
    this.topSpin = 0;
    this.number = number;
    this.type = type;
    this.visible = true;
    this.pocketed = false;
    this.radius = BALL_RADIUS;
    this.mass = 1.0;
  }

  update(deltaTime) {
    if (this.pocketed) return;

    // Apply spin effects to velocity
    this.velocity = this.velocity.add(this.spin.multiply(0.001));
    
    // Apply friction
    const speed = this.velocity.length();
    if (speed > PHYSICS.MIN_VELOCITY) {
      const frictionForce = this.spin.length() > 0.1 ? PHYSICS.FRICTION : PHYSICS.ROLLING_FRICTION;
      this.velocity = this.velocity.multiply(frictionForce);
      
      // Cloth drag
      const dragForce = speed * PHYSICS.CLOTH_DRAG;
      const dragDirection = this.velocity.normalize().multiply(-dragForce);
      this.velocity = this.velocity.add(dragDirection);
    } else {
      this.velocity = new Vector2(0, 0);
    }

    // Decay spin
    this.spin = this.spin.multiply(PHYSICS.SPIN_DECAY);
    this.topSpin *= PHYSICS.SPIN_DECAY;

    // Update position
    this.position = this.position.add(this.velocity.multiply(deltaTime));

    // Rail collisions
    this.handleRailCollisions();
  }

  handleRailCollisions() {
    const minX = RAIL_WIDTH + this.radius;
    const maxX = TABLE_WIDTH - RAIL_WIDTH - this.radius;
    const minY = RAIL_WIDTH + this.radius;
    const maxY = TABLE_HEIGHT - RAIL_WIDTH - this.radius;

    if (this.position.x < minX) {
      this.position.x = minX;
      this.velocity.x = Math.abs(this.velocity.x) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.x *= -0.8;
    } else if (this.position.x > maxX) {
      this.position.x = maxX;
      this.velocity.x = -Math.abs(this.velocity.x) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.x *= -0.8;
    }

    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
    } else if (this.position.y > maxY) {
      this.position.y = maxY;
      this.velocity.y = -Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
    }
  }

  isMoving() {
    return this.velocity.length() > PHYSICS.MIN_VELOCITY;
  }
}

export default function CSI10Ball() {
  // Game state
  const [gameState, setGameState] = useState('aiming'); // aiming, shooting, animating, gameOver
  const [power, setPower] = useState(5);
  const [aimAngle, setAimAngle] = useState(0);
  const [english, setEnglish] = useState({ x: 0, y: 0 });
  const [showAimLine, setShowAimLine] = useState(true);
  
  // 10-Ball specific state
  const [currentPlayer, setCurrentPlayer] = useState(1); // Player 1 or 2
  const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });
  const [targetBall, setTargetBall] = useState(1); // Next ball to hit (CSI rule)
  const [foulMessage, setFoulMessage] = useState('');
  const [gameMessage, setGameMessage] = useState('Player 1: Hit the 1-ball first');
  const [isFoul, setIsFoul] = useState(false);
  const [shotsInRack, setShotsInRack] = useState(0);

  // Refs
  const ballRefs = useRef({});
  const balls = useRef([]);
  const pockets = useRef([]);
  const animationFrame = useRef(null);
  const firstContact = useRef(null);
  const ballsPocketed = useRef([]);

  // Initialize game
  useEffect(() => {
    initializeGame();
    return cleanup;
  }, []);

  const cleanup = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  };

  const initializeGame = () => {
    // Initialize pockets
    pockets.current = [
      { position: new Vector2(RAIL_WIDTH, RAIL_WIDTH), radius: POCKET_RADIUS },
      { position: new Vector2(TABLE_WIDTH - RAIL_WIDTH, RAIL_WIDTH), radius: POCKET_RADIUS },
      { position: new Vector2(RAIL_WIDTH, TABLE_HEIGHT - RAIL_WIDTH), radius: POCKET_RADIUS },
      { position: new Vector2(TABLE_WIDTH - RAIL_WIDTH, TABLE_HEIGHT - RAIL_WIDTH), radius: POCKET_RADIUS },
      { position: new Vector2(TABLE_WIDTH / 2, RAIL_WIDTH), radius: POCKET_RADIUS * 0.9 },
      { position: new Vector2(TABLE_WIDTH / 2, TABLE_HEIGHT - RAIL_WIDTH), radius: POCKET_RADIUS * 0.9 }
    ];

    rackBalls();
  };

  const rackBalls = () => {
    balls.current = [];
    ballRefs.current = {};

    // 10-Ball triangle rack
    const rackApex = new Vector2(TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2);
    const ballSpacing = BALL_SIZE * 1.02;
    
    // Official 10-ball rack positions
    const rackPositions = [
      [0, 0],        // 1-ball at apex
      [-1, -0.5], [-1, 0.5],  // Row 2
      [-2, -1], [-2, 0], [-2, 1],  // Row 3
      [-3, -1.5], [-3, -0.5], [-3, 0.5], [-3, 1.5]  // Row 4
    ];

    // Create specific ball arrangement for 10-ball
    const ballOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    ballOrder.forEach((ballNumber, index) => {
      if (index < rackPositions.length) {
        const [row, col] = rackPositions[index];
        const x = rackApex.x + row * ballSpacing * 0.866;
        const y = rackApex.y + col * ballSpacing;
        
        const ballData = BALLS.find(b => b.number === ballNumber);
        const ball = new Ball(ballData.key, x, y, ballData.number, ballData.type);
        balls.current.push(ball);
        ballRefs.current[ballData.key] = React.createRef();
      }
    });

    // Create cue ball
    const cueBall = new Ball('cue', TABLE_WIDTH * 0.75, TABLE_HEIGHT / 2, 0, 'cue');
    balls.current.unshift(cueBall);
    ballRefs.current['cue'] = React.createRef();

    // Reset game state
    setTargetBall(1);
    setGameMessage('Player 1: Hit the 1-ball first');
    setFoulMessage('');
    setShotsInRack(0);
    
    renderBalls();
  };

  const executeShot = () => {
    if (gameState !== 'aiming') return;

    const cueBall = balls.current.find(ball => ball.key === 'cue');
    if (!cueBall) return;

    // Reset shot tracking
    firstContact.current = null;
    ballsPocketed.current = [];
    
    // Calculate shot direction
    const direction = new Vector2(Math.cos(aimAngle), Math.sin(aimAngle));
    
    // Apply power and english
    cueBall.velocity = direction.multiply(power);
    cueBall.spin = new Vector2(english.x * CONTROLS.ENGLISH_RANGE, english.y * CONTROLS.ENGLISH_RANGE);
    cueBall.topSpin = english.y * CONTROLS.ENGLISH_RANGE;

    setGameState('animating');
    setShotsInRack(prev => prev + 1);
    startAnimation();
  };

  const startAnimation = () => {
    const animate = (timestamp) => {
      const deltaTime = 1;

      // Update all balls
      balls.current.forEach(ball => ball.update(deltaTime));

      // Check for collisions
      handleCollisions();

      // Check for pocketed balls
      handlePocketChecks();

      // Render
      renderBalls();

      // Continue if balls moving
      const anyMoving = balls.current.some(ball => ball.isMoving());
      
      if (anyMoving) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        endShot();
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
  };

  const handleCollisions = () => {
    for (let i = 0; i < balls.current.length; i++) {
      for (let j = i + 1; j < balls.current.length; j++) {
        const ballA = balls.current[i];
        const ballB = balls.current[j];
        
        if (ballA.pocketed || ballB.pocketed) continue;

        const distance = ballA.position.subtract(ballB.position).length();
        const minDistance = ballA.radius + ballB.radius;

        if (distance < minDistance) {
          // Track first contact for CSI rules
          if (!firstContact.current && ballA.key === 'cue' && ballB.number > 0) {
            firstContact.current = ballB.number;
          } else if (!firstContact.current && ballB.key === 'cue' && ballA.number > 0) {
            firstContact.current = ballA.number;
          }
          
          resolveBallCollision(ballA, ballB);
        }
      }
    }
  };

  const resolveBallCollision = (ballA, ballB) => {
    const collision = ballB.position.subtract(ballA.position);
    const distance = collision.length();
    
    if (distance === 0) return;

    const collisionNormal = collision.normalize();
    const overlap = (ballA.radius + ballB.radius) - distance;

    // Separate balls
    const separation = collisionNormal.multiply(overlap * 0.5);
    ballA.position = ballA.position.subtract(separation);
    ballB.position = ballB.position.add(separation);

    // Calculate collision response
    const relativeVelocity = ballA.velocity.subtract(ballB.velocity);
    const velocityAlongNormal = relativeVelocity.dot(collisionNormal);

    if (velocityAlongNormal > 0) return;

    const restitution = PHYSICS.BALL_RESTITUTION;
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / (ballA.mass + ballB.mass);

    const impulse = collisionNormal.multiply(impulseMagnitude);
    ballA.velocity = ballA.velocity.add(impulse.multiply(ballB.mass));
    ballB.velocity = ballB.velocity.subtract(impulse.multiply(ballA.mass));

    // Spin transfer
    const spinTransfer = 0.1;
    const avgSpin = ballA.spin.add(ballB.spin).multiply(0.5);
    ballA.spin = ballA.spin.multiply(1 - spinTransfer).add(avgSpin.multiply(spinTransfer));
    ballB.spin = ballB.spin.multiply(1 - spinTransfer).add(avgSpin.multiply(spinTransfer));
  };

  const handlePocketChecks = () => {
    balls.current.forEach(ball => {
      if (ball.pocketed) return;

      pockets.current.forEach(pocket => {
        const distance = ball.position.subtract(pocket.position).length();
        if (distance < pocket.radius - ball.radius * 0.3) {
          ball.pocketed = true;
          ball.visible = false;
          ball.velocity = new Vector2(0, 0);
          ballsPocketed.current.push(ball.number);
        }
      });
    });
  };

  const endShot = () => {
    setGameState('aiming');
    
    // Apply CSI 10-Ball rules
    const cueScratch = ballsPocketed.current.includes(0);
    const validFirstContact = firstContact.current === targetBall;
    const tenBallPocketed = ballsPocketed.current.includes(10);
    const currentTargetPocketed = ballsPocketed.current.includes(targetBall);
    
    let foul = false;
    let message = '';
    let switchPlayer = false;

    // Check for fouls
    if (cueScratch) {
      foul = true;
      message = 'FOUL: Cue ball scratch!';
      switchPlayer = true;
    } else if (!firstContact.current) {
      foul = true;
      message = 'FOUL: No ball contacted!';
      switchPlayer = true;
    } else if (!validFirstContact) {
      foul = true;
      message = `FOUL: Must hit ${targetBall}-ball first!`;
      switchPlayer = true;
    }

    // Check for 10-ball win
    if (tenBallPocketed && !foul) {
      if (targetBall === 10 || ballsPocketed.current.length > 1) {
        // Won by pocketing 10-ball legally
        setPlayerScores(prev => ({
          ...prev,
          [currentPlayer]: prev[currentPlayer] + 1
        }));
        setGameMessage(`🏆 Player ${currentPlayer} wins the rack!`);
        setTimeout(() => {
          const playAgain = window.confirm(`Player ${currentPlayer} won! Play another rack?`);
          if (playAgain) {
            rackBalls();
          } else {
            setGameState('gameOver');
          }
        }, 2000);
        return;
      } else {
        // 10-ball pocketed illegally
        foul = true;
        message = 'FOUL: 10-ball pocketed illegally!';
        switchPlayer = true;
      }
    }

    // Handle cue ball scratch
    if (cueScratch) {
      // Ball in hand behind the head string
      const cueBall = balls.current.find(ball => ball.key === 'cue');
      if (cueBall) {
        cueBall.position = new Vector2(TABLE_WIDTH * 0.75, TABLE_HEIGHT / 2);
        cueBall.visible = true;
        cueBall.pocketed = false;
        cueBall.velocity = new Vector2(0, 0);
      }
    }

    // Update target ball
    if (!foul && currentTargetPocketed && targetBall < 10) {
      setTargetBall(prev => prev + 1);
      message = `Good shot! Now shoot the ${targetBall + 1}-ball`;
    } else if (!foul && !currentTargetPocketed && ballsPocketed.current.length === 0) {
      switchPlayer = true;
      message = `No balls pocketed. Player ${currentPlayer === 1 ? 2 : 1}'s turn`;
    } else if (!foul && ballsPocketed.current.length > 0 && !currentTargetPocketed) {
      message = `Continue shooting. Target: ${targetBall}-ball`;
    }

    // Switch players if needed
    if (switchPlayer) {
      setCurrentPlayer(prev => prev === 1 ? 2 : 1);
    }

    // Update messages
    setIsFoul(foul);
    setFoulMessage(foul ? message : '');
    setGameMessage(foul ? '' : message || `Player ${switchPlayer ? (currentPlayer === 1 ? 2 : 1) : currentPlayer}: Hit the ${targetBall}-ball first`);

    renderBalls();
  };

  const renderBalls = () => {
    balls.current.forEach(ball => {
      const ref = ballRefs.current[ball.key];
      if (ref?.current && ball.visible) {
        ref.current.style.left = `${ball.position.x - ball.radius}px`;
        ref.current.style.top = `${ball.position.y - ball.radius}px`;
        ref.current.style.opacity = ball.pocketed ? '0' : '1';
      }
    });
  };

  // Control handlers
  const handleMouseMove = useCallback((e) => {
    if (gameState !== 'aiming') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const cueBall = balls.current.find(ball => ball.key === 'cue');
    if (cueBall) {
      const angle = Math.atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
      setAimAngle(angle);
    }
  }, [gameState]);

  const handleClick = useCallback((e) => {
    if (gameState === 'aiming') {
      executeShot();
    }
  }, [gameState, power, aimAngle, english]);

  const newRack = () => {
    rackBalls();
    setCurrentPlayer(1);
  };

  // === RENDER ===
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {/* CSI 10-Ball Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        padding: '10px 20px',
        borderRadius: '8px',
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center',
        border: '2px solid #FF8C00'
      }}>
        <h2 style={{ margin: '0 0 5px 0' }}>🏆 CSI 10-Ball</h2>
        <div>Player 1: {playerScores[1]} | Player 2: {playerScores[2]}</div>
      </div>

      {/* Game Status */}
      <div style={{
        background: isFoul ? 'rgba(255,0,0,0.9)' : 'rgba(0,128,0,0.9)',
        padding: '8px 15px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        minHeight: '20px'
      }}>
        {foulMessage || gameMessage}
      </div>

      {/* Target Ball Indicator */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '8px 15px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        🎯 Target Ball: {targetBall} | Current Player: {currentPlayer} | Shots: {shotsInRack}
      </div>

      {/* Controls Panel */}
      <div style={{
        display: 'flex',
        gap: '15px',
        padding: '10px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px'
      }}>
        <div>
          <label>Power: {power.toFixed(1)}</label>
          <input
            type="range"
            min={CONTROLS.MIN_POWER}
            max={CONTROLS.MAX_POWER}
            step="0.1"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            style={{ display: 'block', width: '80px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>
        
        <div>
          <label>English X: {english.x.toFixed(2)}</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={english.x}
            onChange={(e) => setEnglish(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
            style={{ display: 'block', width: '80px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>
        
        <div>
          <label>English Y: {english.y.toFixed(2)}</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={english.y}
            onChange={(e) => setEnglish(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
            style={{ display: 'block', width: '80px' }}
            disabled={gameState !== 'aiming'}
          />
        </div>
        
        <button 
          onClick={() => setShowAimLine(!showAimLine)}
          style={{
            padding: '5px 10px',
            background: showAimLine ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Aim Line: {showAimLine ? 'ON' : 'OFF'}
        </button>

        <button 
          onClick={newRack}
          style={{
            padding: '5px 10px',
            background: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          New Rack
        </button>
      </div>

      {/* Pool Table */}
      <div
        style={{
          position: "relative",
          width: TABLE_WIDTH,
          height: TABLE_HEIGHT,
          background: "#1a5f1a",
          border: "3px solid #8B4513",
          borderRadius: "8px",
          overflow: "hidden",
          cursor: gameState === 'aiming' ? 'crosshair' : 'default'
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

        {/* Cue Stick */}
        <CueStickOverlay
          cueBallPosition={balls.current.find(b => b.key === 'cue')?.position}
          aimAngle={aimAngle}
          power={power}
          isAiming={gameState === 'aiming'}
          tableWidth={TABLE_WIDTH}
          tableHeight={TABLE_HEIGHT}
        />

        {/* Aim Line */}
        {showAimLine && gameState === 'aiming' && balls.current.find(b => b.key === 'cue') && (
          <div
            style={{
              position: 'absolute',
              left: balls.current.find(b => b.key === 'cue').position.x,
              top: balls.current.find(b => b.key === 'cue').position.y,
              width: '200px',
              height: '2px',
              background: 'rgba(255, 255, 0, 0.7)',
              transformOrigin: '0 50%',
              transform: `rotate(${aimAngle}rad)`,
              zIndex: 5,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Power Meter */}
        {gameState === 'aiming' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '20px',
            height: '100px',
            background: 'rgba(0,0,0,0.7)',
            border: '2px solid white',
            borderRadius: '10px',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              bottom: '0',
              width: '100%',
              height: `${(power / CONTROLS.MAX_POWER) * 100}%`,
              background: `linear-gradient(to top, green, yellow, red)`,
              borderRadius: '0 0 8px 8px'
            }} />
          </div>
        )}

        {/* Balls */}
        {BALLS.map(ballData => {
          const ball = balls.current.find(b => b.key === ballData.key);
          if (!ball || !ball.visible) return null;

          return (
            <div
              key={ballData.key}
              ref={ballRefs.current[ballData.key]}
              style={{
                position: "absolute",
                width: BALL_SIZE,
                height: BALL_SIZE,
                zIndex: ballData.key === 'cue' ? 15 : (ball.number === targetBall ? 14 : 12),
                pointerEvents: 'none',
                filter: ball.number === targetBall && ballData.key !== 'cue' 
                  ? 'drop-shadow(0 0 6px #FFD700)' 
                  : ballData.key === 'cue' 
                    ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' 
                    : 'none',
                border: ball.number === targetBall && ballData.key !== 'cue' ? '2px solid #FFD700' : 'none',
                borderRadius: '50%'
              }}
            >
              <PoolBallRenderer
                number={ballData.number}
                size={BALL_SIZE}
                svgSrc={ballData.src}
                alt={ballData.alt}
              />
            </div>
          );
        })}
      </div>

      {/* CSI Rules Info */}
      <div style={{
        background: 'rgba(0,0,0,0.9)',
        padding: '10px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '11px',
        maxWidth: TABLE_WIDTH,
        textAlign: 'center'
      }}>
        <strong>🏆 CSI 10-Ball Rules:</strong> Hit balls in numerical order (1-10). 
        10-ball is the money ball. Fouls include: scratch, wrong ball first, no rail after contact.
      </div>
    </div>
  );
}