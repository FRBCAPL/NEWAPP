import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config.js';

const UserPreferencesModal = ({ isOpen, onClose, userEmail, userName }) => {
  const [preferences, setPreferences] = useState({
    googleCalendarIntegration: false,
    emailNotifications: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && userEmail) {
      loadUserPreferences();
    }
  }, [isOpen, userEmail]);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const user = await response.json();
        setPreferences({
          googleCalendarIntegration: user.preferences?.googleCalendarIntegration ?? false,
          emailNotifications: user.preferences?.emailNotifications ?? true
        });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setMessage('Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(userEmail)}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage('Error saving preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        color: '#ffffff'
      }}>
        <h2 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          ⚙️ User Preferences
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading preferences...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>
                Calendar Integration
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    📅 Google Calendar Integration
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
                    Add confirmed matches to your Google Calendar
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={preferences.googleCalendarIntegration}
                    onChange={() => handleToggle('googleCalendarIntegration')}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: preferences.googleCalendarIntegration ? '#4CAF50' : '#ccc',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: preferences.googleCalendarIntegration ? 'translateX(26px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    📧 Email Notifications
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
                    Receive email notifications for match updates
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px'
                }}>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: preferences.emailNotifications ? '#4CAF50' : '#ccc',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: preferences.emailNotifications ? 'translateX(26px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            {message && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '6px',
                textAlign: 'center',
                background: message.includes('Error') ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
                border: message.includes('Error') ? '1px solid rgba(255, 0, 0, 0.5)' : '1px solid rgba(0, 255, 0, 0.5)'
              }}>
                {message}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: saving ? 0.6 : 1
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserPreferencesModal;
