import React, { useState, useEffect, useCallback } from 'react';
import { FaTrophy, FaRedo, FaHome, FaCog, FaLightbulb } from 'react-icons/fa';
import TenBallTable from './TenBallTable';
import styles from './TenBallGame.module.css';

const TenBallGame = ({ 
  mode = 'practice', 
  difficulty = 'beginner', 
  showHints = true, 
  onGameEnd, 
  onBackToMenu 
}) => {
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    player1Score: 0,
    player2Score: 0,
    gamePhase: 'break', // break, play, pushOut, end
    fouls: { 1: 0, 2: 0 },
    consecutiveFouls: { 1: 0, 2: 0 },
    lastShot: null,
    pushOutAvailable: false,
    calledShot: null,
    gameHistory: []
  });

  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [gameWinner, setGameWinner] = useState(null);

  // AI difficulty settings
  const aiSettings = {
    beginner: { accuracy: 0.3, strategy: 0.2, reactionTime: 2000 },
    intermediate: { accuracy: 0.6, strategy: 0.5, reactionTime: 1500 },
    advanced: { accuracy: 0.8, strategy: 0.8, reactionTime: 800 }
  };

  // Get hints based on game state and difficulty
  const getGameHint = useCallback(() => {
    const hints = {
      break: "Hit the 1-ball first and drive at least 4 balls to a rail or pocket a ball.",
      play: "Hit the lowest numbered ball first and call your shot.",
      pushOut: "You can push out - move the cue ball anywhere without hitting any ball.",
      foul: "That was a foul! Your opponent gets ball in hand.",
      threeFoul: "Three consecutive fouls result in loss of game!"
    };

    if (gameState.consecutiveFouls[gameState.currentPlayer] >= 2) {
      return hints.threeFoul;
    }

    if (gameState.gamePhase === 'break') {
      return hints.break;
    }

    if (gameState.pushOutAvailable) {
      return hints.pushOut;
    }

    return hints.play;
  }, [gameState]);

  // Handle shot completion
  const handleShotComplete = useCallback((shotResult) => {
    const { legal, fouls, ballsPocketed, firstBallHit } = shotResult;
    
    setGameState(prev => {
      const newState = { ...prev };
      
      if (fouls.length > 0) {
        // Handle foul
        newState.fouls[prev.currentPlayer]++;
        newState.consecutiveFouls[prev.currentPlayer]++;
        newState.currentPlayer = prev.currentPlayer === 1 ? 2 : 1;
        newState.gamePhase = 'play';
        newState.pushOutAvailable = false;
        
        // Check for three foul rule
        if (newState.consecutiveFouls[prev.currentPlayer] >= 3) {
          newState.gamePhase = 'end';
          setGameWinner(prev.currentPlayer === 1 ? 2 : 1);
        }
      } else {
        // Legal shot
        newState.consecutiveFouls[prev.currentPlayer] = 0;
        
        if (ballsPocketed.length > 0) {
          // Continue turn
          if (ballsPocketed.includes(10)) {
            // Game won
            newState.gamePhase = 'end';
            setGameWinner(prev.currentPlayer);
          }
        } else {
          // Turn over
          newState.currentPlayer = prev.currentPlayer === 1 ? 2 : 1;
        }
      }
      
      newState.lastShot = shotResult;
      newState.gameHistory.push(shotResult);
      
      return newState;
    });
  }, []);

  // Handle foul
  const handleFoul = useCallback((fouls) => {
    setCurrentHint(`Foul: ${fouls.join(', ')}`);
    
    setGameState(prev => ({
      ...prev,
      fouls: {
        ...prev.fouls,
        [prev.currentPlayer]: prev.fouls[prev.currentPlayer] + 1
      },
      consecutiveFouls: {
        ...prev.consecutiveFouls,
        [prev.currentPlayer]: prev.consecutiveFouls[prev.currentPlayer] + 1
      },
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1
    }));
  }, []);

  // Handle game end
  const handleGameEnd = useCallback((winner) => {
    setGameWinner(winner);
    setGameState(prev => ({
      ...prev,
      gamePhase: 'end',
      player1Score: winner === 1 ? prev.player1Score + 1 : prev.player1Score,
      player2Score: winner === 2 ? prev.player2Score + 1 : prev.player2Score
    }));
    
    onGameEnd && onGameEnd(winner);
  }, [onGameEnd]);

  // AI opponent logic
  const aiTurn = useCallback(() => {
    if (mode !== 'computer' || gameState.currentPlayer !== 2) return;
    
    const ai = aiSettings[difficulty];
    
    setTimeout(() => {
      // Simple AI logic - in a real implementation, this would be much more sophisticated
      const shotResult = {
        legal: Math.random() > (1 - ai.accuracy),
        fouls: Math.random() > ai.accuracy ? ['AI missed'] : [],
        ballsPocketed: Math.random() > 0.7 ? [Math.floor(Math.random() * 10) + 1] : [],
        firstBallHit: Math.floor(Math.random() * 10) + 1
      };
      
      handleShotComplete(shotResult);
    }, ai.reactionTime);
  }, [mode, gameState.currentPlayer, difficulty, handleShotComplete]);

  // Trigger AI turn
  useEffect(() => {
    if (mode === 'computer' && gameState.currentPlayer === 2 && gameState.gamePhase !== 'end') {
      aiTurn();
    }
  }, [mode, gameState.currentPlayer, gameState.gamePhase, aiTurn]);

  // Update hints
  useEffect(() => {
    if (showHints) {
      setCurrentHint(getGameHint());
    }
  }, [showHints, getGameHint, gameState]);

  // Reset game
  const resetGame = () => {
    setGameState({
      currentPlayer: 1,
      player1Score: gameState.player1Score,
      player2Score: gameState.player2Score,
      gamePhase: 'break',
      fouls: { 1: 0, 2: 0 },
      consecutiveFouls: { 1: 0, 2: 0 },
      lastShot: null,
      pushOutAvailable: false,
      calledShot: null,
      gameHistory: []
    });
    setGameWinner(null);
  };

  // Get player names based on mode
  const getPlayerNames = () => {
    switch (mode) {
      case 'practice':
        return { player1: 'You', player2: 'Practice' };
      case 'computer':
        return { player1: 'You', player2: 'Computer' };
      case 'local':
        return { player1: 'Player 1', player2: 'Player 2' };
      case 'online':
        return { player1: 'You', player2: 'Opponent' };
      default:
        return { player1: 'Player 1', player2: 'Player 2' };
    }
  };

  const playerNames = getPlayerNames();

  if (gameWinner) {
    return (
      <div className={styles.gameEnd}>
        <div className={styles.winnerCard}>
          <FaTrophy className={styles.trophyIcon} />
          <h2>{playerNames[`player${gameWinner}`]} Wins!</h2>
          <p>Congratulations on a great game!</p>
          
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreItem}>
              <span>{playerNames.player1}</span>
              <span>{gameState.player1Score}</span>
            </div>
            <div className={styles.scoreItem}>
              <span>{playerNames.player2}</span>
              <span>{gameState.player2Score}</span>
            </div>
          </div>
          
          <div className={styles.gameEndButtons}>
            <button onClick={resetGame} className={styles.resetButton}>
              <FaRedo />
              Play Again
            </button>
            <button onClick={onBackToMenu} className={styles.menuButton}>
              <FaHome />
              Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tenBallGame}>
      <div className={styles.gameHeader}>
        <div className={styles.gameInfo}>
          <h2>10-Ball Game</h2>
          <div className={styles.modeInfo}>
            <span>Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
            <span>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          </div>
        </div>
        
        <div className={styles.gameControls}>
          <button 
            onClick={() => setShowGameMenu(!showGameMenu)}
            className={styles.menuButton}
          >
            <FaCog />
          </button>
        </div>
      </div>

      <div className={styles.gameStatus}>
        <div className={styles.playerStatus}>
          <div className={`${styles.player} ${gameState.currentPlayer === 1 ? styles.active : ''}`}>
            <span className={styles.playerName}>{playerNames.player1}</span>
            <span className={styles.playerScore}>{gameState.player1Score}</span>
            {gameState.consecutiveFouls[1] > 0 && (
              <span className={styles.foulCount}>Fouls: {gameState.consecutiveFouls[1]}</span>
            )}
          </div>
          
          <div className={`${styles.player} ${gameState.currentPlayer === 2 ? styles.active : ''}`}>
            <span className={styles.playerName}>{playerNames.player2}</span>
            <span className={styles.playerScore}>{gameState.player2Score}</span>
            {gameState.consecutiveFouls[2] > 0 && (
              <span className={styles.foulCount}>Fouls: {gameState.consecutiveFouls[2]}</span>
            )}
          </div>
        </div>
        
        <div className={styles.gamePhase}>
          <span>Phase: {gameState.gamePhase.charAt(0).toUpperCase() + gameState.gamePhase.slice(1)}</span>
          {gameState.pushOutAvailable && (
            <span className={styles.pushOutNotice}>Push Out Available</span>
          )}
        </div>
      </div>

      <TenBallTable
        tutorialMode={false}
        showHints={showHints}
        difficulty={difficulty}
        onShotComplete={handleShotComplete}
        onFoul={handleFoul}
        onGameEnd={handleGameEnd}
      />

      {showHints && currentHint && (
        <div className={styles.hintDisplay}>
          <FaLightbulb className={styles.hintIcon} />
          <span>{currentHint}</span>
        </div>
      )}

      {showGameMenu && (
        <div className={styles.gameMenu}>
          <div className={styles.menuContent}>
            <h3>Game Menu</h3>
            <button onClick={resetGame} className={styles.menuOption}>
              <FaRedo />
              New Game
            </button>
            <button onClick={() => setShowRules(!showRules)} className={styles.menuOption}>
              <FaLightbulb />
              Show Rules
            </button>
            <button onClick={onBackToMenu} className={styles.menuOption}>
              <FaHome />
              Main Menu
            </button>
          </div>
        </div>
      )}

      {showRules && (
        <div className={styles.rulesOverlay}>
          <div className={styles.rulesContent}>
            <h3>10-Ball Rules</h3>
            <ul>
              <li>Hit the lowest numbered ball first</li>
              <li>Call your shots (ball and pocket)</li>
              <li>10-ball is the money ball</li>
              <li>Push out available after legal break</li>
              <li>Three consecutive fouls = loss</li>
            </ul>
            <button onClick={() => setShowRules(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenBallGame; 