import React from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";

export default function Dashboard({
  playerName,
   playerLastName,
  onOpenChat,
  userPin,
  onGoToAdmin,
  onLogout,
  onScheduleMatch,    // <-- make sure this prop is received!
  senderEmail,
}) {
  return (
    <div className={styles.dashboardBg}>
      <div className={styles.dashboardFrame}>
        <div className={styles.dashboardCard}>
          <h1 className={styles.dashboardTitle}>
            Welcome,
            <div className={styles.dashboardUserName}>
              {playerName} {playerLastName}
            </div>
          </h1>

          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
  <h2 className={styles.dashboardSectionTitle}>Upcoming Matches</h2>
  <ul className={styles.dashboardList}>
    <li>No matches scheduled yet.</li>
  </ul>
</section>
<div className={styles.dashboardActions}>
  <button className={styles.dashboardBtn} onClick={onScheduleMatch}>
    Schedule a Match
  </button>
  <button className={styles.dashboardBtn} onClick={onOpenChat}>
    Open Chat
  </button>
  <button
              className={styles.dashboardLogoutBtn}
              onClick={onLogout}
            >
              
              Logout
            </button>
 
  <div className={styles.dashboardSimulationBox}>
    <PoolSimulation />
  </div>
</div>


          <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox}`}>
  <h2 className={styles.dashboardSectionTitle}>League News</h2>
  <ul className={styles.dashboardList}>
    <li>Stay tuned for updates!</li>
  </ul>
</section>   {userPin === "777777" && (
    <button className={styles.dashboardAdminBtn} onClick={onGoToAdmin}>
      Admin
    </button>
  )}
        </div>
      </div>
    </div>
  );
}
