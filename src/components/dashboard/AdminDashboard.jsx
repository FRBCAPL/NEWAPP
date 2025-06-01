import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useNavigate } from "react-router-dom";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://newapp-xyen.onrender.com";
const adminUserId = "frbcaplgmailcom"; // <-- update this if needed

export default function AdminDashboard() {
  const [chatClient, setChatClient] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const client = StreamChat.getInstance(apiKey);

    async function setup() {
      try {
        await fetch(`${API_BASE}/create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: adminUserId, name: "Admin" }),
        });

        const response = await fetch(`${API_BASE}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: adminUserId }),
        });
        const data = await response.json();
        if (!data.token) {
          alert("Failed to get admin token");
          return;
        }
        await client.connectUser({ id: adminUserId, name: "Admin" }, data.token);
        setChatClient(client);

        // Show all messaging channels for admin
        const filters = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];
        const channels = await client.queryChannels(filters, sort, { watch: false, state: true });
        setChannels(channels);
      } catch (err) {
        console.error("Admin setup error:", err);
        alert("Admin setup error: " + err.message);
      }
    }

    setup();

    return () => {
      if (client) client.disconnectUser();
    };
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    async function fetchMessages() {
      setLoading(true);
      await selectedChannel.watch();
      setMessages(selectedChannel.state.messages);
      setLoading(false);
    }
    fetchMessages();
  }, [selectedChannel]);

  async function handleDeleteMessage(messageId) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await chatClient.deleteMessage(messageId);
      setMessages((msgs) => msgs.filter((msg) => msg.id !== messageId));
    } catch (err) {
      alert("Failed to delete message: " + err.message);
    }
  }

  async function handleDeleteChannel(channel) {
    if (!window.confirm(`Delete channel "${channel.data.name || channel.id}"? This cannot be undone.`)) return;
    try {
      await channel.delete();
      setChannels((chs) => chs.filter((c) => c.id !== channel.id));
      if (selectedChannel && selectedChannel.id === channel.id) {
        setSelectedChannel(null);
        setMessages([]);
      }
    } catch (err) {
      alert("Failed to delete channel: " + err.message);
    }
  }

  if (!chatClient) return <div>Loading admin chat client...</div>;

  return (
    <div className="admin-dashboard-root">
      <h2>Admin Dashboard</h2>
      <div className="admin-dashboard-nav">
        <button onClick={() => { navigate("/"); window.location.reload(); }}>
          Go to User Dashboard
        </button>
        <button onClick={() => navigate("/chat")}>
          Back to Chat
        </button>
        <button onClick={() => { localStorage.clear(); navigate("/"); window.location.reload(); }}>
          Logout
        </button>
      </div>
      <div className="admin-dashboard-content">
        {/* Channel List */}
        <div className="admin-channel-list">
          <h3>Channels</h3>
          <ul>
            {channels.map((ch) => (
              <li
                key={ch.id}
                className={
                  "admin-channel-list-item" +
                  (selectedChannel?.id === ch.id ? " selected" : "")
                }
              >
                <button
                  className="admin-delete-channel-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDeleteChannel(ch);
                  }}
                >
                  Delete
                </button>
                <span
                  className="admin-channel-name"
                  onClick={() => setSelectedChannel(ch)}
                >
                  {ch.data.name || ch.id}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* Messages */}
        <div className="admin-channel-messages">
          <h3>
            {selectedChannel
              ? `Messages in "${selectedChannel.data.name || selectedChannel.id}"`
              : "Select a channel"}
          </h3>
          {loading && <div>Loading messages...</div>}
          {!loading && selectedChannel && (
            <ul>
              {messages.map((msg) => (
                <li key={msg.id} className="admin-message-item">
                  <b>{msg.user?.name || msg.user?.id}:</b> {msg.text}
                  <button
                    className="admin-delete-message-btn"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
