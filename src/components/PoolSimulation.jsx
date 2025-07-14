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
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 300 });
  const [ready, setReady] = useState(false); // NEW: track if real size is known
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

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
        setReady(true); // NEW: set ready after first real measurement
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate scale factor based on default TABLE_WIDTH and TABLE_HEIGHT
  const scaleX = containerSize.width / 600;
  const scaleY = containerSize.height / 300;

  // Save initial positions for cue ball reset
  function saveInitialPositions() {
    Object.keys(balls.current).forEach(key => {
      initialPositions.current[key] = {
        x: balls.current[key].x,
        y: balls.current[key].y
      };
    });
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
  }

  function rerackBalls() {
    rackBalls();
    shotCount.current = 0;
    setTimeout(() => {
      breakCueBall();
    }, 1000);
  }

  // On mount: rack and break
  useEffect(() => {
    if (!ready) return;
    rackBalls();
    const timeout = setTimeout(() => {
      breakCueBall();
    }, 1000);
    return () => {
      cancelAnimationFrame(animationFrame.current);
      clearTimeout(cueTimeout.current);
      clearTimeout(timeout);
    };
  }, [ready]);

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

      // Directly update DOM for all balls (now using scaling)
      Object.entries(balls.current).forEach(([key, ball]) => {
        if (ball.ref.current && ball.visible) {
          ball.ref.current.style.left = ((ball.x - BALL_RADIUS) * scaleX) + "px";
          ball.ref.current.style.top = ((ball.y - BALL_RADIUS) * scaleY) + "px";
          ball.ref.current.style.width = (BALL_SIZE * scaleX) + "px";
          ball.ref.current.style.height = (BALL_SIZE * scaleY) + "px";
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
        cueTimeout.current = setTimeout(() => {
          cueTimeout.current = null;
          smartCueShot();
        }, 1200);
      }
    }

    animationFrame.current = requestAnimationFrame(step);
  }

  // --- Render ---
  // Felt bounds for logo overlay
  const FELT_LEFT = 18.25;
  const FELT_RIGHT = 570.77;
  const FELT_TOP = 20.20;
  const FELT_BOTTOM = 270.18;
  // Add a margin inside the felt for the logo
  const LOGO_MARGIN = 28; // px, adjust for realism
  const logoLeft = FELT_LEFT + LOGO_MARGIN;
  const logoTop = FELT_TOP + LOGO_MARGIN;
  const logoWidth = (FELT_RIGHT - FELT_LEFT) - LOGO_MARGIN * 2;
  const logoHeight = (FELT_BOTTOM - FELT_TOP) - LOGO_MARGIN * 2;

  // Only render table/balls when ready (prevents size jump)
  if (!ready) {
    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'black',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <img
        ref={tableImgRef}
        src={table2}
        alt="Pool Table"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "fill",
          position: "absolute",
          top: 1,
          left: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 1,
          filter: 'opacity(1) contrast(1.25) brightness(1.18)'
        }}
      />
      {/* Logo overlay, fits felt area with margin, scaled */}
      <img
        src={logoImg}
        alt="League Logo"
        style={{
          position: "absolute",
          left: logoLeft * scaleX,
          top: logoTop * scaleY,
          width: logoWidth * scaleX,
          height: logoHeight * scaleY,
          objectFit: "contain",
          zIndex: 2,
          opacity: 0.55,
          filter: 'drop-shadow(0 2px 8px #000)',
          pointerEvents: "none",
          userSelect: "none"
        }}
      />
      {BALLS.map(ball =>
        <img
          key={ball.key}
          src={ball.src}
          alt={ball.alt}
          ref={ballRefs.current[ball.key]}
          className={styles.pinBallImg}
          style={{
            position: "absolute",
            left: (balls.current[ball.key]?.x !== undefined ? (balls.current[ball.key].x - BALL_RADIUS) * scaleX : 0),
            top: (balls.current[ball.key]?.y !== undefined ? (balls.current[ball.key].y - BALL_RADIUS) * scaleY : 0),
            width: BALL_SIZE * scaleX,
            height: BALL_SIZE * scaleY,
            zIndex: 10,
            opacity: balls.current[ball.key]?.visible === false ? 0 : 1,
            transition: "none",
            pointerEvents: "none",
            filter: 'opacity(1) contrast(1.25) brightness(1.18)'
          }}
        />
      )}
    </div>
  );
}
