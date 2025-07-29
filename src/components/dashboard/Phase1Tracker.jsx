import React, { useState, useEffect } from 'react';
import { format, differenceInDays, differenceInHours, isAfter, isBefore } from 'date-fns';
import { seasonService } from '../../services/seasonService.js';
import { BACKEND_URL } from '../../config.js';

  const Phase1Tracker = ({ 
    currentPhase, 
    seasonData, 
    completedMatches, 
    totalRequiredMatches,
    playerName,
    playerLastName,
    selectedDivision 
  }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [deadlineStatus, setDeadlineStatus] = useState('normal');
  const [standingsImpact, setStandingsImpact] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    if (!seasonData || currentPhase !== 'scheduled') {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const phase1End = new Date(seasonData.phase1End);
      
      if (isAfter(now, phase1End)) {
        setTimeLeft({ days: 0, hours: 0, passed: true });
        setDeadlineStatus('passed');
      } else {
        const daysLeft = differenceInDays(phase1End, now);
        const hoursLeft = differenceInHours(phase1End, now) % 24;
        
        setTimeLeft({ days: daysLeft, hours: hoursLeft, passed: false });
        
        if (daysLeft <= 0 && hoursLeft <= 24) {
          setDeadlineStatus('critical');
        } else if (daysLeft <= 2) {
          setDeadlineStatus('urgent');
        } else if (daysLeft <= 7) {
          setDeadlineStatus('warning');
        } else {
          setDeadlineStatus('normal');
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [seasonData, currentPhase]);

  useEffect(() => {
    if (currentPhase === 'scheduled' && seasonData && completedMatches) {
      calculateStandingsImpact();
      calculatePlayerStats();
    }
  }, [currentPhase, seasonData, completedMatches, totalRequiredMatches]);

  useEffect(() => {
    if (selectedDivision && currentPhase === 'scheduled') {
      loadStandings();
    }
  }, [selectedDivision, currentPhase]);

  // Load standings data from backend
  const loadStandings = async () => {
    try {
      setLoadingStandings(true);
      if (!selectedDivision) {
        console.warn('No division selected for standings');
        return;
      }

      // Use the backend to fetch standings JSON for the division
      const safeDivision = selectedDivision.replace(/[^A-Za-z0-9]/g, '_');
      const standingsUrl = `${BACKEND_URL}/static/standings_${safeDivision}.json`;
      
      
      
      const response = await fetch(standingsUrl);
      
      if (!response.ok) {
        console.warn(`Failed to fetch standings: ${response.status} - ${response.statusText}`);
        return;
      }
      
      const standingsData = await response.json();

      // Validate standings data structure
      if (!Array.isArray(standingsData)) {
        console.error('Standings data is not an array:', standingsData);
        return;
      }

      // Validate each entry has required fields
      const validStandings = standingsData.filter(entry => {
        if (!entry || typeof entry !== 'object') {
          console.warn('Invalid standings entry:', entry);
          return false;
        }
        if (!entry.name || !entry.rank) {
          console.warn('Standings entry missing name or rank:', entry);
          return false;
        }
        const rank = parseInt(entry.rank);
        if (isNaN(rank) || rank <= 0) {
          console.warn('Invalid rank in standings entry:', entry);
          return false;
        }
        return true;
      });


      setStandings(validStandings);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoadingStandings(false);
    }
  };

  // Get player's actual standings position
  const getPlayerPosition = (standings, playerName) => {
    if (!standings || standings.length === 0) {
      return null;
    }
    
    const normalizedPlayerName = playerName.toLowerCase().trim();
    const playerEntry = standings.find(entry => 
      entry.name.toLowerCase().trim() === normalizedPlayerName
    );
    
    return playerEntry ? parseInt(playerEntry.rank) : null;
  };

  const calculateStandingsImpact = () => {
    const completedCount = completedMatches.length;
    const remainingCount = totalRequiredMatches - completedCount;
    
    const impact = {
      completedCount,
      remainingCount,
      deadlinePassed: seasonService.hasPhase1DeadlinePassed(seasonData)
    };

    setStandingsImpact(impact);
  };

  const calculatePlayerStats = () => {
    if (!completedMatches || completedMatches.length === 0) {
      setPlayerStats({ wins: 0, losses: 0, winRate: 0, position: 'N/A' });
      return;
    }

    let wins = 0;
    let losses = 0;
    const fullPlayerName = `${playerName} ${playerLastName}`;

    completedMatches.forEach(match => {
      if (match.winner === fullPlayerName) {
        wins++;
      } else {
        losses++;
      }
    });

    const winRate = Math.round((wins / (wins + losses)) * 100);
    
    // Get actual standings position
    const actualPosition = getPlayerPosition(standings, fullPlayerName);
    let positionDisplay = 'N/A';
    
    if (actualPosition !== null) {
      positionDisplay = `${actualPosition}${getOrdinalSuffix(actualPosition)}`;
    } else if (completedMatches.length >= 1) {
      // Fallback to estimated position if not in standings
      if (winRate >= 80) positionDisplay = '1st-3rd';
      else if (winRate >= 60) positionDisplay = '4th-6th';
      else if (winRate >= 40) positionDisplay = '7th-9th';
      else positionDisplay = '10th+';
    }

    setPlayerStats({
      wins,
      losses,
      winRate,
      position: positionDisplay,
      actualPosition
    });
  };

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  if (!timeLeft || !standingsImpact || currentPhase !== 'scheduled') {
    return null;
  }

  const getPrimaryColor = () => {
    if (deadlineStatus === 'passed') return '#e74c3c';      // Lighter dark red
    if (deadlineStatus === 'critical') return '#ff6b6b';   // Lighter red
    if (deadlineStatus === 'urgent') return '#ff8800';     // Keep orange
    if (deadlineStatus === 'warning') return '#ffaa00';    // Keep yellow
    return '#00aa00';                                      // Keep green
  };



  const getStatusMessage = () => {
    const remainingCount = totalRequiredMatches - completedMatches.length;
    
    if (deadlineStatus === 'passed') {
      return `⚠️ PHASE 1 DEADLINE PASSED! You have ${remainingCount} incomplete matches.`;
    } else if (deadlineStatus === 'critical') {
      return `🚨 CRITICAL: Phase 1 ends in ${timeLeft.hours} hours! You have ${remainingCount} matches to complete.`;
    } else if (deadlineStatus === 'urgent') {
      return `⚠️ URGENT: Phase 1 ends in ${timeLeft.days} days! You have ${remainingCount} matches to complete.`;
    } else if (deadlineStatus === 'warning') {
      return `⚠️ WARNING: Phase 1 ends in ${timeLeft.days} days. You have ${remainingCount} matches to complete.`;
    } else {
      return `📅 Phase 1 ends in ${timeLeft.days} days. You have ${remainingCount} matches to complete.`;
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedMatches.length / totalRequiredMatches) * 100);
  };

  const primaryColor = getPrimaryColor();

  return (
    <div style={{
      background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}25)`,
      border: `2px solid ${primaryColor}`,
      borderRadius: '12px',
      padding: '16px',
      margin: '16px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          color: primaryColor,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {deadlineStatus === 'critical' && '🚨'}
          {deadlineStatus === 'urgent' && '⚠️'}
          {deadlineStatus === 'warning' && '⚠️'}
          {deadlineStatus === 'passed' && '⏰'}
          {deadlineStatus === 'normal' && '📅'}
          Phase 1 Progress & Deadline
        </h3>
        
        <div style={{
          fontSize: '0.9rem',
          color: primaryColor,
          fontWeight: 'bold'
        }}>
          {timeLeft.passed ? (
            'DEADLINE PASSED'
          ) : (
            `${timeLeft.days}d ${timeLeft.hours}h`
          )}
        </div>
      </div>

      {/* Status Message */}
      <div style={{
        color: '#fff',
        fontSize: '0.95rem',
        lineHeight: '1.4',
        marginBottom: '12px'
      }}>
        {getStatusMessage()}
      </div>

      {/* Progress Bar */}
      <div style={{
        background: '#333',
        borderRadius: '8px',
        height: '8px',
        marginBottom: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}dd)`,
          height: '100%',
          width: `${getProgressPercentage()}%`,
          transition: 'width 0.3s ease',
          borderRadius: '8px'
        }} />
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {/* Progress Stats */}
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '2px' }}>
            Progress
          </div>
          <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
            {completedMatches.length}/{totalRequiredMatches}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            {getProgressPercentage()}% complete
          </div>
        </div>

        {/* Win/Loss Record */}
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '2px' }}>
            Record
          </div>
          <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
            {playerStats?.wins || 0}W - {playerStats?.losses || 0}L
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            {playerStats?.winRate || 0}% win rate
          </div>
        </div>

        {/* Standings Position */}
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '2px' }}>
            Position
          </div>
          <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
            {loadingStandings ? '...' : (playerStats?.position || 'N/A')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            {loadingStandings ? 'Loading...' : 
             (playerStats?.actualPosition !== null ? 'Live standings' : 
              (completedMatches.length >= 1 ? 'Est. rank' : 'No matches yet'))}
          </div>
        </div>
      </div>

      {/* Deadline Date */}
      <div style={{
        fontSize: '0.8rem',
        color: '#999',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        Phase 1 ends: {format(new Date(seasonData.phase1End), 'EEEE, MMMM d, yyyy')}
      </div>

    </div>
  );
};

export default Phase1Tracker; 