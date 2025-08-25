import React, { useState } from 'react';
import DraggableModal from './modal/DraggableModal';
import { BACKEND_URL } from '../config.js';
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function LeagueCreationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    leagueId: '',
    name: '',
    description: '',
    website: '',
    adminEmail: '',
    adminName: '',
    adminPhone: '',
    settings: {
      requireApproval: true,
      allowSelfRegistration: true,
      registrationFee: 0,
      defaultMatchDuration: 60,
      allowChallenges: true,
      maxPlayersPerDivision: 20
    },
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: ''
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedInputChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/leagues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('League created successfully!');
        setTimeout(() => {
          onSuccess(data.league);
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to create league');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    return (
      formData.leagueId &&
      formData.name &&
      formData.adminEmail &&
      formData.adminName
    );
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New League"
      maxWidth="800px"
    >
      <div className="league-creation-modal">
        {error && (
          <div className="error-message">
            <FaExclamationCircle /> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <FaCheckCircle /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>League Information</h3>
            
            <div className="form-group">
              <label htmlFor="leagueId">League ID *</label>
              <input
                type="text"
                id="leagueId"
                value={formData.leagueId}
                onChange={(e) => handleInputChange('leagueId', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="e.g., front-range-pool"
                required
              />
              <small>Used in URLs. Only lowercase letters, numbers, and hyphens.</small>
            </div>

            <div className="form-group">
              <label htmlFor="name">League Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Front Range Pool League"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your league"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourleague.com"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Admin Information</h3>
            
            <div className="form-group">
              <label htmlFor="adminName">Admin Name *</label>
              <input
                type="text"
                id="adminName"
                value={formData.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminEmail">Admin Email *</label>
              <input
                type="email"
                id="adminEmail"
                value={formData.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminPhone">Admin Phone</label>
              <input
                type="tel"
                id="adminPhone"
                value={formData.adminPhone}
                onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>League Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.requireApproval}
                    onChange={(e) => handleNestedInputChange('settings', 'requireApproval', e.target.checked)}
                  />
                  Require admin approval for new players
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.allowSelfRegistration}
                    onChange={(e) => handleNestedInputChange('settings', 'allowSelfRegistration', e.target.checked)}
                  />
                  Allow players to register themselves
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="registrationFee">Registration Fee ($)</label>
                <input
                  type="number"
                  id="registrationFee"
                  value={formData.settings.registrationFee}
                  onChange={(e) => handleNestedInputChange('settings', 'registrationFee', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="defaultMatchDuration">Default Match Duration (minutes)</label>
                <input
                  type="number"
                  id="defaultMatchDuration"
                  value={formData.settings.defaultMatchDuration}
                  onChange={(e) => handleNestedInputChange('settings', 'defaultMatchDuration', parseInt(e.target.value) || 60)}
                  min="30"
                  max="180"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.target.value)}
                  placeholder="contact@yourleague.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={formData.contactInfo.address}
                onChange={(e) => handleNestedInputChange('contactInfo', 'address', e.target.value)}
                placeholder="League address or meeting location"
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !validateForm()}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Creating League...
                </>
              ) : (
                'Create League'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .league-creation-modal {
          padding: 20px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-size: 12px;
        }

        .error-message,
        .success-message {
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-message {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .success-message {
          background: #efe;
          color: #363;
          border: 1px solid #cfc;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </DraggableModal>
  );
}
