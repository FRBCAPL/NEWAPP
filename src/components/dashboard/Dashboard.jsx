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

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";
const STANDINGS_URLS = {
  "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
  "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
  // Add more divisions as needed
};

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

function AdminSyncButton({ backendUrl, onSyncComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/sync-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setResult("✅ Users synced successfully!");
        if (onSyncComplete) onSyncComplete();
      } else {
        setResult("❌ Sync failed.");
      }
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
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [showStandings, setShowStandings] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingProposals, setPendingProposals] = useState([]);
  const [showProposalListModal, setShowProposalListModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalNote, setProposalNote] = useState("");

  const [sentProposals, setSentProposals] = useState([]);
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
  const [scheduledCompleted, setScheduledCompleted] = useState(0);

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


  const fullName = `${playerName} ${playerLastName}`.trim();

  // Division logic
  useEffect(() => {
    if (!senderEmail) return;
    fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(senderEmail)}`)
      .then(res => res.json())
      .then(user => {
        let divs = [];
        if (user.divisions && user.divisions.length) {
          if (typeof user.divisions === "string") {
            divs = user.divisions.split(",").map(s => s.trim());
          } else if (Array.isArray(user.divisions)) {
            if (
              user.divisions.length === 1 &&
              typeof user.divisions[0] === "string" &&
              user.divisions[0].includes(",")
            ) {
              divs = user.divisions[0].split(",").map(s => s.trim());
            } else if (
              typeof user.divisions[0] === "object" &&
              user.divisions[0] !== null
            ) {
              divs = user.divisions.map(d => d.name || d);
            } else {
              divs = user.divisions;
            }
          }
        }console.log("divs before setDivisions:", divs);
        setDivisions(divs);
   console.log("divs:", divs);
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

  // Phase auto-detection
  useEffect(() => {
    if (!playerName || !playerLastName || !selectedDivision) return;
    fetch(`${BACKEND_URL}/api/all-matches?player=${encodeURIComponent(fullName.trim())}` +
          (selectedDivision ? `&division=${encodeURIComponent(selectedDivision)}` : ""))
      .then(res => res.json())
      .then(matches => {
        const scheduled = matches.filter(m => (m.phase === "scheduled" || !m.phase) && m.completed).length;
        setScheduledCompleted(scheduled);
        setCurrentPhase(scheduled >= 6 ? "challenge" : "scheduled");
      });
  }, [playerName, playerLastName, selectedDivision, upcomingMatches]);

  // Use override if set
  const effectivePhase = phaseOverride || currentPhase;

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

  function fetchUpcomingMatches() {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/all-matches?player=${encodeURIComponent(fullName.trim())}` +
          (selectedDivision ? `&division=${encodeURIComponent(selectedDivision)}` : ""))
      .then(res => res.json())
      .then(matches => {
        const filtered = matches.filter(match => !match.completed);
        filtered.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
        setUpcomingMatches(filtered);
        setLoading(false);
      })
      .catch(err => {
        setUpcomingMatches([]);
        setLoading(false);
      });
  }

  function fetchPendingProposals() {
    if (!playerName || !playerLastName) return;
    const fullNameTrimmed = `${playerName} ${playerLastName}`.trim();
    fetch(`${BACKEND_URL}/api/proposals/by-name?receiverName=${encodeURIComponent(fullNameTrimmed)}` +
          (selectedDivision ? `&division=${encodeURIComponent(selectedDivision)}` : ""))
      .then(res => res.json())
      .then(data => setPendingProposals(data.filter(p => ["pending", "countered"].includes(p.status))))
      .catch(() => setPendingProposals([]));
  }

  function fetchSentProposals() {
    if (!playerName || !playerLastName) return;
    const fullNameTrimmed = `${playerName} ${playerLastName}`.trim();
    fetch(`${BACKEND_URL}/api/proposals/by-sender?senderName=${encodeURIComponent(fullNameTrimmed)}` +
          (selectedDivision ? `&division=${encodeURIComponent(selectedDivision)}` : ""))
      .then(res => res.json())
      .then(data => setSentProposals(data))
      .catch(() => setSentProposals([]));
  }

  useEffect(() => {
    setLoadingNotes(true);
    fetch(`${BACKEND_URL}/api/notes`)
      .then(res => res.json())
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
    fetchUpcomingMatches();
    fetchPendingProposals();
    fetchSentProposals();

    const interval = setInterval(() => {
      fetchUpcomingMatches();
      fetchPendingProposals();
      fetchSentProposals();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [playerName, playerLastName, selectedDivision]);

  const handleAddNote = async () => {
    setNoteError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        setNoteError(err.error || "Failed to add note");
        return;
      }
      const note = await res.json();
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
      const res = await fetch(`${BACKEND_URL}/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) setNotes(notes.filter(note => note._id !== id));
    } catch (err) {}
  };

  const handleClearNotes = async () => {
    if (!window.confirm("Are you sure you want to clear all notes?")) return;
    for (const note of notes) {
      await fetch(`${BACKEND_URL}/api/notes/${note._id}`, { method: "DELETE" });
    }
    setNotes([]);
  };

  function handleProposalResponse(proposalId, status, note = "") {
    fetch(`${BACKEND_URL}/api/proposals/${proposalId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    })
      .then(() => {
        setPendingProposals(prev => prev.filter(p => p._id !== proposalId));
        setSelectedProposal(null);
        setProposalNote("");
        fetchUpcomingMatches();
        fetchPendingProposals();
        fetchSentProposals();
      })
      .catch(console.error);
  }

  async function handleCounterProposal(counterData) {
    if (!counterProposal) return;
    await fetch(`${BACKEND_URL}/api/proposals/${counterProposal._id}/counter`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...counterData,
        from: fullName
      })
    });
    setShowCounterModal(false);
    setCounterProposal(null);
    fetchUpcomingMatches();
    fetchPendingProposals();
    fetchSentProposals();
  }

  // SCHEDULED MATCHES LOGIC
 const playerSchedule = scheduledMatches.filter(
  m => m.division === selectedDivision &&
      ((m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()) ||
       (m.player2 && m.player2.trim().toLowerCase() === fullName.toLowerCase()))
);


  function scheduleKey(m) {
    var opponent = m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()
      ? m.player2 : m.player1;
    opponent = opponent ? opponent.trim().toLowerCase() : "";
    var date = m.date ? m.date.trim() : "";
    var location = m.location ? m.location.trim().toLowerCase() : "";
    return date + "|" + opponent + "|" + location;
  }

  function backendKey(m) {
    var opponent = m.senderName && m.senderName.trim().toLowerCase() === fullName.toLowerCase()
      ? m.receiverName : m.senderName;
    opponent = opponent ? opponent.trim().toLowerCase() : "";
    var date = m.date;
    if (date && date.indexOf("-") > -1) {
      var parts = date.split("-");
      if (parts.length === 3) {
        var y = parts[0];
        var mo = String(parseInt(parts[1], 10));
        var d = String(parseInt(parts[2], 10));
        date = mo + "/" + d + "/" + y;
      }
    }
    var location = m.location ? m.location.trim().toLowerCase() : "";
    return date + "|" + opponent + "|" + location;
  }

  var scheduledMatchKeys = playerSchedule.map(scheduleKey);
  var alreadyScheduledKeys = upcomingMatches.map(backendKey);

  var matchesToSchedule = [];
  for (var i = 0; i < scheduledMatchKeys.length; i++) {
    if (alreadyScheduledKeys.indexOf(scheduledMatchKeys[i]) === -1) {
      matchesToSchedule.push(scheduledMatchKeys[i]);
    }
  }

  var numToSchedule = matchesToSchedule.length;

  // Prepare the opponents list for the modal
  const opponentsToSchedule = playerSchedule
    .filter(function(m) {
      var key = scheduleKey(m);
      return matchesToSchedule.indexOf(key) !== -1;
    })
    .map(function(m) {
      return m.player1 && m.player1.trim().toLowerCase() === fullName.toLowerCase()
        ? m.player2
        : m.player1;
    });

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

  // --- New: handle schedule match by phase (using effectivePhase) ---
  function handleScheduleMatch() {
    if (effectivePhase === "scheduled") {
      setShowOpponents(true);
    } else {
      setShowPlayerSearch(true);
    }
  }

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
            </div>
          )}

          {/* Phase status */}
          <div style={{ marginBottom: 8, color: "#888" }}>
            Phase: <b>{effectivePhase === "scheduled" ? "1 (Scheduled)" : "2 (Challenge)"}</b>
            {effectivePhase === "scheduled" && (
              <> — {scheduledCompleted} of 6 matches completed</>
            )}
            {phaseOverride && (
              <span style={{ color: "#c00", marginLeft: 12 }}>(Test Override Active)</span>
            )}
          </div>

          {/* Upcoming Matches Section */}
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
        disabled={pendingProposals.length === 0}
        style={pendingProposals.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
      >
        📥  {pendingProposals.length} proposals waiting for you
      </button>
      <button
        className={styles.proposalAlertButton}
        onClick={() => setShowSentProposalListModal(true)}
        aria-label="View matches you have proposed"
        disabled={sentProposals.length === 0}
        style={sentProposals.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
      >
        📤 {sentProposals.length} proposals waiting for opponent
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
          const opponent =
            match.senderName === fullName ? match.receiverName : match.senderName;

          let formattedDate = "";
          if (match.date) {
            const [year, month, day] = match.date.split("-");
            const dateObj = new Date(`${year}-${month}-${day}`);
            formattedDate = dateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }

          return (
            <li key={match._id || idx} className={styles.matchCard}>
              <button
                className={styles.matchCardButton}
                onClick={() => openModal(match)}
                type="button"
              >
                <span className={styles.matchCardOpponentLabel}>VS:</span>
                <span className={styles.matchCardOpponentName}>{opponent}</span>
                <span className={styles.matchCardDetail}>{formattedDate}</span>
                <span className={styles.matchCardDetail}>{match.location}</span>
              </button>
            </li>
          );
        })
      )}
    </ul>
    {upcomingMatches.length > 2 && (
      <button
        className={styles.smallShowMoreBtn}
        onClick={() => setShowAllMatches(v => !v)}
        type="button"
      >
        {showAllMatches
          ? "Show Less"
          : `Show ${upcomingMatches.length - 2} More`}
      </button>
    )}
  </div>
</section>
 
          {/* CENTERED MATCHES LEFT TEXT AND SCHEDULE BUTTON */}
          <div style={{ textAlign: "center", margin: "2px 0 16px 0" }}>
            <div style={{ marginBottom: 8, color: "#888", fontWeight: 500 }}>
              {numToSchedule === 0
                ? "All required matches are scheduled!"
                : `You have ${numToSchedule} of ${playerSchedule.length} matches left to schedule.`}
            </div>
            <button
              className={styles.dashboardBtn}
              type="button"
              style={{ marginTop: 8 }}
              onClick={handleScheduleMatch}
            >
              Schedule a Match
            </button>
          </div>

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
{console.log("matchesToSchedule", matchesToSchedule)}
{console.log("opponentsToSchedule", opponentsToSchedule)}
{console.log("selectedDivision", selectedDivision)}
      {/* Opponents Modal */}
     <OpponentsModal
     
  open={showOpponents}
  
  onClose={() => setShowOpponents(false)}
  opponents={opponentsToSchedule}
  onOpponentClick={handleOpponentClick}
  phase={effectivePhase}
/>


      {/* Player Search Modal (Phase 2) */}
    {showPlayerSearch && (
  <PlayerSearch
    onClose={() => setShowPlayerSearch(false)}
    excludeName={fullName}
    senderName={fullName}
    senderEmail={senderEmail}
    selectedDivision={selectedDivision}
    phase={effectivePhase}
    onProposalComplete={() => setShowPlayerSearch(false)}
  />
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
              console.log("Opening proposal modal with phase:", effectivePhase);
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
    }}
  />
)}



      

{/* Standings Modal */}
{console.log("selectedDivision:", selectedDivision)}
{console.log("standingsUrl:", STANDINGS_URLS[selectedDivision])}
<StandingsModal
  open={showStandings}
  onClose={() => setShowStandings(false)}
  standingsUrl={STANDINGS_URLS[selectedDivision]}
/>

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
        onConfirm={() => {
          handleProposalResponse(selectedProposal._id, "confirmed", proposalNote);
          setSelectedProposal(null);
          setProposalNote("");
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
