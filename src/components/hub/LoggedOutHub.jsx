import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmbeddedLoginForm from './EmbeddedLoginForm';
import HubSignupForm from '../auth/LadderSignupForm';
import './LoggedOutHub.css';

const LoggedOutHub = ({ onLoginSuccess }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const navigate = useNavigate();

  const availableApps = [
    {
      id: 'league',
      name: 'Front Range BCAPL Singles League',
      description: 'Manage league matches, schedules, and standings',
      icon: '🏆',
      color: '#4CAF50',
      status: 'active'
    },
    {
      id: 'ladder',
      name: 'Ladder of Legends Tournament Series',
      description: 'Independently run, challenge-based ladder system',
      icon: '📈',
      color: '#2196F3',
      status: 'active'
    }
  ];

  const handleLoginSuccess = (name, email, pin, userType) => {
    // Check if this is a guest login
    if (email === "guest@frontrangepool.com" && pin === "GUEST") {
      setIsGuestMode(true);
      // Don't call onLoginSuccess for guest mode - we'll handle it differently
    } else {
      // Pass userType to the parent component
      onLoginSuccess(name, email, pin, userType);
    }
  };

  const handleGuestAppAccess = (appId) => {
    // Navigate to guest versions of the apps
    if (appId === 'league') {
      navigate('/guest/league');
    } else if (appId === 'ladder') {
      navigate('/guest/ladder');
    }
  };

  const handleGuestLogout = () => {
    setIsGuestMode(false);
    navigate('/');
  };

  // If in guest mode, show a different layout
  if (isGuestMode) {
    return (
      <div className="logged-out-hub-container">
        {/* Guest Header */}
        <div className="logged-out-hub-header">
          <div className="hub-title">
            <h1>Front Range Pool Hub</h1>
            <p>Guest Preview Mode</p>
            <div style={{ 
              marginTop: '10px',
              padding: '8px 16px',
              background: 'rgba(229, 62, 62, 0.2)',
              border: '1px solid #e53e3e',
              borderRadius: '20px',
              fontSize: '0.9rem',
              color: '#e53e3e'
            }}>
              👀 Exploring as Guest - Limited functionality
            </div>
          </div>
          
          <div className="apps-section">
            <h2 className="section-title">Available Apps</h2>
            <div className="apps-grid active-apps">
              {availableApps.filter(app => app.status === 'active').map((app) => (
                <div
                  key={app.id}
                  className={`app-card ${app.status} guest-mode`}
                  style={{ '--app-color': app.color }}
                  onClick={() => handleGuestAppAccess(app.id)}
                >
                  <div className="app-icon">{app.icon}</div>
                  <div className="app-info">
                    <h3>{app.name}</h3>
                    <p>{app.description}</p>
                    <div className="app-status">
                      <span className="status-guest-preview">Try Demo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Logout Button */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={handleGuestLogout}
              style={{
                background: 'transparent',
                color: '#e53e3e',
                border: '2px solid #e53e3e',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e53e3e';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#e53e3e';
              }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular logged out view
  return (
    <div className="logged-out-hub-container">
             {/* Login Section First */}
       <div className="login-section">
         <EmbeddedLoginForm onSuccess={handleLoginSuccess} onShowSignup={() => setShowSignupForm(true)} />
       </div>

             {/* Title and Active Apps in Red Border */}
       <div className="logged-out-hub-header">
                   <div className="hub-title">
            <h1>Guest Access</h1>
          </div>
         
         <div className="apps-section">
          <div className="apps-grid active-apps">
            {availableApps.filter(app => app.status === 'active').map((app) => (
              <div
                key={app.id}
                className={`app-card ${app.status} logged-out`}
                style={{ '--app-color': app.color }}
              >
                <div className="app-icon">{app.icon}</div>
                <div className="app-info">
                  <h3>
                    {app.id === 'ladder' ? (
                      <>
                        Ladder of Legends<br />
                        Tournament Series
                      </>
                    ) : (
                      app.name
                    )}
                  </h3>
                  <p>{app.description}</p>
                                     <div className="app-actions">
                                           <button
                        className="guest-access-btn"
                        onClick={() => handleGuestAppAccess(app.id)}
                        style={{
                          background: 'transparent',
                          color: app.id === 'ladder' ? '#4CAF50' : app.color,
                          border: `2px solid ${app.id === 'ladder' ? '#4CAF50' : app.color}`,
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          marginTop: '8px',
                          marginBottom: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = app.id === 'ladder' ? '#4CAF50' : app.color;
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = app.id === 'ladder' ? '#4CAF50' : app.color;
                        }}
                      >
                        👀 Access as Guest
                      </button>
                     
                                           
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      


             {/* Hub Signup Form Modal */}
       {showSignupForm && (
         <HubSignupForm 
           onClose={() => setShowSignupForm(false)}
           onSuccess={(data) => {
             console.log('Signup successful:', data);
             // You can add any success handling here
           }}
         />
       )}
    </div>
  );
};

export default LoggedOutHub;
