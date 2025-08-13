import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { seasonService } from '../../services/seasonService';
import OpponentsModal from './OpponentsModal';
import PlayerSearch from './PlayerSearch';
import styles from './PlayerModal.module.css';
import { BACKEND_URL } from '../../config.js';

export default function DivisionSelectorModal({ 
  userName, 
  userEmail, 
  userPin, 
  onClose 
}) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [currentPhase, setCurrentPhase] = useState('scheduled');
  const [showOpponents, setShowOpponents] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Fetch user divisions
  useEffect(() => {
    if (!userEmail) return;
    
    userService.getUser(userEmail)
      .then(user => {
        let divs = [];
        // Always expect user.divisions to be an array
        if (Array.isArray(user.divisions)) {
          divs = user.divisions.map(s => s.trim()).filter(Boolean);
        } else if (typeof user.divisions === "string") {
          divs = user.divisions.split(",").map(s => s.trim()).filter(Boolean);
        } else {
          divs = [];
        }
        setDivisions(divs);
        setLoading(false);
      })
      .catch(() => {
        setDivisions([]);
        setLoading(false);
      });
  }, [userEmail]);

  // Fetch schedule data for a division
  const fetchScheduleData = async (division) => {
    setLoadingSchedule(true);
    try {
      // Fetch schedule data
      const scheduleFileName = `schedule_${division.replace(/[^A-Za-z0-9]/g, '_')}.json`;
      const scheduleUrl = `${BACKEND_URL}/static/${scheduleFileName}`;
      
      console.log('🔍 Fetching schedule from:', scheduleUrl);
      
      const scheduleResponse = await fetch(scheduleUrl);
      if (!scheduleResponse.ok) throw new Error("Schedule not found");
      const scheduleData = await scheduleResponse.json();
      console.log('🔍 Schedule data loaded:', scheduleData.length, 'matches');
      setScheduledMatches(scheduleData);
      
      // Fetch players data
      const playersResponse = await fetch(`${BACKEND_URL}/api/users`);
      if (!playersResponse.ok) throw new Error("Players not found");
      const playersData = await playersResponse.json();
      console.log('🔍 Players data loaded:', playersData.length, 'players');
      setPlayers(playersData);
      
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      setScheduledMatches([]);
      setPlayers([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Handle division selection
  const handleDivisionSelect = async (division) => {
    setSelectedDivision(division);
    
    try {
      // Get current phase for this division
      const phaseResult = await seasonService.getCurrentPhaseAndWeek(division);
      const phase = phaseResult?.phase || 'scheduled';
      console.log('🔍 DivisionSelectorModal - Phase detection:', {
        division,
        phase,
        willShowOpponents: phase === 'scheduled' || phase === 'offseason'
      });
      setCurrentPhase(phase);
      
             // Open appropriate modal based on phase
       // For Phase 1, we want to show opponents (scheduled matches)
       // For Phase 2 or other phases, we want to show player search (challenge matches)
       if (phase === 'scheduled' || phase === 'offseason') {
         // Fetch schedule data for Phase 1 opponents
         console.log('🔍 Opening OpponentsModal for phase:', phase);
         await fetchScheduleData(division);
         setShowOpponents(true);
       } else {
         console.log('🔍 Opening PlayerSearch for phase:', phase);
         setShowPlayerSearch(true);
       }
    } catch (error) {
      console.error('Error fetching phase data:', error);
      // Default to PlayerSearch if phase detection fails
      setShowPlayerSearch(true);
    }
  };

  // Prepare opponents list for Phase 1 (same logic as dashboard)
  const getOpponentsToSchedule = () => {
    if (!scheduledMatches.length || !players.length) {
      return [];
    }
    
    const fullPlayerName = `${userName}`;
    const matchesToSchedule = [];
    
    for (const match of scheduledMatches) {
      if (match.player1 && match.player2 && !match.scheduled) {
        const player1Name = match.player1.trim();
        const player2Name = match.player2.trim();
        
        if (player1Name.toLowerCase() === fullPlayerName.toLowerCase() || 
            player2Name.toLowerCase() === fullPlayerName.toLowerCase()) {
          matchesToSchedule.push(match);
        }
      }
    }
    
    // Prepare the opponents list for the modal
    const opponentsToSchedule = matchesToSchedule.map(m => {
      const name = m.player1 && m.player1.trim().toLowerCase() === fullPlayerName.toLowerCase()
        ? m.player2?.trim()
        : m.player1?.trim();
      if (!name) return null;
      
      // Find the player object by name
      const playerObj = players.find(
        p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === name.toLowerCase()
      );
      
      return { match: m, player: playerObj, opponentName: name };
    }).filter(Boolean);
    
    return opponentsToSchedule;
  };

  // Handle opponent selection
  const handleOpponentClick = (opponentName) => {
    const playerObj = players.find(
      p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === opponentName.trim().toLowerCase()
    );
    
    if (!playerObj) {
      alert("Player data not found for: " + opponentName);
      return;
    }
    if (!playerObj.email) {
      alert("This opponent does not have an email on file and cannot be proposed a match.");
      return;
    }
    
    // Close opponents modal and open player search for this specific opponent
    setShowOpponents(false);
    setShowPlayerSearch(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowOpponents(false);
    setShowPlayerSearch(false);
    setSelectedDivision('');
    onClose();
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.playerModalTitle}>
            <h2>Loading Divisions...</h2>
          </div>
          <div className={styles.playerModalSection}>
            <p>Please wait while we load your divisions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (divisions.length === 0) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.playerModalTitle}>
            <h2>No Divisions Found</h2>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
          <div className={styles.playerModalSection}>
            <p>You are not registered for any divisions. Please contact an administrator.</p>
            <button onClick={onClose} className={styles.playerModalBtn}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Division Selector Modal - only show when not showing other modals */}
      {!showOpponents && !showPlayerSearch && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.playerModalTitle}>
              <h2>Select Division</h2>
              <button onClick={onClose} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.playerModalSection}>
              <p>Choose a division to schedule a match:</p>
              <div className={styles.divisionList}>
                {divisions.map(division => (
                  <button
                    key={division}
                    onClick={() => handleDivisionSelect(division)}
                    className={styles.divisionButton}
                  >
                    🏆 {division}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opponents Modal for Phase 1 */}
      {showOpponents && (
        loadingSchedule ? (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.playerModalTitle}>
                <h2>Loading Opponents...</h2>
              </div>
              <div className={styles.playerModalSection}>
                <p>Please wait while we load your scheduled opponents...</p>
              </div>
            </div>
          </div>
        ) : (
          <OpponentsModal
            open={showOpponents}
            onClose={handleModalClose}
            opponents={getOpponentsToSchedule()}
            onOpponentClick={handleOpponentClick}
            phase={currentPhase}
          />
        )
      )}

      {/* Player Search Modal for Phase 2 */}
      {showPlayerSearch && (
        <PlayerSearch
          onClose={handleModalClose}
          excludeName={userName}
          senderName={userName}
          senderEmail={userEmail}
          onProposalComplete={() => {
            console.log('Proposal sent successfully');
            handleModalClose();
          }}
          selectedDivision={selectedDivision}
          phase={currentPhase}
        />
      )}
    </>
  );
}
