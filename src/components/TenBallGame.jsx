import React, { useState, useRef, useEffect } from 'react';
import TenBallEngine from './TenBallEngine';
import TenBallTutorial from './TenBallTutorial';
import TenBallRules from './TenBallRules';
import styles from './TenBallGame.module.css';

export default function TenBallGame() {
  const [gameMode, setGameMode] = useState('menu'); // menu, tutorial, rules, singlePlayer, twoPlayer, online
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [gameState, setGameState] = useState({
    balls: [],
    isBreak: true,
    currentShooter: 1,
    gamePhase: 'break', // break, pushOut, normalPlay, gameOver
    isCallShot: false,
    calledBall: null,
    calledPocket: null,
    successivefouls: { player1: 0, player2: 0 }
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [playerNames, setPlayerNames] = useState({ player1: 'Player 1', player2: 'Computer' });
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard, expert

  const gameRef = useRef();

  const startGame = (mode, options = {}) => {
    setGameMode(mode);
    setGameState({
      balls: [],
      isBreak: true,
      currentShooter: 1,
      gamePhase: 'break',
      isCallShot: false,
      calledBall: null,
      calledPocket: null,
      successivefouls: { player1: 0, player2: 0 }
    });
    setScores({ player1: 0, player2: 0 });
    
    if (options.playerNames) {
      setPlayerNames(options.playerNames);
    }
    if (options.difficulty) {
      setDifficulty(options.difficulty);
    }
  };

  const handleGameStateChange = (newState) => {
    setGameState(prev => ({ ...prev, ...newState }));
  };

  const handlePlayerWin = (player) => {
    setScores(prev => ({
      ...prev,
      [`player${player}`]: prev[`player${player}`] + 1
    }));
    
    // Reset for next game
    setTimeout(() => {
      setGameState({
        balls: [],
        isBreak: true,
        currentShooter: player === 1 ? 2 : 1, // Alternate break
        gamePhase: 'break',
        isCallShot: false,
        calledBall: null,
        calledPocket: null,
        successivefouls: { player1: 0, player2: 0 }
      });
    }, 3000);
  };

  return (
    <div className={styles.tenBallGame}>
      {gameMode === 'menu' && (
        <div className={styles.mainMenu}>
          <div className={styles.logoSection}>
            <h1 className={styles.title}>Ten Ball Pool</h1>
            <p className={styles.subtitle}>Professional Ten Ball with Official CSI Rules</p>
          </div>

          <div className={styles.menuGrid}>
            <div className={styles.menuCard}>
              <h3>🎯 Tutorial Mode</h3>
              <p>Learn the rules and master your skills with interactive lessons</p>
              <button 
                className={styles.primaryButton}
                onClick={() => setShowTutorial(true)}
              >
                Start Tutorial
              </button>
            </div>

            <div className={styles.menuCard}>
              <h3>📖 Official Rules</h3>
              <p>Study the complete CueSports International rule book</p>
              <button 
                className={styles.secondaryButton}
                onClick={() => setShowRules(true)}
              >
                View Rules
              </button>
            </div>

            <div className={styles.menuCard}>
              <h3>🤖 vs Computer</h3>
              <p>Play against AI opponents with adjustable difficulty</p>
              <div className={styles.difficultySelector}>
                <label>Difficulty:</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={styles.difficultySelect}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <button 
                className={styles.primaryButton}
                onClick={() => startGame('singlePlayer', { 
                  difficulty,
                  playerNames: { player1: 'You', player2: `Computer (${difficulty})` }
                })}
              >
                Play vs Computer
              </button>
            </div>

            <div className={styles.menuCard}>
              <h3>👥 Two Player</h3>
              <p>Play against a friend on the same device</p>
              <div className={styles.playerNames}>
                <input
                  type="text"
                  placeholder="Player 1 Name"
                  value={playerNames.player1}
                  onChange={(e) => setPlayerNames(prev => ({ ...prev, player1: e.target.value }))}
                  className={styles.nameInput}
                />
                <input
                  type="text"
                  placeholder="Player 2 Name"
                  value={playerNames.player2}
                  onChange={(e) => setPlayerNames(prev => ({ ...prev, player2: e.target.value }))}
                  className={styles.nameInput}
                />
              </div>
              <button 
                className={styles.primaryButton}
                onClick={() => startGame('twoPlayer', { playerNames })}
              >
                Start Local Game
              </button>
            </div>

            <div className={styles.menuCard}>
              <h3>🌐 Online Play</h3>
              <p>Challenge players from around the world</p>
              <button 
                className={styles.primaryButton}
                onClick={() => startGame('online')}
                disabled
              >
                Coming Soon!
              </button>
            </div>

            <div className={styles.menuCard}>
              <h3>🏆 Quick Tips</h3>
              <div className={styles.tipsList}>
                <p>• Always hit the lowest numbered ball first</p>
                <p>• Call your shots clearly</p>
                <p>• The 10-ball wins the game</p>
                <p>• Three fouls in a row = loss</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(gameMode === 'singlePlayer' || gameMode === 'twoPlayer' || gameMode === 'online') && (
        <div className={styles.gameContainer}>
          <div className={styles.gameHeader}>
            <div className={styles.scoreBoard}>
              <div className={`${styles.playerScore} ${gameState.currentShooter === 1 ? styles.activePlayer : ''}`}>
                <h3>{playerNames.player1}</h3>
                <div className={styles.score}>{scores.player1}</div>
                <div className={styles.fouls}>Fouls: {gameState.successivefouls?.player1 || 0}</div>
              </div>
              
              <div className={styles.gameInfo}>
                <div className={styles.gamePhase}>
                  {gameState.gamePhase === 'break' && 'Break Shot'}
                  {gameState.gamePhase === 'pushOut' && 'Push Out Available'}
                  {gameState.gamePhase === 'normalPlay' && `Shooting at ${getLowestBall(gameState.balls)}-ball`}
                  {gameState.gamePhase === 'gameOver' && 'Game Over!'}
                </div>
                
                {gameState.isCallShot && (
                  <div className={styles.callShot}>
                    Call your shot: Ball & Pocket
                  </div>
                )}
              </div>

              <div className={`${styles.playerScore} ${gameState.currentShooter === 2 ? styles.activePlayer : ''}`}>
                <h3>{playerNames.player2}</h3>
                <div className={styles.score}>{scores.player2}</div>
                <div className={styles.fouls}>Fouls: {gameState.successivefouls?.player2 || 0}</div>
              </div>
            </div>

            <div className={styles.gameControls}>
              <button 
                className={styles.controlButton}
                onClick={() => setShowRules(true)}
              >
                📖 Rules
              </button>
              <button 
                className={styles.controlButton}
                onClick={() => setShowTutorial(true)}
              >
                🎯 Help
              </button>
              <button 
                className={styles.controlButton}
                onClick={() => setGameMode('menu')}
              >
                🏠 Menu
              </button>
            </div>
          </div>

          <TenBallEngine
            ref={gameRef}
            gameMode={gameMode}
            gameState={gameState}
            onGameStateChange={handleGameStateChange}
            onPlayerWin={handlePlayerWin}
            difficulty={difficulty}
            playerNames={playerNames}
          />
        </div>
      )}

      {showTutorial && (
        <TenBallTutorial 
          onClose={() => setShowTutorial(false)}
          onStartPractice={() => {
            setShowTutorial(false);
            startGame('tutorial');
          }}
        />
      )}

      {showRules && (
        <TenBallRules 
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
}

// Helper function to find the lowest numbered ball on table
function getLowestBall(balls) {
  if (!balls || balls.length === 0) return 1;
  
  const visibleBalls = balls.filter(ball => ball.visible && ball.number !== 'cue');
  if (visibleBalls.length === 0) return 10;
  
  const numbers = visibleBalls.map(ball => parseInt(ball.number)).filter(n => !isNaN(n));
  return Math.min(...numbers);
}