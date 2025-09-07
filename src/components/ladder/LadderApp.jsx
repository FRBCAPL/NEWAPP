import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { BACKEND_URL } from '../../config.js';
import LadderApplicationsManager from '../admin/LadderApplicationsManager';
import DraggableModal from '../modal/DraggableModal';
import LadderOfLegendsRulesModal from '../modal/LadderOfLegendsRulesModal';
import LadderFloatingLogos from './LadderFloatingLogos';

import LadderChallengeModal from './LadderChallengeModal';
import LadderChallengeConfirmModal from './LadderChallengeConfirmModal';
import LadderSmartMatchModal from './LadderSmartMatchModal';
import LadderPrizePoolTracker from './LadderPrizePoolTracker';
import LadderPrizePoolModal from './LadderPrizePoolModal';
import LadderMatchReportingModal from './LadderMatchReportingModal';
import PaymentDashboard from './PaymentDashboard';
import './LadderApp.css';

const LadderApp = ({ 
  playerName, 
  playerLastName, 
  senderEmail, 
  userPin, 
  userType,
  isAdmin = false,
  showClaimForm = false,
  initialView = 'main',
  isPublicView = false,
  onClaimLadderPosition,
  claimedPositions = new Set(),
  isPositionClaimed = () => false
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
  const [hasManuallySelectedLadder, setHasManuallySelectedLadder] = useState(false);

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
  const [scheduledMatches, setScheduledMatches] = useState([]);
  const [showPrizePoolModal, setShowPrizePoolModal] = useState(false);
  const [showMatchReportingModal, setShowMatchReportingModal] = useState(false);
  const [showPaymentDashboard, setShowPaymentDashboard] = useState(false);
  
  // Mobile player stats state
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState(null);
  const [showMobilePlayerStats, setShowMobilePlayerStats] = useState(false);
  const [lastMatchData, setLastMatchData] = useState(null);
  const [playerMatchHistory, setPlayerMatchHistory] = useState([]);
  const [showFullMatchHistory, setShowFullMatchHistory] = useState(false);
  const [updatedPlayerData, setUpdatedPlayerData] = useState(null);
  
  // My Matches state
  const [playerMatches, setPlayerMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  


  useEffect(() => {
    // Load user's ladder data and ladder rankings
    loadData();
    loadLocations();
    loadChallenges();
    loadProfileData();
  }, [selectedLadder]);

  // Load matches when matches view is accessed
  useEffect(() => {
    if (currentView === 'matches') {
      loadPlayerMatches();
    }
  }, [currentView, userLadderData?.email]);

  // Load challenges when challenges view is accessed
  useEffect(() => {
    if (currentView === 'challenges') {
      loadChallenges();
    }
  }, [currentView, userLadderData?.email, selectedLadder]);

  // Auto-update selectedLadder when userLadderData changes (only initially)
  useEffect(() => {
    if (userLadderData && userLadderData.ladder && userLadderData.ladder !== 'Guest' && userLadderData.ladder !== 'League Player - Claim Account' && userLadderData.ladder !== 'Not Recognized') {
      // Only set the ladder if it hasn't been manually changed yet
      if (selectedLadder === '499-under' && !hasManuallySelectedLadder) {
        console.log('🔄 Setting selectedLadder to user ladder:', userLadderData.ladder);
        setSelectedLadder(userLadderData.ladder);
      }
    }
  }, [userLadderData]); // Remove selectedLadder from dependencies to prevent infinite loop

  // Load profile data from SimpleProfile
  const loadProfileData = async () => {
    if (!senderEmail) return;
    
    console.log('Loading profile data for email:', senderEmail);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/profile-data?email=${encodeURIComponent(senderEmail)}&appType=ladder&t=${Date.now()}`);
      console.log('Profile data response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded profile data:', data);
        
        if (data.success && data.profile) {
          const newPlayerInfo = {
            firstName: playerName,
            lastName: playerLastName,
            email: senderEmail,
            phone: '',
            preferredContacts: [],
            locations: data.profile.locations || '',
            availability: data.profile.availability || {}
          };
          console.log('Setting new playerInfo:', newPlayerInfo);
          console.log('playerInfo.locations:', newPlayerInfo.locations);
          setPlayerInfo(newPlayerInfo);
        } else {
          console.log('No profile data found, setting default playerInfo');
          setPlayerInfo({
            firstName: playerName,
            lastName: playerLastName,
            email: senderEmail,
            phone: '',
            preferredContacts: [],
            locations: '',
            availability: {}
          });
        }
      } else {
        console.log('Profile data response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

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
              canChallenge: ladderProfile.isActive && !!userData.unifiedAccount?.hasUnifiedAccount,
              unifiedAccount: userData.unifiedAccount, // Add the unified account information
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
      
      // Note: Only use ladder-specific data in LadderApp to maintain separation from league data
      
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
          canChallenge: status.ladderInfo.isActive && !!status.unifiedAccount?.hasUnifiedAccount,
          unifiedAccount: status.unifiedAccount, // Add the unified account information
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
              canChallenge: (result.ladderInfo?.isActive || false) && !!result.unifiedAccount?.hasUnifiedAccount,
              stats: result.ladderInfo?.stats || { wins: 0, losses: 0 },
              needsClaim: false
            });
           
           // Note: Use only ladder-specific data to maintain separation from league data
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



  // Challenge eligibility rules based on ladder position
  const canChallengePlayer = (challenger, defender) => {
    // Debug: Log the ladder values being compared
    console.log(`🔍 Ladder comparison: Challenger ${challenger.firstName} ${challenger.lastName} ladder="${challenger.ladder}", Defender ${defender.firstName} ${defender.lastName} ladderName="${defender.ladderName}"`);
    
    // Debug: Log unified account status for challenger and defender
    console.log(`🔍 Challenger unifiedAccount:`, challenger.unifiedAccount);
    console.log(`🔍 Defender unifiedAccount:`, defender.unifiedAccount);
    console.log(`🔍 Challenger canChallenge:`, challenger.canChallenge);
    console.log(`🔍 Defender hasUnifiedAccount:`, defender.unifiedAccount?.hasUnifiedAccount);
    
    // Both players must be on the same ladder
    // Note: challenger.ladder is the user's ladder, defender.ladderName is the player's ladder
    if (challenger.ladder !== defender.ladderName) {
      console.log(`🚫 Challenge blocked: ${challenger.firstName} ${challenger.lastName} (${challenger.ladder}) cannot challenge ${defender.firstName} ${defender.lastName} (${defender.ladderName}) - Different ladder`);
      return false;
    }
    
    // Both players must have unified accounts
    if (!challenger.unifiedAccount?.hasUnifiedAccount || !defender.unifiedAccount?.hasUnifiedAccount) {
      console.log(`🚫 Challenge blocked: ${challenger.firstName} ${challenger.lastName} cannot challenge ${defender.firstName} ${defender.lastName} - Unified account required`);
      return false;
    }
    
    // Can't challenge yourself
    if (challenger.email === defender.unifiedAccount?.email) {
      console.log(`🚫 Challenge blocked: ${challenger.firstName} ${challenger.lastName} cannot challenge themselves`);
      return false;
    }
    
    // Can't challenge if you're not active
    if (!challenger.isActive) {
      console.log(`🚫 Challenge blocked: ${challenger.firstName} ${challenger.lastName} is not active`);
      return false;
    }
    
    // Can't challenge if defender is not active
    if (!defender.isActive) {
      console.log(`🚫 Challenge blocked: ${defender.firstName} ${defender.lastName} is not active`);
      return false;
    }
    
    // Can't challenge if defender has immunity
    if (defender.immunityUntil && new Date(defender.immunityUntil) > new Date()) {
      console.log(`🚫 Challenge blocked: ${defender.firstName} ${defender.lastName} has immunity until ${defender.immunityUntil}`);
      return false;
    }
    
    // Position-based challenge rules (following official rules):
    // - Standard Challenge: Can challenge players up to 4 positions above you
    // - SmackDown: Can challenge players no more than 5 positions below you
    const challengerPosition = challenger.position;
    const defenderPosition = defender.position;
    const positionDifference = challengerPosition - defenderPosition;
    
    // Standard Challenge: Can challenge players above you (up to 4 positions)
    if (positionDifference >= -4 && positionDifference <= 0) {
      console.log(`✅ Standard Challenge allowed: ${challenger.firstName} ${challenger.lastName} (Position ${challengerPosition}) can challenge ${defender.firstName} ${defender.lastName} (Position ${defenderPosition}) - ${Math.abs(positionDifference)} positions above`);
      return true;
    }
    
    // SmackDown: Can challenge players below you (up to 5 positions)
    if (positionDifference > 0 && positionDifference <= 5) {
      console.log(`✅ SmackDown allowed: ${challenger.firstName} ${challenger.lastName} (Position ${challengerPosition}) can challenge ${defender.firstName} ${defender.lastName} (Position ${defenderPosition}) - ${positionDifference} positions below`);
      return true;
    }
    
    console.log(`🚫 Challenge blocked: ${challenger.firstName} ${challenger.lastName} (Position ${challengerPosition}) cannot challenge ${defender.firstName} ${defender.lastName} (Position ${defenderPosition}) - Position difference ${positionDifference} is outside allowed range (-4 to +5)`);
    return false;
  };

  // Helper function to get challenge reason (for debugging)
  const getChallengeReason = (challenger, defender) => {
    if (!challenger.unifiedAccount?.hasUnifiedAccount || !defender.unifiedAccount?.hasUnifiedAccount) {
      return 'No unified account';
    }
    if (challenger.email === defender.unifiedAccount?.email) {
      return 'Same player';
    }
    if (!challenger.isActive) {
      return 'Challenger inactive';
    }
    if (!defender.isActive) {
      return 'Defender inactive';
    }
    if (defender.immunityUntil && new Date(defender.immunityUntil) > new Date()) {
      return 'Defender immune';
    }
    
    const challengerPosition = challenger.position;
    const defenderPosition = defender.position;
    const positionDifference = challengerPosition - defenderPosition;
    
    if (positionDifference < -4) {
      return `Too far above (${Math.abs(positionDifference)} positions) - Max 4 positions above allowed`;
    }
    if (positionDifference > 5) {
      return `Too far below (${positionDifference} positions) - Max 5 positions below allowed for SmackDown`;
    }
    
    return 'Eligible';
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
        // Filter out admin-created challenges (entryFee: 0 and postContent contains 'Admin')
        const filteredSentChallenges = sentData.filter(challenge => 
          !(challenge.matchDetails?.entryFee === 0 && 
            challenge.challengePost?.postContent?.toLowerCase().includes('admin'))
        );
        setSentChallenges(filteredSentChallenges);
      }
      
      // Load scheduled matches (including admin-created ones)
      const scheduledResponse = await fetch(`${BACKEND_URL}/api/ladder/front-range-pool-hub/ladders/${selectedLadder}/matches?status=scheduled`);
      if (scheduledResponse.ok) {
        const scheduledData = await scheduledResponse.json();
        // Filter to only show matches where the current user is a player
        const userScheduledMatches = scheduledData.matches?.filter(match => 
          match.player1?.email === senderEmail || match.player2?.email === senderEmail
        ) || [];
        setScheduledMatches(userScheduledMatches);
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

  const handlePlayerClick = (player) => {
    console.log('🎯 Player clicked:', player);
    console.log('📊 Setting modal state...');
    setSelectedPlayerForStats(player);
    setShowMobilePlayerStats(true);
    console.log('📊 Modal should now be visible');
    fetchLastMatchData(player);
    fetchPlayerMatchHistory(player);
    fetchUpdatedPlayerData(player);
  };

  const fetchLastMatchData = async (player) => {
    console.log('🔍 Fetching last match data for player:', player);
    console.log('🔍 Player unifiedAccount:', player.unifiedAccount);
    
    if (!player.unifiedAccount?.email) {
      console.log('🔍 No email found in unifiedAccount, trying direct email...');
      if (!player.email) {
        console.log('🔍 No email found anywhere, cannot fetch last match data');
      setLastMatchData(null);
      return;
      }
    }
    
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email for last match:', emailToUse);
    
    try {
      const url = `${BACKEND_URL}/api/ladder/matches/last-match/${encodeURIComponent(emailToUse)}`;
      console.log('🔍 Last match API URL:', url);
      
      const response = await fetch(url);
      console.log('🔍 Last match response status:', response.status);
      
      if (response.ok) {
        const matchData = await response.json();
        console.log('🔍 Last match data:', matchData);
        setLastMatchData(matchData);
      } else {
        const errorText = await response.text();
        console.error('🔍 Last match API Error:', response.status, errorText);
        setLastMatchData(null);
      }
    } catch (error) {
      console.error('Error fetching last match data:', error);
      setLastMatchData(null);
    }
  };

  const fetchPlayerMatchHistory = async (player) => {
    console.log('🔍 Fetching match history for player:', player);
    console.log('🔍 Player unifiedAccount:', player.unifiedAccount);
    
    if (!player.unifiedAccount?.email) {
      console.log('🔍 No email found in unifiedAccount, trying direct email...');
      if (!player.email) {
        console.log('🔍 No email found anywhere, cannot fetch match history');
        setPlayerMatchHistory([]);
        return;
      }
    }
    
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email:', emailToUse);
    
    try {
      const url = `${BACKEND_URL}/api/ladder/player/${encodeURIComponent(emailToUse)}/matches?limit=10`;
      console.log('🔍 API URL:', url);
      
      const response = await fetch(url);
      console.log('🔍 Response status:', response.status);
      
      if (response.ok) {
        const matches = await response.json();
        console.log('🔍 Match history data:', matches);
        setPlayerMatchHistory(matches);
      } else {
        const errorText = await response.text();
        console.error('🔍 API Error:', response.status, errorText);
        setPlayerMatchHistory([]);
      }
    } catch (error) {
      console.error('Error fetching player match history:', error);
      setPlayerMatchHistory([]);
    }
  };

  const fetchUpdatedPlayerData = async (player) => {
    console.log('🔍 Fetching updated player data for:', player);
    
    // Try to get email from player data
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email for player data:', emailToUse);
    
    if (!emailToUse) {
      console.log('🔍 No email found, using original player data');
      setUpdatedPlayerData(player);
      return;
    }
    
    try {
      // Fetch player data directly by email
      const url = `${BACKEND_URL}/api/ladder/player/${encodeURIComponent(emailToUse)}`;
      console.log('🔍 Fetching player data from:', url);
      
      const playerResponse = await fetch(url);
      console.log('🔍 Player data response status:', playerResponse.status);
      
      if (playerResponse.ok) {
        const playerData = await playerResponse.json();
        console.log('🔍 Player data received:', playerData);
        console.log('🔍 Updated wins:', playerData.wins);
        console.log('🔍 Updated losses:', playerData.losses);
        
        // Merge with original player data to preserve other properties
        const updatedPlayer = {
          ...player,
          ...playerData,
          wins: playerData.wins,
          losses: playerData.losses,
          position: playerData.position
        };
        
        setUpdatedPlayerData(updatedPlayer);
      } else {
        const errorText = await playerResponse.text();
        console.log('🔍 Failed to fetch player data:', playerResponse.status, errorText);
        setUpdatedPlayerData(player);
      }
    } catch (error) {
      console.error('Error fetching updated player data:', error);
      setUpdatedPlayerData(player);
    }
  };

  const loadPlayerMatches = async () => {
    if (!userLadderData?.email) {
      setMatchesLoading(false);
      return;
    }

    try {
      setMatchesLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/ladder/player/${encodeURIComponent(userLadderData.email)}/matches`);
      if (response.ok) {
        const matches = await response.json();
        setPlayerMatches(matches);
      } else {
        console.error('Failed to load player matches');
        setPlayerMatches([]);
      }
    } catch (error) {
      console.error('Error loading player matches:', error);
      setPlayerMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleSmartMatch = () => {
    console.log('🧠 Smart Match clicked');
    console.log('📊 Current ladder data:', ladderData);
    console.log('👤 User ladder data:', userLadderData);
    console.log('🎯 Available defenders:', ladderData.filter(player => player.unifiedAccount?.hasUnifiedAccount && player.unifiedAccount?.email !== userLadderData?.email));
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
          <h2 style={{ 
            color: '#8B5CF6',
            WebkitTextStroke: '1.5px #000000',
            textShadow: '0 0 8px rgba(139, 92, 246, 0.7)',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '2rem',
            marginBottom: '0.5rem',
            fontFamily: '"Orbitron", "Exo 2", "Rajdhani", "Arial Black", sans-serif'
          }}>{getLadderDisplayName(selectedLadder)} Ladder</h2>
          <p>Current rankings and positions</p>
          
          {/* Ladder Selector */}
          <div className="ladder-selector" style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <label style={{ 
              color: '#fff', 
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '0.9rem'
            }}>Select Ladder:</label>
            <select 
              value={selectedLadder} 
              onChange={(e) => {
                setSelectedLadder(e.target.value);
                setHasManuallySelectedLadder(true);
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minWidth: '120px',
                flexShrink: 0
              }}
            >
              <option value="499-under">499 & Under</option>
              <option value="500-549">500-549</option>
              <option value="550-plus">550+</option>
            </select>
          </div>
        </div>
        
                 <div className={`ladder-table ${!isPublicView ? 'logged-in-view' : ''}`} style={{ position: 'relative' }}>
           <div className="table-header">
             <div className="header-cell">Rank</div>
             <div className="header-cell" style={{ paddingLeft: '40px' }}>Player</div>
             <div className="header-cell">FargoRate</div>
             <div className="header-cell">W</div>
             <div className="header-cell">L</div>
             <div className="header-cell">Status</div>
             {!isPublicView && <div className="header-cell" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all', paddingLeft: '140px' }}>Last Match</div>}
           </div>
           
           {ladderData.map((player, index) => (
             <div key={player._id || index} className="table-row">
               <div className="table-cell rank">#{player.position}</div>
               <div className="table-cell name">
                 <div 
                   className="player-name-clickable"
                   onClick={() => handlePlayerClick(player)}
                 >
                   {player.firstName} {player.lastName}
                   {!isPublicView && !player.unifiedAccount?.hasUnifiedAccount && <span className="no-account">*</span>}
                 </div>
                 
                 {/* Claim Button - Show for positions that need claiming (only when not in public view) */}
                 {!isPublicView && onClaimLadderPosition && !player.unifiedAccount?.hasUnifiedAccount && !isPositionClaimed({
                   ladder: selectedLadder,
                   position: player.position
                 }) && (
                   <div style={{
                     display: 'inline-block',
                     width: 'fit-content',
                     flexShrink: '0'
                   }}>
                     <button
                       className="compact-claim-btn"
                       onClick={() => onClaimLadderPosition({
                         firstName: player.firstName,
                         lastName: player.lastName,
                         fargoRate: player.fargoRate,
                         ladder: selectedLadder,
                         position: player.position
                       })}
                     >
                       🎯 Claim
                     </button>
                   </div>
                 )}
                 
                 {/* Show claimed status for positions that have been claimed (only when not in public view) */}
                 {!isPublicView && isPositionClaimed({
                   ladder: selectedLadder,
                   position: player.position
                 }) && (
                   <div style={{
                     display: 'inline-block',
                     width: 'fit-content',
                     flexShrink: '0'
                   }}>
                     <div style={{
                       background: '#4CAF50',
                       color: 'white',
                       borderRadius: '1px',
                       padding: '0px',
                       fontSize: '0.6rem',
                       marginTop: '0px',
                       fontWeight: '400',
                       textAlign: 'center',
                       height: '12px',
                       lineHeight: '12px',
                       display: 'block',
                       whiteSpace: 'nowrap',
                       width: '45px',
                       boxSizing: 'border-box',
                       overflow: 'hidden'
                     }}>
                       ✅ Claimed
                     </div>
                   </div>
                 )}
                 
                 {userLadderData?.canChallenge && (
                   <div style={{ marginTop: '4px' }}>
                     {canChallengePlayer(userLadderData, player) ? (
                       <>
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
                       </>
                     ) : (
                       <div style={{
                         fontSize: '0.6rem',
                         color: '#888',
                         fontStyle: 'italic',
                         marginTop: '2px'
                       }}>
                         {getChallengeReason(userLadderData, player)}
                       </div>
                     )}
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
               {!isPublicView && (
                 <div className="table-cell last-match">
                   {player.lastMatch ? (
                     <div style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                       <div style={{ fontWeight: 'bold', color: player.lastMatch.result === 'W' ? '#4CAF50' : '#f44336' }}>
                         {player.lastMatch.result === 'W' ? 'W' : 'L'} vs {player.lastMatch.opponent}
                       </div>
                       <div style={{ color: '#666', fontSize: '0.7rem' }}>
                         {new Date(player.lastMatch.date).toLocaleDateString()}
                       </div>
                       {player.lastMatch.venue && (
                         <div style={{ color: '#888', fontSize: '0.65rem' }}>
                           {player.lastMatch.venue}
                         </div>
                       )}
                     </div>
                   ) : (
                     <span style={{ color: '#999', fontSize: '0.8rem' }}>No matches</span>
                   )}
                 </div>
               )}
             </div>
           ))}

           
         </div>
        
        <div className="ladder-legend">
          {!isPublicView && <p><span className="no-account">*</span> = No unified account yet</p>}
          <p><strong>🏆 Welcome to the Ladder of Legends!</strong></p>
          <p>This is a competitive pool ladder system where players challenge each other to climb the ranks. Players are organized by skill level (FargoRate) into three brackets: 499 & Under, 500-549, and 550+.</p>
          <p><strong>How to Join:</strong> Visit <a href="https://frontrangepool.com" style={{color: '#ffc107', textDecoration: 'underline'}}>FrontRangePool.com</a> to create your account and start competing!</p>
          <p><strong>Challenge Rules:</strong> Standard challenges up to 4 positions above, SmackDown up to 5 positions below</p>
          <p><strong>Anyone can view the ladder - no account required!</strong></p>
          {!isPublicView && onClaimLadderPosition && (
            <p style={{ 
              color: '#4CAF50', 
              fontWeight: 'bold',
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '4px'
            }}>
              🎯 <strong>Claim Available Positions:</strong> Click the green "Claim" button next to any position marked with * to claim it
            </p>
          )}
          
          {!isPublicView && !userLadderData?.canChallenge && (
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
                To challenge other players, you need a unified account.
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
                Get Unified Account
              </button>
            </div>
          )}
        </div>
        
        {!isPublicView && (
          <button onClick={() => setCurrentView('main')} className="back-btn">
            ← Back to Main Menu
          </button>
        )}
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
        
        {/* Scheduled Matches */}
        <div className="challenges-section">
          <h3 style={{ color: '#28a745', marginBottom: '16px' }}>
            Scheduled Matches ({scheduledMatches.length})
          </h3>
          
          {scheduledMatches.length === 0 ? (
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              color: '#ccc'
            }}>
              No scheduled matches to display.
            </div>
          ) : (
            <div className="challenges-list">
              {scheduledMatches.map((match) => (
                <div key={match._id} className="challenge-card">
                  <div className="challenge-header">
                    <h4>{match.player1?.firstName} {match.player1?.lastName} vs {match.player2?.firstName} {match.player2?.lastName}</h4>
                    <span className={`challenge-type challenge-${match.matchType}`}>
                      {match.matchType.charAt(0).toUpperCase() + match.matchType.slice(1)} Match
                    </span>
                  </div>
                  
                  <div className="challenge-details">
                    <p><strong>Status:</strong> <span className="status-scheduled">
                      {match.challengeId ? 'Created by Admin' : 'Scheduled'}
                    </span></p>
                    <p><strong>Race Length:</strong> {match.raceLength}</p>
                    <p><strong>Game Type:</strong> {match.gameType}</p>
                    <p><strong>Table Size:</strong> {match.tableSize}</p>
                    <p><strong>Scheduled Date:</strong> {new Date(match.scheduledDate).toLocaleDateString()}</p>
                    {match.venue && <p><strong>Location:</strong> {match.venue}</p>}
                  </div>
                  
                  <div className="challenge-actions">
                    <button
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      View Match Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!isPublicView && (
          <button onClick={() => setCurrentView('main')} className="back-btn">
            ← Back to Main Menu
          </button>
        )}
      </div>
    );
  };

  // Removed renderAllLaddersView function - no longer needed
  const renderAllLaddersView_DISABLED = () => {
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
                      <div 
                        className="player-name-clickable"
                        onClick={() => handlePlayerClick(player)}
                      >
                        {player.firstName} {player.lastName}
                        {!isPublicView && !player.unifiedAccount?.hasUnifiedAccount && <span className="no-account">*</span>}
                      </div>
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
        
        {!isPublicView && (
          <button onClick={() => setCurrentView('main')} className="back-btn">
            ← Back to Main Menu
          </button>
        )}
      </div>
    );
  };

  const renderMatchesView = () => {
    return (
      <div className="matches-view">
        <div className="view-header">
          <h2>🎯 My Matches</h2>
          <p>View your active and completed matches</p>
        </div>

        {matchesLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your matches...</p>
          </div>
        ) : playerMatches.length === 0 ? (
          <div className="no-matches">
            <div className="no-matches-icon">🎱</div>
            <h3>No Matches Yet</h3>
            <p>You haven't played any matches yet. Challenge another player to get started!</p>
            <button 
              onClick={() => navigateToView('ladders')}
              className="challenge-button"
            >
              View Ladder & Challenge Players
            </button>
          </div>
        ) : (
          <div className="matches-list">
            {playerMatches.map((match, index) => (
              <div key={match._id || index} className="match-card">
                <div className="match-header">
                  <div className="match-type">
                    {match.matchType === 'challenge' ? '⚔️ Challenge' : 
                     match.matchType === 'ladder-jump' ? '🚀 Ladder Jump' :
                     match.matchType === 'smackdown' ? '💥 SmackDown' : '🎯 Match'}
                  </div>
                  <div className="match-status">
                    {match.status === 'scheduled' ? '📅 Scheduled' :
                     match.status === 'completed' ? '✅ Completed' :
                     match.status === 'cancelled' ? '❌ Cancelled' : '⏳ Pending'}
                  </div>
                </div>
                
                <div className="match-players">
                  <div className="player">
                    <span className="player-name">
                      {match.player1?.firstName} {match.player1?.lastName}
                    </span>
                    <span className="player-position">#{match.player1?.position}</span>
                  </div>
                  <div className="vs">VS</div>
                  <div className="player">
                    <span className="player-name">
                      {match.player2?.firstName} {match.player2?.lastName}
                    </span>
                    <span className="player-position">#{match.player2?.position}</span>
                  </div>
                </div>

                {match.status === 'completed' && (
                  <div className="match-result">
                    <div className="winner">
                      🏆 Winner: {match.winner?.firstName} {match.winner?.lastName}
                    </div>
                    <div className="score">Score: {match.score}</div>
                  </div>
                )}

                <div className="match-details">
                  <div className="detail">
                    <span className="label">Date:</span>
                    <span className="value">
                      {new Date(match.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="label">Game:</span>
                    <span className="value">{match.gameType}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Race to:</span>
                    <span className="value">{match.raceLength}</span>
                  </div>
                  {match.venue && (
                    <div className="detail">
                      <span className="label">Location:</span>
                      <span className="value">{match.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
                            {!isPublicView && userLadderData?.needsClaim && (
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
             {!isPublicView && userLadderData?.playerId === 'unknown' && (
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
             {!isPublicView && (
               <>
                 <div className="nav-card" onClick={() => navigateToView('ladders')}>
                   <div className="nav-icon">📊</div>
                   <h3>View Ladders</h3>
                   <p>See all ladder positions and rankings</p>
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
               </>
             )}
             
             {!isPublicView && (
               <div className="nav-card" onClick={() => setShowMatchReportingModal(true)}>
                 <div className="nav-icon">🏓</div>
                 <h3>Report Match</h3>
                 <p>Report match results and pay fees</p>
               </div>
             )}
             
             {!isPublicView && userLadderData?.playerId === 'ladder' && (
               <div className="nav-card" onClick={() => navigateToView('matches')}>
                 <div className="nav-icon">🎯</div>
                 <h3>My Completed Matches</h3>
                 <p>View your completed match history</p>
               </div>
             )}
             
             <div className="nav-card" onClick={() => setShowPaymentDashboard(true)}>
               <div className="nav-icon">💳</div>
               <h3>Payment Dashboard</h3>
               <p>Manage credits, membership, and payments</p>
             </div>
             
             <div className="nav-card" onClick={() => setShowPrizePoolModal(true)}>
               <div className="nav-icon">💰</div>
               <h3>Prize Pools</h3>
               <p>View current prize pools and winners</p>
             </div>
             
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
             
             
             <div className="nav-card" onClick={() => setShowRulesModal(true)}>
               <div className="nav-icon">📋</div>
               <h3>Ladder Rules</h3>
               <p>Read the complete ladder rules</p>
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
      {/* Ladder-specific floating logos - only Legends logo and pool balls */}
      <LadderFloatingLogos />
      
      {/* Independent Tournament Disclaimer */}
      <div style={{
        marginTop: '10px',
        marginBottom: '30px',
        padding: '12px 16px',
        background: 'rgba(255, 193, 7, 0.2)',
        border: '2px solid #ffc107',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '10px auto 30px auto',
        boxShadow: '0 3px 12px rgba(255, 193, 7, 0.3)',
        position: 'relative',
        zIndex: 999,
        display: 'block',
        visibility: 'visible',
        opacity: 1
      }}>
        <p style={{ 
          margin: '0', 
          color: '#ffc107', 
          fontSize: '0.9rem',
          fontWeight: '600',
          lineHeight: '1.4',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
        }}>
          <strong>⚠️ INDEPENDENT TOURNAMENT SERIES ⚠️</strong><br/>
          This ladder system is <strong>NOT</strong> affiliated with, endorsed by, or sanctioned by the Front Range Pool League,<br>
          </br> CueSports International, BCA Pool League, or USA Pool League.<br/>
          It is an independent tournament series operated by <strong>Legends Brews and Cues</strong>.
        </p>
      </div>

      {/* Header */}
       <div className="ladder-header" style={{ flexDirection: 'column', textAlign: 'center' }}>
         <div className="ladder-title">
           <h1 style={{ 
             color: '#000000',
             WebkitTextStroke: '0.5px #8B5CF6',
             textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
             fontWeight: 'bold',
             fontSize: '3rem',
             letterSpacing: '3px',
             fontFamily: '"Bebas Neue", "Orbitron", "Exo 2", "Arial Black", sans-serif',
             textTransform: 'uppercase'
           }}>Ladder of Legends</h1>
           <p>Tournament Series - Challenge-based ladder system with rankings</p>
         </div>
         
         {/* Back to Ladder Home Button */}
         {!isPublicView && currentView !== 'main' && (
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
      {currentView === 'challenge' && renderChallengeView()}
      {currentView === 'matches' && renderMatchesView()}
      {currentView === 'main' && renderMainView()}

      {/* Footer */}
      <div className="ladder-footer">
        {isPublicView ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
            <h3 style={{ color: '#8B5CF6', marginBottom: '15px' }}>🏆 Ladder of Legends 🏆</h3>
            <p style={{ marginBottom: '10px', fontSize: '16px' }}>
              <strong>Ready to join the competition?</strong>
            </p>
            <p style={{ marginBottom: '15px', fontSize: '14px', color: '#ccc' }}>
              Challenge players, climb the ranks, and compete for prizes!
            </p>
            <p style={{ fontSize: '14px', color: '#ffc107' }}>
              <strong>Visit <a href="https://frontrangepool.com" style={{ color: '#ffc107', textDecoration: 'underline' }}>FrontRangePool.com</a> to get started!</strong>
            </p>
          </div>
        ) : (
        <p>Challenge your way to the top! 🏆</p>
        )}
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
           availableDefenders={ladderData.filter(player => player.unifiedAccount?.hasUnifiedAccount && player.unifiedAccount?.email !== userLadderData?.email)}
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
            playerName={userLadderData?.email || `${playerName} ${playerLastName}`}
            selectedLadder={selectedLadder}
            onMatchReported={(matchData) => {
              // Refresh ladder data after match is reported
              loadData();
              loadChallenges();
            }}
          />
        )}
        
        {showPaymentDashboard && (
          <PaymentDashboard
            isOpen={showPaymentDashboard}
            onClose={() => setShowPaymentDashboard(false)}
            playerEmail={userLadderData?.email || `${playerName}@example.com`}
          />
        )}

        {/* Player Stats Modal - Rendered via Portal */}
        {showMobilePlayerStats && selectedPlayerForStats && createPortal(
          <div 
            className="player-stats-modal"
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              backdropFilter: 'blur(5px)',
              padding: '10px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              transform: 'none'
            }}
          >
            <div 
              className="player-stats-content"
              style={{
                background: 'rgba(35, 35, 42, 0.16)',
                borderRadius: '18px',
                maxWidth: '95vw',
                width: window.innerWidth <= 768 ? '320px' : '600px',
                maxHeight: '85vh',
                overflowY: 'auto',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 32px #e53e3e22, 0 0 16px #e53e3e11',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              <div className="player-stats-header">
                <h3>{selectedPlayerForStats.firstName} {selectedPlayerForStats.lastName}</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      console.log('🔄 Refreshing player data...');
                      fetchUpdatedPlayerData(selectedPlayerForStats);
                    }}
                    style={{
                      background: 'rgba(255, 68, 68, 0.2)',
                      border: '1px solid #ff4444',
                      color: '#ff4444',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Refresh player stats"
                  >
                    🔄
                  </button>
                <button 
                  className="stats-close-btn"
                  onClick={() => setShowMobilePlayerStats(false)}
                >
                  ×
                </button>
                </div>
              </div>
              
              <div className="player-stats-body">
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Left Column - Basic Stats */}
                  <div style={{ flex: '1', minWidth: '200px' }}>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Rank</div>
                        <div className="stat-value">#{(updatedPlayerData || selectedPlayerForStats).position}</div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">FargoRate</div>
                    <div className="stat-value">
                          {(updatedPlayerData || selectedPlayerForStats).fargoRate === 0 ? "No FargoRate" : (updatedPlayerData || selectedPlayerForStats).fargoRate}
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">Wins</div>
                        <div className="stat-value wins">
                          {(() => {
                            const playerData = updatedPlayerData || selectedPlayerForStats;
                            console.log('🔍 Displaying wins for player:', playerData.firstName, playerData.lastName, 'wins:', playerData.wins);
                            return playerData.wins || 0;
                          })()}
                        </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">Losses</div>
                        <div className="stat-value losses">
                          {(() => {
                            const playerData = updatedPlayerData || selectedPlayerForStats;
                            console.log('🔍 Displaying losses for player:', playerData.firstName, playerData.lastName, 'losses:', playerData.losses);
                            return playerData.losses || 0;
                          })()}
                        </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">Status</div>
                    <div className="stat-value status">
                      {!selectedPlayerForStats.isActive ? (
                        <span className="inactive">Inactive</span>
                      ) : selectedPlayerForStats.immunityUntil && new Date(selectedPlayerForStats.immunityUntil) > new Date() ? (
                        <span className="immune">Immune</span>
                      ) : (
                        <span className="active">Active</span>
                      )}
                    </div>
                  </div>
                  
                  {selectedPlayerForStats.immunityUntil && new Date(selectedPlayerForStats.immunityUntil) > new Date() && (
                    <div className="stat-item">
                      <div className="stat-label">Immunity Until</div>
                      <div className="stat-value">
                        {new Date(selectedPlayerForStats.immunityUntil).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                  
                  {/* Right Column - Match History */}
                  <div style={{ flex: '1', minWidth: '200px' }}>
                  
                                     <div className="stat-item">
                     <div className="stat-label">Last Match</div>
                     <div className="stat-value">
                       {lastMatchData ? (
                         <div className="last-match-info">
                           <div className="match-opponent">
                             vs {lastMatchData.opponentName}
                           </div>
                           <div className={`match-result ${lastMatchData.result === 'W' ? 'win' : 'loss'}`}>
                             {lastMatchData.result === 'W' ? 'Won' : 'Lost'} {lastMatchData.score}
                           </div>
                           <div className="match-type">
                             {lastMatchData.matchType === 'challenge' ? 'Challenge Match' :
                              lastMatchData.matchType === 'ladder-jump' ? 'Ladder Jump' :
                              lastMatchData.matchType === 'smackdown' ? 'SmackDown' :
                              lastMatchData.matchType === 'smackback' ? 'SmackBack' :
                              lastMatchData.matchType}
                           </div>
                           <div className="player-role">
                             {lastMatchData.playerRole === 'challenger' ? 'Challenger' :
                              lastMatchData.playerRole === 'defender' ? 'Defender' :
                              'Player'}
                           </div>
                           <div className="match-date">
                             {new Date(lastMatchData.matchDate).toLocaleDateString()}
                           </div>
                         </div>
                       ) : (
                         <span className="no-match">No recent matches</span>
                       )}
                     </div>
                   </div>
                   
                   {/* Match History Section */}
                   <div className="stat-item">
                     <div className="stat-label">Match History</div>
                     <div className="stat-value">
                       {playerMatchHistory.length > 1 ? (
                         <div className="match-history-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                           {/* Show previous 2 matches (skip the first one since it's shown in Last Match) */}
                           {playerMatchHistory.slice(1, 3).map((match, index) => (
                             <div key={index} className="match-history-item" style={{ 
                               padding: '6px', 
                               borderBottom: '1px solid rgba(255,255,255,0.1)', 
                               fontSize: '11px',
                               marginBottom: '2px'
                             }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <span className={`match-result ${match.result === 'W' ? 'win' : 'loss'}`}>
                                   {match.result === 'W' ? 'W' : 'L'}
                                 </span>
                                 <span style={{ color: '#ccc' }}>
                                   vs {match.opponentName}
                                 </span>
                                 <span style={{ color: '#888', fontSize: '10px' }}>
                                   {new Date(match.matchDate).toLocaleDateString()}
                                 </span>
                               </div>
                               <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                 {match.score} • {match.matchType}
                               </div>
                             </div>
                           ))}
                           
                           {/* Show More button if there are more than 3 total matches */}
                           {playerMatchHistory.length > 3 && (
                             <div style={{ textAlign: 'center', padding: '8px' }}>
                               <button 
                                 onClick={() => {
                                   console.log('🔍 Show More button clicked! Setting showFullMatchHistory to true');
                                   console.log('🔍 Current showFullMatchHistory state:', showFullMatchHistory);
                                   setShowMobilePlayerStats(false); // Close the player stats modal
                                   setShowFullMatchHistory(true);
                                   console.log('🔍 After setting showFullMatchHistory to true');
                                 }}
                                 style={{
                                   background: 'rgba(255, 68, 68, 0.2)',
                                   border: '1px solid #ff4444',
                                   color: '#ff4444',
                                   padding: '4px 8px',
                                   borderRadius: '4px',
                                   fontSize: '10px',
                                   cursor: 'pointer'
                                 }}
                               >
                                 Show More ({playerMatchHistory.length - 3} more)
                               </button>
                             </div>
                           )}
                         </div>
                       ) : playerMatchHistory.length === 1 ? (
                         <span className="no-match">No previous matches</span>
                       ) : (
                         <span className="no-match">No match history</span>
                       )}
                     </div>
                   </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Full Match History Modal */}
        {showFullMatchHistory && selectedPlayerForStats && (() => {
          console.log('🔍 Rendering Full Match History Modal');
          console.log('🔍 showFullMatchHistory:', showFullMatchHistory);
          console.log('🔍 selectedPlayerForStats:', selectedPlayerForStats);
          console.log('🔍 isPublicView:', isPublicView);
          
          const modalContent = (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999999,
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.98))',
              border: '2px solid #8B5CF6',
              borderRadius: '12px',
              width: 'auto',
              maxWidth: '500px',
              minWidth: '400px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              color: '#ffffff'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #ff4444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ color: '#ff4444', margin: 0 }}>
                  🏆 {selectedPlayerForStats.firstName} {selectedPlayerForStats.lastName} - Full Match History
                </h2>
                <button
                  onClick={() => {
                    setShowFullMatchHistory(false);
                    setShowMobilePlayerStats(true); // Reopen the player stats modal
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
              }}>
                {playerMatchHistory.length > 0 ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {playerMatchHistory.map((match, index) => {
                      console.log('🔍 Match data:', match);
                      console.log('🔍 Match location:', match.location);
                      console.log('🔍 Match positionBefore:', match.positionBefore);
                      console.log('🔍 Match positionAfter:', match.positionAfter);
                      console.log('🔍 All match keys:', Object.keys(match));
                      console.log('🔍 Match venue (raw):', match.venue);
                      console.log('🔍 Match player1OldPosition (raw):', match.player1OldPosition);
                      console.log('🔍 Match player1NewPosition (raw):', match.player1NewPosition);
                      return (
                      <div key={index} style={{
                        padding: '15px',
                        borderBottom: index < playerMatchHistory.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}>
                        {/* Left Column - WIN/LOSS Result */}
                        <div style={{ minWidth: '60px' }}>
                          <span style={{
                            background: match.result === 'W' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: match.result === 'W' ? '#22c55e' : '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'block',
                            textAlign: 'center'
                          }}>
                            {match.result === 'W' ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                        
                        {/* Second Column - Opponent Name */}
                        <div style={{ minWidth: '120px' }}>
                          <div style={{ color: '#fff', fontWeight: 'bold' }}>
                            vs {match.opponentName}
                          </div>
                        </div>
                        
                        {/* Third Column - Match Details */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ color: '#ccc', fontSize: '15px', marginBottom: '3px' }}>
                            {match.score} • {match.matchType} • {match.playerRole}
                          </div>
                          <div style={{ color: '#999', fontSize: '13px' }}>
                            {match.location || 'Location TBD'} • Pos {match.positionBefore || '?'} → {match.positionAfter || '?'}
                          </div>
                        </div>
                        
                        {/* Right Column - Date */}
                        <div style={{ minWidth: '80px', textAlign: 'right' }}>
                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {new Date(match.matchDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#ccc',
                    padding: '40px',
                    fontSize: '16px'
                  }}>
                    No match history available
                  </div>
                )}
              </div>
            </div>
          </div>
          );
          
          // For public view (embedded), render inline; for regular view, use portal
          if (isPublicView) {
            return modalContent;
          } else {
            return createPortal(modalContent, document.body);
          }
        })()}

        
     </div>
   );
 };

export default LadderApp;
