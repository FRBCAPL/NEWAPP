import React, { useState, useEffect } from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import StandingsModal from "./StandingsModal.jsx";
import MatchDetailsModal from "../modal/MatchDetailsModal.jsx";
import ConfirmationModal from "../modal/ConfirmationModal.jsx"; // <-- Correct import path

const STANDINGS_URL = 'https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=75a741e3-5647-41e3-97e5-b2cc00a55489';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// --- ProposalListModal Component ---
function ProposalListModal({ proposals, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Pending Match Proposals"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          maxWidth: 420,
          width: "90%",
          padding: "2rem",
          boxShadow: "0 6px 32px #0004",
          position: "relative"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Pending Match Proposals</h2>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#888",
            cursor: "pointer"
          }}
          aria-label="Close proposals list"
        >
          ×
        </button>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {proposals.map(proposal => (
            <li key={proposal._id} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => onSelect(proposal)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "#f8f9fa",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: "1rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s"
                }}
              >
                <div><b>From:</b> {proposal.sender}</div>
                <div><b>Date:</b> {proposal.date} <b>Time:</b> {proposal.time}</div>
                <div><b>Location:</b> {proposal.location}</div>
              </button>
            </li>
          ))}
        </ul>
        {proposals.length === 0 && <div>No pending proposals.</div>}
      </div>
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
  const [showStandings, setShowStandings] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Proposal state
  const [pendingProposals, setPendingProposals] = useState([]);
  const [showProposalListModal, setShowProposalListModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Notes state for shared notes (from backend)
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState("");

  // Modal state for match details
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      const [month, day, year] = match.date.split("-");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      let time = match.time;
      if (time && /^\d{4}$/.test(time)) {
        time = time.slice(0, 2) + ":" + time.slice(2);
      }
      return new Date(`${isoDate}T${time}`);
    }
    return new Date(0);
  }

  // Combine first and last name for full DB query
  const fullName = `${playerName} ${playerLastName}`.trim();

  // Fetch matches from backend on mount and when playerName or playerLastName changes
  useEffect(() => {
    if (!playerName) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/matches?player=${encodeURIComponent(fullName)}`)
      .then(res => res.json())
      .then(matches => {
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
  }, [playerName, playerLastName]);

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

  // --- FETCH PROPOSALS BY NAME (NEW) ---
  useEffect(() => {
    if (!playerName || !playerLastName) return;
    const fullName = `${playerName} ${playerLastName}`.trim();
    fetch(`${BACKEND_URL}/api/proposals/by-name?receiverName=${encodeURIComponent(fullName)}`)
      .then(res => res.json())
      .then(data => setPendingProposals(data.filter(p => p.status === "pending")))
      .catch(() => setPendingProposals([]));
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

  // Confirm/decline proposal
  function handleProposalResponse(proposalId, status) {
    fetch(`${BACKEND_URL}/api/proposals/${proposalId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(() => {
        setPendingProposals(prev => prev.filter(p => p._id !== proposalId));
        setSelectedProposal(null);
      })
      .catch(console.error);
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

          {/* --- ALERT BUTTON FOR PROPOSALS --- */}
          {pendingProposals.length > 0 && (
            <button
              className={styles.proposalAlertButton}
              onClick={() => setShowProposalListModal(true)}
              aria-label="View pending match proposals"
              style={{
                background: "#f0ad4e",
                color: "#222",
                border: "none",
                borderRadius: "6px",
                padding: "0.75rem 1.5rem",
                fontWeight: "bold",
                fontSize: "1.1rem",
                cursor: "pointer",
                margin: "1rem 0",
                boxShadow: "0 2px 6px #0002"
              }}
            >
              🎱 You have {pendingProposals.length} match proposal{pendingProposals.length > 1 ? "s" : ""} waiting!
            </button>
          )}

          {/* Upcoming Matches Section */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
            <h2 className={styles.dashboardSectionTitle}>Upcoming Scheduled Matches</h2>
            <div className={styles.dashboardHelperText}>
              Click Match For Details
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className={styles.dashboardList}>
                {upcomingMatches.length === 0 ? (
                  <li>No matches scheduled yet.</li>
                ) : (
                  upcomingMatches.map((match, idx) => {
                    const opponent =
                      match.player === fullName ? match.opponent : match.player;

                    // Format date
                    let formattedDate = "";
                    if (match.date) {
                      const [month, day, year] = match.date.split("-");
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
            )}
          </section>

          {/* Actions and Simulation */}
          <div className={styles.dashboardActions}>
            <button
              className={styles.dashboardBtn}
              onClick={onScheduleMatch}
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

      {/* Proposals List Modal */}
      {showProposalListModal && (
        <ProposalListModal
          proposals={pendingProposals}
          onSelect={proposal => {
            setSelectedProposal(proposal);
            setShowProposalListModal(false);
          }}
          onClose={() => setShowProposalListModal(false)}
        />
      )}

      {/* Confirmation Modal for a selected proposal */}
      {selectedProposal && (
        <ConfirmationModal
          open={!!selectedProposal}
          proposal={selectedProposal}
          onConfirm={() => handleProposalResponse(selectedProposal._id, "confirmed")}
          onDecline={() => handleProposalResponse(selectedProposal._id, "declined")}
          onClose={() => setSelectedProposal(null)}
        />
      )}

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
