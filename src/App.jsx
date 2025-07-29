import React, { useState } from 'react'

function App() {
  const [currentGame, setCurrentGame] = useState('tenball')

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '30px' }}>
        🎯 Ten Ball Pool Game
      </h1>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <button 
          style={{
            padding: '15px 25px',
            fontSize: '1.2rem',
            backgroundColor: currentGame === 'tenball' ? '#4CAF50' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setCurrentGame('tenball')}
        >
          🎯 Ten Ball
        </button>
        <button 
          style={{
            padding: '15px 25px',
            fontSize: '1.2rem',
            backgroundColor: currentGame === 'pool' ? '#4CAF50' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => setCurrentGame('pool')}
        >
          🎱 Pool Demo
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '30px', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h2>Current Game: {currentGame}</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
          ✅ React is working!<br/>
          ✅ State management is working!<br/>
          ✅ Click detection is working!<br/>
        </p>
        
        {currentGame === 'tenball' && (
          <div style={{ marginTop: '20px' }}>
            <h3>🎯 Ten Ball Game Selected</h3>
            <p>This will load the full Ten Ball game with:</p>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>📚 Interactive Tutorial</li>
              <li>📖 Official CSI Rules</li>
              <li>🤖 AI Opponents (4 difficulty levels)</li>
              <li>👥 Two Player Mode</li>
              <li>🎱 Realistic Physics</li>
            </ul>
          </div>
        )}
        
        {currentGame === 'pool' && (
          <div style={{ marginTop: '20px' }}>
            <h3>🎱 Pool Demo Selected</h3>
            <p>This will load the existing pool simulation.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
