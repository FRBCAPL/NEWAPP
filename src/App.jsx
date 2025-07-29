import { useState } from 'react'
import './App.css'

function App() {
  const [currentGame, setCurrentGame] = useState('tenball') // tenball, pool, pool3d

  return (
    <div className="App">
      <div className="game-selector">
        <h1 style={{color: 'white', textAlign: 'center'}}>🎯 Ten Ball Pool Game</h1>
        <p style={{color: 'white', textAlign: 'center'}}>Testing basic React rendering...</p>
        <button 
          className={currentGame === 'tenball' ? 'active' : ''}
          onClick={() => setCurrentGame('tenball')}
        >
          🎯 Ten Ball
        </button>
        <button 
          className={currentGame === 'pool' ? 'active' : ''}
          onClick={() => setCurrentGame('pool')}
        >
          🎱 Pool Demo
        </button>
        <button 
          className={currentGame === 'pool3d' ? 'active' : ''}
          onClick={() => setCurrentGame('pool3d')}
        >
          🌟 Pool 3D
        </button>
      </div>

      <div className="game-container">
        <p style={{color: 'white', padding: '20px'}}>
          React is working! Current game: {currentGame}
        </p>
      </div>
    </div>
  )
}

export default App
