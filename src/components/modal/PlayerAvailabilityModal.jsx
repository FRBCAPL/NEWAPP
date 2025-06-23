import React, { useState, useEffect, useRef } from "react";
import styles from "./PlayerModal.module.css";

/**
 * PlayerAvailabilityModal - Shows a player's locations, availability, and contact info.
 * @param {object} player - The player object (firstName, lastName, locations, availability, email, phone, text, preferredContacts)
 * @param {function} onClose - Callback to close the modal
 * @param {function} onProposeMatch - Callback(day, slot, phase) when a time slot is picked
 * @param {string} phase - The selected phase ("phase1" or "phase2")
 */
export default function PlayerAvailabilityModal({
  player,
  onClose,
  senderEmail,
  onProposeMatch,
    selectedDivision,
  phase,
}) {
  if (!player) return null;
  const [showContact, setShowContact] = useState(false);
  const [timer, setTimer] = useState(10);

  // --- Draggable logic ---
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
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
  }, [dragging]);
  // --- End draggable logic ---

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

  // Flexible matcher for preferred contact types
  const prefers = (type) =>
    Array.isArray(player.preferredContacts) &&
    player.preferredContacts.some((method) => method.includes(type));

  // Capitalize each word in a string
  function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose} // <-- Close modal when clicking background
      role="presentation"
    >
      <div
        className={styles.modalContent}
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          cursor: dragging ? "grabbing" : "default",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent overlay click from closing if inside modal
        role="dialog"
        aria-modal="true"
        aria-label={`Availability for ${player.firstName} ${player.lastName}`}
      >
        {/* Header as drag handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            userSelect: "none",
            marginBottom: "1em",
            position: "relative",
          }}
          onMouseDown={onMouseDown}
        >
          <h2
            className={styles.playerModalTitle}
            style={{ margin: 0, flex: 1 }}
          >
            Player: <br /> {player.firstName} {player.lastName}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            type="button"
            style={{ position: "absolute", right: 0, top: 0 }}
          >
            &times;
          </button>
        </div>
<span style={{ fontSize: 14, color: "#888", marginLeft: 8 }}>
  {phase === "scheduled" ? "Phase 1 (Scheduled)" : phase === "challenge" ? "Phase 2 (challenge)" : phase}
</span>

        {/* Preferred Locations */}
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>
            Preferred Locations:
          </h3>
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

        {/* Availability Grid */}
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>Availability:</h3>
          <div className={styles.playerModalInstruction}>
            Pick a timeblock within a day
            <br /> to schedule a match with this opponent.
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
                    onClick={() => {
  onProposeMatch && onProposeMatch(day, slot, phase, selectedDivision);
}}

                    tabIndex={0}
                    role="button"
                    aria-label={`Propose match on ${day} at ${slot}`}
                    onKeyPress={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    onProposeMatch && onProposeMatch(day, slot, phase, selectedDivision);
  }
}}

                  >
                    {slot}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className={styles.playerModalSection}>
          <h3 className={styles.playerModalSectionTitle}>Contact Info</h3>
          {showContact ? (
            <div>
              {/* Preferred Contact Methods: only show after expanding */}
              <div className={styles.playerModalContactPref}>
                <b>Preferred Contact Methods:</b>{" "}
                {Array.isArray(player.preferredContacts) &&
                player.preferredContacts.length > 0
                  ? player.preferredContacts
                      .map((method) => capitalizeWords(method.trim()))
                      .join(" • ")
                  : "No preference specified"}
              </div>
              {prefers("email") && player.email && (
                <div className={styles.playerModalContact}>
                  <b>Email:</b> {player.email}
                </div>
              )}
              {(prefers("phone") || prefers("call")) && player.phone && (
                <div className={styles.playerModalContact}>
                  <b>Phone:</b> {player.phone}
                </div>
              )}
              {prefers("text") && player.text && (
                <div className={styles.playerModalContact}>
                  <b>Text:</b> {player.text}
                </div>
              )}
              {/* Fallback: If no preferredContacts or none matched, show all available */}
              {(!Array.isArray(player.preferredContacts) ||
                player.preferredContacts.length === 0 ||
                (!prefers("email") &&
                  !prefers("phone") &&
                  !prefers("call") &&
                  !prefers("text"))) && (
                <>
                  {player.email && (
                    <div className={styles.playerModalContact}>
                      <b>Email:</b> {player.email}
                    </div>
                  )}
                  {player.phone && (
                    <div className={styles.playerModalContact}>
                      <b>Phone:</b> {player.phone}
                    </div>
                  )}
                  {player.text && (
                    <div className={styles.playerModalContact}>
                      <b>Text:</b> {player.text}
                    </div>
                  )}
                  <div className={styles.playerModalContact}>
                    No preferred contact methods specified.
                  </div>
                </>
              )}
              <div className={styles.playerModalContactTimer}>
                Contact info will hide in {timer} seconds
              </div>
            </div>
          ) : (
            <button
              className={styles.playerModalShowContact}
              onClick={() => setShowContact(true)}
              type="button"
            >
              Show {player.firstName}&apos;s contact info
            </button>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.playerModalActions}>
          <button
            className={styles.playerModalBtn}
            onClick={() => {
              window.location.hash = "#/search";
              onClose();
            }}
            type="button"
          >
            New Search
          </button>
          <button
            className={styles.playerModalBtn}
            onClick={() => {
              window.location.hash = "#/dashboard";
              onClose();
            }}
            type="button"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
