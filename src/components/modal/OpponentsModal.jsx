import React from "react";
import styles from './OpponentsModal.module.css';

export default function OpponentsModal({ open, onClose, opponents, onOpponentClick, phase }) {
  if (!open) return null;

  return (
    <div className={styles.opponentModalOverlay} onClick={onClose}>
      <div className={styles.opponentModalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.opponentModalTitle}>
          Opponents Left To Schedule<br />
          <span style={{ fontSize: 14, color: "#888", marginLeft: 8 }}>
            (Phase 1: {phase})
          </span>
        </div>
        <ul className={styles.opponentModalList}>
          {opponents.length === 0 ? (
            <li className={styles.opponentModalListItem}>All matches scheduled!</li>
          ) : (
            opponents.map((opponent, idx) => (
              <li
                key={idx}
                className={styles.opponentModalListItem}
                style={{ cursor: "pointer" }}
                onClick={() => onOpponentClick(opponent)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter") onOpponentClick(opponent);
                }}
                title={`View ${opponent}'s availability`}
              >
                <strong>{opponent}</strong>
              </li>
            ))
          )}
        </ul>
        <button className={styles.opponentModalCloseBtn} onClick={onClose} type="button">
          Close
        </button>
        <span
          onClick={onClose}
          className={styles.opponentModalCloseIcon}
          title="Close"
          aria-label="Close"
        >
          ×
        </span>
      </div>
    </div>
  );
}
