import React from "react";
import SimpleRealisticBall from './SimpleRealisticBall';

export default function BilliardBall({ gameType, size = 22 }) {
  const ballMap = {
    "8 Ball": "8",
    "9 Ball": "9", 
    "10 Ball": "10"
  };

  const ballNumber = ballMap[gameType];
  if (!ballNumber) return null;

  return (
    <div style={{ 
      display: "inline-flex", 
      marginRight: 4, 
      verticalAlign: "middle",
      alignItems: "center"
    }}>
      <SimpleRealisticBall number={ballNumber} size={size} />
    </div>
  );
}
