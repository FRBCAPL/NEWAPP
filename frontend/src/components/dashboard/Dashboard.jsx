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
import PhaseSelectionModal from "../modal/PhaseSelectionModal";

const STANDINGS_URL = 'https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

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
  const [showStandings, setShowStandings] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Proposal state
  const [pendingProposals, setPendingProposals] = useState([]);
  const [showProposalListModal, setShowProposalListModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalNote, setProposalNote] = useState(""); // For modal note

  // Sent proposals state
  const [sentProposals, setSentProposals] = useState([]);
  const [showSentProposalListModal, setShowSentProposalListModal] = useState(false);

  // Counter-Proposal modal state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterProposal, setCounterProposal] = useState(null);

  // Notes state for shared notes (from backend)
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState("");

  // Modal state for match details
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Show all matches toggle
  const [showAllMatches, setShowAllMatches] = useState(false);

  // PHASE SELECTION MODAL STATE
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);

  function openModal(match) {
    setSelectedMatch(match);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedMatch(null);
  }

  // Helper: get a JS Date from match date and time strings
  function getMatchDateTime(match) {
    if (match.date && match.time) {
      // Parse date as YYYY-MM-DD
      const [year, month, day] = match.date.split("-");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      // Parse time as "h:mm AM/PM"
      let timeStr = match.time.trim().toUpperCase();
      let [timePart, ampm] = timeStr.split(' ');
      let [hour, minute] = timePart.split(':').map(Number);
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = (minute || 0).toString().padStart(2, '0');
      const time24 = `${hourStr}:${minuteStr}`;
      return new Date(`${isoDate}T${time24}:00`);
    }
    return new Date(0);
  }

  // Combine first and last name for full DB query, trimmed
  const fullName = `${playerName} ${playerLastName}`.trim();

  // --- Fetch Upcoming Matches (from proposals, status: confirmed) ---
  function fetchUpcomingMatches() {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/upcoming-matches?player=${encodeURIComponent(fullName.trim())}`)
      .then(res => res.json())
      .then(matches => {
        // Future filtering and sorting is already done in backend, but keep for safety:
        const now = new Date();
        const filtered = matches.filter(match => {
          const matchDate = getMatchDateTime(match);
          return matchDate > now;
        });
        filtered.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
        setUpcomingMatches(filtered);
        setLoading(false);
      })
      .catch(err => {
        setUpcomingMatches([]);
        setLoading(false);
      });
  }

  // --- Fetch Pending Proposals ---
  function fetchPendingProposals() {
    if (!playerName || !playerLastName) return;
    const fullNameTrimmed = `${playerName} ${playerLastName}`.trim();
    fetch(`${BACKEND_URL}/api/proposals/by-name?receiverName=${encodeURIComponent(fullNameTrimmed)}`)
      .then(res => res.json())
      .then(data => setPendingProposals(data.filter(p => ["pending", "countered"].includes(p.status))))
      .catch(() => setPendingProposals([]));
  }

  // --- Fetch Sent Proposals ---
  function fetchSentProposals() {
    if (!playerName || !playerLastName) return;
    const fullNameTrimmed = `${playerName} ${playerLastName}`.trim();
    fetch(`${BACKEND_URL}/api/proposals/by-sender?senderName=${encodeURIComponent(fullNameTrimmed)}`)
      .then(res => res.json())
      .then(data => setSentProposals(data))
      .catch(() => setSentProposals([]));
  }

  // Fetch notes from backend
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

  // Fetch all data on mount and when player changes
  useEffect(() => {
    if (!playerName || !playerLastName) return;
    fetchUpcomingMatches();
    fetchPendingProposals();
    fetchSentProposals();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchUpcomingMatches();
      fetchPendingProposals();
      fetchSentProposals();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [playerName, playerLastName]);

  // Add note (admin only)
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

  // Delete note (admin only)
  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) setNotes(notes.filter(note => note._id !== id));
    } catch (err) {
      // Optionally show an error
    }
  };

  // Clear all notes (admin only)
  const handleClearNotes = async () => {
    if (!window.confirm("Are you sure you want to clear all notes?")) return;
    for (const note of notes) {
      await fetch(`${BACKEND_URL}/api/notes/${note._id}`, { method: "DELETE" });
    }
    setNotes([]);
  };

  // Confirm/decline proposal (add note param if needed)
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
        // Refresh all relevant data after action
        fetchUpcomingMatches();
        fetchPendingProposals();
        fetchSentProposals();
      })
      .catch(console.error);
  }

  // Handle counter-proposal submission
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
    // Refresh all relevant data after action
    fetchUpcomingMatches();
    fetchPendingProposals();
    fetchSentProposals();
  }

  // PHASE SCHEDULING LOGIC
  function handleScheduleMatch() {
    setPhaseModalOpen(true);
  }

  function handlePhaseSelect(phase) {
    setSelectedPhase(phase);
    setPhaseModalOpen(false);
    // Call the original onScheduleMatch, passing the selected phase
    if (onScheduleMatch) {
      onScheduleMatch(phase);
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
          {/* Upcoming Matches Section (show 2, expand to all) */}
          <section
            className={`${styles.dashboardSection} ${styles.dashboardSectionBox} ${styles.matchesSection}`}
            style={{
              position: "relative",
              overflow: "visible",
              backgroundColor: "#000",
              minHeight: "320px"
            }}
          >
            {/* Logo as a background layer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                backgroundImage: `url(${logoImg})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center 0%",
                backgroundSize: "500px",
                opacity: 0.18,
                pointerEvents: "none",
                zIndex: 0
              }}
            />
            {/* Content layer */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Proposal Alert Buttons Row */}
              <div className={styles.proposalAlertRow}>
                {pendingProposals.length > 0 && (
                  <button
                    className={styles.proposalAlertButton}
                    onClick={() => setShowProposalListModal(true)}
                    aria-label="View pending match proposals"
                  >
                    📥  {pendingProposals.length} proposals waiting for you
                  </button>
                )}
                {sentProposals.length > 0 && (
                  <button
                    className={styles.proposalAlertButton}
                    onClick={() => setShowSentProposalListModal(true)}
                    aria-label="View matches you have proposed"
                  >
                    📤 {sentProposals.length} proposals waiting for opponent
                  </button>
                )}
              </div>
              <h2 className={styles.dashboardSectionTitle}>Upcoming Scheduled Matches</h2>
              <div className={styles.dashboardHelperText}>
                Click Match For Details
              </div>
              <br /><br />
              <ul className={styles.dashboardList}>
                {(showAllMatches ? upcomingMatches : upcomingMatches.slice(0, 2)).length === 0 ? (
                  <li>No matches scheduled yet.</li>
                ) : (
                  (showAllMatches ? upcomingMatches : upcomingMatches.slice(0, 2)).map((match, idx) => {
                    const opponent =
                      match.senderName === fullName ? match.receiverName : match.senderName;

                    // Format date
                    let formattedDate = "";
                    if (match.date) {
                      // CORRECT:
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

          {/* Actions and Simulation */}
          <div className={styles.dashboardActions}>
            <button
              className={styles.dashboardBtn}
              onClick={handleScheduleMatch}
              type="button"
            >
              Schedule a Match
            </button>
            <button
              className={styles.dashboardBtn}
              onClick={onOpenChat}
              type="button"
            >
              Open Chat
            </button>
            <button
              className={styles.dashboardBtn}
              type="button"
              onClick={() => setShowStandings(true)}
            >
              View Standings
            </button>
            <div style={{
              width: "100%",
              maxWidth: 600,
              height: 300,
              margin: "0 auto 0 auto", 
              padding: "5px 16px 0px 16px"
            }}>
              <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
                <PoolSimulation />
              </ResponsiveWrapper>
            </div>
          </div>

          {/* League News Section */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
            <h2 className={styles.dashboardSectionTitle}> News & Updates</h2>
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

          {/* Admin Buttons (only for admin pin) */}
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
            </>
          )}
        </div>
      </div>

      {/* Phase Selection Modal */}
      <PhaseSelectionModal
  open={phaseModalOpen}
  onSelect={handlePhaseSelect}
  onClose={() => setPhaseModalOpen(false)}
/>


      {/* Add Note Modal */}
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

      {/* Proposals List Modal (received) */}
      {showProposalListModal && (
        <ProposalListModal
          proposals={pendingProposals}
          onSelect={proposal => {
            setSelectedProposal(proposal);
            setProposalNote(""); // clear note field
            setShowProposalListModal(false);
          }}
          onClose={() => setShowProposalListModal(false)}
          type="received"
        />
      )}

      {/* Proposals List Modal (sent) */}
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

      {/* Confirmation Modal for a selected proposal */}
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

      <StandingsModal
        open={showStandings}
        onClose={() => setShowStandings(false)}
        standingsUrl={STANDINGS_URL}
      />
      {/* Match Details Modal */}
      <MatchDetailsModal open={modalOpen} onClose={closeModal} match={selectedMatch} />
    </div>
  );
}
