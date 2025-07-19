import { useState, useEffect, useCallback } from "react";
import fetchSheetData from "../../utils/fetchSheetData";
import { useProposals } from '../../hooks/useProposals';
import { useMatches } from '../../hooks/useMatches';
import { proposalService } from '../../services/proposalService';
import { userService } from '../../services/userService';
import { noteService } from '../../services/noteService';

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

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

export default function useDashboardState({
  playerName,
  playerLastName,
  onOpenChat,
  userPin,
  onGoToAdmin,
  onLogout,
  onScheduleMatch,
  senderEmail
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
  const [showAllMatchesModal, setShowAllMatchesModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("scheduled");
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [showOpponents, setShowOpponents] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showAdminPlayerSearch, setShowAdminPlayerSearch] = useState(false);
  const [phaseOverride, setPhaseOverride] = useState(null);
  const [showPlayerAvailability, setShowPlayerAvailability] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [numToSchedule, setNumToSchedule] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [currentPhaseTotal, setCurrentPhaseTotal] = useState(0);
  const fullName = `${playerName} ${playerLastName}`.trim();
  const { pendingProposals, sentProposals, loading: proposalsLoading, refetch: refetchProposals } = useProposals(fullName, selectedDivision);
  const effectivePhase = phaseOverride || currentPhase;
  const { matches: scheduledConfirmedMatches, completedMatches, scheduledConfirmedMatches: legacyScheduledConfirmedMatches, loading: matchesLoading, refetch: refetchMatches, markMatchCompleted } = useMatches(fullName, selectedDivision, effectivePhase);
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [showProposalDetailsModal, setShowProposalDetailsModal] = useState(false);
  const [showEditProposalModal, setShowEditProposalModal] = useState(false);
  const [completingMatchId, setCompletingMatchId] = useState(null);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerModalMatch, setWinnerModalMatch] = useState(null);
  const [winnerModalPlayers, setWinnerModalPlayers] = useState({ player1: '', player2: '' });
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showConfirmationNotice, setShowConfirmationNotice] = useState(false);

  useEffect(() => {
    setPendingCount(pendingProposals.length);
  }, [pendingProposals]);
  useEffect(() => {
    setSentCount(sentProposals.length);
  }, [sentProposals]);
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
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [senderEmail]);
  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision) return;
    if (matchesLoading || proposalsLoading) {
      return;
    }
    const currentPhaseNumber = effectivePhase === "challenge" ? 2 : 1;
    const playerScheduleEffect = scheduledMatches.filter(
      m => m.division === selectedDivision &&
        m.phase === currentPhaseNumber &&
        ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
        (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
    );
    const totalRequired = playerScheduleEffect.length;
    setTotalCompleted(completedMatches.length);
    const confirmedMatches = scheduledConfirmedMatches.filter(match => 
      match.status === "confirmed" && 
      (match.completed === false || match.completed === undefined)
    );
    const totalScheduledOrCompleted = confirmedMatches.length + completedMatches.length;
    const scheduledCount = Math.max(0, totalRequired - totalScheduledOrCompleted);
    setNumToSchedule(scheduledCount);
    setCurrentPhaseTotal(totalRequired);
  }, [playerName, playerLastName, selectedDivision, scheduledMatches, completedMatches, scheduledConfirmedMatches, matchesLoading, proposalsLoading]);
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
      .then(data => {
        setScheduledMatches(data);
      })
      .catch((error) => {
        console.error('Failed to load schedule for', selectedDivision, ':', error);
        setScheduledMatches([]);
      });
  }, [selectedDivision]);
  useEffect(() => {
    if (!senderEmail) return;
    userService.getUser(senderEmail)
      .then(user => {
        let divs = [];
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
    const interval = setInterval(() => {
      refetchProposals();
      refetchMatches();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [playerName, playerLastName, selectedDivision, refetchProposals, refetchMatches]);

  // Handlers
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
      (!m.phase || m.phase === currentPhaseNumber) &&
      ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
      (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
  );
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
  function getMatchesToSchedule() {
    const usedConfirmed = new Set();
    const matchesToSchedule = [];
    for (const schedMatch of playerSchedule) {
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
        continue;
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
  const opponentsToSchedule = matchesToSchedule.map(m => {
    const name = m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()
      ? m.player2?.trim()
      : m.player1?.trim();
    if (!name) return null;
    const playerObj = players.find(
      p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === name.toLowerCase()
    );
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
  }
  function refreshSchedule() {
    fetch(`${BACKEND_URL}/static/schedule.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setScheduledMatches(data))
      .catch(() => setScheduledMatches([]));
  }
  function handleScheduleMatch() {
    if (effectivePhase === "scheduled") {
      setShowOpponents(true);
    } else {
      setShowPlayerSearch(true);
    }
  }
  const filteredUpcomingMatches = scheduledConfirmedMatches.filter(m =>
    m.divisions && selectedDivision &&
    Array.isArray(m.divisions) && m.divisions.includes(selectedDivision)
  );
  function handleProposalClick(match) {
    setSelectedMatch(match);
    setModalOpen(true);
  }
  // Handlers for proposal modals
  const onCloseProposalListModal = () => setShowProposalListModal(false);
  const onCloseSentProposalListModal = () => setShowSentProposalListModal(false);
  const onSelectPendingProposal = (proposal) => {
    setSelectedProposal(proposal);
    setProposalNote("");
    setShowProposalListModal(false);
    setShowProposalDetailsModal(true);
  };
  const onSelectSentProposal = (proposal) => {
    setSelectedProposal(proposal);
    setProposalNote("");
    setShowSentProposalListModal(false);
    setShowProposalDetailsModal(true);
  };
  // Modal close handlers
  const onCloseOpponents = () => setShowOpponents(false);
  const onClosePlayerSearch = () => setShowPlayerSearch(false);
  const onCloseAdminPlayerSearch = () => setShowAdminPlayerSearch(false);
  const onClosePlayerAvailability = () => { setShowPlayerAvailability(false); setSelectedOpponent(null); };
  const onCloseProposalModal = () => setShowProposalModal(false);
  const onCloseStandings = () => setShowStandings(false);
  const onCloseMatchDetails = () => { setModalOpen(false); setSelectedMatch(null); };
  const onCloseCounterProposal = () => { setShowCounterModal(false); setCounterProposal(null); };
  const onCloseProposalDetails = () => { setShowProposalDetailsModal(false); setSelectedProposal(null); };
  const onCloseEditProposal = () => setShowEditProposalModal(false);
  const onCloseWinnerModal = () => setWinnerModalOpen(false);
  const onCloseChatModal = () => setShowChatModal(false);
  const onCloseCompletedModal = () => setShowCompletedModal(false);
  function onProposeMatch(day, slot, phase, division) {
    setProposalData({
      player: selectedOpponent,
      day,
      slot,
      phase,
      selectedDivision: division || selectedDivision
    });
    setShowProposalModal(true);
    setShowPlayerAvailability(false);
  }
  // Handler for when a proposal is completed (from MatchProposalModal)
  function onProposalCompleteProposalModal() {
    setShowProposalModal(false);
    setProposalData(null);
    refetchProposals(); // Immediately update proposal counters
  }
  async function onConfirmProposal() {
    if (!selectedProposal) return;
    try {
      await proposalService.updateProposalStatus(selectedProposal._id, 'confirmed');
      setShowProposalDetailsModal(false);
      setSelectedProposal(null);
      refetchProposals();
      refetchMatches();
      setShowConfirmationNotice(true); // Show the notice
    } catch (err) {
      alert('Failed to confirm proposal.');
    }
  }
  async function onSelectWinner(winner) {
    if (!winnerModalMatch) return;
    try {
      console.log('DEBUG: Marking match completed:', {
        matchId: winnerModalMatch._id,
        winner,
        fullName,
        senderEmail
      });
      const res = await markMatchCompleted(winnerModalMatch._id, winner, fullName, senderEmail);
      console.log('DEBUG: Backend response:', res);
      setWinnerModalOpen(false);
      setWinnerModalMatch(null);
      setWinnerModalPlayers({ player1: '', player2: '' });
      refetchMatches();
    } catch (err) {
      console.error('Failed to mark match as completed:', err);
      alert('Failed to mark match as completed.');
    }
  }
  return {
    divisions,
    setDivisions,
    selectedDivision,
    setSelectedDivision,
    showStandings,
    setShowStandings,
    showProposalListModal,
    setShowProposalListModal,
    selectedProposal,
    setSelectedProposal,
    proposalNote,
    setProposalNote,
    showSentProposalListModal,
    setShowSentProposalListModal,
    showCounterModal,
    setShowCounterModal,
    counterProposal,
    setCounterProposal,
    notes,
    setNotes,
    loadingNotes,
    setLoadingNotes,
    showNoteModal,
    setShowNoteModal,
    newNote,
    setNewNote,
    noteError,
    setNoteError,
    selectedMatch,
    setSelectedMatch,
    modalOpen,
    setModalOpen,
    showAllMatches,
    setShowAllMatches,
    showAllMatchesModal,
    setShowAllMatchesModal,
    currentPhase,
    setCurrentPhase,
    scheduledMatches,
    setScheduledMatches,
    showOpponents,
    setShowOpponents,
    showPlayerSearch,
    setShowPlayerSearch,
    showAdminPlayerSearch,
    setShowAdminPlayerSearch,
    phaseOverride,
    setPhaseOverride,
    showPlayerAvailability,
    setShowPlayerAvailability,
    selectedOpponent,
    setSelectedOpponent,
    showProposalModal,
    setShowProposalModal,
    proposalData,
    setProposalData,
    players,
    setPlayers,
    numToSchedule,
    setNumToSchedule,
    totalCompleted,
    setTotalCompleted,
    currentPhaseTotal,
    setCurrentPhaseTotal,
    fullName,
    pendingProposals,
    sentProposals,
    proposalsLoading,
    refetchProposals,
    effectivePhase,
    scheduledConfirmedMatches,
    completedMatches,
    matchesLoading,
    refetchMatches,
    markMatchCompleted,
    pendingCount,
    setPendingCount,
    sentCount,
    setSentCount,
    showProposalDetailsModal,
    setShowProposalDetailsModal,
    showEditProposalModal,
    setShowEditProposalModal,
    completingMatchId,
    setCompletingMatchId,
    isCreatingProposal,
    setIsCreatingProposal,
    isLoadingNotes,
    setIsLoadingNotes,
    showChatModal,
    setShowChatModal,
    unreadMessages,
    setUnreadMessages,
    winnerModalOpen,
    setWinnerModalOpen,
    winnerModalMatch,
    setWinnerModalMatch,
    winnerModalPlayers,
    setWinnerModalPlayers,
    showCompletedModal,
    setShowCompletedModal,
    showConfirmationNotice,
    setShowConfirmationNotice,
    handleAddNote,
    handleDeleteNote,
    handleClearNotes,
    handleProposalResponse,
    handleCounterProposal,
    openModal,
    closeModal,
    getMatchDateTime,
    getMatchesToSchedule,
    matchesToSchedule,
    opponentsToSchedule,
    handleOpponentClick,
    refreshSchedule,
    handleScheduleMatch,
    filteredUpcomingMatches,
    handleProposalClick,
    opponentEmails,
    onCloseProposalListModal,
    onCloseSentProposalListModal,
    onSelectPendingProposal,
    onSelectSentProposal,
    onCloseOpponents,
    onClosePlayerSearch,
    onCloseAdminPlayerSearch,
    onClosePlayerAvailability,
    onCloseProposalModal,
    onCloseStandings,
    onCloseMatchDetails,
    onCloseCounterProposal,
    onCloseProposalDetails,
    onCloseEditProposal,
    onCloseWinnerModal,
    onCloseChatModal,
    onCloseCompletedModal,
    onProposeMatch,
    onProposalCompleteProposalModal,
    onConfirmProposal,
    onSelectWinner
  };
} 