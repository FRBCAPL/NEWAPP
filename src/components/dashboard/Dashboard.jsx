import React from "react";
import styles from './dashboard.module.css';
import PoolSimulation from "../PoolSimulation.jsx";
import ResponsiveWrapper from "../ResponsiveWrapper";
import DivisionSelector from "./DivisionSelector";
import ChallengeStatsDisplay from './ChallengeStatsDisplay';
import UpcomingMatches from "./UpcomingMatches";
import NewsUpdatesSection from "./NewsUpdatesSection";
import CountersRow from "./CountersRow";
import ModalsManager from "./ModalsManager";
import useDashboardState from "./useDashboardState";

const STANDINGS_URLS = {
  "FRBCAPL TEST": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=b345a437-3415-4765-b19a-b2f7014f2cfa",
  "Singles Test": "https://lms.fargorate.com/PublicReport/LeagueReports?leagueId=e05896bb-b0f4-4a80-bf99-b2ca012ceaaa&divisionId=9058a0cc-3231-4118-bd91-b305006fe578"
};

export default function Dashboard(props) {
  const dashboard = useDashboardState(props);
  return (
    <div className={styles.dashboardBg} style={{ position: 'relative' }}>
      <div className={styles.dashboardFrame} style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div className={styles.dashboardCard} style={{ position: 'relative', zIndex: 1 }}>
          <h1 className={styles.dashboardTitle}>
            Welcome,
            <span className={styles.dashboardUserName}>
              {props.playerName} {props.playerLastName}
            </span>
          </h1>
          <div className={styles.announcement}>
            <p>This is the BETA version. </p>Matches that are created, scheduled, and confirmed will NOT be played.<br />
            This is for testing purposes only.
          </div>
          <br />
          <DivisionSelector
            divisions={dashboard.divisions}
            selectedDivision={dashboard.selectedDivision}
            setSelectedDivision={dashboard.setSelectedDivision}
            effectivePhase={dashboard.effectivePhase}
          />
          <ChallengeStatsDisplay 
            playerName={`${props.playerName} ${props.playerLastName}`}
            division={dashboard.selectedDivision}
            phase={dashboard.effectivePhase}
          />
          <UpcomingMatches
            id="upcoming-matches-section"
            pendingCount={dashboard.pendingCount}
            sentCount={dashboard.sentCount}
            setShowProposalListModal={dashboard.setShowProposalListModal}
            setShowSentProposalListModal={dashboard.setShowSentProposalListModal}
            showAllMatches={dashboard.showAllMatches}
            filteredUpcomingMatches={dashboard.filteredUpcomingMatches}
            fullName={dashboard.fullName}
            formatDateMMDDYYYY={() => {}}
            handleProposalClick={dashboard.handleProposalClick}
            completingMatchId={dashboard.completingMatchId}
            setWinnerModalMatch={dashboard.setWinnerModalMatch}
            setWinnerModalPlayers={dashboard.setWinnerModalPlayers}
            setWinnerModalOpen={dashboard.setWinnerModalOpen}
            effectivePhase={dashboard.effectivePhase}
            totalCompleted={dashboard.totalCompleted}
            matchesToScheduleCount={dashboard.matchesToSchedule ? dashboard.matchesToSchedule.length : 0}
            setShowCompletedModal={dashboard.setShowCompletedModal}
            handleScheduleMatch={dashboard.handleScheduleMatch}
          />
          <NewsUpdatesSection
            id="news-updates-section"
            notes={dashboard.notes}
            loadingNotes={dashboard.loadingNotes}
            userPin={props.userPin}
            onShowChat={() => dashboard.setShowChatModal(true)}
            onShowStandings={() => dashboard.setShowStandings(true)}
            onDeleteNote={dashboard.handleDeleteNote}
            onClearNotes={dashboard.handleClearNotes}
          />
        <button
          className={styles.dashboardTutorialBtn}
          onClick={() => dashboard.setShowTutorialModal(true)}
          type="button"
        >
          Tutorial
        </button>
        <button
          className={styles.dashboardLogoutBtn}
            onClick={props.onLogout}
          type="button"
        >
          Logout
        </button>
          {props.userPin === "777777" && (
          <>
            <button
              className={styles.dashboardAdminBtn}
                onClick={() => dashboard.setShowNoteModal(true)}
              type="button"
            >
              Add Note
            </button>
            <button
              className={styles.dashboardAdminBtn}
                onClick={props.onGoToAdmin}
              type="button"
            >
              Admin
            </button>
              <button
                className={styles.dashboardAdminBtn}
                onClick={() => dashboard.setPhaseOverride(dashboard.phaseOverride === "challenge" ? "scheduled" : "challenge")}
                type="button"
              >
                {dashboard.phaseOverride === "challenge" ? "Switch to Phase 1 (Scheduled)" : "Switch to Phase 2 (Challenge)"}
              </button>
              {dashboard.phaseOverride && (
                <button
                  className={styles.dashboardAdminBtn}
                  onClick={() => dashboard.setPhaseOverride(null)}
                  type="button"
                  style={{ background: "#888" }}
                >
                  Clear Phase Override
                </button>
              )}
    </>
  )}
        </div>
      </div>
      <ModalsManager
        {...dashboard}
        standingsUrl={STANDINGS_URLS[dashboard.selectedDivision]}
        styles={styles}
        userPin={props.userPin}
        senderEmail={props.senderEmail}
        fullName={dashboard.fullName}
        onCloseProposalListModal={dashboard.onCloseProposalListModal}
        onCloseSentProposalListModal={dashboard.onCloseSentProposalListModal}
        onSelectPendingProposal={dashboard.onSelectPendingProposal}
        onSelectSentProposal={dashboard.onSelectSentProposal}
        onCloseOpponents={dashboard.onCloseOpponents}
        onClosePlayerSearch={dashboard.onClosePlayerSearch}
        onCloseAdminPlayerSearch={dashboard.onCloseAdminPlayerSearch}
        onClosePlayerAvailability={dashboard.onClosePlayerAvailability}
        onCloseProposalModal={dashboard.onCloseProposalModal}
        onCloseStandings={dashboard.onCloseStandings}
        onCloseMatchDetails={dashboard.onCloseMatchDetails}
        onCloseCounterProposal={dashboard.onCloseCounterProposal}
        onCloseProposalDetails={dashboard.onCloseProposalDetails}
        onCloseEditProposal={dashboard.onCloseEditProposal}
        onCloseWinnerModal={dashboard.onCloseWinnerModal}
        onCloseChatModal={dashboard.onCloseChatModal}
        onCloseCompletedModal={dashboard.onCloseCompletedModal}
    />
  </div>
);
}
