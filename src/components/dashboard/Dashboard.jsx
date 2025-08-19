import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import styles from './dashboard.module.css';
import tenBall from '../../assets/tenball.svg';
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import StandingsModal from "./StandingsModal.jsx";
import DefenseChallengersModal from "./DefenseChallengersModal.jsx";
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
import ProposalDetailsModal from './ProposalDetailsModal';
import EditProposalModal from './EditProposalModal';
import LoadingSpinner, { LoadingButton, SkeletonLoader } from "../LoadingSpinner";
import Modal from '../modal/DraggableModal.jsx';

import DirectMessagingModal from '../DirectMessagingModal';
import WinnerSelectModal from '../modal/WinnerSelectModal';
import Phase1Tracker from './Phase1Tracker.jsx';
import Phase2Tracker from './Phase2Tracker.jsx';
import MatchValidationModal from './MatchValidationModal';

// Import new services and hooks
import { useProposals } from '../../hooks/useProposals';
import { useMatches } from '../../hooks/useMatches';
import { proposalService } from '../../services/proposalService';
import { userService } from '../../services/userService';
import { noteService } from '../../services/noteService';
import { seasonService } from '../../services/seasonService';
import { deadlineNotificationService } from '../../services/deadlineNotificationService';

import { format } from 'date-fns';
import { BACKEND_URL } from '../../config.js';
import { useNavigate } from 'react-router-dom';

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";
const STANDINGS_URLS = {
  "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
  "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
  // Add more divisions as needed
};


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
      const res = await fetch(`${BACKEND_URL}/admin/update-standings`, {
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

// Utility function to format date as MM-DD-YYYY
function formatDateMMDDYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Handle YYYY-MM-DD format
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    // Use the original date values without timezone conversion
    return `${month}-${day}-${year}`;
  }
  
  // Handle different date formats
  let date;
  if (dateStr.includes('-')) {
    // Already in YYYY-MM-DD format
    date = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    // Handle M/D/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
    } else {
      return dateStr; // Return as-is if can't parse
    }
  } else {
    return dateStr; // Return as-is if unknown format
  }
  
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if invalid date
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
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
  const [showDefenseChallengers, setShowDefenseChallengers] = useState(false);
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
  const [showAllMatchesModal, setShowAllMatchesModal] = useState(false);

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
  const effectivePhase = phaseOverride || currentPhase;
  const { matches: scheduledConfirmedMatches, completedMatches, scheduledConfirmedMatches: legacyScheduledConfirmedMatches, loading: matchesLoading, refetch: refetchMatches, markMatchCompleted, updateCompletedMatch } = useMatches(fullName, selectedDivision, effectivePhase);

  // Proposal counts for instant UI update
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  // Add state for new modal
  const [showProposalDetailsModal, setShowProposalDetailsModal] = useState(false);
  const [showEditProposalModal, setShowEditProposalModal] = useState(false);

  // New state for loading state of Complete button
  const [completingMatchId, setCompletingMatchId] = useState(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Add state at the top of the Dashboard component
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerModalMatch, setWinnerModalMatch] = useState(null);
  const [winnerModalPlayers, setWinnerModalPlayers] = useState({ player1: '', player2: '' });

  // Season and deadline tracking state
  const [seasonData, setSeasonData] = useState(null);
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [matchToValidate, setMatchToValidate] = useState(null);


  const simulationRef = useRef(null);

  const navigate = useNavigate();

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        // Log device info for debugging
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('Device Info:', {
          userAgent: navigator.userAgent,
          isMobile: isMobile,
          backendUrl: BACKEND_URL,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        });

        console.log('Testing backend connection...');
        const response = await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('✅ Backend connection successful');
        } else {
          console.error('❌ Backend connection failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Backend connection error:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    };

    testBackendConnection();
  }, []);

  useEffect(() => {
    setPendingCount(pendingProposals.length);
  }, [pendingProposals]);
  
  useEffect(() => {
    setSentCount(sentProposals.length);
  }, [sentProposals]);

  // Fetch season data for deadline tracking
  useEffect(() => {
    async function fetchSeasonData() {
      if (!selectedDivision) return;
      
      try {
        console.log('Dashboard - Fetching season data for division:', selectedDivision);
        
        const [seasonResult, phaseResult] = await Promise.all([
          seasonService.getCurrentSeason(selectedDivision),
          seasonService.getCurrentPhaseAndWeek(selectedDivision)
        ]);
        
        console.log('Dashboard - Season result:', seasonResult);
        console.log('Dashboard - Phase result:', phaseResult);
        
        setSeasonData(seasonResult?.season || null);
        setCurrentPhaseInfo(phaseResult);
        
        console.log('Dashboard - Set seasonData:', seasonResult?.season || null);
      } catch (error) {
        console.error('Error fetching season data:', error);
      }
    }
    
    fetchSeasonData();
  }, [selectedDivision]);

  // Fetch unread messages count
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/messages/unread?user=${encodeURIComponent(senderEmail)}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setUnreadMessages(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch unread messages:', err);
      }
    }
    
    if (senderEmail) {
      fetchUnreadCount();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [senderEmail]);

  // Calculate persistent counters that don't reset on page reload
  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision) return;
    
    // Wait for data to be loaded
    if (matchesLoading || proposalsLoading) {
      return;
    }
    
    // Calculate total required matches from schedule - filter by current phase
    const currentPhaseNumber = effectivePhase === "challenge" ? 2 : 1;
    const playerScheduleEffect = scheduledMatches.filter(
      m => m.division === selectedDivision &&
        m.phase === currentPhaseNumber &&
        ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
        (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
    );
    
    // Count total matches (not unique opponents) - each match in schedule counts as 1
    const totalRequired = playerScheduleEffect.length;
    
    // Set total completed from backend data
    setTotalCompleted(completedMatches.length);
    
    // Calculate confirmed matches (not completed)
    const confirmedMatches = scheduledConfirmedMatches.filter(match => 
      match.status === "confirmed" && 
      (match.completed === false || match.completed === undefined)
    );
    
    // FIXED LOGIC: Scheduled counter = Total Required - (Confirmed Matches + Completed Matches)
    const totalScheduledOrCompleted = confirmedMatches.length + completedMatches.length;
    const scheduledCount = Math.max(0, totalRequired - totalScheduledOrCompleted);
    
    // Set the scheduled counter
    setNumToSchedule(scheduledCount);
    setCurrentPhaseTotal(totalRequired);
    

  }, [playerName, playerLastName, selectedDivision, scheduledMatches, completedMatches, scheduledConfirmedMatches, matchesLoading, proposalsLoading]);

  // Calculate total required matches for display
  const totalRequiredMatches = (() => {
    if (!playerName || !playerLastName || !selectedDivision) return 0;
    
    // Filter by current phase
    const currentPhaseNumber = effectivePhase === "challenge" ? 2 : 1;
          const playerScheduleTotalRequired = scheduledMatches.filter(
        m => m.division === selectedDivision &&
          ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
          (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
      );
    
    // Count total matches (not unique opponents) - each match in schedule counts as 1
    const calculatedTotal = playerScheduleTotalRequired.length;
    
    // Fallback: If no matches found in schedule, use 6 for Phase 1 (per bylaws)
    if (calculatedTotal === 0 && effectivePhase === "scheduled") {
      console.log("No schedule matches found, using fallback of 6 matches for Phase 1");
      return 6;
    }
    
    return calculatedTotal;
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
  // Handle specific division name mappings
  let scheduleFileName;
  if (selectedDivision === "FRBCAPL TEST") {
    scheduleFileName = "schedule_FRBCAPL_TEST.json";
  } else if (selectedDivision === "Singles Test") {
    scheduleFileName = "schedule_Singles_Test.json";
  } else {
    // Fallback: create safe filename
    const safeDivision = selectedDivision.replace(/[^A-Za-z0-9]/g, '_');
    scheduleFileName = `schedule_${safeDivision}.json`;
  }
  
  const scheduleUrl = `${BACKEND_URL}/static/${scheduleFileName}`;

  fetch(scheduleUrl)
    .then(res => {
      if (!res.ok) throw new Error("Schedule not found");
      return res.json();
    })
    .then(data => {
      console.log('Schedule loaded for', selectedDivision, ':', data.length, 'matches');
      setScheduledMatches(data);
    })
    .catch((error) => {
      console.error('Failed to load schedule for', selectedDivision, ':', error);
      console.log('Schedule URL attempted:', scheduleUrl);
      setScheduledMatches([]);
    });
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
  const currentPhaseNumber = effectivePhase === "challenge" ? 2 : 1;
  const playerSchedule = scheduledMatches.filter(
    m => m.division === selectedDivision &&
      // For JSON scheduled matches, don't filter by phase since they're all phase 1
      // Only filter by phase if the match has a phase field (backend matches)
      (!m.phase || m.phase === currentPhaseNumber) &&
      ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
      (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
  );

  // Extract opponent emails from scheduled matches
  const opponentEmails = Array.from(new Set(
    playerSchedule.map(m => {
      if (m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) {
        return m.player2Email || m.player2EmailAddress || m.player2Email || m.player2 || null;
      } else if (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()) {
        return m.player1Email || m.player1EmailAddress || m.player1Email || m.player1 || null;
      }
      return null;
    }).filter(Boolean)
  ));

  // Greedy matching: each confirmed match is only matched to one scheduled match
  function getMatchesToSchedule() {
    const usedConfirmed = new Set();
    const matchesToSchedule = [];
    
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
        continue; // Don't count this match if completed
      }
      let found = false;
      for (let i = 0; i < scheduledConfirmedMatches.length; i++) {
        if (usedConfirmed.has(i)) continue;
        const backendMatch = scheduledConfirmedMatches[i];
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
    
    return matchesToSchedule;
  }

  const matchesToSchedule = getMatchesToSchedule();

  // Prepare the opponents list for the modal (one entry per unscheduled match, even if names repeat)
  const opponentsToSchedule = matchesToSchedule.map(m => {
    const name = m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()
      ? m.player2?.trim()
      : m.player1?.trim();
    if (!name) return null;
    // Find the player object by name (can be null if not found)
    const playerObj = players.find(
      p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === name.toLowerCase()
    );
    // Return an object with both the match and the player (for uniqueness)
    return { match: m, player: playerObj, opponentName: name };
  }).filter(Boolean);

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
    setShowOpponents(false); // Close the Opponents modal
  }

  function refreshSchedule() {
    fetch(`${BACKEND_URL}/static/schedule.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setScheduledMatches(data))
      .catch(() => setScheduledMatches([]));
  }

  function handleScheduleMatch() {
    console.log('Schedule Match button clicked');
    if (effectivePhase === "scheduled") {
      setShowOpponents(true);
    } else {
      setShowPlayerSearch(true);
    }
  }



  // Check and send automatic deadline reminders
  useEffect(() => {
    if (!senderEmail || !playerName || !selectedDivision || !seasonData || effectivePhase !== 'scheduled') {
      return;
    }

    const checkAndSendReminder = async () => {
      try {
        await deadlineNotificationService.checkAndSendDeadlineReminder(
          senderEmail, 
          `${playerName} ${playerLastName}`, 
          selectedDivision
        );
      } catch (error) {
        console.error('Error checking deadline reminders:', error);
      }
    };

    // Check once when component loads
    checkAndSendReminder();

    // Check every hour for new reminders
    const interval = setInterval(checkAndSendReminder, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [senderEmail, playerName, playerLastName, selectedDivision, seasonData, effectivePhase]);

  // Defensive filter: only show matches for the selected division (in case backend fails)
  const filteredUpcomingMatches = scheduledConfirmedMatches.filter(m =>
    m.divisions && selectedDivision &&
    Array.isArray(m.divisions) && m.divisions.includes(selectedDivision)
  );

  // Update the logic where a match/proposal is clicked:
  function handleProposalClick(match) {
    setSelectedMatch(match);
    setModalOpen(true);
  }

     // Define allMatchesModal before the return statement
   const allMatchesModal = showAllMatchesModal && (
     <div className={styles.modalOverlay}>
       <div className={styles.modalContent} style={{
         maxWidth: 600, 
         maxHeight: '80vh', 
         overflowY: 'auto',
         background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.98))',
         backdropFilter: 'blur(8px)',
         border: '2px solid rgba(255, 255, 255, 0.1)',
         borderRadius: '12px',
         boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)'
       }}>
         <h2 style={{ 
           color: '#fff', 
           marginBottom: 16,
           textAlign: 'center',
           fontSize: '1.4rem',
           fontWeight: 'bold',
           textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
         }}>All Upcoming Matches</h2>
        <ul className={styles.dashboardList} style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
          {filteredUpcomingMatches.map((match, idx) => {
            let opponent = '';
            let formattedDate = '';
            if (match.type === 'scheduled') {
              if (match.player1 && match.player2) {
                if (match.player1.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                  opponent = match.player2;
                } else {
                  opponent = match.player1;
                }
              }
              if (match.date) {
                const parts = match.date.split('/');
                if (parts.length === 3) {
                  const [month, day, year] = parts;
                  const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = formatDateMMDDYYYY(match.date);
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
                    formattedDate = formatDateMMDDYYYY(match.date);
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
            const isCompleted = match.completed === true;
            const actuallyCompleted = !!match.completed;
                         return (
               <li key={match._id || idx} className={styles.matchCard} style={{
                 padding: '0.8rem 1rem', 
                 fontSize: '0.98em', 
                 marginBottom: 12,
                 background: 'rgba(255, 255, 255, 0.05)',
                 borderRadius: '8px',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 transition: 'all 0.2s ease'
               }}>
                 <div className={styles.matchCardContentWrapper}>
                  <button
                    className={styles.matchCardButton}
                    onClick={() => handleProposalClick(match)}
                    type="button"
                    style={{padding: 0, margin: 0, minHeight: 0, fontSize: '0.98em', display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none'}}
                  >
                    <span className={styles.matchCardOpponentLabel} style={{fontSize: '1em', marginRight: 4}}>VS:</span>
                    <span className={styles.matchCardOpponentName} style={{fontSize: '1em', marginRight: 8}}>{opponent || '[Unknown Opponent]'}</span>
                    <span className={styles.matchCardDetail} style={{fontSize: '0.97em', marginRight: 8}}>{formattedDate}</span>
                    <span className={styles.matchCardDetail} style={{fontSize: '0.97em'}}>{match.location || '[No Location]'}</span>
                  </button>
                  {!actuallyCompleted && (
                    <LoadingButton
                      className={styles.dashboardBtn + ' ' + styles.matchCardDoneBtn}
                      loading={completingMatchId === match._id}
                      loadingText="Completing..."
                      style={{ 
                        marginLeft: 0, 
                        minWidth: 70, 
                        padding: '4px 8px', 
                        fontSize: '0.75em', 
                        height: 28, 
                        lineHeight: '20px', 
                        marginTop: 6,
                        opacity: 0.18,
                        filter: 'blur(0.5px) grayscale(0.2)',
                        transition: 'opacity 0.22s, filter 0.22s, background 0.22s'
                      }}
                      onMouseEnter={(e) => {
                        if (completingMatchId !== match._id) {
                          e.target.style.opacity = '1';
                          e.target.style.filter = 'none';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (completingMatchId !== match._id) {
                          e.target.style.opacity = '0.18';
                          e.target.style.filter = 'blur(0.5px) grayscale(0.2)';
                        }
                      }}
                      onClick={() => {
                        let player1 = '';
                        let player2 = '';
                        if (match.type === 'scheduled') {
                          player1 = match.player1;
                          player2 = match.player2;
                        } else {
                          player1 = match.senderName;
                          player2 = match.receiverName;
                        }
                        setWinnerModalMatch(match);
                        setWinnerModalPlayers({ player1, player2 });
                        setWinnerModalOpen(true);
                      }}
                      type="button"
                    >
                      Complete
                    </LoadingButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
                 <div style={{display: 'flex', justifyContent: 'center', marginTop: 20}}>
           <button 
             className={styles.dashboardBtn} 
             onClick={() => setShowAllMatchesModal(false)}
             style={{
               background: 'linear-gradient(135deg, #ff4444, #e74c3c)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               borderRadius: '8px',
               padding: '10px 24px',
               fontSize: '1rem',
               fontWeight: '600',
               color: '#fff',
               cursor: 'pointer',
               transition: 'all 0.2s ease',
               boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)'
             }}
             onMouseEnter={(e) => {
               e.target.style.transform = 'translateY(-1px)';
               e.target.style.boxShadow = '0 6px 16px rgba(255, 68, 68, 0.4)';
             }}
             onMouseLeave={(e) => {
               e.target.style.transform = 'translateY(0)';
               e.target.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.3)';
             }}
           >
             Close
           </button>
         </div>
      </div>
    </div>
  );

  // Determine required matches based on phase
  const requiredMatches = effectivePhase === "challenge" ? 4 : 6;

  // Count both confirmed and completed matches as 'scheduled'
  const scheduledOrCompletedMatches = [
    ...scheduledConfirmedMatches.filter(match =>
      match.status === "confirmed" &&
      Array.isArray(match.divisions) && match.divisions.includes(selectedDivision) &&
      ([match.senderName?.trim().toLowerCase(), match.receiverName?.trim().toLowerCase()].includes(fullName.toLowerCase()))
    ),
    ...completedMatches.filter(match =>
      Array.isArray(match.divisions) && match.divisions.includes(selectedDivision) &&
      ([match.senderName?.trim().toLowerCase(), match.receiverName?.trim().toLowerCase()].includes(fullName.toLowerCase()))
    )
  ];

  // Remove duplicates (in case a match is both confirmed and completed)
  const uniqueScheduledOrCompleted = Array.from(new Set(scheduledOrCompletedMatches.map(m => m._id))).map(id =>
    scheduledOrCompletedMatches.find(m => m._id === id)
  );

  const matchesScheduledCount = uniqueScheduledOrCompleted.length;
  const matchesToScheduleCount = Math.max(0, requiredMatches - matchesScheduledCount);

  const [showCompletedModal, setShowCompletedModal] = useState(false);

  // Logical proposal counters based on who needs to act
  const proposalsWaitingForYou = [
    ...pendingProposals.filter(p => p.status === 'pending' && p.receiverName === fullName),
    ...sentProposals.filter(p => p.status === 'countered' && p.senderName === fullName)
  ];
  const proposalsWaitingForOpponent = [
    ...sentProposals.filter(p => p.status === 'pending' && p.senderName === fullName),
    ...pendingProposals.filter(p => p.status === 'countered' && p.receiverName === fullName)
  ];

  // Portal overlay for OpponentsModal
  const opponentsModalPortal = showOpponents && simulationRef.current
    ? ReactDOM.createPortal(
        <div
          style={{
            position: "absolute",
            top: simulationRef.current.getBoundingClientRect().top + window.scrollY,
            left: simulationRef.current.getBoundingClientRect().left + window.scrollX,
            width: simulationRef.current.offsetWidth,
            height: simulationRef.current.offsetHeight,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            pointerEvents: "auto"
          }}
        >
          <OpponentsModal
            open={showOpponents}
            onClose={() => setShowOpponents(false)}
            opponents={opponentsToSchedule}
            onOpponentClick={handleOpponentClick}
            phase={effectivePhase}
          />
        </div>,
        document.body
      )
    : null;

  // Check if we're on a mobile device - improved for iframe compatibility
  const isMobile = (() => {
    // First try viewport width (works better in iframes)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return true;
    }
    // Fallback to user agent detection
    if (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true;
    }
    // Additional check for iframe context
    if (typeof window !== 'undefined' && window.self !== window.top) {
      // We're in an iframe, be more conservative with mobile detection
      return window.innerWidth <= 768 || window.innerHeight <= 600;
    }
    return false;
  })();

  return (
    <div className={styles.dashboardBg} style={{ position: 'relative' }}>
      <div className={styles.dashboardFrame} style={{ position: 'relative', zIndex: 1 }}>
        {/* Main dashboard content starts here */}
        <div className={styles.dashboardCard} style={{ 
          position: 'relative', 
          zIndex: 1,
          padding: isMobile ? '12px' : '20px',
          margin: isMobile ? '6px' : '16px'
        }}>
          <h1 className={styles.dashboardTitle} style={{ fontSize: isMobile ? '1.6rem' : '2rem' }}>
            Welcome,
            <span className={styles.dashboardUserName} style={{ fontSize: isMobile ? '1.4rem' : '1.8rem' }}>
              {playerName} {playerLastName}
            </span>
          </h1>
          <div className={styles.announcement} style={{ fontSize: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '8px' : '16px' }}>
            <p>This is the BETA version. </p>Matches that are created, scheduled, and confirmed will NOT be played.<br />
            This is for testing purposes only.
          </div>
          
          {/* 10-Ball Tutorial Link - Admin Only */}
          {userPin === "777777" && (
            <div style={{ 
              marginBottom: isMobile ? 12 : 16,
              textAlign: 'center'
            }}>
              <button
                onClick={() => window.location.hash = '#/tenball-tutorial'}
                style={{
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  border: 'none',
                  color: 'white',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                }}
              >
                <img src={tenBall} alt="10-Ball" style={{ width: '20px', height: '20px', marginRight: '8px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
                Play 10-Ball Tutorial & Learn Official CSI Rules
              </button>
            </div>
          )}
          

          
          {!isMobile && <br />}
                     {/* --- Division Selector --- */}
           {divisions.length > 0 && (
             <div style={{ 
               marginBottom: isMobile ? 8 : 16,
               display: 'flex',
               flexDirection: 'column',
               alignItems: isMobile ? 'flex-start' : 'center',
               gap: isMobile ? '8px' : '12px'
             }}>
               <div style={{
                 display: 'flex',
                 flexDirection: isMobile ? 'column' : 'row',
                 alignItems: isMobile ? 'flex-start' : 'center',
                 gap: isMobile ? '4px' : '12px',
                 width: '100%'
               }}>
                 <label style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                   Division:&nbsp;
                   {divisions.length > 1 ? (
                     <select
                       value={selectedDivision}
                       onChange={e => setSelectedDivision(e.target.value)}
                       style={{ 
                         fontSize: isMobile ? "0.9em" : "1em", 
                         padding: isMobile ? 6 : 4, 
                         borderRadius: 4 
                       }}
                     >
                       {divisions.map(div =>
                         <option key={div} value={div}>{div}</option>
                       )}
                     </select>
                   ) : (
                     <span style={{ fontWeight: 600 }}>{divisions[0]}</span>
                   )}
                 </label>
                 {!isMobile && (
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
                 )}
               </div>
                               {isMobile && (
                  <span style={{ 
                    fontSize: "0.8em", 
                    padding: "3px 6px", 
                    borderRadius: "4px", 
                    backgroundColor: effectivePhase === "challenge" ? "#e53e3e" : "#28a745",
                    color: "white",
                    fontWeight: "600",
                    alignSelf: 'center'
                  }}>
                    Phase {effectivePhase === "challenge" ? "2" : effectivePhase === "scheduled" ? "1" : "Complete"}
                  </span>
                )}
             </div>
           )}





          {/* --- Phase 2 Challenge Tracker --- */}
          {/* Phase 2 tracker will be positioned as overlay on pool table */}

          {/* --- Upcoming Matches Section --- */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox} ${styles.matchesSection}`}
            style={{
              position: "relative",
              overflow: "visible",
              backgroundColor: "rgba(0, 0, 0, .5)",
              minHeight: isMobile ? "120px" : "370px",
              marginBottom: isMobile ? '16px' : '36px',
              paddingBottom: isMobile ? '20px' : '20px',
            }}
          >
            {/* PoolSimulation as background and matches list overlayed on table */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div className={styles.poolTableContainer} style={{ 
                marginBottom: isMobile ? '12px' : '24px', 
                position: 'relative',
                width: '100%',
                maxWidth: isMobile ? '98%' : '600px'
              }}>
                
                                 {/* Phase 1 Tracker positioned over the simulation */}
                 {effectivePhase === 'scheduled' && seasonData && (
                   <div style={{
                     position: 'absolute',
                     top: isMobile ? '25px' : '35px',
                     left: '50%',
                     transform: 'translateX(-50%)',
                     zIndex: 10,
                     width: isMobile ? '95%' : '75%',
                     maxWidth: isMobile ? '400px' : '500px',
                     height: isMobile ? '100px' : '200px'
                   }}>
                    <Phase1Tracker
                      currentPhase={effectivePhase}
                      seasonData={seasonData}
                      completedMatches={completedMatches}
                      totalRequiredMatches={totalRequiredMatches}
                      playerName={playerName}
                      playerLastName={playerLastName}
                      selectedDivision={selectedDivision}
                      onOpenOpponentsModal={() => setShowOpponents(true)}
                      onOpenCompletedMatchesModal={() => setShowCompletedModal(true)}
                      onOpenStandingsModal={() => setShowStandings(true)}
                      onOpenAllMatchesModal={() => setShowAllMatchesModal(true)}
                      pendingCount={pendingCount}
                      sentCount={sentCount}
                      onOpenProposalListModal={() => setShowProposalListModal(true)}
                      onOpenSentProposalListModal={() => setShowSentProposalListModal(true)}
                      upcomingMatches={filteredUpcomingMatches}
                      onMatchClick={handleProposalClick}
                      isMobile={isMobile}
                    />
                  </div>
                )}

                                 {/* Phase 2 Tracker positioned over the simulation */}
                 {effectivePhase === 'challenge' && (
                   <div style={{
                     position: 'absolute',
                     top: isMobile ? '25px' : '35px',
                     left: '50%',
                     transform: 'translateX(-50%)',
                     zIndex: 10,
                     width: isMobile ? '95%' : '75%',
                     maxWidth: isMobile ? '400px' : '500px',
                     height: isMobile ? '100px' : '200px'
                   }}>
                                         <Phase2Tracker
                       playerName={playerName}
                       playerLastName={playerLastName}
                       selectedDivision={selectedDivision}
                       phase={effectivePhase}
                       isMobile={isMobile}
                       onOpenOpponentsModal={() => setShowOpponents(true)}
                       onOpenCompletedMatchesModal={() => setShowCompletedModal(true)}
                                        onOpenStandingsModal={() => setShowStandings(true)}
                 onOpenDefenseChallengersModal={() => setShowDefenseChallengers(true)}
                 onOpenAllMatchesModal={() => setShowAllMatchesModal(true)}
                 pendingCount={pendingCount}
                 sentCount={sentCount}
                 onOpenProposalListModal={() => setShowProposalListModal(true)}
                 onOpenSentProposalListModal={() => setShowSentProposalListModal(true)}
                 onOpenPlayerSearch={() => setShowPlayerSearch(true)}
                 upcomingMatches={filteredUpcomingMatches}
                 onMatchClick={handleProposalClick}
                 seasonData={seasonData}
                     />
                  </div>
                 )}
                {isMobile ? (
                  <div
                    className={styles.simulationContainer}
                    ref={simulationRef}
                    style={{
                      width: '100%',
                      height: '140px',
                      position: 'relative'
                    }}
                  >
                    <PoolSimulation />
                  </div>
                ) : (
                  <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
                    <div
                      className={styles.simulationContainer}
                      ref={simulationRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative'
                      }}
                    >
                      <PoolSimulation />
                    </div>
                  </ResponsiveWrapper>
                )}
                {/* OpponentsModal portal overlay (not inside simulationContainer) */}
                {opponentsModalPortal}
                
                
              </div>
            </div>
          </section>

          
               {/* News & Updates Section with Chat/Standings Buttons */}
        <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
          
          <div className={styles.newsUpdatesHeader}>
            <button
              className={styles.dashboardBtn}
              onClick={() => setShowChatModal(true)}
              type="button"
              style={{ position: 'relative' }}
            >
              💬 Direct Messages
              {unreadMessages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#e53e3e',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.75em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </button>
            <button
              className={styles.dashboardBtn}
              onClick={() => navigate('/chat')}
              type="button"
              style={{ 
                background: '#4ecdc4',
                borderColor: '#4ecdc4',
                color: '#fff'
              }}
            >
              🚀 League Chat
            </button>
            <h2 className={styles.dashboardSectionTitle}>
              News & Updates
            </h2>
            <button
              className={styles.dashboardBtn}
              type="button"
              onClick={() => setShowStandings(true)}
            >
              📊 View Standings
            </button>

          </div>
          {loadingNotes ? (
            <SkeletonLoader lines={3} height="16px" />
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
              onClick={async () => {
                if (phaseOverride === "challenge") {
                  // Switching back to Phase 1 - just update UI
                  setPhaseOverride("scheduled");
                } else {
                  // Switching to Phase 2 - activate it in the backend
                  try {
                    const response = await fetch(`${BACKEND_URL}/api/seasons/activate-phase2/${encodeURIComponent(selectedDivision)}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      console.log('✅ Phase 2 activated successfully:', data.message);
                      setPhaseOverride("challenge");
                      // Show success message and refresh season data
                      alert('✅ Phase 2 activated successfully! The system will now allow Phase 2 challenges.');
                      // Refresh season data without reloading the page
                      if (selectedDivision) {
                        // Trigger a re-fetch of season data
                        const refreshSeasonData = async () => {
                          try {
                            const [seasonResult, phaseResult] = await Promise.all([
                              seasonService.getCurrentSeason(selectedDivision),
                              seasonService.getCurrentPhaseAndWeek(selectedDivision)
                            ]);
                            setSeasonData(seasonResult?.season || null);
                            setCurrentPhaseInfo(phaseResult);
                          } catch (error) {
                            console.error('Error refreshing season data:', error);
                          }
                        };
                        refreshSeasonData();
                      }
                    } else {
                      console.error('❌ Failed to activate Phase 2:', data.error);
                      alert('Failed to activate Phase 2: ' + data.error);
                    }
                  } catch (error) {
                    console.error('❌ Error activating Phase 2:', error);
                    alert('Error activating Phase 2: ' + error.message);
                  }
                }
              }}
              type="button"
            >
              {phaseOverride === "challenge" ? "Switch to Phase 1 (Scheduled)" : "Activate Phase 2 (Challenge)"}
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
    {/* Player Search Modal (Phase 2) */}
  {showPlayerSearch && (
    <>
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

               {/* Defense Challengers Modal */}
           <DefenseChallengersModal
             open={showDefenseChallengers}
             onClose={() => setShowDefenseChallengers(false)}
             playerName={playerName}
             playerLastName={playerLastName}
             selectedDivision={selectedDivision}
           />

    {/* Match Details Modal */}
    <MatchDetailsModal
      open={modalOpen}
      onClose={closeModal}
      match={selectedMatch}
      onCompleted={matchId => setUpcomingMatches(prev => prev.filter(m => m._id !== matchId))}
      userPin={userPin}
      onMatchUpdated={updatedMatch => setSelectedMatch(updatedMatch)}
      senderName={`${playerName} ${playerLastName}`}
      senderEmail={senderEmail}
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
          // Determine if current user is proposer
          const isProposer = (
            (senderEmail && proposal.senderEmail && senderEmail.toLowerCase() === proposal.senderEmail.toLowerCase()) ||
            (`${playerName} ${playerLastName}`.toLowerCase() === (proposal.senderName || '').toLowerCase())
          );
          setSelectedProposal(proposal);
          setProposalNote("");
          setShowProposalListModal(false);
          setShowProposalDetailsModal(isProposer);
        }}
        onClose={() => setShowProposalListModal(false)}
        type="received"
      />
    )}

    {showSentProposalListModal && (
      <ProposalListModal
        proposals={sentProposals}
        onSelect={proposal => {
          // Determine if current user is proposer
          const isProposer = (
            (senderEmail && proposal.senderEmail && senderEmail.toLowerCase() === proposal.senderEmail.toLowerCase()) ||
            (`${playerName} ${playerLastName}`.toLowerCase() === (proposal.senderName || '').toLowerCase())
          );
          setSelectedProposal(proposal);
          setProposalNote("");
          setShowSentProposalListModal(false);
          setShowProposalDetailsModal(isProposer);
        }}
        onClose={() => setShowSentProposalListModal(false)}
        type="sent"
      />
    )}

    {/* Confirm Match Details Modal */}
   {selectedProposal && !showProposalDetailsModal && (
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
        currentUserName={`${playerName} ${playerLastName}`}
        currentUserEmail={senderEmail}
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
      senderPlayer={players.find(
        p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === (counterProposal?.senderName || '').trim().toLowerCase() ||
             p.email?.toLowerCase() === counterProposal?.senderEmail?.toLowerCase()
      )}
      phase={effectivePhase}
      selectedDivision={selectedDivision}
    />

    {/* Proposal Details Modal */}
    {(() => {
      return selectedProposal && showProposalDetailsModal && (
        <ProposalDetailsModal
          proposal={selectedProposal}
          open={showProposalDetailsModal}
          onClose={() => {
            setShowProposalDetailsModal(false);
            setSelectedProposal(null);
          }}
          onEdit={() => {
            if (selectedProposal.isCounter) {
              setShowProposalDetailsModal(false);
              setTimeout(() => {
                setSelectedProposal(null);
                setCounterProposal(selectedProposal);
                setShowCounterModal(true);
              }, 0);
            } else {
              setShowEditProposalModal(true);
            }
          }}
          onMessage={() => {
            // Optionally open a chat or message modal here
            alert('Message opponent coming soon!');
          }}
        />
      );
    })()}

    {/* Edit Proposal Modal */}
    {selectedProposal && showEditProposalModal && (
      <EditProposalModal
        proposal={selectedProposal}
        open={showEditProposalModal}
        onClose={() => {
          setShowEditProposalModal(false);
        }}
        onSave={(updatedProposal) => {
          // Update the selected proposal with the new data
          setSelectedProposal(updatedProposal);
          // Refresh the proposals list
          refetchProposals();
          // Close the edit modal
          setShowEditProposalModal(false);
        }}
        selectedDivision={selectedDivision}
        phase={effectivePhase}
        receiverPlayer={players.find(
          p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === (selectedProposal.receiverName || '').trim().toLowerCase() ||
               p.email?.toLowerCase() === selectedProposal.receiverEmail?.toLowerCase()
        )}
      />
    )}

    {allMatchesModal}

    {/* Chat Modal */}
    {showChatModal && (
      <div className={styles.modalOverlay} style={{zIndex: 99999}}>
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95vw',
          height: '95vh',
          maxWidth: '1400px',
          maxHeight: '900px',
          background: '#181818',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #333',
            background: '#222',
            borderRadius: '12px 12px 0 0'
          }}>
            <h2 style={{margin: 0, color: '#fff', fontSize: '1.2em'}}>League Chat</h2>
            <button
              onClick={() => setShowChatModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#444'}
              onMouseOut={(e) => e.target.style.background = 'none'}
              type="button"
            >
              ×
            </button>
          </div>
          <div style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
            <DirectMessagingModal
              userName={`${playerName} ${playerLastName}`}
              userEmail={senderEmail}
              userPin={userPin}
              selectedDivision={selectedDivision}
              opponentEmails={opponentEmails}
              onClose={() => setShowChatModal(false)}
            />
          </div>
        </div>
      </div>
    )}

    {showCompletedModal && (
      <ProposalListModal
        proposals={completedMatches}
        onSelect={() => {}}
        onClose={() => setShowCompletedModal(false)}
        type="completed"
        isAdmin={userPin === "777777"}
        senderEmail={senderEmail}
        senderName={`${playerName} ${playerLastName}`}
        onProposalUpdated={(updatedProposal) => {
          // Immediately update the completed matches with the new winner
          updateCompletedMatch(updatedProposal);
          // Also refresh the proposals to ensure consistency
          refetchProposals();
        }}
      />
    )}

    {/* Winner Select Modal */}
    <WinnerSelectModal
      open={winnerModalOpen}
      onClose={() => setWinnerModalOpen(false)}
      player1={winnerModalPlayers.player1}
      player2={winnerModalPlayers.player2}
      onSelect={async (winner) => {
        if (!winnerModalMatch) return;
        
        // Check if Phase 1 deadline has passed
        if (currentPhaseInfo?.phase === 'scheduled' && seasonData) {
          const deadlinePassed = seasonService.hasPhase1DeadlinePassed(seasonData);
          if (deadlinePassed) {
            const confirmed = window.confirm(
              '⚠️ PHASE 1 DEADLINE HAS PASSED!\n\n' +
              'You are attempting to complete a match after the Phase 1 deadline. ' +
              'This may affect your standings or eligibility for Phase 2.\n\n' +
              'Do you want to continue marking this match as completed?'
            );
            if (!confirmed) {
              setWinnerModalOpen(false);
              return;
            }
          }
        }
        
        setWinnerModalOpen(false);
        setCompletingMatchId(winnerModalMatch._id);
        try {
          await proposalService.markCompleted(winnerModalMatch._id, winner);
          markMatchCompleted({ ...winnerModalMatch, winner });
          refetchMatches();
          refetchProposals();
        } catch (err) {
          alert('Failed to mark as completed.');
        }
        setCompletingMatchId(null);
      }}
    />

    {/* Match Validation Modal */}
    <MatchValidationModal
      isOpen={validationModalOpen}
      onClose={() => {
        setValidationModalOpen(false);
        setMatchToValidate(null);
      }}
      match={matchToValidate}
      onValidate={async (validationData) => {
        // Handle match validation
        console.log('Validating match:', validationData);
        // TODO: Implement validation logic
        refetchMatches();
      }}
      onReject={async (matchId) => {
        // Handle match rejection
        console.log('Rejecting match:', matchId);
        // TODO: Implement rejection logic
        refetchMatches();
      }}
    />
  </div>
);
}
