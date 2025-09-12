import React, { memo } from 'react';
import { formatDateForMountainTime } from '../../utils/dateUtils';

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
          <div className="header-cell" style={window.innerWidth <= 768 ? { 
           transform: 'translateX(-8px) !important', 
           marginLeft: '0px !important', 
           paddingLeft: '0px !important',
           marginRight: '0px !important',
           paddingRight: '0px !important',
           position: 'relative !important'
         } : {}}>Rank</div>
        <div className="header-cell" style={{ paddingLeft: window.innerWidth <= 768 ? '10px' : '40px' }}>Player</div>
        <div className="header-cell" style={window.innerWidth <= 768 ? { 
          transform: 'translateX(18px)', 
          marginLeft: '12px', 
          paddingLeft: '12px',
          position: 'relative'
        } : {}}>Fargo</div>
        <div className="header-cell" style={window.innerWidth <= 768 ? { 
          transform: 'translateX(18px)', 
          marginLeft: '12px', 
          paddingLeft: '12px',
          position: 'relative',
          textAlign: 'center'
        } : {}}>W</div>
        <div className="header-cell" style={window.innerWidth <= 768 ? { 
          transform: 'translateX(18px)', 
          marginLeft: '12px', 
          paddingLeft: '12px',
          position: 'relative',
          textAlign: 'center'
        } : {}}>L</div>
        {isPublicView && window.innerWidth > 768 ? (
          <div className="header-cell">Last Match</div>
        ) : isPublicView && window.innerWidth <= 768 ? (
           <div className="header-cell" style={{
             transform: 'translateX(-20px)',
             marginLeft: '-15px',
             paddingLeft: '2px',
             position: 'relative',
             textAlign: 'left'
           }}>Last Match</div>
        ) : (
          <div className="header-cell">Status</div>
        )}
          {!isPublicView && <div className="header-cell" style={{ whiteSpace: window.innerWidth <= 768 ? 'normal' : 'nowrap', wordBreak: 'keep-all', paddingLeft: window.innerWidth <= 768 ? '10px' : '140px' }}>Last Match</div>}
        </div>
        
        {/* Match Fee Information */}
        {!isPublicView && (
          <div className="match-fee-info-bar" style={{
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
          <div key={player._id || index} className={`table-row ${player.lastMatch && player.lastMatch.opponent ? 'has-last-match' : ''}`}>
            <div className="table-cell rank">#{player.position}</div>
            <div className="table-cell name">
              <div 
                className="player-name-clickable"
                onClick={() => handlePlayerClick(player)}
              >
                {(() => {
                  const firstName = player.firstName || '';
                  const lastName = player.lastName || '';
                  
                  if (isPublicView) {
                    // Public view: show only last initial
                    const lastNameInitial = lastName ? lastName.charAt(0) + '.' : '';
                    
                    // If first name is too long (more than 8 characters), truncate it more aggressively
                    if (firstName.length > 8) {
                      return firstName.substring(0, 6) + '.. ' + lastNameInitial;
                    }
                    
                    // If total name length is too long, truncate first name
                    const fullName = firstName + ' ' + lastNameInitial;
                    if (fullName.length > 12) {
                      return firstName.substring(0, Math.max(4, 12 - lastNameInitial.length - 3)) + '.. ' + lastNameInitial;
                    }
                    
                    return fullName;
                  } else {
                    // Logged-in view: show full last name
                    return firstName + ' ' + lastName;
                  }
                })()}
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
            <div className="table-cell fargo" style={window.innerWidth <= 768 ? { 
              transform: 'translateX(15px)', 
              marginLeft: '10px', 
              paddingLeft: '10px',
              position: 'relative'
            } : {}}>{player.fargoRate === 0 ? "No FargoRate" : player.fargoRate}</div>
            <div className="table-cell wins" style={window.innerWidth <= 768 ? { 
              transform: 'translateX(12px)', 
              marginLeft: '8px', 
              paddingLeft: '8px',
              position: 'relative',
              textAlign: 'center'
            } : {}}>{player.wins || 0}</div>
            <div className="table-cell losses" style={window.innerWidth <= 768 ? { 
              transform: 'translateX(12px)', 
              marginLeft: '8px', 
              paddingLeft: '8px',
              position: 'relative',
              textAlign: 'center'
            } : {}}>{player.losses || 0}</div>
            {isPublicView && window.innerWidth > 768 ? (
              <div className="table-cell last-match">
                {player.lastMatch ? (
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: player.lastMatch.result === 'W' ? '#4CAF50' : '#f44336' }}>
                    {player.lastMatch.result === 'W' ? 'W' : 'L'} vs {
                      isPublicView ? 
                        (() => {
                          const parts = player.lastMatch.opponent.split(' ');
                          if (parts.length >= 2) {
                            return parts[0] + ' ' + parts[1].charAt(0) + '.';
                          }
                          return player.lastMatch.opponent;
                        })() :
                        player.lastMatch.opponent
                    }
                  </div>
                ) : (
                  <span style={{ color: '#999', fontSize: '0.9rem' }}>No matches</span>
                )}
              </div>
             ) : isPublicView && window.innerWidth <= 768 ? (
               <div className="table-cell last-match-mobile" style={{
                 padding: '0 3px',
                 fontSize: '0.5rem'
               }}>
                 {player.lastMatch && player.lastMatch.opponent ? (
                   <div className="last-match-mobile-details">
                     <div className="last-match-result-mobile" style={{
                       fontWeight: 'bold',
                       color: player.lastMatch.result === 'W' ? '#4CAF50' : '#f44336',
                       fontSize: '0.5rem'
                     }}>
                       {player.lastMatch.result === 'W' ? 'W' : 'L'} vs {
                         isPublicView ?
                           (() => {
                             const parts = player.lastMatch.opponent.split(' ');
                             if (parts.length >= 2) {
                               return parts[0] + ' ' + parts[1].charAt(0) + '.';
                             }
                             return player.lastMatch.opponent;
                           })() :
                           player.lastMatch.opponent
                       }
                     </div>
                   </div>
                 ) : (
                   <span className="no-matches-mobile" style={{ 
                     color: '#999', 
                     fontSize: '0.7rem' 
                   }}>No matches</span>
                 )}
               </div>
            ) : (
              <div className="table-cell status">
                {(() => {
                  const playerStatus = getPlayerStatus(player);
                  return <span className={playerStatus.className}>{playerStatus.text}</span>;
                })()}
              </div>
            )}
            {!isPublicView && (
              <div className="table-cell last-match">
                {player.lastMatch ? (
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 'bold', color: player.lastMatch.result === 'W' ? '#4CAF50' : '#f44336' }}>
                      {player.lastMatch.result === 'W' ? 'W' : 'L'} vs {player.lastMatch.opponent}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>
                      {formatDateForMountainTime(player.lastMatch.date)}
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
