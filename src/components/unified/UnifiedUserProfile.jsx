import React, { useState, useEffect } from 'react';
import unifiedAuthService from '../../services/unifiedAuthService.js';
import './UnifiedUserProfile.css';

const UnifiedUserProfile = ({ user, onProfileUpdate }) => {
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || ''
  });

  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const [preferences, setPreferences] = useState({
    googleCalendarIntegration: user?.preferences?.googleCalendarIntegration || false,
    emailNotifications: user?.preferences?.emailNotifications || true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || ''
      });

      setPreferences({
        googleCalendarIntegration: user.preferences?.googleCalendarIntegration || false,
        emailNotifications: user.preferences?.emailNotifications || true
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePinChange = (field, value) => {
    setPinData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await unifiedAuthService.updateProfile(user._id, profile, preferences);
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        if (onProfileUpdate) {
          onProfileUpdate(result.user);
        }
      } else {
        setMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changePin = async () => {
    if (pinData.newPin !== pinData.confirmPin) {
      setMessage('New PIN and confirmation PIN do not match');
      return;
    }

    if (pinData.newPin.length < 4) {
      setMessage('PIN must be at least 4 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await unifiedAuthService.changePin(user._id, pinData.currentPin, pinData.newPin);
      
      if (result.success) {
        setMessage('PIN changed successfully!');
        setPinData({
          currentPin: '',
          newPin: '',
          confirmPin: ''
        });
      } else {
        setMessage(result.message || 'Failed to change PIN');
      }
    } catch (error) {
      setMessage('Error changing PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="profile-tab">
      <h3>Personal Information</h3>
      
      <div className="form-group">
        <label>First Name</label>
        <input
          type="text"
          value={profile.firstName}
          onChange={(e) => handleProfileChange('firstName', e.target.value)}
          placeholder="First Name"
        />
      </div>

      <div className="form-group">
        <label>Last Name</label>
        <input
          type="text"
          value={profile.lastName}
          onChange={(e) => handleProfileChange('lastName', e.target.value)}
          placeholder="Last Name"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => handleProfileChange('email', e.target.value)}
          placeholder="Email"
          disabled // Email should not be changeable
        />
        <small>Email cannot be changed</small>
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input
          type="tel"
          value={profile.phone}
          onChange={(e) => handleProfileChange('phone', e.target.value)}
          placeholder="Phone Number"
        />
      </div>

      <div className="form-group">
        <label>Emergency Contact Name</label>
        <input
          type="text"
          value={profile.emergencyContactName}
          onChange={(e) => handleProfileChange('emergencyContactName', e.target.value)}
          placeholder="Emergency Contact Name"
        />
      </div>

      <div className="form-group">
        <label>Emergency Contact Phone</label>
        <input
          type="tel"
          value={profile.emergencyContactPhone}
          onChange={(e) => handleProfileChange('emergencyContactPhone', e.target.value)}
          placeholder="Emergency Contact Phone"
        />
      </div>

      <button 
        onClick={saveProfile} 
        disabled={loading}
        className="save-button"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );

  const renderPinTab = () => (
    <div className="pin-tab">
      <h3>Change PIN</h3>
      
      <div className="form-group">
        <label>Current PIN</label>
        <input
          type="password"
          value={pinData.currentPin}
          onChange={(e) => handlePinChange('currentPin', e.target.value)}
          placeholder="Current PIN"
        />
      </div>

      <div className="form-group">
        <label>New PIN</label>
        <input
          type="password"
          value={pinData.newPin}
          onChange={(e) => handlePinChange('newPin', e.target.value)}
          placeholder="New PIN (min 4 characters)"
        />
      </div>

      <div className="form-group">
        <label>Confirm New PIN</label>
        <input
          type="password"
          value={pinData.confirmPin}
          onChange={(e) => handlePinChange('confirmPin', e.target.value)}
          placeholder="Confirm New PIN"
        />
      </div>

      <button 
        onClick={changePin} 
        disabled={loading}
        className="save-button"
      >
        {loading ? 'Changing...' : 'Change PIN'}
      </button>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="preferences-tab">
      <h3>Account Preferences</h3>
      
      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={preferences.googleCalendarIntegration}
            onChange={(e) => handlePreferenceChange('googleCalendarIntegration', e.target.checked)}
          />
          Enable Google Calendar Integration
        </label>
        <small>Sync your matches and events with Google Calendar</small>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
          />
          Email Notifications
        </label>
        <small>Receive email notifications for matches and updates</small>
      </div>

      <button 
        onClick={saveProfile} 
        disabled={loading}
        className="save-button"
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );

  const renderAccountInfoTab = () => (
    <div className="account-info-tab">
      <h3>Account Information</h3>
      
      <div className="info-group">
        <label>Account Type</label>
        <div className="info-value">
          {user?.userType === 'both' ? 'League & Ladder Player' : 
           user?.userType === 'league' ? 'League Player' : 
           user?.userType === 'ladder' ? 'Ladder Player' : 'Unified User'}
        </div>
      </div>

      <div className="info-group">
        <label>Account Status</label>
        <div className="info-value">
          <span className={`status ${user?.isActive ? 'active' : 'inactive'}`}>
            {user?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="info-group">
        <label>Approval Status</label>
        <div className="info-value">
          <span className={`status ${user?.isApproved ? 'approved' : 'pending'}`}>
            {user?.isApproved ? 'Approved' : 'Pending Approval'}
          </span>
        </div>
      </div>

      <div className="info-group">
        <label>Registration Date</label>
        <div className="info-value">
          {user?.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      <div className="info-group">
        <label>Last Login</label>
        <div className="info-value">
          {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
        </div>
      </div>

      {user?.leagueProfile && (
        <div className="info-group">
          <label>League Divisions</label>
          <div className="info-value">
            {user.leagueProfile.divisions?.join(', ') || 'None'}
          </div>
        </div>
      )}

      {user?.ladderProfile && (
        <div className="info-group">
          <label>Ladder Position</label>
          <div className="info-value">
            {user.ladderProfile.ladderName} - Position {user.ladderProfile.position}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="unified-user-profile">
      <div className="profile-header">
        <h2>User Profile</h2>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'pin' ? 'active' : ''}`}
          onClick={() => setActiveTab('pin')}
        >
          Change PIN
        </button>
        <button 
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button 
          className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account Info
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'pin' && renderPinTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'account' && renderAccountInfoTab()}
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UnifiedUserProfile;
