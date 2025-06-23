import React from "react";
import styles from "./PhaseSelectionModal.module.css";

export default function PhaseSelectionModal({ open, onSelect, onClose }) {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Close X */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <h2>Select Scheduling Phase</h2>
        <p>Which phase are you scheduling for?</p>
        <button className={styles.phaseBtn1} onClick={() => onSelect("phase1")}>
          Weeks 1-6<br />Phase 1: Assigned Matches
        </button>
        <button className={styles.phaseBtn2} onClick={() => onSelect("phase2")}>
          Weeks 7-10<br />Phase 2: Ladder Challenge
        </button>
      </div>
    </div>
  );
}
