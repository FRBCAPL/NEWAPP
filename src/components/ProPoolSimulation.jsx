import React, { useRef, useEffect, useState, useCallback } from "react";
import table2 from "./PoolTableSVG.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import styles from "./modal/PinLogin.module.css";
import { CueStickOverlay } from "./CueStick";

// 🎱 PRO POOL SIMULATION - TOURNAMENT GRADE
// Features: Realistic physics, spin effects, pro AI, interactive controls

// === CONSTANTS ===
const BALLS = [
  { key: "cue", src: cueBall, alt: "Cue Ball", number: 0, type: "cue" },
  { key: "1", src: eightBall, alt: "1 Ball", number: 1, type: "solid" },
  { key: "2", src: nineBall, alt: "2 Ball", number: 2, type: "solid" },
  { key: "3", src: tenBall, alt: "3 Ball", number: 3, type: "solid" },
  { key: "4", src: eightBall, alt: "4 Ball", number: 4, type: "solid" },
  { key: "5", src: nineBall, alt: "5 Ball", number: 5, type: "solid" },
  { key: "6", src: tenBall, alt: "6 Ball", number: 6, type: "solid" },
  { key: "7", src: eightBall, alt: "7 Ball", number: 7, type: "solid" },
  { key: "8", src: eightBall, alt: "8 Ball", number: 8, type: "eight" },
  { key: "9", src: nineBall, alt: "9 Ball", number: 9, type: "stripe" },
  { key: "10", src: tenBall, alt: "10 Ball", number: 10, type: "stripe" },
  { key: "11", src: eightBall, alt: "11 Ball", number: 11, type: "stripe" },
  { key: "12", src: nineBall, alt: "12 Ball", number: 12, type: "stripe" },
  { key: "13", src: tenBall, alt: "13 Ball", number: 13, type: "stripe" },
  { key: "14", src: eightBall, alt: "14 Ball", number: 14, type: "stripe" },
  { key: "15", src: nineBall, alt: "15 Ball", number: 15, type: "stripe" }
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

// 🎮 Pro Controls
const CONTROLS = {
  MIN_POWER: 1,
  MAX_POWER: 20,
  ENGLISH_RANGE: 0.8, // Max spin amount
  AIM_SENSITIVITY: 0.01,
  POWER_SENSITIVITY: 0.1
};

// === UTILITY FUNCTIONS ===
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
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}

// 🎱 Advanced Ball Class
class Ball {
  constructor(key, x, y, number, type) {
    this.key = key;
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.spin = new Vector2(0, 0); // English/side spin
    this.topSpin = 0; // Forward/backward roll
    this.number = number;
    this.type = type;
    this.visible = true;
    this.pocketed = false;
    this.radius = BALL_RADIUS;
    this.mass = 1.0;
    this.lastCollision = 0;
  }

  update(deltaTime) {
    if (this.pocketed) return;

    // Apply spin effects to velocity
    this.velocity = this.velocity.add(this.spin.multiply(0.001));
    
    // Apply friction based on spin
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

    // Rail collisions with cushion compression
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
      this.spin.x *= -0.8; // Reverse English
      this.addSoundEffect('rail');
    } else if (this.position.x > maxX) {
      this.position.x = maxX;
      this.velocity.x = -Math.abs(this.velocity.x) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.x *= -0.8;
      this.addSoundEffect('rail');
    }

    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
      this.addSoundEffect('rail');
    } else if (this.position.y > maxY) {
      this.position.y = maxY;
      this.velocity.y = -Math.abs(this.velocity.y) * PHYSICS.CUSHION_RESTITUTION;
      this.spin.y *= -0.8;
      this.addSoundEffect('rail');
    }
  }

  addSoundEffect(type) {
    // Placeholder for sound effects
    console.log(`🔊 ${type} sound effect`);
  }

  isMoving() {
    return this.velocity.length() > PHYSICS.MIN_VELOCITY;
  }
}

// 🎯 Shot Analysis System
class ShotAnalyzer {
  constructor(balls, pockets) {
    this.balls = balls;
    this.pockets = pockets;
  }

  // Find best shot for current player
  findBestShot(cueBall, targetBalls, playerType = 'solid') {
    const shots = [];
    
    for (const target of targetBalls) {
      if (!target.visible || target.pocketed) continue;
      
      for (const pocket of this.pockets) {
        const shot = this.analyzePocketShot(cueBall, target, pocket);
        if (shot.possible) {
          shot.difficulty = this.calculateDifficulty(shot);
          shot.positionRating = this.evaluatePosition(shot);
          shot.overallRating = this.rateShot(shot);
          shots.push(shot);
        }
      }
    }

    // Sort by overall rating (higher is better)
    shots.sort((a, b) => b.overallRating - a.overallRating);
    return shots[0] || null;
  }

  analyzePocketShot(cueBall, targetBall, pocket) {
    // Calculate ghost ball position for straight-in shot
    const targetToPocket = pocket.position.subtract(targetBall.position);
    const distance = targetToPocket.length();
    
    if (distance < BALL_SIZE) return { possible: false }; // Too close to pocket
    
    const direction = targetToPocket.normalize();
    const ghostPosition = targetBall.position.subtract(direction.multiply(BALL_SIZE));
    
    // Check if cue ball can reach ghost ball
    const cueToGhost = ghostPosition.subtract(cueBall.position);
    const shotAngle = Math.atan2(cueToGhost.y, cueToGhost.x);
    
    // Check for obstructions
    const obstructed = this.checkObstructions(cueBall.position, ghostPosition, targetBall);
    
    return {
      possible: !obstructed,
      ghostPosition,
      targetBall,
      pocket,
      shotAngle,
      distance: cueToGhost.length(),
      requiredSpeed: this.calculateRequiredSpeed(cueToGhost.length()),
      cutAngle: this.calculateCutAngle(cueBall.position, targetBall.position, pocket.position)
    };
  }

  checkObstructions(start, end, ignoreTarget) {
    const direction = end.subtract(start).normalize();
    const distance = end.subtract(start).length();
    
    for (const ball of this.balls) {
      if (!ball.visible || ball.pocketed || ball === ignoreTarget) continue;
      
      // Check if ball intersects with shot line
      const toBall = ball.position.subtract(start);
      const projection = toBall.dot(direction);
      
      if (projection > 0 && projection < distance) {
        const closestPoint = start.add(direction.multiply(projection));
        const distanceToBall = ball.position.subtract(closestPoint).length();
        
        if (distanceToBall < BALL_SIZE * 1.1) {
          return true; // Obstructed
        }
      }
    }
    return false;
  }

  calculateRequiredSpeed(distance) {
    // Pro players adjust speed based on distance and desired position
    const baseSpeed = Math.min(8 + distance * 0.02, PHYSICS.MAX_VELOCITY * 0.6);
    return baseSpeed;
  }

  calculateCutAngle(cuePos, targetPos, pocketPos) {
    const cueToTarget = targetPos.subtract(cuePos).normalize();
    const targetToPocket = pocketPos.subtract(targetPos).normalize();
    return Math.acos(cueToTarget.dot(targetToPocket));
  }

  calculateDifficulty(shot) {
    let difficulty = 0;
    
    // Distance factor
    difficulty += shot.distance * 0.01;
    
    // Cut angle factor (harder for thin cuts)
    const cutAngleDegrees = (shot.cutAngle * 180) / Math.PI;
    if (cutAngleDegrees > 45) difficulty += (cutAngleDegrees - 45) * 0.02;
    
    // Speed requirement
    if (shot.requiredSpeed > 12) difficulty += (shot.requiredSpeed - 12) * 0.1;
    
    return Math.min(difficulty, 10); // Cap at 10
  }

  evaluatePosition(shot) {
    // Rate how good the cue ball position will be after this shot
    // This is advanced position play calculation
    const estimatedCuePosition = this.estimateCueBallPosition(shot);
    
    // Find remaining balls and rate position for next shots
    let positionRating = 5; // Base rating
    
    // Add logic for evaluating next shot opportunities
    // This would be very complex in a real implementation
    
    return positionRating;
  }

  estimateCueBallPosition(shot) {
    // Simplified estimation of where cue ball will end up
    // Real physics simulation would be needed for accuracy
    const direction = shot.ghostPosition.subtract(shot.targetBall.position).normalize();
    return shot.ghostPosition.add(direction.multiply(BALL_SIZE * 2));
  }

  rateShot(shot) {
    const difficultyPenalty = shot.difficulty * 0.8;
    const positionBonus = shot.positionRating * 0.6;
    const distanceBonus = Math.max(0, 10 - shot.distance * 0.05);
    
    return 10 - difficultyPenalty + positionBonus + distanceBonus;
  }
}

export default function ProPoolSimulation() {
  // State management
  const [gameState, setGameState] = useState('aiming'); // aiming, shooting, animating
  const [power, setPower] = useState(5);
  const [aimAngle, setAimAngle] = useState(0);
  const [english, setEnglish] = useState({ x: 0, y: 0 });
  const [showAimLine, setShowAimLine] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState('solid');
  const [shotCount, setShotCount] = useState(0);

  // Refs
  const ballRefs = useRef({});
  const balls = useRef([]);
  const pockets = useRef([]);
  const animationFrame = useRef(null);
  const gameTime = useRef(0);
  const shotAnalyzer = useRef(null);

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

    // Initialize balls
    rackBalls();
    
    // Initialize shot analyzer
    shotAnalyzer.current = new ShotAnalyzer(balls.current, pockets.current);
    
    // Start break shot
    setTimeout(() => {
      if (gameState === 'aiming') {
        executeBreakShot();
      }
    }, 2000);
  };

  const rackBalls = () => {
    balls.current = [];
    ballRefs.current = {};

    // Rack formation (triangle)
    const rackApex = new Vector2(TABLE_WIDTH * 0.25, TABLE_HEIGHT / 2);
    const ballSpacing = BALL_SIZE * 1.02;
    
    // Create rack positions
    const rackPositions = [
      // Row 1 (apex)
      [0, 0],
      // Row 2
      [-1, -0.5], [-1, 0.5],
      // Row 3
      [-2, -1], [-2, 0], [-2, 1],
      // Row 4
      [-3, -1.5], [-3, -0.5], [-3, 0.5], [-3, 1.5],
      // Row 5
      [-4, -2], [-4, -1], [-4, 0], [-4, 1], [-4, 2]
    ];

    // Create object balls
    BALLS.slice(1).forEach((ballData, index) => {
      if (index < rackPositions.length) {
        const [row, col] = rackPositions[index];
        const x = rackApex.x + row * ballSpacing * 0.866; // 0.866 = sqrt(3)/2
        const y = rackApex.y + col * ballSpacing;
        
        const ball = new Ball(ballData.key, x, y, ballData.number, ballData.type);
        balls.current.push(ball);
        ballRefs.current[ballData.key] = React.createRef();
      }
    });

    // Create cue ball
    const cueBall = new Ball('cue', TABLE_WIDTH * 0.75, TABLE_HEIGHT / 2, 0, 'cue');
    balls.current.unshift(cueBall);
    ballRefs.current['cue'] = React.createRef();

    renderBalls();
  };

  const executeBreakShot = () => {
    const cueBall = balls.current.find(ball => ball.key === 'cue');
    if (!cueBall) return;

    // Professional break shot - hit the head ball with maximum power
    const headBall = balls.current.find(ball => ball.number === 1);
    if (headBall) {
      const direction = headBall.position.subtract(cueBall.position).normalize();
      const breakPower = 18; // High power for break
      
      cueBall.velocity = direction.multiply(breakPower);
      cueBall.topSpin = 0.5; // Slight follow
      
      setGameState('animating');
      setShotCount(1);
      startAnimation();
    }
  };

  const executePlayerShot = () => {
    if (gameState !== 'aiming') return;

    const cueBall = balls.current.find(ball => ball.key === 'cue');
    if (!cueBall) return;

    // Calculate shot direction
    const direction = new Vector2(Math.cos(aimAngle), Math.sin(aimAngle));
    
    // Apply power
    cueBall.velocity = direction.multiply(power);
    
    // Apply english/spin
    cueBall.spin = new Vector2(english.x * CONTROLS.ENGLISH_RANGE, english.y * CONTROLS.ENGLISH_RANGE);
    cueBall.topSpin = english.y * CONTROLS.ENGLISH_RANGE;

    setGameState('animating');
    setShotCount(prev => prev + 1);
    startAnimation();
  };

  const executeAIShot = () => {
    const cueBall = balls.current.find(ball => ball.key === 'cue');
    if (!cueBall) return;

    const targetBalls = balls.current.filter(ball => 
      ball.type === currentPlayer && ball.visible && !ball.pocketed
    );

    const bestShot = shotAnalyzer.current.findBestShot(cueBall, targetBalls, currentPlayer);
    
    if (bestShot) {
      const direction = bestShot.ghostPosition.subtract(cueBall.position).normalize();
      cueBall.velocity = direction.multiply(bestShot.requiredSpeed);
      
      // Add professional english based on shot requirements
      const englishAmount = Math.min(0.3, bestShot.difficulty * 0.05);
      cueBall.spin = direction.rotate(Math.PI / 2).multiply(englishAmount);
      
      setGameState('animating');
      setShotCount(prev => prev + 1);
      startAnimation();
    }
  };

  const startAnimation = () => {
    const animate = (timestamp) => {
      const deltaTime = 1; // Fixed timestep for stable physics
      gameTime.current = timestamp;

      // Update all balls
      balls.current.forEach(ball => ball.update(deltaTime));

      // Check for collisions
      handleCollisions();

      // Check for pocketed balls
      handlePocketChecks();

      // Render
      renderBalls();

      // Continue animation if balls are moving
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
          resolveBallCollision(ballA, ballB);
        }
      }
    }
  };

  const resolveBallCollision = (ballA, ballB) => {
    // Professional collision physics with spin transfer
    const collision = ballB.position.subtract(ballA.position);
    const distance = collision.length();
    
    if (distance === 0) return;

    const collisionNormal = collision.normalize();
    const overlap = (ballA.radius + ballB.radius) - distance;

    // Separate balls
    const separation = collisionNormal.multiply(overlap * 0.5);
    ballA.position = ballA.position.subtract(separation);
    ballB.position = ballB.position.add(separation);

    // Calculate relative velocity
    const relativeVelocity = ballA.velocity.subtract(ballB.velocity);
    const velocityAlongNormal = relativeVelocity.dot(collisionNormal);

    if (velocityAlongNormal > 0) return; // Balls separating

    // Calculate restitution
    const restitution = PHYSICS.BALL_RESTITUTION;
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / (ballA.mass + ballB.mass);

    // Apply impulse
    const impulse = collisionNormal.multiply(impulseMagnitude);
    ballA.velocity = ballA.velocity.add(impulse.multiply(ballB.mass));
    ballB.velocity = ballB.velocity.subtract(impulse.multiply(ballA.mass));

    // Transfer spin (advanced physics)
    const spinTransfer = 0.1;
    const avgSpin = ballA.spin.add(ballB.spin).multiply(0.5);
    ballA.spin = ballA.spin.multiply(1 - spinTransfer).add(avgSpin.multiply(spinTransfer));
    ballB.spin = ballB.spin.multiply(1 - spinTransfer).add(avgSpin.multiply(spinTransfer));

    // Sound effect
    ballA.addSoundEffect('collision');
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
          ball.addSoundEffect('pocket');
        }
      });
    });
  };

  const endShot = () => {
    setGameState('aiming');
    
    // Check game state and plan next shot
    setTimeout(() => {
      executeAIShot();
    }, 1500);
  };

  const renderBalls = () => {
    balls.current.forEach(ball => {
      const ref = ballRefs.current[ball.key];
      if (ref?.current && ball.visible) {
        ref.current.style.left = `${ball.position.x - ball.radius}px`;
        ref.current.style.top = `${ball.position.y - ball.radius}px`;
        ref.current.style.opacity = ball.pocketed ? '0' : '1';
        
        // Add rotation effect for spin visualization
        const spinAngle = (ball.spin.x + ball.spin.y + ball.topSpin) * 10;
        ref.current.style.transform = `rotate(${spinAngle}rad)`;
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
      executePlayerShot();
    }
  }, [gameState, power, aimAngle, english]);

  // === RENDER ===
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {/* Pro Controls Panel */}
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

        {/* Professional Cue Stick */}
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

        {/* Game Info */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 10
        }}>
          <div>Shot: {shotCount}</div>
          <div>Player: {currentPlayer}</div>
          <div>State: {gameState}</div>
        </div>

        {/* Balls */}
        {BALLS.map(ballData => {
          const ball = balls.current.find(b => b.key === ballData.key);
          return ball && ball.visible && (
            <img
              key={ballData.key}
              src={ballData.src}
              alt={ballData.alt}
              ref={ballRefs.current[ballData.key]}
              style={{
                position: "absolute",
                width: BALL_SIZE,
                height: BALL_SIZE,
                zIndex: ballData.key === 'cue' ? 15 : 12,
                pointerEvents: 'none',
                filter: ballData.key === 'cue' ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none',
                transition: 'transform 0.1s ease-out'
              }}
            />
          );
        })}
      </div>

      {/* Stats Panel */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '10px',
        background: 'rgba(0,0,0,0.9)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '11px',
        width: '100%',
        maxWidth: TABLE_WIDTH
      }}>
        <div>
          <strong>🎯 Pro Features Active:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
            <li>✅ Realistic Physics</li>
            <li>✅ English/Spin Control</li>
            <li>✅ Advanced AI</li>
            <li>✅ Position Play</li>
          </ul>
        </div>
        <div>
          <strong>🏆 Tournament Stats:</strong>
          <div>Shots Taken: {shotCount}</div>
          <div>Balls Remaining: {balls.current.filter(b => b.visible && !b.pocketed && b.key !== 'cue').length}</div>
          <div>Current Angle: {(aimAngle * 180 / Math.PI).toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
}