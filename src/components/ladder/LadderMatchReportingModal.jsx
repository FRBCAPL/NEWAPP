import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';

const LadderMatchReportingModal = ({ 
  isOpen, 
  onClose, 
  playerName, 
  selectedLadder,
  onMatchReported 
}) => {
  const [pendingMatches, setPendingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Match reporting form state
  const [winner, setWinner] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  
  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [membership, setMembership] = useState(null);
  const [userPaymentHistory, setUserPaymentHistory] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPendingMatches();
      fetchMembershipStatus();
      loadPaymentMethods();
      loadUserPaymentData();
    }
  }, [isOpen, playerName, selectedLadder]);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        setAvailablePaymentMethods(data.paymentMethods);
        setPaymentConfig(data);
        if (data.paymentMethods.length > 0) {
          setPaymentMethod(data.paymentMethods[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch scheduled matches for this ladder
      const response = await fetch(`${BACKEND_URL}/api/ladder/front-range-pool-hub/ladders/${selectedLadder}/matches?status=scheduled`);
      
      if (response.ok) {
        const data = await response.json();
        // Filter matches to only show those involving the current player
        const playerMatches = (data.matches || []).filter(match => {
          const player1Email = match.player1?.email || match.player1?.unifiedAccount?.email;
          const player2Email = match.player2?.email || match.player2?.unifiedAccount?.email;
          return player1Email === playerName || player2Email === playerName;
        });
        
        // Transform the data to match the expected format
        const transformedMatches = playerMatches.map(match => ({
          _id: match._id,
          senderName: match.player1?.firstName + ' ' + match.player1?.lastName,
          receiverName: match.player2?.firstName + ' ' + match.player2?.lastName,
          date: match.scheduledDate ? new Date(match.scheduledDate).toISOString().split('T')[0] : '',
          time: match.scheduledDate ? new Date(match.scheduledDate).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }) : '',
          location: match.location || 'TBD',
          status: match.status,
          createdAt: match.createdAt || new Date().toISOString(),
          matchFormat: match.matchFormat,
          raceLength: match.raceLength
        }));
        
        setPendingMatches(transformedMatches);
      } else {
        console.error('Failed to fetch scheduled matches:', response.status, response.statusText);
        setPendingMatches([]);
      }
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      setError('Failed to load pending matches');
      setPendingMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/membership/${playerName}`);
      if (response.ok) {
        const data = await response.json();
        setMembership(data.membership);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const loadUserPaymentData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/user-payment-data/${playerName}`);
      if (response.ok) {
        const data = await response.json();
        setUserPaymentHistory(data.paymentHistory);
        setUserCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error loading user payment data:', error);
    }
  };

  const handleReportMatch = (match) => {
    setSelectedMatch(match);
    setWinner('');
    setScore('');
    setNotes('');
    setShowPaymentForm(false);
    setError('');
    setMessage('');
  };

  // Determine user trust level and payment method
  const getUserTrustLevel = () => {
    if (!userPaymentHistory) return 'new';
    
    const totalPayments = userPaymentHistory.totalPayments || 0;
    const failedPayments = userPaymentHistory.failedPayments || 0;
    const successRate = totalPayments > 0 ? (totalPayments - failedPayments) / totalPayments : 0;
    
    if (totalPayments >= 10 && successRate >= 0.95) return 'trusted';
    if (totalPayments >= 3 && successRate >= 0.8) return 'verified';
    return 'new';
  };

  const canUseCredits = () => {
    const matchFee = 5.00;
    return userCredits >= matchFee;
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    
    if (!winner || !score) {
      setError('Please select a winner and enter the score');
      return;
    }

    // Check if membership is active
    if (!membership || !membership.isActive) {
      setError('❌ Active membership required to report matches. Please renew your membership first.');
      setShowPaymentForm(true);
      return;
    }

    // Check if user can use credits
    if (canUseCredits()) {
      await submitMatchResultWithCredits();
    } else {
      setShowPaymentForm(true);
    }
  };

  const submitMatchResultWithCredits = async () => {
    try {
      // Deduct credits and submit match
      const response = await fetch(`${BACKEND_URL}/api/monetization/use-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerEmail: playerName,
          amount: 5.00,
          description: 'Ladder Match Fee'
        })
      });

      if (response.ok) {
        await submitMatchResult();
        setUserCredits(prev => prev - 5.00);
      } else {
        throw new Error('Failed to use credits');
      }
    } catch (error) {
      console.error('Credit payment error:', error);
      setError('Credit payment failed. Please try again.');
    }
  };

  const handleQuickPayment = async (paymentMethodId) => {
    setPaymentProcessing(true);
    setError('');

    try {
      const needsMembershipRenewal = !membership || !membership.isActive;
      const totalAmount = needsMembershipRenewal ? 10.00 : 5.00;
      
      // Create payment record(s)
      const paymentPromises = [];
      
      // Always record match fee
      paymentPromises.push(
        fetch(`${BACKEND_URL}/api/monetization/record-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'match_fee',
            email: playerName,
            playerName: playerName,
            amount: 5.00,
            paymentMethod: paymentMethodId,
            matchId: selectedMatch._id,
            playerId: playerName,
            notes: `Match fee for ${selectedMatch.senderName} vs ${selectedMatch.receiverName}`,
            status: 'completed'
          })
        })
      );
      
      // If membership is expired, also record membership renewal
      if (needsMembershipRenewal) {
        paymentPromises.push(
          fetch(`${BACKEND_URL}/api/monetization/record-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'membership',
              email: playerName,
              playerName: playerName,
              amount: 5.00,
              paymentMethod: paymentMethodId,
              playerId: playerName,
              notes: `Membership renewal for ${playerName}`,
              status: 'completed'
            })
          })
        );
      }
      
      // Wait for all payments to be recorded
      const responses = await Promise.all(paymentPromises);
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        const trustLevel = getUserTrustLevel();
        if (trustLevel === 'new') {
          setMessage('✅ Payment recorded! Your match is pending admin verification.');
          setTimeout(() => {
            onClose();
            onMatchReported();
          }, 2000);
        } else {
          // Submit match result after payments recorded
          await submitMatchResult();
        }
      } else {
        throw new Error('Failed to record payment(s)');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const submitMatchResult = async () => {
    try {
      setSubmitting(true);
      setError('');

      const matchData = {
        challengeId: selectedMatch._id,
        winner: winner,
        loser: winner === selectedMatch.senderName ? selectedMatch.receiverName : selectedMatch.senderName,
        score: score,
        notes: notes,
        reportedBy: playerName
      };

      const response = await fetch(`${BACKEND_URL}/api/challenges/report-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Match result reported successfully!');
        
        // Update local state
        setPendingMatches(prev => prev.filter(m => m._id !== selectedMatch._id));
        
        // Notify parent component
        if (onMatchReported) {
          onMatchReported(data.challenge);
        }
        
        // Close modal after delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report match result');
      }
    } catch (error) {
      console.error('Error reporting match result:', error);
      setError(error.message || 'Failed to report match result');
    } finally {
      setSubmitting(false);
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLadderDisplayName = (ladderName) => {
    switch (ladderName) {
      case '499-under': return '499 & Under';
      case '500-549': return '500-549';
      case '550-plus': return '550+';
      default: return ladderName;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prize-pool-modal">
      <div className="prize-pool-modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 style={{
            color: '#ff4444',
            margin: '0',
            fontSize: '1.8rem',
            textAlign: 'center'
          }}>
            🏓 Report Match Result
          </h2>
          
          <div style={{
            marginTop: '0.5rem',
            textAlign: 'center',
            color: '#ff4444',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            {getLadderDisplayName(selectedLadder)} Ladder
          </div>
          
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              left: '20px',
              background: 'none',
              border: 'none',
              color: '#ccc',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#ccc';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#ccc', marginTop: '1rem' }}>Loading pending matches...</p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: '6px',
                  padding: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#ffc107'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {message && (
                <div style={{
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '6px',
                  padding: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#4caf50'
                }}>
                  ✅ {message}
                </div>
              )}

              {/* Pending Matches List */}
              {!selectedMatch && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    📋 Pending Matches to Report
                  </h3>
                  
                  {pendingMatches.length === 0 ? (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#ccc'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
                      <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No pending matches!</div>
                      <div style={{ fontSize: '0.9rem' }}>All your matches have been reported.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {pendingMatches.map((match) => (
                        <div key={match._id} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onClick={() => handleReportMatch(match)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {match.senderName} vs {match.receiverName}
                              </div>
                              <div style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                📅 {formatDate(match.date)} at {match.time}
                              </div>
                              {match.location && (
                                <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                  📍 {match.location}
                                </div>
                              )}
                            </div>
                            <div style={{
                              background: 'rgba(255, 68, 68, 0.2)',
                              color: '#ff4444',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
                            }}>
                              Report Result
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Match Reporting Form */}
              {selectedMatch && !showPaymentForm && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    🏆 Report Match Result
                  </h3>
                  
                  {/* Match Details */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ color: '#fff', margin: '0 0 0.75rem 0' }}>Match Details</h4>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      <div><strong>{selectedMatch.senderName}</strong> vs <strong>{selectedMatch.receiverName}</strong></div>
                      <div>📅 {formatDate(selectedMatch.date)} at {selectedMatch.time}</div>
                      {selectedMatch.location && <div>📍 {selectedMatch.location}</div>}
                    </div>
                  </div>

                  {/* Match Fee Information */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>
                      💰 Match Fee Information
                    </div>
                    <div style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>
                      The <strong>winner</strong> reports the match and pays the <strong>$5 match fee</strong>.
                      <br />
                      <em>Only one $5 fee per match - not per player!</em>
                    </div>
                  </div>

                  {/* Reporting Form */}
                  <form onSubmit={handleSubmitResult}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Winner *
                      </label>
                      <select
                        value={winner}
                        onChange={(e) => setWinner(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                        required
                      >
                        <option value="">Select winner</option>
                        <option value={selectedMatch.senderName}>{selectedMatch.senderName}</option>
                        <option value={selectedMatch.receiverName}>{selectedMatch.receiverName}</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Score *
                      </label>
                      <input
                        type="text"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="e.g., 7-5, 9-3, etc."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes about the match..."
                        rows="3"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          fontSize: '1rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <button
                        type="submit"
                        disabled={submitting || !winner || !score}
                        style={{
                          background: 'rgba(255, 68, 68, 0.8)',
                          border: 'none',
                          color: '#fff',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          cursor: submitting || !winner || !score ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          opacity: submitting || !winner || !score ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!submitting && winner && score) {
                            e.target.style.background = 'rgba(255, 68, 68, 1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 68, 68, 0.8)';
                        }}
                      >
                        {submitting ? 'Submitting...' : '🏆 Report Match Result'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatch(null);
                          setWinner('');
                          setScore('');
                          setNotes('');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ccc',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.color = '#ccc';
                        }}
                      >
                        ← Back to Matches
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Streamlined Payment Form */}
              {showPaymentForm && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    💳 Payment Required - Membership & Match Fee
                  </h3>
                  
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ color: '#ffc107', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      ⚠️ Active Membership Required
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      {!membership || !membership.isActive ? 
                        'Your membership has expired. You need to renew your membership ($5/month) AND pay the match fee ($5) to report match results.' :
                        'Pay the $5 match fee to report your match result. Choose your preferred payment method below.'
                      }
                    </div>
                  </div>

                  {/* User Status & Credits */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>Account Status:</span>
                      <span style={{ 
                        color: getUserTrustLevel() === 'trusted' ? '#4caf50' : getUserTrustLevel() === 'verified' ? '#ff9800' : '#f44336',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontSize: '0.9rem'
                      }}>
                        {getUserTrustLevel() === 'trusted' ? '🟢 Instant Process' : getUserTrustLevel() === 'verified' ? '🟡 Auto Process' : '🔴 Needs Admin Approval'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#ccc' }}>Available Credits:</span>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>${userCredits.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Options */}
                  {canUseCredits() && (
                    <div style={{ 
                      background: 'rgba(76, 175, 80, 0.1)', 
                      border: '1px solid rgba(76, 175, 80, 0.3)', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1.5rem' 
                    }}>
                      <h3 style={{ color: '#4caf50', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>💳 Use Credits</h3>
                      <p style={{ color: '#ccc', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                        You have enough credits to pay for this match instantly!
                      </p>
                      <button
                        onClick={submitMatchResultWithCredits}
                        style={{
                          background: 'rgba(76, 175, 80, 0.8)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(76, 175, 80, 1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(76, 175, 80, 0.8)';
                        }}
                      >
                        💳 Pay with Credits ($5.00)
                      </button>
                    </div>
                  )}

                  {/* Buy Credits Option */}
                  {!canUseCredits() && (
                    <div style={{ 
                      background: 'rgba(33, 150, 243, 0.1)', 
                      border: '1px solid rgba(33, 150, 243, 0.3)', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1.5rem' 
                    }}>
                      <h3 style={{ color: '#2196f3', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>💳 Buy Credits for Instant Payment</h3>
                      <p style={{ color: '#ccc', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                        Purchase credits to pay for matches instantly without verification!
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            // This would open the payment dashboard
                            window.open('/ladder', '_blank');
                          }}
                          style={{
                            background: 'rgba(33, 150, 243, 0.8)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            flex: 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(33, 150, 243, 1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(33, 150, 243, 0.8)';
                          }}
                        >
                          💳 Buy Credits
                        </button>
                        <div style={{ 
                          color: '#2196f3', 
                          fontSize: '0.9rem', 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '0.75rem 0'
                        }}>
                          Current: ${userCredits.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                      💰 Payment Summary
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#ccc' }}>Match Fee:</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>$5.00</span>
                    </div>
                    {(!membership || !membership.isActive) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ccc' }}>Membership Renewal:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>$5.00</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.5rem' }}>
                      <span style={{ color: '#ccc', fontWeight: 'bold' }}>Total:</span>
                      <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${(!membership || !membership.isActive) ? '10.00' : '5.00'}
                      </span>
                    </div>
                    {getUserTrustLevel() === 'new' && (
                      <div style={{ 
                        background: 'rgba(255, 152, 0, 0.1)', 
                        border: '1px solid rgba(255, 152, 0, 0.3)', 
                        borderRadius: '6px', 
                        padding: '0.75rem', 
                        marginTop: '1rem' 
                      }}>
                        <p style={{ color: '#ff9800', margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          ⚠️ New users require admin verification for payments
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods Grid */}
                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {availablePaymentMethods.map((method) => (
                      <div key={method.id} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '1rem',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {method.name}
                            </div>
                            <div style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                              {method.instructions}
                            </div>
                            {method.username && (
                              <div style={{ color: '#4caf50', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                                Username: {method.username}
                              </div>
                            )}
                          </div>
                          <div style={{
                            background: 'rgba(76, 175, 80, 0.8)',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            minWidth: '80px',
                            textAlign: 'center'
                          }}>
                            ${(!membership || !membership.isActive) ? '10' : '5'}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {method.paymentLink ? (
                            <a 
                              href={method.paymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                background: 'rgba(76, 175, 80, 0.8)',
                                color: '#fff',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                textAlign: 'center',
                                flex: 1,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(76, 175, 80, 1)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(76, 175, 80, 0.8)';
                              }}
                            >
                              🔗 Pay Online
                            </a>
                          ) : (
                            <button
                              onClick={() => handleQuickPayment(method.id)}
                              disabled={paymentProcessing}
                              style={{
                                background: paymentProcessing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.8)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: paymentProcessing ? 'not-allowed' : 'pointer',
                                flex: 1,
                                transition: 'all 0.2s ease',
                                opacity: paymentProcessing ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!paymentProcessing) {
                                  e.target.style.background = 'rgba(76, 175, 80, 1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = paymentProcessing ? 'rgba(255, 255, 255, 0.1)' : 'rgba(76, 175, 80, 0.8)';
                              }}
                            >
                              {paymentProcessing ? 'Processing...' : '✅ Mark as Paid'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ccc',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.color = '#ccc';
                    }}
                  >
                    ← Back to Match Form
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LadderMatchReportingModal;
