import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { generateStartTimes, getNextDayOfWeek } from "../../utils/timeHelpers";
import styles from './dashboard.module.css';
import BilliardBall from '../BilliardBall';

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

export default function EditProposalModal({ proposal, open, onClose, onSave, selectedDivision, phase }) {
  const [time, setTime] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [gameType, setGameType] = useState("8 Ball");
  const [raceLength, setRaceLength] = useState(7);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form with proposal data when modal opens
  useEffect(() => {
    if (open && proposal) {
      // Parse the date from the proposal
      let proposalDate = new Date();
      if (proposal.date) {
        // Handle YYYY-MM-DD format
        if (proposal.date.includes('-')) {
          const [year, month, day] = proposal.date.split('-');
          proposalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }

      setDate(proposalDate);
      setTime(proposal.time || "");
      setStartTime(proposal.time || "");
      setLocation(proposal.location || "");
      
      // Check if the existing message is the generic scheduling message
      const existingMessage = proposal.message || proposal.note || "";
      const isGenericMessage = existingMessage.includes("would like to schedule a match with you");
      
      if (isGenericMessage || !existingMessage) {
        setMessage(`Hi ${proposal.receiverName},\nI would like to edit the proposal for our match.`);
      } else {
        setMessage(existingMessage);
      }
      
      setGameType(proposal.gameType || "8 Ball");
      setRaceLength(proposal.raceLength || (phase === "scheduled" || phase === "challenge" ? 5 : 7));
      setError("");
    }
  }, [open, proposal, phase]);

  // Get day name from date
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDay = dayNames[date.getDay()];

  // Generate possible start times based on selected time block
  const possibleStartTimes = React.useMemo(() => {
    if (!time || !time.includes("-")) return [];
    let [blockStart, blockEnd] = time.split(" - ").map(s => normalizeTimeString(s.trim()));
    if (!blockStart || !blockEnd) return [];
    return generateStartTimes(blockStart, blockEnd, 30);
  }, [time]);

  useEffect(() => {
    setStartTime("");
  }, [time]);

  const handleSave = async () => {
    if (!startTime || !location) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/proposals/${proposal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDateYYYYMMDD(date),
          time: startTime,
          location,
          message,
          gameType,
          raceLength,
          phase,
          divisions: [selectedDivision]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update proposal");
      }

      // Call the onSave callback with updated proposal
      if (onSave) {
        onSave({
          ...proposal,
          date: formatDateYYYYMMDD(date),
          time: startTime,
          location,
          message,
          gameType,
          raceLength
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || "Failed to update proposal");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !proposal) return null;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.proposalModalContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 500,
          margin: 'auto',
          padding: '2rem 1.5rem 1.5rem 1.5rem'
        }}
      >
        <h1 className={styles.proposalModalTitle}>
          <span style={{color: '#e53e3e'}}>✏️ Edit Proposal</span>
        </h1>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            color: '#dc3545',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{textAlign: 'left', marginBottom: '1.5rem'}}>
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>To:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{proposal.receiverName}</span>
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Day:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{selectedDay}</span>
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Date:</strong> 
            <div style={{marginLeft: '8px'}}>
              <DatePicker
                selected={date}
                onChange={setDate}
                minDate={new Date()}
                dateFormat="MM/dd/yyyy"
                className={styles.dashboardBtn}
                style={{
                  background: '#232323',
                  color: '#fff',
                  border: '1px solid #e53e3e',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Time:</strong> 
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={{
                background: '#232323',
                color: '#fff',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.5rem',
                marginLeft: '8px',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Select time...</option>
              {possibleStartTimes.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Location:</strong> 
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Enter location"
              style={{
                background: '#232323',
                color: '#fff',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.5rem',
                marginLeft: '8px',
                fontSize: '0.9rem',
                width: '200px'
              }}
            />
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Game Type:</strong> 
            <select
              value={gameType}
              onChange={e => setGameType(e.target.value)}
              style={{
                background: '#232323',
                color: '#fff',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.5rem',
                marginLeft: '8px',
                fontSize: '0.9rem'
              }}
            >
              <option value="8 Ball">8 Ball</option>
              <option value="9 Ball">9 Ball</option>
              <option value="10 Ball">10 Ball</option>
              <option value="One Pocket">One Pocket</option>
              <option value="Mixed">Mixed ~ Any combination 8/9/10</option>
            </select>
          </div>

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Race to:</strong> 
            <select
              value={raceLength}
              onChange={e => setRaceLength(Number(e.target.value))}
              style={{
                background: '#232323',
                color: '#fff',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.5rem',
                marginLeft: '8px',
                fontSize: '0.9rem'
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

          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Message:</strong> 
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Update your message about the proposal changes..."
              rows={3}
              style={{
                background: '#232323',
                color: '#fff',
                border: '1px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.5rem',
                marginLeft: '8px',
                fontSize: '0.9rem',
                width: '100%',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button 
            className={styles.dashboardBtn} 
            onClick={handleSave}
            disabled={loading || !startTime || !location}
            style={{ 
              background: '#28a745', 
              color: '#fff',
              minWidth: '120px'
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className={styles.dashboardBtn} 
            onClick={onClose}
            disabled={loading}
            style={{ 
              background: '#6c757d', 
              color: '#fff',
              minWidth: '120px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
} 