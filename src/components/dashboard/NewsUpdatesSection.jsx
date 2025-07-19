import React from "react";
import styles from "./dashboard.module.css";
import { SkeletonLoader } from "../LoadingSpinner";

export default function NewsUpdatesSection({
  notes,
  loadingNotes,
  userPin,
  onShowChat,
  onShowStandings,
  onDeleteNote,
  onClearNotes
}) {
  return (
    <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className={styles.newsUpdatesHeader}>
        <button
          className={styles.dashboardBtn}
          onClick={onShowChat}
          type="button"
          style={{ position: 'relative' }}
        >
          💬 Open Chat
        </button>
        <h2 className={styles.dashboardSectionTitle}>
          News & Updates
        </h2>
        <button
          className={styles.dashboardBtn}
          type="button"
          onClick={onShowStandings}
        >
          📊 View Standings
        </button>
      </div>
      {loadingNotes ? (
        <SkeletonLoader lines={3} height="16px" />
      ) : (
        <ul className={styles.dashboardList}>
          {notes.length === 0 ? (
            <li className={styles.dashboardNoteItem}>No news yet.</li>
          ) : (
            notes.map((note, idx) => (
              <li
                key={note._id || idx}
                className={styles.dashboardNoteItem}
              >
                <span style={{ flex: 1 }}>{note.text}</span>
                {userPin === "777777" && (
                  <button
                    onClick={() => onDeleteNote(note._id)}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "2px 8px",
                      cursor: "pointer",
                      fontSize: "0.95em"
                    }}
                    aria-label="Delete note"
                    title="Delete note"
                    type="button"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      )}
      {userPin === "777777" && notes.length > 0 && (
        <button
          style={{
            marginTop: 10,
            background: "#444",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            padding: "4px 14px",
            cursor: "pointer",
            fontSize: "0.98em"
          }}
          onClick={onClearNotes}
          type="button"
        >
          Clear All Notes
        </button>
      )}
    </section>
  );
} 