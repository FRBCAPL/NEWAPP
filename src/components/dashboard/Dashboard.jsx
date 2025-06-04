import React, { useState, useEffect } from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import StandingsModal from "./StandingsModal.jsx";

const STANDINGS_URL = 'https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=75a741e3-5647-41e3-97e5-b2cc00a55489';
// Use Vite env variable at the top level
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

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
  const [showStandings, setShowStandings] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: get a JS Date from match date and time strings
  function getMatchDateTime(match) {
    if (match.date && match.time) {
      return new Date(`${match.date}T${match.time}`);
    }
    return new Date(match.date || 0);
  }

  // Combine first and last name for full DB query
  const fullName = `${playerName} ${playerLastName}`.trim();

  // Fetch matches from backend on mount and when playerName or playerLastName changes
  useEffect(() => {
    if (!playerName) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/matches?player=${encodeURIComponent(fullName)}`)
      .then(res => res.json())
      .then(matches => {
        // Remove matches whose date/time has passed (extra safety)
        const now = new Date();
        const filtered = matches.filter(match => {
          const matchDate = getMatchDateTime(match);
          return matchDate > now;
        });
        // Sort by soonest first
        filtered.sort((a, b) => getMatchDateTime(a) - getMatchDateTime(b));
        setUpcomingMatches(filtered);
        setLoading(false);
      })
      .catch(err => {
        setUpcomingMatches([]);
        setLoading(false);
      });
  }, [playerName, playerLastName]); // Add both as dependencies

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
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className={styles.dashboardList}>
                {upcomingMatches.length === 0 ? (
                  <li>No matches scheduled yet.</li>
                ) : (
                  upcomingMatches.map((match, idx) => (
                    <li key={match._id || idx}>
                      <strong>Opponent:</strong> {match.opponent}<br />
                      <strong>Date:</strong> {match.day}, {match.date}<br />
                      <strong>Time:</strong> {match.time}<br />
                      <strong>Location:</strong> {match.location}<br />
                      {match.gameType && (
                        <>
                          <strong>Game Type:</strong> {match.gameType}<br />
                        </>
                      )}
                      {match.raceLength && (
                        <>
                          <strong>Race to:</strong> {match.raceLength}<br />
                        </>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
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
            <button
              className={styles.dashboardBtn}
              type="button"
              onClick={() => setShowStandings(true)}
            >
              View Standings
            </button>
            <div style={{
              width: "100%",
              maxWidth: 600,
              height: 300,
              margin: "0 auto",
              padding: "5px 16px 0px 16px"
            }}>
              <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
                <PoolSimulation />
              </ResponsiveWrapper>
            </div>
          </div>

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
      <StandingsModal
        open={showStandings}
        onClose={() => setShowStandings(false)}
        standingsUrl={STANDINGS_URL}
      />
    </div>
  );
}
