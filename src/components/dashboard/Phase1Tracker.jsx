import React, { useState, useEffect } from 'react';
import { format, differenceInDays, differenceInHours, isAfter, isBefore } from 'date-fns';
import { seasonService } from '../../services/seasonService.js';

const Phase1Tracker = ({ 
  currentPhase, 
  seasonData, 
  completedMatches, 
  totalRequiredMatches,
  playerName 
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [deadlineStatus, setDeadlineStatus] = useState('normal');
  const [standingsImpact, setStandingsImpact] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);

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

    completedMatches.forEach(match => {
      if (match.winner === playerName) {
        wins++;
      } else {
        losses++;
      }
    });

    const winRate = Math.round((wins / (wins + losses)) * 100);
    
    // Estimate position based on win rate and completed matches
    // This is a simplified calculation - in real implementation, you'd fetch actual standings
    let estimatedPosition = 'N/A';
    if (completedMatches.length >= 3) {
      if (winRate >= 80) estimatedPosition = '1st-3rd';
      else if (winRate >= 60) estimatedPosition = '4th-6th';
      else if (winRate >= 40) estimatedPosition = '7th-9th';
      else estimatedPosition = '10th+';
    }

    setPlayerStats({
      wins,
      losses,
      winRate,
      position: estimatedPosition
    });
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

  // Debug logging to see what status we're getting
  console.log('Phase1Tracker - Deadline Status:', deadlineStatus, 'Time Left:', timeLeft);

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
            {playerStats?.position || 'N/A'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999' }}>
            {completedMatches.length >= 3 ? 'Est. rank' : 'Need 3+ matches'}
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