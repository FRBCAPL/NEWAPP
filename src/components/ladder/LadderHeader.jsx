import React, { memo } from 'react';

const LadderHeader = memo(({ 
  selectedLadder, 
  setSelectedLadder, 
  setHasManuallySelectedLadder,
  currentView,
  setCurrentView,
  isPublicView 
}) => {
  const getLadderDisplayName = (ladderName) => {
    switch (ladderName) {
      case '499-under': return '499 & Under';
      case '500-549': return '500-549';
      case '550-plus': return '550+';
      default: return ladderName;
    }
  };

  return (
    <div className="ladder-header-section" style={{ position: 'relative' }}>
      {/* Back to Ladder Home Button - Top Left */}
      {!isPublicView && currentView !== 'main' && (
        <button 
          onClick={() => setCurrentView('main')}
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            background: 'transparent',
            color: '#8B5CF6',
            border: '2px solid #8B5CF6',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(139, 92, 246, 0.1)';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
          }}
        >
          🏠 Back to Ladder Home
        </button>
      )}
      
      <h1 style={{ 
        color: '#000000',
        WebkitTextStroke: '0.5px #8B5CF6',
        textShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.2)',
        fontWeight: 'bold',
        fontSize: '3.5rem',
        letterSpacing: '3px',
        fontFamily: '"Bebas Neue", "Orbitron", "Exo 2", "Arial Black", sans-serif',
        textTransform: 'uppercase',
        marginBottom: '0rem'
      }}>Ladder of Legends</h1>
      <p style={{ marginBottom: '1.5rem', marginTop: '0rem', fontSize: '0.9rem' }}>Tournament Series</p>
      
      <h2 style={{ 
        color: '#8B5CF6',
        WebkitTextStroke: '1.5px #000000',
        textShadow: '0 0 8px rgba(139, 92, 246, 0.7)',
        fontWeight: 'bold',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontSize: '2rem',
        marginBottom: '0.5rem',
        fontFamily: '"Orbitron", "Exo 2", "Rajdhani", "Arial Black", sans-serif'
      }}>{getLadderDisplayName(selectedLadder)}</h2>
      <p style={{ fontSize: '0.9rem' }}>Current rankings and positions</p>
      
      {/* Ladder Selector */}
      <div className="ladder-selector" style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <label style={{ 
          color: '#fff', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontSize: '0.9rem'
        }}>Select Ladder:</label>
        <select 
          value={selectedLadder} 
          onChange={(e) => {
            setSelectedLadder(e.target.value);
            setHasManuallySelectedLadder(true);
          }}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            minWidth: '120px',
            flexShrink: 0
          }}
        >
          <option value="499-under">499 & Under</option>
          <option value="500-549">500-549</option>
          <option value="550-plus">550+</option>
        </select>
      </div>
    </div>
  );
});

LadderHeader.displayName = 'LadderHeader';

export default LadderHeader;
