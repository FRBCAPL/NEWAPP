import React, { useState } from 'react';
import RealisticPoolGame from './RealisticPoolGame';
import MatterPoolGameImproved from './MatterPoolGameImproved';
import ThreeDPoolGame from './ThreeDPoolGame';
import styles from './SimplePoolGame.module.css';

const GameSelector = ({ onGameEnd }) => {
  const [selectedGame, setSelectedGame] = useState('realistic'); // realistic, matter, 3d

  const games = [
    {
      id: 'realistic',
      name: 'Pool.js (Recommended)',
      description: 'Uses the dedicated pool.js library for the most realistic pool physics',
      component: RealisticPoolGame
    },
    {
      id: 'matter',
      name: 'Matter.js Improved',
      description: 'Enhanced Matter.js implementation with better pool-specific physics',
      component: MatterPoolGameImproved
    },
    {
      id: '3d',
      name: '3D Pool (Experimental)',
      description: '3D pool game using Three.js and React Three Fiber',
      component: ThreeDPoolGame
    }
  ];

  const selectedGameConfig = games.find(game => game.id === selectedGame);
  const GameComponent = selectedGameConfig.component;

  return (
    <div className={styles.gameSelectorContainer}>
      {/* Game Selection */}
      <div className={styles.gameSelection}>
        <h3>Select Pool Game Implementation</h3>
        <div className={styles.gameOptions}>
          {games.map(game => (
            <div
              key={game.id}
              className={`${styles.gameOption} ${selectedGame === game.id ? styles.selected : ''}`}
              onClick={() => setSelectedGame(game.id)}
            >
              <h4>{game.name}</h4>
              <p>{game.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Game */}
      <div className={styles.selectedGameContainer}>
        <h3>Current: {selectedGameConfig.name}</h3>
        <GameComponent onGameEnd={onGameEnd} />
      </div>
    </div>
  );
};

export default GameSelector;

