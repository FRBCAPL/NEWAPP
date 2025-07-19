import React from "react";
import styles from "./dashboard.module.css";

export default function CountersRow({
  effectivePhase,
  totalCompleted,
  matchesToScheduleCount,
  setShowCompletedModal,
  handleScheduleMatch
}) {
  return (
    <div className={styles.countersRow} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '5px 0 0 0',
      width: '100%',
      paddingBottom: '12px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        marginBottom: '12px',
      }}>
        <button
          style={{
            background: '#23232a',
            color: '#28a745',
            borderRadius: 6,
            padding: '2px 8px',
            fontWeight: 600,
            fontSize: '0.95em',
            zIndex: 9999,
            position: 'relative',
            textAlign: 'center',
            border: '2px solid #28a745',
            minWidth: '220px',
            maxWidth: '100%',
            width: 'auto',
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'clip',
            cursor: 'pointer',
            margin: '0 4px'
          }}
          onClick={() => setShowCompletedModal(true)}
          title="Click to view completed matches"
          type="button"
        >
          {effectivePhase === "challenge" ? "Phase 2" : effectivePhase === "scheduled" ? "Phase 1" : effectivePhase} Matches Completed: {totalCompleted ?? 0}
        </button>
        <button
          style={{
            background: '#23232a',
            color: '#e53e3e',
            borderRadius: 6,
            padding: '2px 8px',
            fontWeight: 600,
            fontSize: '0.95em',
            zIndex: 9999,
            position: 'relative',
            textAlign: 'center',
            border: '2px solid #e53e3e',
            minWidth: '220px',
            maxWidth: '100%',
            width: 'auto',
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'clip',
            cursor: 'pointer',
            margin: '0 4px'
          }}
          title="Schedule a match"
          type="button"
          onClick={handleScheduleMatch}
        >
          {effectivePhase === "challenge" ? "Phase 2" : effectivePhase === "scheduled" ? "Phase 1" : effectivePhase} Matches To Schedule: {matchesToScheduleCount ?? 0}
        </button>
      </div>
    </div>
  );
} 