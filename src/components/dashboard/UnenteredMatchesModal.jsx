import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function UnenteredMatchesModal({ open, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/admin/unentered-matches`)
      .then(res => res.json())
      .then(data => {
        setMatches(data);
        setLoading(false);
      });
  }, [open]);

  const markAsEntered = (id) => {
    fetch(`${BACKEND_URL}/admin/mark-lms-entered/${id}`, { method: "PATCH" })
      .then(res => res.json())
      .then(() => setMatches(matches.filter(match => match._id !== id)));
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.85)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#111",
        borderRadius: 12,
        maxWidth: 520,
        width: "95%",
        padding: "32px 24px 24px 24px",
        boxShadow: "0 2px 32px rgba(0,0,0,0.7)",
        border: "2px solid #c00",
        color: "#fff",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 18,
            background: "#c00",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            fontWeight: "bold",
            fontSize: 20,
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          title="Close"
        >×</button>
        <h2 style={{
          color: "#c00",
          marginBottom: 18,
          borderBottom: "1.5px solid #c00",
          paddingBottom: 8
        }}>
          Confirmed Challenge Matches Needing LMS Entry
        </h2>
        {loading ? (
          <div style={{ color: "#fff" }}>Loading unentered matches...</div>
        ) : matches.length === 0 ? (
          <div style={{ color: "#fff" }}>All matches are entered!</div>
        ) : (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {matches.map(m => (
              <li key={m._id} style={{
                marginBottom: 12,
                background: "#222",
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeft: "4px solid #c00"
              }}>
                <span>
                  <span style={{ color: "#fff" }}>
                    <b>{m.date}</b> — <span style={{ color: "#c00" }}>{m.senderName}</span> vs <span style={{ color: "#c00" }}>{m.receiverName}</span>
                    {m.location && <span style={{ color: "#fff" }}> @ {m.location}</span>}
                  </span>
                </span>
                <button
                  style={{
                    marginLeft: 16,
                    background: "#c00",
                    color: "#fff",
                    border: "none",
                    borderRadius: 5,
                    padding: "7px 14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "1em",
                    transition: "background 0.2s"
                  }}
                  onClick={() => markAsEntered(m._id)}
                >
                  Mark as Entered
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
