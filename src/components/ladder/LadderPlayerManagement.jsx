import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import styles from './LadderPlayerManagement.module.css';

export default function LadderPlayerManagement() {
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

  // Fetch all ladder players across all ladders
  const fetchLadderPlayers = async () => {
    try {
      // Use the working endpoint that we know works
      const response = await fetch(`${BACKEND_URL}/api/ladder/players`);
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
      email: player.email || '',
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

  if (loading) {
    return <div className={styles.container}>Loading ladder players...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Ladder Player Management</h2>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          Add New Ladder Player
        </button>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>Add New Ladder Player</h3>
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
              <input
                type="text"
                name="location"
                placeholder="Preferred Location"
                value={formData.location}
                onChange={handleInputChange}
              />
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
          </div>
        </div>
      )}

      {/* Edit Player Form */}
      {editingPlayer && (
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
              <input
                type="text"
                name="location"
                placeholder="Preferred Location"
                value={formData.location}
                onChange={handleInputChange}
              />
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

      {/* Players List */}
      <div className={styles.playersList}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ladder</th>
              <th>Position</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Fargo Rate</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ladderPlayers.map((player, index) => (
              <tr key={player._id || player.email}>
                <td>{player.ladderName === '499-under' ? '499 & Under' : 
                     player.ladderName === '500-549' ? '500-549' : 
                     player.ladderName === '550-plus' ? '550+' : player.ladderName}</td>
                <td>{player.position}</td>
                <td>{player.firstName} {player.lastName}</td>
                <td>{player.email}</td>
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
      </div>
    </div>
  );
}
