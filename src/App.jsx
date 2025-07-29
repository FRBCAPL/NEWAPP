import { useState } from 'react'
import TenBallGame from './components/TenBallGame'
import PoolSimulation from './components/PoolSimulation'
import PoolSimulation3D from './components/PoolSimulation3D'
import './App.css'

function App() {
  const [currentGame, setCurrentGame] = useState('tenball') // tenball, pool, pool3d

  return (
    <div className="App">
      <div className="game-selector">
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
        {currentGame === 'tenball' && <TenBallGame />}
        {currentGame === 'pool' && <PoolSimulation />}
        {currentGame === 'pool3d' && <PoolSimulation3D />}
      </div>
    </div>
  )
}

export default App
