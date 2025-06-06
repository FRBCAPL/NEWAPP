import React from "react";

export default function ProposalListModal({ proposals, onSelect, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Pending Match Proposals"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          maxWidth: 420,
          width: "90%",
          padding: "2rem",
          boxShadow: "0 6px 32px #0004",
          position: "relative"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Pending Match Proposals</h2>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#888",
            cursor: "pointer"
          }}
          aria-label="Close proposals list"
        >
          ×
        </button>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {proposals.map(proposal => (
            <li key={proposal._id} style={{ marginBottom: "1rem" }}>
              <button
                onClick={() => onSelect(proposal)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "#f8f9fa",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: "1rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s"
                }}
              >
                <div><b>From:</b> {proposal.sender}</div>
                <div><b>Date:</b> {proposal.date} <b>Time:</b> {proposal.time}</div>
                <div><b>Location:</b> {proposal.location}</div>
              </button>
            </li>
          ))}
        </ul>
        {proposals.length === 0 && <div>No pending proposals.</div>}
      </div>
    </div>
  );
}
