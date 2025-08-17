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
    selectedDivision,
    onOpenOpponentsModal,
    onOpenCompletedMatchesModal,
    onOpenStandingsModal,
    onOpenAllMatchesModal,
    pendingCount,
    sentCount,
    onOpenProposalListModal,
    onOpenSentProposalListModal,
    upcomingMatches,
    onMatchClick,
    isMobile
  }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [deadlineStatus, setDeadlineStatus] = useState('normal');
  const [standingsImpact, setStandingsImpact] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [phase1EndDate, setPhase1EndDate] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!selectedDivision || currentPhase !== 'scheduled') {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = async () => {
      try {
        // Load schedule from the backend to get current match dates
        const safeDivision = selectedDivision.replace(/[^A-Za-z0-9]/g, '_');
        const scheduleUrl = `${BACKEND_URL}/static/schedule_${safeDivision}.json`;
        
        const response = await fetch(scheduleUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch schedule: ${response.status} - ${response.statusText}`);
          return;
        }
        
        const scheduleData = await response.json();
        
        if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
          console.warn('No schedule data available');
          return;
        }

        // Calculate Phase 1 deadline based on the 6th week of matches (Phase 1 = 6 weeks)
        // Sort matches by date and get the last match of week 6
        const sortedMatches = scheduleData
          .filter(match => match.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedMatches.length === 0) {
          console.warn('No valid matches found in schedule');
          return;
        }

        // Get the 6th week matches (assuming 8 matches per week, so matches 33-40)
        // Adjust this calculation based on your actual schedule structure
        const phase1EndMatchIndex = Math.min(47, sortedMatches.length - 1); // 6 weeks * 8 matches = 48 matches, but use 47 for index
        const phase1EndMatch = sortedMatches[phase1EndMatchIndex];
        
        if (!phase1EndMatch || !phase1EndMatch.date) {
          console.warn('Could not determine Phase 1 end date from schedule');
          return;
        }

                 // Set deadline to end of the day for the last Phase 1 match
         const phase1EndDate = new Date(phase1EndMatch.date);
         phase1EndDate.setHours(23, 59, 59, 999); // End of day
         
         // Store the date for display
         setPhase1EndDate(phase1EndDate);
         
         const now = new Date();
        
        if (isAfter(now, phase1EndDate)) {
          setTimeLeft({ days: 0, hours: 0, passed: true });
          setDeadlineStatus('passed');
        } else {
          const daysLeft = differenceInDays(phase1EndDate, now);
          const hoursLeft = differenceInHours(phase1EndDate, now) % 24;
          
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
      } catch (error) {
        console.error('Error calculating Phase 1 deadline from schedule:', error);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [selectedDivision, currentPhase]);

  useEffect(() => {
    if (currentPhase === 'scheduled' && selectedDivision && completedMatches) {
      calculateStandingsImpact();
      calculatePlayerStats();
    }
  }, [currentPhase, selectedDivision, completedMatches, totalRequiredMatches, standings]);

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
    let wins = 0;
    let losses = 0;
    const fullPlayerName = `${playerName} ${playerLastName}`;

    // Calculate wins/losses from completed matches
    if (completedMatches && completedMatches.length > 0) {
      completedMatches.forEach(match => {
        if (match.winner === fullPlayerName) {
          wins++;
        } else {
          losses++;
        }
      });
    }

    const winRate = completedMatches && completedMatches.length > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    
    // Get actual standings position - this should work regardless of completed matches
    const actualPosition = getPlayerPosition(standings, fullPlayerName);
    let positionDisplay = 'N/A';
    
    if (actualPosition !== null) {
      positionDisplay = `${actualPosition}${getOrdinalSuffix(actualPosition)}`;
    } else if (completedMatches && completedMatches.length >= 1) {
      // Fallback to estimated position if not in standings but has completed matches
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
    return '#ff4444';                                      // Red instead of green
  };



  const getStatusMessage = () => {
    if (deadlineStatus === 'passed') {
      return '⚠️ DEADLINE PASSED!';
    } else if (deadlineStatus === 'critical') {
      const endDate = phase1EndDate ? format(phase1EndDate, isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `🚨 CRITICAL: ENDS in ${timeLeft.hours} hours! (${endDate})`;
    } else if (deadlineStatus === 'urgent') {
      const endDate = phase1EndDate ? format(phase1EndDate, isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `⚠️ URGENT: ENDS in ${timeLeft.days} days! (${endDate})`;
    } else if (deadlineStatus === 'warning') {
      const endDate = phase1EndDate ? format(phase1EndDate, isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `⚠️ WARNING: ENDS in ${timeLeft.days} days. (${endDate})`;
    } else {
      const endDate = phase1EndDate ? format(phase1EndDate, isMobile ? 'MMM d' : 'MMM d, yyyy') : '';
      return `ENDS in ${timeLeft.days} days. (${endDate})`;
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedMatches.length / totalRequiredMatches) * 100);
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
                                                                       height: isMobile ? (isExpanded ? '180px' : '40px') : (isExpanded ? '400px' : '160px'),
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
             {deadlineStatus === 'critical' && '🚨'}
             {deadlineStatus === 'urgent' && '⚠️'}
             {deadlineStatus === 'warning' && '⚠️'}
             {deadlineStatus === 'passed' && '⏰'}
             {deadlineStatus === 'normal' && '📅'}
                           <span style={{ fontSize: isMobile ? '0.6rem' : '1.1rem' }}>
               Phase 1
             </span>
           </h3>
          
                     {/* Status Message - ends in XX days */}
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
           
           {/* Completion counter */}
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
               {completedMatches.length}/{totalRequiredMatches} Matches Complete
             </div>
           )}
           
                                   {/* Remaining matches counter */}
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
                {totalRequiredMatches - completedMatches.length} to Schedule
              </div>
            )}
           
           {/* Removed the absolutely positioned Show Stats text */}
         </div>

       {/* Show Stats Button - 4th line */}
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
                     {/* Compact Stats Row */}
                       <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
                             marginBottom: isMobile ? '0px' : '12px',
                             gap: isMobile ? '0px' : '8px'
            }}>
                                      {/* Progress Section */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenOpponentsModal) onOpenOpponentsModal();
                }}
                                                                   style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: isMobile ? '1px' : '4px',
                    borderRadius: '6px',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   border: '1px solid rgba(255,255,255,0.1)',
                   flex: 1,
                   textAlign: 'center'
                 }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = '#4CAF50';
                 e.currentTarget.style.transform = 'translateY(-1px)';
                 e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)';
                 e.currentTarget.style.border = '1px solid #4CAF50';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
                 e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
               }}
             >
                                                               <div style={{
                   fontSize: isMobile ? '0.35rem' : '0.8rem',
                   fontWeight: 'bold',
                   color: '#e0e0e0',
                                      marginBottom: isMobile ? '2px' : '2px'
                  }}>
                    Progress
                  </div>
                 <div style={{
                   fontSize: isMobile ? '0.4rem' : '0.9rem',
                   color: '#ffffff',
                   fontWeight: 'bold',
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   marginBottom: isMobile ? '1px' : '4px'
                }}>
                  {completedMatches.length}/{totalRequiredMatches}
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
                     width: `${getProgressPercentage()}%`,
                     height: '100%',
                     background: `linear-gradient(90deg, #4CAF50, #45a049)`,
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
                    click to schedule
                  </div>
             </div>

                         {/* Record Section */}
             <div
               onClick={(e) => {
                 e.stopPropagation();
                 if (onOpenCompletedMatchesModal) onOpenCompletedMatchesModal();
               }}
               style={{
                 background: 'rgba(255,255,255,0.1)',
                 padding: isMobile ? '1px' : '8px',
                 borderRadius: '4px',
                 cursor: 'pointer',
                 transition: 'all 0.2s ease',
                 border: '1px solid rgba(255,255,255,0.1)',
                 flex: 1,
                 textAlign: 'center'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = '#2196F3';
                 e.currentTarget.style.transform = 'translateY(-1px)';
                 e.currentTarget.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.4)';
                 e.currentTarget.style.border = '1px solid #2196F3';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
                 e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
               }}
             >
                               <div style={{
                  fontSize: isMobile ? '0.35rem' : '0.8rem',
                  fontWeight: 'bold',
                  color: '#e0e0e0',
                                   marginBottom: isMobile ? '1px' : '2px'
                }}>
                  Record
                </div>
                               <div style={{
                  fontSize: isMobile ? '0.5rem' : '0.9rem',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  marginBottom: isMobile ? '1px' : '2px'
                }}>
                  {playerStats?.wins || 0}-{playerStats?.losses || 0} ({playerStats?.winRate || 0}%)
                </div>
                                <div style={{
                 fontSize: isMobile ? '0.4rem' : '0.75rem',
                 color: '#e0e0e0',
                 fontStyle: 'italic',
                 textAlign: 'center',
                 fontWeight: '500'
               }}>
                 click to see results
                 </div>
             </div>

            {/* Position Section */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenStandingsModal) onOpenStandingsModal();
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: isMobile ? '1px' : '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255,255,255,0.1)',
                flex: 1,
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FF9800';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.4)';
                e.currentTarget.style.border = '1px solid #FF9800';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
              }}
            >
                                                         <div style={{
                 fontSize: isMobile ? '0.35rem' : '0.8rem',
                 fontWeight: 'bold',
                 color: '#e0e0e0',
                 marginBottom: isMobile ? '1px' : '2px'
               }}>
                 Position
               </div>
                             <div style={{
                                 fontSize: isMobile ? '0.4rem' : '0.9rem',
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                marginBottom: isMobile ? '1px' : '2px'
              }}>
                {loadingStandings ? '...' : (playerStats?.position || 'N/A')}
              </div>
               <div style={{
                 fontSize: isMobile ? '0.4rem' : '0.75rem',
                 color: '#e0e0e0',
                 fontStyle: 'italic',
                 textAlign: 'center',
                 fontWeight: '500'
               }}>
                 click to view standings
               </div>
            </div>
          </div>

                                                                                       {/* Compact Proposals & Matches Row */}
                         <div style={{
                display: 'flex',
                               gap: isMobile ? '1px' : '8px',
                                                                                                                         marginBottom: isMobile ? '1px' : '12px'
              }}>
                                                     {/* Proposals Section */}
                                                                                                                                                                                   <div style={{
                      flex: '0 0 calc(33.333% - 5.33px)',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                                       padding: isMobile ? '2px' : '10px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                                                               <div style={{
                   fontSize: isMobile ? '0.3rem' : '0.8rem',
                   color: '#fff',
                   fontWeight: 'bold',
                   marginBottom: isMobile ? '1px' : '4px',
                   textAlign: 'center'
                 }}>
                   📋 Proposals
                 </div>
                                                                                                                                                                                               <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     gap: isMobile ? '4px' : '8px',
                     justifyContent: 'center'
                   }}>
                                       <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenProposalListModal) onOpenProposalListModal();
                      }}
                                          style={{
                         background: '#f0ad4e',
                         color: '#222',
                         border: '1px solid #d32f2f',
                         borderRadius: '4px',
                         padding: isMobile ? '1px 3px' : '6px 10px',
                         fontSize: isMobile ? '0.45rem' : '0.85rem',
                         fontWeight: '600',
                         cursor: 'pointer',
                         boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                         transition: 'all 0.2s ease',
                         width: '100%'
                       }}
                     onMouseEnter={(e) => {
                       e.target.style.background = '#e09b3d';
                       e.target.style.transform = 'translateY(-1px)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.background = '#f0ad4e';
                       e.target.style.transform = 'translateY(0)';
                     }}
                                    >
                                             📥 {pendingCount} waiting for you
                    </button>
                                         <button
                       onClick={(e) => {
                         e.stopPropagation();
                         if (onOpenSentProposalListModal) onOpenSentProposalListModal();
                       }}
                                            style={{
                          background: '#00aa85',
                          color: '#fff',
                          border: '1px solid #f10',
                          borderRadius: '4px',
                                                  padding: isMobile ? '1px 3px' : '6px 10px',
                           fontSize: isMobile ? '0.45rem' : '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#009973';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#00aa85';
                        e.target.style.transform = 'translateY(0)';
                      }}
                     >
                                             📤 {sentCount} waiting for opponents
                   </button>
                 </div>
             </div>

                                                                                                                                                                                                               {/* Upcoming Matches Section */}
                                <div 
                   onClick={(e) => {
                     e.stopPropagation();
                     if (onOpenAllMatchesModal) onOpenAllMatchesModal();
                   }}
                                    style={{
                     flex: '0 0 calc(66.667% - 2.67px)',
                     background: 'rgba(0,0,0,0.3)',
                     borderRadius: '4px',
                                          padding: isMobile ? '0px' : '6px',
                     border: '1px solid rgba(255,255,255,0.1)',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease'
                   }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                   e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                   e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
                 }}
               >
                                                                                                                                                                     <div style={{
                                            fontSize: isMobile ? '0.4rem' : '1.1rem',
                       color: '#fff',
                       fontWeight: 'bold',
                       marginBottom: '0px',
                       textAlign: 'center',
                       cursor: 'pointer',
                       textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                       letterSpacing: '0.5px'
                                          }}>
                                              🎯 Upcoming Confirmed Matches
                      </div>
                                         {/* Click for details instruction */}
                                                                                                                                                                    <div style={{
                                             fontSize: isMobile ? '0.3rem' : '0.75rem',
                                             color: '#e0e0e0',
                                             textAlign: 'center',
                                             fontStyle: 'italic',
                                             fontWeight: '500',
                                             marginTop: '0px',
                                             marginBottom: '0px',
                                             padding: '0px'
                                           }}>
                                           click match for details
                                         </div>
                                                                                                                                 {/* Upcoming Matches List */}
                                 {(() => {
                                   // Use actual upcomingMatches data
                                   const displayMatches = upcomingMatches;
                                   
                                   return displayMatches && displayMatches.length > 0 ? (
                                     <div style={{
                                       display: 'flex',
                                       flexDirection: 'column',
                                       gap: '1px',
                                       marginTop: isMobile ? '2px' : '4px'
                                     }}>
                                      {/* Show up to 3 matches */}
                                      {displayMatches.slice(0, 3).map((match, index) => (
                      <div 
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMatchClick && match) {
                            onMatchClick(match);
                          }
                        }}
                                                                                                   style={{
                            fontSize: isMobile ? '0.35rem' : '0.8rem',
                            color: '#ccc',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            padding: isMobile ? '0px 0px' : '2px 3px',
                            borderRadius: '2px',
                            transition: 'all 0.2s ease'
                          }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#ffffff';
                          e.target.style.background = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#ccc';
                          e.target.style.background = 'transparent';
                        }}
                      >
                        {(() => {
                          let opponent = '';
                          let dateStr = '';
                          
                          if (match.type === 'scheduled') {
                            if (match.player1 && match.player2) {
                              opponent = match.player1.trim().toLowerCase() === `${playerName} ${playerLastName}`.trim().toLowerCase() ? 
                                match.player2 : match.player1;
                            }
                            // Handle scheduled match dates - could be in MM/DD/YYYY or YYYY-MM-DD format
                            if (match.date) {
                              let dateObj;
                              if (match.date.includes('/')) {
                                // MM/DD/YYYY format
                                const parts = match.date.split('/');
                                if (parts.length === 3) {
                                  const [month, day, year] = parts;
                                  // Create date using local timezone to avoid shifts
                                  dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                }
                              } else if (match.date.includes('-')) {
                                // YYYY-MM-DD format - use local timezone
                                const [year, month, day] = match.date.split('-');
                                dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              }
                              
                              if (dateObj && !isNaN(dateObj.getTime())) {
                                dateStr = format(dateObj, isMobile ? 'MMM d' : 'MMM d');
                              }
                            }
                          } else {
                            if (match.senderName && match.receiverName) {
                              opponent = match.senderName.trim().toLowerCase() === `${playerName} ${playerLastName}`.trim().toLowerCase() ? 
                                match.receiverName : match.senderName;
                            }
                            // Handle proposal match dates - typically YYYY-MM-DD format
                            if (match.date) {
                              let dateObj;
                              if (match.date.includes('-')) {
                                // YYYY-MM-DD format - use local timezone
                                const [year, month, day] = match.date.split('-');
                                dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              } else if (match.date.includes('/')) {
                                // MM/DD/YYYY format
                                const parts = match.date.split('/');
                                if (parts.length === 3) {
                                  const [month, day, year] = parts;
                                  dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                }
                              }
                              
                              if (dateObj && !isNaN(dateObj.getTime())) {
                                dateStr = format(dateObj, isMobile ? 'MMM d' : 'MMM d');
                              }
                            }
                          }
                          
                          if (!opponent) return 'No matches';
                          
                          return dateStr ? `vs ${opponent} (${dateStr})` : `vs ${opponent}`;
                        })()}
                      </div>
                    ))}
                    
                                                           {/* Show "more" indicator if there are more than 3 matches */}
                                       {displayMatches.length > 3 && (
                                                                                   <div style={{
                                            fontSize: isMobile ? '0.25rem' : '0.55rem',
                                            color: '#888',
                                            textAlign: 'center',
                                            fontStyle: 'italic',
                                            padding: isMobile ? '0px' : '1px'
                                          }}>
                                            +{displayMatches.length - 3} more
                                          </div>
                                                                               )}
                                      </div>
                                   ) : (
                                                                           <div style={{
                                        fontSize: isMobile ? '0.4rem' : '0.7rem',
                                        color: '#999',
                                        textAlign: 'center'
                                      }}>
                                        No matches
                                      </div>
                                   );
                                 })()}
             </div>
          </div>


        </>
      )}

    </div>
  );
};

export default Phase1Tracker; 