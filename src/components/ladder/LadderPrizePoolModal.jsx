import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';

const LadderPrizePoolModal = ({ isOpen, onClose, selectedLadder }) => {
  const [currentLadder, setCurrentLadder] = useState(selectedLadder);
  const [prizePoolData, setPrizePoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [winners, setWinners] = useState([]);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showWinners, setShowWinners] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentLadder(selectedLadder);
    }
  }, [isOpen, selectedLadder]);

  useEffect(() => {
    if (isOpen) {
      fetchPrizePoolData();
      fetchHistoricalData();
      fetchWinners();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchPrizePoolData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, currentLadder]);

  const fetchPrizePoolData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Connect to Real API - Fetch actual match data and prize pool
      const response = await fetch(`${BACKEND_URL}/api/ladder/prize-pool/${currentLadder}`);
      
      if (response.ok) {
        const data = await response.json();
        setPrizePoolData(data);
      } else {
        // Fallback to estimated data if API not available yet
        const estimatedData = calculateEstimatedPrizePool();
        setPrizePoolData(estimatedData);
      }
    } catch (error) {
      console.error('Error fetching prize pool data:', error);
      // Fallback to estimated data
      const estimatedData = calculateEstimatedPrizePool();
      setPrizePoolData(estimatedData);
      setError('Using estimated data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/prize-pool/${currentLadder}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/prize-pool/${currentLadder}/winners`);
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const calculateEstimatedPrizePool = () => {
    // Fallback calculation based on the new bi-monthly system
    const currentDate = new Date();
    const startOfPeriod = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 2) * 2, 1);
    const daysInPeriod = Math.floor((currentDate - startOfPeriod) / (1000 * 60 * 60 * 24));
    
    // Estimate based on 3 matches per week average
    const estimatedMatches = Math.floor((daysInPeriod / 7) * 3);
    const estimatedPrizePool = estimatedMatches * 3; // $3 per match to prize pool
    
    const nextDistribution = new Date(startOfPeriod);
    nextDistribution.setMonth(nextDistribution.getMonth() + 2);
    
    return {
      currentPrizePool: estimatedPrizePool,
      totalMatches: estimatedMatches,
      nextDistribution: nextDistribution.toISOString(),
      isEstimated: true
    };
  };

  const getLadderDisplayName = (ladderName) => {
    switch (ladderName) {
      case '499-under': return '499 & Under';
      case '500-549': return '500-549';
      case '550-plus': return '550+';
      default: return ladderName;
    }
  };

  const handleLadderChange = (newLadder) => {
    setCurrentLadder(newLadder);
    setShowHistorical(false);
    setShowWinners(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
            🏆 Prize Pool Tracker
          </h2>
          
          {/* Ladder Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <label style={{ 
              color: '#ccc', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              Select Ladder:
            </label>
            <select 
              value={currentLadder} 
              onChange={(e) => handleLadderChange(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="499-under">499 & Under</option>
              <option value="500-549">500-549</option>
              <option value="550-plus">550+</option>
            </select>
          </div>
          
          <div style={{
            marginTop: '0.5rem',
            textAlign: 'center',
            color: '#ff4444',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            {getLadderDisplayName(currentLadder)} Ladder
          </div>
          
          {/* Live Update Indicator */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.8rem',
            color: '#00ff00'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00ff00',
              animation: 'pulse 2s infinite'
            }}></div>
            Live
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
          {loading && !prizePoolData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#ccc', marginTop: '1rem' }}>Loading prize pool data...</p>
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

              {/* Current Prize Pool Status */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff4444' }}>
                    {formatCurrency(prizePoolData?.currentPrizePool || 0)}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '1rem' }}>
                    Current Prize Pool
                  </div>
                  {prizePoolData?.isEstimated && (
                    <div style={{ color: '#ffc107', fontSize: '0.9rem', marginTop: '8px' }}>
                      (Estimated)
                    </div>
                  )}
                </div>
              </div>

              {/* Prize Pool Details */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.3rem' }}>
                  Prize Pool Details
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ccc' }}>Total Matches:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      {prizePoolData?.totalMatches || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ccc' }}>Next Distribution:</span>
                    <span style={{ color: '#fff' }}>
                      {prizePoolData?.nextDistribution ? formatDate(prizePoolData.nextDistribution) : 'TBD'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ccc' }}>Prize Split:</span>
                    <span style={{ color: '#fff' }}>50% 1st Place, 50% Most Improved</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
                <button
                  onClick={() => setShowWinners(!showWinners)}
                  style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    color: '#ffc107',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 193, 7, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 193, 7, 0.1)';
                  }}
                >
                  🏅 {showWinners ? 'Hide' : 'Show'} Winners
                </button>
                
                <button
                  onClick={() => setShowHistorical(!showHistorical)}
                  style={{
                    background: 'rgba(0, 123, 255, 0.1)',
                    border: '1px solid rgba(0, 123, 255, 0.3)',
                    color: '#007bff',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 123, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(0, 123, 255, 0.1)';
                  }}
                >
                  📊 {showHistorical ? 'Hide' : 'Show'} History
                </button>
              </div>

              {/* Winners Section */}
              {showWinners && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#ffc107', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    🏅 Recent Winners
                  </h3>
                  <div style={{ 
                    background: 'rgba(255, 193, 7, 0.05)', 
                    borderRadius: '8px', 
                    padding: '1rem' 
                  }}>
                    {winners.length > 0 ? (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {winners.slice(0, 5).map((winner, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                {winner.playerName}
                              </div>
                              <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                {winner.category} - {formatDate(winner.date)}
                              </div>
                            </div>
                            <div style={{ color: '#ffc107', fontWeight: 'bold' }}>
                              {formatCurrency(winner.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center' }}>
                        No winners recorded yet
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historical Data Section */}
              {showHistorical && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#007bff', marginBottom: '1rem', fontSize: '1.3rem' }}>
                    📊 Prize Pool History
                  </h3>
                  <div style={{ 
                    background: 'rgba(0, 123, 255, 0.05)', 
                    borderRadius: '8px', 
                    padding: '1rem' 
                  }}>
                    {historicalData.length > 0 ? (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {historicalData.slice(0, 5).map((period, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                {period.period}
                              </div>
                              <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                {period.matches} matches
                              </div>
                            </div>
                            <div style={{ color: '#007bff', fontWeight: 'bold' }}>
                              {formatCurrency(period.prizePool)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center' }}>
                        No historical data available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LadderPrizePoolModal;
