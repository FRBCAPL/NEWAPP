import React, { useState, useEffect } from 'react';
import { csvToJson, getSampleCSV, validatePlayerData } from '../../utils/csvToJson';
import { BACKEND_URL } from '../../config.js';
import './LadderManagement.css';

const LadderManagement = ({ userEmail, userPin }) => {
  const [selectedLadder, setSelectedLadder] = useState('499-under');
  const [ladderData, setLadderData] = useState([]);
  const [importData, setImportData] = useState('');
  const [importMode, setImportMode] = useState('json'); // 'json' or 'csv'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ladders = [
    { name: '499-under', displayName: '499 & Under' },
    { name: '500-549', displayName: '500-549' },
    { name: '550-plus', displayName: '550+' }
  ];

  useEffect(() => {
    loadLadderData();
  }, [selectedLadder]);

  const loadLadderData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladder/admin/${selectedLadder}`);
      if (response.ok) {
        const data = await response.json();
        setLadderData(data);
      } else {
        setMessage('Failed to load ladder data');
      }
    } catch (error) {
      console.error('Error loading ladder data:', error);
      setMessage('Error loading ladder data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setMessage('');

      let parsedData;
      
      if (importMode === 'csv') {
        // Convert CSV to JSON
        try {
          const players = csvToJson(importData);
          const validation = validatePlayerData(players);
          
          if (validation.errors.length > 0) {
            setMessage(`Validation errors found: ${validation.errors.length} errors. Please check your data.`);
            return;
          }
          
          parsedData = validation.valid;
        } catch (error) {
          setMessage('Invalid CSV format. Please check your data.');
          return;
        }
      } else {
        // Parse JSON format
        try {
          parsedData = JSON.parse(importData);
        } catch (error) {
          setMessage('Invalid JSON format. Please check your data.');
          return;
        }
      }

              const response = await fetch(`${BACKEND_URL}/api/ladder/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ladderData: parsedData,
          ladderName: selectedLadder
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(`Import completed! Imported: ${result.results.imported}, Skipped: ${result.results.skipped}`);
        setImportData('');
        loadLadderData(); // Reload the data
      } else {
        setMessage(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setMessage('Error importing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePositions = async () => {
    try {
      setLoading(true);
      setMessage('');

      const positions = ladderData.map((player, index) => ({
        email: player.email,
        position: index + 1
      }));

              const response = await fetch(`${BACKEND_URL}/api/ladder/update-positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ladderName: selectedLadder,
          positions: positions
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(`Positions updated! Updated: ${result.results.updated}`);
        loadLadderData(); // Reload the data
      } else {
        setMessage(`Update failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating positions:', error);
      setMessage('Error updating positions');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Position', 'Name', 'Email', 'FargoRate', 'Status'],
      ...ladderData.map(player => [
        player.position,
        `${player.firstName} ${player.lastName}`,
        player.email,
        player.fargoRate,
        player.isActive ? 'Active' : 'Inactive'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLadder}-ladder.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="ladder-management">
      <div className="management-header">
        <h2>Ladder Management</h2>
        <p>Import and manage ladder data from Google Sheets</p>
      </div>

      {/* Ladder Selection */}
      <div className="ladder-selector">
        <label>Select Ladder:</label>
        <select 
          value={selectedLadder} 
          onChange={(e) => setSelectedLadder(e.target.value)}
        >
          {ladders.map(ladder => (
            <option key={ladder.name} value={ladder.name}>
              {ladder.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Import Section */}
      <div className="import-section">
        <h3>Import Data from Google Sheets</h3>
        <div className="import-instructions">
          <p><strong>Instructions:</strong></p>
          <ol>
            <li>Export your Google Sheet as CSV</li>
            <li>Choose your import format below</li>
            <li>Paste the data and click Import</li>
          </ol>
          
          <div className="import-mode-selector">
            <label>
              <input
                type="radio"
                value="csv"
                checked={importMode === 'csv'}
                onChange={(e) => setImportMode(e.target.value)}
              />
              CSV Format (from Google Sheets)
            </label>
            <label>
              <input
                type="radio"
                value="json"
                checked={importMode === 'json'}
                onChange={(e) => setImportMode(e.target.value)}
              />
              JSON Format
            </label>
          </div>
          
          {importMode === 'csv' ? (
            <div>
              <p><strong>Expected CSV format:</strong></p>
              <pre>{getSampleCSV()}</pre>
              <p>Supported columns: Position, Name, Email, FargoRate</p>
            </div>
          ) : (
            <div>
              <p><strong>Expected JSON format:</strong></p>
              <pre>{`[
  {
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "fargoRate": 485,
    "position": 1
  }
]`}</pre>
            </div>
          )}
        </div>
        
        <div className="import-form">
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder={importMode === 'csv' ? "Paste your CSV data here..." : "Paste your JSON data here..."}
            rows={10}
          />
          <button 
            onClick={handleImport} 
            disabled={loading || !importData.trim()}
            className="import-btn"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>

      {/* Current Ladder Data */}
      <div className="ladder-data-section">
        <div className="section-header">
          <h3>Current {ladders.find(l => l.name === selectedLadder)?.displayName} Ladder</h3>
          <div className="action-buttons">
            <button onClick={exportToCSV} className="export-btn">
              Export to CSV
            </button>
            <button onClick={handleUpdatePositions} disabled={loading} className="update-btn">
              {loading ? 'Updating...' : 'Update Positions'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading ladder data...</div>
        ) : (
          <div className="ladder-table">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>FargoRate</th>
                  <th>Status</th>
                  <th>Immunity</th>
                </tr>
              </thead>
              <tbody>
                {ladderData.map((player, index) => (
                  <tr key={player._id || index}>
                    <td>{player.position}</td>
                    <td>{player.firstName} {player.lastName}</td>
                    <td>{player.email}</td>
                    <td>{player.fargoRate}</td>
                    <td>
                      <span className={`status ${player.isActive ? 'active' : 'inactive'}`}>
                        {player.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {player.immunityUntil ? 
                        new Date(player.immunityUntil).toLocaleDateString() : 
                        'None'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {ladderData.length === 0 && (
              <div className="no-data">
                No players found in this ladder. Import some data to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LadderManagement;
