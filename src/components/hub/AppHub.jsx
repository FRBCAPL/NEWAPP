import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveWrapper from "../ResponsiveWrapper";
import PoolSimulation from "../PoolSimulation";
import './AppHub.css';

const AppHub = ({ isAuthenticated, userFirstName, userLastName, userEmail, userPin, userType, handleLogout }) => {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState(null);

  const availableApps = [
    {
      id: 'league',
      name: 'League App',
      description: 'Manage league matches, schedules, and standings',
      icon: '🏆',
      color: '#4CAF50',
      status: 'active',
      route: '/league'
    },
    {
      id: 'ladder',
      name: 'Ladder App',
      description: 'Challenge-based ladder system with rankings',
      icon: '📈',
      color: '#2196F3',
      status: 'active',
      route: '/ladder'
    }
  ];

  const handleAppSelect = (app) => {
    if (app.status === 'active') {
      setSelectedApp(app);
      navigate(app.route);
    } else {
      // Show coming soon message
      alert(`${app.name} is coming soon!`);
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="app-hub-container">
      {/* Pool Simulation Background */}
      <div className="pool-simulation-background">
        <ResponsiveWrapper aspectWidth={800} aspectHeight={400}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            <PoolSimulation />
          </div>
        </ResponsiveWrapper>
      </div>

      {/* Content Overlay */}
      <div className="app-hub-content">
        <div className="app-hub-header">
                     {isAuthenticated && (
             <div className="user-info">
                               <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white' }}>
                  Hello, {userFirstName}
                </div>
                               {/* User Type Badge */}
                <div className="user-type-badge" style={{
                  background: userType === 'both' ? 'linear-gradient(45deg, #4CAF50, #2196F3)' :
                            userType === 'league' ? '#4CAF50' :
                            userType === 'ladder' ? '#2196F3' : '#666',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginTop: '0.4rem'
                }}>
                  {userType === 'both' ? 'League & Ladder Player' :
                   userType === 'league' ? 'League Player' :
                   userType === 'ladder' ? 'Ladder Player' : 'Unknown'}
                </div>
                
                <div style={{
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  marginTop: '0.4rem',
                  opacity: 0.9
                }}>
                  You are recognized as a {userType === 'both' ? 'League & Ladder' :
                                       userType === 'league' ? 'League' :
                                       userType === 'ladder' ? 'Ladder' : 'Unknown'} player
                </div>

             </div>
           )}
           
                       <div className="hub-subtitle">
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginTop: '0.4rem' }}>Choose your pool experience</p>
            </div>

          {/* Active Apps Row */}
          <div className="apps-section">
            <div className="apps-grid active-apps">
              {availableApps.map((app) => (
                <div
                  key={app.id}
                  className={`app-card ${app.status}`}
                  onClick={() => handleAppSelect(app)}
                  style={{ '--app-color': app.color }}
                >
                  <div className="app-icon">{app.icon}</div>
                  <div className="app-info">
                    <h3>{app.name}</h3>
                    <p>{app.description}</p>
                    <div className="app-status">
                      <span className="status-active">Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHub;
