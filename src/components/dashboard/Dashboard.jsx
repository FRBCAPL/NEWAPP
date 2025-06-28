import React, { useState, useEffect } from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import StandingsModal from "./StandingsModal.jsx";
import MatchDetailsModal from "../modal/MatchDetailsModal.jsx";
import ProposalListModal from './ProposalListModal';
import ConfirmMatchDetails from '../ConfirmMatchDetails';
import CounterProposalModal from '../modal/CounterProposalModal';
import logoImg from '../../assets/logo.png';
import OpponentsModal from "../modal/OpponentsModal";
import PlayerAvailabilityModal from "../modal/PlayerAvailabilityModal";
import MatchProposalModal from "../modal/MatchProposalModal";
import PlayerSearch from "../modal/PlayerSearch";
import fetchSheetData from "../../utils/fetchSheetData";

// Import new services and hooks
import { useProposals } from '../../hooks/useProposals';
import { useMatches } from '../../hooks/useMatches';
import { proposalService } from '../../services/proposalService';
import { userService } from '../../services/userService';
import { noteService } from '../../services/noteService';

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";
const STANDINGS_URLS = {
  "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
  "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
  // Add more divisions as needed
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// --- Robust date normalization ---
function normalizeDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("-")) return dateStr.trim(); // already "YYYY-MM-DD"
  // Try to handle "M/D/YYYY" or "MM/DD/YYYY"
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return [
      year.padStart(4, "20"),
      month.padStart(2, "0"),
      day.padStart(2, "0")
    ].join("-");
  }
  return dateStr.trim();
}

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
        result[dayShort].push(`${from} - ${until}`);
      }
    }
  });
  return result;
}

function AdminSyncButton({ backendUrl, onSyncComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setResult("");
    try {
      await userService.syncUsers();
      setResult("✅ Users synced successfully!");
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setResult("❌ Sync failed.");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className={styles.dashboardAdminBtn}
        onClick={handleSync}
        disabled={loading}
        type="button"
      >
        {loading ? "Syncing..." : "Sync Users from Google Sheet"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}

function AdminUpdateStandingsButton({ backendUrl }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleUpdate = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/update-standings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setResult("✅ Standings updated successfully!");
      } else {
        setResult("❌ Update failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setResult("❌ Update failed.");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className={styles.dashboardAdminBtn}
        onClick={handleUpdate}
        disabled={loading}
        type="button"
      >
        {loading ? "Updating..." : "Update Standings"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}

export default function Dashboard({
  playerName,
  playerLastName,
  onOpenChat,
  userPin,
  onGoToAdmin,
  onLogout,
  onScheduleMatch,
  senderEmail,
}) {
  // State for user data
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [showStandings, setShowStandings] = useState(false);
  const [showProposalListModal, setShowProposalListModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalNote, setProposalNote] = useState("");

  const [showSentProposalListModal, setShowSentProposalListModal] = useState(false);

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterProposal, setCounterProposal] = useState(null);

  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState("");

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [showAllMatches, setShowAllMatches] = useState(false);

  // Phase logic
  const [currentPhase, setCurrentPhase] = useState("scheduled");

  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [showOpponents, setShowOpponents] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);

  // Admin Player Search
  const [showAdminPlayerSearch, setShowAdminPlayerSearch] = useState(false);

  // Phase override for admin/testing
  const [phaseOverride, setPhaseOverride] = useState(null);

  const [showPlayerAvailability, setShowPlayerAvailability] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState(null);

  const [players, setPlayers] = useState([]);
  
  // State to track matches to schedule count
  const [numToSchedule, setNumToSchedule] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [currentPhaseTotal, setCurrentPhaseTotal] = useState(0);

  // Use custom hooks for proposals and matches
  const fullName = `${playerName} ${playerLastName}`.trim();
  const { pendingProposals, sentProposals, loading: proposalsLoading, refetch: refetchProposals } = useProposals(fullName, selectedDivision);
  const { matches: upcomingMatches, completedMatches, scheduledConfirmedMatches, loading: matchesLoading, refetch: refetchMatches, markMatchCompleted } = useMatches(fullName, selectedDivision);

  // Proposal counts for instant UI update
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    setPendingCount(pendingProposals.length);
  }, [pendingProposals]);
  
  useEffect(() => {
    setSentCount(sentProposals.length);
  }, [sentProposals]);

  // Use override if set
  const effectivePhase = phaseOverride || currentPhase;

  // Calculate persistent counters that don't reset on page reload
  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision) return;
    
    // Calculate total required matches from schedule
    const playerSchedule = scheduledMatches.filter(
      m => m.division === selectedDivision &&
        ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
        (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
    );
    
    // Debug: log the player schedule
    console.log('Player schedule for', fullName, ':', playerSchedule);
    
    // Count total matches (not unique opponents) - each match in schedule counts as 1
    const totalRequired = playerSchedule.length;
    
    // Debug: log the total matches
    console.log('Total required matches for', fullName, ':', totalRequired);
    
    // Set total completed from backend data
    setTotalCompleted(completedMatches.length);
    
    // Phase 1 (Scheduled): 6 matches, Phase 2 (Challenge): 4 matches
    const phase1Matches = 6;
    const phase2Matches = 4;
    const totalPhaseMatches = phase1Matches + phase2Matches;
    
    // Determine current phase - only if no override is set
    if (!phaseOverride) {
      let currentPhaseName;
      if (completedMatches.length >= totalPhaseMatches) {
        currentPhaseName = "completed"; // All phases done
      } else if (completedMatches.length >= phase1Matches) {
        currentPhaseName = "challenge"; // Phase 2
      } else {
        currentPhaseName = "scheduled"; // Phase 1
      }
      
      setCurrentPhase(currentPhaseName);
    }
    
    // Calculate matches to schedule for current phase
    // Consider both confirmed and completed matches
    const confirmedMatches = upcomingMatches.filter(match => 
      match.status === "confirmed" && 
      match.counterProposal && 
      match.counterProposal.completed !== true
    );
    const totalScheduledOrCompleted = confirmedMatches.length + completedMatches.length;
    
    let toSchedule;
    let phaseTotal;
    
    // Use effectivePhase for calculations
    if (effectivePhase === "completed") {
      toSchedule = 0;
      phaseTotal = totalPhaseMatches;
    } else if (effectivePhase === "challenge") {
      // Phase 2: remaining matches in Phase 2 only
      const completedInPhase1 = Math.min(completedMatches.length, phase1Matches);
      const remainingInPhase2 = phase2Matches - (completedMatches.length - completedInPhase1);
      toSchedule = Math.max(0, remainingInPhase2);
      phaseTotal = phase2Matches;
    } else {
      // Phase 1: remaining matches in Phase 1
      const remainingInPhase1 = phase1Matches - totalScheduledOrCompleted;
      toSchedule = Math.max(0, remainingInPhase1);
      phaseTotal = phase1Matches;
    }
    
    setNumToSchedule(toSchedule);
    setCurrentPhaseTotal(phaseTotal);
    
    console.log('Persistent counters - Total required:', totalRequired, 'Total completed:', completedMatches.length, 'Confirmed (not completed):', confirmedMatches.length, 'Total scheduled/completed:', totalScheduledOrCompleted, 'To schedule:', toSchedule, 'Phase:', effectivePhase, 'Phase total:', phaseTotal);
  }, [playerName, playerLastName, selectedDivision, scheduledMatches, completedMatches, upcomingMatches, phaseOverride, effectivePhase]);

  // Calculate total required matches for display
  const totalRequiredMatches = (() => {
    if (!playerName || !playerLastName || !selectedDivision) return 0;
    
    const playerSchedule = scheduledMatches.filter(
      m => m.division === selectedDivision &&
        ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
        (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
    );
    
    // Count total matches (not unique opponents) - each match in schedule counts as 1
    return playerSchedule.length;
  })();

  useEffect(() => {
    let isMounted = true;
    async function loadPlayers() {
      try {
        const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
        if (!rows || rows.length === 0) {
          if (isMounted) setPlayers([]);
          return;
        }
        const playerList = rows
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
              p.lastName
          );
        if (isMounted) setPlayers(playerList);
      } catch (err) {
        if (isMounted) setPlayers([]);
      }
    }
    loadPlayers();
    return () => { isMounted = false; };
  }, []);

 useEffect(() => {
  if (!selectedDivision) {
    setScheduledMatches([]);
    return;
  }
  const safeDivision = selectedDivision.replace(/[^A-Za-z0-9]/g, '_');
  const scheduleUrl = `${BACKEND_URL}/static/schedule_${safeDivision}.json`;

  fetch(scheduleUrl)
    .then(res => {
      if (!res.ok) throw new Error("Schedule not found");
      return res.json();
    })
    .then(data => setScheduledMatches(data))
    .catch(() => setScheduledMatches([]));
}, [selectedDivision]);


  // Division logic
  useEffect(() => {
    if (!senderEmail) return;
    userService.getUser(senderEmail)
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
      })
      .catch(() => {
        setDivisions([]);
      });
  }, [senderEmail]);

  useEffect(() => {
    if (divisions.length > 0) {
      setSelectedDivision(divisions[0]);
    } else {
      setSelectedDivision("");
    }
  }, [divisions]);

  useEffect(() => {
    setLoadingNotes(true);
    noteService.getAllNotes()
      .then(notes => {
        setNotes(notes);
        setLoadingNotes(false);
      })
      .catch(() => {
        setNotes([]);
        setLoadingNotes(false);
      });
  }, []);

  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision) return;
    // The custom hooks handle fetching proposals and matches automatically
    // No need to manually call fetch functions anymore

    const interval = setInterval(() => {
      // Refresh data every 2 minutes using the custom hooks
      refetchProposals();
      refetchMatches();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [playerName, playerLastName, selectedDivision, refetchProposals, refetchMatches]);

  const handleAddNote = async () => {
    setNoteError("");
    try {
      const note = await noteService.createNote(newNote.trim());
      setNotes([note, ...notes]);
      setNewNote("");
      setShowNoteModal(false);
    } catch (err) {
      setNoteError("Failed to add note");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await noteService.deleteNote(id);
      setNotes(notes.filter(note => note._id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleClearNotes = async () => {
    if (!window.confirm("Are you sure you want to clear all notes?")) return;
    try {
      for (const note of notes) {
        await noteService.deleteNote(note._id);
      }
      setNotes([]);
    } catch (err) {
      console.error('Failed to clear notes:', err);
    }
  };

  function handleProposalResponse(proposalId, status, note = "") {
    proposalService.updateProposalStatus(proposalId, status, note)
      .then(() => {
        setSelectedProposal(null);
        setProposalNote("");
        refetchMatches();
        refetchProposals();
      })
      .catch(console.error);
  }

  async function handleCounterProposal(counterData) {
    if (!counterProposal) return;
    try {
      await proposalService.counterProposal(counterProposal._id, counterData);
      setShowCounterModal(false);
      setCounterProposal(null);
      refetchMatches();
      refetchProposals();
    } catch (err) {
      console.error('Failed to counter proposal:', err);
    }
  }

  // Helper functions
  function openModal(match) {
    setSelectedMatch(match);
    setModalOpen(true);
  }
  
  function closeModal() {
    setModalOpen(false);
    setSelectedMatch(null);
  }

  function getMatchDateTime(match) {
    if (match.date && match.time) {
      const parts = match.date.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        let timeStr = match.time.trim().toUpperCase();
        let timeParts = timeStr.split(' ');
        let timePart = timeParts[0];
        let ampm = timeParts[1];
        let hourMinute = timePart.split(':');
        let hour = parseInt(hourMinute[0], 10);
        let minute = parseInt(hourMinute[1], 10);
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = (minute || 0).toString().padStart(2, '0');
        const time24 = `${hourStr}:${minuteStr}`;
        return new Date(`${isoDate}T${time24}:00`);
      }
    }
    return new Date(0);
  }

  // --- SCHEDULED MATCHES LOGIC ---
  const playerSchedule = scheduledMatches.filter(
    m => m.division === selectedDivision &&
      ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
      (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
  );
  // Debug: log the playerSchedule array and first object
  console.log('playerSchedule (full array):', playerSchedule);
  if (playerSchedule.length > 0) {
    console.log('playerSchedule[0]:', playerSchedule[0]);
  }

  // Greedy matching: each confirmed match is only matched to one scheduled match
  function getMatchesToSchedule() {
    const usedConfirmed = new Set();
    const matchesToSchedule = [];
    
    // Debug logging
    console.log('getMatchesToSchedule - playerSchedule:', playerSchedule.length);
    console.log('getMatchesToSchedule - completedMatches:', completedMatches.length);
    console.log('getMatchesToSchedule - upcomingMatches:', upcomingMatches.length);
    
    for (const schedMatch of playerSchedule) {
      // Skip if this scheduled match is already completed
      const schedOpponent = schedMatch.player1 && schedMatch.player1.trim().toLowerCase() === fullName.toLowerCase()
        ? schedMatch.player2 : schedMatch.player1;
      const isCompleted = completedMatches.some(cm => {
        const cmPlayers = [cm.senderName?.trim().toLowerCase(), cm.receiverName?.trim().toLowerCase()];
        return (
          Array.isArray(cm.divisions) && cm.divisions.includes(selectedDivision) &&
          cmPlayers.includes(fullName.toLowerCase()) &&
          cmPlayers.includes(schedOpponent?.trim().toLowerCase())
        );
      });
      if (isCompleted) {
        console.log('Skipping completed match with opponent:', schedOpponent);
        continue; // Don't count this match if completed
      }
      let found = false;
      for (let i = 0; i < upcomingMatches.length; i++) {
        if (usedConfirmed.has(i)) continue;
        const backendMatch = upcomingMatches[i];
        const backendPlayers = [backendMatch.senderName?.trim().toLowerCase(), backendMatch.receiverName?.trim().toLowerCase()];
        if (
          Array.isArray(backendMatch.divisions) && backendMatch.divisions.includes(selectedDivision) &&
          backendPlayers.includes(fullName.toLowerCase()) &&
          backendPlayers.includes(schedOpponent?.trim().toLowerCase())
        ) {
          usedConfirmed.add(i);
          found = true;
          break;
        }
      }
      if (!found) {
        matchesToSchedule.push(schedMatch);
      }
    }
    
    console.log('getMatchesToSchedule - final count:', matchesToSchedule.length);
    return matchesToSchedule;
  }

  const matchesToSchedule = getMatchesToSchedule();

  // Prepare the opponents list for the modal (only for uncompleted matches)
  const opponentsToSchedule = matchesToSchedule.map(m =>
    m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()
      ? m.player2?.trim().toLowerCase()
      : m.player1?.trim().toLowerCase()
  ).filter(Boolean);

  function handleOpponentClick(opponentName) {
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
    setSelectedOpponent(playerObj);
    setShowPlayerAvailability(true);
  }

  function refreshSchedule() {
    fetch(`${BACKEND_URL}/static/schedule.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setScheduledMatches(data))
      .catch(() => setScheduledMatches([]));
  }

  function handleScheduleMatch() {
    console.log("🚀 handleScheduleMatch called - effectivePhase:", effectivePhase);
    console.log("🚀 handleScheduleMatch called - phaseOverride:", phaseOverride);
    console.log("🚀 handleScheduleMatch called - currentPhase:", currentPhase);
    
    if (effectivePhase === "scheduled") {
      console.log("🚀 Opening Opponents Modal (Phase 1)");
      setShowOpponents(true);
    } else {
      console.log("🚀 Opening PlayerSearch Modal (Phase 2)");
      setShowPlayerSearch(true);
    }
  }

  // Defensive filter: only show matches for the selected division (in case backend fails)
  const filteredUpcomingMatches = upcomingMatches.filter(m =>
    m.division && selectedDivision &&
    m.division.trim().toLowerCase() === selectedDivision.trim().toLowerCase()
  );

  // Debug: log the filtered upcoming matches
  console.log('filteredUpcomingMatches:', filteredUpcomingMatches);

  return (
  
  
  
  
  
  
  <div className={styles.dashboardBg}>
      <div className={styles.dashboardFrame}>
        <div className={styles.dashboardCard}>
          <h1 className={styles.dashboardTitle}>
            Welcome,
            <span className={styles.dashboardUserName}>
              {playerName} {playerLastName}
            </span>
          </h1>
          <br />
          {/* --- Division Selector --- */}
          {divisions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label>
                Division:&nbsp;
                {divisions.length > 1 ? (
                  <select
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                    style={{ fontSize: "1em", padding: 4, borderRadius: 4 }}
                  >
                    {divisions.map(div =>
                      <option key={div} value={div}>{div}</option>
                    )}
                  </select>
                ) : (
                  <span style={{ fontWeight: 600 }}>{divisions[0]}</span>
                )}
              </label>
              &nbsp;&nbsp;&nbsp;
              <span style={{ 
                fontSize: "0.9em", 
                padding: "4px 8px", 
                borderRadius: "4px", 
                backgroundColor: effectivePhase === "challenge" ? "#e53e3e" : "#28a745",
                color: "white",
                fontWeight: "600"
              }}>
                Phase {effectivePhase === "challenge" ? "2" : effectivePhase === "scheduled" ? "1" : "Complete"}
              </span>
            </div>
          )}

          {/* --- Completed Matches Count (above upcoming matches area) --- */}
          <div style={{ marginBottom: 8, color: "#888", fontWeight: 500 }}>
            {totalCompleted === 0
              ? "No matches completed yet!"
              : `${totalCompleted} of ${totalRequiredMatches} matches completed.`}
          </div>

          {/* --- Upcoming Matches Section --- */}
          <section
            className={`${styles.dashboardSection} ${styles.dashboardSectionBox} ${styles.matchesSection}`}
            style={{
              position: "relative",
              overflow: "visible",
              backgroundColor: "#000",
              minHeight: "320px"
            }}
          >
            {/* PoolSimulation as background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div style={{
                width: "100%",
                maxWidth: 600,
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
                  <PoolSimulation />
                </ResponsiveWrapper>
              </div>
            </div>

            {/* Matches content */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(0,0,0,0.55)", // Makes content readable
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div className={styles.proposalAlertRow}>
                <button
                  className={styles.proposalAlertButton}
                  onClick={() => setShowProposalListModal(true)}
                  aria-label="View pending match proposals"
                  disabled={pendingCount === 0}
                  style={pendingCount === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  📥  {pendingCount} proposals waiting for you
                </button>
                <button
                  className={styles.proposalAlertButton}
                  onClick={() => setShowSentProposalListModal(true)}
                  aria-label="View matches you have proposed"
                  disabled={sentCount === 0}
                  style={sentCount === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  📤 {sentCount} proposals waiting for opponent
                </button>
              </div>
              <br /><h2 className={styles.dashboardSectionTitle}>Upcoming Confirmed Matches</h2>
              <div className={styles.dashboardHelperText}>
                Click Match For Details
              </div>
              <br /><br /><br />
              <ul className={styles.dashboardList}>
                {(showAllMatches ? upcomingMatches : upcomingMatches.slice(0, 2)).length === 0 ? (
                  <li>No matches scheduled yet.</li>
                ) : (
                  (showAllMatches ? upcomingMatches : upcomingMatches.slice(0, 2)).map((match, idx) => {
                    // Determine opponent and date based on match type
                    let opponent = '';
                    let formattedDate = '';
                    if (match.type === 'scheduled') {
                      // Use player1/player2 and parse M/D/YYYY
                      if (match.player1 && match.player2) {
                        if (match.player1.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                          opponent = match.player2;
                        } else {
                          opponent = match.player1;
                        }
                      }
                      if (match.date) {
                        // Parse M/D/YYYY
                        const parts = match.date.split('/');
                        if (parts.length === 3) {
                          const [month, day, year] = parts;
                          const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          } else {
                            formattedDate = '[Invalid Date]';
                          }
                        } else {
                          formattedDate = '[Invalid Date]';
                        }
                      } else {
                        formattedDate = '[No Date]';
                      }
                    } else {
                      // Assume proposal type: use senderName/receiverName and parse YYYY-MM-DD
                      if (match.senderName && match.receiverName) {
                        if (match.senderName.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                          opponent = match.receiverName;
                        } else {
                          opponent = match.senderName;
                        }
                      }
                      if (match.date) {
                        const parts = match.date.split('-');
                        if (parts.length === 3) {
                          const [year, month, day] = parts;
                          const dateObj = new Date(`${year}-${month}-${day}`);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          } else {
                            formattedDate = '[Invalid Date]';
                          }
                        } else {
                          formattedDate = '[Invalid Date]';
                        }
                      } else {
                        formattedDate = '[No Date]';
                      }
                    }
                    // Debug: log each match object
                    console.log('Rendering match:', match);
                    const isCompleted = match.counterProposal && match.counterProposal.completed === true;
                    const actuallyCompleted = !!(match.counterProposal && match.counterProposal.completed === true);
                    return (
                      <li key={match._id || idx} className={styles.matchCard} style={{padding: '0.4rem 0.5rem', fontSize: '0.98em', marginBottom: 8}}>
                        <div className={styles.matchCardContentWrapper}>
                          <button
                            className={styles.matchCardButton}
                            onClick={() => openModal(match)}
                            type="button"
                            style={{padding: 0, margin: 0, minHeight: 0, fontSize: '0.98em', display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none'}}
                          >
                            <span className={styles.matchCardOpponentLabel} style={{fontSize: '1em', marginRight: 4}}>VS:</span>
                            <span className={styles.matchCardOpponentName} style={{fontSize: '1em', marginRight: 8}}>{opponent || '[Unknown Opponent]'}</span>
                            <span className={styles.matchCardDetail} style={{fontSize: '0.97em', marginRight: 8}}>{formattedDate}</span>
                            <span className={styles.matchCardDetail} style={{fontSize: '0.97em'}}>{match.location || '[No Location]'}</span>
                          </button>
                          {!actuallyCompleted && (
                            <button
                              className={styles.dashboardBtn + ' ' + styles.matchCardDoneBtn}
                              style={{ marginLeft: 0, minWidth: 90, padding: '6px 0', fontSize: '1em', height: 34, lineHeight: '22px', marginTop: 6 }}
                              onClick={async () => {
                                try {
                                  await proposalService.markCompleted(match._id);
                                  // Immediately update local state to fix counter issues
                                  markMatchCompleted(match);
                                  
                                  // Only update completed counter - matches to schedule was already updated when confirmed
                                  setTotalCompleted(prev => prev + 1);
                                  
                                  // Temporarily comment out refetch to debug
                                  // refetchMatches();
                                  // refetchProposals();
                                } catch (err) {
                                  alert("Failed to mark as completed. Please try again.");
                                }
                              }}
                              type="button"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
              {filteredUpcomingMatches.length > 2 && (
                <button
                  className={styles.smallShowMoreBtn}
                  onClick={() => setShowAllMatches(v => !v)}
                  type="button"
                >
                  {showAllMatches
                    ? "Show Less"
                    : `Show ${filteredUpcomingMatches.length - 2} More`}
                </button>
              )}

              {/* --- Scheduled/Confirmed Matches Count (under upcoming matches area) --- */}
              <div style={{ textAlign: "center", margin: "2px 0 16px 0" }}>
                <div style={{ marginBottom: 8, color: "#888", fontWeight: 500 }}>
                  {numToSchedule === 0
                    ? "All required matches are scheduled!"
                    : `You have ${numToSchedule} of ${currentPhaseTotal} matches left to schedule.`}
                </div>
                <button
                  className={styles.dashboardBtn}
                  type="button"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    console.log("🔘 Schedule Match button clicked!");
                    handleScheduleMatch();
                  }}
                >
                  Schedule a Match
                </button>
              </div>
            </div>
          </section>

          {/* News & Updates Section with Chat/Standings Buttons */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: 16 
            }}>
              <button
                className={styles.dashboardBtn}
                onClick={onOpenChat}
                type="button"
                style={{ minWidth: 120 }}
              >
                💬 Open Chat
              </button>
              <h2 className={styles.dashboardSectionTitle} style={{ margin: 0 }}>
                News & Updates
              </h2>
              <button
                className={styles.dashboardBtn}
                type="button"
                onClick={() => setShowStandings(true)}
                style={{ minWidth: 120 }}
              >
                📊 View Standings
              </button>
            </div>
            {loadingNotes ? (
              <div>Loading notes...</div>
            ) : (
              <ul className={styles.dashboardList}>
                {notes.length === 0 ? (
                  <li className={styles.dashboardNoteItem}>No news yet.</li>
                ) : (
                  notes.map((note, idx) => (
                    <li
                      key={note._id || idx}
                      className={styles.dashboardNoteItem}
                    >
                      <span style={{ flex: 1 }}>{note.text}</span>
                      {userPin === "777777" && (
                        <button
                          onClick={() => handleDeleteNote(note._id)}
                          style={{
                            background: "#e53935",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "2px 8px",
                            cursor: "pointer",
                            fontSize: "0.95em"
                          }}
                          aria-label="Delete note"
                          title="Delete note"
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
            {userPin === "777777" && notes.length > 0 && (
              <button
                style={{
                  marginTop: 10,
                  background: "#444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 5,
                  padding: "4px 14px",
                  cursor: "pointer",
                  fontSize: "0.98em"
                }}
                onClick={handleClearNotes}
                type="button"
              >
                Clear All Notes
              </button>
            )}
          </section>

          <button
            className={styles.dashboardLogoutBtn}
            onClick={onLogout}
            type="button"
          >
            Logout
          </button>

          {/* TEMPORARY TEST BUTTON */}
          <button
            style={{
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.7rem 1.4rem",
              margin: "10px",
              cursor: "pointer"
            }}
            onClick={() => {
              console.log("FORCE OPENING MODAL");
              setShowOpponents(true);
            }}
          >
            FORCE OPEN MODAL
          </button>

          {userPin === "777777" && (
            <>
              <button
                className={styles.dashboardAdminBtn}
                onClick={() => setShowNoteModal(true)}
                type="button"
              >
                Add Note
              </button>
              <button
                className={styles.dashboardAdminBtn}
                onClick={onGoToAdmin}
                type="button"
              >
                Admin
              </button>
             
              <button
                className={styles.dashboardAdminBtn}
                onClick={() => setPhaseOverride(phaseOverride === "challenge" ? "scheduled" : "challenge")}
                type="button"
              >
                {phaseOverride === "challenge" ? "Switch to Phase 1 (Scheduled)" : "Switch to Phase 2 (Challenge)"}
              </button>
              {phaseOverride && (
                <button
                  className={styles.dashboardAdminBtn}
                  onClick={() => setPhaseOverride(null)}
                  type="button"
                  style={{ background: "#888" }}
                >
                  Clear Phase Override
                </button>
              )}
             
            </>
          )}
        </div>
      </div>
{console.log("playerSchedule", playerSchedule)}
{console.log("matchesToSchedule", opponentsToSchedule)}
{console.log("selectedDivision", selectedDivision)}
      {/* Opponents Modal */}
     <OpponentsModal
      open={showOpponents}
      onClose={() => setShowOpponents(false)}
      opponents={opponentsToSchedule}
      onOpponentClick={handleOpponentClick}
      phase={effectivePhase}
     />
     {console.log("🎯 OpponentsModal render - open:", showOpponents, "opponents:", opponentsToSchedule.length)}


      {/* Player Search Modal (Phase 2) */}
    {showPlayerSearch && (
      <>
        {console.log("🔍 PlayerSearch Modal Opening - Phase:", effectivePhase)}
        <PlayerSearch
          onClose={() => setShowPlayerSearch(false)}
          excludeName={fullName}
          senderName={fullName}
          senderEmail={senderEmail}
          selectedDivision={selectedDivision}
          phase={effectivePhase}
          onProposalComplete={() => setShowPlayerSearch(false)}
        />
      </>
    )}

{showAdminPlayerSearch && (
  <PlayerSearch
    onClose={() => setShowAdminPlayerSearch(false)}
    excludeName={null}
    senderName={fullName}
    senderEmail={senderEmail}
    phase={effectivePhase}
    onProposalComplete={() => setShowAdminPlayerSearch(false)}
  />
)}


      {/* Player Availability Modal */}
      {showPlayerAvailability && selectedOpponent && (
        <PlayerAvailabilityModal
          onClose={() => {
            setShowPlayerAvailability(false);
            setSelectedOpponent(null);
          }}
          player={selectedOpponent}
          onProposeMatch={(day, slot) => {
              setProposalData({
                player: selectedOpponent,
                day,
                slot,
                selectedDivision, 
                phase: effectivePhase
              });
              setShowProposalModal(true);
              setShowPlayerAvailability(false);
              setSelectedOpponent(null);
          }}
          selectedDivision={selectedDivision}
          phase={effectivePhase}
        />
      )}

      {/* Proposal Modal */}
  {showProposalModal && proposalData && (
  <MatchProposalModal
    player={proposalData.player}
    day={proposalData.day}
    slot={proposalData.slot}
    selectedDivision={proposalData.selectedDivision} 
    phase={proposalData.phase || effectivePhase}
    onClose={() => setShowProposalModal(false)}
    senderName={`${playerName} ${playerLastName}`}
    senderEmail={senderEmail}
    onProposalComplete={() => {
      setShowProposalModal(false);
      setProposalData(null);
      refetchMatches();
      refetchProposals();
    }}
  />
)}

      {/* Standings Modal */}
      <StandingsModal
        open={showStandings}
        onClose={() => setShowStandings(false)}
        standingsUrl={STANDINGS_URLS[selectedDivision]}
      />

      {/* Match Details Modal */}
      <MatchDetailsModal
        open={modalOpen}
        onClose={closeModal}
        match={selectedMatch}
        onCompleted={matchId => setUpcomingMatches(prev => prev.filter(m => m._id !== matchId))}
      />

      {/* Note Modal */}
      {showNoteModal && (
        <div className={styles.modalOverlay} style={{zIndex: 99999}}>
          <div className={styles.modalContent} style={{maxWidth: 400, margin: "auto"}}>
            <h2>Add News/Note</h2>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={4}
              style={{width: "100%", marginBottom: 12, borderRadius: 6, padding: 8}}
              placeholder="Enter your note..."
            />
            {noteError && <div style={{color: "red", marginBottom: 8}}>{noteError}</div>}
            <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
              <button
                className={styles.dashboardBtn}
                onClick={() => setShowNoteModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.dashboardBtn}
                disabled={!newNote.trim()}
                onClick={handleAddNote}
                type="button"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal List Modals */}
      {showProposalListModal && (
        <ProposalListModal
          proposals={pendingProposals}
          onSelect={proposal => {
            setSelectedProposal(proposal);
            setProposalNote("");
            setShowProposalListModal(false);
          }}
          onClose={() => setShowProposalListModal(false)}
          type="received"
        />
      )}

      {showSentProposalListModal && (
        <ProposalListModal
          proposals={sentProposals}
          onSelect={proposal => {
            setSelectedProposal(proposal);
            setProposalNote("");
            setShowSentProposalListModal(false);
          }}
          onClose={() => setShowSentProposalListModal(false)}
          type="sent"
        />
      )}

      {/* Confirm Match Details Modal */}
   {selectedProposal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent} style={{maxWidth: 420, margin: "auto"}}>
      <ConfirmMatchDetails
        proposal={selectedProposal}
        userNote={proposalNote}
        setUserNote={setProposalNote}
        onConfirm={async () => {
          await proposalService.updateProposalStatus(selectedProposal._id, "confirmed", proposalNote);
          setSelectedProposal(null);
          setProposalNote("");
          refetchMatches();
          refetchProposals();
        }}
        onClose={() => {
          setSelectedProposal(null);
          setProposalNote("");
        }}
        onCounterPropose={() => {
          setCounterProposal(selectedProposal);
          setShowCounterModal(true);
          setSelectedProposal(null);
        }}
        phase={effectivePhase}
      />
    </div>
  </div>
)}


      {/* Counter Proposal Modal */}
      <CounterProposalModal
        proposal={counterProposal}
        open={showCounterModal}
        onClose={() => {
          setShowCounterModal(false);
          setCounterProposal(null);
        }}
        onSubmit={handleCounterProposal}
      />
    </div>
  );
}
