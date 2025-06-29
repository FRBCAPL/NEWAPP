import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Highlight from "../Highlight";
import fetchSheetData from "../../utils/fetchSheetData";
import PlayerAvailabilityModal from "./PlayerAvailabilityModal";
import MatchProposalModal from "./MatchProposalModal";
import DraggableModal from "./DraggableModal";
import styles from "./PlayerSearch.module.css";

// --- Google Sheet details (safe for public read-only use) ---
const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

// Division-specific standings URLs (same as Dashboard)
const STANDINGS_URLS = {
  "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
  "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// --- Utility: Normalize time string for display ---
function normalizeTime(str) {
  if (!str) return "";
  str = str.trim().toLowerCase().replace(/\s+/g, "");
  let match = str.match(/^(\d{1,2})(:?(\d{2}))?(am|pm)$/);
  if (!match) return str.toUpperCase();
  let [, h, , m, ap] = match;
  if (!m) m = "00";
  return `${parseInt(h, 10)}:${m} ${ap.toUpperCase()}`;
}

// --- Utility: Parse availability string into day-slot map ---
function parseAvailability(str) {
  const dayMap = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };
  const result = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
  if (!str) return result;
  str.split(/\r?\n/).forEach(line => {
    const match = line.match(/Day:\s*(\w+),\s*Available From:\s*([\w:]+),\s*Available Until:\s*([\w: ]+)/i);
    if (match) {
      const [_, dayFull, from, until] = match;
      const dayShort = dayMap[dayFull];
      if (dayShort) {
        const fromNorm = normalizeTime(from);
        const untilNorm = normalizeTime(until);
        result[dayShort].push(`${fromNorm} - ${untilNorm}`);
      }
    }
  });
  return result;
}

// --- Utility: Load standings data ---
async function loadStandings(selectedDivision) {
  try {
    if (!selectedDivision) {
      console.warn('No division selected for standings');
      return [];
    }

    // Use the backend to fetch standings JSON for the division
    const safeDivision = selectedDivision.replace(/[^A-Za-z0-9]/g, '_');
    const standingsUrl = `${BACKEND_URL}/static/standings_${safeDivision}.json`;
    const response = await fetch(standingsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch standings: ${response.status}`);
    }
    const standings = await response.json();

    // Validate standings data structure
    if (!Array.isArray(standings)) {
      console.error('Standings data is not an array:', standings);
      return [];
    }

    // Validate each entry has required fields
    const validStandings = standings.filter(entry => {
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

    console.log(`Loaded ${validStandings.length} valid standings entries for division: ${selectedDivision}`);
    return validStandings;
  } catch (error) {
    console.error('Failed to load standings:', error);
    return [];
  }
}

// --- Utility: Get player's standings position ---
function getPlayerPosition(standings, playerName) {
  const normalizedPlayerName = playerName.toLowerCase().trim();
  const playerEntry = standings.find(entry => 
    entry.name.toLowerCase().trim() === normalizedPlayerName
  );
  return playerEntry ? parseInt(playerEntry.rank) : null;
}

// --- Utility: Sort players by standings rank ---
function sortPlayersByRank(players, standings) {
  return players.sort((a, b) => {
    const aName = `${a.firstName} ${a.lastName}`;
    const bName = `${b.firstName} ${b.lastName}`;
    const aRank = getPlayerPosition(standings, aName);
    const bRank = getPlayerPosition(standings, bName);
    
    // If both have ranks, sort by rank (lower number = better rank)
    if (aRank !== null && bRank !== null) {
      return aRank - bRank;
    }
    
    // If only one has a rank, put the ranked player first
    if (aRank !== null && bRank === null) {
      return -1;
    }
    if (aRank === null && bRank !== null) {
      return 1;
    }
    
    // If neither has a rank, sort alphabetically
    return aName.localeCompare(bName);
  });
}

// --- Utility: Filter players based on Phase 2 rules ---
function filterPlayersForPhase2(players, standings, currentPlayerName) {
  if (!standings || standings.length === 0) {
    console.warn('No standings data available for Phase 2 filtering');
    return players; // Return all players if standings unavailable
  }

  console.log('=== PHASE 2 FILTERING DEBUG ===');
  console.log('Current player name:', currentPlayerName);
  console.log('Standings data:', standings);
  console.log('All players from sheet:', players.map(p => `${p.firstName} ${p.lastName}`));

  const currentPlayerPosition = getPlayerPosition(standings, currentPlayerName);
  if (currentPlayerPosition === null) {
    console.warn(`Player ${currentPlayerName} not found in standings`);
    console.log('Available standings names:', standings.map(s => s.name));
    return players; // Return all players if current player not in standings
  }

  console.log(`Phase 2 filtering: ${currentPlayerName} is at position ${currentPlayerPosition}`);

  const eligiblePlayers = players.filter(player => {
    const opponentName = `${player.firstName} ${player.lastName}`;
    const opponentPosition = getPlayerPosition(standings, opponentName);
    
    if (opponentPosition === null) {
      console.warn(`Opponent ${opponentName} not found in standings - excluding from Phase 2`);
      return false; // Exclude players not in standings
    }

    // Phase 2 rule: can only challenge players within 4 spots above (better ranked)
    // Lower position number = better rank
    const positionDifference = opponentPosition - currentPlayerPosition;
    const isEligible = positionDifference < 0 && positionDifference >= -4;
    
    console.log(`${opponentName} (${opponentPosition}) - difference: ${positionDifference}, eligible: ${isEligible}`);
    
    return isEligible;
  });

  console.log(`Phase 2 filtering complete: ${eligiblePlayers.length} eligible opponents out of ${players.length} total players`);
  console.log('Eligible players:', eligiblePlayers.map(p => `${p.firstName} ${p.lastName}`));
  console.log('=== END PHASE 2 DEBUG ===');
  return eligiblePlayers;
}

/**
 * PlayerSearch - Modal for searching and selecting a player to propose a match.
 * @param {function} onClose - callback to close the modal
 * @param {string} excludeName - player name to exclude from search
 * @param {string} senderName - name of the user sending the proposal
 * @param {string} senderEmail - email of the user sending the proposal
 * @param {function} onProposalComplete - callback after proposal is sent
 * @param {string} phase - the selected phase ("challenge" or "scheduled")
 */
export default function PlayerSearch({
  onClose,
  excludeName,
  senderName,
  senderEmail,
  onProposalComplete,
  selectedDivision,
  phase,
}) {
  console.log("🎯 PlayerSearch Component - Received phase:", phase);
  console.log("🎯 PlayerSearch Component - senderName:", senderName);
  console.log("🎯 PlayerSearch Component - selectedDivision:", selectedDivision);
  
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);

  const [mode, setMode] = useState("search"); // "search" | "availability" | "proposal"
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [proposal, setProposal] = useState(null);

  // Track when players state changes
  useEffect(() => {
    console.log("📊 Players state changed:", players.length, "players");
    if (players.length > 0) {
      console.log("📊 Players names:", players.map(p => `${p.firstName} ${p.lastName}`));
    }
  }, [players]);

  // --- Load players from Google Sheet and standings ---
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        console.log("🔄 loadData starting - phase:", phase);
        
        // Load standings data for Phase 2 filtering
        const standingsData = await loadStandings(selectedDivision);
        if (isMounted) {
          setStandings(standingsData);
          console.log("🔄 Standings loaded:", standingsData.length, "entries");
        }

        // Load players from Google Sheet
        const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
        if (!rows || rows.length === 0) {
          if (isMounted) {
            setPlayers([]);
            console.log("🔄 No rows found, setting empty players");
          }
          setLoading(false);
          return;
        }
        
        let playerList = rows
          .slice(1)
          .map(row => ({
            firstName: row[0] || "",
            lastName: row[1] || "",
            email: row[2] || "",
            phone: row[3] || "",
            locations: row[8] || "",
            availability: parseAvailability(row[7] || ""),
            pin: row[11] || "",
            preferredContacts: (row[10] || "")
              .split(/\r?\n/)
              .map(method => method.trim().toLowerCase())
              .filter(Boolean),
          }))
          .filter(
            p =>
              p.email &&
              p.firstName &&
              p.lastName &&
              `${p.firstName} ${p.lastName}`.toLowerCase() !== excludeName?.toLowerCase()
          );

        console.log("🔄 Initial playerList:", playerList.length, "players");

        // Apply Phase 2 filtering if in challenge phase
        if (phase === "challenge" && standingsData.length > 0) {
          console.log("🔄 Applying Phase 2 filtering...");
          console.log("🔄 Phase value:", phase);
          console.log("🔄 Standings data length:", standingsData.length);
          console.log("🔄 Sender name:", senderName);
          playerList = filterPlayersForPhase2(playerList, standingsData, senderName);
          console.log(`🔄 Phase 2 filtering applied: ${playerList.length} eligible opponents`);
          
          // Sort players by standings rank
          playerList = sortPlayersByRank(playerList, standingsData);
          console.log("🔄 Players sorted by rank");
        } else {
          console.log("🔄 NOT applying Phase 2 filtering because:");
          console.log("🔄   - phase === 'challenge':", phase === "challenge");
          console.log("🔄   - standingsData.length > 0:", standingsData.length > 0);
          console.log("🔄   - phase value:", phase);
          console.log("🔄   - standingsData length:", standingsData.length);
        }

        if (isMounted) {
          console.log("🔄 Setting players state:", playerList.length, "players");
          setPlayers(playerList);
          
          // Add a delay to see what's happening
          setTimeout(() => {
            if (isMounted) {
              console.log("🔄 After delay - players state should still be:", playerList.length, "players");
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) setPlayers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [excludeName, phase, senderName, selectedDivision]);

  // --- Filtered players for search ---
  const filteredPlayers =
    search.length >= 3
      ? players.filter(
          p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) &&
            `${p.firstName} ${p.lastName}`.toLowerCase() !== excludeName?.toLowerCase()
        )
      : [];

  // --- Modal content for each mode ---
  const userPosition = getPlayerPosition(standings, senderName);

  const modalContent = (
    <>
      {mode === "search" && (
        <DraggableModal
          open={true}
          onClose={onClose}
          title="🔍 Player Search"
          maxWidth="500px"
        >
          {/* Phase 2: Direct list of eligible opponents */}
          {phase === "challenge" ? (
            <>
              {console.log("🎯 Phase 2 UI rendering - players count:", players.length)}
              {console.log("🎯 Phase 2 UI rendering - players:", players.map(p => `${p.firstName} ${p.lastName}`))}
              <div style={{
                background: "rgba(229, 62, 62, 0.1)",
                border: "1px solid #e53e3e",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "1.5rem",
                color: "#fff"
              }}>
                <strong>Phase 2 (Challenge):</strong> You can only challenge players ranked 4 spots above in the standings.<br/>
                <span style={{fontSize: '1rem', color: '#fff', marginTop: 8, display: 'block'}}>
                  <b>Your Position:</b> #{userPosition ?? 'N/A'}
                </span>
                {players.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>
                    {players.length} eligible opponent{players.length !== 1 ? 's' : ''} available
                  </div>
                )}
              </div>
              {loading ? (
                <p style={{ color: "#fff", textAlign: "center" }}>Loading players...</p>
              ) : (
                <div style={{
                  maxHeight: "60vh",
                  overflowY: "auto"
                }}>
                  {players.length === 0 ? (
                    <p style={{ color: "#888", textAlign: "center", fontStyle: "italic" }}>
                      No eligible opponents found within 4 spots above you in the standings.
                    </p>
                  ) : (
                    <div style={{
                      display: "grid",
                      gap: "8px"
                    }}>
                      {players.map((p, i) => {
                        const oppName = `${p.firstName} ${p.lastName}`;
                        const oppPosition = getPlayerPosition(standings, oppName);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedPlayer(p);
                              setMode("availability");
                            }}
                            style={{
                              background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                              color: "#fff",
                              border: "2px solid #e53e3e",
                              borderRadius: "8px",
                              padding: "1rem",
                              fontSize: "1.1rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              textAlign: "left"
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
                            <span style={{fontWeight: 'bold', color: '#fff'}}>
                              #{oppPosition ?? 'N/A'} {oppName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Phase 1: Search UI as before
            <>
              {/* Instructional text appears when there are search results */}
              {search.length >= 3 && filteredPlayers.length > 0 && (
                <div style={{
                  color: "#e53e3e",
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                  textAlign: "center"
                }}>
                  Click opponent's name to see availability.
                </div>
              )}
              <input
                type="text"
                placeholder="Type at least 3 letters to search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                aria-label="Search for player"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  marginBottom: "1rem"
                }}
              />
              {loading ? (
                <p style={{ color: "#fff", textAlign: "center" }}>Loading players...</p>
              ) : (
                <>
                  {search.length < 3 ? (
                    <p style={{
                      color: "#888",
                      textAlign: "center",
                      fontStyle: "italic"
                    }}>
                      Please enter at least 3 letters to search for a player.
                    </p>
                  ) : (
                    <div style={{
                      maxHeight: "60vh",
                      overflowY: "auto"
                    }}>
                      {filteredPlayers.length === 0 ? (
                        <p style={{
                          color: "#888",
                          textAlign: "center",
                          fontStyle: "italic"
                        }}>
                          No players found.
                        </p>
                      ) : (
                        <div style={{
                          display: "grid",
                          gap: "8px"
                        }}>
                          {filteredPlayers.map((p, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedPlayer(p);
                                setMode("availability");
                              }}
                              style={{
                                background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                                color: "#fff",
                                border: "2px solid #e53e3e",
                                borderRadius: "8px",
                                padding: "1rem",
                                fontSize: "1.1rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                textAlign: "left"
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
                              <Highlight text={`${p.firstName} ${p.lastName}`} query={search} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DraggableModal>
      )}

      {mode === "availability" && selectedPlayer && (
        <PlayerAvailabilityModal
          player={selectedPlayer}
          onClose={onClose}
          onProposeMatch={(day, slot, phaseValue, divisionValue) => {
            setProposal({
              player: selectedPlayer,
              day,
              slot,
              phase: phaseValue,
              selectedDivision: divisionValue || selectedDivision // fallback
            });
            setMode("proposal");
          }}
          phase={phase}
          selectedDivision={selectedDivision}
        />
      )}

      {mode === "proposal" && proposal && (
        <>
          {console.log("proposal.phase", proposal.phase)}
          <MatchProposalModal
            player={proposal.player}
            day={proposal.day}
            slot={proposal.slot}
            onClose={onClose}
            senderName={senderName}
            senderEmail={senderEmail}
            onProposalComplete={() => {
              setMode("search");
              setProposal(null);
              setSelectedPlayer(null);
              if (onProposalComplete) onProposalComplete();
              onClose();
            }}
            phase={proposal.phase}  // <-- FIXED: Pass phase directly!
            selectedDivision={proposal.selectedDivision || selectedDivision}
          />
        </>
      )}
    </>
  );

  // --- Render modal via portal ---
  return ReactDOM.createPortal(modalContent, document.body);
}
