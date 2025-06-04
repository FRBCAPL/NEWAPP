import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfirmationModal from "./modal/ConfirmationModal"; // <-- FIXED
import { sendConfirmationEmail } from '../utils/emailHelpers';
import BilliardBall from "./BilliardBall";

import styles from "./ConfirmMatch.module.css";
// import MatchProposalModal from "./MatchProposalModal"; // <-- REMOVE THIS LINE
import Highlight from "./Highlight";



export default function ConfirmMatch() {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [userNote, setUserNote] = useState("");

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

fetch('https://atlasbackend-bnng.onrender.com/api/matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    opponent: from,
    player: to,
    day,
    date,
    time,
    location,
    gameType,
    raceLength
  })
})
.then(() => setShowModal(true))
.catch(err => {
  alert("Failed to save match to server.");
  console.error(err);
});


  };

  return (
    <div className={styles.confirmMatchBg}>
      <div className={styles.confirmMatchCard}>
        <h1 className={styles.confirmMatchTitle}>
          🎱 Front Range <br />Pool League <br />Confirm Match
        </h1>
        <p className={styles.confirmMatchNotice}>
          You are about to confirm this match. <br />
          Your opponent will be notified by email!
        </p>

        <div className={styles.confirmMatchDetails}>
          <div className={styles.detailRow}>
            <span role="img" aria-label="you">🧑</span> <strong>You:</strong> {to || "N/A"}
          </div>
          <div className={styles.detailRow}>
            <span role="img" aria-label="opponent">🤝</span> <strong>Opponent:</strong> {from || "N/A"}
          </div>
          <div className={styles.detailRow}>
            <span role="img" aria-label="calendar">📅</span> <strong>Day:</strong> {day || "N/A"}
          </div>
          <div className={styles.detailRow}>
            <span role="img" aria-label="date">🗓️</span> <strong>Date:</strong> {date || "N/A"}
          </div>
          <div className={styles.detailRow}>
            <span role="img" aria-label="clock">⏰</span> <strong>Time:</strong> {time || "N/A"}
          </div>
          {gameType && (
            <div className={styles.detailRow}>
              <BilliardBall gameType={gameType} size={16} /> <strong>Game Type:</strong> {gameType}
            </div>
          )}
          {raceLength && (
            <div className={styles.detailRow}>
              <span role="img" aria-label="race">🏁</span> <strong>Race to:</strong> {raceLength}
            </div>
          )}
          <div className={styles.detailRow}>
            <span role="img" aria-label="location">📍</span> <strong>Location:</strong> {location || "N/A"}
          </div>
        </div>

        {proposalNote && (
          <div className={styles.proposalNote}>
            <span role="img" aria-label="note">📝</span> <strong>Note from opponent:</strong><br />
            {proposalNote}
          </div>
        )}

        <div className={styles.noteSection}>
          <label htmlFor="note" className={styles.noteLabel}>
            📝 Add a note (optional):
          </label>
          <textarea
            id="note"
            value={userNote}
            onChange={e => setUserNote(e.target.value)}
            rows={3}
            placeholder="Write a message to your opponent…"
            className={styles.noteTextarea}
          />
        </div>

        <button
          className={styles.confirmBtn}
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
    </div>
  );
}
