import React, { memo } from 'react';

const LadderTable = memo(({
  ladderData,
  isPublicView,
  userLadderData,
  canChallengePlayer,
  getChallengeReason,
  handleChallengePlayer,
  handlePlayerClick,
  getPlayerStatus,
  isPositionClaimed,
  selectedLadder
}) => {
  return (
    <div className="ladder-table-modal">
      <div className={`ladder-table ${!isPublicView ? 'logged-in-view' : ''}`} style={{ position: 'relative' }}>
        <div className="table-header">
          <div className="header-cell">Rank</div>
          <div className="header-cell" style={{ paddingLeft: '40px' }}>Player</div>
          <div className="header-cell">FargoRate</div>
          <div className="header-cell">W</div>
          <div className="header-cell">L</div>
          <div className="header-cell">Status</div>
          {!isPublicView && <div className="header-cell" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', paddingLeft: '140px' }}>Last Match</div>}
        </div>
        
        {/* Match Fee Information */}
        {!isPublicView && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            margin: '8px 0',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#e0e0e0'
          }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>💰 Match Fee Info:</span>
            <span style={{ marginLeft: '8px' }}>
              Winner reports match and pays <strong>$5 match fee</strong> (one fee per match, not per player)
            </span>
          </div>
        )}
        
        {ladderData.map((player, index) => (
          <div key={player._id || index} className="table-row">
            <div className="table-cell rank">#{player.position}</div>
            <div className="table-cell name">
              <div 
                className="player-name-clickable"
                onClick={() => handlePlayerClick(player)}
              >
                {player.firstName} {player.lastName}
                {!isPublicView && !player.unifiedAccount?.hasUnifiedAccount && <span className="no-account">*</span>}
              </div>
              
              {/* Show claimed status for positions that have been claimed (only when not in public view) */}
              {!isPublicView && isPositionClaimed({
                ladder: selectedLadder,
                position: player.position
              }) && (
                <div style={{
                  display: 'inline-block',
                  width: 'fit-content',
                  flexShrink: '0'
                }}>
                  <div style={{
                    background: '#4CAF50',
                    color: 'white',
                    borderRadius: '1px',
                    padding: '0px',
                    fontSize: '0.6rem',
                    marginTop: '0px',
                    fontWeight: '400',
                    textAlign: 'center',
                    height: '12px',
                    lineHeight: '12px',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    width: '45px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                  }}>
                    ✅ Claimed
                  </div>
                </div>
              )}
              
              {userLadderData?.canChallenge && (
                <div style={{ marginTop: '4px' }}>
                  {canChallengePlayer(userLadderData, player) ? (
                    <>
                      <button
                        onClick={() => handleChallengePlayer(player, 'challenge')}
                        style={{
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          marginRight: '4px'
                        }}
                      >
                        Challenge
                      </button>
                      <button
                        onClick={() => handleChallengePlayer(player, 'smackdown')}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        SmackDown
                      </button>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '0.6rem',
                      color: '#888',
                      fontStyle: 'italic',
                      marginTop: '2px'
                    }}>
                      {getChallengeReason(userLadderData, player)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="table-cell fargo">{player.fargoRate === 0 ? "No FargoRate" : player.fargoRate}</div>
            <div className="table-cell wins">{player.wins || 0}</div>
            <div className="table-cell losses">{player.losses || 0}</div>
            <div className="table-cell status">
              {(() => {
                const playerStatus = getPlayerStatus(player);
                return <span className={playerStatus.className}>{playerStatus.text}</span>;
              })()}
            </div>
            {!isPublicView && (
              <div className="table-cell last-match">
                {player.lastMatch ? (
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 'bold', color: player.lastMatch.result === 'W' ? '#4CAF50' : '#f44336' }}>
                      {player.lastMatch.result === 'W' ? 'W' : 'L'} vs {player.lastMatch.opponent}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>
                      {new Date(player.lastMatch.date).toLocaleDateString()}
                    </div>
                    {player.lastMatch.venue && (
                      <div style={{ color: '#888', fontSize: '0.65rem' }}>
                        {player.lastMatch.venue}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#999', fontSize: '0.8rem' }}>No matches</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

LadderTable.displayName = 'LadderTable';

export default LadderTable;
