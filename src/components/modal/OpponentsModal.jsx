import React from "react";
import DraggableModal from "./DraggableModal";

export default function OpponentsModal({ open, onClose, opponents, onOpponentClick, phase }) {
  if (!open) return null;

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title={`🎱 Select Opponent - ${phase === "scheduled" || phase === "offseason" ? "Phase 1" : "Phase 2"}`}
      maxWidth="500px"
    >
      <div style={{
        maxHeight: "60vh",
        overflowY: "auto"
      }}>
        {opponents.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", fontStyle: "italic" }}>
            No opponents available for scheduling at this time.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gap: "8px"
          }}>
            {opponents.map((opponent, index) => (
              <button
                key={
                  (opponent.player && opponent.player.email) || 
                  `${opponent.opponentName}-${index}` || 
                  `opponent-${index}`
                }
                onClick={() =>
                  onOpponentClick(
                    opponent.player
                      ? `${opponent.player.firstName} ${opponent.player.lastName}`
                      : opponent.opponentName
                  )
                }
                style={{
                  background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                  color: "#fff",
                  border: "2px solid #e53e3e",
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "linear-gradient(135deg, #e53e3e 0%, #c00 100%)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(229, 62, 62, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "linear-gradient(135deg, #232323 0%, #2a0909 100%)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                {opponent.player
                  ? `${opponent.player.firstName} ${opponent.player.lastName}`
                  : opponent.opponentName}
              </button>
            ))}
          </div>
        )}
      </div>
    </DraggableModal>
  );
}
