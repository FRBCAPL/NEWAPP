import React, { useEffect, useState, useRef } from 'react';
import DraggableModal from './modal/DraggableModal';

export default function ChatModal({
  open,
  onClose,
  currentUserEmail,
  otherUserEmail,
  proposalId = null, // optional context
  otherUserName = '',
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    let url = `/api/messages?user1=${encodeURIComponent(currentUserEmail)}&user2=${encodeURIComponent(otherUserEmail)}`;
    if (proposalId) url += `&proposalId=${proposalId}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, currentUserEmail, otherUserEmail, proposalId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send a message
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: currentUserEmail,
          receiverEmail: otherUserEmail,
          content: newMessage,
          proposalId,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
      // Refetch messages
      let url = `/api/messages?user1=${encodeURIComponent(currentUserEmail)}&user2=${encodeURIComponent(otherUserEmail)}`;
      if (proposalId) url += `&proposalId=${proposalId}`;
      const data = await fetch(url).then(r => r.json());
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <DraggableModal open={open} onClose={onClose} title={`Chat with ${otherUserName || otherUserEmail}`} maxWidth="400px">
      <div style={{ minHeight: 320, maxHeight: 400, overflowY: 'auto', background: '#181818', borderRadius: 8, padding: 8, marginBottom: 12 }}>
        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center' }}>Loading messages...</div>
        ) : (
          <>
            {messages.length === 0 && <div style={{ color: '#aaa', textAlign: 'center' }}>No messages yet.</div>}
            {messages.map(msg => (
              <div key={msg._id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.senderEmail === currentUserEmail ? 'flex-end' : 'flex-start',
                marginBottom: 8
              }}>
                <div style={{
                  background: msg.senderEmail === currentUserEmail ? '#e53e3e' : '#333',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '6px 14px',
                  maxWidth: 220,
                  fontSize: '1em',
                  boxShadow: msg.senderEmail === currentUserEmail ? '0 2px 8px #e53e3e44' : '0 2px 8px #0002',
                  alignSelf: msg.senderEmail === currentUserEmail ? 'flex-end' : 'flex-start',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '0.75em', color: '#aaa', marginTop: 2, alignSelf: msg.senderEmail === currentUserEmail ? 'flex-end' : 'flex-start' }}>
                  {new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #555', background: '#222', color: '#fff' }}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '0 18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </DraggableModal>
  );
} 