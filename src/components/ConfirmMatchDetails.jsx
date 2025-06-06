// src/components/dashboard/ConfirmMatchDetails.jsx
import React from 'react';
import styles from "./ConfirmMatch.module.css";
import BilliardBall from "./BilliardBall";

export default function ConfirmMatchDetails({
  proposal,
  userNote,
  setUserNote,
  onConfirm,
  onClose,
  onCounterPropose,
  showNote = true,
  confirmLabel = "✅ Confirm Match"
}) {
  if (!proposal) return null;

  const {
    senderName, receiverName, day, date, time, location,
    gameType, raceLength, message, proposalNote
  } = proposal;

  return (
    <div className={styles.confirmMatchCard}>
      <h1 className={styles.confirmMatchTitle}>
        🎱 Confirm Match
      </h1>
      <div className={styles.confirmMatchDetails}>
        <div className={styles.detailRow}>
          <strong>You:</strong> {receiverName || proposal.to || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong>Opponent:</strong> {senderName || proposal.from || "N/A"}
        </div>
        {day && (
          <div className={styles.detailRow}>
            <strong>Day:</strong> {day}
          </div>
        )}
        <div className={styles.detailRow}>
          <strong>Date:</strong> {date || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong>Time:</strong> {time || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong>Location:</strong> {location || "N/A"}
        </div>
        {gameType && (
          <div className={styles.detailRow}>
            <BilliardBall gameType={gameType} size={16} /> <strong>Game Type:</strong> {gameType}
          </div>
        )}
        {raceLength && (
          <div className={styles.detailRow}>
            <strong>Race to:</strong> {raceLength}
          </div>
        )}
      </div>
      {(message || proposalNote) && (
        <div className={styles.proposalNote}>
          <strong>Note from opponent:</strong><br />
          {message || proposalNote}
        </div>
      )}
      {showNote && (
        <div className={styles.noteSection}>
          <label htmlFor="note" className={styles.noteLabel}>
            📝 Add a note (optional):
          </label>
          <textarea
            id="note"
            value={userNote}
            onChange={e => setUserNote(e.target.value)}
            rows={3}
            placeholder="Write a message to your opponent…"
            className={styles.noteTextarea}
          />
        </div>
      )}
      {/* --- Responsive Button Row --- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 18,
          justifyContent: "center",
          paddingBottom: 8,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          className={styles.confirmBtn}
          style={{ minWidth: 120 }}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button
          className={styles.confirmBtn}
          style={{ background: "#aaa", minWidth: 120 }}
          onClick={onClose}
        >
          Cancel
        </button>
        {onCounterPropose && (
          <button
            className={styles.confirmBtn}
            style={{
              background: "#fff",
              color: "#d32f2f",
              border: "1.5px solid #d32f2f",
              minWidth: 120,
            }}
            onClick={onCounterPropose}
            type="button"
          >
            Counter-Propose
          </button>
        )}
      </div>
    </div>
  );
}
