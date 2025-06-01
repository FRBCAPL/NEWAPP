import React, { useState, useEffect } from "react";
import styles from "./PlayerModal.module.css";

export default function PlayerAvailabilityModal({
  player,
  onClose,
  onProposeMatch,
}) {
  const [showContact, setShowContact] = useState(false);
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    let interval;
    if (showContact) {
      setTimer(10);
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            setShowContact(false);
            return 10;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showContact]);

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className={styles.playerModalTitle}>
          Opponent: <br /> {player.firstName} {player.lastName}
        </h2>
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>Preferred Locations:</h3>
          <div className={styles.playerModalSectionValue}>
            {player.locations
              ? player.locations
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map((loc, idx, arr) => (
                    <span key={loc + idx}>
                      {loc}
                      {idx < arr.length - 1 && (
                        <span className={styles.locationSeparator}> • </span>
                      )}
                    </span>
                  ))
              : "No locations specified"}
          </div>
        </div>
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>Availability:</h3>
          <div className={styles.playerModalInstruction}>
            Pick a timeblock within a day<br /> to schedule a match with this opponent.
          </div>
          <div className={styles.playerModalGrid}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className={styles.playerModalDay} key={day}>
                <div className={styles.playerModalDayLabel}>{day}</div>
                {(player.availability[day] || []).length === 0 && (
                  <div className={styles.playerModalSlotEmpty}>—</div>
                )}
                {(player.availability[day] || []).map((slot, i) => (
                  <div
                    className={styles.playerModalSlot}
                    key={i}
                    onClick={() => onProposeMatch && onProposeMatch(day, slot)}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>Contact Info</h3>
          {showContact ? (
            <div>
              <div className={styles.playerModalContact}>
                <b>Email:</b> {player.email}
              </div>
              <div className={styles.playerModalContact}>
                <b>Phone:</b> {player.phone}
              </div>
              <div className={styles.playerModalContactTimer}>
                Contact info will hide in {timer} seconds
              </div>
            </div>
          ) : (
          <button
  className={styles.playerModalShowContact}
  onClick={() => setShowContact(true)}
>
  Show {player.firstName}&apos;s contact info
</button>

          )}
        </div>

        {/* --- BUTTONS ADDED HERE --- */}
        <div className={styles.playerModalActions}>
          <button
  className={styles.playerModalBtn}
  onClick={() => window.location.hash = "#/search"}
>
  New Search
</button>
<button
  className={styles.playerModalBtn}
  onClick={() => window.location.hash = "#/dashboard"}
>
  Go to Dashboard
</button>

        </div>
        {/* --- END BUTTONS --- */}

      </div>
    </div>
  );
}
