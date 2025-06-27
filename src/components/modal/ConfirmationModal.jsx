import React from "react";
import BilliardBall from "../BilliardBall";


export default function ConfirmationModal({
  open,
  message,
  gameType,
  raceLength,
  day,
  date,
  time,
  location,
  proposalNote,
  confirmationNote,
  phase,
  onClose
}) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: "#fff", color: "#222", borderRadius: "1.2rem",
        minWidth: 320, maxWidth: 400, width: 'auto', margin: '0 auto', padding: "2rem 2.2rem",
        boxShadow: "0 0 24px #ff0000, 0 0 32px rgba(0,0,0,0.7)",
        textAlign: "center"
      }}>
        <p style={{ fontWeight: "bold", fontSize: "1.15rem" }}>{message}</p>
        
        {/* Match Summary */}
        <div style={{
          background: "#f8f8f8", color: "#222", borderRadius: 8,
          padding: "1rem 1.2rem", margin: "1.2rem 0 1.2rem 0",
          textAlign: "left", fontSize: "1.05rem", border: "1px solid #ff0000"
        }}> <div style={{ marginBottom: 6 }}>
            <strong>Phase:</strong> {phase === "scheduled" ? "Phase 1 (Scheduled)" : phase === "challenge" ? "Phase 2 (challenge)" : phase}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Game Type:</strong> <BilliardBall gameType={gameType} size={16}/> {gameType}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Race to:</strong> {raceLength}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Day:</strong> {day}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Date:</strong> {date}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Time:</strong> {time}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Location:</strong> {location}
          </div>
          {proposalNote && (
            <div style={{
              marginTop: 12,
              padding: "0.5rem 0.7rem",
              background: "#fffbe6",
              borderLeft: "3px solid #ffb300",
              borderRadius: 4,
              color: "#a36c00",
              fontSize: "0.97rem"
            }}>
              <strong>Opponent's note:</strong> {proposalNote}
            </div>
          )}
          {confirmationNote && (
            <div style={{
              marginTop: 10,
              padding: "0.5rem 0.7rem",
              background: "#e6fff0",
              borderLeft: "3px solid #00b36b",
              borderRadius: 4,
              color: "#006b3c",
              fontSize: "0.97rem"
            }}>
              <strong>Your note:</strong> {confirmationNote}
            </div>
          )}
        </div>

        <button
          style={{
            marginTop: "1.8rem", background: "#ff0000", color: "#fff",
            border: "none", borderRadius: "8px", padding: "0.7rem 1.5rem",
            fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer"
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
