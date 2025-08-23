import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import { 
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaUsers,
  FaTrophy,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSearch,
  FaUserPlus,
  FaUserMinus,
  FaList,
  FaChartBar
} from 'react-icons/fa';

export default function LeagueManagement() {
  const [config, setConfig] = useState({
    phase1Weeks: 6,
    currentSession: {
      name: 'Current Session',
      startDate: '',
      endDate: '',
      isActive: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('phases');
  
  // Division Management State
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [divisionConfigs, setDivisionConfigs] = useState({});
  
  // Player Rosters State
  const [players, setPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  // Standings Tracking State
  const [standings, setStandings] = useState({});
  const [selectedStandingsDivision, setSelectedStandingsDivision] = useState('');

  useEffect(() => {
    loadLeagueConfig();
    loadDivisions();
    loadPlayers();
  }, []);

  const loadLeagueConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({
            phase1Weeks: data.config.phase1Weeks || 6,
            currentSession: {
              name: 'Current Session',
              startDate: '',
              endDate: '',
              isActive: true,
              ...data.config.currentSession
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading league config:', error);
      setMessage({ type: 'error', text: 'Failed to load league configuration' });
    } finally {
      setLoading(false);
    }
  };

  const loadDivisions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/divisions`);
      if (response.ok) {
        const data = await response.json();
        setDivisions(data);
        if (data.length > 0) {
          setSelectedDivision(data[0].name);
          // Load division-specific configurations
          loadDivisionConfigs(data);
        }
      }
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };

  const loadDivisionConfigs = async (divisionsList) => {
    const configs = {};
    for (const division of divisionsList) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/division-config/${division._id}`);
        if (response.ok) {
          const data = await response.json();
          configs[division.name] = data.config || {
            phase1Weeks: 6,
            currentSession: {
              name: `${division.name} Session`,
              startDate: '',
              endDate: '',
              isActive: true
            }
          };
        } else {
          // Set default config for division
          configs[division.name] = {
            phase1Weeks: 6,
            currentSession: {
              name: `${division.name} Session`,
              startDate: '',
              endDate: '',
              isActive: true
            }
          };
        }
      } catch (error) {
        console.error(`Error loading config for division ${division.name}:`, error);
        // Set default config for division
        configs[division.name] = {
          phase1Weeks: 6,
          currentSession: {
            name: `${division.name} Session`,
            startDate: '',
            endDate: '',
            isActive: true
          }
        };
      }
    }
    setDivisionConfigs(configs);
  };

  const loadPlayers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.filter(user => user.isApproved));
        setAvailablePlayers(data.filter(user => user.isApproved && (!user.divisions || user.divisions.length === 0)));
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleSavePhaseConfig = async () => {
    if (!selectedDivision) {
      setMessage({ type: 'error', text: 'Please select a division first' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const division = divisions.find(d => d.name === selectedDivision);
      if (!division) {
        setMessage({ type: 'error', text: 'Division not found' });
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/division-config/${division._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase1Weeks: divisionConfigs[selectedDivision].phase1Weeks,
          currentSession: divisionConfigs[selectedDivision].currentSession
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${selectedDivision} phase configuration saved successfully!` });
      } else {
        setMessage({ type: 'error', text: 'Failed to save phase configuration' });
      }
    } catch (error) {
      console.error('Error saving phase config:', error);
      setMessage({ type: 'error', text: 'Error saving phase configuration' });
    } finally {
      setSaving(false);
    }
  };

  const updateDivisionConfig = (field, value) => {
    if (!selectedDivision) return;
    
    setDivisionConfigs(prev => ({
      ...prev,
      [selectedDivision]: {
        ...prev[selectedDivision],
        [field]: value
      }
    }));
  };

  const updateDivisionSession = (field, value) => {
    if (!selectedDivision) return;
    
    setDivisionConfigs(prev => ({
      ...prev,
      [selectedDivision]: {
        ...prev[selectedDivision],
        currentSession: {
          ...prev[selectedDivision].currentSession,
          [field]: value
        }
      }
    }));
  };

  // Player Roster Functions
  const handleAddPlayerToDivision = async (playerId, divisionName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/user/${playerId}/add-division`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division: divisionName })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Player added to division successfully!' });
        loadPlayers();
      } else {
        setMessage({ type: 'error', text: 'Failed to add player to division' });
      }
    } catch (error) {
      console.error('Error adding player to division:', error);
      setMessage({ type: 'error', text: 'Error adding player to division' });
    }
  };

  const handleRemovePlayerFromDivision = async (playerId, divisionName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/user/${playerId}/remove-division`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division: divisionName })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Player removed from division successfully!' });
        loadPlayers();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove player from division' });
      }
    } catch (error) {
      console.error('Error removing player from division:', error);
      setMessage({ type: 'error', text: 'Error removing player from division' });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading league configuration...</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'phases':
        return (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FaCalendarAlt style={{ color: '#4CAF50' }} />
              <h3 style={{ color: '#fff', margin: 0 }}>Division Phase Configuration</h3>
            </div>
            
            {/* Division Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Select Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: '#222',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a division...</option>
                {divisions.map(div => (
                  <option key={div._id} value={div.name}>{div.name}</option>
                ))}
              </select>
            </div>

            {selectedDivision && divisionConfigs[selectedDivision] && (
              <div style={{ 
                padding: '15px', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <h4 style={{ color: '#fff', marginBottom: '15px' }}>Phase Configuration for {selectedDivision}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Phase 1 Weeks</label>
                    <input
                      type="number"
                      value={divisionConfigs[selectedDivision].phase1Weeks}
                      onChange={(e) => updateDivisionConfig('phase1Weeks', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        background: '#222',
                        color: '#fff',
                        cursor: 'text'
                      }}
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Session Start Date</label>
                    <input
                      type="date"
                      value={divisionConfigs[selectedDivision].currentSession?.startDate || ''}
                      onChange={(e) => updateDivisionSession('startDate', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        background: '#222',
                        color: '#fff',
                        cursor: 'text'
                      }}
                    />
                  </div>
                </div>
                
                {/* Phase Date Calculator */}
                {divisionConfigs[selectedDivision].currentSession?.startDate && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    borderRadius: '6px',
                    border: '1px solid #4CAF50'
                  }}>
                    <div style={{ color: '#4CAF50', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <FaInfoCircle />
                        <strong>Calculated Session Dates for {selectedDivision}:</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                        <div>
                          <strong>Phase 1:</strong><br />
                          {(() => {
                            const startDate = new Date(divisionConfigs[selectedDivision].currentSession.startDate);
                            return startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                          })()} to {(() => {
                            const startDate = new Date(divisionConfigs[selectedDivision].currentSession.startDate);
                            const phase1End = new Date(startDate);
                            phase1End.setDate(startDate.getDate() + (divisionConfigs[selectedDivision].phase1Weeks * 7) - 1);
                            return phase1End.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                          })()}
                        </div>
                        <div>
                          <strong>Phase 2:</strong><br />
                          {(() => {
                            const startDate = new Date(divisionConfigs[selectedDivision].currentSession.startDate);
                            const phase2Start = new Date(startDate);
                            phase2Start.setDate(startDate.getDate() + (divisionConfigs[selectedDivision].phase1Weeks * 7));
                            return phase2Start.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                          })()} to {(() => {
                            const startDate = new Date(divisionConfigs[selectedDivision].currentSession.startDate);
                            const sessionEnd = new Date(startDate);
                            sessionEnd.setDate(startDate.getDate() + (divisionConfigs[selectedDivision].phase1Weeks * 7) + (4 * 7) - 1);
                            return sessionEnd.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                          })()}
                        </div>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                        Total Session Length: {divisionConfigs[selectedDivision].phase1Weeks + 4} weeks ({divisionConfigs[selectedDivision].phase1Weeks} weeks Phase 1 + 4 weeks Phase 2)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Save Button */}
            {selectedDivision && (
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                  onClick={handleSavePhaseConfig}
                  disabled={saving}
                  style={{
                    padding: '10px 25px',
                    borderRadius: '6px',
                    border: 'none',
                    background: saving ? '#666' : '#4CAF50',
                    color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
                  {saving ? 'Saving...' : `Save ${selectedDivision} Configuration`}
                </button>
              </div>
            )}
          </div>
        );

      case 'rosters':
        return (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FaUserPlus style={{ color: '#4CAF50' }} />
              <h3 style={{ color: '#fff', margin: 0 }}>Player Rosters</h3>
            </div>
            
            <div style={{ 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Select Division</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                >
                  <option value="">Choose a division...</option>
                  {divisions.map(div => (
                    <option key={div._id} value={div.name}>{div.name}</option>
                  ))}
                </select>
              </div>

              {selectedDivision && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Division Players */}
                  <div>
                    <h4 style={{ color: '#fff', marginBottom: '15px' }}>Players in {selectedDivision}</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {players.filter(player => player.divisions && player.divisions.includes(selectedDivision)).length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center' }}>No players in this division</p>
                      ) : (
                        players.filter(player => player.divisions && player.divisions.includes(selectedDivision)).map(player => (
                          <div key={player._id} style={{
                            padding: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.02)',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <p style={{ color: '#fff', margin: '0 0 5px 0' }}>
                                {player.firstName} {player.lastName}
                              </p>
                              <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>{player.email}</p>
                            </div>
                            <button
                              onClick={() => handleRemovePlayerFromDivision(player._id, selectedDivision)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#e53e3e',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <FaUserMinus />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Available Players */}
                  <div>
                    <h4 style={{ color: '#fff', marginBottom: '15px' }}>Available Players</h4>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {availablePlayers.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center' }}>No available players</p>
                      ) : (
                        availablePlayers.map(player => (
                          <div key={player._id} style={{
                            padding: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.02)',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <p style={{ color: '#fff', margin: '0 0 5px 0' }}>
                                {player.firstName} {player.lastName}
                              </p>
                              <p style={{ color: '#888', margin: 0, fontSize: '12px' }}>{player.email}</p>
                            </div>
                            <button
                              onClick={() => handleAddPlayerToDivision(player._id, selectedDivision)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#4CAF50',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <FaUserPlus />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'standings':
        return (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FaTrophy style={{ color: '#4CAF50' }} />
              <h3 style={{ color: '#fff', margin: 0 }}>Standings Tracking</h3>
            </div>
            
            <div style={{ 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Select Division</label>
                <select
                  value={selectedStandingsDivision}
                  onChange={(e) => setSelectedStandingsDivision(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                >
                  <option value="">Choose a division...</option>
                  {divisions.map(div => (
                    <option key={div._id} value={div.name}>{div.name}</option>
                  ))}
                </select>
              </div>

              {selectedStandingsDivision && (
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '15px' }}>Standings for {selectedStandingsDivision}</h4>
                  <div style={{ 
                    padding: '15px', 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    borderRadius: '6px',
                    border: '1px solid #4CAF50',
                    textAlign: 'center'
                  }}>
                    <FaChartBar style={{ fontSize: '48px', color: '#4CAF50', marginBottom: '10px' }} />
                    <p style={{ color: '#4CAF50', margin: 0 }}>
                      Standings tracking will be integrated with CSI LMS data.<br />
                      Use the "Divisions" tab to sync standings from CSI LMS.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#e53e3e', marginBottom: '20px', textAlign: 'center' }}>
        📅 League Management
      </h2>
      
      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '10px 15px',
          borderRadius: '6px',
          marginBottom: '20px',
          background: message.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(229, 62, 62, 0.2)',
          border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#e53e3e'}`,
          color: message.type === 'success' ? '#4CAF50' : '#e53e3e',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('phases')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'phases' ? '#4CAF50' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaCalendarAlt /> Phase Configuration
        </button>
        <button
          onClick={() => setActiveTab('rosters')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'rosters' ? '#4CAF50' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaUserPlus /> Player Rosters
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'standings' ? '#4CAF50' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaTrophy /> Standings Tracking
        </button>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
