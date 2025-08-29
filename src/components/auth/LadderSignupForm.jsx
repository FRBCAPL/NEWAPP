import React, { useState } from 'react';
import { BACKEND_URL } from '../../config.js';
import DraggableModal from '../modal/DraggableModal.jsx';

const HubSignupForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    fargoRate: '',
    experience: '',
    currentLeague: '',
    currentRanking: '',
    interests: [],
    payNow: false,
    paymentMethod: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);

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

  // Load payment config on component mount
  React.useEffect(() => {
    loadPaymentConfig();
  }, []);

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setFormData(prev => ({ ...prev, paymentMethod: method }));
    
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
          `Send $5 to: ${methods.venmo.username}\nNote: "Ladder Membership - ${formData.firstName} ${formData.lastName}"` :
          'Venmo payments are currently unavailable';
      case 'cashapp':
        return methods.cashapp?.enabled ? 
          `Send $5 to: ${methods.cashapp.username}\nNote: "Ladder Membership - ${formData.firstName} ${formData.lastName}"` :
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If they want to pay now, create a payment session first
      if (formData.payNow && formData.paymentMethod) {
        const paymentResponse = await fetch(`${BACKEND_URL}/api/monetization/create-membership-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playerName: `${formData.firstName} ${formData.lastName}`,
            playerEmail: formData.email,
            paymentMethod: formData.paymentMethod,
            amount: 5.00
          })
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment session. Please try again.');
        }

        const paymentData = await paymentResponse.json();
        console.log('Payment session created:', paymentData);
      }

      // Submit the signup application
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up. Please try again.');
      }

      if (formData.payNow && formData.paymentMethod) {
        setMessage('Successfully applied for access to the Front Range Pool Hub! Please complete your payment using the instructions above, then we will contact you soon.');
      } else {
        setMessage('Successfully applied for access to the Front Range Pool Hub! We will contact you soon.');
      }
      
      setTimeout(() => {
        onSuccess && onSuccess(data);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal
      open={true}
      onClose={onClose}
      title="Join the Front Range Pool Hub"
      maxWidth="600px"
    >
      <div style={{ padding: '1rem 0' }}>
        <p style={{ 
          color: '#ccc', 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          Tell us about yourself and what you're interested in. We'll get back to you soon!
        </p>

        {error && (
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '1rem',
            color: '#ffc107'
          }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '1rem',
            color: '#4caf50'
          }}>
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
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
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
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

          <div style={{ marginBottom: '0.75rem' }}>
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
              name="email"
              value={formData.email}
              onChange={handleInputChange}
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

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="phone" style={{
              display: 'block',
              color: '#fff',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
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
              }}>Fargo Rate (if known)</label>
              <input
                type="number"
                id="fargoRate"
                name="fargoRate"
                value={formData.fargoRate}
                onChange={handleInputChange}
                placeholder="e.g., 450"
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
              }}>Years of Experience</label>
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
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
                <option value="">Select experience level</option>
                <option value="beginner">Beginner (0-2 years)</option>
                <option value="intermediate">Intermediate (3-5 years)</option>
                <option value="advanced">Advanced (6-10 years)</option>
                <option value="expert">Expert (10+ years)</option>
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
              }}>Current League (if any)</label>
              <input
                type="text"
                id="currentLeague"
                name="currentLeague"
                value={formData.currentLeague}
                onChange={handleInputChange}
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
              }}>Current Ranking (if any)</label>
              <input
                type="text"
                id="currentRanking"
                name="currentRanking"
                value={formData.currentRanking}
                onChange={handleInputChange}
                placeholder="e.g., APA 5, BCA 7, etc."
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>I'm interested in: *</label>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                <input
                  type="checkbox"
                  name="interests"
                  value="ladder"
                  checked={formData.interests.includes('ladder')}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                🏓 Ladder System
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                <input
                  type="checkbox"
                  name="interests"
                  value="league"
                  checked={formData.interests.includes('league')}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                🏆 Singles League
              </label>
            </div>
          </div>

                     {/* Payment Section - Only show if ladder is selected */}
           {formData.interests.includes('ladder') && (
             <div style={{ 
               marginBottom: '1.5rem',
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
                   name="payNow"
                   checked={formData.payNow}
                   onChange={(e) => setFormData(prev => ({ ...prev, payNow: e.target.checked }))}
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
                 If you pay now, you'll be added to the ladder immediately. If not, you'll need to pay before being added to the ladder system.
               </p>
               
                               {/* Payment Method Selection - Only show if payNow is checked */}
                {formData.payNow && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#4caf50',
                      marginBottom: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '0.95rem'
                    }}>Select Payment Method: *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={handlePaymentMethodChange}
                      required={formData.payNow}
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
                    {showPaymentInstructions && formData.paymentMethod && (
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
                          {getPaymentInstructions(formData.paymentMethod)}
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
           )}

          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #e53e3e, #c53030)',
                border: 'none',
                borderRadius: '25px',
                color: '#fff',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                boxShadow: '0 4px 15px rgba(229, 62, 62, 0.3)',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(229, 62, 62, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(229, 62, 62, 0.3)';
              }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </DraggableModal>
  );
};

export default HubSignupForm;
