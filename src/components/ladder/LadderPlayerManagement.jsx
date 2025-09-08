import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BACKEND_URL } from '../../config.js';
import DraggableModal from '../modal/DraggableModal';
import LadderApplicationsManager from '../admin/LadderApplicationsManager';
import styles from './LadderPlayerManagement.module.css';

export default function LadderPlayerManagement() {
  // Configure your league ID here - this should match your backend configuration
  const LEAGUE_ID = 'front-range-pool-hub';
  
  // State for available locations
  const [availableLocations, setAvailableLocations] = useState([]);
  
  const [ladderPlayers, setLadderPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    fargoRate: '',
    location: '',
    isActive: true,
    ladderName: '499-under'
  });
  
  // Match result states
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    matchId: '', // For reporting on existing matches
    challengerId: '',
    challengerName: '',
    challengerPosition: '',
    defenderId: '',
    defenderName: '',
    defenderPosition: '',
    winnerId: '',
    score: '',
    matchDate: new Date().toISOString().split('T')[0],
    matchFormat: 'race-to-5',
    location: '',
    notes: ''
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  
  // Create match states
  const [showCreateMatchForm, setShowCreateMatchForm] = useState(false);
  const [createMatchFormData, setCreateMatchFormData] = useState({
    matchType: 'challenge', // challenge, defense, position, exhibition
    challengerId: '',
    defenderId: '',
    matchFormat: 'race-to-5',
    proposedDate: new Date().toISOString().split('T')[0],
    location: '',
    notes: ''
  });
  
  // Pending matches for reporting results
  const [pendingMatches, setPendingMatches] = useState([]);
  const [showPendingMatches, setShowPendingMatches] = useState(false);
  
  // Race-to options display state
  const [showExtendedRaceOptions, setShowExtendedRaceOptions] = useState(false);
  
  // Ladder selection state
  const [selectedLadder, setSelectedLadder] = useState('499-under');
  
  // Applications manager state
  const [showApplicationsManager, setShowApplicationsManager] = useState(false);

  // Helper function to render modals using portals
  const renderModal = (modalContent) => {
    return createPortal(modalContent, document.body);
  };



  // Fetch available locations from the backend
  const fetchLocations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/locations`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.locations)) {
        setAvailableLocations(data.locations);
        console.log(`Loaded ${data.locations.length} locations from backend`);
      } else {
        console.error('Invalid locations response format:', data);
        setAvailableLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setAvailableLocations([]);
    }
  };

  // Fetch all ladder players across all ladders
  const fetchLadderPlayers = async () => {
    try {
      // Use the working endpoint that we know works
      const response = await fetch(`${BACKEND_URL}/api/ladder/ladders/${selectedLadder}/players`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setLadderPlayers(data);
        console.log(`Loaded ${data.length} ladder players from ladder endpoint`);
      } else {
        console.error('Invalid response format:', data);
        setLadderPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching ladder players:', error);
      setLadderPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    fetchLocations();
    fetchLadderPlayers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add new ladder player
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/player/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddForm(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          fargoRate: '',
          location: '',
          isActive: true,
          ladderName: '499-under'
        });
        fetchLadderPlayers();
        alert('Ladder player added successfully!');
      } else {
        alert('Error adding ladder player: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error adding ladder player:', error);
      alert('Error adding ladder player');
    }
  };

  // Update existing ladder player
  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/player/${editingPlayer.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ladderName: 'General'
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingPlayer(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          skillLevel: '',
          location: '',
          isActive: true
        });
        fetchLadderPlayers();
        alert('Ladder player updated successfully!');
      } else {
        alert('Error updating ladder player: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating ladder player:', error);
      alert('Error updating ladder player');
    }
  };

  // Start editing a ladder player
  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setFormData({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      email: player.unifiedAccount?.email || '',
      phone: player.phone || '',
      fargoRate: player.fargoRate || '',
      location: player.location || '',
      isActive: player.isActive !== false,
      ladderName: player.ladderName || '499-under'
    });
  };

  // Delete ladder player
  const handleDeletePlayer = async (playerEmail) => {
    if (!confirm('Are you sure you want to remove this player from the ladder?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/player/${playerEmail}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ladderName: 'General'
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchLadderPlayers();
        alert('Player removed from ladder successfully!');
      } else {
        alert('Error removing player: ' + data.message);
      }
    } catch (error) {
      console.error('Error removing ladder player:', error);
      alert('Error removing ladder player');
    }
  };

  // Match result functions
  const handleMatchInputChange = (e) => {
    const { name, value } = e.target;
    setMatchFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlayer1Select = (e) => {
    const playerId = e.target.value;
    const player = ladderPlayers.find(p => p._id === playerId);
    if (player) {
      setMatchFormData(prev => ({
        ...prev,
        player1Id: playerId,
        player1Name: `${player.firstName} ${player.lastName}`,
        player1Position: player.position
      }));
    }
  };

  const handlePlayer2Select = (e) => {
    const playerId = e.target.value;
    const player = ladderPlayers.find(p => p._id === playerId);
    if (player) {
      setMatchFormData(prev => ({
        ...prev,
        player2Id: playerId,
        player2Name: `${player.firstName} ${player.lastName}`,
        player2Position: player.position
      }));
    }
  };

  const handleWinnerSelect = (e) => {
    const winnerId = e.target.value;
    setMatchFormData(prev => ({
      ...prev,
      winnerId
    }));
  };

  // Select an existing pending match to report results on
  const selectPendingMatch = (match) => {
    setMatchFormData({
      matchId: match._id,
      player1Id: match.challenger?._id || match.player1?._id || '',
      player1Name: `${match.challenger?.firstName || match.player1?.firstName} ${match.challenger?.lastName || match.player1?.lastName}`,
      challengerId: match.challenger?._id || match.player1?._id || '',
      challengerName: `${match.challenger?.firstName || match.player1?.firstName} ${match.challenger?.lastName || match.player1?.lastName}`,
      challengerPosition: match.challenger?.position || match.player1?.position,
      player2Id: match.defender?._id || match.player2?._id || '',
      player2Name: `${match.defender?.firstName || match.player2?.firstName} ${match.defender?.lastName || match.player2?.lastName}`,
      defenderId: match.defender?._id || match.player2?._id || '',
      defenderName: `${match.defender?.firstName || match.player2?.firstName} ${match.defender?.lastName || match.player2?.lastName}`,
      defenderPosition: match.defender?.position || match.player2?.position,
      winnerId: '',
      score: '',
      matchDate: match.scheduledDate ? new Date(match.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      matchFormat: match.matchFormat || match.raceLength || 'best-of-5',
      location: match.location || match.venue || '',
      notes: match.notes || ''
    });
    setShowMatchForm(true);
  };

  const submitMatchResult = async (e) => {
    e.preventDefault();
    
    if (!matchFormData.player1Id || !matchFormData.player2Id || !matchFormData.winnerId) {
      alert('Please select both players and a winner');
      return;
    }

    if (matchFormData.player1Id === matchFormData.player2Id) {
      alert('Players must be different');
      return;
    }

    try {
      setLoading(true);

      // If we have a matchId, we're updating an existing match, otherwise creating a new one
      const isUpdating = matchFormData.matchId;
      const url = isUpdating 
        ? `${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches/${matchFormData.matchId}`
        : `${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches`;
      
      const method = isUpdating ? 'PUT' : 'POST';
      
      const requestBody = isUpdating 
        ? {
            // For updating existing match with results
            winner: matchFormData.winnerId,
            score: matchFormData.score,
            notes: matchFormData.notes,
            completedDate: new Date().toISOString(),
            reportedBy: matchFormData.winnerId // Admin reporting, use winner as reportedBy
          }
        : {
            // For creating new match
            challengerId: matchFormData.player1Id,
            defenderId: matchFormData.player2Id,
            matchType: 'challenge',
            proposedDate: new Date(matchFormData.matchDate).toISOString(),
            matchFormat: matchFormData.matchFormat,
            location: matchFormData.location,
            notes: matchFormData.notes
          };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Match result recorded successfully! ${result.message}`);
        setShowMatchForm(false);
                 setMatchFormData({
           player1Id: '',
           player1Name: '',
           player1Position: '',
           player2Id: '',
           player2Name: '',
           player2Position: '',
           winnerId: '',
           score: '',
           matchDate: new Date().toISOString().split('T')[0],
           matchFormat: 'race-to-5',
           location: '',
           notes: ''
         });
        fetchLadderPlayers(); // Reload to show updated positions
      } else {
        alert(`Match recording failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error recording match result:', error);
      alert('Error recording match result');
    } finally {
      setLoading(false);
    }
  };

    const loadMatchHistory = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading match history for ladder:', selectedLadder);
      const url = `${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches`;
      console.log('🔍 API URL:', url);
      
      const response = await fetch(url);
      console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Match history data:', data);
        setMatchHistory(data.matches || []);
      } else {
        const errorText = await response.text();
        console.error('🔍 API Error:', response.status, errorText);
        alert(`Failed to load match history: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error loading match history:', error);
      alert(`Error loading match history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load pending matches for the selected ladder
  const loadPendingMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches?status=scheduled`);
      if (response.ok) {
        const data = await response.json();
        setPendingMatches(data.matches || []);
      } else {
        alert('Failed to load pending matches');
      }
    } catch (error) {
      console.error('Error loading pending matches:', error);
      alert('Error loading pending matches');
    } finally {
      setLoading(false);
    }
  };

  // Check if player is eligible for SmackBack (just won a SmackDown as defender)
  const checkSmackBackEligibility = async (challengerId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches?playerId=${challengerId}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const recentMatches = data.matches || [];
        
        // Look for the most recent completed SmackDown match where this player was the defender (player2) and won
        const recentSmackDownWin = recentMatches.find(match => 
          match.status === 'completed' &&
          match.matchType === 'smackdown' &&
          match.player2?._id === challengerId &&
          match.winner?._id === challengerId &&
          new Date(match.completedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
        );
        
        return !!recentSmackDownWin;
      }
      return false;
    } catch (error) {
      console.error('Error checking SmackBack eligibility:', error);
      return false;
    }
  };

  // Create a new match between two players
  const createMatch = async (e) => {
    e.preventDefault();
    
    if (!createMatchFormData.challengerId || !createMatchFormData.defenderId) {
      alert('Please select both challenger and defender');
      return;
    }

    if (createMatchFormData.challengerId === createMatchFormData.defenderId) {
      alert('Challenger and defender must be different players');
      return;
    }

    // Get player positions to validate based on match type
    const challenger = ladderPlayers.find(p => p._id === createMatchFormData.challengerId);
    const defender = ladderPlayers.find(p => p._id === createMatchFormData.defenderId);
    
    if (challenger && defender) {
      const challengerPos = challenger.position || 0;
      const defenderPos = defender.position || 0;
      
      switch (createMatchFormData.matchType) {
        case 'challenge':
          // Challenge: Lower position (higher number) challenges higher position (lower number)
          if (challengerPos <= defenderPos) {
            alert('For Challenge Matches: Challenger must have a lower position number than defender');
            return;
          }
          break;
        case 'smackdown':
          // SmackDown: Higher position (lower number) can challenge lower position (higher number) up to 5 positions below
          if (challengerPos >= defenderPos || (defenderPos - challengerPos) > 5) {
            alert('For SmackDown Matches: Challenger must have a higher position number than defender (up to 5 positions below)');
            return;
          }
          break;
        case 'smackback':
          // SmackBack: Only a defender who just won a SmackDown can challenge the 1st place player
          if (defenderPos !== 1) {
            alert('For SmackBack Matches: Can only challenge the player in 1st place');
            return;
          }
          
          // Check if challenger is eligible for SmackBack (just won a SmackDown as defender)
          const isEligible = await checkSmackBackEligibility(createMatchFormData.challengerId);
          if (!isEligible) {
            alert('For SmackBack Matches: Challenger must have just won a SmackDown match as a defender within the last 7 days');
            return;
          }
          break;
        case 'defense':
          // Defense: Higher position (lower number) defends against lower position (higher number)
          if (challengerPos >= defenderPos) {
            alert('For Defense Matches: Challenger must have a higher position number than defender');
            return;
          }
          break;
        case 'position':
          // Position: Players at same position compete
          if (challengerPos !== defenderPos) {
            alert('For Position Matches: Both players must be at the same position');
            return;
          }
          break;
        case 'exhibition':
          // Exhibition: Any positions allowed
          break;
        default:
          alert('Please select a valid match type');
          return;
      }
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladder/${LEAGUE_ID}/ladders/${selectedLadder}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createMatchFormData,
          status: 'scheduled',
          proposedDate: new Date(createMatchFormData.proposedDate).toISOString()
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Match created successfully! Players can now play and report the result.');
        setShowCreateMatchForm(false);
                 setCreateMatchFormData({
           matchType: 'challenge',
           challengerId: '',
           defenderId: '',
           matchFormat: 'race-to-5',
           proposedDate: new Date().toISOString().split('T')[0],
           location: '',
           notes: ''
         });
        loadPendingMatches(); // Reload pending matches
      } else {
        alert(`Match creation failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error creating match');
    } finally {
      setLoading(false);
    }
  };

  // Handle create match form input changes
  const handleCreateMatchInputChange = (e) => {
    const { name, value } = e.target;
    setCreateMatchFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle player selection in create match form
  const handleCreateMatchChallengerSelect = (e) => {
    const playerId = e.target.value;
    setCreateMatchFormData(prev => ({
      ...prev,
      challengerId: playerId
    }));
  };

  const handleCreateMatchDefenderSelect = (e) => {
    const playerId = e.target.value;
    setCreateMatchFormData(prev => ({
      ...prev,
      defenderId: playerId
    }));
  };

  if (loading) {
    return <div className={styles.container}>Loading ladder players...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Ladder Player Management</h2>
         <div className={styles.headerContent}>
           <div className={styles.ladderSelector}>
             <label htmlFor="ladderSelect">Select Ladder:</label>
             <select
               id="ladderSelect"
               value={selectedLadder}
               onChange={(e) => setSelectedLadder(e.target.value)}
               className={styles.ladderSelect}
             >
               <option value="499-under">499 & Under</option>
               <option value="500-549">500-549</option>
               <option value="550-plus">550+</option>
             </select>
           </div>
                       <div className={styles.headerButtons}>
        <button 
          className={styles.addButton}
                 onClick={() => {
                   window.scrollTo(0, 0);
                   setShowAddForm(true);
                 }}
        >
          Add New Ladder Player
               </button>
                             <button 
                 className={styles.createMatchButton}
                 onClick={() => {
                   window.scrollTo(0, 0);
                   setShowCreateMatchForm(true);
                 }}
                 disabled={ladderPlayers.filter(p => p.ladderName === selectedLadder).length < 2}
               >
                 Create Match
               </button>
              <button 
                className={styles.pendingMatchesButton}
                onClick={() => {
                  setShowPendingMatches(true);
                  loadPendingMatches();
                }}
              >
                View Pending Matches
              </button>
                             <button 
                 className={styles.matchButton}
                 onClick={() => {
                   window.scrollTo(0, 0);
                   setShowMatchForm(true);
                 }}
                 disabled={ladderPlayers.filter(p => p.ladderName === selectedLadder).length < 2}
               >
                 Report Match Result
               </button>
              <button 
                className={styles.historyButton}
                onClick={() => {
                  setShowMatchHistory(!showMatchHistory);
                  if (!showMatchHistory) {
                    loadMatchHistory();
                  }
                }}
              >
                {showMatchHistory ? 'Hide Match History' : 'View Match History'}
        </button>
              <button 
                className={styles.applicationsButton}
                onClick={() => setShowApplicationsManager(true)}
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  margin: '5px'
                }}
              >
                🏆 View Pending Applications
        </button>
            </div>
         </div>
      </div>

      {/* Add Player Form */}
      {showAddForm && renderModal(
        <DraggableModal
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Add New Ladder Player"
          maxWidth="600px"
          maxHeight="90vh"
        >
          <form onSubmit={handleAddPlayer}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="fargoRate"
                placeholder="Fargo Rate"
                value={formData.fargoRate}
                onChange={handleInputChange}
                required
              />
              <select
                name="ladderName"
                value={formData.ladderName}
                onChange={handleInputChange}
                required
              >
                <option value="499-under">499 & Under</option>
                <option value="500-549">500-549</option>
                <option value="550-plus">550+</option>
              </select>
               <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                 required
               >
                 <option value="">Select Preferred Location</option>
                 {availableLocations.length > 0 ? (
                   availableLocations.map(location => (
                     <option key={location._id} value={location.name}>
                       {location.name}
                     </option>
                   ))
                 ) : (
                   <option value="" disabled>Loading locations...</option>
                 )}
               </select>
              <div className={styles.checkboxes}>
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active on Ladder
                </label>
              </div>
              <div className={styles.formButtons}>
                <button type="submit">Add Player</button>
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
          </form>
        </DraggableModal>
      )}

               {/* Create Match Form */}
        {showCreateMatchForm && renderModal(
          <DraggableModal
            open={showCreateMatchForm}
            onClose={() => setShowCreateMatchForm(false)}
            title="Create New Match"
            maxWidth="700px"
            maxHeight="90vh"
          >
              <form onSubmit={createMatch}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Match Type:</label>
                                         <select
                       name="matchType"
                       value={createMatchFormData.matchType}
                       onChange={handleCreateMatchInputChange}
                       required
                     >
                                               <option value="challenge">Challenge Match</option>
                        <option value="smackdown">SmackDown</option>
                        <option value="smackback">SmackBack</option>
                     </select>
                  </div>
                  
                                     <div className={styles.formGroup}>
                     <label>Race to:</label>
                                           <select
                        name="matchFormat"
                        value={createMatchFormData.matchFormat}
                        onChange={handleCreateMatchInputChange}
                        required
                      >
                        <option value="race-to-5">Race to 5</option>
                        <option value="race-to-7">Race to 7</option>
                        <option value="race-to-9">Race to 9</option>
                        {showExtendedRaceOptions && (
                          <>
                            <option value="race-to-6">Race to 6</option>
                            <option value="race-to-8">Race to 8</option>
                            <option value="race-to-10">Race to 10</option>
                            <option value="race-to-11">Race to 11</option>
                            <option value="race-to-12">Race to 12</option>
                            <option value="race-to-13">Race to 13</option>
                            <option value="race-to-14">Race to 14</option>
                            <option value="race-to-15">Race to 15</option>
                            <option value="race-to-16">Race to 16</option>
                            <option value="race-to-17">Race to 17</option>
                            <option value="race-to-18">Race to 18</option>
                            <option value="race-to-19">Race to 19</option>
                            <option value="race-to-20">Race to 20</option>
                            <option value="race-to-21">Race to 21</option>
                          </>
                        )}
                      </select>
                      <button
                        type="button"
                        className={styles.moreOptionsButton}
                        onClick={() => setShowExtendedRaceOptions(!showExtendedRaceOptions)}
                      >
                        {showExtendedRaceOptions ? 'Hide Options' : 'More Options'}
                      </button>
                   </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Challenger :</label>
                    <select 
                      value={createMatchFormData.challengerId} 
                      onChange={handleCreateMatchChallengerSelect}
                      required
                    >
                      <option value="">Select Challenger</option>
                      {ladderPlayers
                        .filter(player => player.ladderName === selectedLadder)
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map(player => (
                        <option key={player._id} value={player._id}>
                          #{player.position} - {player.firstName} {player.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Defender :</label>
                    <select 
                      value={createMatchFormData.defenderId} 
                      onChange={handleCreateMatchDefenderSelect}
                      required
                    >
                      <option value="">Select Defender</option>
                      {ladderPlayers
                        .filter(player => player.ladderName === selectedLadder)
                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                        .map(player => (
                        <option key={player._id} value={player._id}>
                          #{player.position} - {player.firstName} {player.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                                                               <div className={styles.formRow}>
                                      <div className={styles.formGroup}>
                      <label>Match Date:</label>
                     <input
                       type="date"
                       name="proposedDate"
                       value={createMatchFormData.proposedDate}
                       onChange={handleCreateMatchInputChange}
                       required
                     />
                   </div>
                   
                   <div className={styles.formGroup}>
                     <label>Location:</label>
                     <select
                       name="location"
                       value={createMatchFormData.location}
                       onChange={handleCreateMatchInputChange}
                       required
                     >
                       <option value="">Select Location</option>
                       {availableLocations.length > 0 ? (
                         availableLocations.map(location => (
                           <option key={location._id} value={location.name}>
                             {location.name}
                           </option>
                         ))
                       ) : (
                         <option value="" disabled>Loading locations...</option>
                       )}
                     </select>
                   </div>
                   
                   <div className={styles.formGroup}>
                     <label>Notes:</label>
                     <input
                       type="text"
                       name="notes"
                       value={createMatchFormData.notes}
                       onChange={handleCreateMatchInputChange}
                       placeholder="Optional match notes"
                     />
                   </div>
                 </div>

               <div className={styles.formButtons}>
                 <button type="submit" disabled={loading}>
                   {loading ? 'Creating...' : 'Create Match'}
                 </button>
                 <button type="button" onClick={() => setShowCreateMatchForm(false)}>
                   Cancel
                 </button>
               </div>
             </form>
          </DraggableModal>
        )}

      {/* Edit Player Form */}
      {editingPlayer && renderModal(
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>Edit Ladder Player: {editingPlayer.name}</h3>
            <form onSubmit={handleUpdatePlayer}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="fargoRate"
                placeholder="Fargo Rate"
                value={formData.fargoRate}
                onChange={handleInputChange}
                required
              />
              <select
                name="ladderName"
                value={formData.ladderName}
                onChange={handleInputChange}
                required
              >
                <option value="499-under">499 & Under</option>
                <option value="500-549">500-549</option>
                <option value="550-plus">550+</option>
              </select>
                             <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                 required
               >
                 <option value="">Select Preferred Location</option>
                 {availableLocations.length > 0 ? (
                   availableLocations.map(location => (
                     <option key={location._id} value={location.name}>
                       {location.name}
                     </option>
                   ))
                 ) : (
                   <option value="" disabled>Loading locations...</option>
                 )}
               </select>
              <div className={styles.checkboxes}>
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active on Ladder
                </label>
              </div>
              <div className={styles.formButtons}>
                <button type="submit">Update Player</button>
                <button type="button" onClick={() => setEditingPlayer(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Result Form */}
      {showMatchForm && renderModal(
        <DraggableModal
          open={showMatchForm}
          onClose={() => setShowMatchForm(false)}
          title="Report Match Result"
          maxWidth="700px"
          maxHeight="90vh"
        >
            <form onSubmit={submitMatchResult}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Player 1:</label>
                  <select 
                    value={matchFormData.player1Id} 
                    onChange={handlePlayer1Select}
                    required
                  >
                                         <option value="">Select Player 1</option>
                     {ladderPlayers
                       .filter(player => player.ladderName === selectedLadder)
                       .map(player => (
                       <option key={player._id} value={player._id}>
                         #{player.position} - {player.firstName} {player.lastName}
                       </option>
                     ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Player 2:</label>
                  <select 
                    value={matchFormData.player2Id} 
                    onChange={handlePlayer2Select}
                    required
                  >
                                         <option value="">Select Player 2</option>
                     {ladderPlayers
                       .filter(player => player.ladderName === selectedLadder)
                       .map(player => (
                       <option key={player._id} value={player._id}>
                         #{player.position} - {player.firstName} {player.lastName}
                       </option>
                     ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Winner:</label>
                  <select 
                    value={matchFormData.winnerId} 
                    onChange={handleWinnerSelect}
                    required
                  >
                    <option value="">Select Winner</option>
                    {matchFormData.player1Id && (
                      <option value={matchFormData.player1Id}>
                        {matchFormData.player1Name}
                      </option>
                    )}
                    {matchFormData.player2Id && (
                      <option value={matchFormData.player2Id}>
                        {matchFormData.player2Name}
                      </option>
                    )}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Score:</label>
                  <input
                    type="text"
                    name="score"
                    value={matchFormData.score}
                    onChange={handleMatchInputChange}
                    placeholder="e.g., 3-1, 5-3"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Match Date:</label>
                  <input
                    type="date"
                    name="matchDate"
                    value={matchFormData.matchDate}
                    onChange={handleMatchInputChange}
                    required
                  />
                </div>
                
                                 <div className={styles.formGroup}>
                   <label>Race to:</label>
                                       <select
                      name="matchFormat"
                      value={matchFormData.matchFormat}
                      onChange={handleMatchInputChange}
                      required
                    >
                      <option value="race-to-5">Race to 5</option>
                      <option value="race-to-7">Race to 7</option>
                      <option value="race-to-9">Race to 9</option>
                      {showExtendedRaceOptions && (
                        <>
                          <option value="race-to-6">Race to 6</option>
                          <option value="race-to-8">Race to 8</option>
                          <option value="race-to-10">Race to 10</option>
                          <option value="race-to-11">Race to 11</option>
                          <option value="race-to-12">Race to 12</option>
                          <option value="race-to-13">Race to 13</option>
                          <option value="race-to-14">Race to 14</option>
                          <option value="race-to-15">Race to 15</option>
                          <option value="race-to-16">Race to 16</option>
                          <option value="race-to-17">Race to 17</option>
                          <option value="race-to-18">Race to 18</option>
                          <option value="race-to-19">Race to 19</option>
                          <option value="race-to-20">Race to 20</option>
                          <option value="race-to-21">Race to 21</option>
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      className={styles.moreOptionsButton}
                      onClick={() => setShowExtendedRaceOptions(!showExtendedRaceOptions)}
                    >
                      {showExtendedRaceOptions ? 'Hide Options' : 'More Options'}
                    </button>
                 </div>
              </div>

              <div className={styles.formRow}>
                                 <div className={styles.formGroup}>
                   <label>Location:</label>
                   <select
                     name="location"
                     value={matchFormData.location}
                     onChange={handleMatchInputChange}
                     required
                   >
                     <option value="">Select Location</option>
                     {availableLocations.length > 0 ? (
                       availableLocations.map(location => (
                         <option key={location._id} value={location.name}>
                           {location.name}
                         </option>
                       ))
                     ) : (
                       <option value="" disabled>Loading locations...</option>
                     )}
                   </select>
                 </div>
                
                <div className={styles.formGroup}>
                  <label>Notes:</label>
                  <input
                    type="text"
                    name="notes"
                    value={matchFormData.notes}
                    onChange={handleMatchInputChange}
                    placeholder="Optional match notes"
                  />
                </div>
              </div>

              <div className={styles.formButtons}>
                <button type="submit" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Match Result'}
                </button>
                <button type="button" onClick={() => setShowMatchForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
        </DraggableModal>
      )}

      {/* Pending Matches Modal */}
      {showPendingMatches && renderModal(
        <DraggableModal
          open={showPendingMatches}
          onClose={() => setShowPendingMatches(false)}
          title="Pending Matches"
          maxWidth="65vw"
        >
          <div className={styles.pendingMatchesModal}>
            {pendingMatches.length === 0 ? (
              <div className={styles.noData}>No pending matches for this ladder.</div>
            ) : (
              <div className={styles.pendingMatchesTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Challenger</th>
                      <th>Defender</th>
                      <th>Format</th>
                      <th>Location</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMatches.map((match, index) => (
                      <tr key={match.id || index}>
                        <td>{match.scheduledDate ? new Date(match.scheduledDate).toLocaleDateString() : 
                             match.proposedDate ? new Date(match.proposedDate).toLocaleDateString() : 
                             'TBD'}</td>
                        <td>
                          <span className={`${styles.matchType} ${styles[match.matchType || 'challenge']}`}>
                            {match.matchType === 'challenge' ? 'Challenge' :
                             match.matchType === 'smackdown' ? 'SmackDown' :
                             match.matchType === 'smackback' ? 'SmackBack' : 'Challenge'}
                          </span>
                        </td>
                        <td>
                          <strong>{match.challenger?.firstName || match.player1?.firstName} {match.challenger?.lastName || match.player1?.lastName}</strong>
                          {(match.challenger?.position || match.player1?.position) && ` (#${match.challenger?.position || match.player1?.position})`}
                          <br />
                          <small style={{color: '#06b6d4'}}>Challenger</small>
                        </td>
                        <td>
                          <strong>{match.defender?.firstName || match.player2?.firstName} {match.defender?.lastName || match.player2?.lastName}</strong>
                          {(match.defender?.position || match.player2?.position) && ` (#${match.defender?.position || match.player2?.position})`}
                          <br />
                          <small style={{color: '#f59e0b'}}>Defender</small>
                        </td>
                        <td>{match.matchFormat || match.raceLength || 'N/A'}</td>
                        <td>{match.location || match.venue || 'N/A'}</td>
                        <td>{match.notes || 'N/A'}</td>
                        <td>
                          <span className={`${styles.status} ${styles.pending}`}>
                            Pending
                          </span>
                        </td>
                        <td>
                          <button 
                            className={styles.reportResultButton}
                            onClick={() => {
                              selectPendingMatch(match);
                              setShowPendingMatches(false); // Close the pending matches modal
                            }}
                          >
                            Report Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DraggableModal>
      )}

             {/* Players List - Single Ladder View */}
       <div className={styles.ladderSection}>
         <h3 className={styles.ladderTitle}>
           {selectedLadder === '499-under' ? '499 & Under' : 
            selectedLadder === '500-549' ? '500-549' : 
            selectedLadder === '550-plus' ? '550+' : selectedLadder} Ladder
         </h3>
      <div className={styles.playersList}>
           {ladderPlayers.filter(player => player.ladderName === selectedLadder).length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{width: '8%'}}>Position</th>
              <th style={{width: '18%'}}>Name</th>
              <th style={{width: '25%'}}>Email</th>
              <th style={{width: '12%'}}>Phone</th>
              <th style={{width: '10%'}}>Fargo Rate</th>
              <th style={{width: '12%'}}>Location</th>
              <th style={{width: '8%'}}>Status</th>
              <th style={{width: '7%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
                 {ladderPlayers
                   .filter(player => player.ladderName === selectedLadder)
                   .sort((a, b) => (a.position || 0) - (b.position || 0))
                   .map((player, index) => (
              <tr key={player._id || player.email}>
                     <td>{player.position || index + 1}</td>
                <td>{player.firstName} {player.lastName}</td>
                <td style={{whiteSpace: 'normal', wordBreak: 'break-all'}}>
                  {player.unifiedAccount?.email ? (
                    <span style={{
                      color: /@(ladder\.local|ladder\.temp|test|temp|local|fake|example|dummy)/i.test(player.unifiedAccount.email) 
                        ? '#dc2626' 
                        : 'inherit'
                    }}>
                      {player.unifiedAccount.email}
                    </span>
                  ) : (
                    'No email'
                  )}
                </td>
                <td>{player.phone}</td>
                <td>{player.fargoRate}</td>
                <td>{player.location}</td>
                <td>
                  <span className={`${styles.status} ${player.isActive ? styles.active : styles.inactive}`}>
                    {player.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEditPlayer(player)}
                  >
                    Edit
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDeletePlayer(player.email)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
           ) : (
             <div className={styles.noPlayers}>No players in this ladder yet</div>
           )}
      </div>
       </div>


      {/* Match History Modal */}
      {showMatchHistory && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.98))',
            border: '2px solid #8B5CF6',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#ffffff'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #8B5CF6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ color: '#8B5CF6', margin: 0 }}>
                🏆 Match History - {selectedLadder === '499-under' ? '499 & Under' : 
                selectedLadder === '500-549' ? '500-549' : 
                selectedLadder === '550-plus' ? '550+' : selectedLadder} Ladder
              </h2>
              <button
                onClick={() => setShowMatchHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8B5CF6',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '16px' }}>
                  Loading match history...
                </div>
              ) : matchHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '16px' }}>
                  No matches recorded yet.
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Winner</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Loser</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Score</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Location</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(139, 92, 246, 0.3)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchHistory.map((match, index) => (
                        <tr key={match.id || index} style={{ 
                          borderBottom: index < matchHistory.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                        }}>
                          <td style={{ padding: '12px' }}>{new Date(match.completedDate || match.scheduledDate).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: '#22c55e' }}>
                              {match.winner ? `${match.winner.firstName} ${match.winner.lastName}` : 'N/A'}
                            </strong> 
                            {match.winner ? ` (#${match.winner.position})` : ''}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: '#ef4444' }}>
                              {match.loser ? `${match.loser.firstName} ${match.loser.lastName}` : 'N/A'}
                            </span>
                            {match.loser ? ` (#${match.loser.position})` : ''}
                          </td>
                          <td style={{ padding: '12px' }}>{match.score}</td>
                          <td style={{ padding: '12px' }}>{match.matchType || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>{match.venue || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: match.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 
                                         match.status === 'scheduled' ? 'rgba(59, 130, 246, 0.2)' : 
                                         'rgba(107, 114, 128, 0.2)',
                              color: match.status === 'completed' ? '#22c55e' : 
                                     match.status === 'scheduled' ? '#3b82f6' : 
                                     '#6b7280'
                            }}>
                              {match.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Ladder Applications Manager Modal */}
      {showApplicationsManager && renderModal(
        <DraggableModal
          open={showApplicationsManager}
          onClose={() => setShowApplicationsManager(false)}
          title="Pending Ladder Applications"
          maxWidth="90vw"
          maxHeight="90vh"
        >
          <LadderApplicationsManager onClose={() => setShowApplicationsManager(false)} />
        </DraggableModal>
      )}

      
    </div>
  );
}
