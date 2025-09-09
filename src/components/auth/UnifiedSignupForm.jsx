import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import DraggableModal from '../modal/DraggableModal.jsx';

const UnifiedSignupForm = ({ onClose, onSuccess, userContext = {} }) => {
  const [currentStep, setCurrentStep] = useState(userContext.isLeaguePlayer || userContext.isUnknownUser ? 2 : 1);
  const [formData, setFormData] = useState({
    firstName: userContext.prefillData?.firstName || '',
    lastName: userContext.prefillData?.lastName || '',
    email: userContext.prefillData?.email || '',
    phone: '',
    fargoRate: '',
    experience: 'beginner',
    currentLeague: '',
    currentRanking: '',
    interests: [],
    payNow: false,
    paymentMethod: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [promotionalConfig, setPromotionalConfig] = useState(null);

  // Load payment configuration
  const loadPaymentConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`);
      if (response.ok) {
        const data = await response.json();
        setPaymentConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
    }
  };

  // Load promotional configuration
  const loadPromotionalConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/promotional-config`);
      if (response.ok) {
        const data = await response.json();
        setPromotionalConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading promotional config:', error);
    }
  };

  useEffect(() => {
    loadPaymentConfig();
    loadPromotionalConfig();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        interests: checked 
          ? [...prev.interests, value]
          : prev.interests.filter(interest => interest !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Check if user exists in system
  const checkUserStatus = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in at least First Name, Last Name, and Email to check your status');
      return;
    }

    setDetecting(true);
    setError('');

    try {
      // Check if user exists in league system
      const leagueResponse = await fetch(`${BACKEND_URL}/api/ladder/player-status/${formData.email}`);
      const leagueStatus = await leagueResponse.json();

      // Check if user exists in ladder system
      const ladderResponse = await fetch(`${BACKEND_URL}/api/ladder/players`);
      const ladderPlayers = await ladderResponse.json();
      
      const existingLadderPlayer = ladderPlayers.find(player => 
        player.firstName?.toLowerCase() === formData.firstName.toLowerCase() &&
        player.lastName?.toLowerCase() === formData.lastName.toLowerCase()
      );
      
      // If we found a ladder player, use their actual name instead of the form data
      if (existingLadderPlayer) {
        console.log('Found ladder player:', existingLadderPlayer);
      }

      setUserStatus({
        isLeaguePlayer: leagueStatus.isLeaguePlayer || false,
        isLadderPlayer: !!existingLadderPlayer,
        leagueInfo: leagueStatus.leagueInfo,
        ladderInfo: existingLadderPlayer,
        existingUser: leagueStatus.isLeaguePlayer || !!existingLadderPlayer
      });

      setCurrentStep(2);
    } catch (error) {
      console.error('Error checking user status:', error);
      setError('Error checking your status. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let successMessage = '';
      let redirectToPayment = false;

      if (userContext.isLeaguePlayer || userStatus?.existingUser) {
        // Handle existing user
        if ((userContext.isLeaguePlayer || userStatus?.isLeaguePlayer) && !userStatus?.isLadderPlayer) {
          // League player - they can choose to join ladder or just keep league access
          if (formData.payNow && (formData.paymentMethod || promotionalConfig?.isPromotionalPeriod)) {
            // They want to join the ladder - create payment session
            const paymentResponse = await fetch(`${BACKEND_URL}/api/monetization/create-membership-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                playerName: `${formData.firstName} ${formData.lastName}`,
                playerEmail: formData.email,
                paymentMethod: formData.paymentMethod || (promotionalConfig?.isPromotionalPeriod ? 'free' : ''),
                amount: promotionalConfig?.isPromotionalPeriod ? 0.00 : 5.00,
                purpose: 'ladder_access'
              })
            });

            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              if (paymentData.paymentType === 'square_redirect' && paymentData.paymentUrl) {
                window.location.href = paymentData.paymentUrl;
                return;
              }
            }

            // Submit ladder signup application for existing league player
            const signupData = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone || '',
              fargoRate: formData.fargoRate || null,
              experience: formData.experience || 'beginner',
              currentLeague: userContext.leagueInfo?.divisions?.length > 0 
                ? userContext.leagueInfo.divisions.join(', ') 
                : 'Front Range Pool Hub', // They're already a league player
              currentRanking: formData.currentRanking || '',
              payNow: formData.payNow,
              paymentMethod: formData.paymentMethod || ''
            };

            console.log('🔍 DEBUG: Sending signup data:', signupData);
            console.log('🔍 DEBUG: userContext:', userContext);
            console.log('🔍 DEBUG: userContext.leagueInfo:', userContext?.leagueInfo);
            console.log('🔍 DEBUG: userContext.leagueInfo.divisions:', userContext?.leagueInfo?.divisions);
            console.log('🔍 DEBUG: divisions length:', userContext?.leagueInfo?.divisions?.length);
            console.log('🔍 DEBUG: currentLeague value:', signupData.currentLeague);

            const signupResponse = await fetch(`${BACKEND_URL}/api/ladder/signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(signupData)
            });

            const signupResult = await signupResponse.json();
            
            if (signupResponse.ok) {
              successMessage = `📋 Ladder application submitted!\n\nThank you for your interest in joining the ladder, ${formData.firstName}!\n\nWe'll review your application and contact you at ${formData.email} within 24-48 hours.\n\nOnce approved, you'll be able to participate in ladder challenges!`;
            } else {
              throw new Error(signupResult.error || 'Failed to submit ladder application');
            }
          } else {
            // They just want to keep their existing league access - no action needed
            if (promotionalConfig?.isPromotionalPeriod) {
              successMessage = `🎉 Welcome back, ${formData.firstName}!\n\nYou have full league access. You can view ladder standings as a guest.\n\n🎉 FREE Monthly Membership until October 1st, 2025! Join the ladder now with no monthly fee - only $5 per match when you play!`;
            } else {
              successMessage = `🎉 Welcome back, ${formData.firstName}!\n\nYou have full league access. You can view ladder standings as a guest.\n\nTo join the ladder and participate in challenges, you can pay the $5/month fee anytime.`;
            }
          }
        } else if (userStatus?.isLadderPlayer) {
          // Existing ladder player - they have account access but need current payment for challenges
          if (promotionalConfig?.isPromotionalPeriod) {
            successMessage = `🎉 Welcome back, ${formData.firstName}!\n\nYou have access to your ladder account and can view standings.\n\n🎉 FREE Monthly Membership until October 1st, 2025! You can participate in challenges and defenses with no monthly fee - only $5 per match when you play!`;
          } else {
            successMessage = `🎉 Welcome back, ${formData.firstName}!\n\nYou have access to your ladder account and can view standings. To participate in challenges and defenses, you'll need to ensure your $5/month payment is current.`;
          }
        } else if (userStatus?.isLeaguePlayer) {
          // League player only - they get free access to league features
          successMessage = `🎉 Welcome back, ${formData.firstName}!\n\nYou have access to league features and can check your ladder status. You can view ladder standings as a guest, but need to ${promotionalConfig?.isPromotionalPeriod ? 'join during our FREE membership promotion' : 'pay $5/month'} to participate in ladder challenges.`;
        }
      } else {
        // New user signup
        if (formData.payNow && (formData.paymentMethod || promotionalConfig?.isPromotionalPeriod)) {
          // Create payment session for new user
          const paymentResponse = await fetch(`${BACKEND_URL}/api/monetization/create-membership-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              playerName: `${formData.firstName} ${formData.lastName}`,
              playerEmail: formData.email,
              paymentMethod: formData.paymentMethod || (promotionalConfig?.isPromotionalPeriod ? 'free' : ''),
              amount: promotionalConfig?.isPromotionalPeriod ? 0.00 : 5.00,
              purpose: 'new_membership'
            })
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            if (paymentData.paymentType === 'square_redirect' && paymentData.paymentUrl) {
              window.location.href = paymentData.paymentUrl;
              return;
            }
          }
        }

        // Submit new user application
        const response = await fetch(`${BACKEND_URL}/api/unified-auth/claim-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            pin: formData.pin || '',
            fargoRate: formData.fargoRate || '',
            experience: formData.experience || '',
            currentLeague: formData.currentLeague || '',
            interests: formData.interests || [],
            payNow: formData.payNow,
            paymentMethod: formData.paymentMethod || '',
            // Include ladder position info if claiming a ladder position
            ladderName: userStatus?.ladderInfo?.ladderName || null,
            position: userStatus?.ladderInfo?.position || null
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to sign up. Please try again.');
        }

        if (formData.payNow && formData.paymentMethod) {
          if (promotionalConfig?.isPromotionalPeriod) {
            successMessage = `🎉 Welcome to Front Range Pool Hub!\n\nYour application has been submitted!\n\n🎉 FREE Monthly Membership until October 1st, 2025! You'll have full ladder access with no monthly fee - only $5 per match when you play! We'll contact you at ${formData.email} within 24-48 hours!`;
          } else {
            if (userContext.isUnknownUser) {
              successMessage = `🎉 Welcome to Front Range Pool Hub!\n\nYour application has been submitted and payment is being processed.\n\nYou'll have full ladder access once payment is confirmed. We'll contact you at ${formData.email} within 24-48 hours!`;
            } else {
              successMessage = `🎉 Welcome to Front Range Pool Hub!\n\nYour application has been submitted and payment is being processed.\n\nYou'll have full ladder access once payment is confirmed. We'll contact you at ${formData.email} within 24-48 hours!`;
            }
          }
        } else {
          if (promotionalConfig?.isPromotionalPeriod) {
            successMessage = `📋 Application submitted!\n\nThank you for your interest in joining Front Range Pool Hub!\n\n🎉 FREE Monthly Membership until October 1st, 2025! You'll have guest access to view standings, and can join the ladder with no monthly fee - only $5 per match when you play! We'll contact you at ${formData.email} within 24-48 hours to set up your account.`;
          } else {
            if (userContext.isUnknownUser) {
              successMessage = `📋 Application submitted!\n\nThank you for your interest in joining Front Range Pool Hub!\n\nYou'll have guest access to view standings. We'll contact you at ${formData.email} within 24-48 hours to set up your account.`;
            } else {
              successMessage = `📋 Application submitted!\n\nThank you for your interest in joining Front Range Pool Hub!\n\nYou'll have guest access to view standings. We'll contact you at ${formData.email} within 24-48 hours to set up your account.`;
            }
          }
        }
      }
      
      setMessage(successMessage);
      setShowSuccess(true);
      
      // Don't auto-close - let user read the message and close manually
      // onSuccess && onSuccess({ ...formData, userStatus }); // Commented out to prevent auto-closing
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div>
      <h3 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>
        🎯 Join Front Range Pool Hub
      </h3>
      <p style={{ 
        color: '#ccc', 
        textAlign: 'center', 
        marginBottom: '1.5rem',
        fontSize: '0.95rem'
      }}>
        Tell us about yourself and what you're interested in. We'll check if you already have an account!
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name *"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px'
            }}
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name *"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email Address *"
          value={formData.email}
          onChange={handleInputChange}
          required
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #555',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '14px'
          }}
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone Number (optional)"
          value={formData.phone}
          onChange={handleInputChange}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #555',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '14px'
          }}
        />

        <div>
          <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
            What are you interested in?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {['league', 'ladder', 'both', 'exploring'].map(interest => (
              <label key={interest} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  value={interest}
                  checked={formData.interests.includes(interest)}
                  onChange={handleInputChange}
                />
                {interest === 'league' && '🏆 League Matches'}
                {interest === 'ladder' && '🎯 Ladder Challenges'}
                {interest === 'both' && '🎮 Both'}
                {interest === 'exploring' && '👀 Just Looking'}
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={checkUserStatus}
          disabled={detecting || !formData.firstName || !formData.lastName || !formData.email}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            background: detecting ? '#666' : '#4CAF50',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: detecting ? 'not-allowed' : 'pointer',
            marginTop: '1rem'
          }}
        >
          {detecting ? '🔍 Checking...' : '🔍 Check My Status'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center' }}>
        {userContext.isLeaguePlayer ? '🎯 Join the Ladder!' : 
         userContext.isUnknownUser ? '👋 Welcome to Front Range Pool Hub!' :
         userStatus?.existingUser ? '🎉 We Found You!' : '👋 Welcome!'}
      </h3>

      {/* Promotional Banner */}
      {promotionalConfig?.isPromotionalPeriod && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '1rem',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            🎉 {promotionalConfig.promotionalMessage}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Match fees apply. {promotionalConfig.daysUntilPromotionEnds > 0 && `${promotionalConfig.daysUntilPromotionEnds} days left!`}
          </div>
        </div>
      )}

      {userContext.isLeaguePlayer ? (
        <div style={{
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '6px',
          padding: '0.6rem',
          marginBottom: '0.6rem'
        }}>
          <p style={{ color: '#2196F3', margin: '0 0 0.5rem 0' }}>
            🏆 Thank you for Being a League Player 🏆<br></br>
            Ready to join the ladder?
          </p>
          
          <p style={{ color: '#ffc107', margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
            💡 Ladder Membership Required 💡
          </p>
          <p style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '14px' }}>
            Participation in the Ladder of Legends, requires a $5 monthly membership.
          </p>
        </div>
      ) : userContext.isUnknownUser ? (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '6px',
          padding: '0.6rem',
          marginBottom: '0.6rem'
        }}>
          <p style={{ color: '#ffc107', margin: '0 0 0.5rem 0' }}>
            🆕 New to Front Range Pool Hub?
          </p>
          <p style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '14px' }}>
            Join our community! You can start with free guest access to view standings, or get full ladder access for $5/month.
          </p>
          <p style={{ color: '#4caf50', margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
            🎯 Choose your membership level below
          </p>
        </div>
      ) : userStatus?.existingUser ? (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '6px',
          padding: '0.6rem',
          marginBottom: '0.6rem'
        }}>
          <p style={{ color: '#4caf50', margin: '0 0 0.5rem 0' }}>
            ✅ We found your account in our system!
          </p>
          {userStatus.isLeaguePlayer && (
            <p style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '14px' }}>
              🏆 League Player: {userStatus.leagueInfo?.firstName} {userStatus.leagueInfo?.lastName}
            </p>
          )}
          {userStatus.isLadderPlayer && (
            <p style={{ color: '#ccc', margin: '0 0 0.5rem 0', fontSize: '14px' }}>
              🎯 Ladder Player: {userStatus.ladderInfo?.firstName} {userStatus.ladderInfo?.lastName} - Position #{userStatus.ladderInfo?.position} in {userStatus.ladderInfo?.ladderName}
            </p>
          )}
          {userStatus.isLeaguePlayer && !userStatus.isLadderPlayer && (
            <p style={{ color: '#ffc107', margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
              💡 You can check if you have a ladder position or upgrade to ladder access
            </p>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.3)',
          borderRadius: '6px',
          padding: '0.6rem',
          marginBottom: '0.6rem'
        }}>
          <p style={{ color: '#2196F3', margin: '0 0 0.5rem 0' }}>
            👋 Welcome to Front Range Pool Hub!
          </p>
          <p style={{ color: '#ccc', margin: '0', fontSize: '14px' }}>
            We'll set up your account and get you started with pool matches and challenges.
          </p>
        </div>
      )}

      {!userContext.isLeaguePlayer && (
        <div>
          <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
            Experience Level
          </label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '0.6rem'
            }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      )}

      {!userContext.isLeaguePlayer && (
        <div>
          <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
            Fargo Rate (if known)
          </label>
          <input
            type="number"
            name="fargoRate"
            placeholder="e.g., 450"
            value={formData.fargoRate}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '0.6rem'
            }}
          />
        </div>
      )}

      {!userContext.isLeaguePlayer && (
        <div>
          <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
            Current League (if any)
          </label>
          <input
            type="text"
            name="currentLeague"
            placeholder="e.g., APA, BCA, Local League"
            value={formData.currentLeague}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '0.6rem'
            }}
          />
        </div>
      )}

      <div>
        <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
          Access Level
        </label>
        <div style={{ display: 'grid', gap: '0.2rem', marginBottom: '0.6rem' }}>
          {userContext.isLeaguePlayer ? (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: '#ccc',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: formData.payNow ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
            }}>
              <input
                type="checkbox"
                name="payNow"
                checked={formData.payNow}
                onChange={() => setFormData(prev => ({ ...prev, payNow: !prev.payNow }))}
              />
              💳 {promotionalConfig?.isPromotionalPeriod ? 'FREE Monthly Membership' : 'Pay $5/month'} - Join the Ladder + Challenge Access
            </label>
          ) : userContext.isUnknownUser ? (
            <>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: formData.payNow ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay"
                  checked={formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: true }))}
                />
                💳 {promotionalConfig?.isPromotionalPeriod ? 'FREE Monthly Membership' : 'Pay $5/month'} - Full Ladder Access + Challenges
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: !formData.payNow ? 'rgba(33, 150, 243, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="free"
                  checked={!formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: false }))}
                />
                🆓 Free - Guest Access (View Only)
              </label>
            </>
          ) : userStatus?.isLeaguePlayer && !userStatus?.isLadderPlayer ? (
            <>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: formData.payNow ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay"
                  checked={formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: true }))}
                />
                💳 {promotionalConfig?.isPromotionalPeriod ? 'FREE Monthly Membership' : 'Pay $5/month'} - Ladder Account + Challenge Access
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: !formData.payNow ? 'rgba(33, 150, 243, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="free"
                  checked={!formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: false }))}
                />
                🆓 Free - League Access + Check Ladder Status
              </label>
            </>
          ) : (
            <>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: formData.payNow ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay"
                  checked={formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: true }))}
                />
                💳 {promotionalConfig?.isPromotionalPeriod ? 'FREE Monthly Membership' : 'Pay $5/month'} - Ladder Account + Challenge Access
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#ccc',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #555',
                background: !formData.payNow ? 'rgba(33, 150, 243, 0.1)' : 'transparent'
              }}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="free"
                  checked={!formData.payNow}
                  onChange={() => setFormData(prev => ({ ...prev, payNow: false }))}
                />
                🆓 Free - Guest Access Only
              </label>
            </>
          )}
        </div>
      </div>

      {formData.payNow && (
        <div>
          <label style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            required={formData.payNow}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '0.6rem'
            }}
          >
            <option value="" style={{ background: '#333', color: '#fff' }}>Select Payment Method</option>
            {paymentConfig?.paymentMethods?.venmo?.enabled && (
              <option value="venmo" style={{ background: '#333', color: '#fff' }}>💜 Venmo</option>
            )}
            {paymentConfig?.paymentMethods?.cashapp?.enabled && (
              <option value="cashapp" style={{ background: '#333', color: '#fff' }}>💚 Cash App</option>
            )}
            {paymentConfig?.paymentMethods?.creditCard?.enabled && (
              <option value="creditCard" style={{ background: '#333', color: '#fff' }}>💳 Credit/Debit Card</option>
            )}
            {paymentConfig?.paymentMethods?.applePay?.enabled && (
              <option value="applePay" style={{ background: '#333', color: '#fff' }}>🍎 Apple Pay</option>
            )}
            {paymentConfig?.paymentMethods?.googlePay?.enabled && (
              <option value="googlePay" style={{ background: '#333', color: '#fff' }}>📱 Google Pay</option>
            )}
            {paymentConfig?.paymentMethods?.cash?.enabled && (
              <option value="cash" style={{ background: '#333', color: '#fff' }}>💵 Cash</option>
            )}
            {paymentConfig?.paymentMethods?.check?.enabled && (
              <option value="check" style={{ background: '#333', color: '#fff' }}>📝 Check</option>
            )}
            {!paymentConfig && (
              <>
                <option value="venmo" style={{ background: '#333', color: '#fff' }}>💜 Venmo</option>
                <option value="cashapp" style={{ background: '#333', color: '#fff' }}>💚 Cash App</option>
                <option value="creditCard" style={{ background: '#333', color: '#fff' }}>💳 Credit/Debit Card</option>
                <option value="cash" style={{ background: '#333', color: '#fff' }}>💵 Cash</option>
              </>
            )}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #555',
            background: 'transparent',
            color: '#ccc',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 2,
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            background: loading ? '#666' : '#4CAF50',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : '🎯 Complete Signup'}
        </button>
      </div>
    </div>
  );

  return (
    <DraggableModal
      open={true}
      onClose={onClose}
      title="Join Front Range Pool Hub"
      maxWidth="600px"
    >
      <div style={{ padding: '0.3rem 0' }}>
        {error && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '0.6rem',
            color: '#ffc107'
          }}>
            ⚠️ {error}
          </div>
        )}


        {showSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '1rem',
              color: '#4caf50'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <div style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.6',
                whiteSpace: 'pre-line'
              }}>
                {message}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: '#4CAF50',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </form>
        )}
      </div>
    </DraggableModal>
  );
};

export default UnifiedSignupForm;
