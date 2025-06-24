import React, { useState, useEffect, useRef } from "react";
import styles from './MatchDetailsModal.module.css';

import EightBall from '../../assets/8ball.svg';
import NineBall from '../../assets/nineball.svg';
import TenBall from '../../assets/tenball.svg';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function MatchDetailsModal({ open, onClose, match, onCompleted }) {
  // --- DRAGGABLE LOGIC ---
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
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
  // --- END DRAGGABLE LOGIC ---

  // --- Mark as Completed Logic ---
  const [loading, setLoading] = useState(false);

  const handleMarkCompleted = async () => {
    if (!match || !match._id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/matches/completed/${match._id}`,
        { method: "PATCH" }
      );
      if (res.ok) {
        if (onCompleted) onCompleted(match._id);
        onClose();
      } else {
        alert("Failed to mark as completed.");
      }
    } catch (err) {
      alert("Network error.");
    }
    setLoading(false);
  };

  if (!open || !match) return null;

  // --- Robust Date/Time Parsing for YYYY-MM-DD and "h:mm AM/PM" ---
  let dateObj = new Date();
  let formattedDate = '';
  let formattedTime = '';
  if (match.date && match.time) {
    // Parse date as YYYY-MM-DD
    const [year, month, day] = match.date.split("-");
    const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    // Parse time as "h:mm AM/PM"
    let timeStr = match.time.trim().toUpperCase();
    let [timePart, ampm] = timeStr.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = (minute || 0).toString().padStart(2, '0');
    const time24 = `${hourStr}:${minuteStr}`;
    dateObj = new Date(`${isoDate}T${time24}:00`);
    formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    formattedTime = dateObj.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContentSnazzy}
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          cursor: dragging ? "grabbing" : "default",
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Match Details"
        tabIndex={-1}
      >
        <button className={styles.modalCloseBtnSnazzy} onClick={onClose} aria-label="Close">&times;</button>
        {/* Header is the drag handle */}
        <div
          className={styles.modalHeaderSnazzy}
          onMouseDown={onMouseDown}
          style={{ cursor: "grab", userSelect: "none" }}
        >
          <span className={styles.modalAccentBar}></span>
          <h2 className={styles.modalTitleSnazzy}>🎱 Match Details</h2>
        </div>
        <div className={styles.modalDetailsSnazzy}>
          <div className={styles.modalDetailRowSnazzy}>
            <span className={styles.modalDetailIcon}>🤝</span>
            <span className={styles.modalDetailLabelSnazzy}>Players:</span>
            <span className={styles.modalDetailValueSnazzy}>
              <span className={styles.modalOpponentName}>{match.player || match.senderName}</span>
              <span className={styles.modalVs}>vs</span>
              <span className={styles.modalOpponentName}>{match.opponent || match.receiverName}</span>
            </span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <span className={styles.modalDetailIcon}>📅</span>
            <span className={styles.modalDetailLabelSnazzy}>Date:</span>
            <span className={styles.modalDetailValueSnazzy}>{formattedDate}</span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <span className={styles.modalDetailIcon}>⏰</span>
            <span className={styles.modalDetailLabelSnazzy}>Time:</span>
            <span className={styles.modalDetailValueSnazzy}>{formattedTime}</span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <span className={styles.modalDetailIcon}>📍</span>
            <span className={styles.modalDetailLabelSnazzy}>Location:</span>
            <span className={styles.modalDetailValueSnazzy}>{match.location}</span>
          </div>
          {match.gameType && (
            <div className={styles.modalDetailRowSnazzy}>
              {renderGameTypeIcon(match.gameType)}
              <span className={styles.modalDetailLabelSnazzy}>Game Type:</span>
              <span className={styles.modalDetailValueSnazzy}>{match.gameType}</span>
            </div>
          )}
          {match.raceLength && (
            <div className={styles.modalDetailRowSnazzy}>
              <span className={styles.modalDetailIcon}>🏁</span>
              <span className={styles.modalDetailLabelSnazzy}>Race to:</span>
              <span className={styles.modalDetailValueSnazzy}>{match.raceLength}</span>
            </div>
          )}
        </div>
        {!match.counterProposal?.completed && (
          <button
            className={styles.modalActionBtn}
            onClick={handleMarkCompleted}
            disabled={loading}
            style={{ marginTop: 16, minWidth: 180 }}
            type="button"
          >
            {loading ? "Marking..." : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  );
}

function renderGameTypeIcon(gameType) {
  if (!gameType) return <span className={styles.modalDetailIcon}>🎯</span>;
  const type = gameType.trim().toLowerCase();
  if (type === "8 ball" || type === "8-ball" || type === "8ball")
    return <img src={EightBall} alt="8 Ball" className={styles.gameTypeIcon} />;
  if (type === "9 ball" || type === "9-ball" || type === "9ball")
    return <img src={NineBall} alt="9 Ball" className={styles.gameTypeIcon} />;
  if (type === "10 ball" || type === "10-ball" || type === "10ball")
    return <img src={TenBall} alt="10 Ball" className={styles.gameTypeIcon} />;
  if (type === "mixed" || type === "mixed games")
    return (
      <>
        <img src={EightBall} alt="8 Ball" className={styles.gameTypeIcon} />
        <img src={NineBall} alt="9 Ball" className={styles.gameTypeIcon} />
        <img src={TenBall} alt="10 Ball" className={styles.gameTypeIcon} />
      </>
    );
  return <span className={styles.modalDetailIcon}>🎯</span>;
}
