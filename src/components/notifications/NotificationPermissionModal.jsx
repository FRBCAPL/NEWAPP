import React, { useState, useEffect } from 'react';
import DraggableModal from '../modal/DraggableModal';
import notificationService from '../../services/notificationService';
import './NotificationPermissionModal.css';

const NotificationPermissionModal = ({ 
  isOpen, 
  onClose, 
  onPermissionGranted 
}) => {
  const [status, setStatus] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(notificationService.getStatus());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      setStatus(notificationService.getStatus());
      
      if (granted) {
        // Show a test notification
        notificationService.showNotification(
          '🎉 Notifications Enabled!',
          'You\'ll now receive instant alerts for challenges and counter-proposals!',
          { requireInteraction: true }
        );
        
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    notificationService.disableNotifications();
    setStatus(notificationService.getStatus());
    onClose();
  };

  if (!isOpen || !status) return null;

  return (
    <DraggableModal
      open={true}
      onClose={onClose}
      title="🔔 Enable Notifications"
      maxWidth="400px"
    >
      <div className="notification-permission-modal">
        <div className="notification-header">
          <div className="notification-icon">
            🔔
          </div>
          <h3>Stay Updated with Instant Alerts!</h3>
        </div>

        <div className="notification-benefits">
          <h4>Get notified instantly when:</h4>
          <ul>
            <li>🎯 Someone challenges you to a match</li>
            <li>✅ Your challenges are accepted or declined</li>
            <li>🔄 Players submit counter-proposals</li>
            <li>📅 You have upcoming matches</li>
            <li>📈 Your ladder position changes</li>
          </ul>
        </div>

        <div className="notification-status">
          {status.permission === 'granted' && (
            <div className="status-success">
              ✅ Notifications are enabled! You'll receive instant alerts.
            </div>
          )}
          
          {status.permission === 'denied' && (
            <div className="status-error">
              ❌ Notifications are blocked. You can enable them in your browser settings.
            </div>
          )}
          
          {status.permission === 'default' && (
            <div className="status-pending">
              ⏳ Click "Enable Notifications" to get instant alerts!
            </div>
          )}
        </div>

        <div className="notification-actions">
          {status.permission === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="enable-notifications-btn"
            >
              {isRequesting ? 'Requesting...' : '🔔 Enable Notifications'}
            </button>
          )}
          
          {status.permission === 'granted' && (
            <button
              onClick={onClose}
              className="close-btn"
            >
              ✅ All Set!
            </button>
          )}
          
          {status.permission === 'denied' && (
            <button
              onClick={onClose}
              className="close-btn"
            >
              Maybe Later
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="dismiss-btn"
          >
            Don't Ask Again
          </button>
        </div>

        <div className="notification-footer">
          <p>
            <small>
              You can change notification settings anytime in your browser or app preferences.
            </small>
          </p>
        </div>
      </div>
    </DraggableModal>
  );
};

export default NotificationPermissionModal;
