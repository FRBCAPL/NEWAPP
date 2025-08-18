import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import { format } from 'date-fns';
import styles from './dashboard.module.css';
import Phase2RulesModal from '../modal/Phase2RulesModal';

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
  const [showRulesModal, setShowRulesModal] = useState(false);

  const fullPlayerName = `${playerName} ${playerLastName}`;

  // Calculate Phase 2 deadline status
  const getPhase2DeadlineStatus = () => {
    // Debug the season data being received
    console.log('Phase2Tracker - Received seasonData:', seasonData);
    console.log('Phase2Tracker - seasonData.phase1End:', seasonData?.phase1End);
    
    if (!seasonData || !seasonData.phase1End) {
      console.log('Phase2Tracker - No seasonData or phase1End found');
      return { days: null, status: 'no_deadline' };
    }
    
    const now = new Date();
    const phase1End = new Date(seasonData.phase1End);
    
         // Debug the date comparison
     console.log('Phase2Tracker - Date comparison:');
     console.log('  now:', now.toISOString());
     console.log('  phase1End:', phase1End.toISOString());
     console.log('  nowTime:', now.getTime());
     console.log('  phase1EndTime:', phase1End.getTime());
     console.log('  isPhase1Active:', now <= phase1End);
     console.log('  currentDate:', now.toLocaleDateString());
     console.log('  phase1EndDate:', phase1End.toLocaleDateString());
    
    // If Phase 1 hasn't ended yet, Phase 2 cannot be over
    if (now <= phase1End) {
      console.log('Phase2Tracker - Phase 1 is still active, returning phase1_active status');
      return { days: null, status: 'phase1_active' };
    }
    
    // Phase 2 ends 4 weeks (28 days) after Phase 1 ends
    const phase2End = new Date(phase1End);
    phase2End.setDate(phase2End.getDate() + 28);
    
    const diffTime = phase2End - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
         console.log('Phase2Tracker - Phase 2 calculation:');
     console.log('  phase2End:', phase2End.toISOString());
     console.log('  diffTime:', diffTime);
     console.log('  diffDays:', diffDays);
     console.log('  status:', diffDays < 0 ? 'passed' : diffDays <= 1 ? 'critical' : diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'warning' : 'normal');
    
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
  
  // Debug the final deadline status
  console.log('Phase2Tracker - Final deadlineStatus:', deadlineStatus);
  console.log('Phase2Tracker - Final deadlineStatus.status:', deadlineStatus?.status);
  console.log('Phase2Tracker - Final deadlineStatus.days:', deadlineStatus?.days);

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
    // First check if Phase 1 is still active
    if (deadlineStatus.status === 'phase1_active') {
      return '#ffaa00'; // Orange - Phase 1 still active
    }
    
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
    if (deadlineStatus.status === 'phase1_active') {
      const phase1EndDate = seasonData && seasonData.phase1End ? format(new Date(seasonData.phase1End), isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `⏳ Phase 1 still active until ${phase1EndDate}`;
    } else if (deadlineStatus.status === 'passed') {
      return '⚠️ DEADLINE PASSED!';
    } else if (deadlineStatus.status === 'critical') {
      const phase1End = new Date(seasonData.phase1End);
      const phase2End = new Date(phase1End);
      phase2End.setDate(phase2End.getDate() + 28);
      const endDate = format(phase2End, isMobile ? 'MMM d' : 'MMM d, yyyy');
      return `🚨 CRITICAL: ENDS in ${deadlineStatus.days} hours! (${endDate})`;
    } else if (deadlineStatus.status === 'urgent') {
      const phase1End = new Date(seasonData.phase1End);
      const phase2End = new Date(phase1End);
      phase2End.setDate(phase2End.getDate() + 28);
      const endDate = format(phase2End, isMobile ? 'MMM d' : 'MMM d, yyyy');
      return `⚠️ URGENT: ENDS in ${deadlineStatus.days} days! (${endDate})`;
    } else if (deadlineStatus.status === 'warning') {
      const phase1End = new Date(seasonData.phase1End);
      const phase2End = new Date(phase1End);
      phase2End.setDate(phase2End.getDate() + 28);
      const endDate = format(phase2End, isMobile ? 'MMM d' : 'MMM d, yyyy');
      return `⚠️ WARNING: ENDS in ${deadlineStatus.days} days. (${endDate})`;
    } else if (deadlineStatus.status === 'normal') {
      const phase1End = new Date(seasonData.phase1End);
      const phase2End = new Date(phase1End);
      phase2End.setDate(phase2End.getDate() + 28);
      const endDate = format(phase2End, isMobile ? 'MMM d' : 'MMM d, yyyy');
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
             height: isMobile ? (isExpanded ? '200px' : '40px') : (isExpanded ? '450px' : '160px'),
      transition: 'height 0.3s ease, max-height 0.3s ease'
    }}
    onClick={() => setIsExpanded(!isExpanded)}
    >
             {/* Header */}
       <div style={{
         position: 'relative',
         textAlign: 'center',
         marginBottom: isMobile ? '0px' : '8px'
       }}>
                           <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            {/* Rules Button - Positioned absolutely on the right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRulesModal(true);
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #ff4444, #cc3333)',
                border: '2px solid #ffffff',
                color: '#ffffff',
                fontSize: isMobile ? '0.5rem' : '0.8rem',
                fontWeight: 'bold',
                padding: isMobile ? '4px 8px' : '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ff6666, #dd4444)';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ff4444, #cc3333)';
                e.target.style.transform = 'translateY(-50%) scale(1)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
              }}
            >
              ⚔️ Rules
            </button>
            
            {/* Centered Title */}
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
              textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
              textAlign: 'center'
            }}>
              {deadlineStatus.status === 'phase1_active' && '⏳'}
              {deadlineStatus.status !== 'phase1_active' && getChallengeStatus() === 'completed' && '🎉'}
              {deadlineStatus.status !== 'phase1_active' && getChallengeStatus() === 'active' && '🏆'}
              {deadlineStatus.status !== 'phase1_active' && getChallengeStatus() === 'progressing' && '📈'}
              {deadlineStatus.status !== 'phase1_active' && getChallengeStatus() === 'ready' && '⚔️'}
              <span style={{ fontSize: isMobile ? '0.6rem' : '1.1rem' }}>
                Phase 2
              </span>
            </h3>
          </div>
        
                 {/* Status Message - Compact */}
         {!isMobile && (
           <div style={{
             color: '#ffffff',
             fontSize: isMobile ? '0.6rem' : '0.85rem',
             lineHeight: isMobile ? '1.1' : '1.1',
             marginTop: isMobile ? '2px' : '3px',
             marginBottom: isMobile ? '0px' : '6px',
             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
             fontWeight: '500'
           }}>
             {getStatusMessage()}
           </div>
         )}
         
         {/* Combined Progress - Compact */}
         {!isMobile && (
           <div style={{
             color: '#ffffff',
             fontSize: isMobile ? '0.55rem' : '0.8rem',
             fontWeight: 'bold',
             marginTop: isMobile ? '2px' : '3px',
             marginBottom: isMobile ? '0px' : '6px',
             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
             lineHeight: isMobile ? '1.1' : '1.1'
           }}>
             {totalMatches}/4 Total • {stats.requiredDefenses}/2 Defenses
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
            gap: isMobile ? '0.4rem' : '0.6rem',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {/* Total Matches - Updated to show 2-4 goal */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                // For Phase 2, we need to open Phase 2 opponents modal
                if (onOpenPlayerSearch) onOpenPlayerSearch();
              }}
              style={{ 
                padding: isMobile ? '0.4rem' : '0.6rem',
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
                 marginBottom: isMobile ? '2px' : '3px'
               }}>
                 🏆 Total Matches
               </div>
               <div style={{
                 fontSize: isMobile ? '0.4rem' : '0.9rem',
                 color: '#ffffff',
                 fontWeight: 'bold',
                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                 marginBottom: isMobile ? '2px' : '4px'
               }}>
                 {totalMatches}/4
               </div>
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: isMobile ? '2px' : '3px',
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
                fontSize: isMobile ? '0.35rem' : '0.65rem',
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
                padding: isMobile ? '0.4rem' : '0.6rem',
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
                 marginBottom: isMobile ? '2px' : '3px'
               }}>
                 🛡️ Defenses
               </div>
               <div style={{
                 fontSize: isMobile ? '0.4rem' : '0.9rem',
                 color: '#ffffff',
                 fontWeight: 'bold',
                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                 marginBottom: isMobile ? '2px' : '4px'
               }}>
                 {stats.requiredDefenses}/2
               </div>
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: isMobile ? '2px' : '3px',
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
                fontSize: isMobile ? '0.35rem' : '0.65rem',
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
              padding: isMobile ? '0.4rem' : '0.6rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: isMobile ? '0.4rem' : '0.7rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                📅 This Week
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.8rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                {limits.weeklyStatus.canChallengeThisWeek ? '✅' : '❌'} Available
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.65rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {limits.weeklyStatus.challengesThisWeek} challenges
              </div>
            </div>
          </div>

           {/* NEW: Dynamic Challenge Limits Section - Smart Layout */}
           {limits.dynamicLimits && (
             <div style={{
               padding: isMobile ? '0.4rem' : '0.6rem',
               background: 'rgba(255, 193, 7, 0.1)',
               border: '1px solid rgba(255, 193, 7, 0.3)',
               borderRadius: '6px',
               marginBottom: isMobile ? '0.5rem' : '0.75rem',
               color: '#ffffff'
             }}>
               <div style={{
                 fontSize: isMobile ? '0.4rem' : '0.7rem',
                 fontWeight: 'bold',
                 color: '#ffc107',
                 marginBottom: isMobile ? '0.25rem' : '0.4rem',
                 textAlign: 'center'
               }}>
                 ⚔️ Dynamic Challenge Limits
               </div>
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: 'repeat(2, 1fr)',
                 gap: isMobile ? '0.3rem' : '0.5rem',
                 fontSize: isMobile ? '0.35rem' : '0.65rem',
                 color: '#ffffff',
                 textAlign: 'center',
                 lineHeight: isMobile ? '1.2' : '1.3'
               }}>
                 <div>
                   <strong>Times Challenged:</strong> {limits.dynamicLimits.timesChallenged}
                 </div>
                 <div>
                   <strong>Base Allowed:</strong> {limits.dynamicLimits.baseChallengesAllowed}
                 </div>
                 <div>
                   <strong>Challenges Issued:</strong> {limits.dynamicLimits.challengesIssued}
                 </div>
                 <div style={{ 
                   color: limits.dynamicLimits.remainingChallenges > 0 ? '#28a745' : '#e53e3e',
                   fontWeight: 'bold'
                 }}>
                   <strong>Remaining:</strong> {limits.dynamicLimits.remainingChallenges}
                 </div>
               </div>
             </div>
           )}

          {/* Interactive Sections - Compact Version */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.4rem' : '0.6rem',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {/* Proposals Section */}
            <div style={{
              padding: isMobile ? '0.4rem' : '0.6rem',
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
                fontSize: isMobile ? '0.4rem' : '0.7rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                📨 Proposals
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.8rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                {pendingCount} waiting
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.65rem',
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
              padding: isMobile ? '0.4rem' : '0.6rem',
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
                fontSize: isMobile ? '0.4rem' : '0.7rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                📅 Schedule
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.8rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                {stats.eligibleOpponentsCount} available
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.65rem',
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
              padding: isMobile ? '0.4rem' : '0.6rem',
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
                fontSize: isMobile ? '0.4rem' : '0.7rem',
                fontWeight: 'bold',
                color: '#e0e0e0',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                🏆 Matches
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.8rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                {upcomingMatches.length} upcoming
              </div>
              <div style={{
                fontSize: isMobile ? '0.35rem' : '0.65rem',
                color: '#e0e0e0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                click for details
              </div>
            </div>
          </div>

          {/* Upcoming Matches List - Only show if there are matches */}
          {upcomingMatches.length > 0 && (
            <div style={{
              marginBottom: isMobile ? '0.5rem' : '0.75rem'
            }}>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.7rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: isMobile ? '0.2rem' : '0.4rem',
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                Upcoming Matches
              </div>
              <div style={{
                maxHeight: isMobile ? '50px' : '60px',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                padding: isMobile ? '0.2rem' : '0.4rem'
              }}>
                {upcomingMatches.slice(0, 2).map((match, index) => {
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
                        fontSize: isMobile ? '0.3rem' : '0.6rem',
                        color: '#ffffff',
                        padding: isMobile ? '0.15rem 0.25rem' : '0.25rem 0.4rem',
                        marginBottom: isMobile ? '0.1rem' : '0.15rem',
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
                {upcomingMatches.length > 2 && (
                  <div style={{
                    fontSize: isMobile ? '0.3rem' : '0.6rem',
                    color: '#e0e0e0',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    padding: isMobile ? '0.15rem' : '0.25rem'
                  }}>
                    +{upcomingMatches.length - 2} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Summary - Compact Version */}
          <div style={{ 
            padding: isMobile ? '0.4rem' : '0.6rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: isMobile ? '0.35rem' : '0.65rem',
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
       
       {/* Phase 2 Rules Modal */}
       <Phase2RulesModal
         isOpen={showRulesModal}
         onClose={() => setShowRulesModal(false)}
         isMobile={isMobile}
       />
     </div>
   );
 } 