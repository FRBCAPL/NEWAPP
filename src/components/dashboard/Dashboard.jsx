import React from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";
// import PoolSimulation3D from "../PoolSimulation3D.jsx"; // Only import if used
import ResponsiveWrapper from "../ResponsiveWrapper";

export default function Dashboard({
  playerName,
  playerLastName,
  onOpenChat,
  userPin,
  onGoToAdmin,
  onLogout,
  onScheduleMatch,
  senderEmail,
}) {
  return (
    <div className={styles.dashboardBg}>
      <div className={styles.dashboardFrame}>
        <div className={styles.dashboardCard}>
          <h1 className={styles.dashboardTitle}>
            Welcome,
            <span className={styles.dashboardUserName}>
              {playerName} {playerLastName}
            </span>
          </h1>

          {/* Upcoming Matches Section */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
            <h2 className={styles.dashboardSectionTitle}>Upcoming Matches</h2>
            <ul className={styles.dashboardList}>
              <li>No matches scheduled yet.</li>
            </ul>
          </section>

          {/* Actions and Simulation */}
          <div className={styles.dashboardActions}>
            <button
              className={styles.dashboardBtn}
              onClick={onScheduleMatch}
              type="button"
            >
              Schedule a Match
            </button>
            <button
              className={styles.dashboardBtn}
              onClick={onOpenChat}
              type="button"
            >
              Open Chat
            </button>
            
            <div style={{
              width: "100%",
              maxWidth: 600,
              height: 300,
              margin: "0 auto",
              padding: 16
            }}>
              <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
                <PoolSimulation />
              </ResponsiveWrapper>
            </div>
          </div> {/* <-- This was missing! */}

          {/* League News Section */}
          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
            <h2 className={styles.dashboardSectionTitle}> News & Updates</h2>
            <ul className={styles.dashboardList}>
              <li>Stay tuned for updates!</li>
            </ul>
            
          </section>
<button
              className={styles.dashboardLogoutBtn}
              onClick={onLogout}
              type="button"
            >
              Logout
            </button>
          {/* Admin Button (only for admin pin) */}
          {userPin === "777777" && (
            <button
              className={styles.dashboardAdminBtn}
              onClick={onGoToAdmin}
              type="button"
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
