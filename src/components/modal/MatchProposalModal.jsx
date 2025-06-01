import React, { useState, useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateStartTimes, getNextDayOfWeek } from "../../utils/timeHelpers";
import ConfirmationModal from "./ConfirmationModal";
import { sendProposalEmail } from "../../utils/emailHelpers";
import styles from "./MatchProposalModal.module.css";

// Utility: Format date as MM-DD-YYYY
function formatDateMMDDYYYY(date) {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
}

export default function MatchProposalModal({
  player,
  day,
  slot,
  onClose,
  senderName,
  senderEmail,
  onProposalComplete
}) {
  // --- State declarations ---
  const [time, setTime] = useState(slot);
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gameType, setGameType] = useState("8 Ball");
  const [raceLength, setRaceLength] = useState(7);

  // --- Derived values ---
  const locationOptions = player.locations
    ? player.locations.split(/\r?\n/).map(loc => loc.trim()).filter(Boolean)
    : [];

  const nextDate = getNextDayOfWeek(day);
  const [date, setDate] = useState(nextDate);

  const allSlots = player.availability[day] || [];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDay = dayNames[date.getDay()];

  const possibleStartTimes = useMemo(() => {
    if (!time || !time.includes("-")) return [];
    const [blockStart, blockEnd] = time.split(" - ").map(s => s.trim());
    if (!blockStart || !blockEnd) return [];
    return generateStartTimes(blockStart, blockEnd, 30);
  }, [time]);

  useEffect(() => {
    setStartTime("");
  }, [time]);

  // --- Handlers ---
  const handleSend = () => {
    const proposalMessage =
      message && message.trim().length > 0
        ? message
        : `Hi ${player.firstName} ${player.lastName},\n${senderName} would like to schedule a match with you. `;

    const proposalData = {
      to_email: player.email,
      to_name: `${player.firstName} ${player.lastName}`,
      from_name: senderName,
      from_email: senderEmail,
      day: selectedDay,
      date: date.toISOString().slice(0, 10),
      time: startTime,
      location,
      gameType,
      raceLength,
      note: proposalMessage,
    };

    sendProposalEmail(proposalData)
      .then(async () => {
        setShowConfirmation(true);
      })
      .catch(() => {
        alert("Failed to send proposal email.");
      });
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    if (onProposalComplete) {
      onProposalComplete();
    } else if (onClose) {
      onClose();
    }
  };

  // --- Render ---
  return (
    <div className={styles["match-proposal-overlay"]}>
      <div className={styles["match-proposal-content"]} onClick={e => e.stopPropagation()}>
        <button className={styles["match-proposal-close"]} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2 className={styles["match-proposal-title"]}>Propose a Match</h2>
        <div className={styles["match-proposal-row"]}>
          <b>To Opponent:</b>  <span className={styles.opponentName}>
    {player.firstName} {player.lastName}
  </span>
        </div>
        {/* Centered Day row */}
        <div className={`${styles["match-proposal-row"]} ${styles["match-proposal-day-row"]}`}>
          <b className={styles["match-proposal-day-label"]}>Day:</b>
          <span className={styles["match-proposal-day-value"]}>{selectedDay}</span>
        </div>
        <div className={styles["match-proposal-row"]}>
          <b>Date:</b>
          <div className={styles["match-proposal-date-highlight"]}>
            <DatePicker
              selected={date}
              onChange={setDate}
              minDate={new Date()}
              dateFormat="MMMM d, yyyy"
              popperPlacement="bottom"
              showPopperArrow={false}
              wrapperClassName="custom-datepicker"
              className={styles["match-proposal-date-input"]}
            />
          </div>
        </div>
        <div className={styles["match-proposal-row"]}>
          <b>Time Block:</b>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            className={styles["match-proposal-select"]}
          >
            {allSlots.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {possibleStartTimes.length > 0 && (
          <div className={styles["match-proposal-row"]}>
            <b>Start Time:</b>
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className={styles["match-proposal-select"]}
            >
              <option value="">Select...</option>
              {possibleStartTimes.map((t, i) => (
                <option key={i} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles["match-proposal-row"]}>
          <b>Game Type:</b>
          <select
            value={gameType}
            onChange={e => setGameType(e.target.value)}
            className={styles["match-proposal-select"]}
          >
            <option value="8 Ball">8 Ball</option>
            <option value="9 Ball">9 Ball</option>
            <option value="10 Ball">10 Ball</option>
            <option value="One Pocket">One Pocket</option>
             <option value="Mixed">Mixed ~ Any combination 8/9/10</option>
                    </select>
        </div>

        <div className={styles["match-proposal-row"]}>
          <b>Race Length:</b>
          <select
            value={raceLength}
            onChange={e => setRaceLength(Number(e.target.value))}
            className={styles["match-proposal-select"]}
          >
            {[...Array(13)].map((_, i) => {
  const value = i + 3;
  return (
    <option key={value} value={value}>
      {value}
    </option>
  );
})}

          </select>
        </div>

        <div className={styles["match-proposal-row"]}>
          <b>Location:</b>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={`${styles["match-proposal-select"]} ${styles["match-proposal-location-select"]}`}
          >
            <option value="">Select...</option>
            {locationOptions.map((loc, idx) => (
              <option key={idx} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className={styles["match-proposal-row"]}>
          <b>Message to Opponent:</b>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write a message to your opponent…"
            rows={3}
            className={styles["match-proposal-textarea"]}
          />
        </div>

        <button
          disabled={!startTime || !location}
          onClick={handleSend}
          className={styles["match-proposal-send-btn"]}
        >
          Send Proposal
        </button>
        <ConfirmationModal
          open={showConfirmation}
          message="Your match proposal has been sent! The opponent will receive an email with all the details."
          gameType={gameType}
          raceLength={raceLength}
          day={selectedDay}
          date={formatDateMMDDYYYY(date)}
          time={startTime}
          location={location}
          onClose={handleConfirmationClose}
        />
      </div>
    </div>
  );
}
