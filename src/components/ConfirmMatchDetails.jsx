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
        <span className={styles.redTitle}>🎱 Confirm Match</span>
      </h1>
      <div className={styles.confirmMatchDetails}>
        <div className={styles.detailRow}>
          <strong className={styles.redTitle}>You:</strong> {receiverName || proposal.to || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong className={styles.redTitle}>Opponent:</strong> {senderName || proposal.from || "N/A"}
        </div>
        {day && (
          <div className={styles.detailRow}>
            <strong className={styles.redTitle}>Day:</strong> {day}
          </div>
        )}
        <div className={styles.detailRow}>
          <strong className={styles.redTitle}>Date:</strong> {date || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong className={styles.redTitle}>Time:</strong> {time || "N/A"}
        </div>
        <div className={styles.detailRow}>
          <strong className={styles.redTitle}>Location:</strong> {location || "N/A"}
        </div>
        {gameType && (
          <div className={styles.detailRow}>
            <BilliardBall gameType={gameType} size={16} />
            <strong className={styles.redTitle}>Game Type:</strong> {gameType}
          </div>
        )}
        {raceLength && (
          <div className={styles.detailRow}>
            <strong className={styles.redTitle}>Race to:</strong> {raceLength}
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
    </div>
  );
}
