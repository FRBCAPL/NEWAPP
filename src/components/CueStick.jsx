import React from 'react';

// 🎯 PROFESSIONAL CUE STICK COMPONENT
// Renders a realistic cue stick that follows mouse movement for aiming

export default function CueStick({ 
  cueBallPosition, 
  aimAngle, 
  power, 
  isAiming, 
  maxPower = 20,
  tableWidth,
  tableHeight 
}) {
  if (!isAiming || !cueBallPosition) return null;

  // Cue stick dimensions and positioning
  const STICK_LENGTH = 250;
  const STICK_WIDTH = 6;
  const TIP_LENGTH = 12;
  const GRIP_LENGTH = 40;
  
  // Calculate cue stick position based on power (pull back effect)
  const pullBackDistance = 20 + (power / maxPower) * 30; // More power = further back
  
  // Calculate stick position
  const stickStartX = cueBallPosition.x - Math.cos(aimAngle) * (15 + pullBackDistance);
  const stickStartY = cueBallPosition.y - Math.sin(aimAngle) * (15 + pullBackDistance);
  const stickEndX = stickStartX - Math.cos(aimAngle) * STICK_LENGTH;
  const stickEndY = stickStartY - Math.sin(aimAngle) * STICK_LENGTH;

  // Ensure stick doesn't go off table
  const boundedStartX = Math.max(0, Math.min(tableWidth, stickStartX));
  const boundedStartY = Math.max(0, Math.min(tableHeight, stickStartY));
  
  return (
    <g>
      {/* Cue Stick Shadow */}
      <line
        x1={boundedStartX + 2}
        y1={boundedStartY + 2}
        x2={stickEndX + 2}
        y2={stickEndY + 2}
        stroke="rgba(0, 0, 0, 0.3)"
        strokeWidth={STICK_WIDTH + 1}
        strokeLinecap="round"
        style={{ filter: 'blur(1px)' }}
      />
      
      {/* Main Cue Stick Shaft */}
      <line
        x1={boundedStartX}
        y1={boundedStartY}
        x2={stickEndX}
        y2={stickEndY}
        stroke="url(#cueStickGradient)"
        strokeWidth={STICK_WIDTH}
        strokeLinecap="round"
      />
      
      {/* Cue Tip */}
      <circle
        cx={boundedStartX}
        cy={boundedStartY}
        r={STICK_WIDTH / 2 + 1}
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="1"
      />
      
      {/* Ferrule (white band before tip) */}
      <line
        x1={boundedStartX - Math.cos(aimAngle) * 8}
        y1={boundedStartY - Math.sin(aimAngle) * 8}
        x2={boundedStartX - Math.cos(aimAngle) * 15}
        y2={boundedStartY - Math.sin(aimAngle) * 15}
        stroke="#FFFFFF"
        strokeWidth={STICK_WIDTH + 1}
        strokeLinecap="round"
      />
      
      {/* Grip Area */}
      <line
        x1={stickEndX}
        y1={stickEndY}
        x2={stickEndX + Math.cos(aimAngle) * GRIP_LENGTH}
        y2={stickEndY + Math.sin(aimAngle) * GRIP_LENGTH}
        stroke="#2C1810"
        strokeWidth={STICK_WIDTH + 2}
        strokeLinecap="round"
      />
      
      {/* Grip Wrap Pattern */}
      {[...Array(8)].map((_, i) => (
        <line
          key={i}
          x1={stickEndX + Math.cos(aimAngle) * (i * 4)}
          y1={stickEndY + Math.sin(aimAngle) * (i * 4)}
          x2={stickEndX + Math.cos(aimAngle) * (i * 4 + 2)}
          y2={stickEndY + Math.sin(aimAngle) * (i * 4 + 2)}
          stroke="#4A2C17"
          strokeWidth={STICK_WIDTH + 2}
          strokeLinecap="round"
        />
      ))}
      
      {/* Power Indicator Glow */}
      {power > 10 && (
        <line
          x1={boundedStartX}
          y1={boundedStartY}
          x2={boundedStartX - Math.cos(aimAngle) * 30}
          y2={boundedStartY - Math.sin(aimAngle) * 30}
          stroke={`rgba(255, ${255 - power * 8}, 0, ${power / maxPower * 0.8})`}
          strokeWidth={STICK_WIDTH + 4}
          strokeLinecap="round"
          style={{ filter: 'blur(2px)' }}
        />
      )}
      
      {/* Gradients Definition */}
      <defs>
        <linearGradient id="cueStickGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="1" />
          <stop offset="15%" stopColor="#F5E6A3" stopOpacity="1" />
          <stop offset="85%" stopColor="#CD853F" stopOpacity="1" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="1" />
        </linearGradient>
      </defs>
    </g>
  );
}

// 🎱 CUE STICK SVG OVERLAY COMPONENT
// This wraps the CueStick in an SVG overlay for the pool table

export function CueStickOverlay({ 
  cueBallPosition, 
  aimAngle, 
  power, 
  isAiming, 
  tableWidth, 
  tableHeight 
}) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 8
      }}
      viewBox={`0 0 ${tableWidth} ${tableHeight}`}
    >
      <CueStick
        cueBallPosition={cueBallPosition}
        aimAngle={aimAngle}
        power={power}
        isAiming={isAiming}
        maxPower={20}
        tableWidth={tableWidth}
        tableHeight={tableHeight}
      />
    </svg>
  );
}