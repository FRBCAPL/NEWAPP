import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { seasonService } from '../../services/seasonService';
import fetchSheetData from '../../utils/fetchSheetData';
import { parseAvailability } from '../../utils/parseAvailability';
import OpponentsModal from './OpponentsModal';
import PlayerSearch from './PlayerSearch';
import PlayerAvailabilityModal from './PlayerAvailabilityModal';
import MatchProposalModal from './MatchProposalModal';
import DraggableModal from './DraggableModal';
import { BACKEND_URL } from '../../config.js';

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

export default function DivisionSelectorModal({ 
  userName, 
  userEmail, 
  userPin, 
  onClose,
  fromChat = false
}) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [currentPhase, setCurrentPhase] = useState('scheduled');
  const [showOpponents, setShowOpponents] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showPlayerAvailability, setShowPlayerAvailability] = useState(false);
  const [showMatchProposal, setShowMatchProposal] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [proposalData, setProposalData] = useState(null);
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
      const scheduleUrl = `${BACKEND_URL}/static/${scheduleFileName}?t=${Date.now()}`;
      
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
        p => p.name && p.name.trim().toLowerCase() === name.toLowerCase()
      );
      
      return { match: m, player: playerObj, opponentName: name };
    }).filter(Boolean);
    
    return opponentsToSchedule;
  };

  // Handle opponent selection
  const handleOpponentClick = async (opponentName) => {
    const playerObj = players.find(
      p => p.name && p.name.trim().toLowerCase() === opponentName.trim().toLowerCase()
    );
    
    if (!playerObj) {
      alert("Player data not found for: " + opponentName);
      return;
    }
    if (!playerObj.email) {
      alert("This opponent does not have an email on file and cannot be proposed a match.");
      return;
    }
    
    if (fromChat) {
      // From chat: fetch detailed player data and open availability modal
      try {
        console.log('Fetching detailed player data for:', opponentName);
        const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
        const sheetData = rows
          .slice(1)
          .map(row => ({
            firstName: row[0] || "",
            lastName: row[1] || "",
            email: row[2] || "",
            phone: row[3] || "",
            locations: row[8] || "",
            availability: row[7] || "",
            pin: row[11] || "",
            preferredContacts: (row[10] || "")
              .split(/\r?\n/)
              .map(method => method.trim().toLowerCase())
              .filter(Boolean),
          }))
          .filter(p => p.email && p.firstName && p.lastName);
        
        const detailedPlayer = sheetData.find(
          p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === opponentName.trim().toLowerCase()
        );
        
                 if (detailedPlayer) {
           // Parse availability data
           console.log('Raw availability data:', detailedPlayer.availability);
           const parsedAvailability = parseAvailability(detailedPlayer.availability);
           console.log('Parsed availability:', parsedAvailability);
           const playerWithAvailability = {
             ...detailedPlayer,
             availability: parsedAvailability
           };
           console.log('Found detailed player data:', playerWithAvailability);
           setSelectedOpponent(playerWithAvailability);
        } else {
          console.log('No detailed data found, using basic player data');
          setSelectedOpponent(playerObj);
        }
      } catch (error) {
        console.error('Error fetching detailed player data:', error);
        setSelectedOpponent(playerObj);
      }
      
      setShowOpponents(false);
      setShowPlayerAvailability(true);
    } else {
      // From dashboard: open player search
      setShowOpponents(false);
      setShowPlayerSearch(true);
    }
  };

  // Handle match proposal from availability modal
  const handleProposeMatch = (day, slot, phase, division) => {
    console.log('Proposing match:', { day, slot, phase, division, opponent: selectedOpponent });
    setProposalData({
      day,
      slot,
      phase,
      division,
      opponent: selectedOpponent
    });
    setShowPlayerAvailability(false);
    setShowMatchProposal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowOpponents(false);
    setShowPlayerSearch(false);
    setShowPlayerAvailability(false);
    setShowMatchProposal(false);
    setSelectedOpponent(null);
    setProposalData(null);
    setSelectedDivision('');
    onClose();
  };

  if (loading) {
    return (
      <DraggableModal
        open={true}
        onClose={onClose}
        title="Loading Divisions..."
        maxWidth="500px"
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Please wait while we load your divisions...</p>
        </div>
      </DraggableModal>
    );
  }

  if (divisions.length === 0) {
    return (
      <DraggableModal
        open={true}
        onClose={onClose}
        title="No Divisions Found"
        maxWidth="500px"
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>You are not registered for any divisions. Please contact an administrator.</p>
          <button 
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
              color: "#fff",
              border: "2px solid #e53e3e",
              borderRadius: "8px",
              padding: "0.8rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginTop: "1rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "linear-gradient(135deg, #e53e3e 0%, #c00 100%)";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(229, 62, 62, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "linear-gradient(135deg, #232323 0%, #2a0909 100%)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Close
          </button>
        </div>
      </DraggableModal>
    );
  }

  return (
    <>
      {/* Division Selector Modal - only show when not showing other modals */}
      {!showOpponents && !showPlayerSearch && (
        <DraggableModal
          open={true}
          onClose={onClose}
          title="Select Division"
          maxWidth="500px"
        >
          <div style={{
            maxHeight: "60vh",
            overflowY: "auto"
          }}>
            <p style={{ 
              color: "#fff", 
              textAlign: "center", 
              marginBottom: "1.5rem",
              fontSize: "1rem"
            }}>
              Choose a division to schedule a match:
            </p>
            <div style={{
              display: "grid",
              gap: "12px"
            }}>
              {divisions.map(division => (
                <button
                  key={division}
                  onClick={() => handleDivisionSelect(division)}
                  style={{
                    background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                    color: "#fff",
                    border: "2px solid #e53e3e",
                    borderRadius: "8px",
                    padding: "1rem 1.5rem",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #e53e3e 0%, #c00 100%)";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(229, 62, 62, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #232323 0%, #2a0909 100%)";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  🏆 {division}
                </button>
              ))}
            </div>
          </div>
        </DraggableModal>
      )}

      {/* Opponents Modal for Phase 1 */}
      {showOpponents && (
        loadingSchedule ? (
          <DraggableModal
            open={true}
            onClose={handleModalClose}
            title="Loading Opponents..."
            maxWidth="500px"
          >
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>Please wait while we load your scheduled opponents...</p>
            </div>
          </DraggableModal>
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

             {/* Player Availability Modal for Chat */}
       {showPlayerAvailability && selectedOpponent && (
         <PlayerAvailabilityModal
           open={showPlayerAvailability}
           onClose={handleModalClose}
           player={selectedOpponent}
           senderName={userName}
           senderEmail={userEmail}
           selectedDivision={selectedDivision}
           onProposeMatch={handleProposeMatch}
           phase={currentPhase}
                  />
       )}

       {/* Match Proposal Modal */}
       {showMatchProposal && proposalData && (
         <MatchProposalModal
           open={showMatchProposal}
           onClose={handleModalClose}
           player={proposalData.opponent}
           day={proposalData.day}
           slot={proposalData.slot}
           senderName={userName}
           senderEmail={userEmail}
           selectedDivision={proposalData.division}
           phase={proposalData.phase}
           onProposalComplete={() => {
             console.log('Match proposal sent successfully');
             handleModalClose();
           }}
         />
       )}
     </>
   );
 }
