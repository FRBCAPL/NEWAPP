import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmationModal from "./modal/ConfirmationModal";
import CounterProposalModal from "./modal/CounterProposalModal";
import { sendConfirmationEmail } from '../utils/emailHelpers';
import BilliardBall from "./BilliardBall";
import styles from "./ConfirmMatch.module.css";
import Highlight from "./Highlight";
import { BACKEND_URL } from '../config.js';

// Utility function to format date as MM-DD-YYYY
function formatDateMMDDYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Handle YYYY-MM-DD format (which might be UTC)
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    // Create date in local timezone to avoid UTC shift
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const localMonth = String(date.getMonth() + 1).padStart(2, '0');
    const localDay = String(date.getDate()).padStart(2, '0');
    const localYear = date.getFullYear();
    return `${localMonth}-${localDay}-${localYear}`;
  }
  
  // Handle different date formats
  let date;
  if (dateStr.includes('-')) {
    // Already in YYYY-MM-DD format
    date = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    // Handle M/D/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
    } else {
      return dateStr; // Return as-is if can't parse
    }
  } else {
    return dateStr; // Return as-is if unknown format
  }
  
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if invalid date
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
}

// --- Add this helper function ---
function to24Hour(time12h) {
  if (!time12h) return "";
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM' && hours !== '00') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes}`;
}

export default function ConfirmMatch() {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [userNote, setUserNote] = useState("");
  const [showCounterModal, setShowCounterModal] = useState(false);

  // Check if this is a counter proposal action
  const action = searchParams.get('action');
  const isCounterAction = action === 'counter';

  // Read all details from the URL
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const day = searchParams.get('day');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const location = searchParams.get('location');
  const proposerEmail = searchParams.get('proposerEmail');
  const proposalNote = searchParams.get('note');
  const gameType = searchParams.get('gameType');
  const raceLength = searchParams.get('raceLength');
  const proposalId = searchParams.get('proposalId');

  // Auto-open counter modal if this is a counter action
  useEffect(() => {
    if (isCounterAction) {
      setShowCounterModal(true);
    }
  }, [isCounterAction]);

  const handleConfirm = () => {
    console.log("CONFIRM BUTTON CLICKED");
    const confirmationMessage = `Hi ${from},

Your match is CONFIRMED for ${day}, ${date} at ${time} (${location}).

Game Type: ${gameType || "N/A"}
Race to: ${raceLength || "N/A"}

Confirmed by: ${to}
${proposalNote ? `

Original note from your opponent:
"${proposalNote}"
` : ""}
${userNote ? `

Your reply note:
"${userNote}"
` : ""}

Good luck and have fun!`;

    const params = {
      to_email: proposerEmail,
      to_name: from,
      day,
      date,
      time,
      location,
      message: confirmationMessage,
      confirmed_by: to,
      proposal_note: proposalNote || "",
      confirmation_note: userNote || "",
      gameType: gameType || "",
      raceLength: raceLength || "",
    };

    sendConfirmationEmail(params);

    // Update proposal status to confirmed
    if (proposalId) {
      fetch(`${BACKEND_URL}/api/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
          note: userNote
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to confirm proposal');
        }
        console.log("Proposal confirmed successfully");
        setShowModal(true);
      })
      .catch(error => {
        console.error("Error confirming proposal:", error);
        alert("Failed to confirm proposal: " + error.message);
      });
    } else {
      console.log("No proposalId provided - showing confirmation modal");
      setShowModal(true);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)"
      }}
    >
             <div
         className="draggable-modal"
         style={{
           background: "linear-gradient(120deg, #232323 80%, #2a0909 100%)",
           color: "#fff",
           border: "2px solid #e53e3e",
           borderRadius: window.innerWidth <= 400 ? "0" : "1.2rem",
           boxShadow: "0 0 32px #e53e3e, 0 0 40px rgba(0,0,0,0.85)",
           width: window.innerWidth <= 400 ? "100vw" : "auto",
           maxWidth: window.innerWidth <= 400 ? "100vw" : "480px",
           minWidth: 0,
           margin: window.innerWidth <= 400 ? "0" : "0 auto",
           left: 0,
           right: 0,
           animation: "modalBounceIn 0.5s cubic-bezier(.21,1.02,.73,1.01)",
           padding: "1.5rem 2rem 1rem 2rem",
           position: "relative",
           fontFamily: "inherit",
           boxSizing: "border-box",
           textAlign: "center",
           marginTop: "100px", // Increase top margin to avoid banner
           maxHeight: "85vh", // Limit height to 85% of viewport
           overflowY: "auto" // Add scroll if needed
         }}
       >
                 <div style={{ position: "relative" }}>
           <button
             onClick={() => window.location.href = "/#/dashboard"}
             style={{
               position: "absolute",
               top: "-0.5rem",
               right: "-0.5rem",
               background: "#333",
               color: "#fff",
               border: "1px solid #666",
               borderRadius: "50%",
               width: "2rem",
               height: "2rem",
               fontSize: "1.2rem",
               fontWeight: "bold",
               cursor: "pointer",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               transition: "background 0.2s, border-color 0.2s",
               zIndex: 10
             }}
             onMouseEnter={(e) => {
               e.target.style.background = "#e53e3e";
               e.target.style.borderColor = "#fff";
             }}
             onMouseLeave={(e) => {
               e.target.style.background = "#333";
               e.target.style.borderColor = "#666";
             }}
           >
             ×
           </button>
           <h1 style={{
             marginBottom: "1rem",
             fontSize: "1.4rem",
             fontWeight: "bold",
             letterSpacing: "0.01em",
             color: "#ff0000"
           }}>
             🎱 Front Range Pool League<br />Confirm Match
           </h1>
         </div>
        
                 <p style={{
           marginBottom: "1rem",
           fontSize: "0.95rem",
           color: "#faf6f6",
           textAlign: "center"
         }}>
           You are about to confirm this match. Your opponent will be notified by email and the match will be added to your app calendar!
         </p>

                 <div style={{
           textAlign: "center",
           marginBottom: "0.8rem",
           background: "#1a1a1a",
           color: "#faf6f6",
           borderRadius: 8,
           padding: "0.4rem 0.5rem",
           border: "1px solid #ff0000"
         }}>
                     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="you">🧑</span> <strong>You:</strong> {to || "N/A"}
           </div>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="opponent">🤝</span> <strong>Opponent:</strong> {from || "N/A"}
           </div>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="calendar">📅</span> <strong>Day:</strong> {day || "N/A"}
           </div>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="date">🗓️</span> <strong>Date:</strong> {formatDateMMDDYYYY(date)}
           </div>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="clock">⏰</span> <strong>Time:</strong> {time || "N/A"}
           </div>
           {gameType && (
             <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
               <BilliardBall gameType={gameType} size={16} /> <strong>Game Type:</strong> {gameType}
             </div>
           )}
           {raceLength && (
             <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
               <span role="img" aria-label="race">🏁</span> <strong>Race to:</strong> {raceLength}
             </div>
           )}
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7em", marginBottom: "0.7em", fontSize: "1rem" }}>
             <span role="img" aria-label="location">📍</span> <strong>Location:</strong> {location || "N/A"}
           </div>
        </div>

                 {proposalNote && (
           <div style={{
             margin: "12px 0 0 0",
             padding: "0.6rem 0.8rem",
             background: "#2a2a2a",
             borderLeft: "3px solid #ffb300",
             borderRadius: 4,
             color: "#ffb300",
             fontSize: "0.98rem",
             textAlign: "left"
           }}>
             <span role="img" aria-label="note">📝</span> <strong>Note from opponent:</strong><br />
             {proposalNote}
           </div>
         )}

                 <div style={{ margin: "1rem 0 0.2rem 0", textAlign: "left" }}>
          <label htmlFor="note" style={{
            fontWeight: 500,
            color: "#faf6f6",
            marginBottom: "0.2rem",
            display: "block"
          }}>
            📝 Add a note (optional):
          </label>
                     <textarea
             id="note"
             value={userNote}
             onChange={e => setUserNote(e.target.value)}
             rows={2}
             placeholder="Write a message to your opponent…"
             style={{
               width: "100%",
               minHeight: "54px",
               borderRadius: 7,
               border: "1px solid #666",
               padding: "0.6em 0.8em",
               fontSize: "1rem",
               marginTop: "0.2rem",
               resize: "vertical",
               background: "#1a1a1a",
               color: "#faf6f6",
               boxSizing: "border-box",
               transition: "border 0.2s"
             }}
             onFocus={(e) => e.target.style.border = "1.5px solid #ff0000"}
             onBlur={(e) => e.target.style.border = "1px solid #666"}
           />
        </div>

                 <div style={{ 
           display: "flex", 
           gap: "1rem", 
           justifyContent: "center", 
           marginTop: "1rem",
           flexWrap: "wrap"
         }}>
           <button
             style={{
               background: "#ff0000",
               color: "#fff",
               border: "none",
               borderRadius: 8,
               padding: "0.7rem 1.5rem",
               fontSize: "1.1rem",
               fontWeight: "bold",
               cursor: "pointer",
               minWidth: "120px",
               transition: "background 0.18s, color 0.18s, border 0.18s, box-shadow 0.18s",
               boxShadow: "0 2px 6px #0001"
             }}
             onMouseEnter={(e) => e.target.style.background = "#c90000"}
             onMouseLeave={(e) => e.target.style.background = "#ff0000"}
             onClick={handleConfirm}
           >
             ✅ Confirm Match
           </button>
           
           <button
             style={{
               background: "#fff",
               color: "#ff0000",
               border: "2px solid #ff0000",
               borderRadius: 8,
               padding: "0.7rem 1.5rem",
               fontSize: "1.1rem",
               fontWeight: "bold",
               cursor: "pointer",
               minWidth: "120px",
               transition: "background 0.18s, color 0.18s, border 0.18s, box-shadow 0.18s",
               boxShadow: "0 2px 6px #0001"
             }}
             onMouseEnter={(e) => {
               e.target.style.background = "#ff0000";
               e.target.style.color = "#fff";
             }}
             onMouseLeave={(e) => {
               e.target.style.background = "#fff";
               e.target.style.color = "#ff0000";
             }}
             onClick={() => setShowCounterModal(true)}
           >
             🔄 Counter Propose
           </button>
         </div>
         
                   <div style={{ 
            textAlign: "center", 
            marginTop: "1rem" 
          }}>
            <button
              onClick={() => window.location.href = "/#/dashboard"}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #666",
                borderRadius: 6,
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#444";
                e.target.style.borderColor = "#888";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#333";
                e.target.style.borderColor = "#666";
              }}
            >
              📊 Go to Dashboard
            </button>
          </div>

                 <ConfirmationModal
           open={showModal}
           message="Match confirmed! The opponent has been notified and the match has been added to your app calendar."
           proposalNote={proposalNote}
           confirmationNote={userNote}
           gameType={gameType}
           raceLength={raceLength}
           day={day}
           date={date}
           time={time}
           location={location}
           onClose={() => setShowModal(false)}
         />
         
                   <CounterProposalModal
            open={showCounterModal}
            onClose={() => setShowCounterModal(false)}
            proposal={{
              senderName: from,
              receiverName: to,
              senderEmail: proposerEmail,
              receiverEmail: "", // We don't have this from URL params
              date: date,
              time: time,
              location: location,
              message: proposalNote,
              gameType: gameType,
              raceLength: raceLength,
              _id: proposalId
            }}
            onSubmit={(counterData) => {
              // Handle counter proposal submission
              console.log("Counter proposal submitted:", counterData);
              setShowCounterModal(false);
              // You can add logic here to handle the counter proposal
            }}
            senderPlayer={{
              firstName: to?.split(' ')[0] || '',
              lastName: to?.split(' ').slice(1).join(' ') || '',
              email: "" // We don't have this from URL params
            }}
            phase="scheduled"
            selectedDivision=""
          />
       </div>
     </div>
   );
 }
