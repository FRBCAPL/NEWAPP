import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { BACKEND_URL } from '../../config.js';
import { checkPaymentStatus, showPaymentRequiredModal } from '../../utils/paymentStatus.js';
import { 
  sanitizeInput, 
  sanitizeEmail, 
  createSecureHeaders, 
  sanitizeChallengeData,
  sanitizePlayerData 
} from '../../utils/security.js';
import LadderApplicationsManager from '../admin/LadderApplicationsManager';
import DraggableModal from '../modal/DraggableModal';
import LadderOfLegendsRulesModal from '../modal/LadderOfLegendsRulesModal';
import LadderFloatingLogos from './LadderFloatingLogos';
import LadderHeader from './LadderHeader';
import LadderMatchCalendar from './LadderMatchCalendar';
import LadderTable from './LadderTable';
import NavigationMenu from './NavigationMenu';
import PlayerStatsModal from './PlayerStatsModal';
import FullMatchHistoryModal from './FullMatchHistoryModal';
import UserStatusCard from './UserStatusCard';
import LadderErrorBoundary from './LadderErrorBoundary';
import UnifiedSignupForm from '../auth/UnifiedSignupForm';

import LadderChallengeModal from './LadderChallengeModal';
import LadderChallengeConfirmModal from './LadderChallengeConfirmModal';
import LadderSmartMatchModal from './LadderSmartMatchModal';
import LadderPrizePoolTracker from './LadderPrizePoolTracker';
import LadderPrizePoolModal from './LadderPrizePoolModal';
import LadderMatchReportingModal from './LadderMatchReportingModal';
import PaymentDashboard from './PaymentDashboard';
import NotificationPermissionModal from '../notifications/NotificationPermissionModal';
import notificationService from '../../services/notificationService';
import PromotionalPricingBanner from './PromotionalPricingBanner';
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
  const [playerInfo, setPlayerInfo] = useState(null);
  const [showApplicationsManager, setShowApplicationsManager] = useState(false);
  const [selectedLadder, setSelectedLadder] = useState('499-under');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [hasManuallySelectedLadder, setHasManuallySelectedLadder] = useState(false);

  const [availableLocations, setAvailableLocations] = useState([]);
  const [showUnifiedSignup, setShowUnifiedSignup] = useState(false);
  const [showProfileCompletionPrompt, setShowProfileCompletionPrompt] = useState(false);
  
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
  const [showMatchCalendar, setShowMatchCalendar] = useState(false);
  
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
  
  // Notification state
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);
  const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);
  
  // Debounced loadData function - moved to top to avoid hoisting issues
  const loadDataTimeoutRef = useRef(null);
  
  const loadData = useCallback(async () => {
    // Clear existing timeout
    if (loadDataTimeoutRef.current) {
      clearTimeout(loadDataTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    loadDataTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Load ladder rankings for selected ladder
        const ladderResponse = await fetch(`${BACKEND_URL}/api/ladder/ladders/${sanitizeInput(selectedLadder)}/players`, {
          headers: createSecureHeaders(userPin)
        });
        
        if (!ladderResponse.ok) {
          throw new Error(`Failed to load ladder data: ${ladderResponse.status} ${ladderResponse.statusText}`);
        }
        
        const ladderResult = await ladderResponse.json();
        
        console.log('Ladder API response:', ladderResult);
        
        if (ladderResult && Array.isArray(ladderResult)) {
          setLadderData(ladderResult);
          console.log(`Loaded ${ladderResult.length} players from ${selectedLadder} ladder`);
        } else {
          console.error('Invalid ladder data format:', ladderResult);
          setLadderData([]); // Set empty array as fallback
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
              activeChallenges: ladderProfile.activeChallenges || [],
              canChallenge: ladderProfile.canChallenge || true
            });
          } else {
            // User doesn't have ladder profile - check if they can claim account
            await checkPlayerStatus(userData.email);
          }
        } catch (error) {
          console.error('Error parsing unified user data:', error);
          await checkPlayerStatus(email);
        }
      } else {
        // No unified user data - check player status
        await checkPlayerStatus(email, '', '');
      }
      
      } catch (error) {
        console.error('Error loading ladder data:', error);
        setLadderData([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce by 300ms
  }, [selectedLadder, userPin, senderEmail]);

  useEffect(() => {
    // Load user's ladder data and ladder rankings
    loadData();
    loadLocations();
    loadChallenges();
    loadProfileData();
    
    // Cleanup timeout on unmount
    return () => {
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
    };
  }, [selectedLadder, loadData]);

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
      const sanitizedEmail = sanitizeEmail(senderEmail);
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/profile-data?email=${encodeURIComponent(sanitizedEmail)}&appType=ladder&t=${Date.now()}`, {
        headers: createSecureHeaders(userPin)
      });
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

  // Auto-show unified signup if prop is true
  useEffect(() => {
    if (showClaimForm) {
      setShowUnifiedSignup(true);
    }
  }, [showClaimForm]);

  // Check if user needs to complete their profile after approval
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!senderEmail || !userLadderData?.canChallenge) return;
      
      try {
        const sanitizedEmail = sanitizeEmail(senderEmail);
        const response = await fetch(`${BACKEND_URL}/api/unified-auth/profile-data?email=${encodeURIComponent(sanitizedEmail)}&appType=ladder&t=${Date.now()}`, {
          headers: createSecureHeaders(userPin)
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.profile) {
            // Check if profile is incomplete
            const hasPhone = data.profile.phone && data.profile.phone.trim() !== '';
            const hasLocations = data.profile.locations && data.profile.locations.trim() !== '';
            const hasAvailability = data.profile.availability && Object.keys(data.profile.availability).length > 0;
            
            // If any required profile fields are missing, show profile completion prompt
            if (!hasPhone || !hasLocations || !hasAvailability) {
              console.log('Profile incomplete, showing completion prompt');
              setShowProfileCompletionPrompt(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    };

    checkProfileCompletion();
  }, [senderEmail, userLadderData?.canChallenge]);

  // Check notification permission on app load
  useEffect(() => {
    const checkNotificationPermission = () => {
      if (!notificationPermissionRequested && userLadderData?.canChallenge) {
        const status = notificationService.getStatus();
        
        // Show permission modal if notifications are supported but not yet requested
        if (status.isSupported && status.permission === 'default') {
          setShowNotificationPermission(true);
        }
        
        setNotificationPermissionRequested(true);
      }
    };

    checkNotificationPermission();
  }, [userLadderData?.canChallenge, notificationPermissionRequested]);

  useEffect(() => {
    // Clear existing timeout
    if (loadDataTimeoutRef.current) {
      clearTimeout(loadDataTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    loadDataTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Load ladder rankings for selected ladder
        const ladderResponse = await fetch(`${BACKEND_URL}/api/ladder/ladders/${sanitizeInput(selectedLadder)}/players`, {
          headers: createSecureHeaders(userPin)
        });
        
        if (!ladderResponse.ok) {
          throw new Error(`Failed to load ladder data: ${ladderResponse.status} ${ladderResponse.statusText}`);
        }
        
        const ladderResult = await ladderResponse.json();
        
        console.log('Ladder API response:', ladderResult);
        
        if (ladderResult && Array.isArray(ladderResult)) {
          setLadderData(ladderResult);
          console.log(`Loaded ${ladderResult.length} players from ${selectedLadder} ladder`);
        } else {
          console.error('Invalid ladder data format:', ladderResult);
          setLadderData([]); // Set empty array as fallback
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
        
        // Set fallback data for graceful degradation
        setLadderData([]); // Empty ladder data
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
        
        // Show user-friendly error message (optional - could be a toast notification)
        console.warn('Ladder data could not be loaded. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay
  }, [selectedLadder, userPin, senderEmail]);

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
      const sanitizedEmail = sanitizeEmail(email);
      const response = await fetch(`${BACKEND_URL}/api/ladder/player-status/${encodeURIComponent(sanitizedEmail)}`, {
        headers: createSecureHeaders(userPin)
      });
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
          needsClaim: true,
          leagueInfo: status.leagueInfo
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




  const navigateToView = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // Memoize computed values
  const ladderDisplayName = useMemo(() => {
    switch (selectedLadder) {
      case '499-under': return '499 & Under';
      case '500-549': return '500-549';
      case '550-plus': return '550+';
      default: return selectedLadder;
    }
  }, [selectedLadder]);



  // Challenge eligibility rules based on ladder position
  const canChallengePlayer = (challenger, defender) => {
    // Sanitize input data
    const sanitizedChallenger = sanitizePlayerData(challenger);
    const sanitizedDefender = sanitizePlayerData(defender);
    
    // Debug: Log the ladder values being compared
    console.log(`🔍 Ladder comparison: Challenger ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} ladder="${sanitizedChallenger.ladder}", Defender ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} ladderName="${sanitizedDefender.ladderName}"`);
    
    // Debug: Log unified account status for challenger and defender
    console.log(`🔍 Challenger unifiedAccount:`, sanitizedChallenger.unifiedAccount);
    console.log(`🔍 Defender unifiedAccount:`, sanitizedDefender.unifiedAccount);
    console.log(`🔍 Challenger canChallenge:`, sanitizedChallenger.canChallenge);
    console.log(`🔍 Defender hasUnifiedAccount:`, sanitizedDefender.unifiedAccount?.hasUnifiedAccount);
    
    // Both players must be on the same ladder
    // Note: challenger.ladder is the user's ladder, defender.ladderName is the player's ladder
    if (sanitizedChallenger.ladder !== sanitizedDefender.ladderName) {
      console.log(`🚫 Challenge blocked: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} (${sanitizedChallenger.ladder}) cannot challenge ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} (${sanitizedDefender.ladderName}) - Different ladder`);
      return false;
    }
    
    // Both players must have unified accounts
    if (!sanitizedChallenger.unifiedAccount?.hasUnifiedAccount || !sanitizedDefender.unifiedAccount?.hasUnifiedAccount) {
      console.log(`🚫 Challenge blocked: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} cannot challenge ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} - Unified account required`);
      return false;
    }
    
    // Can't challenge yourself
    if (sanitizedChallenger.email === sanitizedDefender.unifiedAccount?.email) {
      console.log(`🚫 Challenge blocked: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} cannot challenge themselves`);
      return false;
    }
    
    // Can't challenge if you're not active
    if (!sanitizedChallenger.isActive) {
      console.log(`🚫 Challenge blocked: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} is not active`);
      return false;
    }
    
    // Can't challenge if defender is not active
    if (!sanitizedDefender.isActive) {
      console.log(`🚫 Challenge blocked: ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} is not active`);
      return false;
    }
    
    // Can't challenge if defender has immunity
    if (sanitizedDefender.immunityUntil && new Date(sanitizedDefender.immunityUntil) > new Date()) {
      console.log(`🚫 Challenge blocked: ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} has immunity until ${sanitizedDefender.immunityUntil}`);
      return false;
    }
    
    // Position-based challenge rules (following official rules):
    // - Standard Challenge: Can challenge players up to 4 positions above you
    // - SmackDown: Can challenge players no more than 5 positions below you
    const challengerPosition = sanitizeNumber(sanitizedChallenger.position);
    const defenderPosition = sanitizeNumber(sanitizedDefender.position);
    const positionDifference = challengerPosition - defenderPosition;
    
    // Standard Challenge: Can challenge players above you (up to 4 positions)
    if (positionDifference >= -4 && positionDifference <= 0) {
      console.log(`✅ Standard Challenge allowed: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} (Position ${challengerPosition}) can challenge ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} (Position ${defenderPosition}) - ${Math.abs(positionDifference)} positions above`);
      return true;
    }
    
    // SmackDown: Can challenge players below you (up to 5 positions)
    if (positionDifference > 0 && positionDifference <= 5) {
      console.log(`✅ SmackDown allowed: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} (Position ${challengerPosition}) can challenge ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} (Position ${defenderPosition}) - ${positionDifference} positions below`);
      return true;
    }
    
    console.log(`🚫 Challenge blocked: ${sanitizedChallenger.firstName} ${sanitizedChallenger.lastName} (Position ${challengerPosition}) cannot challenge ${sanitizedDefender.firstName} ${sanitizedDefender.lastName} (Position ${defenderPosition}) - Position difference ${positionDifference} is outside allowed range (-4 to +5)`);
    return false;
  };

  // Helper function to get challenge reason (for debugging)
  const getChallengeReason = (challenger, defender) => {
    try {
      const sanitizedChallenger = sanitizePlayerData(challenger);
      const sanitizedDefender = sanitizePlayerData(defender);
      
      if (!sanitizedChallenger.unifiedAccount?.hasUnifiedAccount || !sanitizedDefender.unifiedAccount?.hasUnifiedAccount) {
        return 'No unified account';
      }
      if (sanitizedChallenger.email === sanitizedDefender.unifiedAccount?.email) {
        return 'Same player';
      }
      if (!sanitizedChallenger.isActive) {
        return 'Challenger inactive';
      }
      if (!sanitizedDefender.isActive) {
        return 'Defender inactive';
      }
      if (sanitizedDefender.immunityUntil && new Date(sanitizedDefender.immunityUntil) > new Date()) {
        return 'Defender immune';
      }
      
      const challengerPosition = sanitizeNumber(sanitizedChallenger.position);
      const defenderPosition = sanitizeNumber(sanitizedDefender.position);
      const positionDifference = challengerPosition - defenderPosition;
      
      if (positionDifference < -4) {
        return `Too far above (${Math.abs(positionDifference)} positions) - Max 4 positions above allowed`;
      }
      if (positionDifference > 5) {
        return `Too far below (${positionDifference} positions) - Max 5 positions below allowed for SmackDown`;
      }
      
      return 'Eligible';
    } catch (error) {
      console.error('Error in getChallengeReason:', error);
      return 'Invalid data';
    }
  };

  // Challenge system functions
  const loadChallenges = async () => {
    if (!senderEmail) return;
    
    try {
      // Load pending challenges (received)
      const sanitizedEmail = sanitizeEmail(senderEmail);
      const pendingResponse = await fetch(`${BACKEND_URL}/api/ladder/challenges/pending/${encodeURIComponent(sanitizedEmail)}`, {
        headers: createSecureHeaders(userPin)
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingChallenges(pendingData);
      }
      
      // Load sent challenges
      const sentResponse = await fetch(`${BACKEND_URL}/api/ladder/challenges/sent/${encodeURIComponent(sanitizedEmail)}`, {
        headers: createSecureHeaders(userPin)
      });
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
      const scheduledResponse = await fetch(`${BACKEND_URL}/api/ladder/front-range-pool-hub/ladders/${sanitizeInput(selectedLadder)}/matches?status=scheduled`, {
        headers: createSecureHeaders(userPin)
      });
      if (scheduledResponse.ok) {
        const scheduledData = await scheduledResponse.json();
        // Filter to only show matches where the current user is a player
        const userScheduledMatches = scheduledData.matches?.filter(match => 
          match.player1?.email === sanitizedEmail || match.player2?.email === sanitizedEmail
        ) || [];
        setScheduledMatches(userScheduledMatches);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const handleChallengePlayer = useCallback((defender, type = 'challenge') => {
    setSelectedDefender(defender);
    setChallengeType(type);
    setShowChallengeModal(true);
  }, []);

  // Helper function to determine player status
  const getPlayerStatus = (player) => {
    if (!player.isActive) {
      return { status: 'inactive', text: 'Inactive', className: 'inactive' };
    }
    
    if (player.immunityUntil && new Date(player.immunityUntil) > new Date()) {
      return { status: 'immune', text: 'Immune', className: 'immune' };
    }
    
    // Check if player has an active proposal (pending challenge)
    const hasActiveProposal = pendingChallenges.some(challenge => 
      challenge.challenger.email === player.email || challenge.defender.email === player.email
    ) || sentChallenges.some(challenge => 
      challenge.challenger.email === player.email || challenge.defender.email === player.email
    );
    
    if (hasActiveProposal) {
      return { status: 'proposal', text: 'Proposal', className: 'proposal' };
    }
    
    // Check if player has a scheduled match
    const hasScheduledMatch = scheduledMatches.some(match => 
      match.player1?.email === player.email || match.player2?.email === player.email
    );
    
    if (hasScheduledMatch) {
      return { status: 'scheduled', text: 'Scheduled', className: 'scheduled' };
    }
    
    return { status: 'active', text: 'Active', className: 'active' };
  };

  const handlePlayerClick = useCallback((player) => {
    console.log('🎯 Player clicked:', player);
    console.log('🎯 Player has unified account:', player.unifiedAccount?.hasUnifiedAccount);
    console.log('🎯 Player unified account email:', player.unifiedAccount?.email);
    console.log('🎯 Player direct email:', player.email);
    console.log('🎯 Player lastMatch:', player.lastMatch);
    console.log('🎯 Full player object:', JSON.stringify(player, null, 2));
    console.log('📊 Setting modal state...');
    console.log('📊 Current showMobilePlayerStats state:', showMobilePlayerStats);
    console.log('📊 Current selectedPlayerForStats state:', selectedPlayerForStats);
    
    setSelectedPlayerForStats(player);
    setShowMobilePlayerStats(true);
    console.log('📊 Modal should now be visible');
    console.log('📊 New showMobilePlayerStats state should be true');
    
    // Use the lastMatch data that's already in the player object
    if (player.lastMatch) {
      console.log('🔍 Using existing lastMatch data from player object:', player.lastMatch);
      setLastMatchData(player.lastMatch);
    } else {
      console.log('🔍 No lastMatch data in player object, trying to fetch...');
      fetchLastMatchData(player);
    }
    
    // Use the recentMatches data that's now included in the player object
    if (player.recentMatches && player.recentMatches.length > 0) {
      console.log('🔍 Using existing recentMatches data from player object:', player.recentMatches);
      console.log('🔍 Number of recent matches:', player.recentMatches.length);
      setPlayerMatchHistory(player.recentMatches);
    } else {
      console.log('🔍 No recentMatches data in player object, trying to fetch...');
      fetchPlayerMatchHistory(player);
    }
    
    fetchUpdatedPlayerData(player);
  }, [showMobilePlayerStats, selectedPlayerForStats]);

  const fetchLastMatchData = async (player) => {
    console.log('🔍 Fetching last match data for player:', player);
    console.log('🔍 Player unifiedAccount:', player.unifiedAccount);
    console.log('🔍 Player email:', player.email);
    console.log('🔍 Player firstName:', player.firstName);
    console.log('🔍 Player lastName:', player.lastName);
    console.log('🔍 Player _id:', player._id);
    
    // Try to get email from unified account first, then fall back to direct email
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email for last match:', emailToUse);
    
    if (!emailToUse) {
      console.log('🔍 No email found anywhere, cannot fetch last match data');
      setLastMatchData(null);
      return;
    }
    
    try {
      // Try using player ID first if available
      if (player._id) {
        console.log('🔍 Trying to fetch match data by player ID:', player._id);
        const url = `${BACKEND_URL}/api/ladder/player/${player._id}/matches?limit=1`;
        console.log('🔍 Last match API URL by ID:', url);
        
        const response = await fetch(url, {
          headers: createSecureHeaders(userPin)
        });
        
        if (response.ok) {
          const matches = await response.json();
          if (matches && matches.length > 0) {
            console.log('🔍 Found match data by ID:', matches[0]);
            setLastMatchData(matches[0]);
            return;
          }
        }
      }
      
      // Fallback to email-based API
      const sanitizedEmail = sanitizeEmail(emailToUse);
      const url = `${BACKEND_URL}/api/ladder/matches/last-match/${encodeURIComponent(sanitizedEmail)}`;
      console.log('🔍 Last match API URL by email:', url);
      console.log('🔍 Original email:', emailToUse);
      console.log('🔍 Sanitized email:', sanitizedEmail);
      
      const response = await fetch(url, {
        headers: createSecureHeaders(userPin)
      });
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
    
    // Try to get email from unified account first, then fall back to direct email
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email:', emailToUse);
    
    if (!emailToUse) {
      console.log('🔍 No email found anywhere, cannot fetch match history');
      setPlayerMatchHistory([]);
      return;
    }
    
    try {
      // Try using player ID first if available
      if (player._id) {
        console.log('🔍 Trying to fetch match history by player ID:', player._id);
        const url = `${BACKEND_URL}/api/ladder/player/${player._id}/matches?limit=10`;
        console.log('🔍 Match history API URL by ID:', url);
        
        const response = await fetch(url, {
          headers: createSecureHeaders(userPin)
        });
        
        if (response.ok) {
          const matches = await response.json();
          console.log('🔍 Found match history by ID:', matches);
          setPlayerMatchHistory(matches);
          return;
        }
      }
      
      // Fallback to email-based API
      const sanitizedEmail = sanitizeEmail(emailToUse);
      const url = `${BACKEND_URL}/api/ladder/player/${encodeURIComponent(sanitizedEmail)}/matches?limit=10`;
      console.log('🔍 Match history API URL by email:', url);
      
      const response = await fetch(url, {
        headers: createSecureHeaders(userPin)
      });
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
    
    // Try to get email from unified account first, then fall back to direct email
    const emailToUse = player.unifiedAccount?.email || player.email;
    console.log('🔍 Using email for player data:', emailToUse);
    
    if (!emailToUse) {
      console.log('🔍 No email found anywhere, using original player data');
      setUpdatedPlayerData(player);
      return;
    }
    
    try {
      // Try using player ID first if available
      if (player._id) {
        console.log('🔍 Trying to fetch updated player data by ID:', player._id);
        const url = `${BACKEND_URL}/api/ladder/player/${player._id}`;
        console.log('🔍 Player data API URL by ID:', url);
        
        const response = await fetch(url, {
          headers: createSecureHeaders(userPin)
        });
        
        if (response.ok) {
          const playerData = await response.json();
          console.log('🔍 Found updated player data by ID:', playerData);
          setUpdatedPlayerData(playerData);
          return;
        }
      }
      
      // Fallback to email-based API
      const sanitizedEmail = sanitizeEmail(emailToUse);
      const url = `${BACKEND_URL}/api/ladder/player/${encodeURIComponent(sanitizedEmail)}`;
      console.log('🔍 Player data API URL by email:', url);
      
      const playerResponse = await fetch(url, {
        headers: createSecureHeaders(userPin)
      });
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
      const sanitizedEmail = sanitizeEmail(userLadderData.email);
      const response = await fetch(`${BACKEND_URL}/api/ladder/player/${encodeURIComponent(sanitizedEmail)}/matches`, {
        headers: createSecureHeaders(userPin)
      });
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

  // Memoize available defenders for Smart Match
  const availableDefenders = useMemo(() => {
    return ladderData.filter(player => 
      player.unifiedAccount?.hasUnifiedAccount && 
      player.unifiedAccount?.email !== userLadderData?.email
    );
  }, [ladderData, userLadderData?.email]);

  const handleSmartMatch = useCallback(() => {
    console.log('🧠 Smart Match clicked');
    console.log('📊 Current ladder data:', ladderData);
    console.log('👤 User ladder data:', userLadderData);
    console.log('🎯 Available defenders:', availableDefenders);
    setShowSmartMatchModal(true);
  }, [ladderData, userLadderData, availableDefenders]);

  const handleChallengeComplete = useCallback((result) => {
    // Refresh challenges and ladder data
    loadChallenges();
    loadData();
  }, []);

  const handleChallengeResponse = useCallback((response, result) => {
    // Show notification based on response type
    if (response === 'accepted' && selectedChallenge) {
      notificationService.showChallengeAcceptedNotification(selectedChallenge);
    } else if (response === 'declined' && selectedChallenge) {
      notificationService.showChallengeDeclinedNotification(selectedChallenge);
    } else if (response === 'counter-proposed' && selectedChallenge) {
      notificationService.showCounterProposalNotification(selectedChallenge);
    }
    
    // Refresh challenges and ladder data
    loadChallenges();
    loadData();
  }, [selectedChallenge]);

  const handleViewChallenge = useCallback((challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeConfirmModal(true);
  }, []);


  const renderLadderView = () => {
    return (
      <div className="ladder-view">
        <LadderErrorBoundary>
          <LadderHeader 
            selectedLadder={selectedLadder}
            setSelectedLadder={setSelectedLadder}
            setHasManuallySelectedLadder={setHasManuallySelectedLadder}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isPublicView={isPublicView}
            setShowMatchCalendar={setShowMatchCalendar}
          />
        </LadderErrorBoundary>
        
        {/* Promotional Pricing Banner */}
        <PromotionalPricingBanner />
        
        <LadderErrorBoundary>
          <LadderTable
            ladderData={ladderData}
            isPublicView={isPublicView}
            userLadderData={userLadderData}
            canChallengePlayer={canChallengePlayer}
            getChallengeReason={getChallengeReason}
            handleChallengePlayer={handleChallengePlayer}
            handlePlayerClick={handlePlayerClick}
            getPlayerStatus={getPlayerStatus}
            isPositionClaimed={isPositionClaimed}
            selectedLadder={selectedLadder}
          />
        </LadderErrorBoundary>
        
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
                      {(() => {
                        const playerStatus = getPlayerStatus(player);
                        return <span className={playerStatus.className}>{playerStatus.text}</span>;
                      })()}
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
        <LadderErrorBoundary>
          <UserStatusCard 
            userLadderData={userLadderData}
            setShowUnifiedSignup={setShowUnifiedSignup}
            isAdmin={isAdmin}
          />
        </LadderErrorBoundary>

        <LadderErrorBoundary>
          <NavigationMenu
            isPublicView={isPublicView}
            navigateToView={navigateToView}
            userLadderData={userLadderData}
            handleSmartMatch={handleSmartMatch}
            setCurrentView={setCurrentView}
            pendingChallenges={pendingChallenges}
            setShowMatchReportingModal={setShowMatchReportingModal}
            setShowPaymentDashboard={setShowPaymentDashboard}
            setShowPrizePoolModal={setShowPrizePoolModal}
            setShowUnifiedSignup={setShowUnifiedSignup}
            setShowRulesModal={setShowRulesModal}
            isAdmin={isAdmin}
            setShowApplicationsManager={setShowApplicationsManager}
            setShowMatchCalendar={setShowMatchCalendar}
          />
        </LadderErrorBoundary>
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
      <div className="tournament-disclaimer">
        <p>
          <strong>⚠️ INDEPENDENT TOURNAMENT SERIES ⚠️</strong><br/>
          This ladder system is <strong>NOT</strong> affiliated with, endorsed by, or sanctioned by the Front Range Pool League, CueSports International, BCA Pool League, or USA Pool League.<br/>
          It is an independent tournament series operated by <strong>Legends Brews and Cues</strong>.
        </p>
      </div>

      {/* Header */}

      {/* Main Content */}
              {currentView === 'ladders' && renderLadderView()}
        {currentView === 'challenges' && renderChallengesView()}
      {currentView === 'challenge' && renderChallengeView()}
      {currentView === 'matches' && renderMatchesView()}
      {currentView === 'main' && renderMainView()}

      {/* Ladder Legend - Above Footer */}
      <div className="ladder-legend">
        {!isPublicView && <p><span className="no-account">*</span> = Complete profile verification and subscribe for full ladder access</p>}
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

             {/* Unified Signup Modal */}
       {showUnifiedSignup && (
         <UnifiedSignupForm 
           onClose={() => setShowUnifiedSignup(false)}
           onSuccess={(data) => {
             console.log('Signup successful:', data);
             setShowUnifiedSignup(false);
             // Refresh the page to show updated status
             window.location.reload();
           }}
           userContext={{
             isLadderPlayer: true,
             isLeaguePlayer: false,
             isUnknownUser: false,
             currentEmail: senderEmail,
             currentName: playerName ? `${playerName} ${playerLastName}` : null,
             purpose: 'profile_verification',
             requiresEmailVerification: true,
             ladderInfo: {
               firstName: selectedPlayerForStats?.firstName || playerName,
               lastName: selectedPlayerForStats?.lastName || playerLastName,
               position: selectedPlayerForStats?.position,
               fargoRate: selectedPlayerForStats?.fargoRate,
               ladder: selectedLadder,
               currentEmail: selectedPlayerForStats?.email || senderEmail
             },
             prefillData: {
               firstName: selectedPlayerForStats?.firstName || playerName || '',
               lastName: selectedPlayerForStats?.lastName || playerLastName || '',
               email: selectedPlayerForStats?.email || senderEmail || '',
               fargoRate: selectedPlayerForStats?.fargoRate || ''
             }
           }}
         />
       )}

       {/* Profile Completion Prompt */}
       {showProfileCompletionPrompt && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           background: 'rgba(0, 0, 0, 0.8)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 99999,
           padding: '20px'
         }}>
           <div style={{
             background: 'white',
             borderRadius: '12px',
             padding: '30px',
             maxWidth: '500px',
             width: '100%',
             textAlign: 'center',
             boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
           }}>
             <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>
               📝 Complete Your Profile
             </h2>
             <p style={{ margin: '0 0 24px 0', color: '#666', lineHeight: '1.5' }}>
               Please complete your profile with contact information, availability, and preferred locations to get full ladder access.
             </p>
             <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
               <button
                 onClick={() => setShowProfileCompletionPrompt(false)}
                 style={{
                   padding: '12px 24px',
                   border: '1px solid #ddd',
                   borderRadius: '6px',
                   background: '#f5f5f5',
                   cursor: 'pointer',
                   fontSize: '14px'
                 }}
               >
                 Later
               </button>
               <button
                 onClick={() => {
                   setShowProfileCompletionPrompt(false);
                   setShowUnifiedSignup(true);
                 }}
                 style={{
                   padding: '12px 24px',
                   border: 'none',
                   borderRadius: '6px',
                   background: '#4CAF50',
                   color: 'white',
                   cursor: 'pointer',
                   fontSize: '14px',
                   fontWeight: 'bold'
                 }}
               >
                 Complete Profile
               </button>
             </div>
           </div>
         </div>
       )}

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
           availableDefenders={availableDefenders}
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

        {showMatchCalendar && (
          <LadderMatchCalendar
            isOpen={showMatchCalendar}
            onClose={() => setShowMatchCalendar(false)}
          />
        )}

        <LadderErrorBoundary>
          <PlayerStatsModal
            showMobilePlayerStats={showMobilePlayerStats}
            selectedPlayerForStats={selectedPlayerForStats}
            setShowMobilePlayerStats={setShowMobilePlayerStats}
            updatedPlayerData={updatedPlayerData}
            lastMatchData={lastMatchData}
            playerMatchHistory={playerMatchHistory}
            showFullMatchHistory={showFullMatchHistory}
            setShowFullMatchHistory={setShowFullMatchHistory}
            getPlayerStatus={getPlayerStatus}
            fetchUpdatedPlayerData={fetchUpdatedPlayerData}
            setShowUnifiedSignup={setShowUnifiedSignup}
            isPublicView={isPublicView}
          />
        </LadderErrorBoundary>

        <LadderErrorBoundary>
          <FullMatchHistoryModal
            showFullMatchHistory={showFullMatchHistory}
            selectedPlayerForStats={selectedPlayerForStats}
            setShowFullMatchHistory={setShowFullMatchHistory}
            setShowMobilePlayerStats={setShowMobilePlayerStats}
            playerMatchHistory={playerMatchHistory}
            isPublicView={isPublicView}
          />
        </LadderErrorBoundary>

        {/* Notification Permission Modal */}
        {showNotificationPermission && (
          <NotificationPermissionModal
            isOpen={showNotificationPermission}
            onClose={() => setShowNotificationPermission(false)}
            onPermissionGranted={() => {
              setShowNotificationPermission(false);
              console.log('✅ Notification permission granted!');
            }}
          />
        )}
        
     </div>
   );
 };

export default LadderApp;
