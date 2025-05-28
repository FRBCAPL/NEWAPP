import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmationModal from "./ConfirmationModal";
import { sendConfirmationEmail } from '../utils/emailHelpers';
import BilliardBall from "./BilliardBall"; // Adjust path if needed

export default function ConfirmMatch() {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [userNote, setUserNote] = useState(""); // Note from confirmer

  // Read all details from the URL
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const day = searchParams.get('day');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const location = searchParams.get('location');
  const proposerEmail = searchParams.get('proposerEmail');
  const proposalNote = searchParams.get('note'); // Original note from proposer
  const gameType = searchParams.get('gameType');
  const raceLength = searchParams.get('raceLength');

  // This function is called when the user clicks "Confirm Match"
  const handleConfirm = () => {
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

    sendConfirmationEmail(params)
      .then(() => setShowModal(true))
      .catch((err) => {
        alert("Failed to send confirmation email.");
        console.error(err);
      });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #232526 0%, #181818 100%)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#212121",
        borderRadius: "1.5rem",
        boxShadow: "0 0 32px #ff0000, 0 0 32px rgba(0,0,0,0.7)",
        padding: "2.5rem 2rem",
        border: "2.5px solid #ff0000",
        textAlign: "center",
        minWidth: 340,
        maxWidth: 420,
        animation: "fadeIn 0.7s"
      }}>
        <h1 style={{
          color: "#ff0000",
          marginBottom: "1.2rem",
          letterSpacing: 1.5,
          fontSize: "2.1rem"
        }}>
          🎱 Front Range <br />Pool League <br />Confirm Match
        </h1>
        <p style={{
          color: "#ffb300",
          margin: "1rem 0 1.5rem 0",
          fontStyle: "italic",
          fontSize: "1.08rem"
        }}>
          You are about to confirm this match. <br />
          Your opponent will be notified by email!
        </p>

        <div style={{
          textAlign: "left",
          margin: "0 auto 24px auto",
          maxWidth: 340,
          background: "#282828",
          borderRadius: 10,
          padding: "1.2rem 1.2rem 0.7rem 1.2rem",
          boxShadow: "0 0 12px #ff000033"
        }}>

          <div style={{ marginBottom: 10, fontSize: "1.07rem" }}>
            <span role="img" aria-label="you">🧑</span> <strong>You:</strong> {to || "N/A"}
          </div>
          <div style={{ marginBottom: 10, fontSize: "1.07rem" }}>
            <span role="img" aria-label="opponent">🤝</span> <strong>Opponent:</strong> {from || "N/A"}
          </div>

          <div style={{ marginBottom: 10 }}>
            <span role="img" aria-label="calendar">📅</span> <strong>Day:</strong> {day || "N/A"}
          </div>
          <div style={{ marginBottom: 10 }}>
            <span role="img" aria-label="date">🗓️</span> <strong>Date:</strong> {date || "N/A"}
          </div>
          <div style={{ marginBottom: 10 }}>
            <span role="img" aria-label="clock">⏰</span> <strong>Time:</strong> {time || "N/A"}
          </div>

          {gameType && (
            <div style={{ marginBottom: 10 }}>
              <span role="img" aria-label="game"></span>  <BilliardBall gameType={gameType} size={16} /> <strong>Game Type:</strong> {gameType}
            </div>
          )}

          {raceLength && (
            <div style={{ marginBottom: 10 }}>
              <span role="img" aria-label="race">🏁</span> <strong>Race to:</strong> {raceLength}
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <span role="img" aria-label="location">📍</span> <strong>Location:</strong> {location || "N/A"}
          </div>
        </div>

        {/* Moved opponent's note below match details */}
        {proposalNote && (
          <div style={{
            margin: "1rem 0 0.5rem 0",
            background: "#191919",
            borderLeft: "3px solid #ff0000",
            borderRadius: 6,
            padding: "0.7rem 0.9rem",
            fontStyle: "italic",
            color: "#ffb300",
            fontSize: "1.02rem",
            textAlign: "left"
          }}>
            <span role="img" aria-label="note">📝</span> <strong>Note from opponent:</strong><br />
            {proposalNote}
          </div>
        )}

        {/* Note input section for confirmer */}
        <div style={{
          margin: "1.5rem auto 0.5rem auto",
          maxWidth: 340,
          textAlign: "left"
        }}>
          <label htmlFor="note" style={{ fontWeight: "bold", color: "#ffb300" }}>
            📝 Add a note (optional):
          </label>
          <textarea
            id="note"
            value={userNote}
            onChange={e => setUserNote(e.target.value)}
            rows={3}
            placeholder="Write a message to your opponent…"
            style={{
              width: "100%",
              marginTop: 8,
              borderRadius: 6,
              border: "1px solid #ff0000",
              background: "#181818",
              color: "#fff",
              fontSize: "1rem",
              padding: "0.6rem",
              resize: "vertical"
            }}
          />
        </div>

        <button
          style={{
            background: "linear-gradient(90deg, #ff0000 60%, #ff6a00 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.8rem 1.8rem",
            fontWeight: "bold",
            fontSize: "1.15rem",
            marginTop: 8,
            boxShadow: "0 2px 12px #ff000066",
            cursor: "pointer",
            transition: "transform 0.1s",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          onClick={handleConfirm}
        >
          ✅ Confirm Match
        </button>

        <ConfirmationModal
          open={showModal}
          message="Match confirmed! The opponent has been notified."
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

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
