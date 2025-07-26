import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Elite10Ball.module.css';
import table2 from "./PoolTableSVG/table2.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";

// Constants
const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_SIZE = 15;
const BALL_RADIUS = BALL_SIZE / 2;
const FELT_LEFT = 18.25;
const FELT_RIGHT = 570.77;
const FELT_TOP = 20.20;
const FELT_BOTTOM = 270.18;

const BALLS_CONFIG = [
  { id: 'cue', src: cueBall, name: 'Cue Ball', color: '#FFFFFF' },
  { id: '1', src: null, name: '1 Ball', color: '#FFD700' },
  { id: '2', src: null, name: '2 Ball', color: '#0000FF' },
  { id: '3', src: null, name: '3 Ball', color: '#FF0000' },
  { id: '4', src: null, name: '4 Ball', color: '#800080' },
  { id: '5', src: null, name: '5 Ball', color: '#FFA500' },
  { id: '6', src: null, name: '6 Ball', color: '#008000' },
  { id: '7', src: null, name: '7 Ball', color: '#8B4513' },
  { id: '8', src: eightBall, name: '8 Ball', color: '#000000' },
  { id: '9', src: nineBall, name: '9 Ball', color: '#FFFF00' },
  { id: '10', src: tenBall, name: '10 Ball', color: '#00BFFF' }
];

export default function Elite10Ball({ showPaths = true, showAngles = true }) {
  const [balls, setBalls] = useState({});
  const [selectedBall, setSelectedBall] = useState('cue');
  const [aimPoint, setAimPoint] = useState({ x: TABLE_WIDTH / 2, y: TABLE_HEIGHT / 2 });
  const [showGuides, setShowGuides] = useState(showPaths);
  const [shotPower, setShotPower] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [paths, setPaths] = useState([]);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize balls
  useEffect(() => {
    const initialBalls = {};
    
    // Rack formation for 10-ball
    const rackX = TABLE_WIDTH * 0.3;
    const rackY = TABLE_HEIGHT / 2;
    const spacing = BALL_SIZE * 0.9;
    
    // 1 ball at apex
    initialBalls['1'] = { x: rackX, y: rackY, vx: 0, vy: 0, visible: true };
    
    // Second row: 2, 3
    initialBalls['2'] = { x: rackX + spacing, y: rackY - spacing/2, vx: 0, vy: 0, visible: true };
    initialBalls['3'] = { x: rackX + spacing, y: rackY + spacing/2, vx: 0, vy: 0, visible: true };
    
    // Third row: 4, 10, 5
    initialBalls['4'] = { x: rackX + spacing*2, y: rackY - spacing, vx: 0, vy: 0, visible: true };
    initialBalls['10'] = { x: rackX + spacing*2, y: rackY, vx: 0, vy: 0, visible: true }; // 10 in middle
    initialBalls['5'] = { x: rackX + spacing*2, y: rackY + spacing, vx: 0, vy: 0, visible: true };
    
    // Fourth row: 6, 7, 8, 9
    initialBalls['6'] = { x: rackX + spacing*3, y: rackY - spacing*1.5, vx: 0, vy: 0, visible: true };
    initialBalls['7'] = { x: rackX + spacing*3, y: rackY - spacing/2, vx: 0, vy: 0, visible: true };
    initialBalls['8'] = { x: rackX + spacing*3, y: rackY + spacing/2, vx: 0, vy: 0, visible: true };
    initialBalls['9'] = { x: rackX + spacing*3, y: rackY + spacing*1.5, vx: 0, vy: 0, visible: true };
    
    // Cue ball
    initialBalls['cue'] = { x: TABLE_WIDTH * 0.75, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, visible: true };
    
    setBalls(initialBalls);
  }, []);

  // Calculate and draw ball paths
  const calculatePath = useCallback((ball, targetX, targetY, power) => {
    const path = [];
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return path;
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Initial velocity based on power
    const speed = power * 0.3;
    let vx = dirX * speed;
    let vy = dirY * speed;
    
    // Simulate path
    let x = ball.x;
    let y = ball.y;
    let steps = 0;
    const maxSteps = 500;
    const friction = 0.985;
    
    while (steps < maxSteps && (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1)) {
      x += vx;
      y += vy;
      
      // Check wall collisions
      if (x <= FELT_LEFT + BALL_RADIUS || x >= FELT_RIGHT - BALL_RADIUS) {
        vx = -vx * 0.9;
        x = x <= FELT_LEFT + BALL_RADIUS ? FELT_LEFT + BALL_RADIUS : FELT_RIGHT - BALL_RADIUS;
      }
      if (y <= FELT_TOP + BALL_RADIUS || y >= FELT_BOTTOM - BALL_RADIUS) {
        vy = -vy * 0.9;
        y = y <= FELT_TOP + BALL_RADIUS ? FELT_TOP + BALL_RADIUS : FELT_BOTTOM - BALL_RADIUS;
      }
      
      // Apply friction
      vx *= friction;
      vy *= friction;
      
      // Store path point every few steps
      if (steps % 3 === 0) {
        path.push({ x, y, vx, vy });
      }
      
      steps++;
    }
    
    return path;
  }, []);

  // Draw paths on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showGuides) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale
    const scaleX = canvas.width / TABLE_WIDTH;
    const scaleY = canvas.height / TABLE_HEIGHT;
    
    // Draw path for selected ball
    if (balls[selectedBall] && balls[selectedBall].visible) {
      const path = calculatePath(balls[selectedBall], aimPoint.x, aimPoint.y, shotPower);
      
      if (path.length > 0) {
        // Draw aiming line
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(balls[selectedBall].x * scaleX, balls[selectedBall].y * scaleY);
        ctx.lineTo(aimPoint.x * scaleX, aimPoint.y * scaleY);
        ctx.stroke();
        
        // Draw predicted path
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(balls[selectedBall].x * scaleX, balls[selectedBall].y * scaleY);
        
        path.forEach((point, index) => {
          ctx.lineTo(point.x * scaleX, point.y * scaleY);
          
          // Fade out the path
          ctx.globalAlpha = 1 - (index / path.length);
        });
        
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw power indicator
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.fillText(`Power: ${shotPower}%`, 10, 25);
        
        // Draw angle if enabled
        if (showAngles) {
          const angle = Math.atan2(aimPoint.y - balls[selectedBall].y, aimPoint.x - balls[selectedBall].x);
          const degrees = (angle * 180 / Math.PI + 360) % 360;
          ctx.fillText(`Angle: ${degrees.toFixed(1)}°`, 10, 45);
        }
      }
    }
    
    // Draw ghost ball at aim point
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(aimPoint.x * scaleX, aimPoint.y * scaleY, BALL_RADIUS * scaleX, 0, Math.PI * 2);
    ctx.stroke();
    
  }, [balls, selectedBall, aimPoint, shotPower, showGuides, calculatePath, showAngles]);

  // Handle mouse/touch events
  const handleMouseMove = (e) => {
    if (!containerRef.current || isAnimating) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);
    
    setAimPoint({ x: Math.max(FELT_LEFT, Math.min(FELT_RIGHT, x)), y: Math.max(FELT_TOP, Math.min(FELT_BOTTOM, y)) });
  };

  const handleShoot = () => {
    if (isAnimating || !balls[selectedBall]) return;
    
    const ball = balls[selectedBall];
    const dx = aimPoint.x - ball.x;
    const dy = aimPoint.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const speed = shotPower * 0.3;
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;
    
    // Update ball velocity
    setBalls(prev => ({
      ...prev,
      [selectedBall]: { ...prev[selectedBall], vx, vy }
    }));
    
    setIsAnimating(true);
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    const animate = () => {
      setBalls(prev => {
        const newBalls = { ...prev };
        let hasMovement = false;
        
        Object.keys(newBalls).forEach(id => {
          const ball = newBalls[id];
          if (!ball.visible) return;
          
          // Update position
          ball.x += ball.vx;
          ball.y += ball.vy;
          
          // Wall collisions
          if (ball.x <= FELT_LEFT + BALL_RADIUS || ball.x >= FELT_RIGHT - BALL_RADIUS) {
            ball.vx = -ball.vx * 0.8;
            ball.x = ball.x <= FELT_LEFT + BALL_RADIUS ? FELT_LEFT + BALL_RADIUS : FELT_RIGHT - BALL_RADIUS;
          }
          if (ball.y <= FELT_TOP + BALL_RADIUS || ball.y >= FELT_BOTTOM - BALL_RADIUS) {
            ball.vy = -ball.vy * 0.8;
            ball.y = ball.y <= FELT_TOP + BALL_RADIUS ? FELT_TOP + BALL_RADIUS : FELT_BOTTOM - BALL_RADIUS;
          }
          
          // Friction
          ball.vx *= 0.985;
          ball.vy *= 0.985;
          
          // Check if still moving
          if (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1) {
            hasMovement = true;
          } else {
            ball.vx = 0;
            ball.vy = 0;
          }
        });
        
        if (!hasMovement) {
          setIsAnimating(false);
        }
        
        return newBalls;
      });
      
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  return (
    <div className={styles.elite10BallContainer}>
      <div className={styles.controls}>
        <button onClick={() => setShowGuides(!showGuides)} className={styles.toggleButton}>
          {showGuides ? 'Hide' : 'Show'} Path Guides
        </button>
        <div className={styles.powerControl}>
          <label>Power: {shotPower}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={shotPower}
            onChange={(e) => setShotPower(Number(e.target.value))}
            className={styles.powerSlider}
          />
        </div>
        <button onClick={handleShoot} disabled={isAnimating} className={styles.shootButton}>
          Shoot!
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={styles.tableContainer}
        onMouseMove={handleMouseMove}
        onClick={handleShoot}
      >
        <img src={table2} alt="Pool Table" className={styles.tableImage} />
        
        <canvas
          ref={canvasRef}
          className={styles.pathCanvas}
        />
        
        {/* Render balls */}
        {Object.entries(balls).map(([id, ball]) => {
          if (!ball.visible) return null;
          const config = BALLS_CONFIG.find(b => b.id === id);
          
          return (
            <div
              key={id}
              className={`${styles.ball} ${selectedBall === id ? styles.selected : ''}`}
              style={{
                left: `${(ball.x / TABLE_WIDTH) * 100}%`,
                top: `${(ball.y / TABLE_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: config?.color || '#FFF'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBall(id);
              }}
            >
              {config?.src ? (
                <img src={config.src} alt={config.name} className={styles.ballImage} />
              ) : (
                <span className={styles.ballNumber}>{id}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}