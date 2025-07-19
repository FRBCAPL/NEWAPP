import React from "react";
import styles from "./dashboard.module.css";

export default function DivisionSelector({
  divisions,
  selectedDivision,
  setSelectedDivision,
  effectivePhase
}) {
  if (!divisions || divisions.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <label>
        Division:&nbsp;
        {divisions.length > 1 ? (
          <select
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
            style={{ fontSize: "1em", padding: 4, borderRadius: 4 }}
          >
            {divisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontWeight: 600 }}>{divisions[0]}</span>
        )}
      </label>
      &nbsp;&nbsp;&nbsp;
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
    </div>
  );
} 