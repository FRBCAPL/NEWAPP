import React, { useState } from 'react';
import styles from './TenBallTutorial.module.css';

const TenBallTutorial = ({ onClose, onStartPractice }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Ten Ball!",
      content: `Ten Ball is a call shot game played with balls numbered 1 through 10 plus the cue ball. 
                It's considered one of the most challenging pool games because every shot must be called.`,
      image: "🎱",
      tips: [
        "Ten Ball requires both skill and strategy",
        "Every shot except the break must be called",
        "The 10-ball is the game-winning ball"
      ]
    },
    {
      title: "The Rack",
      content: `Balls are racked in a triangle with the 1-ball at the apex on the foot spot. 
                The 10-ball goes in the middle of the third row. The 2-ball and 3-ball are placed 
                on the corners of the last row.`,
      image: "🔺",
      tips: [
        "1-ball always at the front (apex)",
        "10-ball in the middle of the triangle",
        "2-ball and 3-ball at the back corners",
        "Other balls placed randomly"
      ]
    },
    {
      title: "The Break Shot",
      content: `The cue ball must contact the 1-ball first. You must either pocket a ball legally 
                or drive at least four object balls to one or more rails. If the 10-ball is pocketed 
                on the break, it's spotted and the shooter continues.`,
      image: "💥",
      tips: [
        "Must hit the 1-ball first",
        "No calling required on the break",
        "If 10-ball goes in, it gets spotted",
        "Strong break helps spread the balls"
      ]
    },
    {
      title: "Push-Out Rule",
      content: `After a legal break, the incoming player may choose to play a 'push-out'. 
                During a push-out, you don't need to hit the lowest ball first or hit a rail. 
                The opponent then chooses who shoots next.`,
      image: "⬆️",
      tips: [
        "Only available after the break",
        "Must declare 'push-out' clearly", 
        "Normal rules don't apply during push-out",
        "Opponent decides who shoots after"
      ]
    },
    {
      title: "Call Shot Rules",
      content: `You must call the intended ball and pocket for every shot (except the break). 
                Only obvious shots don't need to be called. Bank shots, combinations, and 
                kick shots must always be called.`,
      image: "📢",
      tips: [
        "Call ball and pocket before shooting",
        "Obvious shots may not need calling",
        "Bank shots always need to be called",
        "When in doubt, call the shot"
      ]
    },
    {
      title: "Playing in Order",
      content: `You must always contact the lowest numbered ball on the table first. 
                This is the key rule that makes ten ball so challenging. If you hit 
                the wrong ball first, it's a foul.`,
      image: "🔢",
      tips: [
        "Always hit the lowest numbered ball first",
        "This rule applies to every shot",
        "Missing the correct ball = foul",
        "Plan your shots carefully"
      ]
    },
    {
      title: "Winning the Game",
      content: `The game is won by legally pocketing the 10-ball. This can happen at any time 
                during the game as long as you hit the lowest ball first and call the shot. 
                The 10-ball doesn't have to be the last ball on the table.`,
      image: "🏆",
      tips: [
        "10-ball wins the game when legally pocketed",
        "Must hit correct ball first",
        "Must call the 10-ball shot",
        "Can win even with other balls remaining"
      ]
    },
    {
      title: "Fouls and Penalties",
      content: `Common fouls include: scratching the cue ball, not hitting the lowest ball first, 
                not calling your shot, and not hitting a rail after contact. After a foul, 
                your opponent gets ball in hand.`,
      image: "⚠️",
      tips: [
        "Three fouls in a row = automatic loss",
        "Opponent gets ball in hand after foul",
        "Cue ball in pocket = scratch (foul)",
        "No rail contact after hit = foul"
      ]
    },
    {
      title: "Strategy Tips",
      content: `Focus on position play to give yourself good shots on the next ball. 
                Use safety play when you don't have a good shot. Think several balls ahead 
                and always consider where the cue ball will end up.`,
      image: "🧠",
      tips: [
        "Position is everything in ten ball",
        "Plan multiple shots ahead",
        "Use safety play when needed",
        "Control the cue ball precisely"
      ]
    },
    {
      title: "Ready to Play!",
      content: `You now know the basic rules of ten ball! Remember: hit the lowest ball first, 
                call your shots, and try to pocket the 10-ball legally. Good luck and have fun!`,
      image: "🎯",
      tips: [
        "Practice makes perfect",
        "Start with easier shots",
        "Watch professional games to learn",
        "Be patient with yourself"
      ]
    }
  ];

  const currentStepData = tutorialSteps[currentStep];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialModal}>
        <div className={styles.tutorialHeader}>
          <h2>Ten Ball Tutorial</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        <div className={styles.stepIndicators}>
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              className={`${styles.stepDot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
              onClick={() => goToStep(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className={styles.tutorialContent}>
          <div className={styles.stepIcon}>
            {currentStepData.image}
          </div>
          
          <h3 className={styles.stepTitle}>
            {currentStepData.title}
          </h3>
          
          <p className={styles.stepContent}>
            {currentStepData.content}
          </p>
          
          <div className={styles.tipsList}>
            <h4>Key Points:</h4>
            <ul>
              {currentStepData.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.tutorialControls}>
          <button 
            className={styles.controlButton}
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>
          
          <span className={styles.stepCounter}>
            {currentStep + 1} of {tutorialSteps.length}
          </span>
          
          {currentStep < tutorialSteps.length - 1 ? (
            <button 
              className={styles.controlButton}
              onClick={nextStep}
            >
              Next →
            </button>
          ) : (
            <button 
              className={styles.startPracticeButton}
              onClick={onStartPractice}
            >
              Start Practice! 🎯
            </button>
          )}
        </div>

        <div className={styles.tutorialFooter}>
          <p>Take your time to understand each concept. You can always come back to review!</p>
        </div>
      </div>
    </div>
  );
};

export default TenBallTutorial;