// src/components/modal/CounterProposalModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "../ConfirmMatch.module.css";

export default function CounterProposalModal({ proposal, open, onClose, onSubmit }) {
  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  // Sync fields when modal opens or proposal changes
  useEffect(() => {
    if (open && proposal) {
      setDate(proposal.date || "");
      setTime(proposal.time || "");
      setLocation(proposal.location || "");
      setNote("");
    }
  }, [open, proposal]);

  if (!open || !proposal) return null;

  // Modal JSX to be rendered in portal
  const modal = (
    <div className={styles.counterProposalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: 420, margin: "auto" }}>
        <h2>Counter-Propose Match</h2>
        <div className={styles.detailRow}>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.detailRow}>
          <label>Time:</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
          />
        </div>
        <div className={styles.detailRow}>
          <label>Location:</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />
        </div>
        <div className={styles.detailRow}>
          <label>Note (optional):</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Add a note or reason for the counter-proposal"
            className={styles.noteTextarea}
          />
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 18,
          justifyContent: "center"
        }}>
          <button
            className={styles.confirmBtn}
            onClick={() => onSubmit({ date, time, location, note })}
            disabled={!date || !time || !location}
          >
            Send Counter-Proposal
          </button>
          <button
            className={styles.confirmBtn}
            style={{ background: "#aaa" }}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
