import React, { useState, useMemo, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateStartTimes, getNextDayOfWeek } from "../../utils/timeHelpers";
import ConfirmationModal from "./ConfirmationModal";
import { sendProposalEmail } from "../../utils/emailHelpers";
import styles from "./MatchProposalModal.module.css";

// --- ADD: Stream Chat import and constants ---
import { StreamChat } from "stream-chat";
const streamApiKey = import.meta.env.VITE_STREAM_API_KEY;
const adminUserId = "frbcaplgmailcom"; // your admin Stream user id

// Utility: Format date as MM-DD-YYYY
function formatDateMMDDYYYY(date) {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
}

// Normalize time strings like "12pm", "12:00pm", "12:00 pm", "12PM", etc. to "12:00 PM"
function normalizeTimeString(time) {
  let t = time.trim().replace(/\s+/g, '').toLowerCase();
  const match = t.match(/^(\d{1,2})(:\d{2})?(am|pm)$/);
  if (match) {
    const h = match[1];
    const m = match[2] ? match[2] : ":00";
    const ap = match[3].toUpperCase();
    return `${h}${m} ${ap}`;
  }
  const spaced = time.trim().match(/^(\d{1,2})(:\d{2})?\s?(am|pm)$/i);
  if (spaced) {
    const h = spaced[1];
    const m = spaced[2] ? spaced[2] : ":00";
    const ap = spaced[3].toUpperCase();
    return `${h}${m} ${ap}`;
  }
  return time.trim();
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// --- ADD: Utility to sanitize user IDs for Stream Chat ---
function toStreamUserId(email) {
  return email.replace(/[^a-zA-Z0-9]/g, "");
}

// --- ADD: Function to create the channel ---
async function createMatchChannel({ senderEmail, senderName, receiverEmail, receiverName, matchName }) {
  try {
    const client = StreamChat.getInstance(streamApiKey);

    // Get token for the sender (from your backend)
    const res = await fetch(`${BACKEND_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: toStreamUserId(senderEmail) }),
    });
    const { token } = await res.json();
    if (!token) throw new Error("Could not get chat token");

    // Connect the sender if not already connected
    if (!client.userID) {
      await client.connectUser(
        { id: toStreamUserId(senderEmail), name: senderName },
        token
      );
    }

    // REMOVE DUPLICATES FROM MEMBERS
    const members = Array.from(new Set([
      toStreamUserId(senderEmail),
      toStreamUserId(receiverEmail),
      adminUserId
    ]));

    // Create the channel with both players and the admin as members
    const channel = client.channel('messaging', {
      members,
      name: matchName,
    });

    await channel.create();

    // Optionally, send a welcome message
    await channel.sendMessage({
      text: `Chat created for your match proposal!`
    });
  } catch (err) {
    console.error("Failed to create chat channel:", err);
    alert("Failed to create chat channel: " + err.message);
  }
}

export default function MatchProposalModal({
  player,
  day,
  slot,
  onClose,
  senderName,
  senderEmail,
  onProposalComplete,
  selectedDivision,
  phase
}) {
  console.log("MatchProposalModal phase prop:", phase);
  // --- Draggable logic ---
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    // Only left mouse button
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = {
      x: e.clientX - drag.x,
      y: e.clientY - drag.y,
    };
    document.body.style.userSelect = "none";
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setDrag({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };
  const onMouseUp = () => {
    setDragging(false);
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging]);
  // --- End draggable logic ---

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
    let [blockStart, blockEnd] = time.split(" - ").map(s => normalizeTimeString(s.trim()));
    if (!blockStart || !blockEnd) return [];
    return generateStartTimes(blockStart, blockEnd, 30);
  }, [time]);

  useEffect(() => {
    setStartTime("");
  }, [time]);

  // --- Handlers ---
  const handleSend = () => {
    // Defensive: Check for missing required fields
    if (
      !senderEmail ||
      !player.email ||
      !senderName ||
      !player.firstName ||
      !player.lastName ||
      !date ||
      !location ||
      !phase
    ) {
      alert("Missing required fields. Please check all selections and try again.\n\n" +
        `sender: ${senderEmail}\n` +
        `receiver: ${player.email}\n` +
        `senderName: ${senderName}\n` +
        `receiverName: ${player.firstName} ${player.lastName}\n` +
        `date: ${date}\n` +
        `location: ${location}\n` +
        `phase: ${phase}\n`
      );
      return;
    }

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

    // 1. Send the email as before
    sendProposalEmail(proposalData)
      .then(() => setShowConfirmation(true))
      .catch(() => {
        alert("Failed to send proposal email.");
      });

    // 2. ALSO save the proposal to your backend for dashboard tracking
    fetch(`${BACKEND_URL}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: senderEmail,
        receiver: player.email,
        senderName: senderName,
        receiverName: `${player.firstName} ${player.lastName}`,
        date: date.toISOString().slice(0, 10),
        time: startTime,
        location,
        message: proposalMessage,
        gameType,
        raceLength,
        phase,
        divisions: [selectedDivision]
      }),
    })
      .then(res => res.json().then(async data => {
        if (!res.ok) {
          console.error("Backend returned error:", data);
          alert(data.error || "Failed to save proposal to backend.");
        } else {
          // Create Stream Chat channel for both players and admin
          await createMatchChannel({
            senderEmail: senderEmail,
            senderName: senderName,
            receiverEmail: player.email,
            receiverName: `${player.firstName} ${player.lastName}`,
            matchName: `Match: ${senderName} vs ${player.firstName} ${player.lastName}`
          });
        }
      }))
      .catch((err) => {
        console.error("Failed to save proposal to backend:", err);
        alert("Failed to save proposal to backend.");
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
      <div
        className={styles["match-proposal-content"]}
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          cursor: dragging ? "grabbing" : "default",
          position: "relative" // Needed for absolute close button
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Propose a Match"
      >
        {/* Close button OUTSIDE header, absolutely positioned */}
        <button
          className={styles["match-proposal-close"]}
          onClick={onClose}
          aria-label="Close"
          type="button"
          style={{
            position: "absolute",
            right: "1.2rem",
            top: "1.2rem",
            zIndex: 10,
            fontSize: "2em",
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            lineHeight: 1,
            padding: 0
          }}
        >
          &times;
        </button>

        {/* Header as drag handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            userSelect: "none",
            marginBottom: "1em",
            position: "relative"
          }}
          onMouseDown={onMouseDown}
        >
          <h2 className={styles["match-proposal-title"]} style={{ margin: 0, flex: 1, textAlign: "center" }}>
            Propose a Match -BETA
          </h2>
        </div>
        {/* Phase and Division display */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1em" }}>
          <div
            style={{
              margin: "0.5em 0 0.5em 0",
              padding: "0.5em 1em",
              background: phase === "challenge" ? "#e53935" : "#222",
              color: "#fff",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "1.1em",
              letterSpacing: "0.5px",
              display: "inline-block"
            }}
          >
            {phase === "challenge" ? "Challenge Phase" : "Scheduled Match Phase"}
          </div>
          {selectedDivision && (
            <div
              style={{
                color: "#fff",
                background: "#222",
                borderRadius: "6px",
                padding: "0.25em 1em",
                marginLeft: "1em",
                display: "inline-block"
              }}
            >
              Division: <b>{selectedDivision}</b>
            </div>
          )}
        </div>
        {phase === "challenge" && (
          <div style={{ color: "#fff", fontSize: "0.95em", marginBottom: "1em" }}>
            <em>
              Challenge matches have special rules. You can challenge up to 4 spots above, and match/defense limits apply.
            </em>
          </div>
        )}

        {/* --- Modal Content --- */}
        <div className={styles["match-proposal-row"]}>
          <b>To Opponent:</b>
          <span className={styles.opponentName}>
            {player.firstName} {player.lastName}
          </span>
        </div>
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
              aria-label="Select match date"
            />
          </div>
        </div>
        <div className={styles["match-proposal-row"]}>
          <b>Time Block:</b>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            className={styles["match-proposal-select"]}
            aria-label="Select time block"
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
              aria-label="Select start time"
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
            aria-label="Select game type"
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
            aria-label="Select race length"
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
            aria-label="Select location"
          >
            <option value="">Select...</option>
            {locationOptions.map((loc, idx) => (
              <option key={idx} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div className={styles["match-proposal-row"]}>
          <b>Message to Opponent: This is a BETA test match</b>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write a message to your opponent…"
            rows={3}
            className={styles["match-proposal-textarea"]}
            aria-label="Message to opponent"
          />
        </div>

        <button
          disabled={!startTime || !location}
          onClick={handleSend}
          className={styles["match-proposal-send-btn"]}
          type="button"
        >
          Send Proposal
        </button>
        <ConfirmationModal
          open={showConfirmation}
          message="Your match proposal has been sent! The opponent will receive an email with all the details."
          division={selectedDivision}
          phase={phase}
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
