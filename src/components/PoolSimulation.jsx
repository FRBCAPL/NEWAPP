import React, { useRef, useEffect, useState } from "react";
import table2 from "./PoolTableSVG/table2.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import styles from "./modal/PinLogin.module.css";
import logoImg from '../assets/logo.png';

// --- Constants ---
const BALLS = [
  { key: "cue", src: cueBall, alt: "Cue Ball" },
  { key: "8", src: eightBall, alt: "8 Ball" },
  { key: "9", src: nineBall, alt: "9 Ball" },
  { key: "10", src: tenBall, alt: "10 Ball" }
];
const TABLE_WIDTH = 600;
const TABLE_HEIGHT = 300;
const BALL_SIZE = 15;
const BALL_RADIUS = BALL_SIZE / 2;
const PLAYFIELD_OFFSET_X = 0;
const PLAYFIELD_OFFSET_Y = 0;
const CORNER_MARGIN_FACTOR = 3.0;
const SIDE_MARGIN_FACTOR = 1.8;

// --- Utility Functions ---
function isInPocket(ball) {
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
}

function resolveBallCollision(a, b, ballSize) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0 || dist >= ballSize) return;

  // 1. Resolve overlap
  const overlap = ballSize - dist + 0.01;
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
}

function lineIntersectsBall(x1, y1, x2, y2, ball, ignoreKey) {
  if (!ball.visible || ball.key === ignoreKey) return false;
  const A = {x: x1, y: y1};
  const B = {x: x2, y: y2};
  const C = {x: ball.x, y: ball.y};
  const AB = {x: B.x - A.x, y: B.y - A.y};
  const AC = {x: C.x - A.x, y: C.y - A.y};
  const ab2 = AB.x * AB.x + AB.y * AB.y;
  const t = Math.max(0, Math.min(1, (AC.x * AB.x + AC.y * AB.y) / ab2));
  const closest = {x: A.x + AB.x * t, y: A.y + AB.y * t};
  const dist = Math.hypot(closest.x - C.x, closest.y - C.y);
  return dist < BALL_SIZE * 0.95;
}

function getPockets() {
  return [
    { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y },
    { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT }
  ];
}

// --- New: Aim at the pocket mouth/opening, not the center
function getPocketOpening(pocket, target) {
  // Offset toward cushion nose; 0.6*BALL_SIZE is a good value for realism
  const offset = BALL_SIZE * 0.6;
  const toPocketX = pocket.x - target.x;
  const toPocketY = pocket.y - target.y;
  const toPocketLen = Math.hypot(toPocketX, toPocketY);
  return {
    x: pocket.x - (toPocketX / toPocketLen) * offset,
    y: pocket.y - (toPocketY / toPocketLen) * offset
  };
}

export default function PoolSimulation() {
  // Responsive container size state
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 300 });
  // Add tick state for forced re-render
  const [tick, setTick] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const tableImgRef = useRef(null);
  const ballRefs = useRef({
    cue: React.createRef(),
    8: React.createRef(),
    9: React.createRef(),
    10: React.createRef()
  });
  const balls = useRef({});
  const initialPositions = useRef({});
  const animationFrame = useRef(null);
  const cueTimeout = useRef(null);
  const shotCount = useRef(0);

  // Add canvas ref for drawing
  const canvasRef = useRef(null);

  // Preload SVG images for balls, logo, and table, and track loading
  const ballImages = useRef({});
  // Add logo image ref
  const logoImage = useRef(null);
  useEffect(() => {
    let loaded = 0;
    const total = 6; // 4 balls + 1 logo + 1 table
    function checkLoaded() {
      loaded++;
      if (loaded === total) setAssetsLoaded(true);
    }
    const imgs = {
      cue: new window.Image(),
      8: new window.Image(),
      9: new window.Image(),
      10: new window.Image(),
    };
    imgs.cue.onload = checkLoaded;
    imgs[8].onload = checkLoaded;
    imgs[9].onload = checkLoaded;
    imgs[10].onload = checkLoaded;
    imgs.cue.onerror = checkLoaded;
    imgs[8].onerror = checkLoaded;
    imgs[9].onerror = checkLoaded;
    imgs[10].onerror = checkLoaded;
    imgs.cue.src = cueBall;
    imgs[8].src = eightBall;
    imgs[9].src = nineBall;
    imgs[10].src = tenBall;
    ballImages.current = imgs;
    // Preload logo
    const logo = new window.Image();
    logo.onload = checkLoaded;
    logo.onerror = checkLoaded;
    logo.src = logoImg;
    logoImage.current = logo;
    // Preload table SVG
    const tableImg = new window.Image();
    tableImg.onload = checkLoaded;
    tableImg.onerror = checkLoaded;
    tableImg.src = table2;
    tableImgRef.current = tableImg;
  }, []);

  // Save initial positions for cue ball reset
  function saveInitialPositions() {
    Object.keys(balls.current).forEach(key => {
      initialPositions.current[key] = {
        x: balls.current[key].x,
        y: balls.current[key].y
      };
    });
    setTick(t => t + 1); // force re-render after initial positions
  }

  // Rack balls at start or rerack
  function rackBalls() {
    const rackApexX = TABLE_WIDTH * 0.3;
    const rackApexY = TABLE_HEIGHT / 2;
    const rackSpacingX = BALL_SIZE * 0.87;
    const rackSpacingY = BALL_SIZE / 2;

    function jitter() {
      return (Math.random() - 0.5) * 2.5;
    }

    balls.current = {
      8: {
        ref: ballRefs.current[8],
        x: rackApexX + jitter(),
        y: rackApexY + jitter(),
        vx: 0, vy: 0, isMoving: false,
        visible: true
      },
      9: {
        ref: ballRefs.current[9],
        x: rackApexX - rackSpacingX + jitter(),
        y: rackApexY - rackSpacingY + jitter(),
        vx: 0, vy: 0, isMoving: false,
        visible: true
      },
      10: {
        ref: ballRefs.current[10],
        x: rackApexX - rackSpacingX + jitter(),
        y: rackApexY + rackSpacingY + jitter(),
        vx: 0, vy: 0, isMoving: false,
        visible: true
      },
      cue: {
        ref: ballRefs.current.cue,
        x: TABLE_WIDTH * 0.8 + jitter(),
        y: TABLE_HEIGHT / 2 + jitter(),
        vx: 0, vy: 0, isMoving: false,
        visible: true
      }
    };

    Object.values(balls.current).forEach(ball => {
      if (ball.ref.current) {
        ball.ref.current.style.opacity = 1;
      }
    });

    saveInitialPositions();
    setTick(t => t + 1); // force re-render after racking
  }

  function rerackBalls() {
    rackBalls();
    shotCount.current = 0;
    setTimeout(() => {
      breakCueBall();
      setTick(t => t + 1); // force re-render after rerack
    }, 1000);
  }

  // On mount: rack and break
  useEffect(() => {
    rackBalls();
    setTimeout(() => {
      breakCueBall();
    }, 1000);
    return () => {
      cancelAnimationFrame(animationFrame.current);
      clearTimeout(cueTimeout.current);
    };
    // eslint-disable-next-line
  }, []);

  // Break shot: first shot is a blast, then AI takes over
  function breakCueBall() {
    if (!balls.current.cue) return;
    if (balls.current.cue.isMoving) return;

    const cue = balls.current.cue;
    shotCount.current += 1;

    if (shotCount.current === 1) {
      const rackApex = balls.current[8];
      const dx = rackApex.x - cue.x;
      const dy = rackApex.y - cue.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Add a random angle (±5 degrees) and speed (15-17)
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * (Math.PI / 36);
      const breakSpeed = 15 + Math.random() * 2;

      cue.vx = Math.cos(angle) * breakSpeed;
      cue.vy = Math.sin(angle) * breakSpeed;
      cue.isMoving = true;
      console.log('Break: cue.vx =', cue.vx, 'cue.vy =', cue.vy);
      animateBalls();
      return;
    }

    smartCueShot();
  }

  // AI shot logic (now aims at pocket mouth)
  function smartCueShot() {
    const objectBallOrder = ["8", "9", "10"];
    const targetKey = objectBallOrder.find(key => balls.current[key]?.visible);
    if (!targetKey) return; // game over

    const cue = balls.current.cue;
    const target = balls.current[targetKey];
    const pockets = getPockets();

    let best = null;
    let bestScore = Infinity;

    // ---------- 1. Try straight-in shots (aiming at the pocket mouth) ----------
    for (const pocket of pockets) {
      const opening = getPocketOpening(pocket, target);
      const toOpeningX = opening.x - target.x;
      const toOpeningY = opening.y - target.y;
      const toOpeningLen = Math.hypot(toOpeningX, toOpeningY);

      // Ghost ball position for straight-in shot
      const ghostX = target.x - (toOpeningX / toOpeningLen) * BALL_SIZE;
      const ghostY = target.y - (toOpeningY / toOpeningLen) * BALL_SIZE;

      // Check if cue can hit ghost ball directly (no balls in the way)
      let blocked = false;
      for (const otherKey of objectBallOrder) {
        if (otherKey === targetKey) continue;
        if (balls.current[otherKey]?.visible &&
            lineIntersectsBall(cue.x, cue.y, ghostX, ghostY, {...balls.current[otherKey], key: otherKey}, targetKey)) {
          blocked = true;
          break;
        }
      }

      // Check if object ball path to pocket opening is clear
      let pathBlocked = false;
      for (const otherKey of objectBallOrder.concat("cue")) {
        if (otherKey === targetKey) continue;
        if (balls.current[otherKey]?.visible &&
            lineIntersectsBall(target.x, target.y, opening.x, opening.y, {...balls.current[otherKey], key: otherKey}, targetKey)) {
          pathBlocked = true;
          break;
        }
      }

      // Estimate scratch risk: if cue ball path after hit goes toward a pocket
      let scratchRisk = 0;
      for (const testPocket of pockets) {
        const distToPocket = Math.hypot(ghostX - testPocket.x, ghostY - testPocket.y);
        if (distToPocket < BALL_SIZE * 1.8) scratchRisk += 1;
      }

      // Prefer cue ball finishing near center table
      const centerX = TABLE_WIDTH / 2, centerY = TABLE_HEIGHT / 2;
      const cueToGhost = Math.hypot(cue.x - ghostX, cue.y - ghostY);
      const finishDist = Math.hypot(ghostX - centerX, ghostY - centerY);

      // Score: block penalty, path block penalty, scratch penalty, shot distance, cue finish
      const score =
        (blocked ? 1000 : 0) +
        (pathBlocked ? 1000 : 0) +
        scratchRisk * 150 +
        cueToGhost * 0.7 +
        finishDist * 0.3;

      if (score < bestScore) {
        bestScore = score;
        best = { ghostX, ghostY };
      }
    }

    // ---------- 2. Try simple bank shots if no straight shot found ----------
    if (!best || bestScore > 999) {
      for (const pocket of pockets) {
        // Try banking the object ball off each rail
        const rails = [
          { x: Math.max(target.x, 2 * BALL_RADIUS), y: 0 }, // top
          { x: Math.max(target.x, 2 * BALL_RADIUS), y: TABLE_HEIGHT }, // bottom
          { x: 0, y: Math.max(target.y, 2 * BALL_RADIUS) }, // left
          { x: TABLE_WIDTH, y: Math.max(target.y, 2 * BALL_RADIUS) } // right
        ];
        for (const rail of rails) {
          // Reflect the pocket opening across the rail to get the "aim point"
          const opening = getPocketOpening(pocket, target);
          let reflectX = opening.x, reflectY = opening.y;
          if (rail.x === 0) reflectX = -opening.x;
          if (rail.x === TABLE_WIDTH) reflectX = 2 * TABLE_WIDTH - opening.x;
          if (rail.y === 0) reflectY = -opening.y;
          if (rail.y === TABLE_HEIGHT) reflectY = 2 * TABLE_HEIGHT - opening.y;

          // Calculate the direction from object ball to the "virtual pocket"
          const toVirtualX = reflectX - target.x;
          const toVirtualY = reflectY - target.y;
          const toVirtualLen = Math.hypot(toVirtualX, toVirtualY);
          const ghostX = target.x - (toVirtualX / toVirtualLen) * BALL_SIZE;
          const ghostY = target.y - (toVirtualY / toVirtualLen) * BALL_SIZE;

          // Check if cue can hit ghost ball directly (no balls in the way)
          let blocked = false;
          for (const otherKey of objectBallOrder) {
            if (otherKey === targetKey) continue;
            if (balls.current[otherKey]?.visible &&
                lineIntersectsBall(cue.x, cue.y, ghostX, ghostY, {...balls.current[otherKey], key: otherKey}, targetKey)) {
              blocked = true;
              break;
            }
          }

          // Score: block penalty, prefer banks less than straight shots
          const cueToGhost = Math.hypot(cue.x - ghostX, cue.y - ghostY);
          const score =
            (blocked ? 2000 : 0) +
            cueToGhost * 1.2 + // banks are harder!
            500; // make banks less preferred than straight shots

          if (score < bestScore) {
            bestScore = score;
            best = { ghostX, ghostY };
          }
        }
      }
    }

    // ---------- 3. Try simple kick shots if still no shot ----------
    if (!best || bestScore > 1999) {
      // Try cue ball off each rail to hit the object ball
      const rails = [
        { x: cue.x, y: 0 }, // top
        { x: cue.x, y: TABLE_HEIGHT }, // bottom
        { x: 0, y: cue.y }, // left
        { x: TABLE_WIDTH, y: cue.y } // right
      ];
      for (const rail of rails) {
        // Reflect the object ball across the rail to get the "aim point"
        let reflectX = target.x, reflectY = target.y;
        if (rail.x === 0) reflectX = -target.x;
        if (rail.x === TABLE_WIDTH) reflectX = 2 * TABLE_WIDTH - target.x;
        if (rail.y === 0) reflectY = -target.y;
        if (rail.y === TABLE_HEIGHT) reflectY = 2 * TABLE_HEIGHT - target.y;

        // Calculate the direction from cue to the "virtual object ball"
        const toVirtualX = reflectX - cue.x;
        const toVirtualY = reflectY - cue.y;
        const toVirtualLen = Math.hypot(toVirtualX, toVirtualY);
        const ghostX = cue.x + (toVirtualX / toVirtualLen) * (toVirtualLen * 0.9);
        const ghostY = cue.y + (toVirtualY / toVirtualLen) * (toVirtualLen * 0.9);

        // Score: prefer shorter kicks, penalize
        const cueToGhost = Math.hypot(cue.x - ghostX, cue.y - ghostY);
        const score = cueToGhost * 2 + 2000; // kicks are even less preferred

        if (score < bestScore) {
          bestScore = score;
          best = { ghostX, ghostY };
        }
      }
    }

    // ---------- 4. Fallback: random gentle shot ----------
    if (!best) {
      const angle = Math.atan2(target.y - cue.y, target.x - cue.x) + (Math.random() - 0.5) * 0.2;
      const dist = Math.hypot(target.x - cue.x, target.y - cue.y);
      best = {
        ghostX: cue.x + Math.cos(angle) * dist * 0.8,
        ghostY: cue.y + Math.sin(angle) * dist * 0.8
      };
    }

    // Shoot!
    const shotDx = best.ghostX - cue.x;
    const shotDy = best.ghostY - cue.y;
    const shotLen = Math.hypot(shotDx, shotDy);
    const shotSpeed = 7;
    cue.vx = (shotDx / shotLen) * shotSpeed;
    cue.vy = (shotDy / shotLen) * shotSpeed;
    cue.isMoving = true;
    animateBalls();
  }

  // Main animation loop (no scaling math needed!)
  function animateBalls() {
    console.log('animateBalls called');
    const friction = 0.99;
    const ballSize = BALL_SIZE;
    const radius = ballSize / 2;
    const subSteps = 16;

    // Felt bounds in simulation coordinates
    const FELT_LEFT = 18.25;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 20.20;
    const FELT_BOTTOM = 270.18;

    function step() {
      console.log('animation frame');
      let pocketedThisFrame = [];

      for (let s = 0; s < subSteps; s++) {
        Object.entries(balls.current).forEach(([key, ball]) => {
          if (!ball.visible) return;

          let nextX = ball.x + ball.vx / subSteps;
          let nextY = ball.y + ball.vy / subSteps;

          // --- Rail collision using felt bounds ---
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            ball.x = FELT_LEFT + BALL_RADIUS;
            ball.vx = Math.abs(ball.vx) * 0.8;
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            ball.x = FELT_RIGHT - BALL_RADIUS;
            ball.vx = -Math.abs(ball.vx) * 0.8;
          } else {
            ball.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            ball.y = FELT_TOP + BALL_RADIUS;
            ball.vy = Math.abs(ball.vy) * 0.8;
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
            if (!pocketedThisFrame.includes(key)) pocketedThisFrame.push(key);
            if (ball.ref.current) {
              ball.ref.current.style.opacity = 0;
            }
          }

          // Stop if very slow
          if (ball.isMoving && Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
          }
        });

        // Ball-ball collision
        const keys = Object.keys(balls.current);
        for (let i = 0; i < keys.length; i++) {
          for (let j = i + 1; j < keys.length; j++) {
            const a = balls.current[keys[i]];
            const b = balls.current[keys[j]];
            if (!a.visible || !b.visible) continue;
            resolveBallCollision(a, b, BALL_SIZE);
          }
        }
      }

      // Directly update DOM for all balls (no scaling math needed)
      Object.entries(balls.current).forEach(([key, ball]) => {
        if (ball.ref.current && ball.visible) {
          ball.ref.current.style.left = (ball.x - BALL_RADIUS) + "px";
          ball.ref.current.style.top = (ball.y - BALL_RADIUS) + "px";
          ball.ref.current.style.width = BALL_SIZE + "px";
          ball.ref.current.style.height = BALL_SIZE + "px";
          ball.ref.current.style.opacity = 1;
        }
      });

      // Cue ball scratch
      if (!balls.current.cue.visible) {
        setTimeout(() => {
          const pos = initialPositions.current["cue"];
          if (pos) {
            balls.current["cue"].x = pos.x;
            balls.current["cue"].y = pos.y;
          }
          balls.current["cue"].vx = 0;
          balls.current["cue"].vy = 0;
          balls.current["cue"].isMoving = false;
          balls.current["cue"].visible = true;
          if (balls.current["cue"].ref.current) {
            balls.current["cue"].ref.current.style.opacity = 1;
          }
          setTimeout(() => {
            smartCueShot();
          }, 500);
        }, 800);
        return;
      }

      // 10 ball pocketed (rerack)
      if (!balls.current["10"].visible) {
        setTimeout(() => {
          rerackBalls();
        }, 1200);
        return;
      }

      // Continue animation if any balls moving
      if (Object.values(balls.current).some(ball => ball.isMoving)) {
        animationFrame.current = requestAnimationFrame(step);
      } else if (!cueTimeout.current) {
        animationFrame.current = null; // Mark loop as stopped
        cueTimeout.current = setTimeout(() => {
          cueTimeout.current = null;
          smartCueShot();
        }, 1200);
      } else {
        animationFrame.current = null; // Mark loop as stopped
      }
      setTick(t => t + 1); // force re-render after each animation frame
    }

    animationFrame.current = requestAnimationFrame(step);
  }

  // Helper to scale simulation coordinates to container
  function scaleX(x) {
    return (x / TABLE_WIDTH) * containerSize.width;
  }
  function scaleY(y) {
    return (y / TABLE_HEIGHT) * containerSize.height;
  }
  function scaleBallSize(size) {
    // Use average of width/height scaling for ball size
    const scale = (containerSize.width / TABLE_WIDTH + containerSize.height / TABLE_HEIGHT) / 2;
    return size * scale;
  }

  // Draw table, logo, and balls on canvas
  useEffect(() => {
    if (!assetsLoaded) return; // Wait for SVGs, logo, and table
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    // Draw preloaded SVG table image as background
    const tableImg = tableImgRef.current;
    if (tableImg && tableImg.complete && tableImg.naturalWidth > 0) {
      ctx.drawImage(tableImg, 0, 0, containerSize.width, containerSize.height);
    }
    // Draw logo centered on felt
    const logo = logoImage.current;
    if (logo && logo.complete && logo.naturalWidth > 0) {
      const logoW = containerSize.width * 0.35;
      const logoH = (logo.height / logo.width) * logoW;
      const logoX = (containerSize.width - logoW) / 2;
      const logoY = (containerSize.height - logoH) / 2;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      ctx.restore();
    }
    // Draw balls on top (SVGs only)
    for (const [key, ball] of Object.entries(balls.current)) {
      if (ball.visible === false) continue;
      const bx = scaleX(ball.x);
      const by = scaleY(ball.y);
      const br = scaleBallSize(BALL_SIZE) / 2;
      // Ball shadow
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.ellipse(bx, by + br * 0.38, br * 0.85, br * 0.28, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#222';
      ctx.filter = 'blur(0.7px)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
      // Draw SVG image for the ball (cue, 8, 9, 10) ONLY
      const img = ballImages.current[key];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(
          img,
          bx - br,
          by - br,
          br * 2,
          br * 2
        );
        ctx.restore();
      } else {
        // fallback: draw a red X if SVG fails
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - br, by - br);
        ctx.lineTo(bx + br, by + br);
        ctx.moveTo(bx + br, by - br);
        ctx.lineTo(bx - br, by + br);
        ctx.stroke();
        ctx.restore();
      }
      // Ball highlight
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.ellipse(bx - br * 0.32, by - br * 0.32, br * 0.38, br * 0.16, -0.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.filter = 'blur(0.2px)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
      // Draw crisp white circle for number background (8/9/10)
      if (['8', '9', '10'].includes(key)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, br * 0.48, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.10)';
        ctx.shadowBlur = br * 0.08;
        ctx.fill();
        ctx.restore();
      }
      // Draw number for 8/9/10 (bold, centered)
      if (['8', '9', '10'].includes(key)) {
        ctx.save();
        ctx.font = `bold ${Math.round(br * 1.18)}px Arial Black,Arial,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = scaleBallSize(0.7);
        ctx.strokeStyle = '#222';
        ctx.fillStyle = '#000';
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = br * 0.08;
        ctx.strokeText(key, bx, by + 0.5);
        ctx.shadowBlur = 0;
        ctx.fillText(key, bx, by);
        ctx.restore();
      }
    }
  }, [containerSize, tick, assetsLoaded]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        aspectRatio: '2 / 1',
        maxWidth: '100vw',
        height: 'auto',
        position: 'relative',
        background: '#181818',
        borderRadius: 20,
        overflow: 'hidden',
        margin: '0 auto',
        boxShadow: '0 2px 12px #0008',
      }}
    >
      {/* Responsive Canvas for Pool Simulation (no DOM logo overlays) */}
      <canvas
        ref={canvasRef}
        width={containerSize.width * window.devicePixelRatio}
        height={containerSize.height * window.devicePixelRatio}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          borderRadius: 20,
          background: '#181818',
        }}
      />
      {!assetsLoaded && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(24,24,24,0.85)',
          color: '#fff',
          fontSize: 24,
          zIndex: 2,
        }}>
          Loading pool table assets...
        </div>
      )}
    </div>
  );
}
