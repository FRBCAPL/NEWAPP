import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './dashboard.module.css';
import BilliardBall from '../BilliardBall';

// Utility function to format date as MM-DD-YYYY
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

export default function ProposalDetailsModal({ proposal, open, onClose, onEdit, onMessage }) {
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }, [open]);

  if (!open || !proposal) {
    return null;
  }

  const {
    senderName, receiverName, day, date, time, location,
    gameType, raceLength, message, proposalNote
  } = proposal;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.proposalModalContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          margin: 'auto',
          padding: '2rem 1.5rem 1.5rem 1.5rem'
        }}
      >
        <h1 className={styles.proposalModalTitle}>
          <span style={{color: '#e53e3e'}}>🎱 Proposal Details</span>
        </h1>
        <div style={{textAlign: 'left', marginBottom: '1.5rem'}}>
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>You (Proposer):</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{senderName || 'N/A'}</span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Opponent:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{receiverName || 'N/A'}</span>
          </div>
          {day && (
            <div className={styles.modalDetailRowSnazzy}>
              <strong style={{color: '#e53e3e', minWidth: '120px'}}>Day:</strong> 
              <span style={{color: '#fff', marginLeft: '8px'}}>{day}</span>
            </div>
          )}
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Date:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{formatDateMMDDYYYY(date)}</span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Time:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{time || 'N/A'}</span>
          </div>
          <div className={styles.modalDetailRowSnazzy}>
            <strong style={{color: '#e53e3e', minWidth: '120px'}}>Location:</strong> 
            <span style={{color: '#fff', marginLeft: '8px'}}>{location || 'N/A'}</span>
          </div>
          {gameType && (
            <div className={styles.modalDetailRowSnazzy}>
              <BilliardBall gameType={gameType} size={16} />
              <strong style={{color: '#e53e3e', minWidth: '120px'}}>Game Type:</strong> 
              <span style={{color: '#fff', marginLeft: '8px'}}>{gameType}</span>
            </div>
          )}
          {raceLength && (
            <div className={styles.modalDetailRowSnazzy}>
              <strong style={{color: '#e53e3e', minWidth: '120px'}}>Race to:</strong> 
              <span style={{color: '#fff', marginLeft: '8px'}}>{raceLength}</span>
            </div>
          )}
          {proposalNote && (
            <div style={{
              margin: '16px 0 0 0',
              padding: '0.8rem 1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              borderLeft: '3px solid #ffc107',
              borderRadius: '6px',
              color: '#ffc107',
              fontSize: '0.95rem',
              textAlign: 'left'
            }}>
              <span role="img" aria-label="note">📝</span> <strong>Note:</strong><br />
              {proposalNote}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          {onEdit && (
            <button 
              className={styles.dashboardBtn} 
              onClick={onEdit}
              style={{ 
                background: '#e53e3e', 
                color: '#fff',
                minWidth: '120px'
              }}
            >
              Edit Proposal
            </button>
          )}
          {onMessage && (
            <button 
              className={styles.dashboardBtn} 
              onClick={onMessage}
              style={{ 
                background: '#007bff', 
                color: '#fff',
                minWidth: '120px'
              }}
            >
              Message Opponent
            </button>
          )}
          <button 
            className={styles.dashboardBtn} 
            onClick={onClose}
            style={{ 
              background: '#6c757d', 
              color: '#fff',
              minWidth: '120px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
} 