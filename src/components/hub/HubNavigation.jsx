import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HubNavigation.css';
import ball8 from '../../assets/ball8.svg';
import ball9 from '../../assets/nineball.svg';
import ball10 from '../../assets/tenball.svg';

const HubNavigation = ({ currentAppName, isAdmin, isSuperAdmin, onLogout, userFirstName, userLastName, onProfileClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReturnToHub = () => {
    navigate('/hub');
  };

  const handleSwitchApp = () => {
    navigate('/hub');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handlePlayerManagementClick = () => {
    navigate('/admin/players');
  };

  const handlePlatformAdminClick = () => {
    navigate('/platform-admin');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  const isLadderApp = location.pathname === '/guest/ladder' || location.pathname === '/ladder' || currentAppName === 'Ladder of Legends';
  
  return (
    <div className={`hub-navigation ${isLadderApp ? 'ladder-app' : ''}`}>
      <div className="nav-content">
        <div className="nav-left" style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: '0 0 auto',
          minWidth: '200px'
        }}>
          <div 
            className={`hub-brand ${userFirstName ? 'hub-brand-clickable' : ''}`}
            onClick={userFirstName ? handleReturnToHub : undefined}
            style={{ cursor: userFirstName ? 'pointer' : 'default' }}
          >
            <img src={ball8} alt="8-ball" className="nav-ball" />
            Front Range
            <img src={ball9} alt="9-ball" className="nav-ball" />
            Pool Hub
            <img src={ball10} alt="10-ball" className="nav-ball" />
          </div>
        </div>
        
        <div className="nav-center">
          <div style={{ 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%'
          }}>
            <span className="app-title" style={{
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textAlign: 'center',
              textShadow: (location.pathname === '/guest/ladder' || location.pathname === '/ladder' || currentAppName === 'Ladder of Legends') 
                ? '0 0 20px rgba(107, 70, 193, 0.5) !important' 
                : '0 0 20px rgba(229, 62, 62, 0.5)',
              margin: 0,
              padding: 0,
              display: 'block',
              lineHeight: '1.2',
              fontFamily: 'inherit'
            }}>
              {(!userFirstName && (location.pathname === '/' || location.pathname === '/login')) 
                ? 'THE HUB - Login'
                : location.pathname === '/guest/ladder'
                ? 'Ladder of Legends'
                : location.pathname === '/hub'
                ? 'Front Range Pool'
                : currentAppName || 'Front Range Pool'
              }
            </span>
            {userFirstName && (
              <div style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '600',
                marginTop: '0.3rem',
                opacity: 0.9,
                lineHeight: '1.1'
              }}>
                Welcome to the Hub, {userFirstName} {userLastName}
              </div>
            )}
          </div>
        </div>
        
        {/* Buttons placed directly without container */}
        {!userFirstName ? (
          <div className="nav-right" style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: '0 0 auto',
            minWidth: '200px'
          }}>
            <div className="login-nav-info" style={{ display: 'none' }}>
              🎯  Front Range Pool Hub
            </div>
          </div>
        ) : (
          <div className="nav-right" style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: '0 0 auto',
            minWidth: '200px',
            gap: '0.5rem'
          }}>
            {/* Admin buttons */}
            {isAdmin && (
              <>
                <button onClick={handlePlayerManagementClick} className="admin-btn">
                  👥 Players
                </button>
                <button onClick={handleAdminClick} className="admin-btn">
                  ⚙️ Admin
                </button>
              </>
            )}
            
            {/* Super Admin button */}
            {isSuperAdmin && (
              <button onClick={handlePlatformAdminClick} className="super-admin-btn">
                🔧 Platform Admin
              </button>
            )}
            
            <button onClick={onProfileClick} className="profile-btn">
              👤 Profile
            </button>
            <button onClick={handleSwitchApp} className="switch-app-btn">
              🔄 Switch App
            </button>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HubNavigation;
