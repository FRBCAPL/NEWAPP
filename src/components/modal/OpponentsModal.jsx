import React from "react";
import DraggableModal from "./DraggableModal";

export default function OpponentsModal({ open, onClose, opponents, onOpponentClick, phase }) {
  if (!open) return null;

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title={`🎱 Select Opponent - ${phase === "scheduled" ? "Phase 1" : "Phase 2"}`}
      maxWidth="500px"
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ marginBottom: "1.5rem", color: "#fff", fontSize: "1.1rem" }}>
          Choose an opponent to schedule a match with:
        </p>
        
        <div style={{
          display: "grid",
          gap: "12px",
          maxHeight: "60vh",
          overflowY: "auto"
        }}>
          {opponents.map((opponent, index) => (
            <button
              key={opponent.name || `${opponent.firstName} ${opponent.lastName}` || index}
              onClick={() => onOpponentClick(opponent.name || `${opponent.firstName} ${opponent.lastName}`)}
              style={{
                background: "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                color: "#fff",
                border: "2px solid #e53e3e",
                borderRadius: "8px",
                padding: "0.7rem 0.5rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "center",
                width: "220px",
                margin: "0 auto",
                display: "block"
              }}
              onMouseEnter={e => {
                e.target.style.background = "linear-gradient(135deg, #e53e3e 0%, #c00 100%)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(229, 62, 62, 0.3)";
              }}
              onMouseLeave={e => {
                e.target.style.background = "linear-gradient(135deg, #232323 0%, #2a0909 100%)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              {opponent.name || `${opponent.firstName} ${opponent.lastName}`}
            </button>
          ))}
        </div>
        
        {opponents.length === 0 && (
          <div style={{ 
            color: "#888", 
            fontSize: "1rem", 
            padding: "2rem",
            fontStyle: "italic"
          }}>
            No opponents available for scheduling at this time.
          </div>
        )}
      </div>
    </DraggableModal>
  );
}
