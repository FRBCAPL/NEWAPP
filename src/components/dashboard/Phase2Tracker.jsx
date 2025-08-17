import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import { format } from 'date-fns';
import styles from './dashboard.module.css';

export default function Phase2Tracker({ 
  playerName, 
  playerLastName, 
  selectedDivision, 
  phase,
  isMobile,
  // Add props for modal handlers like Phase 1 tracker
  onOpenOpponentsModal,
  onOpenCompletedMatchesModal,
  onOpenStandingsModal,
  onOpenDefenseChallengersModal,
  onOpenAllMatchesModal,
  onOpenProposalListModal,
  onOpenSentProposalListModal,
  onOpenPlayerSearch,
  pendingCount = 0,
  sentCount = 0,
  upcomingMatches = [],
  onMatchClick,
  // Add season data for deadline tracking
  seasonData
}) {
  const [stats, setStats] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fullPlayerName = `${playerName} ${playerLastName}`;

  // Calculate Phase 2 deadline status
  const getPhase2DeadlineStatus = () => {
    // Debug logging
    console.log('Phase2Tracker - seasonData:', seasonData);
    console.log('Phase2Tracker - phase:', phase);
    
    if (!seasonData || !seasonData.phase2End) {
      console.log('Phase2Tracker - No seasonData or phase2End found');
      return { days: null, status: 'no_deadline' };
    }
    
    const now = new Date();
    const phase2End = new Date(seasonData.phase2End);
    const diffTime = phase2End - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Phase2Tracker - Debug deadline calculation:', {
      now: now.toISOString(),
      phase2End: phase2End.toISOString(),
      diffTime,
      diffDays,
      seasonDataPhase2End: seasonData.phase2End,
      currentDate: now.toLocaleDateString(),
      phase2EndDate: phase2End.toLocaleDateString()
    });
    
    if (diffDays < 0) {
      return { days: Math.abs(diffDays), status: 'passed' };
    } else if (diffDays <= 1) {
      return { days: diffDays, status: 'critical' };
    } else if (diffDays <= 3) {
      return { days: diffDays, status: 'urgent' };
    } else if (diffDays <= 7) {
      return { days: diffDays, status: 'warning' };
    } else {
      return { days: diffDays, status: 'normal' };
    }
  };

  const deadlineStatus = getPhase2DeadlineStatus();

  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision || phase !== 'challenge') {
      setLoading(false);
      return;
    }

    async function loadChallengeData() {
      try {
        setLoading(true);
        setError(null);

        // Load both stats and limits
        const [statsData, limitsData] = await Promise.all([
          challengeService.getChallengeStats(fullPlayerName, selectedDivision),
          challengeService.getChallengeLimits(fullPlayerName, selectedDivision)
        ]);

        setStats(statsData);
        setLimits(limitsData);
      } catch (err) {
        console.error('Error loading challenge data:', err);
        setError('Failed to load challenge statistics');
      } finally {
        setLoading(false);
      }
    }

    loadChallengeData();
  }, [playerName, playerLastName, selectedDivision, phase, fullPlayerName]);

  if (phase !== 'challenge') {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        background: `linear-gradient(135deg, rgba(42, 42, 42, 0.7), rgba(26, 26, 26, 0.8))`,
        border: '2px solid #ff4444',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '1px' : '18px',
        margin: isMobile ? '-15px 0 0 0' : '16px 0',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(2px)',
        textAlign: 'center',
        color: '#888'
      }}>
        Loading Phase 2 challenge statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: `linear-gradient(135deg, rgba(42, 42, 42, 0.7), rgba(26, 26, 26, 0.8))`,
        border: '2px solid #e53e3e',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '1px' : '18px',
        margin: isMobile ? '-15px 0 0 0' : '16px 0',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(2px)',
        textAlign: 'center',
        color: '#e53e3e'
      }}>
        {error}
      </div>
    );
  }

  if (!stats || !limits) {
    return null;
  }

  // Calculate total matches (challenges + defenses) for 2-4 goal
  const totalMatches = stats.totalChallengeMatches + stats.requiredDefenses;
  const minRequiredMatches = 2;
  const maxAllowedMatches = 4;
  const remainingMatches = maxAllowedMatches - totalMatches;
  const isMinimumMet = totalMatches >= minRequiredMatches;
  const isMaximumReached = totalMatches >= maxAllowedMatches;

  // Calculate dynamic status and colors like Phase1Tracker
  const getChallengeStatus = () => {
    if (isMaximumReached) {
      return 'completed'; // All matches done (reached 4)
    } else if (isMinimumMet) {
      return 'active'; // Met minimum (2+ matches)
    } else if (totalMatches >= 1) {
      return 'progressing'; // Started but below minimum
    } else {
      return 'ready'; // Haven't started
    }
  };

  const getStatusColor = (isEligible) => isEligible ? '#28a745' : '#e53e3e';
  
  const getProgressColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return '#e53e3e';
    if (percentage >= 75) return '#ffc107';
    return '#28a745';
  };

  // Dynamic primary color based on status - using red theme like Phase 1
  const getPrimaryColor = () => {
    const status = getChallengeStatus();
    switch (status) {
      case 'completed': return '#00aa00';      // Green - all done
      case 'active': return '#ff4444';         // Red - good progress
      case 'progressing': return '#ff4444';    // Red - started
      case 'ready': return '#ff4444';          // Red - ready to start
      default: return '#ff4444';
    }
  };

  // Status message with emojis - updated to reflect 2-4 total matches
  const getStatusMessage = () => {
    const status = getChallengeStatus();
    
    // Add deadline status to the message with date
    if (deadlineStatus.status === 'passed') {
      return '⚠️ DEADLINE PASSED!';
    } else if (deadlineStatus.status === 'critical') {
      const endDate = seasonData && seasonData.phase2End ? format(new Date(seasonData.phase2End), isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `🚨 CRITICAL: ENDS in ${deadlineStatus.days} hours! (${endDate})`;
    } else if (deadlineStatus.status === 'urgent') {
      const endDate = seasonData && seasonData.phase2End ? format(new Date(seasonData.phase2End), isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `⚠️ URGENT: ENDS in ${deadlineStatus.days} days! (${endDate})`;
    } else if (deadlineStatus.status === 'warning') {
      const endDate = seasonData && seasonData.phase2End ? format(new Date(seasonData.phase2End), isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `⚠️ WARNING: ENDS in ${deadlineStatus.days} days. (${endDate})`;
    } else if (deadlineStatus.status === 'normal') {
      const endDate = seasonData && seasonData.phase2End ? format(new Date(seasonData.phase2End), isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `ENDS in ${deadlineStatus.days} days. (${endDate})`;
    }
    
    // Fallback to original status messages if no deadline
    switch (status) {
      case 'completed':
        return '🎉 Phase 2 Complete! (4/4 matches)';
      case 'active':
        return `🏆 Active in Phase 2! ${totalMatches}/4 total matches (need 2-4)`;
      case 'progressing':
        return `📈 Phase 2 in progress! ${totalMatches}/4 total matches (need 2-4)`;
      case 'ready':
        return `⚔️ Ready for Phase 2! Need 2-4 total matches.`;
      default:
        return 'Phase 2 Challenge Status';
    }
  };

  const primaryColor = getPrimaryColor();
  
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(42, 42, 42, 0.7), rgba(26, 26, 26, 0.8))`,
      border: `2px solid ${primaryColor}`,
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '1px' : '18px',
      margin: isMobile ? '-15px 0 0 0' : '16px 0',
      boxShadow: '0 6px 20px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: isExpanded ? 'flex-start' : 'flex-start',
      backdropFilter: 'blur(2px)',
      overflow: isMobile ? 'auto' : 'hidden',
                      maxHeight: isMobile ? 'none' : '35vh',
        height: isMobile ? (isExpanded ? '160px' : '40px') : (isExpanded ? '380px' : '160px'),
      transition: 'height 0.3s ease, max-height 0.3s ease'
    }}
    onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginBottom: isMobile ? '0px' : '12px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#ffffff',
                     fontSize: isMobile ? '0.4rem' : '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '2px' : '6px',
          flexWrap: 'wrap',
          textShadow: '1px 1px 3px rgba(0,0,0,0.9)'
        }}>
          {getChallengeStatus() === 'completed' && '🎉'}
          {getChallengeStatus() === 'active' && '🏆'}
          {getChallengeStatus() === 'progressing' && '📈'}
          {getChallengeStatus() === 'ready' && '⚔️'}
                     <span style={{ fontSize: isMobile ? '0.6rem' : '1.1rem' }}>
            Phase 2
          </span>
        </h3>
        
        {/* Status Message */}
        {!isMobile && (
          <div style={{
            color: '#ffffff',
            fontSize: isMobile ? '0.6rem' : '0.95rem',
            lineHeight: isMobile ? '1.1' : '1.1',
            marginTop: isMobile ? '2px' : '4px',
            marginBottom: isMobile ? '0px' : '8px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            fontWeight: '500'
          }}>
            {getStatusMessage()}
          </div>
        )}
        
        {/* Total Matches Progress - Updated to show 2-4 goal */}
        {!isMobile && (
          <div style={{
            color: '#ffffff',
            fontSize: isMobile ? '0.55rem' : '0.95rem',
            fontWeight: 'bold',
            marginTop: isMobile ? '2px' : '4px',
            marginBottom: isMobile ? '0px' : '8px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            lineHeight: isMobile ? '1.1' : '1.1'
          }}>
            {totalMatches}/4 Total Matches (need 2-4)
          </div>
        )}
        
        {/* Defense Progress - Updated to show 0-2 required */}
        {!isMobile && (
          <div style={{
            color: '#ffffff',
            fontSize: isMobile ? '0.55rem' : '0.95rem',
            fontWeight: 'bold',
            marginTop: isMobile ? '2px' : '4px',
            marginBottom: isMobile ? '0px' : '4px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            lineHeight: isMobile ? '1.1' : '1.1'
          }}>
            {stats.requiredDefenses}/2 Defenses (max required)
          </div>
        )}
      </div>

      {/* Show Stats Button */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '0px' : '4px'
      }}>
        <div style={{
          fontSize: isMobile ? '0.5rem' : '0.9rem',
          color: '#ffffff',
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: isMobile ? '1px 3px' : '4px 8px',
          borderRadius: '6px',
          display: 'inline-block',
          transition: 'background-color 0.2s ease',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = `${primaryColor}20`}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          {isExpanded ? 'Hide Stats ▲' : 'Show Stats ▼'}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
                     {/* Main Stats Grid */}
           <div style={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(3, 1fr)', 
             gap: isMobile ? '0.5rem' : '0.75rem',
             marginBottom: isMobile ? '0.75rem' : '1rem'
           }}>
                         {/* Total Matches - Updated to show 2-4 goal */}
             <div 
               onClick={(e) => {
                 e.stopPropagation();
                 // For Phase 2, we need to open Phase 2 opponents modal
                 if (onOpenPlayerSearch) onOpenPlayerSearch();
               }}
               style={{ 
                 padding: isMobile ? '0.5rem' : '0.75rem',
                 background: 'rgba(255,255,255,0.1)',
                 borderRadius: '6px',
                 border: '1px solid rgba(255,255,255,0.1)',
                 textAlign: 'center',
                 cursor: 'pointer',
                 transition: 'background-color 0.2s ease'
               }}
               onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
               onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
             >
              <div style={{ 
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '2px'
              }}>
                🏆 Total Matches
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {totalMatches}/4
              </div>
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: isMobile ? '2px' : '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                <div style={{
                  width: `${(totalMatches / maxAllowedMatches) * 100}%`,
                  height: '100%',
                  background: getProgressColor(totalMatches, maxAllowedMatches),
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {isMinimumMet ? '✅ Min met' : `${minRequiredMatches - totalMatches} to min`}
              </div>
            </div>

                         {/* Defense Status - Updated to show 0-2 required */}
             <div 
               onClick={(e) => {
                 e.stopPropagation();
                 // For Phase 2 Defense, we need to open defense challengers modal to show players ranked below the user
                 if (onOpenDefenseChallengersModal) onOpenDefenseChallengersModal();
               }}
              style={{ 
                padding: isMobile ? '0.5rem' : '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <div style={{ 
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '2px'
              }}>
                🛡️ Defenses
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {stats.requiredDefenses}/2
              </div>
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: isMobile ? '2px' : '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                <div style={{
                  width: `${(stats.requiredDefenses / 2) * 100}%`,
                  height: '100%',
                  background: getProgressColor(stats.requiredDefenses, 2),
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {stats.requiredDefenses >= 2 ? '✅ Max met' : `${2 - stats.requiredDefenses} required left`}
              </div>
            </div>

            {/* Weekly Status */}
            <div style={{ 
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '2px'
              }}>
                📅 This Week
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {limits.weeklyStatus.canChallengeThisWeek ? '✅' : '❌'} Available
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {limits.weeklyStatus.challengesThisWeek} challenges
              </div>
            </div>
          </div>

                     {/* Interactive Sections - Like Phase 1 Tracker */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: 'repeat(3, 1fr)',
             gap: isMobile ? '0.5rem' : '0.75rem',
             marginBottom: isMobile ? '0.75rem' : '1rem'
           }}>
            {/* Proposals Section */}
            <div style={{
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenProposalListModal) onOpenProposalListModal();
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <div style={{
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '4px'
              }}>
                📨 Proposals
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {pendingCount} waiting
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {sentCount} sent
              </div>
            </div>

                         {/* Schedule Section */}
             <div style={{
               padding: isMobile ? '0.5rem' : '0.75rem',
               background: 'rgba(255,255,255,0.1)',
               borderRadius: '6px',
               border: '1px solid rgba(255,255,255,0.1)',
               textAlign: 'center',
               cursor: 'pointer',
               transition: 'background-color 0.2s ease'
             }}
             onClick={(e) => {
               e.stopPropagation();
               // For Phase 2, we need to open player search instead of opponents modal
               if (onOpenPlayerSearch) onOpenPlayerSearch();
             }}
             onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
             onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
             >
              <div style={{
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '4px'
              }}>
                📅 Schedule
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {stats.eligibleOpponentsCount} available
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                click to schedule
              </div>
            </div>

            {/* Matches Section */}
            <div style={{
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenAllMatchesModal) onOpenAllMatchesModal();
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              <div style={{
                fontSize: isMobile ? '0.45rem' : '0.8rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '2px' : '4px'
              }}>
                🏆 Matches
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '4px'
              }}>
                {upcomingMatches.length} upcoming
              </div>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.75rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                click match for details
              </div>
            </div>
          </div>

          {/* Upcoming Matches List */}
          {upcomingMatches.length > 0 && (
            <div style={{
              marginBottom: isMobile ? '0.75rem' : '1rem'
            }}>
              <div style={{
                fontSize: isMobile ? '0.5rem' : '0.9rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: isMobile ? '0.25rem' : '0.5rem',
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                Upcoming Matches
              </div>
              <div style={{
                maxHeight: isMobile ? '60px' : '80px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                padding: isMobile ? '0.25rem' : '0.5rem'
              }}>
                {upcomingMatches.slice(0, 3).map((match, index) => {
                  let opponent = '';
                  if (match.senderName && match.receiverName) {
                    opponent = match.senderName.trim().toLowerCase() === fullPlayerName.toLowerCase()
                      ? match.receiverName
                      : match.senderName;
                  }
                  
                  return (
                    <div
                      key={match._id || index}
                      style={{
                        fontSize: isMobile ? '0.35rem' : '0.7rem',
                        color: '#ffffff',
                        padding: isMobile ? '0.2rem 0.3rem' : '0.3rem 0.5rem',
                        marginBottom: isMobile ? '0.1rem' : '0.2rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        textAlign: 'center'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onMatchClick) onMatchClick(match);
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    >
                      VS {opponent || 'Unknown'} - {match.date || 'No Date'}
                    </div>
                  );
                })}
                {upcomingMatches.length > 3 && (
                  <div style={{
                    fontSize: isMobile ? '0.35rem' : '0.7rem',
                    color: '#e0e0e0',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    padding: isMobile ? '0.2rem' : '0.3rem'
                  }}>
                    +{upcomingMatches.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}

                     {/* Status Summary - Updated to reflect 2-4 total matches */}
           <div style={{ 
             padding: isMobile ? '0.5rem' : '0.75rem',
             background: 'rgba(0,0,0,0.3)',
             borderRadius: '4px',
             border: '1px solid rgba(255,255,255,0.1)',
             fontSize: isMobile ? '0.4rem' : '0.75rem',
             color: '#ffffff',
             textAlign: 'center'
           }}>
             {isMinimumMet ? (
               <div>✅ Minimum requirement met ({totalMatches}/4 total matches)</div>
             ) : (
               <div>📈 Need {minRequiredMatches - totalMatches} more match{minRequiredMatches - totalMatches !== 1 ? 'es' : ''} to meet minimum (2-4 total)</div>
             )}
           </div>

           
        </>
      )}
    </div>
  );
} 