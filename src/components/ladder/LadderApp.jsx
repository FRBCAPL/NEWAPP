import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config.js';
import LadderApplicationsManager from '../admin/LadderApplicationsManager';
import DraggableModal from '../modal/DraggableModal';
import LadderOfLegendsRulesModal from '../modal/LadderOfLegendsRulesModal';
import LadderProfileModal from '../modal/LadderProfileModal';
import LadderChallengeModal from './LadderChallengeModal';
import LadderChallengeConfirmModal from './LadderChallengeConfirmModal';
import LadderSmartMatchModal from './LadderSmartMatchModal';
import LadderPrizePoolTracker from './LadderPrizePoolTracker';
import LadderPrizePoolModal from './LadderPrizePoolModal';
import LadderMatchReportingModal from './LadderMatchReportingModal';
import './LadderApp.css';

const LadderApp = ({ 
  playerName, 
  playerLastName, 
  senderEmail, 
  userPin, 
  userType,
  isAdmin = false,
  showClaimForm = false,
  initialView = 'main'
}) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(initialView);
  const [userLadderData, setUserLadderData] = useState(null);
  const [ladderData, setLadderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState(null);
  const [showClaimFormState, setShowClaimFormState] = useState(false);
  const [claimFormData, setClaimFormData] = useState({ firstName: '', lastName: '', email: '', pin: '' });
  const [claiming, setClaiming] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationFormData, setApplicationFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [showApplicationsManager, setShowApplicationsManager] = useState(false);
  const [selectedLadder, setSelectedLadder] = useState('499-under');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);
  
  // Challenge system state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showChallengeConfirmModal, setShowChallengeConfirmModal] = useState(false);
  const [showSmartMatchModal, setShowSmartMatchModal] = useState(false);
  const [selectedDefender, setSelectedDefender] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeType, setChallengeType] = useState('challenge');
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [sentChallenges, setSentChallenges] = useState([]);
  const [showPrizePoolModal, setShowPrizePoolModal] = useState(false);
  const [showMatchReportingModal, setShowMatchReportingModal] = useState(false);

  useEffect(() => {
    // Load user's ladder data and ladder rankings
    loadData();
    loadLocations();
    loadChallenges();
  }, [selectedLadder]);

  // Auto-show claim form if prop is true
  useEffect(() => {
    if (showClaimForm) {
      setShowClaimFormState(true);
    }
  }, [showClaimForm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load ladder rankings for selected ladder
      const ladderResponse = await fetch(`${BACKEND_URL}/api/ladder/ladders/${selectedLadder}/players`);
      const ladderResult = await ladderResponse.json();
      
      console.log('Ladder API response:', ladderResult);
      
      if (ladderResult && Array.isArray(ladderResult)) {
        setLadderData(ladderResult);
        console.log(`Loaded ${ladderResult.length} players from ${selectedLadder} ladder`);
      } else {
        console.error('Invalid ladder data format:', ladderResult);
      }
      
      // Check if we have unified user data with ladder profile
      const unifiedUserData = localStorage.getItem("unifiedUserData");
      if (unifiedUserData) {
        try {
          const userData = JSON.parse(unifiedUserData);
          console.log('🔍 Found unified user data:', userData);
          
          if (userData.ladderProfile) {
            // User has ladder profile - use it directly
            const ladderProfile = userData.ladderProfile;
            setUserLadderData({
              playerId: 'ladder',
              name: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              fargoRate: ladderProfile.fargoRate,
              ladder: ladderProfile.ladderName,
              position: ladderProfile.position,
              immunityUntil: ladderProfile.immunityUntil,
              activeChallenges: [],
              canChallenge: ladderProfile.isActive,
              stats: {
                wins: ladderProfile.wins,
                losses: ladderProfile.losses,
                totalMatches: ladderProfile.totalMatches
              }
            });
            
            // Don't automatically switch - let user choose which ladder to view
            // setSelectedLadder(ladderProfile.ladderName);
            console.log('✅ Set user ladder data from unified profile');
            // Continue loading the selected ladder data
          }
        } catch (error) {
          console.error('Error parsing unified user data:', error);
        }
      }
      
      // Fallback to old method if no unified data
      console.log('🔍 senderEmail exists:', !!senderEmail, 'Value:', senderEmail);
      if (senderEmail) {
        console.log('🚀 Calling checkPlayerStatus for:', senderEmail);
        await checkPlayerStatus(senderEmail);
      } else {
        // No email, show as guest
        setUserLadderData({
          playerId: 'guest',
          name: `${playerName} ${playerLastName}`,
          firstName: playerName,
          lastName: playerLastName,
          email: null,
          fargoRate: 450,
          ladder: '499-under',
          position: 'Guest',
          immunityUntil: null,
          activeChallenges: [],
          canChallenge: false
        });
      }
    } catch (error) {
      console.error('Error loading ladder data:', error);
      // Set fallback data
      setUserLadderData({
        playerId: 'guest',
        name: `${playerName} ${playerLastName}`,
        firstName: playerName,
        lastName: playerLastName,
        email: senderEmail,
        fargoRate: 450,
        ladder: '499-under',
        position: 'Guest',
        immunityUntil: null,
        activeChallenges: [],
        canChallenge: false
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    // Use the same hardcoded locations as the League app
    setAvailableLocations([
      'Legends Brews & Cues',
      'Antiques',
      'Rac m',
      'Westside Billiards',
      'Bijou Billiards',
      'Crooked Cue',
      'Back on the Boulevard',
      'Main Street Tavern',
      'Murray Street Darts',
      'My House'
    ]);
  };

  const checkPlayerStatus = async (email) => {
    try {
      console.log('🔍 Checking player status for email:', email);
      const response = await fetch(`${BACKEND_URL}/api/ladder/player-status/${email}`);
      const status = await response.json();
      
      console.log('📋 Player status response:', status);
      setPlayerStatus(status);
      
      // Also fetch the complete user profile data
      const userResponse = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(email)}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user = userData.user || userData;
        setPlayerInfo(user);
      }
      
      if (status.isLadderPlayer) {
        // Player has ladder account
        setUserLadderData({
          playerId: 'ladder',
          name: `${status.ladderInfo.firstName} ${status.ladderInfo.lastName}`,
          firstName: status.ladderInfo.firstName,
          lastName: status.ladderInfo.lastName,
          email: email,
          fargoRate: status.ladderInfo.fargoRate,
          ladder: status.ladderInfo.ladderName,
          position: status.ladderInfo.position,
          immunityUntil: status.ladderInfo.immunityUntil,
          activeChallenges: [],
          canChallenge: status.ladderInfo.isActive,
          stats: status.ladderInfo.stats
        });
        
        // Don't automatically switch - let user choose which ladder to view
        // setSelectedLadder(status.ladderInfo.ladderName);
      } else if (status.isLeaguePlayer) {
        // League player but no ladder account - can claim
        setUserLadderData({
          playerId: 'league',
          name: `${status.leagueInfo.firstName} ${status.leagueInfo.lastName}`,
          firstName: status.leagueInfo.firstName,
          lastName: status.leagueInfo.lastName,
          email: email,
          fargoRate: 450,
          ladder: '499-under',
          position: 'League Player - Claim Account',
          immunityUntil: null,
          activeChallenges: [],
          canChallenge: false,
          needsClaim: true
        });
      } else {
        // Not recognized - not in league system
        setUserLadderData({
          playerId: 'unknown',
          name: `${playerName} ${playerLastName}`,
          firstName: playerName,
          lastName: playerLastName,
          email: email,
          fargoRate: 450,
          ladder: '499-under',
          position: 'Not Recognized',
          immunityUntil: null,
          activeChallenges: [],
          canChallenge: false
        });
      }
    } catch (error) {
      console.error('Error checking player status:', error);
    }
  };

    const handleClaimAccount = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!claimFormData.firstName || !claimFormData.lastName) {
      alert('Please enter both first and last name');
      return;
    }
    
         // Allow name-only access for ladder players who don't have email/PIN
     if (!claimFormData.email && !claimFormData.pin) {
       // This will be handled by the backend - it will check if the name matches a ladder player
       console.log('Attempting name-only access for ladder player');
     }
     
    setClaiming(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/claim-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimFormData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message with player type
        const message = `Access granted!\n\nYou are recognized as a ${result.message}.\n\nYou now have access to both league and ladder systems.\n\nThe system will automatically show the appropriate features for your player type.`;
        alert(message);
        
                 // Update the user ladder data based on the response
         if (result.playerInfo) {
                       setUserLadderData({
              playerId: result.playerType,
              name: `${result.playerInfo.firstName} ${result.playerInfo.lastName}`,
              firstName: result.playerInfo.firstName,
              lastName: result.playerInfo.lastName,
              email: result.playerInfo.email,
              fargoRate: result.ladderInfo?.fargoRate || 450,
              ladder: result.ladderInfo?.ladderName || '499-under',
              position: result.ladderInfo?.position || result.message,
              immunityUntil: result.ladderInfo?.immunityUntil || null,
              activeChallenges: [],
              canChallenge: result.ladderInfo?.isActive || false,
              stats: result.ladderInfo?.stats || { wins: 0, losses: 0 },
              needsClaim: false
            });
           
           // Fetch the complete user profile data
           if (result.playerInfo.email) {
             const userResponse = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(result.playerInfo.email)}`);
             if (userResponse.ok) {
               const userData = await userResponse.json();
               const user = userData.user || userData;
               setPlayerInfo(user);
             }
           }
         }
        
                 // Close the claim form
         setShowClaimFormState(false);
        setClaimFormData({ firstName: '', lastName: '', email: '', pin: '' });
        
        // If this is a guest user, trigger login success to give them full access
        if (!senderEmail && result.playerInfo) {
          // Trigger the login success callback to give user full access
          // This will update the parent component and give access to both apps
          const loginSuccessEvent = new CustomEvent('ladderLoginSuccess', {
            detail: {
              name: `${result.playerInfo.firstName} ${result.playerInfo.lastName}`,
              email: result.playerInfo.email,
              pin: result.playerInfo.pin || '',
              userType: result.playerType
            }
          });
          window.dispatchEvent(loginSuccessEvent);
        }
      } else if (result.requiresApproval) {
        // Player found but requires admin approval
        setRequiresApproval(true);
        setPlayerInfo(result.playerInfo);
        setApplicationFormData({
          firstName: result.playerInfo.firstName,
          lastName: result.playerInfo.lastName,
          email: '',
          phone: ''
        });
                 setShowClaimFormState(false);
        setShowApplicationForm(true);
      } else {
        alert(result.error || 'Failed to access account');
      }
    } catch (error) {
      console.error('Error accessing account:', error);
      alert('Failed to access account');
    } finally {
      setClaiming(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!applicationFormData.email) {
      alert('Please enter your email address');
      return;
    }
    
    setSubmittingApplication(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ladder/apply-for-existing-ladder-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationFormData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Application submitted successfully!\n\nYou are recognized as ${applicationFormData.firstName} ${applicationFormData.lastName}, Position ${result.playerInfo.position} in the ${result.playerInfo.ladderName} ladder.\n\nAn admin will review your application and approve your access. You will be contacted at ${applicationFormData.email} once approved.`);
        
        // Close the application form
        setShowApplicationForm(false);
        setApplicationFormData({ firstName: '', lastName: '', email: '', phone: '' });
        setRequiresApproval(false);
        setPlayerInfo(null);
      } else {
        alert(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application');
    } finally {
      setSubmittingApplication(false);
    }
  };



  const navigateToView = (view) => {
    setCurrentView(view);
  };

  const handleOpenProfileModal = async () => {
    // Refresh user data before opening the modal
    if (senderEmail) {
      try {
        const userResponse = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(senderEmail)}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.user || userData;
          setPlayerInfo(user);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
    setShowProfileModal(true);
  };

  // Challenge system functions
  const loadChallenges = async () => {
    if (!senderEmail) return;
    
    try {
      // Load pending challenges (received)
      const pendingResponse = await fetch(`${BACKEND_URL}/api/ladder/challenges/pending/${encodeURIComponent(senderEmail)}`);
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingChallenges(pendingData);
      }
      
      // Load sent challenges
      const sentResponse = await fetch(`${BACKEND_URL}/api/ladder/challenges/sent/${encodeURIComponent(senderEmail)}`);
      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        setSentChallenges(sentData);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const handleChallengePlayer = (defender, type = 'challenge') => {
    setSelectedDefender(defender);
    setChallengeType(type);
    setShowChallengeModal(true);
  };

  const handleSmartMatch = () => {
    console.log('🧠 Smart Match clicked');
    console.log('📊 Current ladder data:', ladderData);
    console.log('👤 User ladder data:', userLadderData);
    console.log('🎯 Available defenders:', ladderData.filter(player => player.email && player.email !== userLadderData?.email));
    setShowSmartMatchModal(true);
  };

  const handleChallengeComplete = (result) => {
    // Refresh challenges and ladder data
    loadChallenges();
    loadData();
  };

  const handleChallengeResponse = (response, result) => {
    // Refresh challenges and ladder data
    loadChallenges();
    loadData();
  };

  const handleViewChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeConfirmModal(true);
  };

       const renderClaimAccountForm = () => {
    return (
             <div className="claim-account-modal">
         <div className="claim-account-content">
                      <h3>First Time User Application</h3>
                       <p>If you're a new user who wants to join the ladder system, please fill out this form. Your application will be sent to admin for approval. Existing users should use the login form above.</p>
         
         <form onSubmit={handleClaimAccount}>
                        <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                value={claimFormData.firstName || ''}
                onChange={(e) => setClaimFormData({...claimFormData, firstName: e.target.value})}
                placeholder="Enter your first name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={claimFormData.lastName || ''}
                onChange={(e) => setClaimFormData({...claimFormData, lastName: e.target.value})}
                placeholder="Enter your last name"
                required
              />
            </div>
            
                                                   <div className="form-group">
                <label>Email Address: *</label>
                <input
                  type="email"
                  value={claimFormData.email || ''}
                  onChange={(e) => setClaimFormData({...claimFormData, email: e.target.value})}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number (Optional):</label>
                <input
                  type="tel"
                  value={claimFormData.phone || ''}
                  onChange={(e) => setClaimFormData({...claimFormData, phone: e.target.value})}
                  placeholder="Enter your phone number (optional)"
                />
              </div>
           
                                               <div className="form-actions">
                          <button type="submit" disabled={claiming} className="claim-btn">
                {claiming ? 'Submitting...' : 'Submit Application'}
              </button>
                        <button 
               type="button" 
               onClick={() => setShowClaimFormState(false)}
             className="cancel-btn"
           >
             Cancel
           </button>
         </div>
       </form>
     </div>
   </div>
 );
 };

 const renderApplicationForm = () => {
   return (
     <div className="claim-account-modal">
       <div className="claim-account-content">
         <h3>Admin Approval Required</h3>
         <p>We found you in our ladder system! You are <strong>{playerInfo?.firstName} {playerInfo?.lastName}</strong>, Position {playerInfo?.position} in the {playerInfo?.ladderName} ladder.</p>
         <p>To access your account, please provide your email and optional phone number for admin approval.</p>
         
         <form onSubmit={handleSubmitApplication}>
           <div className="form-group">
             <label>First Name:</label>
             <input
               type="text"
               value={applicationFormData.firstName || ''}
               disabled
               style={{ backgroundColor: '#f0f0f0', color: '#666' }}
             />
           </div>
           
           <div className="form-group">
             <label>Last Name:</label>
             <input
               type="text"
               value={applicationFormData.lastName || ''}
               disabled
               style={{ backgroundColor: '#f0f0f0', color: '#666' }}
             />
           </div>
           
           <div className="form-group">
             <label>Email Address: *</label>
             <input
               type="email"
               value={applicationFormData.email || ''}
               onChange={(e) => setApplicationFormData({...applicationFormData, email: e.target.value})}
               placeholder="Enter your email address"
               required
             />
           </div>
           
           <div className="form-group">
             <label>Phone Number (Optional):</label>
             <input
               type="tel"
               value={applicationFormData.phone || ''}
               onChange={(e) => setApplicationFormData({...applicationFormData, phone: e.target.value})}
               placeholder="Enter your phone number (optional)"
             />
           </div>
           
           <div className="form-actions">
             <button type="submit" disabled={submittingApplication} className="claim-btn">
               {submittingApplication ? 'Submitting...' : 'Submit Application'}
             </button>
             <button 
               type="button" 
               onClick={() => {
                 setShowApplicationForm(false);
                 setRequiresApproval(false);
                 setPlayerInfo(null);
                 setApplicationFormData({ firstName: '', lastName: '', email: '', phone: '' });
               }}
               className="cancel-btn"
             >
               Cancel
             </button>
           </div>
         </form>
       </div>
     </div>
   );
 };

  const renderLadderView = () => {
    const getLadderDisplayName = (ladderName) => {
      switch (ladderName) {
        case '499-under': return '499 & Under';
        case '500-549': return '500-549';
        case '550-plus': return '550+';
        default: return ladderName;
      }
    };

    return (
      <div className="ladder-view">
        <div className="ladder-header-section">
          <h2>{getLadderDisplayName(selectedLadder)} Ladder</h2>
          <p>Current rankings and positions</p>
          
          {/* Ladder Selector */}
          <div className="ladder-selector" style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <label style={{ color: '#fff', fontWeight: 'bold' }}>Select Ladder:</label>
            <select 
              value={selectedLadder} 
              onChange={(e) => setSelectedLadder(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="499-under">499 & Under</option>
              <option value="500-549">500-549</option>
              <option value="550-plus">550+</option>
            </select>
          </div>
        </div>
        
        <div className="ladder-table">
          <div className="table-header">
            <div className="header-cell">Rank</div>
            <div className="header-cell">Player</div>
            <div className="header-cell">FargoRate</div>
            <div className="header-cell">W</div>
            <div className="header-cell">L</div>
            <div className="header-cell">Status</div>
          </div>
          
          {ladderData.map((player, index) => (
            <div key={player._id || index} className="table-row">
              <div className="table-cell rank">#{player.position}</div>
              <div className="table-cell name">
                {player.firstName} {player.lastName}
                {!player.email && <span className="no-account">*</span>}
                {userLadderData?.canChallenge && player.email && userLadderData.email !== player.email && (
                  <div style={{ marginTop: '4px' }}>
                    <button
                      onClick={() => handleChallengePlayer(player, 'challenge')}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        marginRight: '4px'
                      }}
                    >
                      Challenge
                    </button>
                    <button
                      onClick={() => handleChallengePlayer(player, 'smackdown')}
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      SmackDown
                    </button>
                  </div>
                )}
              </div>
              <div className="table-cell fargo">{player.fargoRate === 0 ? "No FargoRate" : player.fargoRate}</div>
              <div className="table-cell wins">{player.wins || 0}</div>
              <div className="table-cell losses">{player.losses || 0}</div>
              <div className="table-cell status">
                {!player.isActive ? (
                  <span className="inactive">Inactive</span>
                ) : player.immunityUntil && new Date(player.immunityUntil) > new Date() ? (
                  <span className="immune">Immune</span>
                ) : (
                  <span className="active">Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="ladder-legend">
          <p><span className="no-account">*</span> = Account not claimed yet</p>
          <p>Players can claim their accounts to participate in challenges</p>
          <p><strong>Anyone can view the ladder - no account required!</strong></p>
          
          {!userLadderData?.canChallenge && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              color: '#ffc107'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🔒 Challenge Features Locked</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                To challenge other players, you need to login with your ladder account.
              </p>
              <button 
                onClick={() => setShowClaimFormState(true)}
                style={{
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Login to Challenge
              </button>
            </div>
          )}
        </div>
        
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back to Main Menu
        </button>
      </div>
    );
  };

  const renderChallengesView = () => {
    return (
      <div className="challenges-view">
        <div className="challenges-header-section">
          <h2>My Challenges</h2>
          <p>Manage your challenges and responses</p>
        </div>
        
        {/* Pending Challenges (Received) */}
        <div className="challenges-section">
          <h3 style={{ color: '#ff4444', marginBottom: '16px' }}>
            Pending Challenges ({pendingChallenges.length})
          </h3>
          
          {pendingChallenges.length === 0 ? (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              color: '#ccc'
            }}>
              No pending challenges to respond to.
            </div>
          ) : (
            <div className="challenges-list">
              {pendingChallenges.map((challenge) => (
                <div key={challenge._id} className="challenge-card">
                  <div className="challenge-header">
                    <h4>{challenge.challenger.firstName} {challenge.challenger.lastName} vs {challenge.defender.firstName} {challenge.defender.lastName}</h4>
                    <span className={`challenge-type challenge-${challenge.challengeType}`}>
                      {challenge.challengeType.charAt(0).toUpperCase() + challenge.challengeType.slice(1)} Match
                    </span>
                  </div>
                  
                  <div className="challenge-details">
                    <p><strong>Entry Fee:</strong> ${challenge.matchDetails.entryFee}</p>
                    <p><strong>Race Length:</strong> {challenge.matchDetails.raceLength}</p>
                    <p><strong>Game Type:</strong> {challenge.matchDetails.gameType}</p>
                    <p><strong>Location:</strong> {challenge.matchDetails.location}</p>
                    <p><strong>Expires:</strong> {new Date(challenge.deadline).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="challenge-actions">
                    <button
                      onClick={() => handleViewChallenge(challenge)}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Respond to Challenge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sent Challenges */}
        <div className="challenges-section">
          <h3 style={{ color: '#ffc107', marginBottom: '16px' }}>
            Sent Challenges ({sentChallenges.length})
          </h3>
          
          {sentChallenges.length === 0 ? (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              color: '#ccc'
            }}>
              No sent challenges to display.
            </div>
          ) : (
            <div className="challenges-list">
              {sentChallenges.map((challenge) => (
                <div key={challenge._id} className="challenge-card">
                  <div className="challenge-header">
                    <h4>{challenge.challenger.firstName} {challenge.challenger.lastName} vs {challenge.defender.firstName} {challenge.defender.lastName}</h4>
                    <span className={`challenge-type challenge-${challenge.challengeType}`}>
                      {challenge.challengeType.charAt(0).toUpperCase() + challenge.challengeType.slice(1)} Match
                    </span>
                  </div>
                  
                  <div className="challenge-details">
                    <p><strong>Status:</strong> <span className={`status-${challenge.status}`}>{challenge.status}</span></p>
                    <p><strong>Entry Fee:</strong> ${challenge.matchDetails.entryFee}</p>
                    <p><strong>Race Length:</strong> {challenge.matchDetails.raceLength}</p>
                    <p><strong>Game Type:</strong> {challenge.matchDetails.gameType}</p>
                    <p><strong>Location:</strong> {challenge.matchDetails.location}</p>
                    <p><strong>Expires:</strong> {new Date(challenge.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back to Main Menu
        </button>
      </div>
    );
  };

  const renderAllLaddersView = () => {
    const [allLaddersData, setAllLaddersData] = useState({});
    const [loadingAll, setLoadingAll] = useState(true);

    useEffect(() => {
      const loadAllLadders = async () => {
        try {
          setLoadingAll(true);
          const ladders = ['499-under', '500-549', '550-plus'];
          const data = {};
          
          for (const ladder of ladders) {
            const response = await fetch(`${BACKEND_URL}/api/ladder/ladders/${ladder}/players`);
            const result = await response.json();
            data[ladder] = Array.isArray(result) ? result : [];
          }
          
          setAllLaddersData(data);
        } catch (error) {
          console.error('Error loading all ladders:', error);
        } finally {
          setLoadingAll(false);
        }
      };
      
      loadAllLadders();
    }, []);

    const getLadderDisplayName = (ladderName) => {
      switch (ladderName) {
        case '499-under': return '499 & Under';
        case '500-549': return '500-549';
        case '550-plus': return '550+';
        default: return ladderName;
      }
    };

    if (loadingAll) {
      return (
        <div className="ladder-view">
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ccc' }}>
            <div className="loading-spinner"></div>
            <p>Loading all ladders...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="ladder-view">
        <div className="ladder-header-section">
          <h2>All Ladder Divisions</h2>
          <p>Browse all three ladder divisions</p>
        </div>
        
        <div style={{ display: 'grid', gap: '2rem' }}>
          {['499-under', '500-549', '550-plus'].map((ladderName) => (
            <div key={ladderName} style={{
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 1rem 0',
                fontSize: '1.5rem',
                textAlign: 'center'
              }}>
                {getLadderDisplayName(ladderName)} Ladder
              </h3>
              
              <div className="ladder-table">
                <div className="table-header">
                  <div className="header-cell">Rank</div>
                  <div className="header-cell">Player</div>
                  <div className="header-cell">FargoRate</div>
                  <div className="header-cell">W</div>
                  <div className="header-cell">L</div>
                  <div className="header-cell">Status</div>
                </div>
                
                {allLaddersData[ladderName]?.map((player, index) => (
                  <div key={player._id || index} className="table-row">
                    <div className="table-cell rank">#{player.position}</div>
                    <div className="table-cell name">
                      {player.firstName} {player.lastName}
                      {!player.email && <span className="no-account">*</span>}
                    </div>
                    <div className="table-cell fargo">{player.fargoRate === 0 ? "No FargoRate" : player.fargoRate}</div>
                    <div className="table-cell wins">{player.wins || 0}</div>
                    <div className="table-cell losses">{player.losses || 0}</div>
                    <div className="table-cell status">
                      {!player.isActive ? (
                        <span className="inactive">Inactive</span>
                      ) : player.immunityUntil && new Date(player.immunityUntil) > new Date() ? (
                        <span className="immune">Immune</span>
                      ) : (
                        <span className="active">Active</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!allLaddersData[ladderName] || allLaddersData[ladderName].length === 0) && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#ccc',
                    fontStyle: 'italic'
                  }}>
                    No players in this ladder yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={() => setCurrentView('main')} className="back-btn">
          ← Back to Main Menu
        </button>
      </div>
    );
  };



  const renderMainView = () => {
    return (
      <>

        
        {/* User Status Card */}
        <div className="user-status-card">
          <div className="status-info">
            <h3>Your Ladder Status</h3>
            <div className="status-details">
              <div className="status-item">
                <span className="label">Ladder:</span>
                <span className="value">{userLadderData?.ladder === '499-under' ? '499 & Under' : 
                  userLadderData?.ladder === '500-549' ? '500-549' : '550+'}</span>
              </div>
              <div className="status-item">
                <span className="label">Position:</span>
                <span className="value">{userLadderData?.position}</span>
              </div>
              <div className="status-item">
                <span className="label">FargoRate:</span>
                <span className="value">{userLadderData?.fargoRate === 0 ? "No FargoRate" : userLadderData?.fargoRate}</span>
              </div>
              {userLadderData?.immunityUntil && (
                <div className="status-item immunity">
                  <span className="label">Immunity Until:</span>
                  <span className="value">{new Date(userLadderData.immunityUntil).toLocaleDateString()}</span>
                </div>
              )}
              {userLadderData?.needsClaim && (
                <div className="status-item claim-notice">
                  <span className="label">Account Status:</span>
                  <span className="value">League Player - Claim your ladder account to participate!</span>
                </div>
              )}
                             {userLadderData?.playerId === 'unknown' && (
                 <div className="status-item unknown-notice">
                   <span className="label">Account Status:</span>
                   <span className="value">Not recognized - Apply for ladder access below</span>
                 </div>
               )}
            </div>
            
                         {/* Claim Account Button for League Players */}
                            {userLadderData?.needsClaim && (
                 <div className="claim-account-section">
                   <button 
                     onClick={() => setShowClaimFormState(true)}
                     className="claim-account-btn"
                   >
                     Login to Access Hub
                   </button>
                   <p className="claim-info">
                     Enter your name and email OR PIN to login and access both league and ladder systems
                   </p>
                 </div>
               )}
             
             {/* Apply for Ladder Button for Unknown Players */}
             {userLadderData?.playerId === 'unknown' && (
               <div className="claim-account-section">
                 <button 
                   onClick={() => navigate('/ladder/signup')}
                   className="claim-account-btn"
                 >
                   Apply for Ladder Access
                 </button>
                 <p className="claim-info">
                   Submit an application to join the ladder system
                 </p>
               </div>
             )}
          </div>
        </div>

                 {/* Main Navigation */}
         <div className="ladder-navigation">
           <div className="nav-grid">
             <div className="nav-card" onClick={() => navigateToView('ladders')}>
               <div className="nav-icon">📊</div>
               <h3>View Ladders</h3>
               <p>See all ladder positions and rankings</p>
             </div>
             
                           <div className="nav-card" onClick={() => navigateToView('all-ladders')}>
                <div className="nav-icon">🏆</div>
                <h3>All Ladders</h3>
                <p>View all three ladder divisions at once</p>
              </div>
              
              <div className="nav-card" onClick={() => setShowPrizePoolModal(true)}>
                <div className="nav-icon">💰</div>
                <h3>Prize Pools</h3>
                <p>View current prize pools and winners</p>
              </div>
              
              <div className="nav-card" onClick={() => setShowMatchReportingModal(true)}>
                <div className="nav-icon">🏓</div>
                <h3>Report Match</h3>
                <p>Report match results and pay fees</p>
              </div>
             
             {userLadderData?.canChallenge && (
               <>
                 <div className="nav-card" onClick={handleSmartMatch}>
                   <div className="nav-icon">🧠</div>
                   <h3>Smart Match</h3>
                   <p>AI-powered challenge suggestions</p>
                 </div>
                 
                 <div className="nav-card" onClick={() => setCurrentView('challenges')}>
                   <div className="nav-icon">⚔️</div>
                   <h3>My Challenges</h3>
                   <p>Manage your challenges and responses</p>
                   {pendingChallenges.length > 0 && (
                     <div style={{
                       position: 'absolute',
                       top: '-8px',
                       right: '-8px',
                       background: '#ff4444',
                       color: 'white',
                       borderRadius: '50%',
                       width: '24px',
                       height: '24px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: '0.8rem',
                       fontWeight: 'bold'
                     }}>
                       {pendingChallenges.length}
                     </div>
                   )}
                 </div>
               </>
             )}
             
             {!userLadderData?.canChallenge && userLadderData?.playerId !== 'guest' && (
               <div className="nav-card" style={{ 
                 background: 'rgba(255, 193, 7, 0.1)', 
                 border: '1px solid rgba(255, 193, 7, 0.3)',
                 cursor: 'default'
               }}>
                 <div className="nav-icon">🔒</div>
                 <h3>Challenge Features</h3>
                 <p>Login to access Smart Match and challenge other players</p>
                 <button 
                   onClick={() => setShowClaimFormState(true)}
                   style={{
                     background: '#ff4444',
                     color: 'white',
                     border: 'none',
                     borderRadius: '6px',
                     padding: '8px 16px',
                     marginTop: '8px',
                     cursor: 'pointer',
                     fontSize: '0.9rem'
                   }}
                 >
                   Login Now
                 </button>
               </div>
             )}
             
             {userLadderData?.playerId === 'ladder' && (
               <div className="nav-card" onClick={() => navigateToView('matches')}>
                 <div className="nav-icon">🎯</div>
                 <h3>My Matches</h3>
                 <p>View your active and past matches</p>
               </div>
             )}
             
             <div className="nav-card" onClick={() => setShowRulesModal(true)}>
               <div className="nav-icon">📋</div>
               <h3>Ladder Rules</h3>
               <p>Read the complete ladder rules</p>
             </div>
             
             <div className="nav-card" onClick={handleOpenProfileModal}>
               <div className="nav-icon">👤</div>
               <h3>My Profile</h3>
               <p>Edit your challenge availability and locations</p>
             </div>
             
             {/* Admin Buttons */}
             {isAdmin && (
               <>
                 <div className="nav-card admin-card" onClick={() => setShowApplicationsManager(true)}>
                   <div className="nav-icon">📋</div>
                   <h3>Applications</h3>
                   <p>Review ladder signup applications</p>
                 </div>
                 <div className="nav-card admin-card" onClick={() => navigate('/ladder/admin')}>
                   <div className="nav-icon">⚙️</div>
                   <h3>Ladder Admin</h3>
                   <p>Manage ladder players and settings</p>
                 </div>
               </>
             )}
           </div>
         </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="ladder-app-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading ladder data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ladder-app-container">
      {/* Header */}
       <div className="ladder-header" style={{ flexDirection: 'column', textAlign: 'center' }}>
         <div className="ladder-title">
           <h1>Ladder of Legends</h1>
           <p>Tournament Series - Challenge-based ladder system with rankings</p>
         </div>
         
         {/* Back to Ladder Home Button */}
         {currentView !== 'main' && (
           <button 
             onClick={() => setCurrentView('main')}
             style={{
               background: 'linear-gradient(135deg, #e53e3e, #c53030)',
               color: 'white',
               border: 'none',
               borderRadius: '8px',
               padding: '8px 16px',
               fontSize: '0.9rem',
               fontWeight: '600',
               cursor: 'pointer',
               transition: 'all 0.2s ease',
               boxShadow: '0 2px 8px rgba(229, 62, 62, 0.3)',
               marginTop: '1rem'
             }}
             onMouseEnter={(e) => {
               e.target.style.background = 'linear-gradient(135deg, #c53030, #a52a2a)';
               e.target.style.transform = 'translateY(-1px)';
               e.target.style.boxShadow = '0 4px 12px rgba(229, 62, 62, 0.4)';
             }}
             onMouseLeave={(e) => {
               e.target.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
               e.target.style.transform = 'translateY(0)';
               e.target.style.boxShadow = '0 2px 8px rgba(229, 62, 62, 0.3)';
             }}
           >
             🏠 Back to Ladder Home
           </button>
         )}
       </div>

      {/* Main Content */}
              {currentView === 'ladders' && renderLadderView()}
        {currentView === 'challenges' && renderChallengesView()}
        {currentView === 'all-ladders' && renderAllLaddersView()}
      {currentView === 'challenge' && renderChallengeView()}
      {currentView === 'matches' && renderMatchesView()}
      {currentView === 'main' && renderMainView()}

      {/* Footer */}
      <div className="ladder-footer">
        <p>Challenge your way to the top! 🏆</p>
      </div>

             {/* Claim Account Modal */}
       {showClaimFormState && renderClaimAccountForm()}

       {/* Application Form Modal */}
       {showApplicationForm && renderApplicationForm()}

               {/* Applications Manager Modal */}
        {showApplicationsManager && (
          <LadderApplicationsManager onClose={() => setShowApplicationsManager(false)} />
        )}

      {/* Ladder of Legends Rules Modal */}
      <LadderOfLegendsRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        isMobile={false}
      />

             {/* Ladder Profile Modal */}
       <LadderProfileModal
         isOpen={showProfileModal}
         onClose={() => setShowProfileModal(false)}
         currentUser={playerInfo ? {
           ...playerInfo,
           // Map availability to ladderAvailability for the modal
           ladderAvailability: playerInfo.availability || {},
           ladderLocations: playerInfo.locations || ''
         } : {
           firstName: playerName,
           lastName: playerLastName,
           email: senderEmail,
           phone: '',
           preferredContacts: [],
           ladderAvailability: {},
           ladderLocations: ''
         }}
         isMobile={false}
         onUserUpdate={(updatedUser) => {
           // Update local player info if needed
           setPlayerInfo(prev => ({ ...prev, ...updatedUser }));
         }}
         availableLocations={availableLocations}
       />

      {/* Challenge System Modals */}
      {showChallengeModal && selectedDefender && (
        <LadderChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          challenger={userLadderData}
          defender={selectedDefender}
          challengeType={challengeType}
          onChallengeComplete={handleChallengeComplete}
        />
      )}

      {showChallengeConfirmModal && selectedChallenge && (
        <LadderChallengeConfirmModal
          isOpen={showChallengeConfirmModal}
          onClose={() => setShowChallengeConfirmModal(false)}
          challenge={selectedChallenge}
          currentUser={userLadderData}
          onChallengeResponse={handleChallengeResponse}
        />
      )}

             {showSmartMatchModal && (
         <LadderSmartMatchModal
           isOpen={showSmartMatchModal}
           onClose={() => setShowSmartMatchModal(false)}
           challenger={userLadderData}
           availableDefenders={ladderData.filter(player => player.email && player.email !== userLadderData?.email)}
           onChallengeComplete={handleChallengeComplete}
         />
       )}
       
       {showPrizePoolModal && (
         <LadderPrizePoolModal
           isOpen={showPrizePoolModal}
           onClose={() => setShowPrizePoolModal(false)}
           selectedLadder={selectedLadder}
         />
       )}
       
       {showMatchReportingModal && (
         <LadderMatchReportingModal
           isOpen={showMatchReportingModal}
           onClose={() => setShowMatchReportingModal(false)}
           playerName={`${playerName} ${playerLastName}`}
           selectedLadder={selectedLadder}
           onMatchReported={(matchData) => {
             // Refresh ladder data after match is reported
             loadData();
             loadChallenges();
           }}
         />
       )}
        
     </div>
   );
 };

export default LadderApp;
