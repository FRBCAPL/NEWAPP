import React from "react";
import DraggableModal from "./DraggableModal";

export default function OpponentsModal({ open, onClose, opponents, onOpponentClick, phase, currentPlayerPosition }) {
  if (!open) return null;

  // Check if current player is in 1st place
  const isFirstPlace = currentPlayerPosition === 1;

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title={isFirstPlace ? "🏆 Current Champion - Potential Challengers" : `🎱 Select Opponent - ${phase === "scheduled" ? "Phase 1" : "Phase 2"}`}
      maxWidth="500px"
    >
      <div style={{ textAlign: "center" }}>
        {isFirstPlace ? (
          // Special 1st place message
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)",
            border: "3px solid #fbbf24",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              fontSize: "1.5rem",
              animation: "rotate 3s linear infinite"
            }}>
              👑
            </div>
            <div style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "1.5rem",
              animation: "rotate 3s linear infinite reverse"
            }}>
              👑
            </div>
            <h2 style={{
              color: "#fbbf24",
              fontSize: "1.8rem",
              fontWeight: "bold",
              margin: "0 0 1rem 0",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
              🏆 CURRENT CHAMPION! 🏆
            </h2>
            <p style={{
              color: "#fff",
              fontSize: "1.1rem",
              margin: "0 0 1rem 0",
              lineHeight: "1.4"
            }}>
              Congratulations! You're in 1st place and can only be challenged by others.
            </p>
            <div style={{
              background: "rgba(0,0,0,0.3)",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              color: "#e5e7eb",
              textAlign: "left"
            }}>
              <strong>Defense Rules:</strong><br/>
              • Required to defend 2 challenges during Phase 2 (if challenged)<br/>
              • After 2 defenses, additional challenges are voluntary<br/>
              • If not challenged, no matches required (top players immunity)
            </div>
          </div>
        ) : (
          <p style={{ marginBottom: "1.5rem", color: "#fff", fontSize: "1.1rem" }}>
            Choose an opponent to schedule a match with:
          </p>
        )}
        
        <div style={{
          display: "grid",
          gap: "12px",
          maxHeight: "60vh",
          overflowY: "auto"
        }}>
          {opponents.map((opponent, index) => {
            const opponentName = opponent.player
              ? `${opponent.player.firstName} ${opponent.player.lastName}`
              : opponent.opponentName;
            
            const playerRanking = opponent.playerRanking || opponent.ranking;
            const hasPriority = opponent.hasPriority;
            const isWaiting = opponent.isWaiting;
            
            return (
              <div key={opponent.player?.email || opponent.opponentName || index}>
                <button
                  onClick={() => onOpponentClick(opponentName)}
                  disabled={isFirstPlace}
                  style={{
                    background: isFirstPlace 
                      ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                      : "linear-gradient(135deg, #232323 0%, #2a0909 100%)",
                    color: isFirstPlace ? "#9ca3af" : "#fff",
                    border: "2px solid #e53e3e",
                    borderRadius: "8px",
                    padding: "0.7rem 0.5rem",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: isFirstPlace ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                    width: "220px",
                    margin: "0 auto",
                    display: "block",
                    opacity: isFirstPlace ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isFirstPlace) {
                      e.target.style.background = "linear-gradient(135deg, #e53e3e 0%, #c00 100%)";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(229, 62, 62, 0.3)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isFirstPlace) {
                      e.target.style.background = "linear-gradient(135deg, #232323 0%, #2a0909 100%)";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  {opponentName}
                </button>
                
                {/* Player ranking and status badges */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "4px"
                }}>
                  {playerRanking && (
                    <span style={{
                      background: "#374151",
                      color: "#9ca3af",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "500"
                    }}>
                      Rank #{playerRanking}
                    </span>
                  )}
                  
                  {hasPriority && (
                    <span style={{
                      background: "#059669",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}>
                      PRIORITY CHALLENGE
                    </span>
                  )}
                  
                  {isWaiting && (
                    <span style={{
                      background: "#d97706",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}>
                      WAITING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
      
      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DraggableModal>
  );
}
