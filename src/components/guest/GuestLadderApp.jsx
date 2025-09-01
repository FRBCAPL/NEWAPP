import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../config.js';
import './GuestApp.css';

// Import the actual LadderApp component
import LadderApp from '../ladder/LadderApp';
import DraggableModal from '../modal/DraggableModal';

const GuestLadderApp = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('info');
  const [guestUser, setGuestUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: 'beginner',
    fargoRate: '',
    currentLeague: '',
    currentRanking: '',
    message: '',
    payNow: false,
    paymentMethod: ''
  });
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);

  useEffect(() => {
    authenticateGuest();
    loadPaymentConfig();
  }, []);

  // Load payment configuration
  const loadPaymentConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`);
      if (response.ok) {
        const config = await response.json();
        setPaymentConfig(config);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
    }
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setJoinFormData(prev => ({ ...prev, paymentMethod: method }));
    
    // Show payment instructions when method is selected
    if (method) {
      setShowPaymentInstructions(true);
    } else {
      setShowPaymentInstructions(false);
    }
  };

  const getPaymentInstructions = (method) => {
    if (!paymentConfig || !paymentConfig.config) return 'Loading payment instructions...';
    
    const methods = paymentConfig.config.paymentMethods;
    const contactInfo = paymentConfig.config.contactInfo;
    
    switch (method) {
      case 'venmo':
        return methods.venmo?.enabled ? 
          `Send $5 to: ${methods.venmo.username}\nNote: "Ladder Membership - ${joinFormData.firstName} ${joinFormData.lastName}"` :
          'Venmo payments are currently unavailable';
      case 'cashapp':
        return methods.cashapp?.enabled ? 
          `Send $5 to: ${methods.cashapp.username}\nNote: "Ladder Membership - ${joinFormData.firstName} ${joinFormData.lastName}"` :
          'CashApp payments are currently unavailable';
      case 'credit_card':
        return methods.creditCard?.enabled ? 
          `Credit/Debit card payments available. Contact: ${contactInfo?.adminPhone || 'frbcapl@gmail.com'}` :
          'Credit card payments are currently unavailable';
      case 'apple_pay':
        return methods.applePay?.enabled ? 
          `Apple Pay available. Contact: ${contactInfo?.adminPhone || 'frbcapl@gmail.com'}` :
          'Apple Pay is currently unavailable';
      case 'google_pay':
        return methods.googlePay?.enabled ? 
          `Google Pay available. Contact: ${contactInfo?.adminPhone || 'frbcapl@gmail.com'}` :
          'Google Pay is currently unavailable';
      case 'cash':
        return methods.cash?.enabled ? 
          `Cash payments accepted. Contact: ${contactInfo?.adminPhone || 'frbcapl@gmail.com'}` :
          'Cash payments are currently unavailable';
      case 'check':
        return methods.check?.enabled ? 
          `Check payments accepted. Contact: ${contactInfo?.adminPhone || 'frbcapl@gmail.com'}` :
          'Check payments are currently unavailable';
      default:
        return 'Please select a payment method';
    }
  };

  const authenticateGuest = async () => {
    try {
      setLoading(true);
      
      // Authenticate with the guest user credentials
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'guest@frontrangepool.com'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGuestUser(data.user);
        console.log('Guest user authenticated:', data.user);
      } else {
        const errorData = await response.json();
        console.error('Guest authentication failed:', errorData);
        setError('Failed to authenticate guest user');
      }
    } catch (error) {
      console.error('Error authenticating guest:', error);
      setError('Network error during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHub = () => {
    navigate('/');
  };

  const handleJoinLadder = () => {
    console.log('Opening join modal...');
    setShowJoinModal(true);
  };

  const handleViewLadder = () => {
    console.log('View Ladder button clicked! Setting currentView to ladders');
    setCurrentView('ladders');
  };

    const handleJoinSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!joinFormData.firstName || !joinFormData.lastName || !joinFormData.email) {
      alert('Please fill in all required fields (First Name, Last Name, and Email)');
      return;
    }

    setSubmittingJoin(true);

    try {
      // If they want to pay now, create a payment session first
      if (joinFormData.payNow && joinFormData.paymentMethod) {
        const paymentResponse = await fetch(`${BACKEND_URL}/api/monetization/create-membership-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName: `${joinFormData.firstName} ${joinFormData.lastName}`,
            playerEmail: joinFormData.email,
            paymentMethod: joinFormData.paymentMethod,
            amount: 5.00
          })
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment session. Please try again.');
        }

        const paymentData = await paymentResponse.json();
        console.log('Payment session created:', paymentData);
      }

      // For now, we'll simulate a submission and show a success message
      // In a real implementation, this would send to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      let successMessage = `📈 Thank you for your interest in joining the Ladder of Legends!\n\nWe've received your application:\n\nName: ${joinFormData.firstName} ${joinFormData.lastName}\nEmail: ${joinFormData.email}\nExperience: ${joinFormData.experience}${joinFormData.fargoRate ? `\nFargoRate: ${joinFormData.fargoRate}` : ''}${joinFormData.currentLeague ? `\nCurrent League: ${joinFormData.currentLeague}` : ''}${joinFormData.currentRanking ? `\nCurrent Ranking: ${joinFormData.currentRanking}` : ''}`;
      
      if (joinFormData.payNow && joinFormData.paymentMethod) {
        successMessage += `\n\nPayment Method: ${joinFormData.paymentMethod}\nPlease complete your payment using the instructions above.`;
      }
      
      successMessage += `\n\nWe'll contact you at ${joinFormData.email} within 24-48 hours to set up your ladder profile and get you started challenging players!\n\nIn the meantime, you can also reach us directly at: frbcapl@gmail.com`;
      
      alert(successMessage);
      
      // Reset form and close modal
      setJoinFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        experience: 'beginner',
        fargoRate: '',
        currentLeague: '',
        currentRanking: '',
        message: '',
        payNow: false,
        paymentMethod: ''
      });
      setShowJoinModal(false);
    } catch (error) {
      alert('There was an error submitting your application. Please try again or contact us directly at frbcapl@gmail.com');
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Mock functions for guest mode - these will show alerts instead of real functionality
  const guestHandlers = {
    onLogout: () => {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="guest-app-container">
        <div className="guest-app-header">
          <h1>📈 Ladder of Legends - Guest Preview</h1>
          <p>Loading guest access...</p>
          <div className="guest-badge">👀 Guest Mode - Limited Access</div>
        </div>
        <div className="loading-spinner">Authenticating guest user...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-app-container">
        <div className="guest-app-header">
          <h1>📈 Ladder of Legends - Guest Preview</h1>
          <p>Error loading guest access</p>
          <div className="guest-badge">👀 Guest Mode - Limited Access</div>
        </div>
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={handleBackToHub} className="back-btn">
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-app-container">
      {/* Header */}
      <div className="guest-app-header">
        <h1>📈 Ladder of Legends - Guest Preview</h1>
        <p>Experience the actual Ladder of Legends interface with limited functionality</p>
        <div className="guest-badge">👀 Guest Mode - Limited Access</div>
        
        <div className="guest-actions">
          <button 
            type="button"
            onClick={handleBackToHub} 
            className="back-btn"
          >
            ← Back to Hub
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('View Ladder button clicked!');
              handleViewLadder();
            }} 
            className="view-ladder-btn"
          >
            View Ladder
          </button>
          <button 
            type="button"
            onClick={handleJoinLadder} 
            className="join-btn"
          >
            Join Ladder
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={`tab-btn ${currentView === 'info' ? 'active' : ''}`}
          onClick={() => setCurrentView('info')}
        >
          ℹ️ Ladder Info
        </button>
        <button 
          className={`tab-btn ${currentView === 'app' ? 'active' : ''}`}
          onClick={() => setCurrentView('app')}
        >
          🎮 Try App Interface
        </button>
      </div>

      {/* Content */}
      <div className="content-area">
        {console.log('Current view is:', currentView)}
        {currentView === 'app' && (
          <div className="app-preview-section">
            <div className="guest-notice">
              <h3>🎮 Interactive App Preview</h3>
              <p>You can explore the actual Ladder of Legends interface below. Try clicking buttons and opening modals to see how it works!</p>
              <div className="guest-limitations" style={{ textAlign: 'center' }}>
                <strong>Guest Limitations:</strong>
                <ul style={{ textAlign: 'left', display: 'inline-block', margin: '0.5rem auto' }}>
                  <li>• Can view all interfaces and modals</li>
                  <li>• Cannot submit forms or save data</li>
                  <li>• Cannot send real challenges</li>
                  <li>• Cannot access admin features</li>
                  <li>• Cannot claim ladder positions</li>
                </ul>
              </div>
            </div>

            {/* Actual LadderApp Component with real guest user data */}
            <div className="ladder-preview">
              <LadderApp
                playerName={guestUser?.firstName || 'Guest'}
                playerLastName={guestUser?.lastName || 'User'}
                senderEmail={guestUser?.email || 'guest@frontrangepool.com'}
                userPin={guestUser?.pin || 'GUEST'}
                onLogout={guestHandlers.onLogout}
                isAdmin={false}
              />
            </div>
          </div>
        )}

        {currentView === 'ladders' && (
          <div className="ladders-preview-section">
            <div className="guest-notice">
              <h3>📊 Ladder Rankings</h3>
              <p>View the current ladder rankings and player positions. This is the same interface that logged-in users see!</p>
            </div>

            {/* Ladder Rankings Component */}
            <div className="ladder-rankings-preview">
              <LadderApp
                playerName={guestUser?.firstName || 'Guest'}
                playerLastName={guestUser?.lastName || 'User'}
                senderEmail={guestUser?.email || 'guest@frontrangepool.com'}
                userPin={guestUser?.pin || 'GUEST'}
                onLogout={guestHandlers.onLogout}
                isAdmin={false}
                showClaimForm={false}
                initialView="ladders"
              />
            </div>
          </div>
        )}

        {currentView === 'info' && (
          <div className="info-section">
            <h2>Ladder of Legends Information</h2>
            
                         <div className="info-cards">
               {/* Top Row - Match Types */}
               <div className="info-card">
                 <h3>⚔️ Challenge Matches</h3>
                 <p>Standard ladder climbing system</p>
                 <ul>
                   <li>Challenge  other players<br></br>up to 4 spots above you on the ladder</li>
                   <li>Challenger wins:<br></br> Players switch positions</li>
                   <li>Defender wins:<br></br> Positions remain unchanged</li>
                   <li>7-day immunity for winners</li>
                 </ul>
               </div>

               <div className="info-card">
                 <h3>💥 SmackDown Matches</h3>
                 <p>Shuffle up the ladder system</p>
                 <ul>
                   <li>Call out players up to 5 spots below you on the ladder</li>
                   <li>Challenger pays full entry<br></br> Defender pays 50%</li>
                   <li>Challenger wins: <br></br>Defender moves 3 down<br></br> Challenger moves 2 up</li>
                   <li>Defender wins: Players switch positions</li>
                 </ul>
               </div>

               <div className="info-card">
                 <h3>👑 SmackBack Matches</h3>
                 <p>Jump to 1st place opportunity</p>
                 <ul>
                   <li>Only available after winning a SmackDown as Defender</li>
                   <li>Must call out 1st place within 7 days</li>
                   <li>Challenger wins:<br></br> Challenger claims 1st place<br></br>All others move down</li>
                   <li>Defender wins: Positions unchanged</li>
                 </ul>
               </div>

                               {/* Second Row - Rules & Structure */}
                <div className="info-card">
                  <h3>📅 Top 5 Exception</h3>
                  <p>Special rules for top-ranked players</p>
                  <ul>
                    <li>Top 5 matches:<br></br> Saturdays/Sundays only</li>
                    <li>Location: Legends Brews & Cues (2pm-8pm)</li>
                    <li>Live streamed on Legends Facebook page</li>
                    <li>Admin/TD present as referee</li>
                  </ul>
                </div>

                <div className="info-card">
                  <h3>🎯 Match Rules</h3>
                  <p>Flexible format with minimum requirements</p>
                  <ul>
                    <li>All races are even - No handicaps</li>
                    <li>CSI rule set (8, 9, or 10 ball allowed)</li>
                    <li>7 or 9-foot tables by agreement</li>
                    <li>Winner takes all entry fees and prizes</li>
                  </ul>
                </div>

               <div className="info-card">
                 <h3>💳 Payment Structure</h3>
                 <p>Simple and transparent pricing</p>
                 <ul>
                   <li><strong>Ladder Membership:</strong> $5/month</li>
                   <li><strong>Match Fees:</strong> $5 per match (total)</li>
                   <li><strong>Fee Distribution:</strong> $3 to prize pool<br></br>$2 to platform</li>
                   <li><strong>Payment Methods:</strong> Venmo, Cashapp, CC/Debit, Cash</li>
                   <li><strong>Billing:</strong> Monthly automatic renewal</li>
                 </ul>
               </div>

               {/* Third Row - Disclaimer */}
               <div className="info-card">
                 <h3 style={{ 
                   fontSize: '1.2rem', 
                   lineHeight: '1.3', 
                   marginBottom: '0.5rem',
                   wordWrap: 'break-word'
                 }}>
                   ⚠️ Independent<br>
                   </br>Tournament Series ⚠️
                 </h3>
                 <p style={{ 
                   fontSize: '0.9rem', 
                   marginBottom: '0.75rem',
                   fontStyle: 'italic'
                 }}>
                   Important legal disclaimer
                 </p>
                 <ul style={{ 
                   fontSize: '0.85rem', 
                   lineHeight: '1.4',
                   paddingLeft: '1.2rem'
                 }}>
                   <li><strong>NOT affiliated</strong> with Front Range Pool League</li>
                   <li><strong>NOT endorsed</strong> by CSI, BCAPL, or USAPL</li>
                   <li><strong>NOT sanctioned</strong> by any governing body</li>
                   <li>Independent tournament series operated by <strong>Legends Brews and Cues</strong></li>
                   <li>Front Range Pool just assists <strong>Legends Brews and Cues</strong> with their ladder system</li>
                 </ul>
               </div>
             </div>

            <div className="join-section">
              <h3>Ready to Challenge?</h3>
              <p>Join the ladder and start climbing the rankings!</p>
              <button onClick={handleJoinLadder} className="join-btn-large">
                📈 Join the Ladder Today
              </button>
              <p className="contact-info">
                Contact: <strong>frbcapl@gmail.com</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Join Ladder Modal */}
      {showJoinModal && (
        <DraggableModal
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          title="📈 Join Ladder of Legends"
          maxWidth="700px"
        >
          <form onSubmit={handleJoinSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <label htmlFor="firstName" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={joinFormData.firstName}
                  onChange={(e) => setJoinFormData({...joinFormData, firstName: e.target.value})}
                  required
                  placeholder="Enter your first name"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="lastName" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={joinFormData.lastName}
                  onChange={(e) => setJoinFormData({...joinFormData, lastName: e.target.value})}
                  required
                  placeholder="Enter your last name"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <label htmlFor="email" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={joinFormData.email}
                  onChange={(e) => setJoinFormData({...joinFormData, email: e.target.value})}
                  required
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="phone" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={joinFormData.phone}
                  onChange={(e) => setJoinFormData({...joinFormData, phone: e.target.value})}
                  placeholder="Enter your phone number (optional)"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <label htmlFor="fargoRate" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Fargo Rate, if applicable</label>
                <input
                  type="number"
                  id="fargoRate"
                  value={joinFormData.fargoRate}
                  onChange={(e) => setJoinFormData({...joinFormData, fargoRate: e.target.value})}
                  min="0"
                  max="850"
                  placeholder="Enter your Fargo rate (optional)"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="experience" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Experience Level</label>
                <select
                  id="experience"
                  value={joinFormData.experience}
                  onChange={(e) => setJoinFormData({...joinFormData, experience: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <label htmlFor="currentLeague" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Current League (Optional)</label>
                <input
                  type="text"
                  id="currentLeague"
                  value={joinFormData.currentLeague}
                  onChange={(e) => setJoinFormData({...joinFormData, currentLeague: e.target.value})}
                  placeholder="e.g., APA, BCA, Local League"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label htmlFor="currentRanking" style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>Current Ranking (Optional)</label>
                <input
                  type="text"
                  id="currentRanking"
                  value={joinFormData.currentRanking}
                  onChange={(e) => setJoinFormData({...joinFormData, currentRanking: e.target.value})}
                  placeholder="e.g., 5, 6, 7, 8, 9"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="message" style={{
                display: 'block',
                color: '#fff',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>Additional Message (Optional)</label>
              <textarea
                id="message"
                value={joinFormData.message}
                onChange={(e) => setJoinFormData({...joinFormData, message: e.target.value})}
                placeholder="Tell us about your pool experience, goals, or any questions you have..."
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  minHeight: '60px',
                  maxHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

                         {/* Payment Section */}
             <div style={{ 
               marginBottom: '1rem',
               padding: '1rem',
               background: 'rgba(76, 175, 80, 0.1)',
               border: '1px solid rgba(76, 175, 80, 0.3)',
               borderRadius: '8px'
             }}>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 marginBottom: '0.5rem'
               }}>
                 <input
                   type="checkbox"
                   checked={joinFormData.payNow}
                   onChange={(e) => setJoinFormData({...joinFormData, payNow: e.target.checked})}
                   style={{ cursor: 'pointer' }}
                 />
                 <label style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1rem' }}>
                   💳 Pay $5 Monthly Fee Now (Optional)
                 </label>
               </div>
               <p style={{ 
                 color: '#ccc', 
                 fontSize: '0.9rem', 
                 margin: '0',
                 fontStyle: 'italic'
               }}>
                 If you pay now, you'll be added to the ladder immediately after approval.<br></br> If not, you'll need to pay before being added to the ladder system.
               </p>
               
                               {/* Payment Method Selection - Only show if payNow is checked */}
                {joinFormData.payNow && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#4caf50',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '0.95rem'
                    }}>Select Payment Method: *</label>
                    <select
                      value={joinFormData.paymentMethod}
                      onChange={handlePaymentMethodChange}
                      required={joinFormData.payNow}
                      style={{
                        width: '100%',
                        padding: '0.8rem',
                        border: '2px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Choose payment method...</option>
                      <option value="venmo">Venmo</option>
                      <option value="cashapp">CashApp</option>
                      <option value="credit_card">Credit/Debit Card</option>
                      <option value="apple_pay">Apple Pay</option>
                      <option value="google_pay">Google Pay</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                    </select>
                    
                    {/* Payment Instructions */}
                    {showPaymentInstructions && joinFormData.paymentMethod && (
                      <div style={{ 
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px'
                      }}>
                        <h4 style={{
                          color: '#4caf50',
                          margin: '0 0 0.5rem 0',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}>💳 Payment Instructions</h4>
                        <div style={{
                          color: '#fff',
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-line'
                        }}>
                          {getPaymentInstructions(joinFormData.paymentMethod)}
                        </div>
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: 'rgba(255, 193, 7, 0.1)',
                          border: '1px solid rgba(255, 193, 7, 0.3)',
                          borderRadius: '4px',
                          color: '#ffc107',
                          fontSize: '0.85rem'
                        }}>
                          ⚠️ Please complete your payment before submitting this form. Your application will be processed once payment is received.
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.5rem'
            }}>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                disabled={submittingJoin}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  background: 'transparent',
                  color: '#ccc',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingJoin}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {submittingJoin ? 'Submitting...' : '📈 Join Ladder of Legends'}
              </button>
            </div>
          </form>

          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '8px',
            padding: '0.6rem',
            marginTop: '0.5rem'
          }}>
            <h3 style={{
              color: '#4CAF50',
              margin: '0 0 0.5rem 0',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}>📋 What to Expect</h3>
            <ul style={{
              margin: '0',
              paddingLeft: '1rem',
              color: '#ccc',
              fontSize: '0.9rem',
              lineHeight: '1.3'
            }}>
              <li>We'll review your application and contact you as soon as possible</li>
              <li>Get your FargoRate established and choose your skill tier</li>
              <li>Start challenging players and climbing the rankings</li>
              <li>Track your progress and compete in the ladder system</li>
            </ul>
          </div>
        </DraggableModal>
      )}
    </div>
  );
};

export default GuestLadderApp;
