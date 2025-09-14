import React, { useState, useEffect } from 'react';
import DraggableModal from '../modal/DraggableModal';
import { BACKEND_URL } from '../../config.js';
import './LadderChallengeModal.css';

const LadderChallengeModal = ({ 
  isOpen, 
  onClose, 
  challenger, 
  defender, 
  challengeType = 'challenge',
  onChallengeComplete 
}) => {
  const [formData, setFormData] = useState({
    entryFee: '',
    raceLength: '',
    gameType: '9-ball',
    tableSize: '9-foot',
    preferredDates: [],
    postContent: '',
    location: 'Legends Brews & Cues'
  });
  
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  // Set default values based on ladder and challenge type
  useEffect(() => {
    if (defender && defender.ladderName) {
      const defaults = {
        '499-under': { entryFee: 20, raceLength: 5 },
        '500-549': { entryFee: 25, raceLength: 7 },
        '550-plus': { entryFee: 50, raceLength: 7 }
      };
      
      const ladderDefaults = defaults[defender.ladderName] || defaults['499-under'];
      
      setFormData(prev => ({
        ...prev,
        entryFee: ladderDefaults.entryFee.toString(),
        raceLength: ladderDefaults.raceLength.toString()
      }));
    }
  }, [defender]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateAdd = () => {
    const newDate = document.getElementById('preferredDate').value;
    if (newDate) {
      setFormData(prev => ({
        ...prev,
        preferredDates: [...prev.preferredDates, newDate]
      }));
      document.getElementById('preferredDate').value = '';
    }
  };

  const handleDateRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      preferredDates: prev.preferredDates.filter((_, i) => i !== index)
    }));
  };

  const generatePostContent = () => {
    const challengeDescriptions = {
      'challenge': 'Challenge Match',
      'smackdown': 'SmackDown Match',
      'smackback': 'SmackBack Match'
    };

    const description = challengeDescriptions[challengeType] || 'Challenge Match';
    
    return `🏆 ${description} 🏆

${challenger.firstName} ${challenger.lastName} (Position ${challenger.position}) is calling out ${defender.firstName} ${defender.lastName} (Position ${defender.position}) for a ${description.toLowerCase()}!

💰 Entry Fee: $${formData.entryFee}
🎯 Race to: ${formData.raceLength}
🎱 Game: ${formData.gameType}
🏓 Table: ${formData.tableSize}
📍 Location: ${formData.location}

${formData.postContent ? `\n💬 Message: ${formData.postContent}` : ''}

${defender.firstName}, you have 3 days to respond! ⏰`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const challengeData = {
        challengerEmail: challenger.email,
        defenderEmail: defender.email,
        challengeType,
        entryFee: parseInt(formData.entryFee),
        raceLength: parseInt(formData.raceLength),
        gameType: formData.gameType,
        tableSize: formData.tableSize,
        preferredDates: formData.preferredDates,
        postContent: generatePostContent(),
        location: formData.location
      };

      const response = await fetch(`${BACKEND_URL}/api/ladder/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create challenge');
      }

      setShowConfirmation(true);
      
      if (onChallengeComplete) {
        onChallengeComplete(result);
      }
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen) return null;

  if (showConfirmation) {
    return (
      <DraggableModal
        open={true}
        onClose={handleConfirmationClose}
        title="🎯 Challenge Sent!"
        maxWidth="500px"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ color: '#ff4444', marginBottom: '16px' }}>
            Challenge Successfully Sent!
          </h3>
          <p style={{ color: '#e0e0e0', marginBottom: '20px' }}>
            Your {challengeType} challenge has been sent to {defender.firstName} {defender.lastName}.
          </p>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>
            They have 3 days to respond. You'll be notified when they accept, decline, or counter-propose.
          </p>
          <button
            onClick={handleConfirmationClose}
            style={{
              background: 'linear-gradient(135deg, #ff4444, #cc3333)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Close
          </button>
        </div>
      </DraggableModal>
    );
  }

  return (
      <DraggableModal
        open={true}
        onClose={onClose}
        title={`⚔️ ${challengeType.charAt(0).toUpperCase() + challengeType.slice(1)} Challenge`}
        maxWidth="600px"
        className="ladder-challenge-modal"
        borderColor="#5b21b6"
        glowColor="#5b21b6"
      >
      <div style={{ padding: '16px' }}>
        {/* Challenge Header */}
        <div style={{ 
          background: 'rgba(255, 68, 68, 0.1)', 
          border: '1px solid rgba(255, 68, 68, 0.3)', 
          borderRadius: '6px', 
          padding: '8px', 
          marginBottom: '12px' 
        }}>
          <h3 style={{ color: '#ff4444', margin: '0 0 6px 0', textAlign: 'center', fontSize: '1rem' }}>
            {challenger.firstName} {challenger.lastName} vs {defender.firstName} {defender.lastName}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#e0e0e0', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'left' }}>
              <strong>Challenger:</strong> Pos {challenger.position} • {challenger.ladderName}
            </div>
            <div style={{ fontSize: '16px', color: '#ff4444', margin: '0 8px' }}>⚔️</div>
            <div style={{ textAlign: 'right' }}>
              <strong>Defender:</strong> Pos {defender.position} • {defender.ladderName}
            </div>
          </div>
        </div>

                <form onSubmit={handleSubmit}>
          {/* Match Details */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#ffc107', marginBottom: '8px', fontSize: '1rem' }}>Match Details</h4>
            
            <div className="form-row">
              <div className="form-column">
                <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Entry Fee ($)
                </label>
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div className="form-column">
                <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Race Length
                </label>
                <select
                  name="raceLength"
                  value={formData.raceLength}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  {Array.from({ length: 16 }, (_, i) => i + 5).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-column">
                <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Game Type
                </label>
                <select
                  name="gameType"
                  value={formData.gameType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="9-ball">9-Ball</option>
                  <option value="8-ball">8-Ball</option>
                  <option value="10-ball">10-Ball</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="form-column">
                <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Table Size
                </label>
                <select
                  name="tableSize"
                  value={formData.tableSize}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    background: '#333',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="9-foot">9-Foot</option>
                  <option value="7-foot">7-Foot</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: '#333',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <option value="Legends Brews & Cues">Legends Brews & Cues</option>
                <option value="Antiques">Antiques</option>
                <option value="Rac m">Rac m</option>
                <option value="Westside Billiards">Westside Billiards</option>
                <option value="Bijou Billiards">Bijou Billiards</option>
                <option value="Crooked Cue">Crooked Cue</option>
                <option value="Back on the Boulevard">Back on the Boulevard</option>
                <option value="Main Street Tavern">Main Street Tavern</option>
                <option value="Murray Street Darts">Murray Street Darts</option>
                <option value="My House">My House</option>
              </select>
            </div>
          </div>

          {/* Preferred Dates */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#ffc107', marginBottom: '8px', fontSize: '1rem' }}>Preferred Dates</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="date"
                id="preferredDate"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: '#333',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                onClick={handleDateAdd}
                style={{
                  padding: '8px 16px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Add
              </button>
            </div>
            
                        {formData.preferredDates.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                  Selected Dates:
                </label>
                {formData.preferredDates.map((date, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: 'rgba(255, 68, 68, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>{new Date(date).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => handleDateRemove(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#e0e0e0', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
              Additional Message (Optional)
            </label>
            <textarea
              name="postContent"
              value={formData.postContent}
              onChange={handleInputChange}
              rows="2"
              placeholder="Add any additional message for your challenge..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#333',
                color: '#fff',
                resize: 'vertical',
                fontSize: '0.9rem'
              }}
            />
          </div>

                    {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #ff0000',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '12px',
              color: '#ff6666',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#666' : 'linear-gradient(135deg, #ff4444, #cc3333)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Sending...' : 'Send Challenge'}
            </button>
          </div>
        </form>
      </div>
    </DraggableModal>
  );
};

export default LadderChallengeModal;
