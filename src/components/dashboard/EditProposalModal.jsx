import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './dashboard.module.css';
import BilliardBall from '../BilliardBall';
import DraggableModal from '../modal/DraggableModal';

// Utility function to format date as YYYY-MM-DD
function formatDateYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// Helper functions for time handling
function normalizeTimeString(timeStr) {
  if (!timeStr) return null;
  const normalized = timeStr.trim().toUpperCase();
  if (normalized.includes('AM') || normalized.includes('PM')) {
    return normalized;
  }
  return null;
}

function generateStartTimes(startTime, endTime, intervalMinutes = 30) {
  const times = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour || 
    (currentHour === endHour && currentMinute <= endMinute)
  ) {
    const timeStr = `${currentHour}:${String(currentMinute).padStart(2, '0')}`;
    times.push(timeStr);
    
    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return times;
}

export default function EditProposalModal({ proposal, open, onClose, onSave, selectedDivision, phase }) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [gameType, setGameType] = useState("");
  const [raceLength, setRaceLength] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize form with proposal data when modal opens
  useEffect(() => {
    if (proposal && open) {
      if (proposal.date) {
        // Parse YYYY-MM-DD format
        const [year, month, day] = proposal.date.split('-');
        setDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }
      setTime(proposal.time || "");
      setLocation(proposal.location || "");
      setMessage(proposal.message || "");
      setGameType(proposal.gameType || "");
      setRaceLength(proposal.raceLength || "");
    }
  }, [proposal, open]);

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
    <DraggableModal
      open={open}
      onClose={onClose}
      title="✏️ Edit Proposal"
      maxWidth="500px"
    >
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
          <input
            type="date"
            value={formatDateYYYYMMDD(date)}
            onChange={(e) => {
              const [year, month, day] = e.target.value.split('-');
              setDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
            }}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 8px',
              marginLeft: '8px'
            }}
          />
        </div>

        <div className={styles.modalDetailRowSnazzy}>
          <strong style={{color: '#e53e3e', minWidth: '120px'}}>Time Block:</strong> 
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 8px',
              marginLeft: '8px'
            }}
          >
            <option value="">Select time block</option>
            <option value="6:00 PM - 8:00 PM">6:00 PM - 8:00 PM</option>
            <option value="8:00 PM - 10:00 PM">8:00 PM - 10:00 PM</option>
            <option value="10:00 PM - 12:00 AM">10:00 PM - 12:00 AM</option>
          </select>
        </div>

        {time && (
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Start Time:</strong> 
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                background: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                padding: '4px 8px',
                marginLeft: '8px'
              }}
            >
              <option value="">Select start time</option>
              {possibleStartTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.modalDetailRowSnazzy}>
          <strong style={{color: '#e53e3e', minWidth: '120px'}}>Location:</strong> 
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location"
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 8px',
              marginLeft: '8px',
              width: '200px'
            }}
          />
        </div>

        <div className={styles.modalDetailRowSnazzy}>
          <strong style={{color: '#e53e3e', minWidth: '120px'}}>Game Type:</strong> 
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 8px',
              marginLeft: '8px'
            }}
          >
            <option value="">Select game type</option>
            <option value="8 Ball">8 Ball</option>
            <option value="9 Ball">9 Ball</option>
            <option value="10 Ball">10 Ball</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        <div className={styles.modalDetailRowSnazzy}>
          <strong style={{color: '#e53e3e', minWidth: '120px'}}>Race to:</strong> 
          <select
            value={raceLength}
            onChange={(e) => setRaceLength(e.target.value)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 8px',
              marginLeft: '8px'
            }}
          >
            <option value="">Select race length</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="7">7</option>
            <option value="9">9</option>
          </select>
        </div>

        <div className={styles.modalDetailRowSnazzy}>
          <strong style={{color: '#e53e3e', minWidth: '120px'}}>Message:</strong> 
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message to opponent"
            rows={3}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '8px',
              marginLeft: '8px',
              width: '250px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <button 
          className={styles.dashboardBtn} 
          onClick={handleSave}
          disabled={loading}
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
    </DraggableModal>
  );

  return ReactDOM.createPortal(modalContent, document.body);
} 