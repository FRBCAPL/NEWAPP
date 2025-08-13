import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SimplePoolGame.module.css';
import { PHASES, isBreak, isPlay, nextPhaseAfterShot, shouldEnablePushOut, canShowPushOut } from './turnStateMachine';
  // Debug flag and logger
  const DEBUG = false;
  const debugLog = (...args) => {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  };

// Import ball images
import cueBall from '../../assets/cueball.svg';
import tenBall from '../../assets/tenball.svg';
import ball1 from '../../assets/ball1.svg';
import ball2 from '../../assets/ball2.svg';
import ball3 from '../../assets/ball3.svg';
import ball4 from '../../assets/ball4.svg';
import ball5 from '../../assets/ball5.svg';
import ball6 from '../../assets/ball6.svg';
import ball7 from '../../assets/ball7.svg';
import ball8 from '../../assets/ball8.svg';
import ball9 from '../../assets/ball9.svg';

// Import table image
import predatorTable from '../PoolTableSVG/PredatorTable.png';
import frbcaplLogo from '../../assets/logo.png';
import cue1Image from '../../assets/cue1.jpg';
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  BALL_SIZE,
  BALL_RADIUS,
  PLAYFIELD_OFFSET_X,
  PLAYFIELD_OFFSET_Y,
  CORNER_MARGIN_FACTOR,
  SIDE_MARGIN_FACTOR,
  KITCHEN_LEFT,
  KITCHEN_RIGHT,
  KITCHEN_TOP,
  KITCHEN_BOTTOM,
    FOOT_SPOT_X,
    FOOT_SPOT_Y,
      POCKET_DROP_FUDGE,
      SIDE_POCKET_APPROACH_DOT,
      CORNER_POCKET_APPROACH_DOT,
      MIN_RADIAL_SPEED_TO_DROP,
      FRICTION,
      RAIL_FRICTION,
      CUSHION_BOUNCE,
      SPIN_DECAY,
      MAX_SPIN,
      SPIN_TRANSFER,
} from './constants';

const SimplePoolGame = ({ onGameEnd }) => {
  // Remove the console.log that's causing spam
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    balls: [],
    cueBall: { x: 100, y: 150, originalX: 100, originalY: 150, vx: 0, vy: 0, visible: true, isMoving: false, rotation: 0, rotationSpeed: 0, spinX: 0, spinY: 0 },
    isAnimating: false,
    currentPlayer: 1,
    gamePhase: PHASES.BREAK,
    ballInHand: false,
    scratchOccurred: false
  });
  
  // Ball-in-hand dragging state
  const [isDraggingCueBall, setIsDraggingCueBall] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Beginner-friendly mouse aiming system
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [english, setEnglish] = useState(0); // English (spin) control -1 to 1
  const [englishDirection, setEnglishDirection] = useState(0); // 0-360 degrees
  const [showAimLine, setShowAimLine] = useState(true);
  const [ghostBall, setGhostBall] = useState(null); // Ghost ball position for aiming
  const [targetBall, setTargetBall] = useState(null); // Currently targeted ball
  const [highlightedPocket, setHighlightedPocket] = useState(null); // Pocket being aimed at
  const [aimLocked, setAimLocked] = useState(false); // Lock aim when ready to shoot
  const [fineTuningMode, setFineTuningMode] = useState(false); // Ultra-fine tuning with right-click
  const [lastAimAngle, setLastAimAngle] = useState(0); // For smoothing aim changes
  const [altNudgeActive, setAltNudgeActive] = useState(false); // Hold Alt to nudge while locked (call-shot)
  
  // CSI 10-Ball Rules - Call Shot System
  const [calledBall, setCalledBall] = useState(null); // Ball player is calling
  const [calledPocket, setCalledPocket] = useState(null); // Pocket player is calling
  const [showCallShotModal, setShowCallShotModal] = useState(false); // Show call shot interface
  const [isCallShotMode, setIsCallShotMode] = useState(false); // Call shot mode on main table
  const [isPushOut, setIsPushOut] = useState(false); // Push out after break
  const [pushOutAvailable, setPushOutAvailable] = useState(false); // Push out available after break
  const [firstShotAfterBreak, setFirstShotAfterBreak] = useState(false); // Track if first shot after break has been taken
  const [isBreakShot, setIsBreakShot] = useState(false); // Track if current shot is a break shot
  const [pushOutResult, setPushOutResult] = useState(null); // Track push out result for opponent decision
  const [showPushOutDecision, setShowPushOutDecision] = useState(false); // Show push out accept/decline UI
  // Removed foulCount - only tracking consecutive fouls for 3-foul rule
  const [consecutiveFouls, setConsecutiveFouls] = useState({ 1: 0, 2: 0 }); // Consecutive fouls per player
  const [foulType, setFoulType] = useState(null); // Type of foul committed
  const [firstBallHit, setFirstBallHit] = useState(null); // First ball hit in shot
  const [railContact, setRailContact] = useState(false); // Whether any ball hit a rail after contact
  const [lowestNumberedBall, setLowestNumberedBall] = useState(null); // Lowest numbered ball on table
  const [foulHandled, setFoulHandled] = useState(false); // Prevent multiple foul handling
  const [contactMade, setContactMade] = useState(false); // Whether any contact was made
  const [firstContactDetected, setFirstContactDetected] = useState(false); // Prevent multiple first contact detections
  const [shotProcessed, setShotProcessed] = useState(false); // Prevent processing the same shot multiple times
  const [shotPlayer, setShotPlayer] = useState(null); // Track which player took the current shot
  const [objectBallsHitCushions, setObjectBallsHitCushions] = useState(0); // Track object balls that hit cushions during break
  const [illegallyPocketedBalls, setIllegallyPocketedBalls] = useState([]); // Track illegally pocketed balls
  const [showIllegalPocketOption, setShowIllegalPocketOption] = useState(false); // Show opponent option modal
  
  // Table/physics constants moved to constants.js
  
  // Animation refs
  const animationFrame = useRef(null);
  
  // Ball images mapping
  const ballImages = {
    cue: cueBall,
    1: ball1, 2: ball2, 3: ball3, 4: ball4, 5: ball5,
    6: ball6, 7: ball7, 8: ball8, 9: ball9, 10: tenBall
  };
  
     // Image cache
   const imageCache = useRef({});
   const tableImageCache = useRef(null);
   const logoImageCache = useRef(null);
  
  // Pocket positions for targeting (aligned to felt/playable area)
  const pocketPositions = (() => {
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;
    const midX = (FELT_LEFT + FELT_RIGHT) / 2;
    return [
      { x: FELT_LEFT, y: FELT_TOP, id: 'top-left' },
      { x: FELT_RIGHT, y: FELT_TOP, id: 'top-right' },
      { x: FELT_LEFT, y: FELT_BOTTOM, id: 'bottom-left' },
      { x: FELT_RIGHT, y: FELT_BOTTOM, id: 'bottom-right' },
      { x: midX, y: FELT_TOP, id: 'top-center' },
      { x: midX, y: FELT_BOTTOM, id: 'bottom-center' }
    ];
  })();

  // Call shot mode handlers
  const handleCallShotClick = useCallback((event) => {
    if (!isCallShotMode) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Compute scale dynamically based on rendered size vs canvas size
    const scale = rect.width / TABLE_WIDTH;
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // Check if clicking on a ball
    const clickedBall = gameState.balls.find(ball => 
      ball.visible && !ball.pocketed && 
      Math.sqrt((ball.x - x) ** 2 + (ball.y - y) ** 2) < BALL_RADIUS * 1.5
    );
    
    if (clickedBall) {
      setCalledBall(clickedBall.id);
      return;
    }
    
    // Check if clicking on a pocket
    const clickedPocket = pocketPositions.find(pocket => 
      Math.sqrt((pocket.x - x) ** 2 + (pocket.y - y) ** 2) < 60
    );
    
    if (clickedPocket) {
      setCalledPocket(clickedPocket.id);
      return;
    }
  }, [isCallShotMode, gameState.balls, pocketPositions]);
  
     // Get pocket ID for a given position
  const getPocketId = useCallback((x, y) => {
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;
    const midX = (FELT_LEFT + FELT_RIGHT) / 2;
    const pockets = [
      { x: FELT_LEFT, y: FELT_TOP, id: 'top-left' },
      { x: FELT_RIGHT, y: FELT_TOP, id: 'top-right' },
      { x: FELT_LEFT, y: FELT_BOTTOM, id: 'bottom-left' },
      { x: FELT_RIGHT, y: FELT_BOTTOM, id: 'bottom-right' },
      { x: midX, y: FELT_TOP, id: 'top-center' },
      { x: midX, y: FELT_BOTTOM, id: 'bottom-center' }
    ];
     
     // Find the closest pocket
     let closestPocket = null;
     let minDistance = Infinity;
     
     pockets.forEach(pocket => {
       const distance = Math.hypot(x - pocket.x, y - pocket.y);
       if (distance < minDistance) {
         minDistance = distance;
         closestPocket = pocket;
       }
     });
     
     return closestPocket ? closestPocket.id : null;
   }, []);
  
     // Pocket detection (from working simulation)
   const isInPocket = useCallback((ball) => {
     // Felt-aligned pocket centers and margins
     const FELT_LEFT = 30.0;
     const FELT_RIGHT = 570.77;
     const FELT_TOP = 24.5;
     const FELT_BOTTOM = 270.18;
     const midX = (FELT_LEFT + FELT_RIGHT) / 2;
     const pockets = [
       { x: FELT_LEFT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR, type: 'corner' },
       { x: FELT_RIGHT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR, type: 'corner' },
       { x: FELT_LEFT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR, type: 'corner' },
       { x: FELT_RIGHT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR, type: 'corner' },
       { x: midX, y: FELT_TOP, margin: BALL_SIZE * SIDE_MARGIN_FACTOR, type: 'side' },
       { x: midX, y: FELT_BOTTOM, margin: BALL_SIZE * SIDE_MARGIN_FACTOR, type: 'side' }
     ];
     const cx = ball.x;
     const cy = ball.y;
     const vx = ball.vx ?? 0;
     const vy = ball.vy ?? 0;
     const speed = Math.hypot(vx, vy);
     
     return pockets.some(pocket => {
       const dx = pocket.x - cx;
       const dy = pocket.y - cy;
       const dist = Math.hypot(dx, dy);
       if (dist >= pocket.margin + POCKET_DROP_FUDGE) return false;
       
       // Require approach direction toward pocket to avoid rail-dribble drops
       if (speed > 0) {
         const dot = (vx * dx + vy * dy) / (speed * (dist || 1));
         const minDot = pocket.type === 'side' ? SIDE_POCKET_APPROACH_DOT : CORNER_POCKET_APPROACH_DOT;
         const radialSpeed = (vx * dx + vy * dy) / (dist || 1);
         if (dot < minDot || radialSpeed < MIN_RADIAL_SPEED_TO_DROP) return false;
       }
       return true;
     });
   }, []);
   
   // Check if position is in kitchen (behind head string)
   const isInKitchen = useCallback((x, y) => {
     return x >= KITCHEN_LEFT && x <= KITCHEN_RIGHT && y >= KITCHEN_TOP && y <= KITCHEN_BOTTOM;
   }, []);
   
   // Handle scratch (cue ball in pocket)
   const handleScratch = useCallback(() => {
     setGameState(prev => ({
       ...prev,
       scratchOccurred: true,
       ballInHand: true,
       currentPlayer: prev.currentPlayer === 1 ? 2 : 1, // Switch players
       cueBall: {
         ...prev.cueBall,
         x: 100, // Default position in kitchen
         y: 150,
         vx: 0,
         vy: 0,
         visible: true,
         isMoving: false,
         rotation: 0,
         rotationSpeed: 0
       }
     }));
   }, []);
   
     // Get lowest numbered ball on table (CSI rule requirement)
  const getLowestNumberedBall = useCallback(() => {
    const visibleBalls = gameState.balls.filter(ball => ball.visible && !ball.pocketed);
    debugLog('Visible balls on table:', visibleBalls.map(b => b.id).sort((a, b) => a - b));
    if (visibleBalls.length === 0) return null;
    const lowest = visibleBalls.reduce((lowest, ball) => ball.id < lowest.id ? ball : lowest);
    debugLog('Lowest numbered ball:', lowest.id);
    return lowest;
  }, [gameState.balls]);

  // Foul detection functions
  const detectFouls = useCallback(() => {
    debugLog('=== DETECT FOULS CALLED ===');
    debugLog('isPushOut in detectFouls:', isPushOut);
    
    if (isPushOut) {
      // Only scratch is a foul during push out
      debugLog('Push out detected in detectFouls - returning null (no foul)');
      return null;
    }

    // Use the lowest ball that was on the table at the start of the shot
    const currentLowestBall = lowestNumberedBall || getLowestNumberedBall();
    let foulDetected = null;

    // Check for scratch (cue ball pocketed)
    if (!gameState.cueBall.visible) {
      debugLog('Foul detected - scratch (cue ball pocketed)');
      foulDetected = 'scratch';
    }

    // Break shot foul detection (CSI 10-Ball rules)
    if (gameState.gamePhase === 'break') {
      // On break: must contact 1-ball first, and either pocket a ball OR cause 4+ balls to hit cushions
      
      // Check if 1-ball was hit first
      if (firstBallHit && firstBallHit !== 1) {
        debugLog('Break foul detected - did not hit 1-ball first. Hit:', firstBallHit);
        foulDetected = 'break_wrong_ball_first';
      }
      
      // Check if any ball was legally pocketed
      const ballsPocketedThisShot = gameState.balls.filter(ball => 
        ball.pocketed && !ball.wasPocketedBeforeShot
      );
      
      // Use the tracked count of object balls that hit cushions
      const cushionsHit = objectBallsHitCushions;
      
      // If no ball was pocketed AND fewer than 4 object balls hit cushions, it's a foul
      if (ballsPocketedThisShot.length === 0 && cushionsHit < 4) {
        debugLog('Break foul detected - no ball pocketed and only', cushionsHit, 'object balls hit cushions');
        foulDetected = 'break_insufficient_cushions';
      }
      
      // Don't return early - let the foul be processed by the main detection flow
    }

    // Check if wrong ball hit first (must hit lowest numbered ball first)
    if (!foulDetected && firstBallHit && currentLowestBall && firstBallHit !== currentLowestBall.id) {
      debugLog('Wrong ball first foul - Hit:', firstBallHit, 'Lowest:', currentLowestBall.id);
      debugLog('Visible balls on table:', gameState.balls.filter(b => b.visible && !b.pocketed).map(b => b.id).sort((a, b) => a - b));
      foulDetected = 'wrong_ball_first';
    }
    
    // Check if no contact was made at all (player missed all balls)
    if (!foulDetected && !contactMade && !isPushOut && gameState.gamePhase !== 'break') {
      debugLog('Foul detected - no contact made with any ball');
      debugLog('isPushOut in no_contact check:', isPushOut);
      foulDetected = 'no_contact';
    }

    // Check if no rail contact AND no ball was pocketed after contact
    if (!foulDetected && contactMade && !railContact) {
      // Check if ANY ball was pocketed during this shot
      const ballsPocketedThisShot = gameState.balls.filter(ball => 
        ball.pocketed && !ball.wasPocketedBeforeShot
      );
      
      // If no ball was pocketed AND no rail contact occurred, it's a foul
      if (ballsPocketedThisShot.length === 0) {
        debugLog('Foul detected - no rail contact and no ball pocketed. Contact made:', contactMade, 'Rail contact:', railContact, 'First ball hit:', firstBallHit);
        debugLog('isPushOut in no_rail_contact check:', isPushOut);
        foulDetected = 'no_rail_contact';
      }
    }
    
    debugLog('Foul detection check - Contact made:', contactMade, 'Rail contact:', railContact, 'First ball hit:', firstBallHit, 'Foul detected:', foulDetected);
    debugLog('Current lowest ball:', currentLowestBall ? currentLowestBall.id : 'none');

    return foulDetected;
  }, [isPushOut, firstBallHit, railContact, contactMade, getLowestNumberedBall, gameState.balls, lowestNumberedBall, gameState.cueBall.visible, gameState.gamePhase, objectBallsHitCushions]);

  // Detect illegally pocketed balls (CSI 10-Ball rules)
  const detectIllegallyPocketedBalls = useCallback(() => {
    if (gameState.gamePhase === 'break' || isPushOut) {
      // No call shot required on break or push out, so no illegally pocketed balls
      return [];
    }

    const ballsPocketedThisShot = gameState.balls.filter(ball => 
      ball.pocketed && !ball.wasPocketedBeforeShot
    );

    if (ballsPocketedThisShot.length === 0) {
      return []; // No balls pocketed
    }

    const illegallyPocketed = [];

    ballsPocketedThisShot.forEach(ball => {
      if (ball.id === calledBall) {
        // Called ball was pocketed - check if it went in the called pocket
        if (ball.pocketedPocket !== calledPocket) {
          debugLog('Illegally pocketed ball:', ball.id, '- called ball went in wrong pocket');
          illegallyPocketed.push(ball);
        }
      } else {
        // Not the called ball - check if called ball was legally pocketed
        const calledBallPocketed = ballsPocketedThisShot.find(b => b.id === calledBall);
        if (!calledBallPocketed || calledBallPocketed.pocketedPocket !== calledPocket) {
          debugLog('Illegally pocketed ball:', ball.id, '- not called ball and called ball not legally pocketed');
          illegallyPocketed.push(ball);
        }
      }
    });

    return illegallyPocketed;
  }, [gameState.gamePhase, isPushOut, calledBall, calledPocket, gameState.balls]);

  const handleFoul = useCallback((foulType) => {
    // Use shotPlayer instead of currentPlayer to ensure we're handling the foul for the correct player
    const playerWhoFouled = shotPlayer || gameState.currentPlayer;
    
    debugLog('Handling foul:', foulType, 'for player:', playerWhoFouled);
    
    // Dispatch foul event for tip system
    window.dispatchEvent(new CustomEvent('gameFoul', { detail: { foulType, player: playerWhoFouled } }));
    
    // Dispatch specific foul type events for contextual tips
    if (foulType === 'scratch') {
      window.dispatchEvent(new CustomEvent('scratchFoul', { detail: { player: playerWhoFouled } }));
    } else if (foulType === 'wrong_ball_first') {
      window.dispatchEvent(new CustomEvent('wrongBallFoul', { detail: { player: playerWhoFouled } }));
    } else if (foulType === 'no_rail_contact') {
      window.dispatchEvent(new CustomEvent('noRailFoul', { detail: { player: playerWhoFouled } }));
    }
    
    // Dispatch ball-in-hand event
    window.dispatchEvent(new CustomEvent('ballInHand', { detail: { player: playerWhoFouled } }));
    
    // Update consecutive fouls (for 3-foul rule)
    setConsecutiveFouls(prev => {
      debugLog('Handling foul - Previous consecutive fouls:', prev, 'Player who fouled:', playerWhoFouled);
      const newConsecutiveFouls = {
        ...prev,
        [playerWhoFouled]: prev[playerWhoFouled] + 1
        // Don't reset other player's fouls - each player maintains their own count
      };
      
      debugLog('Handling foul - New consecutive fouls:', newConsecutiveFouls);
      
      // Check for 3-foul rule (player loses after 3 consecutive fouls)
      if (newConsecutiveFouls[playerWhoFouled] >= 3) {
        debugLog(`Player ${playerWhoFouled} loses due to 3 consecutive fouls!`);
        // Dispatch three foul event for tip system
        window.dispatchEvent(new CustomEvent('threeFoul', { detail: { player: playerWhoFouled } }));
        // You could add a game over state here
        alert(`Player ${playerWhoFouled} loses due to 3 consecutive fouls!`);
      }
      
      return newConsecutiveFouls;
    });

    // Apply ball-in-hand penalty
    setGameState(prev => ({
      ...prev,
      ballInHand: true,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1, // Switch players
      scratchOccurred: foulType === 'scratch'
    }));

    // If it's a scratch, reposition the cue ball for ball-in-hand
    if (foulType === 'scratch') {
      setGameState(prev => ({
        ...prev,
        cueBall: {
          ...prev.cueBall,
          visible: true,
          x: 100, // Default position (well within felt boundaries)
          y: 150,
          vx: 0,
          vy: 0
        }
      }));
    }

    // Set foul type for display
    setFoulType(foulType);
  }, [gameState.currentPlayer, shotPlayer]);

  // Check if click is on cue ball
  const isClickOnCueBall = useCallback((x, y) => {
    const cueBall = gameState.cueBall;
    const distance = Math.hypot(x - cueBall.x, y - cueBall.y);
    return distance <= BALL_RADIUS;
  }, [gameState.cueBall]);
   
   // Start dragging cue ball
   const startDraggingCueBall = useCallback((x, y) => {
     if ((gameState.ballInHand || gameState.gamePhase === 'break') && isClickOnCueBall(x, y)) {
       setIsDraggingCueBall(true);
       setDragOffset({
         x: x - gameState.cueBall.x,
         y: y - gameState.cueBall.y
       });
     }
   }, [gameState.ballInHand, gameState.gamePhase, gameState.cueBall, isClickOnCueBall]);
   
   // Update cue ball position while dragging
   const updateCueBallPosition = useCallback((x, y) => {
     if (isDraggingCueBall) {
       const newX = x - dragOffset.x;
       const newY = y - dragOffset.y;
       
       let constrainedX, constrainedY;
       
       if (gameState.gamePhase === 'break') {
         // During break: constrain to kitchen area
         constrainedX = Math.max(KITCHEN_LEFT + BALL_RADIUS, Math.min(KITCHEN_RIGHT - BALL_RADIUS, newX));
         constrainedY = Math.max(KITCHEN_TOP + BALL_RADIUS, Math.min(KITCHEN_BOTTOM - BALL_RADIUS, newY));
       } else {
         // During regular gameplay: allow placement anywhere on table (but not in pockets)
         // Use proper felt boundaries to keep cue ball on playing surface
     const FELT_LEFT = 30.0;
     const FELT_RIGHT = 570.77;
     const FELT_TOP = 24.5;
     const FELT_BOTTOM = 270.18;
     
         constrainedX = Math.max(FELT_LEFT + BALL_RADIUS, Math.min(FELT_RIGHT - BALL_RADIUS, newX));
         constrainedY = Math.max(FELT_TOP + BALL_RADIUS, Math.min(FELT_BOTTOM - BALL_RADIUS, newY));
       }
       
       setGameState(prev => ({
         ...prev,
         cueBall: {
           ...prev.cueBall,
           x: constrainedX,
           y: constrainedY
         }
       }));
     }
   }, [isDraggingCueBall, dragOffset, gameState.gamePhase]);
   
   // Stop dragging and place cue ball
   const stopDraggingCueBall = useCallback(() => {
     if (isDraggingCueBall) {
       setIsDraggingCueBall(false);
       // Don't set ballInHand to false - keep it true so user can reposition again
     }
   }, [isDraggingCueBall]);
   
   // Place cue ball in kitchen (for break shots or ball-in-hand)
   const placeCueBallInKitchen = useCallback((x, y) => {
     if (isInKitchen(x, y)) {
       setGameState(prev => ({
         ...prev,
         cueBall: {
           ...prev.cueBall,
           x: x,
           y: y,
           vx: 0,
           vy: 0,
           visible: true,
           isMoving: false
         },
         ballInHand: false
       }));
     }
   }, [isInKitchen]);
   
   // Find nearest pocket for targeting
   const findNearestPocket = useCallback((x, y) => {
     let nearest = null;
     let minDist = Infinity;
     
     pocketPositions.forEach(pocket => {
       const dist = Math.hypot(x - pocket.x, y - pocket.y);
       if (dist < minDist) {
         minDist = dist;
         nearest = pocket;
       }
     });
     
     return nearest;
   }, []);
   
        // Calculate ghost ball position for aim line display
  const calculateGhostBall = useCallback((targetX, targetY, aimX, aimY) => {
    // Calculate the ghost ball position (where the cue ball should be to hit the target)
    const dx = targetX - aimX;
    const dy = targetY - aimY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < BALL_RADIUS * 2) {
      // Too close - no valid ghost ball position
      return null;
    }
    
    // Calculate the ghost ball position
    const ghostX = targetX - (dx / distance) * (BALL_RADIUS * 2);
    const ghostY = targetY - (dy / distance) * (BALL_RADIUS * 2);
    
    return { x: ghostX, y: ghostY };
  }, []);

  // UI hit-test helper for push out checkbox (canvas overlay)
  function isPushOutCheckboxClick(x, y) {
    return x >= 15 && x <= 30 && y >= TABLE_HEIGHT - 75 && y <= TABLE_HEIGHT - 60;
  }

  // Render helper for push out overlay
  function renderPushOutOverlay(ctx, tableHeight, isPushOutFlag, pushOutAvail, phase) {
    if (!canShowPushOut(phase, pushOutAvail)) return;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fillRect(10, tableHeight - 80, 200, 25);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, tableHeight - 80, 200, 25);
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Push Out Available', 15, tableHeight - 65);
    
    // Checkbox
    ctx.fillStyle = isPushOutFlag ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(15, tableHeight - 75, 15, 15);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, tableHeight - 75, 15, 15);
    
    if (isPushOutFlag) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✓', 22, tableHeight - 65);
    }
  }

  // Render helper for trajectory path
  function renderTrajectoryPath(ctx, points) {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // Style helper for cue aim overlay
  function renderCueAimStyle(ctx) {
    let lineColor = 'rgba(255, 255, 255, 0.8)';
    if (aimLocked) {
      lineColor = 'rgba(0, 255, 0, 0.95)';
    } else if (fineTuningMode) {
      lineColor = 'rgba(255, 255, 0, 0.9)';
    }
    
    // Add English color coding
    if (Math.abs(english) > 0.1) {
      if (english > 0) {
        lineColor = 'rgba(76, 175, 80, 0.9)'; // Green for top spin
      } else {
        lineColor = 'rgba(244, 67, 54, 0.9)'; // Red for back spin
      }
    }
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = aimLocked ? 4 : (fineTuningMode ? 2 : 3);
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9;
  }

  // Estimate a good visible aim length when trajectory is too short (e.g., inside pocket zone)
  function computeFallbackAimLength(currentPower) {
    // Scale with table width so it feels consistent across sizes
    const base = TABLE_WIDTH * 0.3; // 30% of table width
    const variable = TABLE_WIDTH * 0.5 * currentPower; // up to +50% with power
    return base + variable; // 180px..480px @ 600px table
  }

  // Simple top-layer cue aim line for visibility over overlays
  function renderCueAimLineTop(ctx, fromX, fromY, angle, pow) {
    renderCueAimStyle(ctx);
    const length = 120 + pow * 180; // dynamic with power
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX + Math.cos(angle) * length, fromY + Math.sin(angle) * length);
    ctx.stroke();
  }

  // Small helper for angle smoothing (handles wrap-around)
  function shortestAngleDelta(target, current) {
    let delta = target - current;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }
   
   // Pocket assistance system for easier pocket aiming
  const getPocketAssistedAim = useCallback((rawAimX, rawAimY) => {
    // Check if we're aiming near a pocket (felt-aligned)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;
    const midX = (FELT_LEFT + FELT_RIGHT) / 2;
    const pockets = [
      { x: FELT_LEFT, y: FELT_TOP, id: 'top-left' },
      { x: FELT_RIGHT, y: FELT_TOP, id: 'top-right' },
      { x: FELT_LEFT, y: FELT_BOTTOM, id: 'bottom-left' },
      { x: FELT_RIGHT, y: FELT_BOTTOM, id: 'bottom-right' },
      { x: midX, y: FELT_TOP, id: 'top-center' },
      { x: midX, y: FELT_BOTTOM, id: 'bottom-center' }
    ];
     
     let nearestPocket = null;
     let minDistance = Infinity;
     
     pockets.forEach(pocket => {
       const distance = Math.hypot(rawAimX - pocket.x, rawAimY - pocket.y);
       if (distance < minDistance) {
         minDistance = distance;
         nearestPocket = pocket;
       }
     });
     
     // If aiming within 80 pixels of a pocket, provide assistance
     if (nearestPocket && minDistance < 80) {
       const assistanceStrength = Math.max(0, (80 - minDistance) / 80); // 0 to 1
       const assistedX = rawAimX + (nearestPocket.x - rawAimX) * assistanceStrength * 0.3;
       const assistedY = rawAimY + (nearestPocket.y - rawAimY) * assistanceStrength * 0.3;
       
       return {
         x: assistedX,
         y: assistedY,
         assisted: true
       };
     }
     
     return {
       x: rawAimX,
       y: rawAimY,
       assisted: false
     };
   }, []);
   
   // Simplified and more accurate trajectory prediction system
  const predictAllBallTrajectories = useCallback((cueBallVx, cueBallVy, cueBallPos = null, options = {}) => {
    const { ignoreCuePocket = true } = options;
     const trajectories = {};
    const friction = 0.99; // Match exact runtime friction
    const subSteps = 16;     // Match exact runtime sub-steps
     
     // Use the exact same felt bounds as the actual game
     const FELT_LEFT = 30.77;
     const FELT_RIGHT = 570.77;
     const FELT_TOP = 24.5;
     const FELT_BOTTOM = 270.18;
     
     // Ball colors for trajectory lines
     const ballColors = {
       1: '#ffff00', // Yellow
       2: '#0000ff', // Blue
       3: '#ff0000', // Red
       4: '#800080', // Purple
       5: '#ffa500', // Orange
       6: '#008000', // Green
       7: '#8b4513', // Brown
       8: '#000000', // Black
       9: '#ffff00', // Yellow stripe
       10: '#ff0000' // Red (10-ball)
     };
     
     // Simplified simulation for better performance and accuracy
     const simulateShot = () => {
       const ballStates = new Map();
       
       // Initialize all balls with current positions
        gameState.balls.forEach(ball => {
         if (ball.visible && !ball.pocketed) {
           ballStates.set(ball.id, {
              id: ball.id,
             x: ball.x,
             y: ball.y,
             vx: 0,
             vy: 0,
             visible: true,
             isMoving: false,
             trajectory: [{ x: ball.x, y: ball.y }]
           });
         }
       });
       
       // Add cue ball using exact position
       const cueBallPosition = cueBallPos || gameState.cueBall;
        ballStates.set('cue', {
          id: 'cue',
         x: cueBallPosition.x,
         y: cueBallPosition.y,
         vx: cueBallVx,
         vy: cueBallVy,
         visible: true,
         isMoving: true,
         trajectory: [{ x: cueBallPosition.x, y: cueBallPosition.y }]
       });
       
       // Run simplified physics simulation
       for (let step = 0; step < 300; step++) { // Reduced steps for better performance
          const activeBalls = Array.from(ballStates.values()).filter(ball => ball.visible);
         
         // Update ball positions
         for (let s = 0; s < subSteps; s++) {
           activeBalls.forEach(ball => {
             if (Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
               ball.vx = 0;
               ball.vy = 0;
               return;
             }
           
             // Apply friction
             ball.vx *= Math.pow(friction, 1 / subSteps);
             ball.vy *= Math.pow(friction, 1 / subSteps);
       
       // Calculate next position
             let nextX = ball.x + ball.vx / subSteps;
             let nextY = ball.y + ball.vy / subSteps;
       
             // Rail bounce physics (matching actual game exactly)
       let bounced = false;
       if (nextX < FELT_LEFT + BALL_RADIUS) {
               ball.x = FELT_LEFT + BALL_RADIUS;
               ball.vx = Math.abs(ball.vx) * 0.85; // Match actual game
         bounced = true;
       } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
               ball.x = FELT_RIGHT - BALL_RADIUS;
               ball.vx = -Math.abs(ball.vx) * 0.8; // Match actual game
         bounced = true;
             } else {
               ball.x = nextX;
       }
       
       if (nextY < FELT_TOP + BALL_RADIUS) {
               ball.y = FELT_TOP + BALL_RADIUS;
               ball.vy = Math.abs(ball.vy) * 0.85; // Match actual game
         bounced = true;
       } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
               ball.y = FELT_BOTTOM - BALL_RADIUS;
               ball.vy = -Math.abs(ball.vy) * 0.8; // Match actual game
         bounced = true;
             } else {
               ball.y = nextY;
             }
           
             // Check pocket detection (matching actual game exactly)
             let pocketed = false;
             
              // Use the exact same pocket detection as the actual game (reuse outer felt bounds)
              const midX = (FELT_LEFT + FELT_RIGHT) / 2;
              const pockets = [
                { x: FELT_LEFT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
                { x: FELT_RIGHT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
                { x: FELT_LEFT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
                { x: FELT_RIGHT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
                { x: midX, y: FELT_TOP, margin: BALL_SIZE * SIDE_MARGIN_FACTOR },
                { x: midX, y: FELT_BOTTOM, margin: BALL_SIZE * SIDE_MARGIN_FACTOR }
              ];
             
             // Pocket detection (matching actual game exactly)
             const cx = ball.x;
             const cy = ball.y;
             // Use the exact same pocket detection logic as the actual game
             const vx = ball.vx ?? 0;
             const vy = ball.vy ?? 0;
             const speed = Math.hypot(vx, vy);
             
             // For preview trajectories, disable pocket detection entirely
             let inPocket = false;
             if (!ignoreCuePocket) {
               inPocket = pockets.some(pocket => {
                 const dx = pocket.x - cx;
                 const dy = pocket.y - cy;
                 const dist = Math.hypot(dx, dy);
                 const pocketThreshold = pocket.margin + POCKET_DROP_FUDGE;
                 if (dist >= pocketThreshold) return false;
                 
                 // Require approach direction toward pocket to avoid rail-dribble drops
                 if (speed > 0) {
                   const dot = (vx * dx + vy * dy) / (speed * (dist || 1));
                   const minDot = pocket.x === midX ? SIDE_POCKET_APPROACH_DOT : CORNER_POCKET_APPROACH_DOT;
                   const radialSpeed = (vx * dx + vy * dy) / (dist || 1);
                   if (dot < minDot || radialSpeed < MIN_RADIAL_SPEED_TO_DROP) return false;
                 }
                 return true;
               });
             }
             
              if (inPocket && !(ignoreCuePocket && ball.id === 'cue')) {
               pocketed = true;
             }
             
             // Apply pocket assistance for more forgiving pocket detection
             if (!pocketed && ball.id !== 'cue') {
               // Check if ball is very close to a pocket and apply gentle assistance
               const pocketAssistance = getPocketAssistedAim(ball.x, ball.y);
               if (pocketAssistance.assisted) {
                 // Gently nudge the ball toward the pocket
                 const dx = pocketAssistance.x - ball.x;
                 const dy = pocketAssistance.y - ball.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);
                 if (distance < 5) { // Only if very close
                   pocketed = true;
                 }
               }
             }
             
                          if (pocketed) {
               ball.visible = false;
               ball.trajectory.push({ x: ball.x, y: ball.y, pocketed: true });
               return;
             }
             
             // Stop if very slow (matching actual game)
             if (ball.isMoving && Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
               ball.vx = 0;
               ball.vy = 0;
               ball.isMoving = false;
             }
             
             // Update trajectory with current position
             ball.trajectory.push({ x: ball.x, y: ball.y, bounced });
           });
         }
         
         // Simplified ball-ball collision detection
         const cueBall = ballStates.get('cue');
         if (cueBall && cueBall.visible) {
           ballStates.forEach((ball, ballId) => {
             if (ballId !== 'cue' && ball.visible) {
               const dx = ball.x - cueBall.x;
               const dy = ball.y - cueBall.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
               if (dist > 0 && dist < BALL_SIZE + 0.5) { // Slightly more forgiving collision detection
                 // Simple collision resolution
                 const overlap = BALL_SIZE - dist + 0.01;
            const nx = dx / dist;
            const ny = dy / dist;
            
                 // Separate balls with more stable positioning
                 const separationDistance = Math.max(overlap / 2, 0.1); // Minimum separation
                 cueBall.x -= nx * separationDistance;
                 cueBall.y -= ny * separationDistance;
                 ball.x += nx * separationDistance;
                 ball.y += ny * separationDistance;
                 
                 // Collision physics (matching actual game exactly)
                 const dvx = cueBall.vx - ball.vx;
                 const dvy = cueBall.vy - ball.vy;
                 const relVel = dvx * nx + dvy * ny;
                 const impulse = -relVel || 0.01;
                 cueBall.vx += impulse * nx;
                 cueBall.vy += impulse * ny;
                 ball.vx -= impulse * nx;
                 ball.vy -= impulse * ny;
                 
                 // Mark collision
                 if (cueBall.trajectory.length > 0) {
                   cueBall.trajectory[cueBall.trajectory.length - 1].collision = true;
                 }
                 if (ball.trajectory.length > 0) {
                   ball.trajectory[ball.trajectory.length - 1].collision = true;
                 }
               }
             }
           });
         }
         
         // Then check all other balls vs each other (same order as actual game)
         const ballArray = Array.from(ballStates.values()).filter(ball => ball.id !== 'cue' && ball.visible);
         for (let i = 0; i < ballArray.length; i++) {
           for (let j = i + 1; j < ballArray.length; j++) {
             const ballA = ballArray[i];
             const ballB = ballArray[j];
             
             const dx = ballB.x - ballA.x;
             const dy = ballB.y - ballA.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             
             if (dist > 0 && dist < BALL_SIZE) {
               // Use the exact same collision resolution as the actual game
               const overlap = BALL_SIZE - dist + 0.01;
               const nx = dx / dist;
               const ny = dy / dist;
               ballA.x -= nx * (overlap / 2);
               ballA.y -= ny * (overlap / 2);
               ballB.x += nx * (overlap / 2);
               ballB.y += ny * (overlap / 2);
               
               // Update velocities (exact same as actual game)
               const dvx = ballA.vx - ballB.vx;
               const dvy = ballA.vy - ballB.vy;
               const relVel = dvx * nx + dvy * ny;
               const impulse = -relVel || 0.01;
               ballA.vx += impulse * nx;
               ballA.vy += impulse * ny;
               ballB.vx -= impulse * nx;
               ballB.vy -= impulse * ny;
               
               // Set isMoving flag (exact same as actual game)
               ballA.isMoving = true;
               ballB.isMoving = true;
               
               // Mark collision point
               if (ballA.trajectory.length > 0) {
                 ballA.trajectory[ballA.trajectory.length - 1].collision = true;
               }
               if (ballB.trajectory.length > 0) {
                 ballB.trajectory[ballB.trajectory.length - 1].collision = true;
               }
             }
           }
         }
       
                 // Stop if all balls are stationary (matching actual game)
        const allStopped = activeBalls.every(ball => 
          Math.abs(ball.vx) < 0.028 && Math.abs(ball.vy) < 0.028
        );
       
       if (allStopped) break;
     }
     
     // Convert to trajectories object
     ballStates.forEach((ball, id) => {
       if (ball.trajectory.length > 1) {
         trajectories[id] = {
           points: ball.trajectory,
           color: ballColors[id] || '#ffffff'
         };
       }
     });
   };
   
   simulateShot();
   return trajectories;
 }, [gameState.balls, gameState.cueBall, isInPocket]);
  
  // Enhanced ball collision resolution with spin transfer
  const resolveBallCollision = useCallback((a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist >= BALL_SIZE) return false; // No collision occurred

    // 1. Resolve overlap
    const overlap = BALL_SIZE - dist + 0.01;
    const nx = dx / dist;
    const ny = dy / dist;
    a.x -= nx * (overlap / 2);
    a.y -= ny * (overlap / 2);
    b.x += nx * (overlap / 2);
    b.y += ny * (overlap / 2);

    // 2. Calculate collision normal and relative velocity
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const relVel = dvx * nx + dvy * ny;
    const impulse = -relVel || 0.01;
    
    // 3. Update velocities with impulse
    a.vx += impulse * nx;
    a.vy += impulse * ny;
    b.vx -= impulse * nx;
    b.vy -= impulse * ny;

    // 4. Transfer spin effects between balls
    const spinTransfer = SPIN_TRANSFER;
    const aSpinX = a.spinX || 0;
    const aSpinY = a.spinY || 0;
    const bSpinX = b.spinX || 0;
    const bSpinY = b.spinY || 0;
    
    // Transfer spin based on collision normal
    const spinTransferX = (aSpinX - bSpinX) * spinTransfer * nx;
    const spinTransferY = (aSpinY - bSpinY) * spinTransfer * ny;
    
    a.spinX = (aSpinX - spinTransferX) * 0.9; // Dampen spin after collision
    a.spinY = (aSpinY - spinTransferY) * 0.9;
    b.spinX = (bSpinX + spinTransferX) * 0.9;
    b.spinY = (bSpinY + spinTransferY) * 0.9;

    a.isMoving = true;
    b.isMoving = true;
    
    return true; // Collision occurred
  }, []);
  
  // Initialize balls in 10-ball rack formation
  const initializeBalls = useCallback(() => {
    const balls = [];
    const rackApexX = TABLE_WIDTH * 0.75;
    const rackApexY = TABLE_HEIGHT / 2;
    const rackSpacingX = BALL_SIZE * 0.87;
    const rackSpacingY = BALL_SIZE / 2;

         function jitter() {
       return (Math.random() - 0.5) * 1.5;
     }

              // 10-ball rack formation (proper triangle, apex pointing toward cue ball)
     const rackPositions = [
       { x: rackApexX, y: rackApexY }, // 1-ball (apex) - front center
       { x: rackApexX + BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.48 }, // Row 2 left
       { x: rackApexX + BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.48 }, // Row 2 right
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.95 }, // Row 3 left
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY }, // 10-ball (middle)
       { x: rackApexX + 2 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.95 }, // Row 3 right
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 1.43 }, // Row 4 left (2-ball corner)
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 0.48 }, // Row 4 center-left
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 0.48 }, // Row 4 center-right
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 1.43 }  // Row 4 right (3-ball corner)
     ];

     // Official CSI 10-ball rack order: 1 at front, 10 in middle, 2&3 in back corners, rest random
     const backCornerPositions = [
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY - BALL_SIZE * 1.43 }, // Back left corner (2-ball)
       { x: rackApexX + 3 * BALL_SIZE * 0.95, y: rackApexY + BALL_SIZE * 1.43 }  // Back right corner (3-ball)
     ];
     
     // Randomly place 2 and 3 in back corners
     const cornerBalls = [2, 3];
     const shuffledCorners = cornerBalls.sort(() => Math.random() - 0.5);
     
     // Create random order for balls 4-9
     const remainingBalls = [4, 5, 6, 7, 8, 9];
     const shuffledRemaining = remainingBalls.sort(() => Math.random() - 0.5);
     
     // Final ball order: 1, 10, 2&3 in corners, rest random
     const ballOrder = [1, 10, ...shuffledCorners, ...shuffledRemaining];

         // Place balls according to CSI rules
     ballOrder.forEach((ballId, index) => {
       let position;
       
       if (index === 0) {
         // 1-ball at apex
         position = rackPositions[0];
       } else if (index === 1) {
         // 10-ball in middle (third row center)
         position = rackPositions[4];
       } else if (index === 2 || index === 3) {
         // 2 and 3 balls in back corners (last row)
         const cornerIndex = index - 2;
         position = backCornerPositions[cornerIndex];
                } else {
           // Remaining balls (4-9) in random positions
           const remainingPositions = [
             rackPositions[1], // Row 2 left
             rackPositions[2], // Row 2 right
             rackPositions[3], // Row 3 left (but not center - that's 10-ball)
             rackPositions[5], // Row 3 right
             rackPositions[7], // Row 4 center-left
             rackPositions[8]  // Row 4 center-right
           ];
           position = remainingPositions[index - 4];
         }
       
       if (position) {
         balls.push({
           id: ballId,
           x: position.x + jitter(),
           y: position.y + jitter(),
           vx: 0,
           vy: 0,
           visible: true,
           pocketed: false,
           wasPocketedBeforeShot: false, // Track if ball was pocketed before current shot
           isMoving: false,
           rotation: 0, // Ball rotation angle
           rotationSpeed: 0, // Ball rotation speed
           spinX: 0, // Spin effect on X axis
           spinY: 0  // Spin effect on Y axis
         });
       }
     });

    return balls;
  }, []);
  
  // Main animation loop (from working simulation)
  const animateBalls = useCallback(() => {
    const subSteps = 16;

    // Felt bounds in simulation coordinates (from working simulation)
    const FELT_LEFT = 30.0;
    const FELT_RIGHT = 570.77;
    const FELT_TOP = 24.5;
    const FELT_BOTTOM = 270.18;

    function step() {
      let pocketedThisFrame = [];

      for (let s = 0; s < subSteps; s++) {
        // Update cue ball
        if (gameState.cueBall.visible) {
          let nextX = gameState.cueBall.x + gameState.cueBall.vx / subSteps;
          let nextY = gameState.cueBall.y + gameState.cueBall.vy / subSteps;

          // Rail collision using felt bounds with enhanced physics
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            gameState.cueBall.x = FELT_LEFT + BALL_RADIUS;
            gameState.cueBall.vx = Math.abs(gameState.cueBall.vx) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            gameState.cueBall.spinY *= SPIN_DECAY;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              debugLog('Rail contact detected for cue ball');
              setRailContact(true);
            }
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            gameState.cueBall.x = FELT_RIGHT - BALL_RADIUS;
            gameState.cueBall.vx = -Math.abs(gameState.cueBall.vx) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            gameState.cueBall.spinY *= SPIN_DECAY;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else {
            gameState.cueBall.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            gameState.cueBall.y = FELT_TOP + BALL_RADIUS;
            gameState.cueBall.vy = Math.abs(gameState.cueBall.vy) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            gameState.cueBall.spinX *= SPIN_DECAY;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
            gameState.cueBall.y = FELT_BOTTOM - BALL_RADIUS;
            gameState.cueBall.vy = -Math.abs(gameState.cueBall.vy) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            gameState.cueBall.spinX *= SPIN_DECAY;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else {
            gameState.cueBall.y = nextY;
          }

          // Apply friction and spin effects
          gameState.cueBall.vx *= Math.pow(FRICTION, 1 / subSteps);
          gameState.cueBall.vy *= Math.pow(FRICTION, 1 / subSteps);
          
          // Apply spin effects to velocity
          gameState.cueBall.vx += gameState.cueBall.spinX * MAX_SPIN;
          gameState.cueBall.vy += gameState.cueBall.spinY * MAX_SPIN;
          
          // Decay spin effects
          gameState.cueBall.spinX *= Math.pow(SPIN_DECAY, 1 / subSteps);
          gameState.cueBall.spinY *= Math.pow(SPIN_DECAY, 1 / subSteps);

          // Update ball rotation based on movement
          const speed = Math.sqrt(gameState.cueBall.vx * gameState.cueBall.vx + gameState.cueBall.vy * gameState.cueBall.vy);
          if (speed > 0.01) {
            // Calculate rotation speed based on linear velocity
            gameState.cueBall.rotationSpeed = speed / BALL_RADIUS;
            
            // Simple but effective rotation that works for all directions
            // Use the dominant velocity component to determine rotation direction
            if (Math.abs(gameState.cueBall.vx) > Math.abs(gameState.cueBall.vy)) {
              // Horizontal movement dominates - rotate based on x direction
              gameState.cueBall.rotation += (gameState.cueBall.rotationSpeed / subSteps) * Math.sign(gameState.cueBall.vx);
            } else {
              // Vertical movement dominates - rotate based on y direction
              gameState.cueBall.rotation += (gameState.cueBall.rotationSpeed / subSteps) * Math.sign(gameState.cueBall.vy);
            }
          } else {
            gameState.cueBall.rotationSpeed = 0;
          }

          // Pocket detection (scratch) - just mark it as pocketed, foul detection will handle it
          if (isInPocket(gameState.cueBall)) {
            gameState.cueBall.isMoving = false;
            gameState.cueBall.visible = false;
            // Don't handle foul here - let the regular foul detection handle it
          }

          // Stop if very slow
          if (gameState.cueBall.isMoving && Math.abs(gameState.cueBall.vx) < 0.03 && Math.abs(gameState.cueBall.vy) < 0.03) {
            gameState.cueBall.vx = 0;
            gameState.cueBall.vy = 0;
            gameState.cueBall.isMoving = false;
          }
        }

        // Update other balls
        gameState.balls.forEach(ball => {
          if (!ball.visible) return;

          let nextX = ball.x + ball.vx / subSteps;
          let nextY = ball.y + ball.vy / subSteps;

          // Rail collision using felt bounds with enhanced physics
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            ball.x = FELT_LEFT + BALL_RADIUS;
            ball.vx = Math.abs(ball.vx) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            ball.spinY *= SPIN_DECAY;
            // Track rail contact for foul detection (any ball after contact)
            if (contactMade) {
              debugLog('Rail contact detected for ball:', ball.id);
              setRailContact(true);
            }
            // Track object balls hitting cushions during break
            if (gameState.gamePhase === 'break' && ball.id !== 'cue') {
              setObjectBallsHitCushions(prev => prev + 1);
            }
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            ball.x = FELT_RIGHT - BALL_RADIUS;
            ball.vx = -Math.abs(ball.vx) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            ball.spinY *= SPIN_DECAY;
            // Track rail contact for foul detection (any ball after contact)
            if (contactMade) {
              setRailContact(true);
            }
            // Track object balls hitting cushions during break
            if (gameState.gamePhase === 'break' && ball.id !== 'cue') {
              setObjectBallsHitCushions(prev => prev + 1);
            }
          } else {
            ball.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            ball.y = FELT_TOP + BALL_RADIUS;
            ball.vy = Math.abs(ball.vy) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            ball.spinX *= SPIN_DECAY;
            // Track rail contact for foul detection (any ball after contact)
            if (contactMade) {
              setRailContact(true);
            }
            // Track object balls hitting cushions during break
            if (gameState.gamePhase === 'break' && ball.id !== 'cue') {
              setObjectBallsHitCushions(prev => prev + 1);
            }
          } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
            ball.y = FELT_BOTTOM - BALL_RADIUS;
            ball.vy = -Math.abs(ball.vy) * RAIL_FRICTION * CUSHION_BOUNCE;
            // Apply spin effects on rail contact
            ball.spinX *= SPIN_DECAY;
            // Track rail contact for foul detection (any ball after contact)
            if (contactMade) {
              setRailContact(true);
            }
            // Track object balls hitting cushions during break
            if (gameState.gamePhase === 'break' && ball.id !== 'cue') {
              setObjectBallsHitCushions(prev => prev + 1);
            }
          } else {
            ball.y = nextY;
          }

          // Apply friction and spin effects
          ball.vx *= Math.pow(FRICTION, 1 / subSteps);
          ball.vy *= Math.pow(FRICTION, 1 / subSteps);
          
          // Apply spin effects to velocity
          ball.vx += ball.spinX * MAX_SPIN;
          ball.vy += ball.spinY * MAX_SPIN;
          
          // Decay spin effects
          ball.spinX *= Math.pow(SPIN_DECAY, 1 / subSteps);
          ball.spinY *= Math.pow(SPIN_DECAY, 1 / subSteps);

          // Update ball rotation based on movement
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          if (speed > 0.01) {
            // Calculate rotation speed based on linear velocity
            ball.rotationSpeed = speed / BALL_RADIUS;
            
            // Simple but effective rotation that works for all directions
            // Use the dominant velocity component to determine rotation direction
            if (Math.abs(ball.vx) > Math.abs(ball.vy)) {
              // Horizontal movement dominates - rotate based on x direction
              ball.rotation += (ball.rotationSpeed / subSteps) * Math.sign(ball.vx);
            } else {
              // Vertical movement dominates - rotate based on y direction
              ball.rotation += (ball.rotationSpeed / subSteps) * Math.sign(ball.vy);
            }
          } else {
            ball.rotationSpeed = 0;
          }

          // Pocket detection
          if (isInPocket(ball)) {
            ball.isMoving = false;
            ball.visible = false;
            ball.pocketed = true;
            // Store which pocket the ball was pocketed in
            ball.pocketedPocket = getPocketId(ball.x, ball.y);
            if (!pocketedThisFrame.includes(ball.id)) pocketedThisFrame.push(ball.id);
          }

          // Stop if very slow
          if (ball.isMoving && Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
          }
        });

        // Ball-ball collision
        if (gameState.cueBall.visible) {
          gameState.balls.forEach(ball => {
            if (ball.visible) {
              const collisionOccurred = resolveBallCollision(gameState.cueBall, ball);
              
              // Track first ball hit for foul detection - only if collision actually occurred
              if (!firstContactDetected && collisionOccurred && gameState.cueBall.isMoving) {
                debugLog('First contact made with ball:', ball.id);
                setFirstBallHit(ball.id);
                setContactMade(true);
                setFirstContactDetected(true);
              }
            }
          });
        }

        gameState.balls.forEach((ball1, i) => {
          if (!ball1.visible) return;
          gameState.balls.slice(i + 1).forEach(ball2 => {
            if (ball2.visible) {
              resolveBallCollision(ball1, ball2); // Return value not needed for ball-ball collisions
            }
          });
        });
      }

      // Check if all balls stopped
      const allStopped = gameState.balls.every(ball => !ball.isMoving) && !gameState.cueBall.isMoving;

      // Handle push out result when animation ends
      if (allStopped && pushOutResult) {
        setShowPushOutDecision(true);
        setPushOutResult(null); // Clear the result
      }

      // Check for push out fouls FIRST (only scratches are fouls during push out)
      if (allStopped && isPushOut && !foulHandled && !shotProcessed && shotPlayer === gameState.currentPlayer) {
        debugLog('=== PUSH OUT DETECTION ===');
        debugLog('isPushOut:', isPushOut);
        debugLog('allStopped:', allStopped);
        debugLog('foulHandled:', foulHandled);
        debugLog('shotProcessed:', shotProcessed);
        debugLog('shotPlayer:', shotPlayer);
        debugLog('currentPlayer:', gameState.currentPlayer);
        debugLog('cueBall visible:', gameState.cueBall.visible);
        
        // During push out, only scratches are fouls
        if (!gameState.cueBall.visible) {
          debugLog('Push out scratch foul detected');
          setFoulHandled(true);
          setShotProcessed(true);
          setIsPushOut(false); // Reset push out state after foul detection
          handleFoul('scratch');
        } else {
          // No scratch occurred, it's a legal push out
          setShotProcessed(true); // Mark shot as processed
          setIsPushOut(false); // Reset push out state after foul detection
          debugLog('Legal push out completed - NO FOULS ALLOWED');
        }
      }
      
      // Check for fouls when animation ends (regular shots only, not break shots or push outs)
      // Only check for fouls if the current player is the one who took the shot
      // Also skip if this is a break shot (to prevent break shot from being treated as regular shot)
      if (allStopped && !isPushOut && gameState.gamePhase !== 'break' && !foulHandled && !shotProcessed && shotPlayer === gameState.currentPlayer && shotPlayer !== null && !isBreakShot) {
        // Regular foul detection (not push out)
        debugLog('=== REGULAR FOUL DETECTION ===');
        debugLog('isPushOut:', isPushOut);
        debugLog('allStopped:', allStopped);
        debugLog('foulHandled:', foulHandled);
        debugLog('shotProcessed:', shotProcessed);
        debugLog('shotPlayer:', shotPlayer);
        debugLog('currentPlayer:', gameState.currentPlayer);
        debugLog('gamePhase:', gameState.gamePhase);
        debugLog('isBreakShot:', isBreakShot);
        debugLog('Checking for fouls - Current player:', gameState.currentPlayer, 'First ball hit:', firstBallHit);
        const foulDetected = detectFouls();
        if (foulDetected) {
          debugLog('Foul detected:', foulDetected, 'by player:', gameState.currentPlayer);
          setFoulHandled(true); // Mark foul as handled immediately
          setShotProcessed(true); // Mark shot as processed
          
          // Reset call shot for next turn (after foul detection is complete)
          setCalledBall(null);
          setCalledPocket(null);
          setIsPushOut(false); // Reset push out state after foul detection
          
          handleFoul(foulDetected); // Handle foul immediately, no setTimeout
        } else {
          // No foul detected - check for illegally pocketed balls (but not on break shots)
          if (!isBreakShot) {
            const illegallyPocketed = detectIllegallyPocketedBalls();
            
            if (illegallyPocketed.length > 0) {
              debugLog('Illegally pocketed balls detected:', illegallyPocketed.map(b => b.id));
              setIllegallyPocketedBalls(illegallyPocketed);
              setShowIllegalPocketOption(true);
              setShotProcessed(true);
              
              // Reset call shot state for next turn after illegally pocketed balls
              setCalledBall(null);
              setCalledPocket(null);
              
              return; // Don't continue with normal shot processing
            }
          }
          
          // No illegally pocketed balls - reset consecutive fouls for the player who took the shot
          debugLog('Legal shot completed - resetting consecutive fouls for player:', shotPlayer);
          setShotProcessed(true); // Mark shot as processed
          
          // Reset call shot for next turn (after illegally pocketed detection is complete)
          setCalledBall(null);
          setCalledPocket(null);
          setIsPushOut(false); // Reset push out state after foul detection
          setConsecutiveFouls(prev => {
            debugLog('Previous consecutive fouls:', prev);
            const newFouls = {
              ...prev,
              [shotPlayer]: 0 // Only reset the fouls for the player who made the legal shot
            };
            debugLog(`Resetting fouls for player ${shotPlayer} only. Player 1 fouls: ${newFouls[1]}, Player 2 fouls: ${newFouls[2]}`);
            debugLog('New consecutive fouls:', newFouls);
            return newFouls;
          });
          
          // Check if any ball was pocketed during this shot
          const ballsPocketedThisShot = gameState.balls.filter(ball => 
            ball.pocketed && !ball.wasPocketedBeforeShot
          );
          
          // If no ball was pocketed AND no foul occurred, switch players (player missed)
          if (ballsPocketedThisShot.length === 0) {
            debugLog('No ball pocketed - switching players');
      setGameState(prev => ({
        ...prev,
              currentPlayer: prev.currentPlayer === 1 ? 2 : 1
            }));
          }
          // If ball was pocketed, player continues shooting
          // If foul occurred, player switching is handled in handleFoul function
        }
      }

      // Check for break shot fouls (CSI 10-Ball rules)
      if (allStopped && isBreakShot && !foulHandled && !shotProcessed) {
        // Mark shot as processed immediately to prevent multiple executions
        setShotProcessed(true);
        setIsBreakShot(false); // Reset break shot flag
        
        const breakFoulDetected = detectFouls();
        if (breakFoulDetected) {
          debugLog('Break foul detected:', breakFoulDetected, 'by player:', gameState.currentPlayer);
          setFoulHandled(true);
          handleFoul(breakFoulDetected);
        } else {
          // No break foul - legal break shot (no call shot required on break)
          const ballsPocketedThisShot = gameState.balls.filter(ball => 
            ball.pocketed && !ball.wasPocketedBeforeShot
          );
          
          if (ballsPocketedThisShot.length === 0) {
            // Switch players if no ball was pocketed on break
            setGameState(prev => ({
              ...prev,
              currentPlayer: prev.currentPlayer === 1 ? 2 : 1
            }));
          }
          // If ball was pocketed, player continues shooting
        }
      }

      // Check if 10-ball was legally pocketed (game win condition)
      const tenBallPocketed = gameState.balls.find(ball => ball.id === 10 && ball.pocketed);
      
      // Check if 10-ball is now the lowest numbered ball on the table (target)
      const visibleBalls = gameState.balls.filter(ball => ball.visible && !ball.pocketed);
      const lowestVisibleBall = visibleBalls.length > 0 ? visibleBalls.reduce((lowest, ball) => ball.id < lowest.id ? ball : lowest) : null;
      
      // Trigger 10-ball target tip if it's now the lowest ball
      if (allStopped && lowestVisibleBall && lowestVisibleBall.id === 10) {
        window.dispatchEvent(new CustomEvent('tenBallTarget', { detail: { player: gameState.currentPlayer } }));
      }
      
      // Trigger lowest ball reminder if balls have stopped and we have a lowest ball
      if (allStopped && lowestVisibleBall && isPlay(gameState.gamePhase)) {
        window.dispatchEvent(new CustomEvent('lowestBall', { detail: { player: gameState.currentPlayer, lowestBall: lowestVisibleBall.id } }));
      }
      
      // Trigger safety opportunity tip occasionally (random chance)
      if (allStopped && isPlay(gameState.gamePhase) && Math.random() < 0.1) { // 10% chance
        window.dispatchEvent(new CustomEvent('safetyOpportunity', { detail: { player: gameState.currentPlayer } }));
      }
      
      if (allStopped && tenBallPocketed) {
        // Check if 10-ball was legally called (CSI 10-ball rules)
        const wasTenBallCalled = calledBall === 10;
        const wasCalledPocketCorrect = calledPocket && tenBallPocketed.pocketedPocket === calledPocket;
        
        if (wasTenBallCalled && wasCalledPocketCorrect) {
          // 10-ball was legally called and pocketed - GAME WON!
          const winner = shotPlayer;
          debugLog(`Game won by Player ${winner}! 10-ball was legally called and pocketed.`);
          
          // Call the parent's handleGameEnd function to update score
          if (onGameEnd) {
            onGameEnd(winner);
          }
          
          // Dispatch game winning event for tip system
          window.dispatchEvent(new CustomEvent('gameWinning', { detail: { player: winner } }));
          
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              balls: initializeBalls(),
              cueBall: { x: 100, y: 150, originalX: 100, originalY: 150, vx: 0, vy: 0, visible: true, isMoving: false },
              isAnimating: false,
              gamePhase: 'break',
              ballInHand: false,
              scratchOccurred: false
            }));
            setIsDragging(false);
      setShowAimLine(true);
            
            // Reset foul counters for new game
            debugLog('Resetting foul counters after game win');
            setConsecutiveFouls({ 1: 0, 2: 0 });
            
            // Force a re-render by updating game state
            setGameState(prev => ({
              ...prev,
              _foulReset: Date.now() // Add a timestamp to force re-render
            }));
            
            // Reset contextual tips for new game
            if (window.tipManager && window.tipManager.resetTips) {
              window.tipManager.resetTips();
            }
          }, 2000); // 2 second delay to show the win
        } else {
          // 10-ball was illegally pocketed - spot it on the foot spot and continue
          debugLog('10-ball illegally pocketed - spotting it on the foot spot');
          
          // Spot the 10-ball back on the table at the foot spot
          setGameState(prev => ({
            ...prev,
            balls: prev.balls.map(ball => 
              ball.id === 10 ? { 
                ...ball, 
                pocketed: false, 
                visible: true, 
                x: FOOT_SPOT_X,
                y: FOOT_SPOT_Y,
                vx: 0,
                vy: 0,
                isMoving: false
              } : ball
            )
          }));
          
          // Check if the called ball was made
          const calledBallPocketed = gameState.balls.find(ball => 
            ball.id === calledBall && ball.pocketed && !ball.wasPocketedBeforeShot
          );
          
          if (calledBallPocketed && calledBallPocketed.pocketedPocket === calledPocket) {
            // Called ball was made - player continues shooting
            debugLog('Called ball was made - player continues shooting');
            // No player change needed
          } else {
            // Called ball was not made - switch players
            debugLog('Called ball was not made - switching players');
            setGameState(prev => ({
              ...prev,
              currentPlayer: prev.currentPlayer === 1 ? 2 : 1
            }));
          }
          
          // Reset call shot state for next turn
          setCalledBall(null);
          setCalledPocket(null);
        }
      }

      // Check if game phase is changing from 'break' to 'play'
      const wasBreakPhase = isBreak(gameState.gamePhase);
      debugLog('Step function - wasBreakPhase:', wasBreakPhase, 'allStopped:', allStopped, 'gamePhase:', gameState.gamePhase);
      
      setGameState(prev => ({
        ...prev,
        isAnimating: !allStopped,
        gamePhase: nextPhaseAfterShot(prev.gamePhase, allStopped)
      }));
      
      // Trigger push out tip when transitioning from break to play phase
      if (shouldEnablePushOut(gameState.gamePhase, allStopped)) {
        debugLog('Setting pushOutAvailable to true');
        setPushOutAvailable(true);
        setFirstShotAfterBreak(false); // Reset for new break
        
        // Trigger push out strategy tip after legal break
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('pushOutStrategy', { detail: { player: gameState.currentPlayer } }));
        }, 500);
        
        // Trigger push out opportunity tip
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('pushOutAvailable', { detail: { player: gameState.currentPlayer } }));
        }, 1000);
      }

      // Continue animation if any balls moving
      if (!allStopped) {
        animationFrame.current = requestAnimationFrame(step);
      }
    }

    animationFrame.current = requestAnimationFrame(step);
  }, [gameState, isInPocket, resolveBallCollision, firstBallHit, isPushOut, detectFouls, handleFoul, pushOutResult, foulHandled, shotPlayer, shotProcessed, detectIllegallyPocketedBalls, isBreakShot]);
  
  const handleShoot = useCallback(() => {
    if (gameState.isAnimating || !aimLocked) return;
    
    // Check if call shot is required (CSI rules)
    // No call shot required on break shot or push out
    if (isBreak(gameState.gamePhase)) {
      // Break shot - no call shot required
    } else if (isPushOut) {
      // Push out - no call shot required
    } else if (!calledBall && !calledPocket) {
      // Enter call shot mode on main table instead of modal
      setIsCallShotMode(true);
      setAimLocked(false); // Unlock aim for call shot selection
      return;
    }
    
    // Execute shot
    const cueBall = gameState.cueBall;
    const speed = power * 18; // Increased power for more dynamic shots
    
    // Calculate English (spin) effects
    const englishRadians = (englishDirection * Math.PI) / 180;
    const spinX = Math.cos(englishRadians) * english * MAX_SPIN * speed * 0.05; // Reduced from 0.1 to 0.05
    const spinY = Math.sin(englishRadians) * english * MAX_SPIN * speed * 0.05; // Reduced from 0.1 to 0.05
    
    // Reset foul detection states for new shot
    setFirstBallHit(null);
    setRailContact(false);
    setFoulType(null);
    setFoulHandled(false);
    setContactMade(false);
    setFirstContactDetected(false);
    setShotProcessed(false); // Reset shot processed flag
    setShotPlayer(gameState.currentPlayer); // Track which player is taking this shot
    setObjectBallsHitCushions(0); // Reset object balls hit cushions counter
    
    // Store the lowest numbered ball at the start of the shot for foul detection
    const visibleBalls = gameState.balls.filter(ball => ball.visible && !ball.pocketed);
    const lowestBallAtStart = visibleBalls.length > 0 ? visibleBalls.reduce((lowest, ball) => ball.id < lowest.id ? ball : lowest) : null;
    setLowestNumberedBall(lowestBallAtStart);
    
    // Mark all currently pocketed balls as "pocketed before this shot"
    setGameState(prev => ({
      ...prev,
      balls: prev.balls.map(ball => ({
        ...ball,
        wasPocketedBeforeShot: ball.pocketed
      }))
    }));
    
    setGameState(prev => ({
      ...prev,
      cueBall: {
        ...prev.cueBall,
        vx: Math.cos(aimAngle) * speed,
        vy: Math.sin(aimAngle) * speed,
        isMoving: true,
        spinX: spinX, // Apply English spin effects
        spinY: spinY
      },
      isAnimating: true,
      ballInHand: false, // End ball-in-hand mode when taking a shot
      gamePhase: prev.gamePhase // Don't change phase here - let animation step handle it
    }));
    
    // Trigger call pocket reminder when transitioning from break to play
    if (isBreak(gameState.gamePhase)) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('callPocket', { detail: { player: gameState.currentPlayer } }));
      }, 500);
    }
    
    // Mark this as a break shot
    if (isBreak(gameState.gamePhase)) {
      setIsBreakShot(true);
    }
    
    // Reset aiming state and auto-unlock for next shot
    setAimLocked(false);
    setShowAimLine(true); // Show aim line again for next shot
    setGhostBall(null);
    setTargetBall(null);
    setHighlightedPocket(null);
    
    // Handle push out result
    if (isPushOut) {
      setPushOutResult({
        ballsPocketed: gameState.balls.filter(ball => ball.pocketed).length,
        cueBallPosition: { x: gameState.cueBall.x, y: gameState.cueBall.y },
        player: gameState.currentPlayer
      });
    }
    
    // Don't reset call shot yet - wait until after foul detection
    // Don't reset isPushOut yet - wait until after foul detection
    setIsCallShotMode(false); // Exit call shot mode
    
    // Disable push out after first shot after break (but not on the break shot itself)
    if (pushOutAvailable && !firstShotAfterBreak && gameState.gamePhase !== 'break') {
      setFirstShotAfterBreak(true);
      setPushOutAvailable(false);
    }
    
    // Also disable push out if it was used in this shot
    if (isPushOut) {
      setPushOutAvailable(false);
      setFirstShotAfterBreak(true);
    }
  }, [gameState.isAnimating, aimLocked, gameState.cueBall, power, aimAngle, isPushOut, calledBall, calledPocket, gameState.gamePhase, pushOutAvailable, firstShotAfterBreak]);
  
  // Beginner-friendly mouse aiming system
  const handlePointerDown = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    // Track right mouse button for fine-tuning mode
    if (e.button === 2) { // Right mouse button
      setFineTuningMode(true);
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Compute scale dynamically based on rendered size vs canvas size
    const scale = rect.width / TABLE_WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if click is within table bounds
    const isOnTable = x >= 0 && x <= TABLE_WIDTH && y >= 0 && y <= TABLE_HEIGHT;
    
    if (isOnTable) {

      
      // Handle call shot mode clicks
      if (isCallShotMode) {
        // Check if clicking on push out checkbox
        if (isPlay(gameState.gamePhase) && pushOutAvailable) {
          debugLog('Push out checkbox clicked, current isPushOut:', isPushOut);
          if (isPushOutCheckboxClick(x, y)) {
            setIsPushOut(!isPushOut);
            return;
          }
        }
        
        // Check if clicking on action buttons
        if ((calledBall && calledPocket) || isPushOut) {
          // Check Confirm button
          if (x >= TABLE_WIDTH / 2 - 80 && x <= TABLE_WIDTH / 2 - 10 && 
              y >= TABLE_HEIGHT - 30 && y <= TABLE_HEIGHT - 5) {
            setIsCallShotMode(false);
            setAimLocked(true); // Re-lock aim for shot
            return;
          }
          // Check Cancel button
          if (x >= TABLE_WIDTH / 2 + 10 && x <= TABLE_WIDTH / 2 + 80 && 
              y >= TABLE_HEIGHT - 30 && y <= TABLE_HEIGHT - 5) {
            setIsCallShotMode(false);
            setCalledBall(null);
            setCalledPocket(null);
            setIsPushOut(false);
            setAimLocked(true); // Re-lock aim for shot
            return;
          }
        }
        
        // Check if clicking on a ball or pocket
        const clickedBall = gameState.balls.find(ball => 
          ball.visible && !ball.pocketed && 
          Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2) < BALL_RADIUS
        );
        
        const clickedPocket = pocketPositions.find(pocket => 
          Math.sqrt((x - pocket.x) ** 2 + (y - pocket.y) ** 2) < 50
        );
        
        if (clickedBall || clickedPocket) {
          // Handle ball and pocket selection
          handleCallShotClick(e);
          return;
        } else {
          // Clicked on empty table - exit call shot mode and unlock aim
          setIsCallShotMode(false);
          setCalledBall(null);
          setCalledPocket(null);
          setAimLocked(false);
          return;
        }
      }
      
      // If ball-in-hand OR during break phase, allow cue ball dragging
      if (gameState.ballInHand || isBreak(gameState.gamePhase)) {
        if (isClickOnCueBall(x, y)) {
          startDraggingCueBall(x, y);
          return;
        }
      }
      
      // Toggle aim lock: click to lock/unlock aim
      const newAimLocked = !aimLocked;
      setAimLocked(newAimLocked);
      
      // If aim is being locked and we're not in break phase, automatically enter call shot mode
      if (newAimLocked && !isBreak(gameState.gamePhase) && !isPushOut) {
        setIsCallShotMode(true);
      }
      
      // If aim is being unlocked, exit call shot mode to allow re-aiming
      if (!newAimLocked) {
        setIsCallShotMode(false);
        setCalledBall(null);
        setCalledPocket(null);
      }
    }
  }, [gameState.isAnimating, gameState.ballInHand, gameState.gamePhase, isClickOnCueBall, startDraggingCueBall, aimLocked, isCallShotMode, calledBall, calledPocket, handleCallShotClick, pushOutAvailable, isPushOut]);
  
  const handlePointerUp = useCallback((e) => {
    // Stop dragging cue ball if active
    if (isDraggingCueBall) {
      stopDraggingCueBall();
    }
    
    // Handle right mouse button release
    if (e.button === 2) { // Right mouse button
      setFineTuningMode(false);
      
      // Lock aim when releasing right-click if we were in fine-tuning mode
      if (!aimLocked && !gameState.isAnimating) {
        setAimLocked(true);
        
        // If we're not in break phase, automatically enter call shot mode
        if (gameState.gamePhase !== 'break' && !isPushOut) {
          setIsCallShotMode(true);
        }
      }
    }
  }, [isDraggingCueBall, stopDraggingCueBall, aimLocked, gameState.isAnimating, gameState.gamePhase, isPushOut]);
  
  const handlePointerMove = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Compute scale dynamically based on rendered size vs canvas size
    const scale = rect.width / TABLE_WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Update cue ball position if dragging
    if (isDraggingCueBall) {
      updateCueBallPosition(x, y);
      return;
    }
    
    // Update mouse aiming
    // If aim is locked, allow micro-nudges only when in call-shot mode AND Alt is held
    if (aimLocked && !(isCallShotMode && (altNudgeActive || e.altKey))) return;
    
    // Simple, direct aiming - no smoothing or complex calculations
    // Use the CURRENT cue ball position for aiming
    const currentCueBall = {
      x: gameState.cueBall.x,
      y: gameState.cueBall.y
    };
    
    // Clamp cue ball position to table boundaries to prevent aim line issues
    const clampedCueBall = {
      x: Math.max(30, Math.min(570, currentCueBall.x)),
      y: Math.max(24, Math.min(270, currentCueBall.y))
    };
    
    // Calculate base aim angle
    const baseAngle = Math.atan2(y - clampedCueBall.y, x - clampedCueBall.x);
    
    // Check if we're aiming near a ball for fine-tuning
    let isNearBall = false;
    let nearestBall = null;
    let nearestDistance = Infinity;
    let isRailFirstShot = false;
    
    // Check if this might be a rail-first shot (aiming towards rails)
    const railProximity = 50; // Distance from rails to consider rail-first
    const isNearBottomRail = clampedCueBall.y > TABLE_HEIGHT - railProximity;
    const isNearTopRail = clampedCueBall.y < railProximity;
    const isNearLeftRail = clampedCueBall.x < railProximity;
    const isNearRightRail = clampedCueBall.x > TABLE_WIDTH - railProximity;
    
    if (isNearBottomRail || isNearTopRail || isNearLeftRail || isNearRightRail) {
      isRailFirstShot = true;
    }
    
    // Simple ball proximity detection
    gameState.balls.forEach(ball => {
      if (ball.visible && !ball.pocketed) {
        // Calculate distance from cue ball to ball center
        const dx = ball.x - clampedCueBall.x;
        const dy = ball.y - clampedCueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle to ball
        const angleToBall = Math.atan2(dy, dx);
        const angleDiff = Math.abs(baseAngle - angleToBall);
        
        // Simple detection - if aiming within 15 degrees of a ball
        if (angleDiff < 0.25) { // ~15 degrees
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestBall = ball;
            isNearBall = true;
          }
        }
      }
    });
    
    // Enhanced precision adjustment
    let finalAngle = baseAngle;
    
    if (fineTuningMode) {
      // Ultra-fine tuning mode with much more granular control
      const distanceToMouse = Math.sqrt((x - clampedCueBall.x) ** 2 + (y - clampedCueBall.y) ** 2);
      
      // Much more sensitive for micro-movements
      let sensitivity = 0.00002; // 4x more sensitive than before
      
      // If aiming near a ball, make it even more sensitive for precise contact point control
      if (isNearBall && nearestBall) {
        const distanceToBall = Math.sqrt((nearestBall.x - clampedCueBall.x) ** 2 + (nearestBall.y - clampedCueBall.y) ** 2);
        // Make sensitivity inversely proportional to distance - closer balls get more sensitive control
        sensitivity = 0.00001 * (distanceToBall / 100);
      }
      
      const centerX = clampedCueBall.x;
      const centerY = clampedCueBall.y;
      const mouseOffsetX = (x - centerX) * sensitivity;
      const mouseOffsetY = (y - centerY) * sensitivity;
      finalAngle = Math.atan2(mouseOffsetY, mouseOffsetX);
    } else if (isNearBall) {
      // When near a ball, use reduced sensitivity for more precise control
      const sensitivity = 0.25; // 2x more sensitive than before
      const centerX = clampedCueBall.x;
      const centerY = clampedCueBall.y;
      const mouseOffsetX = (x - centerX) * sensitivity;
      const mouseOffsetY = (y - centerY) * sensitivity;
      finalAngle = Math.atan2(mouseOffsetY, mouseOffsetX);
    } else {
      // Normal precision for general aiming
      const normalRadians = (0.9 * Math.PI) / 180; // 2x more precise than before
      finalAngle = Math.round(baseAngle / normalRadians) * normalRadians;
    }
    
    // If we are nudging while locked, cap change per move to a tiny step
    if (aimLocked && isCallShotMode && (altNudgeActive || e.altKey)) {
      const delta = shortestAngleDelta(finalAngle, lastAimAngle);
      const maxStep = 0.001; // ~0.06° per move (3x more precise)
      const clamped = Math.max(-maxStep, Math.min(maxStep, delta));
      finalAngle = lastAimAngle + clamped;
    }

    // Apply deadzone to prevent tiny movements from causing jumps
    const angleDiff = Math.abs(shortestAngleDelta(finalAngle, lastAimAngle));
    const deadzone = 0.0002; // 4x smaller deadzone for more responsiveness
    
    if (angleDiff > deadzone || !fineTuningMode) {
      setAimAngle(finalAngle);
      setLastAimAngle(finalAngle);
    }
    // If angle change is too small and we're in fine-tuning mode, keep the previous angle
    
    // Update ghost ball and target ball for aim line display
    if (isNearBall && nearestBall) {
      const ghostBallPos = calculateGhostBall(nearestBall.x, nearestBall.y, clampedCueBall.x, clampedCueBall.y);
      setGhostBall(ghostBallPos);
      setTargetBall(nearestBall);
    } else {
      setGhostBall(null);
      setTargetBall(null);
    }
  }, [gameState.isAnimating, isDraggingCueBall, updateCueBallPosition, gameState.cueBall, gameState.balls, calculateGhostBall, aimLocked, isCallShotMode]);
  
  const handlePointerLeave = useCallback(() => {
    // Keep aim locked when pointer leaves table
  }, []);
  
  // Touch-specific handlers for better mobile support

  
  const handleResetAim = useCallback(() => {
    setShowAimLine(true);
    setPower(0.5);
    setEnglish(0);
    setEnglishDirection(0);
    setHighlightedPocket(null);
    setAimLocked(false);
  }, []);
  
  // Calculate default aim angle toward the lowest numbered ball
  const getDefaultAimAngle = useCallback(() => {
    const cueBall = gameState.cueBall;
    let lowestBall = null;
    let lowestNumber = Infinity;
    
    gameState.balls.forEach(ball => {
      if (ball.visible && !ball.pocketed && ball.id < lowestNumber) {
        lowestNumber = ball.id;
        lowestBall = ball;
      }
    });
    
    if (lowestBall) {
      return Math.atan2(lowestBall.y - cueBall.y, lowestBall.x - cueBall.x);
    }
    
    // Fallback: aim toward center of table
    return Math.atan2(TABLE_HEIGHT / 2 - cueBall.y, TABLE_WIDTH / 2 - cueBall.x);
  }, [gameState.cueBall, gameState.balls]);
  
  // Initialize game
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      balls: initializeBalls()
    }));
  }, [initializeBalls]);
  
  // Set default aim angle when game starts - DISABLED to prevent interference with mouse aiming
  // useEffect(() => {
  //   if (!gameState.isAnimating && gameState.balls.length > 0) {
  //     const defaultAngle = getDefaultAimAngle();
  //     setAimAngle(defaultAngle);
  //     setShowAimLine(true);
  //   }
  // }, [gameState.isAnimating, gameState.balls.length, getDefaultAimAngle]);
  
  // Physics animation loop
  useEffect(() => {
    if (!gameState.isAnimating) return;
    
    animateBalls();
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameState.isAnimating, animateBalls]);
  
  // Keyboard event handler for ESC key to cancel call shot mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCallShotMode) {
        setIsCallShotMode(false);
        setCalledBall(null);
        setCalledPocket(null);
        setAimLocked(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCallShotMode]);
  
  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
    // Draw table background
    if (tableImageCache.current) {
      ctx.drawImage(tableImageCache.current, 0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    } else {
      // Fallback background
      ctx.fillStyle = '#0d5c0d';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    }
    
    // Draw Front Range Pool League logo on table (matching simulation style)
    if (logoImageCache.current) {
      ctx.save();
      ctx.globalAlpha = 0.25; // Match simulation opacity
      
      // Position logo in center of table (30.5% width like simulation)
      const logoWidth = TABLE_WIDTH * 0.305;
      const logoHeight = logoWidth * (logoImageCache.current.height / logoImageCache.current.width);
      const logoX = (TABLE_WIDTH - logoWidth) / 2;
      const logoY = (TABLE_HEIGHT - logoHeight) / 2;
      
      // Add drop shadow effect like simulation
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      
      ctx.drawImage(logoImageCache.current, logoX, logoY, logoWidth, logoHeight);
      ctx.restore();
    }
    
    // Draw kitchen area (only for break shots, not for regular ball-in-hand)
    if (isBreak(gameState.gamePhase) && !gameState.isAnimating) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      
      // Draw kitchen boundary
      ctx.strokeRect(KITCHEN_LEFT, KITCHEN_TOP, KITCHEN_RIGHT - KITCHEN_LEFT, KITCHEN_BOTTOM - KITCHEN_TOP);
      
      // Add text label
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.font = '12px Arial';
      ctx.fillText('KITCHEN', KITCHEN_LEFT + 10, KITCHEN_TOP + 20);
      
      ctx.restore();
    }
    

    
   // Do not draw overlay pocket circles; the table image already has pockets
   // (pocket visuals were removed to restore original pool table look)
    
    // Draw balls with enhanced visual effects
    const drawBall = (ball, imageSrc) => {
      if (!imageCache.current[imageSrc]) {
        const img = new Image();
        img.onload = () => {
          imageCache.current[imageSrc] = img;
          drawBall(ball, imageSrc);
        };
        img.src = imageSrc;
      } else {
        const img = imageCache.current[imageSrc];
        ctx.save();
        
        // Apply rotation transformation
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.rotation || 0);
        
        // Add shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw the ball with rotation
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, -BALL_RADIUS, -BALL_RADIUS, BALL_SIZE, BALL_SIZE);
        
        // Add highlight for realism
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, BALL_RADIUS * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
      }
    };
    
    // Draw other balls
    gameState.balls.forEach(ball => {
      if (ball.visible && !ball.pocketed) {
        drawBall(ball, ballImages[ball.id]);
      }
    });
    
    // Ghost ball drawing completely removed
    
    // Draw simple aim line that follows mouse exactly - DISABLED
    if (false && showAimLine && !gameState.isAnimating) {
       const cueBall = gameState.cueBall;
      const currentAngle = aimAngle;
      

      
      // Draw simple aim line from cue ball in direction of mouse
          ctx.save();
      let lineColor = 'rgba(255, 255, 255, 0.95)'; // Bright white
      if (aimLocked) {
        lineColor = 'rgba(0, 255, 0, 0.95)'; // Bright green when locked
      }
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = aimLocked ? 4 : 3;
      ctx.setLineDash([]); // Solid line
      
      // Draw aim line from cue ball with length based on power
      const baseSpeed = power * 18;
      const friction = 0.9905; // sync with preview tweaks
      const subSteps = 20;
      
      // Calculate how far the cue ball will travel before stopping
      let distance = 0;
      let currentSpeed = baseSpeed;
      let currentX = cueBall.x;
      let currentY = cueBall.y;
      
      // Simulate cue ball travel until it hits a ball or stops (including rail bounces)
      let travelAngle = aimAngle;
      while (currentSpeed > 0.03) {
        const stepDistance = currentSpeed / subSteps;
        distance += stepDistance;
        let nextX = currentX + Math.cos(travelAngle) * stepDistance;
        let nextY = currentY + Math.sin(travelAngle) * stepDistance;
        currentSpeed *= Math.pow(friction, 1 / subSteps);
        
        // Check for rail bounces
        let bounced = false;
        if (nextX < 30) {
          nextX = 30;
          travelAngle = Math.PI - travelAngle; // Reflect off left rail
          currentSpeed *= 0.85; // Rail absorbs some energy
          bounced = true;
        } else if (nextX > 570) {
          nextX = 570;
          travelAngle = Math.PI - travelAngle; // Reflect off right rail
          currentSpeed *= 0.85;
          bounced = true;
        }
        
        if (nextY < 24) {
          nextY = 24;
          travelAngle = -travelAngle; // Reflect off top rail
          currentSpeed *= 0.85;
          bounced = true;
        } else if (nextY > 270) {
          nextY = 270;
          travelAngle = -travelAngle; // Reflect off bottom rail
          currentSpeed *= 0.85;
          bounced = true;
        }
        
        currentX = nextX;
        currentY = nextY;
        
        // Stop if we hit a ball
        const hitBall = gameState.balls.find(ball => {
          if (!ball.visible || ball.pocketed) return false;
          const ballDist = Math.hypot(currentX - ball.x, currentY - ball.y);
          return ballDist < BALL_SIZE;
        });
        
        if (hitBall) {
          break;
        }
      }
      
      // Calculate end point based on travel distance
      const endX = currentX;
      const endY = currentY;
      
              ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
              ctx.restore();
            }
            
    // Draw multi-ball trajectory predictions (separate from aim line)
    if (showAimLine && !gameState.isAnimating) {
      // Use current cue ball position, but ensure it's within table boundaries
      const currentCueBall = {
        x: Math.max(30, Math.min(570, gameState.cueBall.x)),
        y: Math.max(24, Math.min(270, gameState.cueBall.y))
      };
      const currentAngle = aimAngle;
      
      // Debug: Log the positions being used (commented out to reduce console clutter)
      // console.log(`Trajectory - Mouse angle: ${currentAngle} | Cue ball: ${currentCueBall.x}, ${currentCueBall.y} | Game state cue ball: ${gameState.cueBall.x}, ${gameState.cueBall.y}`);
       
       // Calculate initial velocity based on power and English
      const baseSpeed = power * 18;
      const startVx = Math.cos(currentAngle) * baseSpeed;
      const startVy = Math.sin(currentAngle) * baseSpeed;
      
             // Add English effects to trajectory prediction
       const englishRadians = (englishDirection * Math.PI) / 180;
       const spinX = Math.cos(englishRadians) * english * MAX_SPIN * baseSpeed * 0.05; // Reduced from 0.1 to 0.05
       const spinY = Math.sin(englishRadians) * english * MAX_SPIN * baseSpeed * 0.05; // Reduced from 0.1 to 0.05
       
             // Predict all ball trajectories using current cue ball position with English
      const allTrajectories = predictAllBallTrajectories(startVx + spinX, startVy + spinY, currentCueBall, { ignoreCuePocket: true });
      
      // Debug: Log positions to check for discrepancies
      if (allTrajectories['cue'] && allTrajectories['cue'].points.length > 1) {
        const firstCollision = allTrajectories['cue'].points.find(p => p.collision);
        if (firstCollision) {
          debugLog('Trajectory collision at:', firstCollision.x.toFixed(2), firstCollision.y.toFixed(2));
          const lowestBall = gameState.balls.find(ball => ball.visible && !ball.pocketed && ball.id === 1);
          if (lowestBall) {
            debugLog('Actual ball 1 position:', lowestBall.x.toFixed(2), lowestBall.y.toFixed(2));
          }
        }
      }
       
       // Draw each ball's trajectory (only show significant ones)
       Object.entries(allTrajectories).forEach(([ballId, trajectory]) => {
         // Require fewer points for cue so aim line remains visible even very close to pockets
         const minPoints = ballId === 'cue' ? 1 : 3;
         if (trajectory.points.length > minPoints) {
              ctx.save();
           
           // Special handling for cue ball trajectory - show full trajectory as the aim line
           if (ballId === 'cue') {
             renderCueAimStyle(ctx);
           } else {
             // Object ball trajectories
             ctx.strokeStyle = trajectory.color;
             ctx.lineWidth = 2; // Keep lines thin but visible
             ctx.globalAlpha = 0.7; // Only set opacity for object balls, not cue ball
           }
           
          // Draw path; for cue, ensure a minimum visible length
          if (ballId === 'cue') {
            const pts = trajectory.points;
            const first = pts[0];
            const last = pts[pts.length - 1] || first;
            const segLen = Math.hypot((last.x - first.x), (last.y - first.y));
            const minVisible = 20; // px, smaller threshold so it adapts more often
            if (segLen < minVisible) {
              // Extend along currentAngle so the player always sees a clear aim line
              const fallbackLen = computeFallbackAimLength(power);
              ctx.beginPath();
              ctx.moveTo(first.x, first.y);
              ctx.lineTo(first.x + Math.cos(currentAngle) * fallbackLen,
                         first.y + Math.sin(currentAngle) * fallbackLen);
              ctx.stroke();
            } else {
              renderTrajectoryPath(ctx, pts);
            }
          } else {
            renderTrajectoryPath(ctx, trajectory.points);
          }
          ctx.restore();
            
          // Draw collision indicators (only for significant collisions)
           for (let i = 1; i < trajectory.points.length; i++) {
             const point = trajectory.points[i];
             if (point.collision) {
               ctx.save();
               ctx.fillStyle = trajectory.color;
               ctx.globalAlpha = 0.6;
               ctx.beginPath();
               ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
              ctx.fill();
               ctx.restore();
             }
            
             // Draw pocket indicators
            if (point.pocketed) {
              ctx.save();
              ctx.fillStyle = '#00ff00';
              ctx.globalAlpha = 0.8;
              ctx.beginPath();
               ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.restore();
              break;
            }
          }
          } else if (ballId === 'cue') {
            // Fallback: always render an aim line so user keeps feedback near side pockets
            ctx.save();
            renderCueAimStyle(ctx);
            const start = trajectory.points[0];
            const fallbackLen = computeFallbackAimLength(power);
            const endX = start.x + Math.cos(currentAngle) * fallbackLen;
            const endY = start.y + Math.sin(currentAngle) * fallbackLen;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
          }
       });
     }
      
      // Note: the cue aim line is drawn via the cue trajectory above.
      // We no longer force a global top-layer line to avoid doubling/mismatch.
          
     // Removed static aim line - using dynamic trajectory prediction instead
         
    // Draw highlighted pocket
    if (highlightedPocket && !gameState.isAnimating) {
          ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
          
      // Draw highlighted pocket outline
            ctx.beginPath();
      ctx.arc(highlightedPocket.x, highlightedPocket.y, 25, 0, 2 * Math.PI);
               ctx.stroke();
      
          ctx.restore();
        }
        
    // Draw pocket drop-radius ring (nearest pocket only) that matches real physics
    // Only show when not animating and aim is unlocked
    if (!gameState.isAnimating && !aimLocked) {
      const FELT_LEFT = 30.0;
      const FELT_RIGHT = 570.77;
      const FELT_TOP = 24.5;
      const FELT_BOTTOM = 270.18;
      const midX = (FELT_LEFT + FELT_RIGHT) / 2;
      const pockets = [
        { x: FELT_LEFT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
        { x: FELT_RIGHT, y: FELT_TOP, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
        { x: FELT_LEFT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
        { x: FELT_RIGHT, y: FELT_BOTTOM, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
        { x: midX, y: FELT_TOP, margin: BALL_SIZE * SIDE_MARGIN_FACTOR },
        { x: midX, y: FELT_BOTTOM, margin: BALL_SIZE * SIDE_MARGIN_FACTOR }
      ];

      // Aim point 100px along current angle from cue ball
      const aimX = gameState.cueBall.x + Math.cos(aimAngle) * 100;
      const aimY = gameState.cueBall.y + Math.sin(aimAngle) * 100;

      // Find nearest pocket to aim point
      let nearest = null;
      let minDist = Infinity;
      pockets.forEach(p => {
        const d = Math.hypot(aimX - p.x, aimY - p.y);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      });

      if (nearest && minDist < 120) { // proximity gate
        const dropRadius = nearest.margin + POCKET_DROP_FUDGE; // physics threshold
         ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]); // solid ring for clarity
         ctx.beginPath();
        ctx.arc(nearest.x, nearest.y, dropRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // subtle center dot
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(nearest.x, nearest.y, 2, 0, 2 * Math.PI);
         ctx.fill();
                   ctx.restore();
        }
    }

    // Draw call shot mode visuals
    if (isCallShotMode && !gameState.isAnimating) {
      ctx.save();
      
      // Draw overlay (less dark for better visibility)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
      
      // Draw call shot instructions
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CALL YOUR SHOT', TABLE_WIDTH / 2, 30);
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Click a ball, then click a pocket', TABLE_WIDTH / 2, 50);
      
      // Draw selected ball indicator
      if (calledBall) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Selected Ball: ${calledBall}`, TABLE_WIDTH / 2, TABLE_HEIGHT - 60);
      }
      
      // Draw selected pocket indicator
      if (calledPocket) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Selected Pocket: ${calledPocket.replace('-', ' ')}`, TABLE_WIDTH / 2, TABLE_HEIGHT - 40);
      }
      
      // Highlight selected ball
      if (calledBall) {
        const selectedBall = gameState.balls.find(ball => ball.id === calledBall && ball.visible && !ball.pocketed);
        if (selectedBall) {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
            ctx.beginPath();
          ctx.arc(selectedBall.x, selectedBall.y, BALL_RADIUS + 5, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      
      // Highlight selected pocket
      if (calledPocket) {
        const selectedPocket = pocketPositions.find(p => p.id === calledPocket);
        if (selectedPocket) {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
         ctx.beginPath();
          ctx.arc(selectedPocket.x, selectedPocket.y, 30, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      
      // Draw push out option (only after break)
      debugLog('Draw function - gamePhase:', gameState.gamePhase, 'pushOutAvailable:', pushOutAvailable, 'isCallShotMode:', isCallShotMode);
      renderPushOutOverlay(ctx, TABLE_HEIGHT, isPushOut, pushOutAvailable, gameState.gamePhase);
      
      // Draw action buttons
      if ((calledBall && calledPocket) || isPushOut) {
        // Confirm button
        ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
        ctx.fillRect(TABLE_WIDTH / 2 - 80, TABLE_HEIGHT - 30, 70, 25);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CONFIRM', TABLE_WIDTH / 2 - 45, TABLE_HEIGHT - 15);
        
        // Cancel button
        ctx.fillStyle = 'rgba(244, 67, 54, 0.9)';
        ctx.fillRect(TABLE_WIDTH / 2 + 10, TABLE_HEIGHT - 30, 70, 25);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CANCEL', TABLE_WIDTH / 2 + 45, TABLE_HEIGHT - 15);
      }
      
      ctx.restore();
      }
      
      // Draw cue ball LAST (on top of everything, without measles effect)
      if (gameState.cueBall.visible) {
        const ball = gameState.cueBall;
        const imageSrc = ballImages.cue;
        
        if (!imageCache.current[imageSrc]) {
          const img = new Image();
          img.onload = () => {
            imageCache.current[imageSrc] = img;
            draw();
          };
          img.src = imageSrc;
        } else {
          const img = imageCache.current[imageSrc];
          ctx.save();
          
          // Apply rotation transformation for cue ball
          ctx.translate(ball.x, ball.y);
          ctx.rotate(ball.rotation || 0);
          
          // Draw the cue ball with rotation
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(img, -BALL_RADIUS, -BALL_RADIUS, BALL_SIZE, BALL_SIZE);
          
          // Draw English indicator if spin is applied
          if (english !== 0 && !gameState.isAnimating) {
            ctx.restore();
            ctx.save();
            
            // Draw spin indicator ring
            ctx.strokeStyle = english > 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS + 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw direction indicator
            ctx.strokeStyle = english > 0 ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(
              ball.x + Math.cos(englishDirection * Math.PI / 180) * (BALL_RADIUS + 10),
              ball.y + Math.sin(englishDirection * Math.PI / 180) * (BALL_RADIUS + 10)
            );
            ctx.stroke();
          }
          
          ctx.restore();
        }
      }
      
      // Ensure globalAlpha is reset to full opacity at the end of drawing
      ctx.globalAlpha = 1.0;
     }, [gameState, showAimLine, aimAngle, ballImages, power, highlightedPocket, aimLocked, predictAllBallTrajectories, isCallShotMode, calledBall, calledPocket, pocketPositions, pushOutAvailable, isPushOut]);
  
  // Draw on state changes - only when necessary
  useEffect(() => {
    draw();
  }, [gameState.isAnimating, showAimLine, aimAngle, power, highlightedPocket, aimLocked, isCallShotMode, calledBall, calledPocket, pushOutAvailable, isPushOut]);
  
  // Load table image
  useEffect(() => {
    const tableImg = new Image();
    tableImg.onload = () => {
      tableImageCache.current = tableImg;
      draw();
    };
    tableImg.src = predatorTable;
  }, [draw]);
  
  // Load logo image
  useEffect(() => {
    const logoImg = new Image();
    logoImg.onload = () => {
      logoImageCache.current = logoImg;
      draw();
    };
    logoImg.src = frbcaplLogo;
  }, [draw]);
  
  // Add keyboard event listeners for fine aim mode

  

  // Track Alt key to allow micro-nudges while aim is locked (only during call-shot)
  useEffect(() => {
    const down = (e) => {
      if (e.altKey) setAltNudgeActive(true);
    };
    const up = (e) => {
      if (!e.altKey) setAltNudgeActive(false);
      if (e.key === 'Alt') setAltNudgeActive(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  
  // English control drag handlers for UI button
  const [isDraggingEnglish, setIsDraggingEnglish] = useState(false);
  
  const handleEnglishMouseDown = useCallback((event) => {
    event.preventDefault();
    setIsDraggingEnglish(true);
    console.log('English drag started');
  }, []);
  
  const handleEnglishMouseMove = useCallback((event) => {
    if (!isDraggingEnglish) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to relative coordinates (0-1)
    const relX = x / rect.width;
    const relY = y / rect.height;
    
    // Calculate distance from center
    const centerX = 0.5;
    const centerY = 0.5;
    const distance = Math.sqrt((relX - centerX) ** 2 + (relY - centerY) ** 2);
    
    // Clamp distance to ball radius
    const clampedDistance = Math.min(distance, 0.4);
    
    // Calculate English intensity based on distance from center
    const intensity = Math.min(clampedDistance / 0.4, 1);
    
    // Calculate direction from center
    const angle = Math.atan2(relY - centerY, relX - centerX);
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    
    setEnglish(intensity);
    setEnglishDirection(degrees);
    
    console.log(`English updated: ${Math.round(intensity * 100)}% at ${Math.round(degrees)}°`);
  }, [isDraggingEnglish]);
  
  const handleEnglishMouseUp = useCallback(() => {
    setIsDraggingEnglish(false);
    console.log('English drag ended');
  }, []);
  
  // Helper function to determine spin color based on direction
  const getSpinColor = useCallback((direction) => {
    // Convert direction to degrees and normalize
    const degrees = direction % 360;
    
    // Top spin: 247.5-292.5 degrees (green)
    if (degrees >= 247.5 && degrees <= 292.5) {
      return '#4CAF50';
    }
    // Back spin: 67.5-112.5 degrees (red)
    else if (degrees >= 67.5 && degrees <= 112.5) {
      return '#F44336';
    }
    // Left spin: 157.5-202.5 degrees (purple)
    else if (degrees >= 157.5 && degrees <= 202.5) {
      return '#9C27B0';
    }
    // Right spin: 337.5-22.5 degrees (orange)
    else if (degrees >= 337.5 || degrees <= 22.5) {
      return '#FF9800';
    }
    // Top-Right spin: 292.5-337.5 degrees (teal)
    else if (degrees > 292.5 && degrees < 337.5) {
      return '#00BCD4';
    }
    // Top-Left spin: 202.5-247.5 degrees (lime)
    else if (degrees > 202.5 && degrees < 247.5) {
      return '#CDDC39';
    }
    // Bottom-Right spin: 22.5-67.5 degrees (pink)
    else if (degrees > 22.5 && degrees < 67.5) {
      return '#E91E63';
    }
    // Bottom-Left spin: 112.5-157.5 degrees (amber)
    else {
      return '#FFC107';
    }
  }, []);
  
  // Helper function to get spin type text
  const getSpinType = useCallback((direction) => {
    const degrees = direction % 360;
    
    if (degrees >= 247.5 && degrees <= 292.5) {
      return 'Top Spin';
    } else if (degrees >= 67.5 && degrees <= 112.5) {
      return 'Back Spin';
    } else if (degrees >= 157.5 && degrees <= 202.5) {
      return 'Left Spin';
    } else if (degrees >= 337.5 || degrees <= 22.5) {
      return 'Right Spin';
    } else if (degrees > 292.5 && degrees < 337.5) {
      return 'Top-Right Spin';
    } else if (degrees > 202.5 && degrees < 247.5) {
      return 'Top-Left Spin';
    } else if (degrees > 22.5 && degrees < 67.5) {
      return 'Bottom-Right Spin';
    } else {
      return 'Bottom-Left Spin';
    }
  }, []);
  
  return (
    <div className={styles.simplePoolGame}>
      {/* Aiming Instructions moved above the table */}
      <div className={styles.aimingInstructions}>
        <div className={styles.instructions}>
          <strong>How To Aim:</strong><br/>
          Move mouse to aim • Click table to lock aim • Call Shot • Adjust power • Drag English ball • Click SHOOT<br/>
          <small style={{color: '#888', fontSize: '12px'}}>
            💡 <strong>Aim Line Colors:</strong> White = Aiming • Green = Locked & ready • Yellow = Fine-tuning • Green/Red = English spin • Colored = Object ball paths<br/>
            💡 <strong>Fine-tuning:</strong> Hold right-click for precise aiming, release to lock aim<br/>
            💡 <strong>English:</strong> Click and drag on the English ball to set spin direction and intensity
          </small>
        </div>
      </div>

      {canShowPushOut(gameState.gamePhase, pushOutAvailable) && (
        <div
          style={{
            alignSelf: 'center',
            margin: '8px 0 14px 0',
            padding: '6px 14px',
            background: 'rgba(255, 215, 0, 0.95)',
            color: '#000',
            fontWeight: 700,
            fontSize: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }}
        >
          Push Out Available
        </div>
      )}

      <div className={styles.tableContainer}>
                 <canvas
           ref={canvasRef}
           width={TABLE_WIDTH}
           height={TABLE_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
           className={styles.tableCanvas}
         />
      </div>
      
             <div className={styles.controls}>
         <div className={styles.powerControl}>
           <label>Power: {Math.round(power * 100)}%</label>
           <div style={{
             position: 'relative',
             width: '100%',
             height: '8px',
             background: '#ffffff',
             borderRadius: '4px',
             border: '1px solid #e0e0e0',
             overflow: 'hidden'
           }}>
             <div style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: `${power * 100}%`,
               height: '100%',
               background: '#2196F3',
               borderRadius: '3px'
             }}></div>
             <div style={{
               position: 'absolute',
               top: '-4px',
               left: `${power * 100}%`,
               width: '16px',
               height: '16px',
               background: '#2196F3',
               borderRadius: '50%',
               border: '1px solid #1976D2',
               cursor: 'pointer',
               transform: 'translateX(-50%)'
             }}></div>
           <input
             type="range"
             min="0.1"
             max="1"
             step="0.01"
             value={power}
             onChange={(e) => setPower(parseFloat(e.target.value))}
               style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 width: '100%',
                 height: '100%',
                 background: 'transparent',
                 outline: 'none',
                 cursor: 'pointer',
                 opacity: 0
               }}
             />
           </div>
         </div>
         
         <div className={styles.englishControl}>
           <label>English: Drag to set spin</label>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '10px',
             marginTop: '5px'
           }}>
             <div
               onMouseDown={handleEnglishMouseDown}
               onMouseMove={handleEnglishMouseMove}
               onMouseUp={handleEnglishMouseUp}
               onMouseLeave={handleEnglishMouseUp}
               style={{
                 width: '60px',
                 height: '60px',
                 borderRadius: '50%',
                 border: '2px solid #333',
                 background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                 position: 'relative',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 fontSize: '12px',
                 fontWeight: 'bold',
                 color: '#333',
                 cursor: isDraggingEnglish ? 'grabbing' : 'grab',
                 userSelect: 'none'
               }}
             >
               {english > 0 ? '+' : ''}{Math.round(english * 100)}%
               
               {/* Visual spin indicator */}
                              {english !== 0 && (
                 <>
                   {/* Spin dot - positioned based on direction */}
                   <div style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: `translate(-50%, -50%) translate(${Math.cos(englishDirection * Math.PI / 180) * 20}px, ${Math.sin(englishDirection * Math.PI / 180) * 20}px)`,
                     width: '8px',
                     height: '8px',
                     borderRadius: '50%',
                     background: getSpinColor(englishDirection),
                     border: '1px solid #fff'
                   }}></div>
                   
                   {/* Direction indicator line */}
                   <div style={{
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     transform: `translate(-50%, -50%) rotate(${englishDirection}deg)`,
                     width: '2px',
                     height: '20px',
                     background: getSpinColor(englishDirection),
                     borderRadius: '1px'
                   }}></div>
                 </>
               )}
               </div>
             
             {english !== 0 && (
               <div style={{
                 fontSize: '12px',
                 color: getSpinColor(englishDirection),
                 fontWeight: 'bold'
               }}>
                 {getSpinType(englishDirection)}
               </div>
             )}
             {english === 0 && (
               <div style={{
                 fontSize: '12px',
                 color: '#666'
               }}>
                 No Spin
               </div>
             )}
             
             {english !== 0 && (
               <button
                 onClick={() => {
                   setEnglish(0);
                   setEnglishDirection(0);
                 }}
                 style={{
                   fontSize: '10px',
                   padding: '2px 6px',
                   background: '#666',
                   color: 'white',
                   border: 'none',
                   borderRadius: '3px',
                   cursor: 'pointer',
                   marginLeft: '5px'
                 }}
               >
                 Reset
               </button>
             )}
             

           </div>
         </div>
         
         <div className={styles.shootButton}>
           <button 
             className={styles.shootButton}
             onClick={handleShoot}
             disabled={gameState.isAnimating || !aimLocked}
           >
             {!aimLocked ? 'LOCK AIM FIRST' : 
              gameState.gamePhase === 'break' || (calledBall && calledPocket) || isPushOut ? 'SHOOT!' : 'CALL SHOT'}
           </button>
         </div>
         

         
         <div className={styles.gameInfo}>
           <span>Player: {gameState.currentPlayer}</span>
           <span>Phase: {gameState.gamePhase}</span>
           <span>Status: {gameState.isAnimating ? 'Animating' : gameState.ballInHand || gameState.gamePhase === 'break' ? (isDraggingCueBall ? 'Drag Cue Ball to Position' : gameState.gamePhase === 'break' ? 'Click Cue Ball to Move (Kitchen Only)' : 'Click Cue Ball to Move (Anywhere)') : aimLocked ? 'Aim Locked - Ready to Shoot' : highlightedPocket ? 'Pocket assistance active - Click to lock!' : 'Move Mouse to Aim'}</span>
           {foulType && (
             <span style={{color: '#ff6b6b', fontWeight: 'bold'}}>
               FOUL: {foulType === 'scratch' ? 'Scratch' : 
                      foulType === 'wrong_ball_first' ? 'Wrong Ball First' : 
                      foulType === 'no_rail_contact' ? 'No Rail Contact' : foulType}
             </span>
           )}
           <span>Consecutive Fouls P1: {consecutiveFouls[1]} | P2: {consecutiveFouls[2]}</span>
         </div>
         
         <div className={styles.buttonRow}>
           <button 
             className={styles.resetAimButton}
             onClick={() => {
               setIsDragging(false);
               setShowAimLine(false);
               setPower(0.5);
             }}
             disabled={gameState.isAnimating}
           >
             Reset Aim
           </button>
           
           <button 
             className={styles.resetButton}
             onClick={() => {
               setGameState(prev => ({
                 ...prev,
                 balls: initializeBalls(),
                 cueBall: { x: 100, y: 150, originalX: 100, originalY: 150, vx: 0, vy: 0, visible: true, isMoving: false, rotation: 0, rotationSpeed: 0 },
                 isAnimating: false,
                 gamePhase: 'break', // Reset to break phase to show kitchen
                 ballInHand: false,
                 scratchOccurred: false,
                 currentPlayer: 1 // Reset to player 1
               }));
               setShowAimLine(true);
               setIsDraggingCueBall(false); // Reset dragging state
               setHighlightedPocket(null);
               setAimLocked(false);
               setEnglish(0);
               setEnglishDirection(0);
               // Reset push out states
               setPushOutAvailable(false);
               setFirstShotAfterBreak(false);
               setIsPushOut(false);
               setPushOutResult(null);
               setShowPushOutDecision(false);
               // Reset foul detection states
               setLowestNumberedBall(null);
               console.log('Resetting foul counters via reset button');
               setConsecutiveFouls({ 1: 0, 2: 0 });
               setFoulType(null);
               setFoulHandled(false);
               setShotProcessed(false);
               setShotPlayer(null);
               setObjectBallsHitCushions(0);
               setIllegallyPocketedBalls([]);
               setShowIllegalPocketOption(false);
               
               // Reset contextual tips for new game
               if (window.tipManager && window.tipManager.resetTips) {
                 window.tipManager.resetTips();
               }
             }}
           >
             Reset Game
           </button>
           
           <button 
             className={styles.resetButton}
             onClick={() => {
               setGameState(prev => ({
                 ...prev,
                 ballInHand: true,
                 currentPlayer: prev.currentPlayer === 1 ? 2 : 1
               }));
             }}
             style={{marginLeft: '10px', backgroundColor: '#ff6b6b'}}
           >
             Test Ball-in-Hand
           </button>
         </div>
       </div>
       
       {/* Push Out Decision Modal */}
       {showPushOutDecision && (
         <div className={styles.pushOutModal}>
           <div className={styles.pushOutContent}>
             <h3>Push Out Result</h3>
             <p>Player {gameState.currentPlayer === 1 ? 2 : 1}, do you want to accept this push out result?</p>
             <div className={styles.pushOutButtons}>
               <button 
                 onClick={() => {
                   setShowPushOutDecision(false);
                   // Accept push out - opponent shoots from current position
                   setGameState(prev => ({
                     ...prev,
                     currentPlayer: prev.currentPlayer === 1 ? 2 : 1
                   }));
                 }}
                 className={styles.acceptButton}
               >
                 Accept
               </button>
               <button 
                 onClick={() => {
                   setShowPushOutDecision(false);
                   // Decline push out - original player shoots again
                   // No player change needed
                 }}
                 className={styles.declineButton}
               >
                 Decline
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Illegally Pocketed Balls Modal */}
       {showIllegalPocketOption && (
         <div className={styles.pushOutModal}>
           <div className={styles.pushOutContent}>
             <h3>Illegally Pocketed Balls</h3>
             <p>Player {gameState.currentPlayer === 1 ? 2 : 1}, balls were illegally pocketed:</p>
             <ul>
               {illegallyPocketedBalls.map(ball => (
                 <li key={ball.id}>
                   Ball {ball.id} {ball.id === 10 ? '(will be spotted)' : '(remains pocketed)'}
                 </li>
               ))}
             </ul>
             <p>Do you want to:</p>
             <div className={styles.pushOutButtons}>
               <button 
                 onClick={() => {
                   setShowIllegalPocketOption(false);
                   // Accept table in position - opponent shoots
                   setGameState(prev => ({
                     ...prev,
                     currentPlayer: prev.currentPlayer === 1 ? 2 : 1
                   }));
                   // Spot the 10-ball if it was illegally pocketed
                   const tenBall = illegallyPocketedBalls.find(ball => ball.id === 10);
                    if (tenBall) {
                      setGameState(prev => ({
                        ...prev,
                        balls: prev.balls.map(ball => 
                          ball.id === 10 ? { ...ball, pocketed: false, visible: true, x: FOOT_SPOT_X, y: FOOT_SPOT_Y } : ball
                        )
                      }));
                    }
                   setIllegallyPocketedBalls([]);
                 }}
                 className={styles.acceptButton}
               >
                 Accept Table
               </button>
               <button 
                 onClick={() => {
                   setShowIllegalPocketOption(false);
                   // Require shooter to shoot again - no player change
                   setIllegallyPocketedBalls([]);
                 }}
                 className={styles.declineButton}
               >
                 Require Re-Shot
               </button>
             </div>
           </div>
         </div>
       )}
       


    </div>
  );
};

export default SimplePoolGame; 