import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import styles from './dashboard.module.css';

export default function Phase2Tracker({ playerName, playerLastName, selectedDivision, phase }) {
  const [stats, setStats] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fullPlayerName = `${playerName} ${playerLastName}`;

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
      <div className={styles.phaseTrackerContainer} style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          Loading Phase 2 challenge statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.phaseTrackerContainer} style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          textAlign: 'center', 
          color: '#e53e3e',
          background: 'rgba(229, 62, 62, 0.1)',
          border: '1px solid #e53e3e',
          borderRadius: '6px',
          padding: '0.5rem'
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!stats || !limits) {
    return null;
  }

  // Calculate dynamic status and colors like Phase1Tracker
  const getChallengeStatus = () => {
    const totalMatches = stats.totalChallengeMatches;
    const maxMatches = limits.limits.maxChallengeMatches;
    const remainingChallenges = stats.remainingChallenges;
    const remainingDefenses = stats.remainingDefenses;
    
    // Determine status based on multiple factors
    if (stats.hasReachedChallengeLimit && stats.hasReachedDefenseLimit) {
      return 'completed'; // All matches done
    } else if (stats.hasReachedChallengeLimit || stats.hasReachedDefenseLimit) {
      return 'limit_reached'; // Hit one limit
    } else if (totalMatches >= 3) {
      return 'active'; // Good progress
    } else if (totalMatches >= 1) {
      return 'progressing'; // Started
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

  // Dynamic primary color based on status
  const getPrimaryColor = () => {
    const status = getChallengeStatus();
    switch (status) {
      case 'completed': return '#00aa00';      // Green - all done
      case 'limit_reached': return '#e53e3e';  // Red - hit limit
      case 'active': return '#28a745';         // Green - good progress
      case 'progressing': return '#ffaa00';    // Yellow - started
      case 'ready': return '#ffc107';          // Yellow - ready to start
      default: return '#ffc107';
    }
  };

  // Dynamic background gradient like Phase1Tracker
  const getBackgroundStyle = () => {
    const primaryColor = getPrimaryColor();
    return {
      background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}25)`,
      border: `2px solid ${primaryColor}`,
      borderRadius: '12px',
      padding: '16px',
      margin: '16px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      cursor: 'pointer'
    };
  };

  // Status message with emojis
  const getStatusMessage = () => {
    const status = getChallengeStatus();
    const remainingChallenges = stats.remainingChallenges;
    const remainingDefenses = stats.remainingDefenses;
    
    switch (status) {
      case 'completed':
        return '🎉 Phase 2 Complete! You have played all your challenge matches.';
      case 'limit_reached':
        return '⚠️ Challenge limit reached. You can still defend if eligible.';
      case 'active':
        return `🏆 Active in Phase 2! You have ${remainingChallenges} challenges and ${remainingDefenses} defenses remaining.`;
      case 'progressing':
        return `📈 Phase 2 in progress! You have ${remainingChallenges} challenges and ${remainingDefenses} defenses remaining.`;
      case 'ready':
        return `⚔️ Ready for Phase 2! You can challenge ${stats.eligibleOpponentsCount} opponent${stats.eligibleOpponentsCount !== 1 ? 's' : ''} and have ${remainingChallenges} challenges remaining.`;
      default:
        return 'Phase 2 Challenge Status';
    }
  };

  const primaryColor = getPrimaryColor();
  
  // Check if we're on a mobile device
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{
      ...getBackgroundStyle(),
      padding: isMobile ? '12px' : '16px',
      margin: isMobile ? '12px 0' : '16px 0'
    }}
    onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginBottom: isMobile ? '8px' : '12px'
      }}>
        <h3 style={{
          margin: 0,
          color: primaryColor,
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {getChallengeStatus() === 'completed' && '🎉'}
          {getChallengeStatus() === 'limit_reached' && '⚠️'}
          {getChallengeStatus() === 'active' && '🏆'}
          {getChallengeStatus() === 'progressing' && '📈'}
          {getChallengeStatus() === 'ready' && '⚔️'}
          <span style={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
            Phase 2: Challenge Tracker
          </span>
        </h3>
        
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: primaryColor,
          fontWeight: 'bold',
          marginTop: '4px'
        }}>
          Phase 2, Week {stats.currentWeek} • Rank #{stats.currentStanding || 'N/A'}
        </div>
        
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          color: primaryColor,
          fontWeight: 'bold',
          position: 'absolute',
          bottom: '0',
          right: '0',
          fontSize: '0.8rem'
        }}>
          {isExpanded ? 'Hide Stats' : 'Show Stats'}
        </div>
      </div>

      {/* Status Message */}
      <div style={{
        color: '#fff',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        lineHeight: '1.4',
        marginBottom: isMobile ? '8px' : '12px'
      }}>
        {getStatusMessage()}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Main Stats Grid - Better Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: isMobile ? '1rem' : '1.5rem'
          }}>
            {/* Challenge Matches */}
            <div style={{ 
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                <span style={{ color: '#fff' }}>⚔️ Challenge Matches</span>
                <span style={{ 
                  color: getStatusColor(stats.isEligibleForChallenges),
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {stats.totalChallengeMatches}/{limits.limits.maxChallengeMatches}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: `${(stats.totalChallengeMatches / limits.limits.maxChallengeMatches) * 100}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(stats.totalChallengeMatches, limits.limits.maxChallengeMatches),
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '0.5rem', color: '#ccc' }}>
                  <span style={{ color: '#28a745' }}>Challenger:</span> {stats.matchesAsChallenger} | 
                  <span style={{ color: '#ffc107' }}> Defender:</span> {stats.matchesAsDefender}
                </div>
                <div style={{ 
                  color: stats.remainingChallenges > 0 ? '#28a745' : '#e53e3e',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {stats.remainingChallenges > 0 ? '✅' : '❌'} Remaining: {stats.remainingChallenges}
                </div>
              </div>
            </div>

            {/* Defense Status */}
            <div style={{ 
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                <span style={{ color: '#fff' }}>🛡️ Defense Status</span>
                <span style={{ 
                  color: getStatusColor(stats.isEligibleForDefense),
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {stats.requiredDefenses}/{limits.limits.maxRequiredDefenses}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: `${(stats.requiredDefenses / limits.limits.maxRequiredDefenses) * 100}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(stats.requiredDefenses, limits.limits.maxRequiredDefenses),
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '0.5rem', color: '#ccc' }}>
                  <span style={{ color: '#e53e3e' }}>Required:</span> {stats.requiredDefenses}/2 | 
                  <span style={{ color: '#ffc107' }}> Voluntary:</span> {stats.voluntaryDefenses}
                </div>
                <div style={{ 
                  color: stats.requiredDefenses < 2 ? '#28a745' : '#ffc107',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {stats.requiredDefenses < 2 ? '⚠️' : '✅'} Required Defenses: {stats.requiredDefenses < 2 ? `${2 - stats.requiredDefenses} left` : 'Complete'}
                </div>
              </div>
            </div>

            {/* Weekly Status */}
            <div style={{ 
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                <span style={{ color: '#fff' }}>📅 This Week</span>
                <span style={{ 
                  color: limits.weeklyStatus.canChallengeThisWeek || limits.weeklyStatus.canDefendThisWeek ? '#28a745' : '#e53e3e',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {limits.weeklyStatus.canChallengeThisWeek || limits.weeklyStatus.canDefendThisWeek ? '✅ Available' : '❌ Busy'}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '0.5rem', color: '#ccc' }}>
                  <span style={{ color: '#28a745' }}>Challenges:</span> {limits.weeklyStatus.challengesThisWeek} | 
                  <span style={{ color: '#ffc107' }}> Defenses:</span> {limits.weeklyStatus.defensesThisWeek}
                </div>
                <div style={{ 
                  color: limits.weeklyStatus.canChallengeThisWeek ? '#28a745' : '#e53e3e',
                  marginBottom: '0.25rem'
                }}>
                  {limits.weeklyStatus.canChallengeThisWeek ? '✅' : '❌'} Can Challenge: {limits.weeklyStatus.canChallengeThisWeek ? 'Yes' : 'No'}
                </div>
                <div style={{ 
                  color: limits.weeklyStatus.canDefendThisWeek ? '#28a745' : '#ffc107'
                }}>
                  {limits.weeklyStatus.canDefendThisWeek ? '⚠️' : '❌'} Must Defend: {limits.weeklyStatus.canDefendThisWeek ? 'If Challenged' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary - Enhanced */}
          <div style={{ 
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: `2px solid ${primaryColor}60`,
            borderRadius: '8px',
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: primaryColor, fontSize: '1rem' }}>Status:</strong>
                <span style={{ 
                  color: '#fff', 
                  fontSize: '1rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  background: `${primaryColor}20`,
                  borderRadius: '4px',
                  border: `1px solid ${primaryColor}40`
                }}>
                  {getChallengeStatus().replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#888',
                fontStyle: 'italic'
              }}>
                Updated: {new Date(stats.lastUpdated).toLocaleDateString()}
              </div>
            </div>
            
            {/* Quick Actions Info */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#fff',
              lineHeight: '1.5',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {stats.eligibleOpponentsCount > 0 && stats.remainingChallenges > 0 && limits.weeklyStatus.canChallengeThisWeek ? (
                <div style={{ 
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <span>You can challenge <strong>{stats.eligibleOpponentsCount}</strong> opponent{stats.eligibleOpponentsCount !== 1 ? 's' : ''} this week</span>
                </div>
              ) : stats.remainingDefenses > 0 && limits.weeklyStatus.canDefendThisWeek ? (
                <div style={{ 
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <span>You can accept defense challenges this week</span>
                </div>
              ) : limits.weeklyStatus.canDefendThisWeek ? (
                <div style={{ 
                  color: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <span>You have no matches scheduled this week - you <strong>MUST</strong> accept defense challenges</span>
                </div>
              ) : (
                <div style={{ 
                  color: '#ffc107',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⏳</span>
                  <span>Waiting for next week or opponent selection</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 