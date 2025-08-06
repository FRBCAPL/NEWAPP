import React, { useState } from 'react';
import SimplePoolGame from './tenball/SimplePoolGame';
import TutorialRules from './tenball/TutorialRules';
import GameModeSelector from './tenball/GameModeSelector';
import styles from './tenball/TenBallTutorial.module.css';

const TenBallTutorial = () => {
  const [currentMode, setCurrentMode] = useState('menu'); // menu, tutorial, game
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [gameState, setGameState] = useState({
    player1Score: 0,
    player2Score: 0,
    currentPlayer: 1,
    gamePhase: 'break',
    rules: {
      callPocket: true,
      pushOut: true,
      threeFoulRule: true,
      jumpShots: true
    }
  });

  const tutorialSteps = [
    {
      title: "Welcome to 10-Ball!",
      content: "10-Ball is a call-shot game where you must hit the lowest numbered ball first and call your shots. The 10-ball is the game-winning ball!",
      proTip: "Always hit the lowest numbered ball first!"
    },
    {
      title: "The Break Shot",
      content: "Start the game with a legal break shot. You must hit the 1-ball first and drive at least 4 balls to the rails or pocket a ball.",
      proTip: "A good break can set up your entire game!"
    },
    {
      title: "Call Shot Rules",
      content: "After the break, you must call both the ball and the pocket for every shot. If you don't call it, it doesn't count!",
      proTip: "Be specific about which pocket you're aiming for!"
    },
    {
      title: "Push Out Option",
      content: "After a legal break, the incoming player may choose to 'push out' - shoot the cue ball anywhere without hitting any ball. The opponent then chooses to shoot or pass.",
      proTip: "Use push out to improve your position when the table is difficult!"
    },
    {
      title: "Fouls and Penalties",
      content: "Common fouls include: scratching (cue ball in pocket), hitting wrong ball first, not hitting any rail after contact, and jumping the cue ball off the table.",
      proTip: "Three consecutive fouls by the same player results in loss of game!"
    },
    {
      title: "Winning the Game",
      content: "Legally pocket the 10-ball to win! Remember, you must call the 10-ball and the pocket, and hit the lowest numbered ball first.",
      proTip: "The 10-ball is the only ball that matters for winning!"
    },
    {
      title: "Strategy Tips",
      content: "Plan your shots ahead, use defensive play when needed, and always consider your opponent's options after your shot.",
      proTip: "Sometimes the best shot is the one that leaves your opponent nothing!"
    },
    {
      title: "Ready to Play!",
      content: "You now know the basics of 10-Ball! Practice these rules and strategies to improve your game.",
      proTip: "Practice makes perfect - keep playing and learning!"
    }
  ];

  const handleGameModeSelect = (mode) => {
    setCurrentMode(mode);
    if (mode === 'tutorial') {
      setTutorialStep(0);
      setShowHints(true);
    }
  };

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setCurrentMode('game');
    }
  };

  const handleTutorialBack = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const handleGameEnd = (winner) => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'end',
      player1Score: winner === 1 ? prev.player1Score + 1 : prev.player1Score,
      player2Score: winner === 2 ? prev.player2Score + 1 : prev.player2Score
    }));
  };

  const resetGame = () => {
    setGameState({
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      gamePhase: 'break',
      rules: {
        callPocket: true,
        pushOut: true,
        threeFoulRule: true,
        jumpShots: true
      }
    });
  };

  const renderContent = () => {
    switch (currentMode) {
      case 'menu':
        return (
          <GameModeSelector 
            onModeSelect={handleGameModeSelect}
          />
        );
      
      case 'tutorial':
        return (
          <div className={styles.tutorialContainer}>
            <TutorialRules 
              step={tutorialSteps[tutorialStep]}
              currentStep={tutorialStep}
              totalSteps={tutorialSteps.length}
              onNext={handleTutorialNext}
              onBack={handleTutorialBack}
              onSkip={() => setCurrentMode('game')}
            />
            <SimplePoolGame />
          </div>
        );
      
      case 'game':
        return (
          <SimplePoolGame />
        );
      
      default:
        return <GameModeSelector onModeSelect={handleGameModeSelect} />;
    }
  };

  return (
    <div className={styles.container}>
      {renderContent()}
      
      {currentMode !== 'menu' && (
        <div className={styles.navigation}>
          <button 
            className={styles.backButton}
            onClick={() => setCurrentMode('menu')}
          >
            ← Back to Menu
          </button>
        </div>
      )}
      
      {currentMode !== 'menu' && (
        <div className={styles.gameInfo}>
          <div className={styles.scoreBoard}>
            <div className={styles.playerScore}>
              <span>Player 1: {gameState.player1Score}</span>
            </div>
            <div className={styles.playerScore}>
              <span>Player 2: {gameState.player2Score}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenBallTutorial; 