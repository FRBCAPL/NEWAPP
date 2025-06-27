import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useNavigate } from "react-router-dom";
import styles from './AdminDashboard.module.css';
import userSearchStyles from './AdminUserSearch.module.css';
import UnenteredMatchesModal from "./UnenteredMatchesModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const adminUserId = "frbcaplgmailcom";

// --- Division Schedule Updater ---
function DivisionScheduleUpdater({ backendUrl }) {
  const [divisions, setDivisions] = useState([]);
  const [scrapeDivision, setScrapeDivision] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch(`${backendUrl}/admin/divisions`)
      .then(res => res.json())
      .then(data => {
        const divs = data.map(d => d.name);
        setDivisions(divs);
        setScrapeDivision(divs[0] || "");
      })
      .catch(() => setDivisions([]));
  }, [backendUrl]);

  return (
    <div style={{ margin: "12px 0" }}>
      <h3>Update Schedule for Division</h3>
      <select
        value={scrapeDivision}
        onChange={e => setScrapeDivision(e.target.value)}
        style={{ marginRight: 8, padding: 4, borderRadius: 4 }}
      >
        {divisions.map(div =>
          <option key={div} value={div}>{div}</option>
        )}
      </select>
      <button
        onClick={async () => {
          setLoading(true);
          setResult("");
          try {
            const res = await fetch(`${backendUrl}/admin/update-schedule`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ division: scrapeDivision })
            });
            const msg = await res.text();
            setResult("✅ " + msg);
          } catch (err) {
            setResult("❌ " + err.message);
          }
          setLoading(false);
        }}
        disabled={loading || !scrapeDivision}
        style={{
          background: "#673ab7",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Updating..." : "Update Schedule"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}

// --- Button Components ---
function SyncUsersButton({ backendUrl }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const handleSync = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/sync-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) setResult("✅ Users synced successfully!");
      else setResult("❌ Sync failed.");
    } catch (err) {
      setResult("❌ Sync failed.");
    }
    setLoading(false);
  };
  return (
    <div style={{ margin: "12px 0" }}>
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold"
        }}
      >
        {loading ? "Syncing..." : "Sync Users from Google Sheet"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}
function UpdateScheduleButton({ backendUrl }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const handleUpdate = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/update-schedule`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setResult("✅ " + (data.message || "Schedule updated!"));
      else setResult("❌ " + (data.error || "Update failed."));
    } catch (err) {
      setResult("❌ Update failed.");
    }
    setLoading(false);
  };
  return (
    <div style={{ margin: "12px 0" }}>
      <button
        onClick={handleUpdate}
        disabled={loading}
        style={{
          background: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold"
        }}
      >
        {loading ? "Updating Schedule..." : "Update Schedule"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}

function ConvertDivisionsButton({ backendUrl }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const handleConvert = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/convert-divisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok && data.success) setResult(`✅ Converted! Updated ${data.modified} users.`);
      else setResult("❌ Convert failed: " + (data.error || "Unknown error."));
    } catch (err) {
      setResult("❌ Convert failed: " + err.message);
    }
    setLoading(false);
  };
  return (
    <div style={{ margin: "12px 0" }}>
      <button
        onClick={handleConvert}
        disabled={loading}
        style={{
          background: "#ff9800",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold"
        }}
      >
        {loading ? "Converting..." : "Convert Users to Divisions Array"}
      </button>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </div>
  );
}

function UpdateStandingsButton({ backendUrl }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [detailedOutput, setDetailedOutput] = useState("");
  
  const handleUpdate = async () => {
    setLoading(true);
    setResult("");
    setDetailedOutput("");
    
    try {
      const res = await fetch(`${backendUrl}/admin/update-standings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult("✅ All standings updated successfully!");
        // Show detailed output if available
        if (data.message && data.message.includes("Scraping Summary")) {
          setDetailedOutput(data.message);
        }
      } else {
        setResult("❌ Update failed: " + (data.error || "Unknown error"));
        if (data.error) {
          setDetailedOutput(data.error);
        }
      }
    } catch (err) {
      setResult("❌ Update failed: Network error");
      setDetailedOutput(err.message);
    }
    setLoading(false);
  };
  
  return (
    <div style={{ margin: "12px 0" }}>
      <button
        onClick={handleUpdate}
        disabled={loading}
        style={{
          background: "#e53e3e",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold"
        }}
      >
        {loading ? "🔄 Updating All Standings..." : "📊 Update All Standings"}
      </button>
      {result && <div style={{ marginTop: 8, fontWeight: "bold" }}>{result}</div>}
      {detailedOutput && (
        <div style={{ 
          marginTop: 8, 
          padding: 8, 
          backgroundColor: "#f5f5f5", 
          borderRadius: 4,
          fontSize: "0.9em",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace"
        }}>
          {detailedOutput}
        </div>
      )}
    </div>
  );
}

// --- Create Division Form ---
function CreateDivisionForm({ backendUrl, onDivisionCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const handleCreate = async (e) => {
    e.preventDefault();
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/divisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult("✅ Division created!");
        setName("");
        setDescription("");
        if (onDivisionCreated) onDivisionCreated();
      } else {
        setResult("❌ " + (data.error || "Failed to create division."));
      }
    } catch (err) {
      setResult("❌ Failed to create division.");
    }
  };
  return (
    <form onSubmit={handleCreate} style={{ marginBottom: 16 }}>
      <h3>Create New Division In Atlas Database</h3>
      <div>
       <input
          type="text"
          placeholder="Division Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ marginBottom: 10 }} 
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ marginRight: 8}}
        /><br />
        <button type="submit">Create</button>
      </div>
      {result && <div style={{ marginTop: 8 }}>{result}</div>}
    </form>
  );
}

// --- Admin User Search ---
function AdminUserSearch({ backendUrl }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  useEffect(() => {
    fetch(`${backendUrl}/admin/divisions`)
      .then(res => res.json())
      .then(data => setDivisions(data.map(d => d.name)))
      .catch(() => setDivisions([]));
  }, [backendUrl]);
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await fetch(`${backendUrl}/admin/search-users?query=${encodeURIComponent(query)}`);
      const users = await res.json();
      setResults(users);
    } catch {
      setResults([]);
      alert("Search failed");
    }
  };
  const handleAdd = async (userId, division) => {
    try {
      await fetch(`${backendUrl}/admin/user/${userId}/add-division`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division })
      });
      handleSearch({ preventDefault: () => {} });
    } catch {
      alert("Failed to add user to division");
    }
  };
  const handleRemove = async (userId, division) => {
    try {
      await fetch(`${backendUrl}/admin/user/${userId}/remove-division`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division })
      });
      handleSearch({ preventDefault: () => {} });
    } catch {
      alert("Failed to remove user from division");
    }
  };
  return (
    <div className={userSearchStyles.searchContainer}>
      <h3 className={userSearchStyles.searchTitle}>Player Search & Quick Division Management</h3>
      <form onSubmit={handleSearch} className={userSearchStyles.searchForm}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={userSearchStyles.searchInput}
        />
        <button type="submit" className={userSearchStyles.searchButton}>Search</button>
      </form>
      {results.length > 0 && (
        <table className={userSearchStyles.resultsTable}>
          <thead>
            <tr className={userSearchStyles.resultsHeader}>
              <th>Name</th>
              <th>Email</th>
              <th>Divisions</th>
              <th>Add to Division</th>
            </tr>
          </thead>
          <tbody>
            {results.map(user => (
              <tr key={user.id}>
                <td className={userSearchStyles.resultsCell}>{user.name || user.id}</td>
                <td className={userSearchStyles.resultsCell}>{user.email}</td>
                <td className={userSearchStyles.resultsCell}>
                  {(user.divisions || []).length > 0 ? (
                    user.divisions.map(div =>
                      <span key={div} className={userSearchStyles.divisionBadge}>
                        {div}
                        <button
                          className={userSearchStyles.removeBtn}
                          onClick={() => handleRemove(user.id, div)}
                          title={`Remove from ${div}`}
                        >×</button>
                      </span>
                    )
                  ) : (
                    <span style={{ color: "#888" }}>None</span>
                  )}
                </td>
                <td className={userSearchStyles.resultsCell}>
                  <select
                    value={selectedDivision}
                    onChange={e => setSelectedDivision(e.target.value)}
                  >
                    <option value="">Select Division</option>
                    {divisions.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedDivision}
                    onClick={() => handleAdd(user.id, selectedDivision)}
                    className={userSearchStyles.addBtn}
                  >Add</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- Division Manager ---
function DivisionManager({ backendUrl }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [allDivisions, setAllDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const fetchDivisions = async () => {
    const res = await fetch(`${backendUrl}/admin/divisions`);
    const data = await res.json();
    setAllDivisions(data.map(d => d.name).sort());
  };
  const fetchUsers = () => {
    setLoading(true);
    fetch(`${backendUrl}/api/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(() => {
    fetchUsers();
    fetchDivisions();
  }, [backendUrl]);
  const handleAddDivision = async (userId, division) => {
    setStatus("");
    try {
      const res = await fetch(`${backendUrl}/admin/user/${userId}/add-division`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? data.user : u));
        setStatus(`✅ Added to ${division}!`);
      } else {
        setStatus("❌ " + (data.error || "Failed to add division"));
      }
    } catch (err) {
      setStatus("❌ Network error");
    }
  };
  const handleRemoveDivision = async (userId, division) => {
    setStatus("");
    const res = await fetch(`${backendUrl}/admin/user/${userId}/remove-division`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ division })
    });
    const data = await res.json();
    if (data.success) {
      setUsers(users.map(u => u.id === userId ? data.user : u));
      setStatus(`✅ Removed from ${division}!`);
    } else {
      setStatus("❌ " + (data.error || "Failed to remove division"));
    }
  };
  const usersInDivision = selectedDivision
    ? users.filter(u => (u.divisions || []).includes(selectedDivision))
    : [];
  const usersNotInDivision = selectedDivision
    ? users.filter(u => !(u.divisions || []).includes(selectedDivision))
    : [];
  if (loading) return <div>Loading users...</div>;
  return (
    <div style={{ margin: "24px 0", padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
      <h3>Division Manager</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          <b>Select Division: </b>
          <select
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
            style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}
          >
            <option value="">-- Select --</option>
            {allDivisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </label>
      </div>
      {status && <div style={{ marginBottom: 8 }}>{status}</div>}
      {selectedDivision && (
        <>
          <h4>Users in {selectedDivision}</h4>
          {usersInDivision.length === 0 ? (
            <div>No users found in this division.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Divisions</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {usersInDivision.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || user.id}</td>
                    <td>{user.email}</td>
                    <td>{(user.divisions || []).join(", ")}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveDivision(user.id, selectedDivision)}
                        style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h4 style={{ marginTop: 24 }}>Add Users to {selectedDivision}</h4>
          {usersNotInDivision.length === 0 ? (
            <div>All users are already in this division.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Add</th>
                </tr>
              </thead>
              <tbody>
                {usersNotInDivision.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <button
                        onClick={() => handleAddDivision(user.id, selectedDivision)}
                        style={{ color: "green", border: "none", background: "none", cursor: "pointer" }}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

// --- Main Admin Dashboard ---
export default function AdminDashboard() {
  const [chatClient, setChatClient] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUnenteredModal, setShowUnenteredModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const client = StreamChat.getInstance(apiKey);
    async function setup() {
      try {
        await fetch(`${BACKEND_URL}/create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: adminUserId, name: "Admin" }),
        });
        const response = await fetch(`${BACKEND_URL}/token`, {
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
    <div className={styles.adminDashboardRoot}>
      <div className={styles.adminDashboardNav}>
        <button onClick={() => { navigate("/"); window.location.reload(); }}>
          🏠 User Dashboard
        </button>
        <button onClick={() => navigate("/chat")}>
          💬 Back to Chat
        </button>
        <button onClick={() => { localStorage.clear(); navigate("/"); window.location.reload(); }}>
          🚪 Logout
        </button>
      </div>
      <div className={styles.adminDashboardMainRow}>
        {/* LEFT COLUMN: Admin controls */}
        <div className={styles.adminDashboardContent}>
          <div className={styles.adminToolbar}>
            <DivisionScheduleUpdater backendUrl={BACKEND_URL} />
            <UpdateStandingsButton backendUrl={BACKEND_URL} />
            <SyncUsersButton backendUrl={BACKEND_URL} />
            <ConvertDivisionsButton backendUrl={BACKEND_URL} />
            <button
              onClick={() => setShowUnenteredModal(true)}
              style={{
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                padding: "8px 16px",
                fontWeight: "bold",
                margin: "12px 0",
                cursor: "pointer"
              }}
            >
              View Unentered LMS Matches
            </button>
            <UnenteredMatchesModal
              open={showUnenteredModal}
              onClose={() => setShowUnenteredModal(false)}
            />
          </div>
          <CreateDivisionForm backendUrl={BACKEND_URL} onDivisionCreated={() => {}} />
          <AdminUserSearch backendUrl={BACKEND_URL} />
          <DivisionManager backendUrl={BACKEND_URL} />
        </div>
        {/* RIGHT COLUMN: Stream chat */}
        <div className={styles.adminDashboardChatColumn}>
          <div className={styles.adminChannelList}>
            <h3>Channels</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {channels.map((ch) => (
                <li
                  key={ch.id}
                  className={
                    styles.adminChannelListItem +
                    (selectedChannel?.id === ch.id ? ` ${styles.selected}` : "")
                  }
                >
                  <button
                    className={styles.adminDeleteChannelBtn}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteChannel(ch);
                    }}
                    title="Delete Channel"
                  >
                    🗑
                  </button>
                  <span
                    className={styles.adminChannelName}
                    onClick={() => setSelectedChannel(ch)}
                    tabIndex={0}
                    style={{ outline: "none" }}
                    onKeyDown={e => {
                      if (e.key === "Enter") setSelectedChannel(ch);
                    }}
                  >
                    {ch.data.name || ch.id}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.adminChannelMessages}>
            <h3>
              {selectedChannel
                ? `Messages in "${selectedChannel.data.name || selectedChannel.id}"`
                : "Select a channel"}
            </h3>
            {loading && <div>Loading messages...</div>}
            {!loading && selectedChannel && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {messages.map((msg) => (
                  <li key={msg.id} className={styles.adminMessageItem}>
                    <b>{msg.user?.name || msg.user?.id}:</b> {msg.text}
                    <button
                      className={styles.adminDeleteMessageBtn}
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Delete Message"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
