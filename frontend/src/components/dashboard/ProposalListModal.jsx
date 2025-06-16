import styles from './ProposalListModal.module.css';


function formatDateMMDDYYYY(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split(/[-/]/);
  return `${month}/${day}/${year}`;
}

function formatTimeHHMM(timeStr) {
  if (!timeStr) return "—";
  // Handles "HH:mm", "HHmm", or even "H:mm"
  let h = 0, m = 0;
  if (timeStr.includes(":")) {
    [h, m] = timeStr.split(":").map(Number);
  } else if (timeStr.length === 4) {
    h = Number(timeStr.slice(0,2));
    m = Number(timeStr.slice(2));
  } else if (timeStr.length === 3) {
    h = Number(timeStr.slice(0,1));
    m = Number(timeStr.slice(1));
  } else {
    return timeStr; // fallback
  }
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2,"0")} ${ampm}`;
}

// Add type prop: "received" (default) or "sent"
function ProposalListModal({ proposals, onSelect, onClose, type = "received" }) {
  return (
    <div className={styles.modalOverlay} style={{
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div className={styles.proposalModalContent}>
        <button
          onClick={onClose}
          aria-label="Close proposals list"
          type="button"
          className={styles.proposalModalCloseBtn}
        >
          ×
        </button>
        <h2 className={styles.proposalModalTitle}>
          {type === "sent" ? "Matches You Proposed" : "Pending Match Proposals"}
        </h2>
        <ul
  className={styles.proposalList}
  style={{ listStyle: "none", padding: 0, margin: 0 }}
>

          {proposals.map(proposal => (
            <li key={proposal._id}>
              <button
                onClick={() => onSelect(proposal)}
                className={styles.proposalCardButton}
              >
                <div>
                  <span className={styles.proposalCardLabel}>
                    {type === "sent" ? "To:" : "From:"}
                  </span>
                  {type === "sent" ? proposal.receiverName : proposal.senderName}
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
            </li>
          ))}
        </ul>

        {proposals.length === 0 && (
          <div style={{ color: "#ffecb3", textAlign: "center", marginTop: 16 }}>
            {type === "sent"
              ? "You haven't proposed any matches yet."
              : "No pending proposals."}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalListModal;
