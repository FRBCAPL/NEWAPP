import React from "react";

// Sizing now matches the first file!
const WIDTH = 520;
const HEIGHT = 260;
const RAIL = 28;
const TRIM = 6;
const FELT_CUSHION = 12;

const PLAYFIELD_X = RAIL + FELT_CUSHION;
const PLAYFIELD_Y = RAIL + FELT_CUSHION;
const PLAYFIELD_WIDTH = WIDTH - 2 * (RAIL + FELT_CUSHION);
const PLAYFIELD_HEIGHT = HEIGHT - 2 * (RAIL + FELT_CUSHION);

// Pocket specs (pixels)
const CORNER_MOUTH = 44;
const SIDE_MOUTH = 54;
const CORNER_JAW_DEPTH = 26; // how far the notch cuts in at the corner
const SIDE_JAW_DEPTH = 18;   // how far the notch cuts in at the sides

export default function PoolTableSVG() {
  const x = PLAYFIELD_X;
  const y = PLAYFIELD_Y;
  const w = PLAYFIELD_WIDTH;
  const h = PLAYFIELD_HEIGHT;
  const cM = CORNER_MOUTH / 2;
  const sM = SIDE_MOUTH / 2;

  // Path for the playfield with notched pockets (corner and side)
  function playingSurfacePath() {
    return `
      M ${x + cM} ${y}
      L ${x + w / 2 - sM} ${y}
      Q ${x + w / 2} ${y - SIDE_JAW_DEPTH} ${x + w / 2 + sM} ${y}
      L ${x + w - cM} ${y}
      L ${x + w - cM + CORNER_JAW_DEPTH * 0.7} ${y + cM - CORNER_JAW_DEPTH * 0.7}
      Q ${x + w} ${y + cM} ${x + w - cM} ${y + cM + CORNER_JAW_DEPTH * 0.7}
      L ${x + w} ${y + h - cM}
      L ${x + w - cM + CORNER_JAW_DEPTH * 0.7} ${y + h - cM + CORNER_JAW_DEPTH * 0.7}
      Q ${x + w - cM} ${y + h} ${x + w - cM - CORNER_JAW_DEPTH * 0.7} ${y + h - cM + CORNER_JAW_DEPTH * 0.7}
      L ${x + w / 2 + sM} ${y + h}
      Q ${x + w / 2} ${y + h + SIDE_JAW_DEPTH} ${x + w / 2 - sM} ${y + h}
      L ${x + cM} ${y + h}
      L ${x + cM - CORNER_JAW_DEPTH * 0.7} ${y + h - cM + CORNER_JAW_DEPTH * 0.7}
      Q ${x} ${y + h - cM} ${x + cM - CORNER_JAW_DEPTH * 0.7} ${y + h - cM - CORNER_JAW_DEPTH * 0.7}
      L ${x} ${y + cM}
      L ${x + cM - CORNER_JAW_DEPTH * 0.7} ${y + cM - CORNER_JAW_DEPTH * 0.7}
      Q ${x + cM} ${y} ${x + cM + CORNER_JAW_DEPTH * 0.7} ${y + cM - CORNER_JAW_DEPTH * 0.7}
      Z
    `;
  }

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ display: "block", borderRadius: "20px", background: "#222" }}
    >
      {/* Outer rail */}
      <rect
        x={0}
        y={0}
        width={WIDTH}
        height={HEIGHT}
        rx={20}
        fill="#181818"
      />
      {/* Red trim */}
      <rect
        x={TRIM / 2}
        y={TRIM / 2}
        width={WIDTH - TRIM}
        height={HEIGHT - TRIM}
        rx={17}
        fill="none"
        stroke="#e53e3e"
        strokeWidth={TRIM}
      />
      {/* Felt cushion */}
      <rect
        x={RAIL}
        y={RAIL}
        width={WIDTH - 2 * RAIL}
        height={HEIGHT - 2 * RAIL}
        rx={12}
        fill="#2fd96d"
      />
      {/* Playing surface with notched pockets */}
      <path
        d={playingSurfacePath()}
        fill="url(#feltGrad)"
      />
      {/* Felt gradient definition */}
      <defs>
        <radialGradient id="feltGrad" cx="60%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#2fd96d" />
          <stop offset="100%" stopColor="#185c2a" />
        </radialGradient>
      </defs>
      {/* Diamond markers */}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect
          key={"diamond-top-" + i}
          x={RAIL + 32 + i * ((WIDTH - 2 * RAIL - 64) / 6) - 2}
          y={RAIL - 10}
          width={4}
          height={10}
          rx={2}
          fill="#eee"
          opacity="0.7"
        />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect
          key={"diamond-bottom-" + i}
          x={RAIL + 32 + i * ((WIDTH - 2 * RAIL - 64) / 6) - 2}
          y={HEIGHT - RAIL}
          width={4}
          height={10}
          rx={2}
          fill="#eee"
          opacity="0.7"
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <rect
          key={"diamond-left-" + i}
          x={RAIL - 10}
          y={RAIL + 44 + i * ((HEIGHT - 2 * RAIL - 88) / 2) - 2}
          width={10}
          height={4}
          rx={2}
          fill="#eee"
          opacity="0.7"
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <rect
          key={"diamond-right-" + i}
          x={WIDTH - RAIL}
          y={RAIL + 44 + i * ((HEIGHT - 2 * RAIL - 88) / 2) - 2}
          width={10}
          height={4}
          rx={2}
          fill="#eee"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}
