import React from "react";

export default function Dashboard({
  playerName,
  onOpenChat,
  onScheduleMatch,
  userPin,
  onGoToAdmin,
  onLogout
}) {
  return (
    <div className="dashboard-card">
      <h1>Welcome{playerName ? `, ${playerName}` : ""}!</h1>
      <section>
        <h2>Upcoming Matches</h2>
        <ul>
          <li>No matches scheduled yet.</li>
        </ul>
      </section>
      <div className="dashboard-actions">
        <button onClick={onScheduleMatch}>Schedule a Match</button>
        <button onClick={onOpenChat}>Open Chat</button>
        {userPin === "777777" && (
          <button className="dashboard-admin-btn" onClick={onGoToAdmin}>
            Go to Admin Dashboard
          </button>
        )}
        <button
          className="dashboard-logout-btn"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
      <section>
        <h2>League News</h2>
        <ul>
          <li>Stay tuned for updates!</li>
        </ul>
      </section>
    </div>
  );
}
