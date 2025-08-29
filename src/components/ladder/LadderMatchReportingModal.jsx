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
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPendingMatches();
      fetchMembershipStatus();
      loadPaymentMethods();
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
      
      // Fetch pending challenges/matches for this player
      const response = await fetch(`${BACKEND_URL}/api/challenges/pending/${playerName}/${selectedLadder}`);
      
      if (response.ok) {
        const data = await response.json();
        setPendingMatches(data.challenges || []);
      } else {
        // Fallback: create some sample data for testing
        setPendingMatches([
          {
            _id: 'sample1',
            senderName: 'John Doe',
            receiverName: playerName,
            date: '2024-01-15',
            time: '7:00 PM',
            location: 'Main Pool Hall',
            status: 'accepted',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'sample2',
            senderName: playerName,
            receiverName: 'Jane Smith',
            date: '2024-01-16',
            time: '8:00 PM',
            location: 'Downtown Pool',
            status: 'accepted',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      setError('Failed to load pending matches');
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

  const handleReportMatch = (match) => {
    setSelectedMatch(match);
    setWinner('');
    setScore('');
    setNotes('');
    setShowPaymentForm(false);
    setError('');
    setMessage('');
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    
    if (!winner || !score) {
      setError('Please select a winner and enter the score');
      return;
    }

    // Check if payment is required
    if (!membership || !membership.isActive()) {
      setShowPaymentForm(true);
      return;
    }

    await submitMatchResult();
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setError('');

    try {
      // Create payment session for match fee
      const response = await fetch(`${BACKEND_URL}/api/monetization/create-match-fee-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: selectedMatch._id,
          playerId: playerName,
          amount: 5, // $5 match fee
          paymentMethod: paymentMethod,
          returnUrl: window.location.origin + '/ladder/match-success'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment session');
      }

      // Show payment instructions and record payment
      setMessage('Payment session created! Please complete your payment using the instructions below.');
      
      // Record the payment after a delay (simulating manual verification)
      setTimeout(() => {
        recordPayment(data.paymentSession);
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment processing failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const recordPayment = async (paymentSession) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'match_fee',
          email: playerName,
          playerName: playerName,
          amount: 5.00,
          paymentMethod: paymentMethod,
          matchId: selectedMatch._id,
          playerId: playerName,
          notes: `Match fee for ${selectedMatch.senderName} vs ${selectedMatch.receiverName}`
        })
      });

      if (response.ok) {
        // Submit match result after payment recorded
        await submitMatchResult();
      } else {
        throw new Error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setError('Payment recorded but there was an issue. Please contact support.');
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

              {/* Payment Form */}
              {showPaymentForm && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    💳 Match Fee Payment Required
                  </h3>
                  
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ color: '#ffc107', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      ⚠️ Active membership required
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      To report match results, you need an active ladder membership ($5/month) and to pay the match fee ($5).
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
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
                        {availablePaymentMethods.map(method => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {paymentMethod && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          Payment Instructions
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                          {availablePaymentMethods.find(m => m.id === paymentMethod)?.instructions}
                          {availablePaymentMethods.find(m => m.id === paymentMethod)?.username && (
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#4caf50' }}>
                              Username: {availablePaymentMethods.find(m => m.id === paymentMethod)?.username}
                            </div>
                          )}
                          {availablePaymentMethods.find(m => m.id === paymentMethod)?.paymentLink && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <a 
                                href={availablePaymentMethods.find(m => m.id === paymentMethod)?.paymentLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#4caf50', textDecoration: 'underline' }}
                              >
                                Click here to pay online
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ccc' }}>Match Fee:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>$5.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ccc' }}>Membership:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>$5.00/month</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.5rem' }}>
                        <span style={{ color: '#ccc', fontWeight: 'bold' }}>Total:</span>
                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>$10.00</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <button
                        type="submit"
                        disabled={paymentProcessing || !paymentMethod}
                        style={{
                          background: 'rgba(76, 175, 80, 0.8)',
                          border: 'none',
                          color: '#fff',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          cursor: paymentProcessing || !paymentMethod ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          opacity: paymentProcessing || !paymentMethod ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!paymentProcessing && paymentMethod) {
                            e.target.style.background = 'rgba(76, 175, 80, 1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(76, 175, 80, 0.8)';
                        }}
                      >
                        {paymentProcessing ? 'Processing...' : '💳 Complete Payment & Report Match'}
                      </button>
                      
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
                        ← Back to Match Form
                      </button>
                    </div>
                  </form>

                  {paymentConfig && paymentConfig.additionalInstructions && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1rem',
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ color: '#ffc107', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Additional Information
                      </div>
                      <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                        {paymentConfig.additionalInstructions}
                      </div>
                    </div>
                  )}
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
