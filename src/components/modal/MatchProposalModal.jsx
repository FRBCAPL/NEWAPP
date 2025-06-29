import React, { useState, useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateStartTimes, getNextDayOfWeek } from "../../utils/timeHelpers";
import ConfirmationModal from "./ConfirmationModal";
import { sendProposalEmail } from "../../utils/emailHelpers";
import DraggableModal from "./DraggableModal";

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

// Utility: Format date as YYYY-MM-DD (local timezone, not UTC)
function formatDateYYYYMMDD(date) {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
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

  // --- State declarations ---
  const [time, setTime] = useState(slot);
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gameType, setGameType] = useState("8 Ball");
  const [raceLength, setRaceLength] = useState(phase === "scheduled" || phase === "challenge" ? 5 : 7);

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
      !startTime ||
      !location ||
      !date
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Create the proposal data
    const proposalData = {
      senderEmail,
      senderName,
      receiverEmail: player.email,
      receiverName: player.name,
      date: formatDateYYYYMMDD(date),
      time: startTime,
      location,
      message,
      gameType,
      raceLength,
      phase,
      divisions: [selectedDivision]
    };

    // Send the proposal
    fetch(`${BACKEND_URL}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }

        // Create chat channel
        createMatchChannel({
          senderEmail,
          senderName,
          receiverEmail: player.email,
          receiverName: player.name,
          matchName: `${senderName} vs ${player.name} - ${formatDateMMDDYYYY(date)}`
        });

        // Send email notification
        sendProposalEmail({
          to: player.email,
          toName: player.name,
          fromName: senderName,
          date: formatDateMMDDYYYY(date),
          time: startTime,
          location,
          message,
          gameType,
          raceLength
        });

        // Show confirmation
        setShowConfirmation(true);
      })
      .catch((err) => {
        console.error("Failed to send proposal:", err);
        alert("Failed to send proposal: " + err.message);
      });
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
    if (onProposalComplete) {
      onProposalComplete();
    }
  };

  return (
    <>
      <DraggableModal
        open={true}
        onClose={onClose}
        title={`🎱 Propose Match to ${player.name}`}
        maxWidth="500px"
      >
        <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Day:
            </label>
            <span style={{ color: "#fff", fontSize: "1.1rem" }}>{selectedDay}</span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Date:
            </label>
            <DatePicker
              selected={date}
              onChange={setDate}
              minDate={new Date()}
              dateFormat="MM/dd/yyyy"
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Time Block:
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%"
              }}
            >
              <option value="">Select time block</option>
              {allSlots.map((slot, index) => (
                <option key={index} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {time && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
                Start Time:
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  padding: "8px",
                  width: "100%"
                }}
              >
                <option value="">Select start time</option>
                {possibleStartTimes.map((time, index) => (
                  <option key={index} value={time}>{time}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Location:
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%"
              }}
            >
              <option value="">Select location</option>
              {locationOptions.map((loc, index) => (
                <option key={index} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Game Type:
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%"
              }}
            >
              <option value="8 Ball">8 Ball</option>
              <option value="9 Ball">9 Ball</option>
              <option value="10 Ball">10 Ball</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Race to:
            </label>
            <select
              value={raceLength}
              onChange={(e) => setRaceLength(Number(e.target.value))}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%"
              }}
            >
              {(() => {
                // For phases 1 and 2, only allow race to 5
                if (phase === "scheduled" || phase === "challenge") {
                  return <option value={5}>5</option>;
                }
                // For other phases, allow the full range (3-15)
                return [...Array(13)].map((_, i) => {
                  const value = i + 3;
                  return (
                    <option key={value} value={value}>{value}</option>
                  );
                });
              })()}
            </select>
          </div>

          {(phase === "scheduled" || phase === "challenge") && (
            <div style={{ 
              color: "#ffc107", 
              fontSize: "0.9em", 
              marginBottom: "1em",
              fontStyle: "italic",
              textAlign: "center"
            }}>
              ⚠️ Race to 5 is required for {phase === "scheduled" ? "Scheduled Match" : "Challenge"} Phase
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
              Message (optional):
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your opponent..."
              rows={3}
              style={{
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "8px",
                width: "100%",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={handleSend}
            disabled={!startTime || !location}
            style={{
              background: "#e53e3e",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.7rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              minWidth: "120px",
              opacity: (!startTime || !location) ? 0.5 : 1
            }}
          >
            Send Proposal
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.7rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              minWidth: "120px"
            }}
          >
            Cancel
          </button>
        </div>
      </DraggableModal>

      {showConfirmation && (
        <ConfirmationModal
          open={showConfirmation}
          onClose={handleConfirmationClose}
          title="✅ Proposal Sent!"
          message={`Your match proposal has been sent to ${player.name}. They will receive an email notification and can respond through the app.`}
        />
      )}
    </>
  );
}
