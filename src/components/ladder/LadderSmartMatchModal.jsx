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

    // Filter defenders by ladder
    const sameLadderDefenders = defenders.filter(defender => 
      defender.ladderName === challenger.ladderName
    );

    // Challenge Match suggestions (up to 4 spots above)
    const challengeTargets = sameLadderDefenders.filter(defender => 
      defender.position < challenger.position && 
      defender.position >= challenger.position - 4
    );

    challengeTargets.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'challenge');
      suggestions.push({
        defender,
        type: 'challenge',
        confidence,
        reason: `Challenge Match: ${defender.firstName} is ${challenger.position - defender.position} spots above you`,
        priority: 1
      });
    });

    // SmackDown suggestions (up to 5 spots below)
    const smackdownTargets = sameLadderDefenders.filter(defender => 
      defender.position > challenger.position && 
      defender.position <= challenger.position + 5
    );

    smackdownTargets.forEach(defender => {
      const confidence = calculateConfidence(challenger, defender, 'smackdown');
      suggestions.push({
        defender,
        type: 'smackdown',
        confidence,
        reason: `SmackDown Match: ${defender.firstName} is ${defender.position - challenger.position} spots below you`,
        priority: 2
      });
    });

    // Ladder Jump suggestions (if eligible)
    if (challenger.ladderName === '499-under' && challenger.position <= 3) {
      const higherLadderDefenders = defenders.filter(defender => 
        ['500-549', '550-plus'].includes(defender.ladderName)
      ).slice(-4); // Last 4 positions

      higherLadderDefenders.forEach(defender => {
        const confidence = calculateConfidence(challenger, defender, 'ladder-jump');
        suggestions.push({
          defender,
          type: 'ladder-jump',
          confidence,
          reason: `Ladder Jump: ${defender.firstName} is in ${defender.ladderName} ladder`,
          priority: 3
        });
      });
    }

    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Top 10 suggestions
  };

  const calculateConfidence = (challenger, defender, type) => {
    let confidence = 50; // Base confidence

    // Factor in position difference
    const positionDiff = Math.abs(challenger.position - defender.position);
    if (positionDiff <= 2) confidence += 20;
    else if (positionDiff <= 4) confidence += 10;

    // Factor in activity (recent matches)
    if (defender.recentMatches && defender.recentMatches.length > 0) {
      const lastMatch = new Date(defender.recentMatches[0].date);
      const daysSinceLastMatch = (new Date() - lastMatch) / (1000 * 60 * 60 * 24);
      if (daysSinceLastMatch <= 7) confidence += 15;
      else if (daysSinceLastMatch <= 30) confidence += 10;
    }

    // Factor in win rate
    if (defender.wins && defender.totalMatches) {
      const winRate = defender.wins / defender.totalMatches;
      if (winRate >= 0.6) confidence += 10;
      else if (winRate >= 0.4) confidence += 5;
    }

    // Factor in challenge type
    if (type === 'challenge') confidence += 5;
    else if (type === 'smackdown') confidence += 10;

    return Math.min(confidence, 95); // Cap at 95%
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
      'smackback': '🔄'
    };
    return icons[type] || '⚔️';
  };

  const getChallengeTypeName = (type) => {
    const names = {
      'challenge': 'Challenge Match',
      'smackdown': 'SmackDown Match',
      'ladder-jump': 'Ladder Jump',
      'smackback': 'SmackBack Match'
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
      >
        <div style={{ padding: '20px' }}>
          {/* Header Info */}
          <div style={{ 
            background: 'rgba(255, 68, 68, 0.1)', 
            border: '1px solid rgba(255, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <h3 style={{ color: '#ff4444', margin: '0 0 8px 0', textAlign: 'center' }}>
              Smart Match Suggestions
            </h3>
            <p style={{ color: '#e0e0e0', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>
              AI-powered suggestions based on ladder rules, player activity, and match history
            </p>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ 
                border: '4px solid #333', 
                borderTop: '4px solid #ff4444', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: '#9ca3af' }}>
                Analyzing ladder data and generating suggestions...
              </p>
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤔</div>
              <h3 style={{ marginBottom: '8px' }}>No Suggestions Available</h3>
              <p>No suitable opponents found for smart match suggestions.</p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div>
              <h4 style={{ color: '#ffc107', marginBottom: '16px' }}>
                Top Suggestions ({suggestions.length})
              </h4>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.defender._id}-${suggestion.type}`}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 68, 68, 0.1)';
                      e.target.style.borderColor = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                      e.target.style.borderColor = '#444';
                    }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {getChallengeTypeIcon(suggestion.type)}
                        </span>
                        <div>
                          <h4 style={{ color: '#fff', margin: '0 0 4px 0' }}>
                            {suggestion.defender.firstName} {suggestion.defender.lastName}
                          </h4>
                          <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
                            Position {suggestion.defender.position} • {suggestion.defender.ladderName}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          background: getConfidenceColor(suggestion.confidence),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {getConfidenceText(suggestion.confidence)} ({suggestion.confidence}%)
                        </div>
                      </div>
                    </div>
                    
                    <p style={{ color: '#e0e0e0', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                      {suggestion.reason}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(255, 68, 68, 0.2)',
                        color: '#ff4444',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {getChallengeTypeName(suggestion.type)}
                      </span>
                      
                      {suggestion.defender.recentMatches && suggestion.defender.recentMatches.length > 0 && (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          Active Player
                        </span>
                      )}
                      
                      {suggestion.defender.wins && suggestion.defender.totalMatches && (
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
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

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '12px 24px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
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

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default LadderSmartMatchModal;
