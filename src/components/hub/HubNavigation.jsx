import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HubNavigation.css';
import ball8 from '../../assets/ball8.svg';
import ball9 from '../../assets/nineball.svg';
import ball10 from '../../assets/tenball.svg';

const HubNavigation = ({ currentAppName, isAdmin, isSuperAdmin, onLogout, userFirstName, userLastName }) => {
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



  return (
    <div className="hub-navigation">
      <div className="nav-content">
        <div className="nav-left">
          {!userFirstName ? (
                         <div className="hub-brand">
               🎱 Front Range <img src={ball9} alt="9-ball" className="nav-ball" /> Pool League <img src={ball10} alt="10-ball" className="nav-ball" />
             </div>
          ) : (
            <button onClick={handleReturnToHub} className="hub-btn">
              🏠 Front Range Hub
            </button>
          )}
        </div>
        
        <div className="nav-center">
          <div style={{ textAlign: 'center' }}>
                         <span className="app-title" style={{
               color: 'white',
               fontSize: '1.8rem',
               fontWeight: 'bold',
               textAlign: 'center',
               textShadow: '0 0 20px rgba(229, 62, 62, 0.5)',
               margin: 0,
               padding: 0,
               display: 'block',
               lineHeight: '1.2',
               fontFamily: 'inherit'
             }}>
               {(!userFirstName && (location.pathname === '/' || location.pathname === '/login')) 
                 ? 'THE HUB - Login'
                 : 'Front Range Pool League'
               }
             </span>
             {userFirstName && (
               <div style={{
                 color: 'white',
                 fontSize: '2.0rem',
                 fontWeight: '600',
                 marginTop: '0.5rem',
                 opacity: 0.9
               }}>
                 Welcome to the Hub, {userFirstName} {userLastName}
               </div>
             )}
          </div>
        </div>
        
        <div className="nav-right">
          {!userFirstName ? (
            <div className="login-nav-info">
              🎯 Your Front Range Pool League Hub
            </div>
          ) : (
            <>
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
              
              <button onClick={handleSwitchApp} className="switch-app-btn" style={{
                marginRight: '10rem'
              }}>
                🔄 Switch App
              </button>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HubNavigation;
