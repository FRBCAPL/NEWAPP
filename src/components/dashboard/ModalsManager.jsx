import React from "react";
import ProposalListModal from './ProposalListModal';
import MatchDetailsModal from '../modal/MatchDetailsModal';
import PlayerSearch from "../modal/PlayerSearch";
import PlayerAvailabilityModal from "../modal/PlayerAvailabilityModal";
import MatchProposalModal from "../modal/MatchProposalModal";
import StandingsModal from "./StandingsModal";
import ConfirmMatchDetails from '../ConfirmMatchDetails';
import CounterProposalModal from '../modal/CounterProposalModal';
import ProposalDetailsModal from './ProposalDetailsModal';
import EditProposalModal from './EditProposalModal';
import OpponentsModal from "../modal/OpponentsModal";
import WinnerSelectModal from '../modal/WinnerSelectModal';
import DirectMessagingModal from '../DirectMessagingModal';
import DraggableModal from '../modal/DraggableModal';

export default function ModalsManager(props) {
  return <>
    {/* Opponents Modal */}
    <OpponentsModal
      open={props.showOpponents}
      onClose={props.onCloseOpponents}
      opponents={props.opponentsToSchedule}
      onOpponentClick={props.handleOpponentClick}
      phase={props.effectivePhase}
    />

    {/* Player Search Modal (Phase 2) */}
    {props.showPlayerSearch && (
      <PlayerSearch
        onClose={props.onClosePlayerSearch}
        excludeName={props.fullName}
        senderName={props.fullName}
        senderEmail={props.senderEmail}
        selectedDivision={props.selectedDivision}
        phase={props.effectivePhase}
        onProposalComplete={props.onProposalCompletePlayerSearch}
      />
    )}

    {props.showAdminPlayerSearch && (
      <PlayerSearch
        onClose={props.onCloseAdminPlayerSearch}
        excludeName={null}
        senderName={props.fullName}
        senderEmail={props.senderEmail}
        phase={props.effectivePhase}
        onProposalComplete={props.onProposalCompleteAdminPlayerSearch}
      />
    )}

    {/* Player Availability Modal */}
    {props.showPlayerAvailability && props.selectedOpponent && (
      <PlayerAvailabilityModal
        onClose={props.onClosePlayerAvailability}
        player={props.selectedOpponent}
        onProposeMatch={props.onProposeMatch}
        selectedDivision={props.selectedDivision}
        phase={props.effectivePhase}
      />
    )}

    {/* Proposal Modal */}
    {props.showProposalModal && props.proposalData && (
      <MatchProposalModal
        player={props.proposalData.player}
        day={props.proposalData.day}
        slot={props.proposalData.slot}
        selectedDivision={props.proposalData.selectedDivision}
        phase={props.proposalData.phase || props.effectivePhase}
        onClose={props.onCloseProposalModal}
        senderName={props.fullName}
        senderEmail={props.senderEmail}
        onProposalComplete={props.onProposalCompleteProposalModal}
      />
    )}

    {/* Standings Modal */}
    <StandingsModal
      open={props.showStandings}
      onClose={props.onCloseStandings}
      standingsUrl={props.standingsUrl}
    />

    {/* Match Details Modal */}
    <MatchDetailsModal
      open={props.modalOpen}
      onClose={props.onCloseMatchDetails}
      match={props.selectedMatch}
      onCompleted={props.onCompletedMatch}
      userPin={props.userPin}
      onMatchUpdated={props.onMatchUpdated}
      senderName={props.fullName}
      senderEmail={props.senderEmail}
    />

    {/* Confirm Match Details Modal */}
    {props.selectedProposal && !props.showProposalDetailsModal && (
      <div className={props.styles.modalOverlay}>
        <div className={props.styles.modalContent} style={{maxWidth: 420, margin: "auto"}}>
          <ConfirmMatchDetails
            proposal={props.selectedProposal}
            userNote={props.proposalNote}
            setUserNote={props.setProposalNote}
            onConfirm={props.onConfirmProposal}
            onClose={props.onCloseConfirmMatchDetails}
            onCounterPropose={props.onCounterPropose}
            phase={props.effectivePhase}
            currentUserName={props.fullName}
            currentUserEmail={props.senderEmail}
          />
        </div>
      </div>
    )}

    {/* Counter Proposal Modal */}
    <CounterProposalModal
      proposal={props.counterProposal}
      open={props.showCounterModal}
      onClose={props.onCloseCounterProposal}
      onSubmit={props.onSubmitCounterProposal}
      senderPlayer={props.senderPlayer}
      phase={props.effectivePhase}
      selectedDivision={props.selectedDivision}
    />

    {/* Proposal Details Modal */}
    {props.selectedProposal && props.showProposalDetailsModal && (
      <ProposalDetailsModal
        proposal={props.selectedProposal}
        open={props.showProposalDetailsModal}
        onClose={props.onCloseProposalDetails}
        onEdit={() => props.onCounterProposal(props.selectedProposal)}
        onMessage={() => props.onOpenChatWithOpponent && props.onOpenChatWithOpponent(props.selectedProposal)}
        onConfirm={props.onConfirmProposal}
        currentUserName={props.fullName}
        currentUserEmail={props.senderEmail}
      />
    )}

    {/* Edit Proposal Modal */}
    {props.selectedProposal && props.showEditProposalModal && (
      <EditProposalModal
        proposal={props.selectedProposal}
        open={props.showEditProposalModal}
        onClose={props.onCloseEditProposal}
        onSave={props.onSaveEditProposal}
        selectedDivision={props.selectedDivision}
        phase={props.effectivePhase}
        receiverPlayer={props.receiverPlayer}
      />
    )}

    {/* Winner Select Modal */}
    <WinnerSelectModal
      open={props.winnerModalOpen}
      onClose={props.onCloseWinnerModal}
      player1={props.winnerModalPlayers.player1}
      player2={props.winnerModalPlayers.player2}
      onSelect={props.onSelectWinner}
    />

    {/* Chat Modal */}
    {props.showChatModal && (
      <div className={props.styles.modalOverlay} style={{zIndex: 99999}}>
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95vw',
          height: '95vh',
          maxWidth: '1400px',
          maxHeight: '900px',
          background: '#181818',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #333',
            background: '#222',
            borderRadius: '12px 12px 0 0'
          }}>
            <h2 style={{margin: 0, color: '#fff', fontSize: '1.2em'}}>League Chat</h2>
            <button
              onClick={props.onCloseChatModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.target.style.background = '#444'}
              onMouseOut={e => e.target.style.background = 'none'}
              type="button"
            >
              ×
            </button>
          </div>
          <div style={{flex: 1, overflow: 'hidden', position: 'relative'}}>
            <DirectMessagingModal
              userName={props.fullName}
              userEmail={props.senderEmail}
              userPin={props.userPin}
              selectedDivision={props.selectedDivision}
              opponentEmails={props.opponentEmails}
              onClose={props.onCloseChatModal}
            />
          </div>
        </div>
      </div>
    )}

    {/* Completed Matches Modal */}
    {props.showCompletedModal && (
      <ProposalListModal
        proposals={props.completedMatches}
        onSelect={() => {}}
        onClose={props.onCloseCompletedModal}
        type="completed"
        isAdmin={props.userEmail === "admin@bcapl.com"}
        senderEmail={props.senderEmail}
        senderName={props.fullName}
      />
    )}

    {/* Pending Proposals Modal */}
    {props.showProposalListModal && (
      <ProposalListModal
        proposals={props.pendingProposals}
        onSelect={props.onSelectPendingProposal}
        onClose={props.onCloseProposalListModal}
        type="received"
      />
    )}
    {/* Sent Proposals Modal */}
    {props.showSentProposalListModal && (
      <ProposalListModal
        proposals={props.sentProposals}
        onSelect={props.onSelectSentProposal}
        onClose={props.onCloseSentProposalListModal}
        type="sent"
      />
    )}

    {/* Confirmation Notice Modal */}
    {props.showConfirmationNotice && (
      <DraggableModal
        open={true}
        onClose={() => props.setShowConfirmationNotice(false)}
        title="Success!"
        maxWidth="350px"
      >
        <div style={{ textAlign: 'center', color: '#28a745', fontWeight: 600, fontSize: '1.2em' }}>
          Proposal confirmed!
        </div>
        <button
          className={props.styles.dashboardBtn}
          onClick={() => props.setShowConfirmationNotice(false)}
          style={{ marginTop: 18 }}
        >
          OK
        </button>
      </DraggableModal>
    )}
  </>;
} 