import React, { useState, useEffect } from 'react';
import DraggableModal from '../modal/DraggableModal';
import LadderChallengeModal from './LadderChallengeModal';
import './LadderSmartMatchModal.css';

const LadderSmartMatchModal = ({ 
  isOpen, 
  onClose, 
  challenger, 
  availableDefenders = [],
  onChallengeComplete 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDefender, setSelectedDefender] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeType, setChallengeType] = useState('challenge');

  useEffect(() => {
    if (isOpen && challenger && availableDefenders.length > 0) {
      generateSuggestions();
    }
  }, [isOpen, challenger, availableDefenders]);

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate smart suggestions based on ladder rules
      const smartSuggestions = generateSmartSuggestions(challenger, availableDefenders);
      setSuggestions(smartSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartSuggestions = (challenger, defenders) => {
    const suggestions = [];
    
    // Debug logging (can be removed in production)
    // console.log('🧠 Smart Match Debug:', { challenger, defenders: defenders.length });

    // Filter defenders by ladder
    // Challenger has 'ladder' property, defenders have 'ladderName' property
    const challengerLadder = challenger.ladder || challenger.ladderName;
    const sameLadderDefenders = defenders.filter(defender => 
      defender.ladderName === challengerLadder
    );
    
    // console.log('Same ladder defenders:', sameLadderDefenders.length);

    // Enhanced Challenge Match suggestions (up to 4 spots above)
    const challengeTargets = sameLadderDefenders.filter(defender => 
      defender.position < challenger.position && 
      defender.position >= challenger.position - 4
    );
    
    // console.log('Challenge targets:', challengeTargets.length);

    challengeTargets.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'challenge');
      const positionDiff = challenger.position - defender.position;
      let reason = `Challenge Match: ${defender.firstName} is ${positionDiff} spot${positionDiff > 1 ? 's' : ''} above you`;
      
      // Add smart reasoning
      if (positionDiff === 1) {
        reason += ' - Perfect for a quick climb!';
      } else if (positionDiff === 2) {
        reason += ' - Great opportunity to advance';
      } else if (positionDiff >= 3) {
        reason += ' - High reward challenge';
      }

      suggestions.push({
        defender,
        type: 'challenge',
        confidence,
        reason,
        priority: 1,
        positionDiff
      });
    });

    // Enhanced SmackDown suggestions (up to 5 spots below)
    const smackdownTargets = sameLadderDefenders.filter(defender => 
      defender.position > challenger.position && 
      defender.position <= challenger.position + 5
    );

    smackdownTargets.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'smackdown');
      const positionDiff = defender.position - challenger.position;
      let reason = `SmackDown Match: ${defender.firstName} is ${positionDiff} spot${positionDiff > 1 ? 's' : ''} below you`;
      
      // Add smart reasoning
      if (positionDiff === 1) {
        reason += ' - Defend your position';
      } else if (positionDiff <= 3) {
        reason += ' - Maintain your ranking';
      } else {
        reason += ' - Show your dominance';
      }

      suggestions.push({
        defender,
        type: 'smackdown',
        confidence,
        reason,
        priority: 2,
        positionDiff
      });
    });

    // Enhanced Ladder Jump suggestions (if eligible)
    if (challenger.ladderName === '499-under' && challenger.position <= 3) {
      const higherLadderDefenders = defenders.filter(defender => 
        ['500-549', '550-plus'].includes(defender.ladderName)
      ).slice(-4); // Last 4 positions

      higherLadderDefenders.forEach(defender => {
        const confidence = calculateConfidence(challenger, defender, 'ladder-jump');
        const reason = `Ladder Jump: ${defender.firstName} is in ${defender.ladderName} ladder - Big opportunity to advance!`;
        
        suggestions.push({
          defender,
          type: 'ladder-jump',
          confidence,
          reason,
          priority: 3
        });
      });
    }

    // Add "Hot Streak" suggestions for active players
    const activePlayers = sameLadderDefenders.filter(defender => 
      defender.recentMatches && 
      defender.recentMatches.length > 0 &&
      new Date(defender.recentMatches[0].date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
    );

    activePlayers.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'hot-streak');
      const daysSinceLastMatch = Math.floor((new Date() - new Date(defender.recentMatches[0].date)) / (1000 * 60 * 60 * 24));
      const reason = `Hot Streak: ${defender.firstName} played ${daysSinceLastMatch} day${daysSinceLastMatch !== 1 ? 's' : ''} ago - Strike while they're active!`;
      
      suggestions.push({
        defender,
        type: 'hot-streak',
        confidence,
        reason,
        priority: 4
      });
    });

    // Add "Rising Star" suggestions for players with good win rates
    const risingStars = sameLadderDefenders.filter(defender => 
      defender.wins && 
      defender.totalMatches && 
      (defender.wins / defender.totalMatches) >= 0.6 &&
      defender.totalMatches >= 3
    );

    risingStars.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'rising-star');
      const winRate = Math.round((defender.wins / defender.totalMatches) * 100);
      const reason = `Rising Star: ${defender.firstName} has a ${winRate}% win rate - Test your skills!`;
      
      suggestions.push({
        defender,
        type: 'rising-star',
        confidence,
        reason,
        priority: 5
      });
    });

    // Sort by priority and confidence
    const finalSuggestions = suggestions
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Top 10 suggestions
    
    console.log('Final suggestions:', finalSuggestions.length);
    console.log('Final suggestions:', finalSuggestions);
    
    return finalSuggestions;
  };

  const calculateConfidence = (challenger, defender, type) => {
    let confidence = 50; // Base confidence

    // Factor in position difference (more nuanced)
    const positionDiff = Math.abs(challenger.position - defender.position);
    if (positionDiff === 1) confidence += 25; // Adjacent positions are ideal
    else if (positionDiff === 2) confidence += 20;
    else if (positionDiff === 3) confidence += 15;
    else if (positionDiff <= 5) confidence += 10;
    else if (positionDiff <= 8) confidence += 5;

    // Factor in activity (recent matches) - more detailed
    if (defender.recentMatches && defender.recentMatches.length > 0) {
      const lastMatch = new Date(defender.recentMatches[0].date);
      const daysSinceLastMatch = (new Date() - lastMatch) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastMatch <= 1) confidence += 20; // Very recent
      else if (daysSinceLastMatch <= 3) confidence += 18;
      else if (daysSinceLastMatch <= 7) confidence += 15;
      else if (daysSinceLastMatch <= 14) confidence += 12;
      else if (daysSinceLastMatch <= 30) confidence += 8;
      else if (daysSinceLastMatch <= 60) confidence += 3;
      else confidence -= 5; // Inactive players
    } else {
      confidence -= 10; // No recent matches
    }

    // Factor in win rate (more sophisticated)
    if (defender.wins && defender.totalMatches) {
      const winRate = defender.wins / defender.totalMatches;
      const totalMatches = defender.totalMatches;
      
      if (totalMatches >= 10) { // Established player
        if (winRate >= 0.7) confidence += 15;
        else if (winRate >= 0.6) confidence += 12;
        else if (winRate >= 0.5) confidence += 8;
        else if (winRate >= 0.4) confidence += 3;
        else confidence -= 5;
      } else if (totalMatches >= 5) { // Developing player
        if (winRate >= 0.6) confidence += 10;
        else if (winRate >= 0.4) confidence += 5;
        else confidence -= 2;
      } else { // New player
        confidence += 5; // Give new players a chance
      }
    }

    // Factor in challenge type (enhanced)
    switch (type) {
      case 'challenge':
        confidence += 8; // Standard challenge
        break;
      case 'smackdown':
        confidence += 12; // Defensive match
        break;
      case 'ladder-jump':
        confidence += 15; // High reward
        break;
      case 'hot-streak':
        confidence += 18; // Active player
        break;
      case 'rising-star':
        confidence += 10; // Good opponent
        break;
      default:
        confidence += 5;
    }

    // Factor in ladder level
    if (challenger.ladderName === defender.ladderName) {
      confidence += 5; // Same ladder is preferred
    }

    // Factor in player experience (if available)
    if (defender.totalMatches) {
      if (defender.totalMatches >= 20) confidence += 3; // Experienced
      else if (defender.totalMatches >= 10) confidence += 2;
      else if (defender.totalMatches >= 5) confidence += 1;
    }

    // Factor in recent performance trend (if we have multiple recent matches)
    if (defender.recentMatches && defender.recentMatches.length >= 3) {
      const recentWins = defender.recentMatches.slice(0, 3).filter(match => 
        match.winner === defender.email || match.winner === defender.firstName
      ).length;
      
      if (recentWins >= 2) confidence += 8; // Hot streak
      else if (recentWins === 1) confidence += 3; // Mixed
      else confidence -= 5; // Cold streak
    }

    // Factor in time of day (if we want to consider optimal match times)
    const currentHour = new Date().getHours();
    if (currentHour >= 18 && currentHour <= 22) {
      confidence += 3; // Evening is good for matches
    } else if (currentHour >= 12 && currentHour <= 17) {
      confidence += 2; // Afternoon is decent
    }

    return Math.min(Math.max(confidence, 10), 95); // Cap between 10% and 95%
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedDefender(suggestion.defender);
    setChallengeType(suggestion.type);
    setShowChallengeModal(true);
  };

  const handleClose = () => {
    setSuggestions([]);
    setSelectedDefender(null);
    setShowChallengeModal(false);
    onClose();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#10b981'; // Green for high confidence
    if (confidence >= 60) return '#f59e0b'; // Amber for medium confidence
    return '#6b7280'; // Gray for low confidence
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  const getChallengeTypeIcon = (type) => {
    const icons = {
      'challenge': '⚔️',
      'smackdown': '💥',
      'ladder-jump': '🆙',
      'smackback': '🔄',
      'hot-streak': '🔥',
      'rising-star': '⭐'
    };
    return icons[type] || '⚔️';
  };

  const getChallengeTypeName = (type) => {
    const names = {
      'challenge': '⚔️ Challenge Match',
      'smackdown': '💥 SmackDown Match',
      'ladder-jump': '🆙 Ladder Jump',
      'smackback': '🔄 SmackBack Match',
      'hot-streak': '🔥 Hot Streak',
      'rising-star': '⭐ Rising Star'
    };
    return names[type] || type;
  };

  if (!isOpen) return null;

  return (
    <>
      <DraggableModal
        open={true}
        onClose={handleClose}
        title={`🧠 Smart Match: ${challenger.firstName} ${challenger.lastName}`}
        maxWidth="700px"
        className="ladder-smart-match-modal"
        borderColor="#5b21b6"
        glowColor="#5b21b6"
      >
        <div className="ladder-smart-match-content">
          {/* Header Info */}
          <div className="ladder-smart-match-header">
            <h3 className="ladder-smart-match-title">
              Smart Match Suggestions
            </h3>
            <p className="ladder-smart-match-subtitle">
              AI-powered suggestions based on ladder rules, player activity, and match history
            </p>
          </div>

          {loading && (
            <div className="ladder-smart-match-loading">
              <div className="ladder-smart-match-spinner"></div>
              <p className="ladder-smart-match-loading-text">
                Analyzing ladder data and generating suggestions...
              </p>
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="ladder-smart-match-empty">
              <div className="ladder-smart-match-empty-icon">🤔</div>
              <h3 className="ladder-smart-match-empty-title">No Suggestions Available</h3>
              <p className="ladder-smart-match-empty-message">No suitable opponents found for smart match suggestions.</p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="ladder-smart-match-suggestions">
              <h4 className="ladder-smart-match-suggestions-title">
                Top Suggestions ({suggestions.length})
              </h4>
              
              <div className="ladder-smart-match-suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.defender._id}-${suggestion.type}`}
                    className="ladder-smart-match-suggestion"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="ladder-smart-match-suggestion-header">
                      <div className="ladder-smart-match-suggestion-info">
                        <span className="ladder-smart-match-suggestion-icon">
                          {getChallengeTypeIcon(suggestion.type)}
                        </span>
                        <div>
                          <h4 className="ladder-smart-match-suggestion-title">
                            {suggestion.defender.firstName} {suggestion.defender.lastName}
                            {!suggestion.defender.unifiedAccount?.hasUnifiedAccount && (
                              <span className="ladder-smart-match-asterisk" title="Incomplete profile - limited contact options">
                                *
                              </span>
                            )}
                          </h4>
                          <p className="ladder-smart-match-suggestion-details">
                            Position {suggestion.defender.position} • {suggestion.defender.ladderName}
                            {!suggestion.defender.unifiedAccount?.hasUnifiedAccount && (
                              <span className="ladder-smart-match-profile-warning">
                                {' '}• Incomplete Profile
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ladder-smart-match-confidence">
                        <div 
                          className="ladder-smart-match-confidence-badge"
                          style={{ background: getConfidenceColor(suggestion.confidence) }}
                        >
                          {getConfidenceText(suggestion.confidence)} ({suggestion.confidence}%)
                        </div>
                      </div>
                    </div>
                    
                    <p className="ladder-smart-match-suggestion-reason">
                      {suggestion.reason}
                    </p>
                    
                    <div className="ladder-smart-match-tags">
                      <span className={`ladder-smart-match-tag ladder-smart-match-tag-${suggestion.type}`}>
                        {getChallengeTypeName(suggestion.type)}
                      </span>
                      
                      {suggestion.defender.recentMatches && suggestion.defender.recentMatches.length > 0 && (
                        <span className="ladder-smart-match-tag ladder-smart-match-tag-success">
                          Active Player
                        </span>
                      )}
                      
                      {suggestion.defender.wins && suggestion.defender.totalMatches && (
                        <span className="ladder-smart-match-tag ladder-smart-match-tag-warning">
                          {Math.round((suggestion.defender.wins / suggestion.defender.totalMatches) * 100)}% Win Rate
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'rgba(255, 193, 7, 0.1)', 
                border: '1px solid rgba(255, 193, 7, 0.3)', 
                borderRadius: '4px',
                color: '#ffc107',
                fontSize: '0.9rem'
              }}>
                💡 <strong>Tip:</strong> Click on any suggestion to create a challenge. The confidence score indicates how likely the opponent is to respond positively.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            {/* Profile completion legend */}
            <div className="ladder-smart-match-legend">
              <p className="ladder-smart-match-legend-text">
                <span className="ladder-smart-match-asterisk">*</span> = Incomplete profile (limited contact options)
              </p>
            </div>

            <button
              onClick={handleClose}
              style={{
                padding: '12px 24px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginLeft: 'auto'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </DraggableModal>

      {/* Challenge Modal */}
      {showChallengeModal && selectedDefender && (
        <LadderChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          challenger={challenger}
          defender={selectedDefender}
          challengeType={challengeType}
          onChallengeComplete={(result) => {
            setShowChallengeModal(false);
            setSelectedDefender(null);
            if (onChallengeComplete) {
              onChallengeComplete(result);
            }
            handleClose();
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default LadderSmartMatchModal;
