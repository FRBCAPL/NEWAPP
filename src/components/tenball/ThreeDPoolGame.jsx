import React, { useState, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

// Game constants - made slightly smaller for better fit
const TABLE_WIDTH = 9; // meters (slightly smaller for better fit)
const TABLE_HEIGHT = 4.5; // meters (slightly smaller for better fit)
const BALL_RADIUS = 0.09; // meters (slightly smaller balls to match)

// Simple Texture-Based Ball Component (No 3D modeling needed!)
const TextureBall = ({ position, number, isCue = false }) => {
  const ballRef = useRef();
  
  // Map ball numbers to PNG textures
  const getBallTexture = (num) => {
    if (isCue) return '/cueball.png';
    return `/ball${num}.png`;
  };

  // Check if we have the texture file available
  const hasTexture = (num) => {
    if (isCue) return true; // cueball.png exists
    // Only balls 1-8 have PNG files
    return num >= 1 && num <= 8;
  };

  // If we don't have the texture, use fallback
  if (!hasTexture(number)) {
    return <FallbackBall position={position} number={number} isCue={isCue} />;
  }

  // Load the texture only if we know it exists
  const texture = useLoader(TextureLoader, getBallTexture(number));

  return (
    <mesh ref={ballRef} position={position} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial 
        map={texture}
        roughness={0.2}
        metalness={0.0}
      />
      
      {/* Ball highlight for realism */}
      <mesh position={[BALL_RADIUS * 0.3, BALL_RADIUS * 0.3, BALL_RADIUS * 0.8]}>
        <sphereGeometry args={[BALL_RADIUS * 0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.4}
          roughness={0.0}
        />
      </mesh>
    </mesh>
  );
};

// Fallback Ball component for missing textures
const FallbackBall = ({ position, number, isCue = false }) => {
  // Pool ball colors - standard pool ball colors
  const getBallColor = (num) => {
    if (isCue) return '#ffffff'; // White cue ball
    switch (num) {
      case 1: return '#ffff00'; // Yellow
      case 2: return '#0000ff'; // Blue
      case 3: return '#ff0000'; // Red
      case 4: return '#800080'; // Purple
      case 5: return '#ffa500'; // Orange
      case 6: return '#008000'; // Green
      case 7: return '#8b4513'; // Brown
      case 8: return '#000000'; // Black
      case 9: return '#ffff00'; // Yellow
      case 10: return '#ffffff'; // White
      default: return '#ffffff';
    }
  };

  const ballColor = getBallColor(number);

  return (
    <group position={position}>
      {/* Main ball sphere with less shiny material */}
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial 
          color={ballColor} 
          roughness={0.3}
          metalness={0.0}
        />
      </mesh>
      
      {/* Ball numbers and stripes - much more visible */}
      {!isCue && (
        <>
          {/* Regular balls with numbers */}
          {number !== 9 && number !== 10 && (
            <>
              {/* Number circle background - much larger and more visible */}
              <mesh position={[0, 0, BALL_RADIUS + 0.002]}>
                <cylinderGeometry args={[0.06, 0.06, 0.02, 32]} />
                <meshStandardMaterial 
                  color={number === 8 ? "#ffffff" : "#000000"} 
                  roughness={0.1}
                />
              </mesh>
              {/* Number text - larger and more visible */}
              <mesh position={[0, 0, BALL_RADIUS + 0.003]}>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 32]} />
                <meshStandardMaterial 
                  color={number === 8 ? "#000000" : "#ffffff"} 
                  roughness={0.1}
                />
              </mesh>
            </>
          )}
          
          {/* 9-ball: Yellow with white stripe */}
          {number === 9 && (
            <>
              {/* White stripe - much larger and more visible */}
              <mesh position={[0, 0, BALL_RADIUS + 0.002]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
              </mesh>
              {/* Black number 9 - larger and more visible */}
              <mesh position={[0, 0, BALL_RADIUS + 0.003]}>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 32]} />
                <meshStandardMaterial color="#000000" roughness={0.1} />
              </mesh>
            </>
          )}
          
          {/* 10-ball: White with blue stripe */}
          {number === 10 && (
            <>
              {/* Blue stripe - much larger and more visible */}
              <mesh position={[0, 0, BALL_RADIUS + 0.002]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
                <meshStandardMaterial color="#0000ff" roughness={0.1} />
              </mesh>
              {/* White number 10 - larger and more visible */}
              <mesh position={[-0.02, 0, BALL_RADIUS + 0.003]}>
                <cylinderGeometry args={[0.025, 0.025, 0.02, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
              </mesh>
              <mesh position={[0.02, 0, BALL_RADIUS + 0.003]}>
                <cylinderGeometry args={[0.025, 0.025, 0.02, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
              </mesh>
            </>
          )}
        </>
      )}
      
      {/* Ball highlight for realism */}
      <mesh position={[BALL_RADIUS * 0.3, BALL_RADIUS * 0.3, BALL_RADIUS * 0.8]}>
        <sphereGeometry args={[BALL_RADIUS * 0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.4}
          roughness={0.0}
        />
      </mesh>
    </group>
  );
};

// Ball component that uses simple texture-based approach
const Ball = ({ position, number, isCue = false }) => {
  // Use the simple texture-based approach - no 3D modeling needed!
  return <TextureBall position={position} number={number} isCue={isCue} />;
};

// 3D Pool Table Components - Simple overhead view
const TableFelt = () => {
  const texture = useLoader(TextureLoader, '/PredatorTable.png');
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[TABLE_WIDTH, TABLE_HEIGHT]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

// Complete 3D Pool Table - Just the felt surface
const Table = () => {
  return (
    <group>
      {/* Just the Predator table surface */}
      <TableFelt />
    </group>
  );
};

// Pool table scene
const PoolTableScene = ({ tutorialMode = false, ballPositions, ballVelocities, setBallPositions, setBallVelocities, gameState, setGameState }) => {
  const ballNumbers = [10, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const balls = ballNumbers.map((number) => ({
    id: number,
    position: ballPositions[number] || [0, BALL_RADIUS + 0.1, 0],
    number,
  }));

  const cueBall = { 
    position: ballPositions.cue || [-TABLE_WIDTH / 2 + 1.0, BALL_RADIUS + 0.1, 0], 
    id: 'cue' 
  };

  // Physics constants
  const FRICTION = 0.98;
  const BALL_COLLISION_DISTANCE = BALL_RADIUS * 2;
  const WALL_COLLISION_DISTANCE = BALL_RADIUS;

  // Update ball positions based on physics - now inside Canvas context
  useFrame(() => {
    if (gameState.isAnimating) {
      setBallPositions(prevPositions => {
        const newPositions = { ...prevPositions };
        const newVelocities = { ...ballVelocities };
        
        // Update each ball's position
        Object.keys(newPositions).forEach(ballId => {
          const velocity = ballVelocities[ballId];
          if (velocity && (Math.abs(velocity[0]) > 0.001 || Math.abs(velocity[2]) > 0.001)) {
            // Apply velocity
            newPositions[ballId] = [
              newPositions[ballId][0] + velocity[0],
              newPositions[ballId][1],
              newPositions[ballId][2] + velocity[2]
            ];
            
            // Apply friction
            newVelocities[ballId] = [
              velocity[0] * FRICTION,
              velocity[1],
              velocity[2] * FRICTION
            ];
            
            // Wall collisions
            const [x, y, z] = newPositions[ballId];
            if (Math.abs(x) > TABLE_WIDTH / 2 - WALL_COLLISION_DISTANCE) {
              newVelocities[ballId][0] *= -0.8;
              newPositions[ballId][0] = Math.sign(x) * (TABLE_WIDTH / 2 - WALL_COLLISION_DISTANCE);
            }
            if (Math.abs(z) > TABLE_HEIGHT / 2 - WALL_COLLISION_DISTANCE) {
              newVelocities[ballId][2] *= -0.8;
              newPositions[ballId][2] = Math.sign(z) * (TABLE_HEIGHT / 2 - WALL_COLLISION_DISTANCE);
            }
          }
        });
        
        // Ball-to-ball collisions
        Object.keys(newPositions).forEach(ballId1 => {
          Object.keys(newPositions).forEach(ballId2 => {
            if (ballId1 !== ballId2) {
              const pos1 = newPositions[ballId1];
              const pos2 = newPositions[ballId2];
              const distance = Math.sqrt(
                Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[2] - pos2[2], 2)
              );
              
              if (distance < BALL_COLLISION_DISTANCE) {
                // Simple collision response
                const vel1 = newVelocities[ballId1];
                const vel2 = newVelocities[ballId2];
                
                // Swap velocities
                newVelocities[ballId1] = vel2.map(v => v * 0.9);
                newVelocities[ballId2] = vel1.map(v => v * 0.9);
                
                // Separate balls
                const angle = Math.atan2(pos2[2] - pos1[2], pos2[0] - pos1[0]);
                const separation = BALL_COLLISION_DISTANCE - distance;
                newPositions[ballId1][0] -= Math.cos(angle) * separation * 0.5;
                newPositions[ballId1][2] -= Math.sin(angle) * separation * 0.5;
                newPositions[ballId2][0] += Math.cos(angle) * separation * 0.5;
                newPositions[ballId2][2] += Math.sin(angle) * separation * 0.5;
              }
            }
          });
        });
        
        setBallVelocities(newVelocities);
        
        // Check if all balls have stopped moving
        const allStopped = Object.values(newVelocities).every(vel => 
          Math.abs(vel[0]) < 0.001 && Math.abs(vel[2]) < 0.001
        );
        
        if (allStopped) {
          setGameState(prev => ({ ...prev, isAnimating: false }));
        }
        
        return newPositions;
      });
    }
  });

  return (
    <>
      {/* Enhanced Lighting for Realistic Balls */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 15, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Additional fill light for better ball definition */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.8}
        color="#ffffff"
      />
      {/* Rim light for ball highlights */}
      <pointLight
        position={[0, 8, 0]}
        intensity={0.5}
        color="#ffffff"
        distance={20}
      />

      {/* 3D Pool Table */}
      <Table />

      {/* Balls */}
      {balls.map((ball) => (
        <Ball
          key={ball.id}
          position={ball.position}
          number={ball.number}
        />
      ))}

      {/* Cue ball */}
      <Ball
        position={cueBall.position}
        number="cue"
        isCue={true}
      />

             {/* Tutorial indicator - removed to eliminate green line */}
    </>
  );
};

// Main game component
const ThreeDPoolGame = ({ onGameEnd, tutorialMode = false }) => {
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    gamePhase: 'break',
    isAnimating: false,
    ballInHand: false,
    scratchOccurred: false,
    consecutiveFouls: { 1: 0, 2: 0 },
    player1Score: 0,
    player2Score: 0
  });

  const [aimAngle, setAimAngle] = useState(0);
  const [power, setPower] = useState(0.5);
  
  // Ball physics state
  const [ballPositions, setBallPositions] = useState({
    cue: [-TABLE_WIDTH / 2 + 1.0, BALL_RADIUS + 0.1, 0],
    1: [TABLE_WIDTH / 2 - 0.8, BALL_RADIUS + 0.1, 0],
    2: [TABLE_WIDTH / 2 - 0.9, BALL_RADIUS + 0.1, -BALL_RADIUS * 2],
    3: [TABLE_WIDTH / 2 - 0.9, BALL_RADIUS + 0.1, BALL_RADIUS * 2],
    4: [TABLE_WIDTH / 2 - 1.0, BALL_RADIUS + 0.1, -BALL_RADIUS * 4],
    5: [TABLE_WIDTH / 2 - 1.0, BALL_RADIUS + 0.1, 0],
    6: [TABLE_WIDTH / 2 - 1.0, BALL_RADIUS + 0.1, BALL_RADIUS * 4],
    7: [TABLE_WIDTH / 2 - 1.1, BALL_RADIUS + 0.1, -BALL_RADIUS * 6],
    8: [TABLE_WIDTH / 2 - 1.1, BALL_RADIUS + 0.1, -BALL_RADIUS * 2],
    9: [TABLE_WIDTH / 2 - 1.1, BALL_RADIUS + 0.1, BALL_RADIUS * 2],
    10: [TABLE_WIDTH / 2 - 1.1, BALL_RADIUS + 0.1, BALL_RADIUS * 6],
  });
  
  const [ballVelocities, setBallVelocities] = useState({
    cue: [0, 0, 0],
    1: [0, 0, 0], 2: [0, 0, 0], 3: [0, 0, 0], 4: [0, 0, 0], 5: [0, 0, 0],
    6: [0, 0, 0], 7: [0, 0, 0], 8: [0, 0, 0], 9: [0, 0, 0], 10: [0, 0, 0],
  });



  const shoot = () => {
    if (gameState.isAnimating) return;
    
    const cueBallPos = ballPositions.cue;
    const powerMultiplier = power * 2; // Adjust power scaling
    
    // Calculate shot direction based on aim angle
    const shotAngle = (aimAngle * Math.PI) / 180;
    const shotVelocity = [
      Math.cos(shotAngle) * powerMultiplier,
      0,
      Math.sin(shotAngle) * powerMultiplier
    ];
    
    // Apply shot to cue ball
    setBallVelocities(prev => ({
      ...prev,
      cue: shotVelocity
    }));
    
    setGameState(prev => ({ ...prev, isAnimating: true }));
  };

  // Responsive styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: '#1a1a2e',
    minHeight: '100vh',
    color: 'white',
    width: '100%',
    boxSizing: 'border-box'
  };

  const gameInfoStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '800px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '15px',
    flexWrap: 'wrap',
    gap: '10px'
  };

  const tableContainerStyle = {
    width: '100%',
    maxWidth: '800px',
    height: '500px', // Made taller
    border: '3px solid #cc0000',
    borderRadius: '15px',
    overflow: 'hidden',
    background: '#000000'
  };

  const controlsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%',
    maxWidth: '600px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '20px'
  };

  const controlGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const inputStyle = {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#333',
    outline: 'none',
    cursor: 'pointer'
  };

  const buttonStyle = {
    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '200px',
    alignSelf: 'center'
  };

  const tutorialStyle = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #4CAF50',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%'
  };

  // Mobile responsive adjustments
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    containerStyle.padding = '10px';
    containerStyle.gap = '15px';
    
    gameInfoStyle.flexDirection = 'column';
    gameInfoStyle.textAlign = 'center';
    gameInfoStyle.padding = '10px';
    
    tableContainerStyle.height = '400px'; // Taller on mobile too
    tableContainerStyle.maxWidth = '100%';
    
    controlsStyle.padding = '15px';
    controlsStyle.maxWidth = '100%';
    
    buttonStyle.minWidth = '150px';
    buttonStyle.padding = '12px 20px';
    buttonStyle.fontSize = '16px';
    
    tutorialStyle.padding = '15px';
  }

  return (
    <div style={containerStyle}>
      <div style={gameInfoStyle}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Player {gameState.currentPlayer}</span>
          <span>Phase: {gameState.gamePhase}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>P1: {gameState.player1Score}</span>
          <span>P2: {gameState.player2Score}</span>
        </div>
      </div>

             <div style={tableContainerStyle}>
                   <Canvas
            shadows
            camera={{ position: [0, 13, 0], fov: 28 }}
            style={{ width: '100%', height: '100%' }}
          >
           <PoolTableScene 
          tutorialMode={tutorialMode} 
          ballPositions={ballPositions}
          ballVelocities={ballVelocities}
          setBallPositions={setBallPositions}
          setBallVelocities={setBallVelocities}
          gameState={gameState}
          setGameState={setGameState}
        />
         </Canvas>
       </div>

      <div style={controlsStyle}>
        <div style={controlGroupStyle}>
          <label>Angle: {aimAngle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={aimAngle}
            onChange={(e) => setAimAngle(parseInt(e.target.value))}
            disabled={gameState.isAnimating}
            style={inputStyle}
          />
        </div>

        <div style={controlGroupStyle}>
          <label>Power: {Math.round(power * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={power}
            onChange={(e) => setPower(parseFloat(e.target.value))}
            disabled={gameState.isAnimating}
            style={inputStyle}
          />
        </div>

        <button
          onClick={shoot}
          disabled={gameState.isAnimating}
          style={buttonStyle}
        >
          Shoot
        </button>
      </div>

      {tutorialMode && (
        <div style={tutorialStyle}>
          <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>3D Predator Pool Table</h3>
          <p>Now you have a true 3D pool table with felt, cushions, rails, legs, and pockets!</p>
          {isMobile && <p style={{ fontSize: '14px', marginTop: '10px' }}>Mobile view active</p>}
        </div>
      )}
    </div>
  );
};

export default ThreeDPoolGame;

