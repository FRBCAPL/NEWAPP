import React, { useRef, useEffect } from "react";
import table2 from "./PoolTableSVG.svg";
import nineBall from "../assets/nineball.svg";
import tenBall from "../assets/tenball.svg";
import eightBall from "../assets/8ball.svg";
import cueBall from "../assets/cueball.svg";
import styles from "./modal/PinLogin.module.css";
import SimpleRealisticBall from './SimpleRealisticBall';

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

export default function PoolSimulation() {
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

  function saveInitialPositions() {
    Object.keys(balls.current).forEach(key => {
      initialPositions.current[key] = {
        x: balls.current[key].x,
        y: balls.current[key].y
      };
    });
  }

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
        ball.ref.current.style.left = `${ball.x - BALL_RADIUS}px`;
        ball.ref.current.style.top = `${ball.y - BALL_RADIUS}px`;
        ball.ref.current.style.opacity = 1;
        ball.ref.current.style.width = BALL_SIZE + "px";
        ball.ref.current.style.height = BALL_SIZE + "px";
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

  function breakCueBall() {
    if (!balls.current.cue) return;
    if (balls.current.cue.isMoving) return;

    const cue = balls.current.cue;
    shotCount.current += 1;

    // On the break (first shot): blast cue ball at rack apex with random angle/speed
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

  function smartCueShot() {
    const objectBallOrder = ["8", "9", "10"];
    const targetKey = objectBallOrder.find(key => balls.current[key]?.visible);
    if (!targetKey) return; // game over

    const cue = balls.current.cue;
    const target = balls.current[targetKey];
    const pockets = getPockets();

    let best = null;
    let bestScore = Infinity;

    for (const pocket of pockets) {
      const toPocketX = pocket.x - target.x;
      const toPocketY = pocket.y - target.y;
      const toPocketLen = Math.hypot(toPocketX, toPocketY);

      // Ghost ball position for straight-in shot
      const ghostX = target.x - (toPocketX / toPocketLen) * BALL_SIZE;
      const ghostY = target.y - (toPocketY / toPocketLen) * BALL_SIZE;

      // Check if cue can hit ghost ball directly (no balls in the way)
      let blocked = false;
      for (const otherKey of objectBallOrder) {
        if (otherKey === targetKey) continue;
        if (lineIntersectsBall(cue.x, cue.y, ghostX, ghostY, {...balls.current[otherKey], key: otherKey}, targetKey)) {
          blocked = true;
          break;
        }
      }

      // Estimate scratch risk: if cue ball path after hit goes toward a pocket
      let scratchRisk = 0;
      for (const testPocket of pockets) {
        const distToPocket = Math.hypot(ghostX - testPocket.x, ghostY - testPocket.y);
        if (distToPocket < BALL_SIZE * 2.0) scratchRisk += 1;
      }

      // Score: prefer unblocked, short shots, penalize scratch risk
      const cueToGhost = Math.hypot(cue.x - ghostX, cue.y - ghostY);
      const score = (blocked ? 1000 : 0) + cueToGhost + scratchRisk * 100;

      if (score < bestScore) {
        bestScore = score;
        best = { ghostX, ghostY };
      }
    }

    // If no clear shot, just shoot at the lowest ball with a gentle angle
    if (!best) {
      const angle = Math.atan2(target.y - cue.y, target.x - cue.x) + (Math.random() - 0.5) * 0.3;
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

  function animateBalls() {
    const friction = 0.99;
    const ballSize = BALL_SIZE;
    const radius = ballSize / 2;
    const subSteps = 16;

    function step() {
      let pocketedThisFrame = [];

      for (let s = 0; s < subSteps; s++) {
        Object.entries(balls.current).forEach(([key, ball]) => {
          if (!ball.visible) return;

          let nextX = ball.x + ball.vx / subSteps;
          let nextY = ball.y + ball.vy / subSteps;

          // Rail collision (tweak as needed for your SVG)
          if (nextX < PLAYFIELD_OFFSET_X + radius + 20) {
            ball.x = PLAYFIELD_OFFSET_X + radius + 20;
            ball.vx = Math.abs(ball.vx) * 0.8;
          }
          else if (nextX > TABLE_WIDTH - radius - 25 + PLAYFIELD_OFFSET_X) {
            ball.x = TABLE_WIDTH - radius - 25 + PLAYFIELD_OFFSET_X;
            ball.vx = -Math.abs(ball.vx) * 0.8;
          } else {
            ball.x = nextX;
          }

          if (nextY < PLAYFIELD_OFFSET_Y + radius + 18) {
            ball.y = PLAYFIELD_OFFSET_Y + radius + 18;
            ball.vy = Math.abs(ball.vy) * 0.8;
          }
          else if (nextY > TABLE_HEIGHT - radius - 30 + PLAYFIELD_OFFSET_Y) {
            ball.y = TABLE_HEIGHT - radius - 30 + PLAYFIELD_OFFSET_Y;
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

      // Render
      Object.entries(balls.current).forEach(([key, ball]) => {
        if (ball.ref.current && ball.visible) {
          ball.ref.current.style.left = (ball.x !== undefined ? ball.x - BALL_RADIUS : 0) + "px";
          ball.ref.current.style.top = (ball.y !== undefined ? ball.y - BALL_RADIUS : 0) + "px";
          ball.ref.current.style.width = BALL_SIZE + "px";
          ball.ref.current.style.height = BALL_SIZE + "px";
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
            balls.current["cue"].ref.current.style.left = (balls.current["cue"].x !== undefined ? balls.current["cue"].x - BALL_RADIUS : 0) + "px";
            balls.current["cue"].ref.current.style.top = (balls.current["cue"].y !== undefined ? balls.current["cue"].y - BALL_RADIUS : 0) + "px";
            balls.current["cue"].ref.current.style.opacity = 1;
            balls.current["cue"].ref.current.style.width = BALL_SIZE + "px";
            balls.current["cue"].ref.current.style.height = BALL_SIZE + "px";
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

  return (
    <div
      style={{
        position: "relative",
        width: TABLE_WIDTH,
        height: TABLE_HEIGHT,
        background: "#222",
        overflow: "hidden"
      }}
    >
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

      <div
        className={styles.pinLoginTitle}
        style={{
          position: "absolute",
          left: 0,
          top: "38%",
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 2,
          opacity: 0.60,
          lineHeight: 1.1,
          fontWeight: "bold",
          color: "#000",
          fontSize: "0.45rem",
          textShadow: `
            1px 0 0 #ff0000,
            -1px 0 0 #ff0000,
            0 1px 0 #ff0000,
            0 -1px 0 #ff0000,
            1px 1px 0 #ff0000,
            -1px -1px 0 #ff0000,
            1px -1px 0 #ff0000,
            -1px 1px 0 #ff0000
          `
        }}
      >
        <div>Front Range</div>
        <div>Pool League</div>
      </div>
      {BALLS.map(ball =>
        balls.current[ball.key]?.visible !== false && (
          <div
            key={ball.key}
            ref={ballRefs.current[ball.key]}
            style={{
              position: "absolute",
              left: (balls.current[ball.key]?.x !== undefined ? balls.current[ball.key].x - BALL_RADIUS : 0),
              top: (balls.current[ball.key]?.y !== undefined ? balls.current[ball.key].y - BALL_RADIUS : 0),
              zIndex: 10
            }}
          >
            <SimpleRealisticBall number={ball.key} size={BALL_SIZE} />
          </div>
        )
      )}
    </div>
  );
}
