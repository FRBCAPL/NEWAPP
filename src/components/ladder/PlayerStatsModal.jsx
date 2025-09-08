import React, { createPortal, memo } from 'react';

const PlayerStatsModal = memo(({
  showMobilePlayerStats,
  selectedPlayerForStats,
  setShowMobilePlayerStats,
  updatedPlayerData,
  lastMatchData,
  playerMatchHistory,
  showFullMatchHistory,
  setShowFullMatchHistory,
  getPlayerStatus,
  fetchUpdatedPlayerData,
  setShowUnifiedSignup,
  isPublicView
}) => {
  if (!showMobilePlayerStats || !selectedPlayerForStats) return null;

  const modalContent = (
    <div 
      className="player-stats-modal"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(5px)',
        padding: '10px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transform: 'none'
      }}
    >
      <div 
        className="player-stats-content"
        style={{
          background: 'rgba(35, 35, 42, 0.16)',
          borderRadius: '18px',
          maxWidth: '95vw',
          width: window.innerWidth <= 768 ? '320px' : '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 32px #e53e3e22, 0 0 16px #e53e3e11',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <div className="player-stats-header">
          <h3>{selectedPlayerForStats.firstName} {selectedPlayerForStats.lastName}</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                console.log('🔄 Refreshing player data...');
                fetchUpdatedPlayerData(selectedPlayerForStats);
              }}
              style={{
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid #ff4444',
                color: '#ff4444',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Refresh player stats"
            >
              🔄
            </button>
            <button 
              className="stats-close-btn"
              onClick={() => setShowMobilePlayerStats(false)}
            >
              ×
            </button>
          </div>
        </div>

        {/* Claim Button - Show if player needs to claim their ladder account */}
        {!selectedPlayerForStats.unifiedAccount?.hasUnifiedAccount && (
          <div style={{ 
            padding: '0 20px 15px 20px',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowUnifiedSignup(true)}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#45a049';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#4CAF50';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ✅ Complete Profile & Subscribe ($5/month)
            </button>
            <p style={{ 
              fontSize: '12px', 
              color: '#888', 
              margin: '8px 0 0 0',
              fontStyle: 'italic'
            }}>
              Verify your profile details and subscribe for full ladder access
            </p>
          </div>
        )}
        
        <div className="player-stats-body">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Left Column - Basic Stats */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Rank</div>
                  <div className="stat-value">#{(updatedPlayerData || selectedPlayerForStats).position}</div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">FargoRate</div>
                  <div className="stat-value">
                    {(updatedPlayerData || selectedPlayerForStats).fargoRate === 0 ? "No FargoRate" : (updatedPlayerData || selectedPlayerForStats).fargoRate}
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">Wins</div>
                  <div className="stat-value wins">
                    {(() => {
                      const playerData = updatedPlayerData || selectedPlayerForStats;
                      console.log('🔍 Displaying wins for player:', playerData.firstName, playerData.lastName, 'wins:', playerData.wins);
                      return playerData.wins || 0;
                    })()}
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">Losses</div>
                  <div className="stat-value losses">
                    {(() => {
                      const playerData = updatedPlayerData || selectedPlayerForStats;
                      console.log('🔍 Displaying losses for player:', playerData.firstName, playerData.lastName, 'losses:', playerData.losses);
                      return playerData.losses || 0;
                    })()}
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">Status</div>
                  <div className="stat-value status">
                    {(() => {
                      const playerStatus = getPlayerStatus(selectedPlayerForStats);
                      return <span className={playerStatus.className}>{playerStatus.text}</span>;
                    })()}
                  </div>
                </div>
                
                {selectedPlayerForStats.immunityUntil && new Date(selectedPlayerForStats.immunityUntil) > new Date() && (
                  <div className="stat-item">
                    <div className="stat-label">Immunity Until</div>
                    <div className="stat-value">
                      {new Date(selectedPlayerForStats.immunityUntil).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Match History */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div className="stat-item">
                <div className="stat-label">Last Match</div>
                <div className="stat-value">
                  {lastMatchData ? (
                    <div className="last-match-info">
                      <div className="match-opponent">
                        vs {lastMatchData.opponentName}
                      </div>
                      <div className={`match-result ${lastMatchData.result === 'W' ? 'win' : 'loss'}`}>
                        {lastMatchData.result === 'W' ? 'Won' : 'Lost'} {lastMatchData.score}
                      </div>
                      <div className="match-type">
                        {lastMatchData.matchType === 'challenge' ? 'Challenge Match' :
                         lastMatchData.matchType === 'ladder-jump' ? 'Ladder Jump' :
                         lastMatchData.matchType === 'smackdown' ? 'SmackDown' :
                         lastMatchData.matchType === 'smackback' ? 'SmackBack' :
                         lastMatchData.matchType}
                      </div>
                      <div className="player-role">
                        {lastMatchData.playerRole === 'challenger' ? 'Challenger' :
                         lastMatchData.playerRole === 'defender' ? 'Defender' :
                         'Player'}
                      </div>
                      <div className="match-date">
                        {new Date(lastMatchData.matchDate).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <span className="no-match">No recent matches</span>
                  )}
                </div>
              </div>
              
              {/* Match History Section */}
              <div className="stat-item">
                <div className="stat-label">Match History</div>
                <div className="stat-value">
                  {playerMatchHistory.length > 1 ? (
                    <div className="match-history-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {/* Show previous 2 matches (skip the first one since it's shown in Last Match) */}
                      {playerMatchHistory.slice(1, 3).map((match, index) => (
                        <div key={index} className="match-history-item" style={{ 
                          padding: '6px', 
                          borderBottom: '1px solid rgba(255,255,255,0.1)', 
                          fontSize: '11px',
                          marginBottom: '2px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`match-result ${match.result === 'W' ? 'win' : 'loss'}`}>
                              {match.result === 'W' ? 'W' : 'L'}
                            </span>
                            <span style={{ color: '#ccc' }}>
                              vs {match.opponentName}
                            </span>
                            <span style={{ color: '#888', fontSize: '10px' }}>
                              {new Date(match.matchDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                            {match.score} • {match.matchType}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show More button if there are more than 3 total matches */}
                      {playerMatchHistory.length > 3 && (
                        <div style={{ textAlign: 'center', padding: '8px' }}>
                          <button 
                            onClick={() => {
                              console.log('🔍 Show More button clicked! Setting showFullMatchHistory to true');
                              console.log('🔍 Current showFullMatchHistory state:', showFullMatchHistory);
                              setShowMobilePlayerStats(false); // Close the player stats modal
                              setShowFullMatchHistory(true);
                              console.log('🔍 After setting showFullMatchHistory to true');
                            }}
                            style={{
                              background: 'rgba(255, 68, 68, 0.2)',
                              border: '1px solid #ff4444',
                              color: '#ff4444',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Show More ({playerMatchHistory.length - 3} more)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : playerMatchHistory.length === 1 ? (
                    <span className="no-match">No previous matches</span>
                  ) : (
                    <span className="no-match">No match history</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // For public view (embedded), render inline; for regular view, use portal
  if (isPublicView) {
    return modalContent;
  } else {
    return createPortal(modalContent, document.body);
  }
});

PlayerStatsModal.displayName = 'PlayerStatsModal';

export default PlayerStatsModal;
