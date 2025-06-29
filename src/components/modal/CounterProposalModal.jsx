// src/components/modal/CounterProposalModal.jsx
import React, { useState, useEffect } from "react";
import DraggableModal from "./DraggableModal";

export default function CounterProposalModal({ proposal, open, onClose, onSubmit }) {
  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  // Sync fields when modal opens or proposal changes
  useEffect(() => {
    if (proposal && open) {
      setDate(proposal.date || "");
      setTime(proposal.time || "");
      setLocation(proposal.location || "");
      setNote("");
    }
  }, [proposal, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !time || !location) {
      alert("Please fill in all required fields.");
      return;
    }
    onSubmit({ date, time, location, note });
  };

  if (!open || !proposal) return null;

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title="🔄 Counter Proposal"
      maxWidth="450px"
    >
      <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
            Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px"
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
            Time:
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px"
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
            Location:
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Enter location"
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#e53e3e", fontWeight: "bold" }}>
            Note (optional):
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note explaining your counter proposal..."
            rows={3}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: "4px",
              resize: "vertical"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="submit"
            style={{
              background: "#e53e3e",
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
            Submit Counter
          </button>
          <button
            type="button"
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
      </form>
    </DraggableModal>
  );
}
