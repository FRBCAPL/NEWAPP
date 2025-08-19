import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useNavigate } from "react-router-dom";
import styles from './AdminDashboard.module.css';
import userSearchStyles from './AdminUserSearch.module.css';
import UnenteredMatchesModal from "./UnenteredMatchesModal";
import { FaSyncAlt, FaCheckCircle, FaExclamationCircle, FaUsers, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
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
            const data = await res.json();
            
            if (data.deadlineExtended) {
              setResult(`✅ ${data.message}`);
            } else {
              setResult("✅ " + (data.message || "Schedule updated successfully!"));
            }
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

// --- Update Season Data Button ---
function UpdateSeasonDataButton({ backendUrl }) {
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch(`${backendUrl}/admin/divisions`)
      .then(res => res.json())
      .then(data => {
        const divs = data.map(d => d.name);
        setDivisions(divs);
        setSelectedDivision(divs[0] || "");
      })
      .catch(() => setDivisions([]));
  }, [backendUrl]);

  const handleUpdate = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/admin/update-season-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division: selectedDivision })
      });
      const data = await res.json();
      if (res.ok) {
        setResult("✅ " + (data.message || "Season data updated successfully!"));
      } else {
        setResult("❌ " + (data.error || "Update failed."));
      }
    } catch (err) {
      setResult("❌ Update failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: "12px 0" }}>
      <h3>Update Season Data from Schedule</h3>
      <select
        value={selectedDivision}
        onChange={e => setSelectedDivision(e.target.value)}
        style={{ marginRight: 8, padding: 4, borderRadius: 4 }}
      >
        {divisions.map(div =>
          <option key={div} value={div}>{div}</option>
        )}
      </select>
      <button
        onClick={handleUpdate}
        disabled={loading || !selectedDivision}
        style={{
          background: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          padding: "8px 16px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Updating..." : "Update Season Data"}
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
          {loading ? "Adding..." : "Add Players to Database"}
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
      if (res.ok) {
        if (data.deadlineExtended) {
          setResult("✅ " + data.message);
        } else {
          setResult("✅ " + (data.message || "Schedule updated!"));
        }
      } else {
        setResult("❌ " + (data.error || "Update failed."));
      }
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

// --- Admin Match Manager ---
function AdminMatchManager({ backendUrl }) {
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDivisions = async () => {
    try {
      const res = await fetch(`${backendUrl}/admin/divisions`);
      const data = await res.json();
      const names = (data || []).map(d => d.name);
      setDivisions(names);
      if (!selectedDivision && names.length > 0) {
        setSelectedDivision(names[0]);
      }
    } catch (_) {
      setDivisions([]);
    }
  };

  const loadMatches = async () => {
    if (!selectedDivision) return;
    setLoading(true);
    setMessage("");
    try {
      const [schedRes, compRes] = await Promise.all([
        fetch(`${backendUrl}/api/proposals/admin/list?division=${encodeURIComponent(selectedDivision)}&status=confirmed&completed=false`),
        fetch(`${backendUrl}/api/proposals/admin/list?division=${encodeURIComponent(selectedDivision)}&status=confirmed&completed=true`)
      ]);
      const schedData = await schedRes.json();
      const compData = await compRes.json();
      setScheduled((schedData.proposals || []).slice(0, 200));
      setCompleted((compData.proposals || []).slice(0, 200));
    } catch (err) {
      setMessage(`Failed to load matches: ${err.message}`);
      setScheduled([]);
      setCompleted([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadDivisions(); }, [backendUrl]);
  useEffect(() => { loadMatches(); }, [selectedDivision]);

  const confirmAction = (text) => window.confirm(text);
  const promptText = (text, defVal = "") => window.prompt(text, defVal || "");

  const markCompleted = async (id) => {
    const winner = promptText("Enter winner name (exactly as in schedule/standings):");
    if (winner === null) return;
    try {
      const res = await fetch(`${backendUrl}/api/proposals/admin/${id}/completed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, winner })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark completed');
      setMessage('✅ Marked as completed');
      loadMatches();
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
  };

  const uncomplete = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/proposals/admin/${id}/completed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to un-complete');
      setMessage('✅ Marked as not completed');
      loadMatches();
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
  };

  const deleteMatch = async (id) => {
    if (!confirmAction('Delete this match/proposal? This cannot be undone.')) return;
    try {
      const res = await fetch(`${backendUrl}/api/proposals/admin/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      setMessage('✅ Deleted');
      loadMatches();
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
  };

  const editWinner = async (id, currentWinner) => {
    const winner = promptText('Set winner to:', currentWinner || '');
    if (winner === null) return;
    try {
      const res = await fetch(`${backendUrl}/api/proposals/admin/${id}/completed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, winner })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update winner');
      setMessage('✅ Winner updated');
      loadMatches();
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Match Manager</h3>
        <select value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)}>
          {divisions.map(d => (<option key={d} value={d}>{d}</option>))}
        </select>
        <button onClick={loadMatches} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      {message && <div style={{ marginBottom: 8 }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
          <h4>Scheduled (Confirmed, Not Completed)</h4>
          {scheduled.length === 0 ? <div style={{ color: '#888' }}>None</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>When</th>
                  <th style={{ textAlign: 'left' }}>Match</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map(p => (
                  <tr key={p._id}>
                    <td>{p.date || ''} {p.time || ''} @ {p.location || ''}</td>
                    <td>{p.senderName} vs {p.receiverName}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => markCompleted(p._id)}>Mark Completed</button>
                      <button onClick={() => deleteMatch(p._id)} style={{ color: '#b00020' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
          <h4>Completed</h4>
          {completed.length === 0 ? <div style={{ color: '#888' }}>None</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>When</th>
                  <th style={{ textAlign: 'left' }}>Match</th>
                  <th style={{ textAlign: 'left' }}>Winner</th>
                  <th style={{ textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(p => (
                  <tr key={p._id}>
                    <td>{p.date || ''} {p.time || ''} @ {p.location || ''}</td>
                    <td>{p.senderName} vs {p.receiverName}</td>
                    <td>{p.winner || '-'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => editWinner(p._id, p.winner)}>Edit Winner</button>
                      <button onClick={() => uncomplete(p._id)}>Un-complete</button>
                      <button onClick={() => deleteMatch(p._id)} style={{ color: '#b00020' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Create Division Form ---
function CreateDivisionForm({ backendUrl, onDivisionCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleUrl, setScheduleUrl] = useState("");
  const [standingsUrl, setStandingsUrl] = useState("");
  const [seasonStart, setSeasonStart] = useState("");
  const [result, setResult] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setResult("");
    try {
      const res = await fetch(`${backendUrl}/api/seasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          division: name,
          description,
          scheduleUrl,
          standingsUrl,
          seasonStart
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult("✅ Division/Season created!");
        setName("");
        setDescription("");
        setScheduleUrl("");
        setStandingsUrl("");
        setSeasonStart("");
        if (onDivisionCreated) onDivisionCreated();
      } else {
        setResult("❌ " + (data.error || "Failed to create division/season."));
      }
    } catch (err) {
      setResult("❌ Failed to create division/season.");
    }
  };
  return (
    <form onSubmit={handleCreate} style={{ marginBottom: 16 }}>
      <h3>Create New Division/Season</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input type="text" placeholder="Division Name" value={name} onChange={e => setName(e.target.value)} required />
        <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="url" placeholder="Schedule URL" value={scheduleUrl} onChange={e => setScheduleUrl(e.target.value)} required />
        <input type="url" placeholder="Standings URL" value={standingsUrl} onChange={e => setStandingsUrl(e.target.value)} required />
        <input type="date" placeholder="Season Start" value={seasonStart} onChange={e => setSeasonStart(e.target.value)} required />
        <div style={{ fontSize: '0.95em', color: '#aaa', marginTop: 4 }}>
          Phase 1: 6 weeks • Phase 2: 4 weeks • Season: 10 weeks total (auto-calculated)
        </div>
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
                    onClick={() => handleAdd(user.email, selectedDivision)}
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
                        onClick={() => handleRemoveDivision(user.email, selectedDivision)}
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
                        onClick={() => handleAddDivision(user.email, selectedDivision)}
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
  const [activeTab, setActiveTab] = useState('chat'); // NEW: tab state
  const [banner, setBanner] = useState(null); // For success/error feedback
  const navigate = useNavigate();

  useEffect(() => {
    const client = StreamChat.getInstance(apiKey);
            async function setup() {
          try {
            console.log('Admin setup starting...');
            console.log('Admin user ID:', adminUserId);
            console.log('Backend URL:', BACKEND_URL);
            
            // Get token (this will also create the user if needed)
            console.log('Requesting admin token...');
            const response = await fetch(`${BACKEND_URL}/token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: adminUserId }),
            });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token request failed:', response.status, errorText);
          throw new Error(`Token request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Token response:', data);
        
        if (!data.token) {
          console.error('No token in response:', data);
          alert("Failed to get admin token - no token in response");
          return;
        }
        
        console.log('Connecting to Stream Chat...');
        await client.connectUser({ id: adminUserId, name: "Admin" }, data.token);
        setChatClient(client);
        
        console.log('Querying channels...');
        const filters = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];
        const channels = await client.queryChannels(filters, sort, { watch: false, state: true });
        setChannels(channels);
        
        console.log('Admin setup completed successfully');
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

  // Helper to show a banner for feedback
  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  if (!chatClient) return <div>Loading admin chat client...</div>;

  return (
    <div className={styles.adminDashboardRoot}>
      <div className={styles.adminDashboardNav}>
        <button onClick={() => { navigate('/'); window.location.reload(); }}>
          🏠 User Dashboard
        </button>
        <button onClick={() => navigate('/chat')}>💬 Back to Chat</button>
        <button onClick={() => { localStorage.clear(); navigate('/'); window.location.reload(); }}>
          🚪 Logout
        </button>
      </div>
      <div className={styles.adminDashboardMainColumn}>
        {banner && (
          <div style={{
            background: banner.type === 'success' ? '#d4edda' : '#f8d7da',
            color: banner.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${banner.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: 6,
            padding: '10px 18px',
            marginBottom: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            {banner.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />} {banner.message}
          </div>
        )}
        {/* --- Data Sync Card --- */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardTitle}><FaSyncAlt /> Data Sync</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <DivisionScheduleUpdater backendUrl={BACKEND_URL} />
            <UpdateSeasonDataButton backendUrl={BACKEND_URL} />
            <UpdateStandingsButton backendUrl={BACKEND_URL} />
            <SyncUsersButton backendUrl={BACKEND_URL} />
          </div>
        </div>
        {/* --- Division Management Card --- */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardTitle}><FaUsers /> Division Management</div>
          <div className={styles.scrollableCardContent} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <CreateDivisionForm backendUrl={BACKEND_URL} onDivisionCreated={() => showBanner('success', 'Division/Season created!')} />
            <AdminUserSearch backendUrl={BACKEND_URL} />
            <DivisionManager backendUrl={BACKEND_URL} />
          </div>
        </div>
        {/* --- Match Management Card --- */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardTitle}><FaCalendarAlt /> Match Management</div>
          <div className={styles.scrollableCardContent}>
            <AdminMatchManager backendUrl={BACKEND_URL} />
          </div>
        </div>
        {/* --- Reports Card --- */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardTitle}><FaChartBar /> Reports & Monitoring</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={styles.adminActionButton} onClick={() => setShowUnenteredModal(true)}>
              View Unentered LMS Matches
            </button>
            <UnenteredMatchesModal open={showUnenteredModal} onClose={() => setShowUnenteredModal(false)} />
          </div>
        </div>
        {/* --- Chat Admin Card --- */}
        <div className={styles.adminCard}>
          <div className={styles.adminCardTitle}><FaCalendarAlt /> Chat Admin</div>
          <div className={styles.scrollableCardContent + ' ' + styles.adminChatWrapper}>
            <div className={styles.adminChannelList}>
              <h3>Channels</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {channels.map((ch) => (
                  <li
                    key={ch.id}
                    className={
                      styles.adminChannelListItem +
                      (selectedChannel?.id === ch.id ? ` ${styles.selected}` : '')
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
                      style={{ outline: 'none' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') setSelectedChannel(ch);
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
                  : 'Select a channel'}
              </h3>
              {loading && <div>Loading messages...</div>}
              {!loading && selectedChannel && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
    </div>
  );
}
