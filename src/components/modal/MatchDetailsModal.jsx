import React from "react";
import styles from "../dashboard/dashboard.module.css";
import EightBall from '../../assets/8ball.svg';
import NineBall from '../../assets/nineball.svg';
import TenBall from '../../assets/tenball.svg';


export default function MatchDetailsModal({ open, onClose, match }) {
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
      <div className={styles.modalContentSnazzy} onClick={e => e.stopPropagation()}>
        <button className={styles.modalCloseBtnSnazzy} onClick={onClose} aria-label="Close">&times;</button>
        <div className={styles.modalHeaderSnazzy}>
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
