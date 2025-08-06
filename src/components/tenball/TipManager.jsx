import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import ContextualTip from './ContextualTip';

const TipManager = forwardRef(({ gameState, onTipShown }, ref) => {
  const [currentTip, setCurrentTip] = useState(null);
  const [isTipVisible, setIsTipVisible] = useState(false);
  const [shownTips, setShownTips] = useState(new Set());

  // Add manual trigger for testing
  const triggerTip = (tipKey) => {
    showTip(tipKey);
  };

  // Reset all tips for testing
  const resetTips = () => {
    setShownTips(new Set());
  };

  // Expose functions through ref
  useImperativeHandle(ref, () => ({
    triggerTip,
    resetTips
  }));

  // Define contextual tips based on game scenarios
  const contextualTips = {
    breakShot: {
      title: "Break Shot",
      tip: "Always hit the lowest numbered ball first! A good break can set up your entire game!"
    },
    callShot: {
      title: "Call Shot",
      tip: "Be specific about which pocket you're aiming for! If you don't call it, it doesn't count!"
    },
    pushOut: {
      title: "Push Out Opportunity",
      tip: "Use push out to improve your position when the table is difficult!"
    },
    foul: {
      title: "Foul Committed",
      tip: "Three consecutive fouls by the same player results in loss of game!"
    },
    tenBall: {
      title: "10-Ball Target",
      tip: "The 10-ball is the only ball that matters for winning!"
    },
    defensive: {
      title: "Defensive Play",
      tip: "Sometimes the best shot is the one that leaves your opponent nothing!"
    },
    practice: {
      title: "Keep Learning",
      tip: "Practice makes perfect - keep playing and learning!"
    },
    scratch: {
      title: "Scratch Foul",
      tip: "The cue ball went in a pocket! Your opponent gets ball-in-hand."
    },
    wrongBall: {
      title: "Wrong Ball First",
      tip: "You must hit the lowest numbered ball first! This is a foul."
    },
    noRail: {
      title: "No Rail Contact",
      tip: "After contact, a ball must hit a rail or be pocketed. This is a foul."
    },
    ballInHand: {
      title: "Ball-in-Hand",
      tip: "You can place the cue ball anywhere on the table after a foul."
    },
    kitchen: {
      title: "Kitchen Rule",
      tip: "During break, the cue ball must start in the kitchen (behind the head string)."
    },
    threeFoul: {
      title: "Three Foul Rule",
      tip: "Three consecutive fouls by the same player results in loss of game!"
    },
    pushOutStrategy: {
      title: "Push Out Strategy",
      tip: "After a legal break, you can push out to improve position. Opponent then chooses to shoot or pass."
    },
    callPocket: {
      title: "Call Pocket",
      tip: "You must call both the ball and the pocket for every shot after the break."
    },
    lowestBall: {
      title: "Lowest Ball First",
      tip: "Always hit the lowest numbered ball on the table first!"
    },
    safety: {
      title: "Safety Shot",
      tip: "A safety shot is when you don't expect to pocket a ball but leave your opponent in a difficult position."
    },
    jumpShot: {
      title: "Jump Shot",
      tip: "Jump shots are legal in 10-ball, but be careful not to jump the cue ball off the table!"
    },
    gameWinning: {
      title: "Game Winner",
      tip: "Legally pocket the 10-ball to win! Remember to call it and the pocket."
    }
  };

  const showTip = (tipKey) => {
    if (shownTips.has(tipKey)) return; // Don't show the same tip twice
    
    const tip = contextualTips[tipKey];
    if (tip) {
      setCurrentTip(tip);
      setIsTipVisible(true);
      setShownTips(prev => new Set([...prev, tipKey]));
      onTipShown?.(tipKey);
    }
  };

  const hideTip = () => {
    setIsTipVisible(false);
  };

  // Monitor game state for tip triggers
  useEffect(() => {
    if (!gameState) return;

    // Check for break shot scenario
    if (gameState.gamePhase === 'break' && !shownTips.has('breakShot')) {
      showTip('breakShot');
      // Also trigger kitchen rule tip
      window.dispatchEvent(new CustomEvent('kitchenRule'));
    }

    // Check for call shot scenario (after break)
    if (gameState.gamePhase === 'play' && !shownTips.has('callShot')) {
      showTip('callShot');
    }

  }, [gameState, shownTips]);

  // Add global event listeners for game events
  useEffect(() => {
    // Listen for foul events
    const handleFoul = (event) => {
      if (!shownTips.has('foul')) {
        showTip('foul');
      }
    };

    // Listen for specific foul types
    const handleScratch = (event) => {
      if (!shownTips.has('scratch')) {
        showTip('scratch');
      }
    };

    const handleWrongBall = (event) => {
      if (!shownTips.has('wrongBall')) {
        showTip('wrongBall');
      }
    };

    const handleNoRail = (event) => {
      if (!shownTips.has('noRail')) {
        showTip('noRail');
      }
    };

    // Listen for ball-in-hand
    const handleBallInHand = (event) => {
      if (!shownTips.has('ballInHand')) {
        showTip('ballInHand');
      }
    };

    // Listen for kitchen rule
    const handleKitchen = (event) => {
      if (!shownTips.has('kitchen')) {
        showTip('kitchen');
      }
    };

    // Listen for three foul rule
    const handleThreeFoul = (event) => {
      if (!shownTips.has('threeFoul')) {
        showTip('threeFoul');
      }
    };

    // Listen for push out opportunity
    const handlePushOut = (event) => {
      if (!shownTips.has('pushOut')) {
        showTip('pushOut');
      }
    };

    // Listen for push out strategy
    const handlePushOutStrategy = (event) => {
      if (!shownTips.has('pushOutStrategy')) {
        showTip('pushOutStrategy');
      }
    };

    // Listen for call pocket reminder
    const handleCallPocket = (event) => {
      if (!shownTips.has('callPocket')) {
        showTip('callPocket');
      }
    };

    // Listen for lowest ball reminder
    const handleLowestBall = (event) => {
      if (!shownTips.has('lowestBall')) {
        showTip('lowestBall');
      }
    };

    // Listen for safety shot opportunity
    const handleSafety = (event) => {
      if (!shownTips.has('safety')) {
        showTip('safety');
      }
    };

    // Listen for jump shot
    const handleJumpShot = (event) => {
      if (!shownTips.has('jumpShot')) {
        showTip('jumpShot');
      }
    };

    // Listen for 10-ball target events
    const handleTenBallTarget = (event) => {
      if (!shownTips.has('tenBall')) {
        showTip('tenBall');
      }
    };

    // Listen for game winning opportunity
    const handleGameWinning = (event) => {
      if (!shownTips.has('gameWinning')) {
        showTip('gameWinning');
      }
    };

    // Add event listeners
    window.addEventListener('gameFoul', handleFoul);
    window.addEventListener('scratchFoul', handleScratch);
    window.addEventListener('wrongBallFoul', handleWrongBall);
    window.addEventListener('noRailFoul', handleNoRail);
    window.addEventListener('ballInHand', handleBallInHand);
    window.addEventListener('kitchenRule', handleKitchen);
    window.addEventListener('threeFoul', handleThreeFoul);
    window.addEventListener('pushOutAvailable', handlePushOut);
    window.addEventListener('pushOutStrategy', handlePushOutStrategy);
    window.addEventListener('callPocket', handleCallPocket);
    window.addEventListener('lowestBall', handleLowestBall);
    window.addEventListener('safetyOpportunity', handleSafety);
    window.addEventListener('jumpShot', handleJumpShot);
    window.addEventListener('tenBallTarget', handleTenBallTarget);
    window.addEventListener('gameWinning', handleGameWinning);

    // Cleanup
    return () => {
      window.removeEventListener('gameFoul', handleFoul);
      window.removeEventListener('scratchFoul', handleScratch);
      window.removeEventListener('wrongBallFoul', handleWrongBall);
      window.removeEventListener('noRailFoul', handleNoRail);
      window.removeEventListener('ballInHand', handleBallInHand);
      window.removeEventListener('kitchenRule', handleKitchen);
      window.removeEventListener('threeFoul', handleThreeFoul);
      window.removeEventListener('pushOutAvailable', handlePushOut);
      window.removeEventListener('pushOutStrategy', handlePushOutStrategy);
      window.removeEventListener('callPocket', handleCallPocket);
      window.removeEventListener('lowestBall', handleLowestBall);
      window.removeEventListener('safetyOpportunity', handleSafety);
      window.removeEventListener('jumpShot', handleJumpShot);
      window.removeEventListener('tenBallTarget', handleTenBallTarget);
      window.removeEventListener('gameWinning', handleGameWinning);
    };
  }, [shownTips]);

    return (
    <ContextualTip
      tip={currentTip?.tip}
      isVisible={isTipVisible}
      onClose={hideTip}
    />
  );
});

export default TipManager; 