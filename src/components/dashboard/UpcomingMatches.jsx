import React from "react";
import styles from "./dashboard.module.css";
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import LoadingButton from "../LoadingSpinner";

export default function UpcomingMatches({
  pendingCount,
  sentCount,
  setShowProposalListModal,
  setShowSentProposalListModal,
  showAllMatches,
  filteredUpcomingMatches,
  fullName,
  formatDateMMDDYYYY,
  handleProposalClick,
  completingMatchId,
  setWinnerModalMatch,
  setWinnerModalPlayers,
  setWinnerModalOpen,
  effectivePhase,
  totalCompleted,
  matchesToScheduleCount,
  setShowCompletedModal,
  handleScheduleMatch
}) {
  return (
    <section className={`${styles.dashboardSection} ${styles.dashboardSectionBox} ${styles.matchesSection}`}
      style={{
        position: "relative",
        overflow: "visible",
        backgroundColor: "rgba(0,0,0,0.7)",
        minHeight: "370px",
        marginBottom: '36px',
        paddingBottom: '20px',
      }}
    >
      {/* Proposal Buttons - Above Pool Table */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className={styles.proposalAlertRow}>
          <button
            className={styles.proposalAlertButton}
            onClick={() => setShowProposalListModal(true)}
            aria-label="View pending match proposals"
          >
            📥  {pendingCount} proposals waiting for you
          </button>
          <button
            className={styles.proposalAlertButton}
            onClick={() => setShowSentProposalListModal(true)}
            aria-label="View matches you have proposed"
          >
            📤 {sentCount} proposals waiting for opponent
          </button>
        </div>
      </div>

      {/* Header/helper text in black area above table */}
      <div style={{ textAlign: 'center', margin: '2px 0 2px 0' }}>
        <h2 className={styles.dashboardSectionTitle} style={{ margin: 0, fontWeight: 600 }}>Upcoming Confirmed Matches</h2>
        <div className={styles.dashboardHelperText} style={{ margin: 0, marginBottom: 6 }}>Click Match For Details</div>
      </div>

      {/* PoolSimulation as background and matches list overlayed on table */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className={styles.poolTableContainer} style={{ marginBottom: '12px' }}>
          <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
            <PoolSimulation />
          </ResponsiveWrapper>
          <div className={styles.matchesOverlayBox} style={{ minWidth: '400px', flexShrink: 0 }}>
            <ul className={styles.dashboardList} style={{ minHeight: 'auto', margin: 0, pointerEvents: 'auto', padding: 0 }}>
              {(showAllMatches ? filteredUpcomingMatches : filteredUpcomingMatches.slice(0, 3)).length === 0 ? (
                <li className={styles.noMatchesText} style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)' }}>No matches scheduled yet.</li>
              ) : (
                <>
                  {(showAllMatches ? filteredUpcomingMatches : filteredUpcomingMatches.slice(0, 3)).map((match, idx) => {
                    let opponent = '';
                    let formattedDate = '';
                    if (match.type === 'scheduled') {
                      if (match.player1 && match.player2) {
                        if (match.player1.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                          opponent = match.player2;
                        } else {
                          opponent = match.player1;
                        }
                      }
                      if (match.date) {
                        const parts = match.date.split('/');
                        if (parts.length === 3) {
                          const [month, day, year] = parts;
                          const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = formatDateMMDDYYYY(match.date);
                          } else {
                            formattedDate = '[Invalid Date]';
                          }
                        } else {
                          formattedDate = '[Invalid Date]';
                        }
                      } else {
                        formattedDate = '[No Date]';
                      }
                    } else {
                      if (match.senderName && match.receiverName) {
                        if (match.senderName.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                          opponent = match.receiverName;
                        } else {
                          opponent = match.senderName;
                        }
                      }
                      if (match.date) {
                        const parts = match.date.split('-');
                        if (parts.length === 3) {
                          const [year, month, day] = parts;
                          const dateObj = new Date(`${year}-${month}-${day}`);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = formatDateMMDDYYYY(match.date);
                          } else {
                            formattedDate = '[Invalid Date]';
                          }
                        } else {
                          formattedDate = '[Invalid Date]';
                        }
                      } else {
                        formattedDate = '[No Date]';
                      }
                    }
                    const actuallyCompleted = !!match.completed;
                    console.log('match.completed:', match.completed, 'actuallyCompleted:', actuallyCompleted);
                    return (
                      <li key={match._id || idx} className={styles.matchCard} style={{
                        padding: '0.2rem 0.5rem',
                        marginBottom: 0,
                        minHeight: 0,
                        height: 'auto',
                        border: '2px solid red',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: '400px',
                        width: '400px',
                        flexShrink: 0,
                        margin: '0 auto'
                      }}>
                        <div className={styles.matchCardContentWrapper} style={{width: '100%', minHeight: 0, height: 'auto', margin: 0, padding: 0, display: 'flex', alignItems: 'center'}}>
                          <button
                            className={styles.matchCardButton}
                            onClick={() => handleProposalClick(match)}
                            type="button"
                            style={{padding: 0, margin: 0, minHeight: 0, height: 'auto', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', justifyContent: 'flex-start', textAlign: 'left', boxSizing: 'border-box'}}
                          >
                            <span className={styles.matchCardOpponentLabel} style={{fontSize: '0.95em', marginRight: 2, minHeight: 0, height: 'auto', padding: 0}}>VS</span>
                            <span className={styles.matchCardOpponentName} style={{fontSize: '1.25em', marginRight: 8, fontWeight: 700, minHeight: 0, height: 'auto', padding: 0}}>{opponent || '[Unknown]'}</span>
                          </button>
                          <div style={{width: '100%', textAlign: 'center', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: 0, height: 'auto', padding: 0}}>
                            <span className={styles.matchCardDetail} style={{fontSize: '0.92em', marginRight: 10, minHeight: 0, height: 'auto', padding: 0}}>{formattedDate}</span>
                            <span className={styles.matchCardDetail} style={{fontSize: '1.08em', minHeight: 0, height: 'auto', padding: 0}}>{match.location || ''}</span>
                          </div>
                          <button
                            className={styles.dashboardBtn + ' ' + styles.matchCardDoneBtn}
                            style={{marginLeft: 0, minWidth: 70, padding: '4px 8px', fontSize: '0.75em', height: 28, lineHeight: '20px', marginTop: 6, opacity: 0.7, transition: 'opacity 0.22s, filter 0.22s, background 0.22s', minHeight: 0}}
                            onClick={() => {
                              let player1 = '';
                              let player2 = '';
                              if (match.type === 'scheduled') {
                                if (match.player1 && match.player2) {
                                  if (match.player1.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                                    player1 = match.player1;
                                    player2 = match.player2;
                                  } else {
                                    player1 = match.player2;
                                    player2 = match.player1;
                                  }
                                }
                              } else {
                                if (match.senderName && match.receiverName) {
                                  if (match.senderName.trim().toLowerCase() === fullName.trim().toLowerCase()) {
                                    player1 = match.senderName;
                                    player2 = match.receiverName;
                                  } else {
                                    player1 = match.receiverName;
                                    player2 = match.senderName;
                                  }
                                }
                              }
                              setWinnerModalMatch(match);
                              setWinnerModalPlayers({ player1, player2 });
                              setWinnerModalOpen(true);
                            }}
                            type="button"
                          >
                            Complete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
      {/* Tooltip/helper text above counters */}
      <div style={{ textAlign: 'center', marginBottom: 8, color: '#aaa', fontSize: '0.98em' }}>
        <br /> Click to view or schedule matches.
      </div>
      <div className={styles.countersRow} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '5px 0 0 0',
        width: '100%',
        paddingBottom: '12px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          marginBottom: '12px',
        }}>
          <button
            style={{
              background: '#23232a',
              color: '#28a745',
              borderRadius: 6,
              padding: '4px 10px',
              fontWeight: 600,
              fontSize: '0.92em',
              zIndex: 9999,
              position: 'relative',
              textAlign: 'center',
              border: '2px solid #28a745',
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              margin: '0 4px'
            }}
            onClick={() => setShowCompletedModal(true)}
            title="Click to view completed matches"
            type="button"
          >
            {effectivePhase === "challenge" ? "Phase 2" : effectivePhase === "scheduled" ? "Phase 1" : effectivePhase} Matches Completed: {totalCompleted}
          </button>
          <button
            style={{
              background: '#23232a',
              color: '#e53e3e',
              borderRadius: 6,
              padding: '4px 10px',
              fontWeight: 600,
              fontSize: '0.92em',
              zIndex: 9999,
              position: 'relative',
              textAlign: 'center',
              border: '2px solid #e53e3e',
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              margin: '0 4px'
            }}
            title="Schedule a match"
            type="button"
            onClick={() => handleScheduleMatch()}
          >
            {effectivePhase === "challenge" ? "Phase 2" : effectivePhase === "scheduled" ? "Phase 1" : effectivePhase} Matches To Schedule: {matchesToScheduleCount}
          </button>
        </div>
      </div>
    </section>
  );
} 