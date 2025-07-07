import React, { useState } from "react";
import DraggableModal from "../modal/DraggableModal";
import styles from './ProposalListModal.module.css';
import { proposalService } from '../../services/proposalService';


function formatDateMMDDYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Handle YYYY-MM-DD format (which might be UTC)
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    // Create date in local timezone to avoid UTC shift
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const localMonth = String(date.getMonth() + 1).padStart(2, '0');
    const localDay = String(date.getDate()).padStart(2, '0');
    const localYear = date.getFullYear();
    return `${localMonth}-${localDay}-${localYear}`;
  }
  
  // Handle different date formats
  let date;
  if (dateStr.includes('-')) {
    // Already in YYYY-MM-DD format
    date = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    // Handle M/D/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
    } else {
      return dateStr; // Return as-is if can't parse
    }
  } else {
    return dateStr; // Return as-is if unknown format
  }
  
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if invalid date
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
}

function formatTimeHHMM(timeStr) {
  if (!timeStr) return 'N/A';
  
  // Handle 24-hour format (HH:MM)
  if (timeStr.includes(':') && timeStr.length === 5) {
    const [hour, minute] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  }
  
  return timeStr; // Return as-is if can't parse
}

// Add type prop: "received" (default) or "sent"
function ProposalListModal({ proposals, onSelect, onClose, type = "received" }) {
  console.log('Proposals:', proposals);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [error, setError] = useState("");
  const [localProposals, setLocalProposals] = useState(proposals);
  const [activeTab, setActiveTab] = useState('all');
  const counterProposals = proposals.filter(p => p.isCounter);
  const regularProposals = proposals.filter(p => !p.isCounter);
  const showProposals = activeTab === 'counter' ? counterProposals : regularProposals;

  const handleCancel = async (proposalId) => {
    setLoadingCancel(true);
    setError("");
    try {
      await proposalService.cancelProposal(proposalId);
      setLocalProposals(prev => prev.filter(p => p._id !== proposalId));
      setConfirmCancelId(null);
    } catch (err) {
      setError("Failed to cancel proposal. Please try again.");
    } finally {
      setLoadingCancel(false);
    }
  };

  return (
    <DraggableModal
      open={true}
      onClose={onClose}
      title={type === "sent" ? "Matches You Proposed" : "Pending Match Proposals"}
      maxWidth="600px"
    >
      <div className={styles.modalContent} style={{ position: 'relative', maxHeight: 'none', overflowY: 'visible' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? '#e53e3e' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: activeTab === 'all' ? '0 2px 8px #e53e3e44' : 'none',
              position: 'relative'
            }}
          >
            All Proposals ({regularProposals.length})
            {regularProposals.length > 0 && (
              <span style={{
                background: '#fff',
                color: '#e53e3e',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                marginLeft: 8,
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                minWidth: 24,
                textAlign: 'center',
                boxShadow: '0 1px 4px #0002'
              }}>{regularProposals.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('counter')}
            style={{
              background: activeTab === 'counter' ? '#ff9800' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: activeTab === 'counter' ? '0 2px 8px #ff980044' : 'none',
              position: 'relative'
            }}
          >
            Counter Proposals ({counterProposals.length})
            {counterProposals.length > 0 && (
              <span style={{
                background: '#fff',
                color: '#ff9800',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                marginLeft: 8,
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                minWidth: 24,
                textAlign: 'center',
                boxShadow: '0 1px 4px #0002'
              }}>{counterProposals.length}</span>
            )}
          </button>
        </div>
        <ul
          className={styles.proposalList}
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {showProposals.map(proposal => (
            <li key={proposal._id} style={{ position: 'relative' }}>
              <button
                onClick={() => onSelect(proposal)}
                className={styles.proposalCardButton}
              >
                <div>
                  <span className={styles.proposalCardLabel}>
                    {type === "sent" ? "To:" : "From:"}
                  </span>
                  {type === "sent" ? proposal.receiverName : proposal.senderName}
                  {proposal.isCounter && (
                    <span style={{
                      background: '#ff9800',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.85em',
                      marginLeft: '8px',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>Counter Proposal</span>
                  )}
                </div>
                <div>
                  <span className={styles.proposalCardLabel}>Date:</span> {formatDateMMDDYYYY(proposal.date)}
                  {"  "}
                  <span className={styles.proposalCardLabel}>Time:</span> {formatTimeHHMM(proposal.time)}
                </div>
                <div>
                  <span className={styles.proposalCardLabel}>Location:</span> {proposal.location}
                </div>
                <div className={styles.proposalCardMessage}>
                  {proposal.message}
                </div>
                <div>
                  <span className={styles.proposalCardLabel}>Status:</span>
                  <span style={{
                    color:
                      proposal.status === "pending"
                        ? "#d32f2f"
                        : proposal.status === "countered"
                        ? "#fbc02d"
                        : "#388e3c"
                  }}>
                    {proposal.status}
                  </span>
                </div>
              </button>
              {/* Cancel button for sent, pending proposals */}
              {type === "sent" && proposal.status === "pending" && (
                <button
                  className={styles.cancelProposalBtn}
                  style={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={e => { e.stopPropagation(); setConfirmCancelId(proposal._id); }}
                  disabled={loadingCancel}
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>

        {showProposals.length === 0 && (
          <div style={{ color: "#ffecb3", textAlign: "center", marginTop: 16 }}>
            {type === "sent"
              ? "You haven't proposed any matches yet."
              : "No pending proposals."}
          </div>
        )}

        {/* Confirmation Dialog INSIDE modal content */}
        {confirmCancelId && (
          <div className={styles.confirmDialogBox} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            background: '#222',
            color: '#fff',
            borderRadius: '10px',
            padding: '2rem 2.5rem',
            boxShadow: '0 4px 32px #000a',
            maxWidth: '90vw',
            minWidth: '260px',
            textAlign: 'center',
            border: '2px solid #e53e3e'
          }}>
            <p>Are you sure you want to cancel this proposal?</p>
            <button
              onClick={() => handleCancel(confirmCancelId)}
              disabled={loadingCancel}
              style={{ marginRight: 12 }}
            >
              {loadingCancel ? "Cancelling..." : "Yes, Cancel"}
            </button>
            <button onClick={() => setConfirmCancelId(null)} disabled={loadingCancel}>
              No, Go Back
            </button>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </div>
        )}
      </div>
    </DraggableModal>
  );
}

export default ProposalListModal;