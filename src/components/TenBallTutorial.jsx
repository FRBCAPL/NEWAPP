import React, { useState, useEffect, useRef } from 'react';
import SimplePoolGame from './tenball/SimplePoolGame';
import TutorialRules from './tenball/TutorialRules';
import GameModeSelector from './tenball/GameModeSelector';
import styles from './tenball/TenBallTutorial.module.css';

const TenBallTutorial = () => {
  const [currentMode, setCurrentMode] = useState('menu'); // menu, tutorial, practice, vsComputer, vsLocal, vsOnline
  const [gameState, setGameState] = useState({
    player1Score: 0,
    player2Score: 0,
    currentPlayer: 1,
    gamePhase: 'break', // break, play, end
    rules: {
      callPocket: true,
      pushOut: true,
      threeFoulRule: true,
      jumpShots: true
    }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const [difficulty, setDifficulty] = useState('beginner'); // beginner, intermediate, advanced

  const tutorialSteps = [
    {
      title: "Welcome to 10-Ball!",
      content: "10-Ball is a rotation game where you must hit the lowest numbered ball first. The 10-ball is the money ball - pocket it legally to win!",
      highlight: null
    },
    {
      title: "The Break Shot",
      content: "Start by breaking the rack. You must hit the 1-ball first and drive at least 4 balls to a rail or pocket a ball to have a legal break.",
      highlight: "break"
    },
    {
      title: "Legal Shots",
      content: "After the break, you must always hit the lowest numbered ball on the table first. If you pocket any ball legally, you continue shooting.",
      highlight: "legal"
    },
    {
      title: "Call Pocket",
      content: "In 10-Ball, you must call your shot - specify which ball you're shooting and which pocket it will go in. If you make it in the called pocket, you continue.",
      highlight: "call"
    },
    {
      title: "Push Out",
      content: "After a legal break, the incoming player may choose to 'push out' - shoot the cue ball anywhere without hitting any ball. The opponent then chooses to shoot or pass.",
      highlight: "push"
    },
    {
      title: "Fouls",
      content: "Common fouls include: not hitting the lowest ball first, not driving any ball to a rail, scratching, jumping the cue ball off the table, or making the wrong ball in the wrong pocket.",
      highlight: "fouls"
    },
    {
      title: "Three Foul Rule",
      content: "If a player commits three consecutive fouls, they lose the game. This encourages defensive play and strategic thinking.",
      highlight: "threefoul"
    },
    {
      title: "Winning the Game",
      content: "To win, you must legally pocket the 10-ball. If you pocket the 10-ball on a foul or out of order, it's spotted and you lose your turn.",
      highlight: "win"
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
      setCurrentMode('practice');
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
            onDifficultyChange={setDifficulty}
            difficulty={difficulty}
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
              onSkip={() => setCurrentMode('practice')}
            />
            <SimplePoolGame />
          </div>
        );
      
      case 'practice':
        return (
          <SimplePoolGame />
        );
      
      case 'vsComputer':
        return (
          <SimplePoolGame />
        );
      
      case 'vsLocal':
        return (
          <SimplePoolGame />
        );
      
      case 'vsOnline':
        return (
          <SimplePoolGame />
        );
      
      default:
        return <GameModeSelector onModeSelect={handleGameModeSelect} />;
    }
  };

  return (
    <div className={styles.tenBallTutorial}>
      <div className={styles.header}>
        <h1>10-Ball Tutorial Game</h1>
        <p>Learn and master the official CSI 10-Ball rules</p>
        {currentMode !== 'menu' && (
          <button 
            className={styles.backButton}
            onClick={() => setCurrentMode('menu')}
          >
            ← Back to Menu
          </button>
        )}
      </div>
      
      <div className={styles.content}>
        {renderContent()}
      </div>
      
      {currentMode !== 'menu' && (
        <div className={styles.controls}>
          <label className={styles.hintToggle}>
            <input 
              type="checkbox" 
              checked={showHints} 
              onChange={(e) => setShowHints(e.target.checked)}
            />
            Show Hints & Tips
          </label>
        </div>
      )}
    </div>
  );
};

export default TenBallTutorial; 