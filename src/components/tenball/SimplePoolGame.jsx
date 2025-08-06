import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SimplePoolGame.module.css';

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

const SimplePoolGame = () => {
  // Remove the console.log that's causing spam
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    balls: [],
    cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false, rotation: 0, rotationSpeed: 0 },
    isAnimating: false,
    currentPlayer: 1,
    gamePhase: 'break',
    ballInHand: false,
    scratchOccurred: false
  });
  
  // Ball-in-hand dragging state
  const [isDraggingCueBall, setIsDraggingCueBall] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Beginner-friendly mouse aiming system
  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  const [showAimLine, setShowAimLine] = useState(true);
  const [ghostBall, setGhostBall] = useState(null); // Ghost ball position for aiming
  const [targetBall, setTargetBall] = useState(null); // Currently targeted ball
  const [highlightedPocket, setHighlightedPocket] = useState(null); // Pocket being aimed at
  const [aimLocked, setAimLocked] = useState(false); // Lock aim when ready to shoot
  
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
  
  // Table dimensions (from working simulation)
  const TABLE_WIDTH = 600;
  const TABLE_HEIGHT = 300;
  const BALL_SIZE = 15;
  const BALL_RADIUS = BALL_SIZE / 2;
  const PLAYFIELD_OFFSET_X = 0;
  const PLAYFIELD_OFFSET_Y = 0;
  const CORNER_MARGIN_FACTOR = 3.2; // More forgiving corner pockets for easier aiming
const SIDE_MARGIN_FACTOR = 2.5; // More forgiving side pockets - allow balls to go in
  
  // Kitchen area (behind the head string) - for break shots and ball-in-hand
  const KITCHEN_LEFT = 30;
  const KITCHEN_RIGHT = 150; // Head string position (1/4 of table width)
  const KITCHEN_TOP = 24.5;
  const KITCHEN_BOTTOM = 270.18;
  
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
  
       // Pocket positions for targeting
  const pocketPositions = [
    { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y, id: 'top-left' },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y, id: 'top-right' },
    { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-left' },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-right' },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y, id: 'top-center' },
    { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-center' }
  ];

  // Call shot mode handlers
  const handleCallShotClick = useCallback((event) => {
    if (!isCallShotMode) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
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
      Math.sqrt((pocket.x - x) ** 2 + (pocket.y - y) ** 2) < 40
    );
    
    if (clickedPocket) {
      setCalledPocket(clickedPocket.id);
      return;
    }
  }, [isCallShotMode, gameState.balls, pocketPositions]);
  
     // Get pocket ID for a given position
   const getPocketId = useCallback((x, y) => {
     const pockets = [
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y, id: 'top-left' },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y, id: 'top-right' },
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-left' },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-right' },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y, id: 'top-center' },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, id: 'bottom-center' }
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
     const pockets = [
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * CORNER_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y, margin: BALL_SIZE * SIDE_MARGIN_FACTOR },
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT, margin: BALL_SIZE * SIDE_MARGIN_FACTOR }
     ];
     const cx = ball.x;
     const cy = ball.y;
     return pockets.some(
       pocket => Math.hypot(cx - pocket.x, cy - pocket.y) < pocket.margin + BALL_RADIUS * 1.2
     );
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
    console.log('Visible balls on table:', visibleBalls.map(b => b.id).sort((a, b) => a - b));
    if (visibleBalls.length === 0) return null;
    const lowest = visibleBalls.reduce((lowest, ball) => ball.id < lowest.id ? ball : lowest);
    console.log('Lowest numbered ball:', lowest.id);
    return lowest;
  }, [gameState.balls]);

  // Foul detection functions
  const detectFouls = useCallback(() => {
    if (isPushOut) {
      // Only scratch is a foul during push out
      return null;
    }

    // Use the lowest ball that was on the table at the start of the shot
    const currentLowestBall = lowestNumberedBall || getLowestNumberedBall();
    let foulDetected = null;

    // Check for scratch (cue ball pocketed)
    if (!gameState.cueBall.visible) {
      console.log('Foul detected - scratch (cue ball pocketed)');
      foulDetected = 'scratch';
    }

    // Break shot foul detection (CSI 10-Ball rules)
    if (gameState.gamePhase === 'break') {
      // On break: must contact 1-ball first, and either pocket a ball OR cause 4+ balls to hit cushions
      
      // Check if 1-ball was hit first
      if (firstBallHit && firstBallHit !== 1) {
        console.log('Break foul detected - did not hit 1-ball first. Hit:', firstBallHit);
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
        console.log('Break foul detected - no ball pocketed and only', cushionsHit, 'object balls hit cushions');
        foulDetected = 'break_insufficient_cushions';
      }
      
      // Don't return early - let the foul be processed by the main detection flow
    }

    // Check if wrong ball hit first (must hit lowest numbered ball first)
    if (!foulDetected && firstBallHit && currentLowestBall && firstBallHit !== currentLowestBall.id) {
      console.log('Wrong ball first foul - Hit:', firstBallHit, 'Lowest:', currentLowestBall.id);
      console.log('Visible balls on table:', gameState.balls.filter(b => b.visible && !b.pocketed).map(b => b.id).sort((a, b) => a - b));
      foulDetected = 'wrong_ball_first';
    }
    
    // Check if no contact was made at all (player missed all balls)
    if (!foulDetected && !contactMade && !isPushOut && gameState.gamePhase !== 'break') {
      console.log('Foul detected - no contact made with any ball');
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
        console.log('Foul detected - no rail contact and no ball pocketed. Contact made:', contactMade, 'Rail contact:', railContact, 'First ball hit:', firstBallHit);
        foulDetected = 'no_rail_contact';
      }
    }
    
    console.log('Foul detection check - Contact made:', contactMade, 'Rail contact:', railContact, 'First ball hit:', firstBallHit, 'Foul detected:', foulDetected);
    console.log('Current lowest ball:', currentLowestBall ? currentLowestBall.id : 'none');

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
          console.log('Illegally pocketed ball:', ball.id, '- called ball went in wrong pocket');
          illegallyPocketed.push(ball);
        }
      } else {
        // Not the called ball - check if called ball was legally pocketed
        const calledBallPocketed = ballsPocketedThisShot.find(b => b.id === calledBall);
        if (!calledBallPocketed || calledBallPocketed.pocketedPocket !== calledPocket) {
          console.log('Illegally pocketed ball:', ball.id, '- not called ball and called ball not legally pocketed');
          illegallyPocketed.push(ball);
        }
      }
    });

    return illegallyPocketed;
  }, [gameState.gamePhase, isPushOut, calledBall, calledPocket, gameState.balls]);

  const handleFoul = useCallback((foulType) => {
    // Use shotPlayer instead of currentPlayer to ensure we're handling the foul for the correct player
    const playerWhoFouled = shotPlayer || gameState.currentPlayer;
    
    console.log('Handling foul:', foulType, 'for player:', playerWhoFouled);
    
    // Update consecutive fouls (for 3-foul rule)
    setConsecutiveFouls(prev => {
      console.log('Handling foul - Previous consecutive fouls:', prev, 'Player who fouled:', playerWhoFouled);
      const newConsecutiveFouls = {
        ...prev,
        [playerWhoFouled]: prev[playerWhoFouled] + 1
        // Don't reset other player's fouls - each player maintains their own count
      };
      
      console.log('Handling foul - New consecutive fouls:', newConsecutiveFouls);
      
      // Check for 3-foul rule (player loses after 3 consecutive fouls)
      if (newConsecutiveFouls[playerWhoFouled] >= 3) {
        console.log(`Player ${playerWhoFouled} loses due to 3 consecutive fouls!`);
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
   
      // Calculate ghost ball position - DISABLED to prevent interference with aiming
   const calculateGhostBall = useCallback((targetX, targetY, aimX, aimY) => {
     // Ghost ball system completely disabled - return null to prevent any interference
     return null;
   }, []);
   
   // Pocket assistance system
   const getPocketAssistedAim = useCallback((rawAimX, rawAimY) => {
     const cueBall = gameState.cueBall;
     
     // Define pocket positions
     const pockets = [
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y }, // Top left
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y }, // Top middle
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y }, // Top right
       { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT }, // Bottom left
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT }, // Bottom middle
       { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT } // Bottom right
     ];
     
     // Find the nearest pocket to the raw aim point
     let nearestPocket = null;
     let minPocketDist = Infinity;
     
     pockets.forEach(pocket => {
       const dist = Math.hypot(rawAimX - pocket.x, rawAimY - pocket.y);
       if (dist < minPocketDist) {
         minPocketDist = dist;
         nearestPocket = pocket;
       }
     });
     
     // If the aim is close to a pocket (within 80 pixels), assist towards that pocket
     if (nearestPocket && minPocketDist < 80) {
       // Calculate the direction from cue ball to the pocket
       const pocketDx = nearestPocket.x - cueBall.x;
       const pocketDy = nearestPocket.y - cueBall.y;
       const pocketDist = Math.sqrt(pocketDx * pocketDx + pocketDy * pocketDy);
       
       if (pocketDist > 0) {
         // Normalize the pocket direction
         const pocketNx = pocketDx / pocketDist;
         const pocketNy = pocketDy / pocketDist;
         
         // Calculate the raw aim direction
         const rawDx = rawAimX - cueBall.x;
         const rawDy = rawAimY - cueBall.y;
         const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
         
         if (rawDist > 0) {
           const rawNx = rawDx / rawDist;
           const rawNy = rawDy / rawDist;
           
           // Calculate angle between raw aim and pocket direction
           const rawAngle = Math.atan2(rawNy, rawNx);
           const pocketAngle = Math.atan2(pocketNy, pocketNx);
           let angleDiff = Math.abs(rawAngle - pocketAngle);
           while (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
           
           // If the raw aim is within 45 degrees of the pocket, assist towards the pocket
           if (angleDiff < Math.PI / 4) { // 45 degrees (more forgiving)
             // Blend between raw aim and pocket direction based on distance
             const blendFactor = Math.max(0, 1 - (minPocketDist / 80));
             const assistedNx = rawNx * (1 - blendFactor) + pocketNx * blendFactor;
             const assistedNy = rawNy * (1 - blendFactor) + pocketNy * blendFactor;
             
             // Normalize the assisted direction
             const assistedDist = Math.sqrt(assistedNx * assistedNx + assistedNy * assistedNy);
             if (assistedDist > 0) {
               const finalNx = assistedNx / assistedDist;
               const finalNy = assistedNy / assistedDist;
               
               // Return the assisted aim point
               return {
                 x: cueBall.x + finalNx * 400, // Extend the line
                 y: cueBall.y + finalNy * 400,
                 assisted: true,
                 pocket: nearestPocket
               };
             }
           }
         }
       }
     }
     
     // Return the raw aim point if no assistance is needed
     return {
       x: rawAimX,
       y: rawAimY,
       assisted: false
     };
   }, [gameState.cueBall]);
   
   // Multi-ball trajectory prediction system
   const predictAllBallTrajectories = useCallback((cueBallVx, cueBallVy) => {
     const trajectories = {};
     const friction = 0.99;
     const subSteps = 16; // Match the actual game substeps
     const FELT_LEFT = 30.0;
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
     
     // Simulate the entire shot sequence with realistic physics
     const simulateShot = () => {
       const ballStates = new Map();
       
       // Initialize all balls with current positions
       gameState.balls.forEach(ball => {
         if (ball.visible && !ball.pocketed) {
           ballStates.set(ball.id, {
             x: ball.x,
             y: ball.y,
             vx: 0,
             vy: 0,
             visible: true,
             trajectory: [{ x: ball.x, y: ball.y }]
           });
         }
       });
       
       // Add cue ball
       ballStates.set('cue', {
         x: gameState.cueBall.x,
         y: gameState.cueBall.y,
         vx: cueBallVx,
         vy: cueBallVy,
         visible: true,
         trajectory: [{ x: gameState.cueBall.x, y: gameState.cueBall.y }]
       });
       
       // Run physics simulation (matching actual game physics)
       for (let step = 0; step < 500; step++) {
         const activeBalls = Array.from(ballStates.values()).filter(ball => ball.visible);
         
         // Use substeps like the actual game
         for (let s = 0; s < subSteps; s++) {
           activeBalls.forEach(ball => {
             if (Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03) {
               ball.vx = 0;
               ball.vy = 0;
               return;
             }
           
             // Apply friction (matching actual game)
             ball.vx *= Math.pow(friction, 1 / subSteps);
             ball.vy *= Math.pow(friction, 1 / subSteps);
           
             // Calculate next position
             let nextX = ball.x + ball.vx / subSteps;
             let nextY = ball.y + ball.vy / subSteps;
             
             // Check rail collisions
             let bounced = false;
             if (nextX < FELT_LEFT + BALL_RADIUS) {
               nextX = FELT_LEFT + BALL_RADIUS;
               ball.vx = Math.abs(ball.vx) * 0.85;
               bounced = true;
             } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
               nextX = FELT_RIGHT - BALL_RADIUS;
               ball.vx = -Math.abs(ball.vx) * 0.8;
               bounced = true;
             }
             
             if (nextY < FELT_TOP + BALL_RADIUS) {
               nextY = FELT_TOP + BALL_RADIUS;
               ball.vy = Math.abs(ball.vy) * 0.85;
               bounced = true;
             } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
               nextY = FELT_BOTTOM - BALL_RADIUS;
               ball.vy = -Math.abs(ball.vy) * 0.8;
               bounced = true;
             }
           
             // Check pocket detection - only if ball is very close to pocket center
             const pocketBall = { x: nextX, y: nextY };
             const pocketPositions = [
               { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y },
               { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y },
               { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y },
               { x: PLAYFIELD_OFFSET_X, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT },
               { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH / 2, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT },
               { x: PLAYFIELD_OFFSET_X + TABLE_WIDTH, y: PLAYFIELD_OFFSET_Y + TABLE_HEIGHT }
             ];
             
             let pocketed = false;
             pocketPositions.forEach(pocket => {
               const dist = Math.hypot(nextX - pocket.x, nextY - pocket.y);
               if (dist < BALL_RADIUS * 1.5) { // More realistic pocket detection
                 pocketed = true;
               }
             });
             
             if (pocketed) {
               ball.visible = false;
               ball.trajectory.push({ x: nextX, y: nextY, pocketed: true });
               return;
             }
         
             // Update position
             ball.x = nextX;
             ball.y = nextY;
             ball.trajectory.push({ x: nextX, y: nextY, bounced });
           });
         }
       
       // Check ball-ball collisions (matching actual game logic)
       for (let i = 0; i < activeBalls.length; i++) {
         for (let j = i + 1; j < activeBalls.length; j++) {
           const ballA = activeBalls[i];
           const ballB = activeBalls[j];
           
           if (!ballA.visible || !ballB.visible) continue;
           
           const dx = ballB.x - ballA.x;
           const dy = ballB.y - ballA.y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           
           if (dist === 0 || dist >= BALL_SIZE) continue;
           
           // Resolve overlap (matching actual game)
           const overlap = BALL_SIZE - dist + 0.01;
           const nx = dx / dist;
           const ny = dy / dist;
           ballA.x -= nx * (overlap / 2);
           ballA.y -= ny * (overlap / 2);
           ballB.x += nx * (overlap / 2);
           ballB.y += ny * (overlap / 2);
           
           // Update velocities (matching actual game)
           const dvx = ballA.vx - ballB.vx;
           const dvy = ballA.vy - ballB.vy;
           const relVel = dvx * nx + dvy * ny;
           const impulse = -relVel || 0.01;
           ballA.vx += impulse * nx;
           ballA.vy += impulse * ny;
           ballB.vx -= impulse * nx;
           ballB.vy -= impulse * ny;
           
           // Mark collision point
           ballA.trajectory[ballA.trajectory.length - 1].collision = true;
           ballB.trajectory[ballB.trajectory.length - 1].collision = true;
         }
       }
       
                 // Stop if all balls are stationary (matching actual game)
         const allStopped = activeBalls.every(ball => 
           Math.abs(ball.vx) < 0.03 && Math.abs(ball.vy) < 0.03
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
  
  // Ball collision resolution (from working simulation)
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

    // 2. Always update velocities (even if relVel ~ 0)
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const relVel = dvx * nx + dvy * ny;
    const impulse = -relVel || 0.01;
    a.vx += impulse * nx;
    a.vy += impulse * ny;
    b.vx -= impulse * nx;
    b.vy -= impulse * ny;

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
           rotationSpeed: 0 // Ball rotation speed
         });
       }
     });

    return balls;
  }, []);
  
  // Main animation loop (from working simulation)
  const animateBalls = useCallback(() => {
    const friction = 0.99;
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

          // Rail collision using felt bounds
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            gameState.cueBall.x = FELT_LEFT + BALL_RADIUS;
            gameState.cueBall.vx = Math.abs(gameState.cueBall.vx) * 0.85;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              console.log('Rail contact detected for cue ball');
              setRailContact(true);
            }
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            gameState.cueBall.x = FELT_RIGHT - BALL_RADIUS;
            gameState.cueBall.vx = -Math.abs(gameState.cueBall.vx) * 0.8;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else {
            gameState.cueBall.x = nextX;
          }

          if (nextY < FELT_TOP + BALL_RADIUS) {
            gameState.cueBall.y = FELT_TOP + BALL_RADIUS;
            gameState.cueBall.vy = Math.abs(gameState.cueBall.vy) * 0.85;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else if (nextY > FELT_BOTTOM - BALL_RADIUS) {
            gameState.cueBall.y = FELT_BOTTOM - BALL_RADIUS;
            gameState.cueBall.vy = -Math.abs(gameState.cueBall.vy) * 0.8;
            // Track rail contact for foul detection (cue ball hitting rail)
            if (contactMade) {
              setRailContact(true);
            }
          } else {
            gameState.cueBall.y = nextY;
          }

          // Apply friction
          gameState.cueBall.vx *= Math.pow(friction, 1 / subSteps);
          gameState.cueBall.vy *= Math.pow(friction, 1 / subSteps);

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

          // Rail collision using felt bounds
          if (nextX < FELT_LEFT + BALL_RADIUS) {
            ball.x = FELT_LEFT + BALL_RADIUS;
            ball.vx = Math.abs(ball.vx) * 0.85;
            // Track rail contact for foul detection (any ball after contact)
            if (contactMade) {
              console.log('Rail contact detected for ball:', ball.id);
              setRailContact(true);
            }
            // Track object balls hitting cushions during break
            if (gameState.gamePhase === 'break' && ball.id !== 'cue') {
              setObjectBallsHitCushions(prev => prev + 1);
            }
          } else if (nextX > FELT_RIGHT - BALL_RADIUS) {
            ball.x = FELT_RIGHT - BALL_RADIUS;
            ball.vx = -Math.abs(ball.vx) * 0.8;
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
            ball.vy = Math.abs(ball.vy) * 0.85;
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
            ball.vy = -Math.abs(ball.vy) * 0.8;
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

          // Apply friction
          ball.vx *= Math.pow(friction, 1 / subSteps);
          ball.vy *= Math.pow(friction, 1 / subSteps);

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
                console.log('First contact made with ball:', ball.id);
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

      // Check for fouls when animation ends (regular shots only, not break shots)
      // Only check for fouls if the current player is the one who took the shot
      // Also skip if this is a break shot (to prevent break shot from being treated as regular shot)
      if (allStopped && !isPushOut && gameState.gamePhase !== 'break' && !foulHandled && !shotProcessed && shotPlayer === gameState.currentPlayer && shotPlayer !== null && !isBreakShot) {
        // Regular foul detection (not push out)
        console.log('Regular foul detection - isPushOut:', isPushOut);
        console.log('Checking for fouls - Current player:', gameState.currentPlayer, 'First ball hit:', firstBallHit);
        const foulDetected = detectFouls();
        if (foulDetected) {
          console.log('Foul detected:', foulDetected, 'by player:', gameState.currentPlayer);
          setFoulHandled(true); // Mark foul as handled immediately
          setShotProcessed(true); // Mark shot as processed
          
          // Reset call shot for next turn (after foul detection is complete)
          setCalledBall(null);
          setCalledPocket(null);
          
          handleFoul(foulDetected); // Handle foul immediately, no setTimeout
        } else {
          // No foul detected - check for illegally pocketed balls (but not on break shots)
          if (!isBreakShot) {
            const illegallyPocketed = detectIllegallyPocketedBalls();
            
            if (illegallyPocketed.length > 0) {
              console.log('Illegally pocketed balls detected:', illegallyPocketed.map(b => b.id));
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
          console.log('Legal shot completed - resetting consecutive fouls for player:', shotPlayer);
          setShotProcessed(true); // Mark shot as processed
          
          // Reset call shot for next turn (after illegally pocketed detection is complete)
          setCalledBall(null);
          setCalledPocket(null);
          setConsecutiveFouls(prev => {
            console.log('Previous consecutive fouls:', prev);
            const newFouls = {
              ...prev,
              [shotPlayer]: 0 // Only reset the fouls for the player who made the legal shot
            };
            console.log(`Resetting fouls for player ${shotPlayer} only. Player 1 fouls: ${newFouls[1]}, Player 2 fouls: ${newFouls[2]}`);
            console.log('New consecutive fouls:', newFouls);
            return newFouls;
          });
          
          // Check if any ball was pocketed during this shot
          const ballsPocketedThisShot = gameState.balls.filter(ball => 
            ball.pocketed && !ball.wasPocketedBeforeShot
          );
          
          // If no ball was pocketed AND no foul occurred, switch players (player missed)
          if (ballsPocketedThisShot.length === 0) {
            console.log('No ball pocketed - switching players');
      setGameState(prev => ({
        ...prev,
              currentPlayer: prev.currentPlayer === 1 ? 2 : 1
            }));
          }
          // If ball was pocketed, player continues shooting
          // If foul occurred, player switching is handled in handleFoul function
        }
      }
      
      // Check for push out fouls (only scratches are fouls during push out)
      if (allStopped && isPushOut && !foulHandled && !shotProcessed && shotPlayer === gameState.currentPlayer) {
        console.log('Push out foul detection - checking for scratches only');
        // During push out, only scratches are fouls
        // The scratch detection is already handled in the step function
        // If no scratch occurred, it's a legal push out
        setShotProcessed(true); // Mark shot as processed
        // No foul detection needed for push out (only scratches are fouls)
      }

      // Check for break shot fouls (CSI 10-Ball rules)
      if (allStopped && isBreakShot && !foulHandled && !shotProcessed && shotPlayer === gameState.currentPlayer) {
        // Mark shot as processed immediately to prevent multiple executions
        setShotProcessed(true);
        setIsBreakShot(false); // Reset break shot flag
        
        const breakFoulDetected = detectFouls();
        if (breakFoulDetected) {
          console.log('Break foul detected:', breakFoulDetected, 'by player:', gameState.currentPlayer);
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
      
      if (allStopped && tenBallPocketed) {
        // Game won! Restart after a short delay
        setTimeout(() => {
      setGameState(prev => ({
        ...prev,
            balls: initializeBalls(),
            cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false },
            isAnimating: false,
            gamePhase: 'break',
            ballInHand: false,
            scratchOccurred: false
          }));
          setIsDragging(false);
    setShowAimLine(true);
        }, 2000); // 2 second delay to show the win
      }

      setGameState(prev => ({
        ...prev,
        isAnimating: !allStopped,
        // Change game phase from 'break' to 'play' after first shot
        gamePhase: prev.gamePhase === 'break' && !allStopped ? 'play' : prev.gamePhase
      }));

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
    if (gameState.gamePhase === 'break') {
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
    const speed = power * 12; // Good speed for realistic play
    
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
        isMoving: true
      },
      isAnimating: true,
      ballInHand: false, // End ball-in-hand mode when taking a shot
      gamePhase: prev.gamePhase === 'break' ? 'play' : prev.gamePhase // Change from break to play after first shot
    }));
    
    // Enable push out after break shot
    if (gameState.gamePhase === 'break') {
      setPushOutAvailable(true);
      setFirstShotAfterBreak(false); // Reset for new break
      setIsBreakShot(true); // Mark this as a break shot
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
    setIsPushOut(false);
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
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within table bounds
    const isOnTable = x >= 0 && x <= TABLE_WIDTH && y >= 0 && y <= TABLE_HEIGHT;
    
    if (isOnTable) {
      // Handle call shot mode clicks
      if (isCallShotMode) {
        // Check if clicking on push out checkbox
        if (gameState.gamePhase === 'play' && pushOutAvailable) {
          if (x >= 15 && x <= 30 && y >= TABLE_HEIGHT - 75 && y <= TABLE_HEIGHT - 60) {
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
        
        // Handle ball and pocket selection
        handleCallShotClick(e);
        return;
      }
      
      // If ball-in-hand OR during break phase, allow cue ball dragging
      if (gameState.ballInHand || gameState.gamePhase === 'break') {
        if (isClickOnCueBall(x, y)) {
          startDraggingCueBall(x, y);
          return;
        }
      }
      
      // Toggle aim lock: click to lock/unlock aim
      setAimLocked(!aimLocked);
    }
  }, [gameState.isAnimating, gameState.ballInHand, gameState.gamePhase, isClickOnCueBall, startDraggingCueBall, aimLocked, isCallShotMode, calledBall, calledPocket, handleCallShotClick, pushOutAvailable, isPushOut]);
  
  const handlePointerUp = useCallback((e) => {
    // Stop dragging cue ball if active
    if (isDraggingCueBall) {
      stopDraggingCueBall();
    }
  }, [isDraggingCueBall, stopDraggingCueBall]);
  
  const handlePointerMove = useCallback((e) => {
    if (gameState.isAnimating) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cue ball position if dragging
    if (isDraggingCueBall) {
      updateCueBallPosition(x, y);
      return;
    }
    
    // Update mouse aiming (only if not locked and not in call shot mode)
    if (aimLocked || isCallShotMode) return; // Don't update aim if locked or in call shot mode
    
    // Simple, direct aiming - no smoothing or complex calculations
    const cueBall = gameState.cueBall;
    const aimAngle = Math.atan2(y - cueBall.y, x - cueBall.x);
    
    setAimAngle(aimAngle);
    
    // Ghost ball system completely removed
    setGhostBall(null);
    setTargetBall(null);
  }, [gameState.isAnimating, isDraggingCueBall, updateCueBallPosition, gameState.cueBall, gameState.balls, calculateGhostBall, aimLocked, isCallShotMode]);
  
  const handlePointerLeave = useCallback(() => {
    // Keep aim locked when pointer leaves table
  }, []);
  
  // Touch-specific handlers for better mobile support

  
  const handleResetAim = useCallback(() => {
    setShowAimLine(true);
    setPower(0.5);
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
    if (gameState.gamePhase === 'break' && !gameState.isAnimating) {
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
    

    
    // Draw pockets
    const pockets = [
      { x: 0, y: 0 },
      { x: TABLE_WIDTH / 2, y: 0 },
      { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH, y: TABLE_HEIGHT }
    ];
    
    pockets.forEach(pocket => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, 20, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw balls
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
        
        // Draw the ball with rotation
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, -BALL_RADIUS, -BALL_RADIUS, BALL_SIZE, BALL_SIZE);
        
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
    
    // Draw simple aim line that follows mouse exactly
    if (showAimLine && !gameState.isAnimating) {
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
      const baseSpeed = power * 12;
      const friction = 0.99;
      const subSteps = 16;
      
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
      const endX = cueBall.x + Math.cos(currentAngle) * distance;
      const endY = cueBall.y + Math.sin(currentAngle) * distance;
      
      ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw multi-ball trajectory predictions (separate from aim line)
    if (showAimLine && !gameState.isAnimating) {
      const cueBall = gameState.cueBall;
      const currentAngle = aimAngle;
      
      // Calculate initial velocity based on power
      const baseSpeed = power * 12;
      const startVx = Math.cos(currentAngle) * baseSpeed;
      const startVy = Math.sin(currentAngle) * baseSpeed;
      
      // Predict all ball trajectories
      const allTrajectories = predictAllBallTrajectories(startVx, startVy);
       
       // Draw each ball's trajectory (only show significant ones)
       Object.entries(allTrajectories).forEach(([ballId, trajectory]) => {
         // Show all trajectories with at least 3 points
         const minPoints = 3;
         if (trajectory.points.length > minPoints) {
          ctx.save();
           
           // Special handling for cue ball trajectory - show after-contact path only
           if (ballId === 'cue') {
             // Find the first collision point to separate aim line from after-contact path
             const firstCollisionIndex = trajectory.points.findIndex(point => point.collision);
             
             if (firstCollisionIndex > 0) {
               // Draw after-contact path (dashed line) - aim line is handled separately
               if (firstCollisionIndex < trajectory.points.length - 1) {
                 ctx.save();
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent white
                 ctx.lineWidth = 2;
                 ctx.setLineDash([5, 5]); // Dashed line for after-contact
                 
                 ctx.beginPath();
                 ctx.moveTo(trajectory.points[firstCollisionIndex].x, trajectory.points[firstCollisionIndex].y);
                 
                 // Draw the rest of the trajectory after contact
                 for (let i = firstCollisionIndex + 1; i < trajectory.points.length; i++) {
                   ctx.lineTo(trajectory.points[i].x, trajectory.points[i].y);
                 }
                 ctx.stroke();
                 ctx.restore();
               }
               return; // Skip the default trajectory drawing
             }
           } else {
             // Object ball trajectories
             ctx.strokeStyle = trajectory.color;
             ctx.lineWidth = 2; // Keep lines thin but visible
           }
           
           // Keep opacity consistent for better visibility
           ctx.globalAlpha = 0.7;
           
           // All trajectories are solid lines (aim line and object ball paths)
           ctx.setLineDash([]); // Solid line for all trajectories
          
          ctx.beginPath();
           ctx.moveTo(trajectory.points[0].x, trajectory.points[0].y);
           
           // Draw trajectory path (draw all points for accuracy)
           for (let i = 1; i < trajectory.points.length; i++) {
             const point = trajectory.points[i];
            ctx.lineTo(point.x, point.y);
           }
           
           ctx.stroke();
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
         }
       });
     }
      
     // Draw cue ball after-contact path (dashed line)
     if (showAimLine && !gameState.isAnimating) {
       const cueBall = gameState.cueBall;
       const currentAngle = aimAngle;
       
       // Calculate initial velocity based on power
       const baseSpeed = power * 12;
       const startVx = Math.cos(currentAngle) * baseSpeed;
       const startVy = Math.sin(currentAngle) * baseSpeed;
       
       // Removed dashed cue ball path - too confusing for aiming
     }
          
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

    // Draw call shot mode visuals
    if (isCallShotMode && !gameState.isAnimating) {
      ctx.save();
      
      // Draw overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
      if (gameState.gamePhase === 'play' && pushOutAvailable) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(10, TABLE_HEIGHT - 80, 200, 25);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, TABLE_HEIGHT - 80, 200, 25);
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Push Out Available', 15, TABLE_HEIGHT - 65);
        
        // Push out checkbox
        ctx.fillStyle = isPushOut ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(15, TABLE_HEIGHT - 75, 15, 15);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, TABLE_HEIGHT - 75, 15, 15);
        
        if (isPushOut) {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('✓', 22, TABLE_HEIGHT - 65);
        }
      }
      
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
          
          ctx.restore();
        }
      }
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

  

  
  return (
    <div className={styles.simplePoolGame}>
      <div className={styles.tableContainer}>
                 <canvas
           ref={canvasRef}
           width={TABLE_WIDTH}
           height={TABLE_HEIGHT}
           onPointerDown={handlePointerDown}
           onPointerUp={handlePointerUp}
           onPointerMove={handlePointerMove}
           onPointerLeave={handlePointerLeave}
           className={styles.tableCanvas}
         />
      </div>
      
             <div className={styles.controls}>
         <div className={styles.shootControl}>
           <div className={styles.instructions}>
             <strong>Beginner-Friendly Aiming:</strong><br/>
             Move mouse to aim • Click table to lock aim • Adjust power • Click SHOOT<br/>
             <small style={{color: '#888', fontSize: '12px'}}>
               💡 <strong>Aim Line Colors:</strong> White = Normal • Yellow = Pocket assistance active • Green = Locked & ready
             </small>
           </div>
         </div>
         
         <div className={styles.powerControl}>
           <label>Power: {Math.round(power * 100)}%</label>
           <input
             type="range"
             min="0.1"
             max="1"
             step="0.01"
             value={power}
             onChange={(e) => setPower(parseFloat(e.target.value))}
             className={styles.powerSlider}
           />
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
                 cueBall: { x: 100, y: 150, vx: 0, vy: 0, visible: true, isMoving: false, rotation: 0, rotationSpeed: 0 },
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
               // Reset push out states
               setPushOutAvailable(false);
               setFirstShotAfterBreak(false);
               setIsPushOut(false);
               setPushOutResult(null);
               setShowPushOutDecision(false);
               // Reset foul detection states
               setLowestNumberedBall(null);
               setConsecutiveFouls({ 1: 0, 2: 0 });
               setFoulType(null);
               setFoulHandled(false);
               setShotProcessed(false);
               setShotPlayer(null);
               setObjectBallsHitCushions(0);
               setIllegallyPocketedBalls([]);
               setShowIllegalPocketOption(false);
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
                         ball.id === 10 ? { ...ball, pocketed: false, visible: true, x: 300, y: 150 } : ball
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