import React, { useState } from 'react';
import DraggableModal from './modal/DraggableModal';
import ChatModal from './ChatModal';

export default function MessagesHubModal({
  open,
  onClose,
  currentUserEmail,
  opponents = [], // Array of { name, email }
}) {
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  return (
    <>
      <DraggableModal open={open} onClose={onClose} title="Messages" maxWidth="400px">
        <div style={{ minHeight: 220 }}>
          <h3 style={{ color: '#e53e3e', textAlign: 'center', marginBottom: 12 }}>Select a player to chat with:</h3>
          {opponents.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center' }}>No opponents found.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {opponents.map(op => (
                <li key={op.email} style={{ marginBottom: 8 }}>
                  <button
                    style={{
                      width: '100%',
                      background: '#333',
                      color: '#fff',
                      border: '1px solid #e53e3e',
                      borderRadius: 6,
                      padding: '8px 0',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '1em',
                    }}
                    onClick={() => setSelectedOpponent(op)}
                  >
                    {op.name} <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.95em' }}>({op.email})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 16, background: '#aaa', color: '#222', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
        >
          Close
        </button>
      </DraggableModal>
      {selectedOpponent && (
        <ChatModal
          open={!!selectedOpponent}
          onClose={() => setSelectedOpponent(null)}
          currentUserEmail={currentUserEmail}
          otherUserEmail={selectedOpponent.email}
          otherUserName={selectedOpponent.name}
        />
      )}
    </>
  );
} 