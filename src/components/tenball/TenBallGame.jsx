import React from 'react';
import SimplePoolGame from './SimplePoolGame';

// Unified TenBallGame wrapper: always render the single engine (SimplePoolGame)
// Keep the same export so any route importing TenBallGame uses the same game.
const TenBallGame = ({ onGameEnd }) => {
  return <SimplePoolGame onGameEnd={onGameEnd} />;
};

export default TenBallGame;