import React, { useState, useEffect, useRef } from "react";
import styles from "../dashboard/dashboard.module.css";
import EightBall from '../../assets/8ball.svg';
import NineBall from '../../assets/nineball.svg';
import TenBall from '../../assets/tenball.svg';

export default function MatchDetailsModal({ open, onClose, match }) {
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

  if (!open || !match) return null;

  // Format date/time
  const [month, day, year] = match.date.split("-");
  const timeStr = match.time.length === 4
    ? match.time.slice(0,2) + ":" + match.time.slice(2)
    : match.time;
  const dateObj = new Date(`${year}-${month}-${day}T${timeStr}`);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

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
              <span className={styles.modalOpponentName}>{match.player}</span>
              <span className={styles.modalVs}>vs</span>
              <span className={styles.modalOpponentName}>{match.opponent}</span>
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
      </div>
    </div>
  );
}

function renderGameTypeIcon(gameType) {
  // ...same as before...
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
