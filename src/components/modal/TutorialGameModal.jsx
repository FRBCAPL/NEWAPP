import React, { useState, useEffect } from 'react';
import DraggableModal from './DraggableModal';
import PoolSimulation from '../PoolSimulation';
import styles from './TutorialGameModal.module.css';

export default function TutorialGameModal({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  const tutorialSteps = [
    {
      title: "Welcome to Pool!",
      instruction: "Watch how the cue ball breaks the rack. The white ball is the cue ball.",
      highlight: "break"
    },
    {
      title: "Object Balls",
      instruction: "The AI will try to pocket the 8, 9, and 10 balls in order.",
      highlight: "objectBalls"
    },
    {
      title: "Pockets",
      instruction: "There are 6 pockets on the table. Balls disappear when they go in!",
      highlight: "pockets"
    },
    {
      title: "Smart Shots",
      instruction: "Watch how the AI calculates angles and avoids scratches.",
      highlight: "strategy"
    },
    {
      title: "Enjoy the Game!",
      instruction: "The game will automatically rerack after the 10 ball is pocketed.",
      highlight: "none"
    }
  ];

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setShowInstructions(true);
    }
  }, [open]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowInstructions(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title="Pool Tutorial Game"
      maxWidth="90vw"
      className={styles.tutorialModal}
    >
      <div className={styles.tutorialContainer}>
        {/* Pool Table Container */}
        <div className={styles.poolTableWrapper}>
          <PoolSimulation />
        </div>

        {/* Instructions Panel */}
        {showInstructions && (
          <div className={styles.instructionsPanel}>
            <h3>{tutorialSteps[currentStep].title}</h3>
            <p>{tutorialSteps[currentStep].instruction}</p>
            
            <div className={styles.navigationButtons}>
              <button 
                onClick={prevStep} 
                disabled={currentStep === 0}
                className={styles.navButton}
              >
                Previous
              </button>
              <span className={styles.stepIndicator}>
                {currentStep + 1} / {tutorialSteps.length}
              </span>
              <button 
                onClick={nextStep}
                className={styles.navButton}
              >
                {currentStep === tutorialSteps.length - 1 ? 'Start Playing' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Toggle Instructions Button */}
        {!showInstructions && (
          <button 
            onClick={() => setShowInstructions(true)}
            className={styles.showInstructionsBtn}
          >
            Show Tutorial
          </button>
        )}
      </div>
    </DraggableModal>
  );
}