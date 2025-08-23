import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import { 
  FaCreditCard, 
  FaPaypal, 
  FaMoneyBillWave, 
  FaCheck, 
  FaApple, 
  FaGoogle,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaMobile,
  FaDollarSign
} from 'react-icons/fa';

export default function PaymentConfiguration() {
  const [config, setConfig] = useState({
    registrationFee: 30,
    weeklyDues: 10,
    totalWeeks: 10,
    participationFee: 100,
    phase1Weeks: 6,
    penaltyStructure: {
      strike1: 5,
      strike2: 10,
      strike3: 0
    },
    paymentMethods: {
      venmo: {
        enabled: true,
        username: '',
        displayName: 'Venmo',
        instructions: 'Send payment to @username'
      },
      cashapp: {
        enabled: true,
        username: '',
        displayName: 'Cash App',
        instructions: 'Send payment to $username'
      },
      creditCard: {
        enabled: false,
        processor: 'square',
        displayName: 'Credit/Debit Card',
        instructions: 'Pay online using the link below',
        paymentLink: '',
        squareAppId: '',
        squareLocationId: ''
      },
      applePay: {
        enabled: false,
        displayName: 'Apple Pay',
        instructions: 'Pay using Apple Pay',
        paymentLink: ''
      },
      googlePay: {
        enabled: false,
        displayName: 'Google Pay',
        instructions: 'Pay using Google Pay',
        paymentLink: ''
      },
      cash: {
        enabled: true,
        displayName: 'Cash',
        instructions: 'Pay in person to league administrator'
      },
      check: {
        enabled: false,
        displayName: 'Check',
        instructions: 'Make check payable to [Payee Name]',
        payeeName: '',
        mailingAddress: ''
      }
    },
    additionalInstructions: '',
    contactInfo: {
      adminName: '',
      adminEmail: '',
      adminPhone: ''
    },
    currentSession: {
      name: 'Current Session',
      startDate: '',
      endDate: '',
      isActive: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Edit mode states for each section
  const [editModes, setEditModes] = useState({
    feeStructure: false,
    phaseConfiguration: false,
    penaltyStructure: false,
    paymentMethods: false,
    additionalInstructions: false,
    contactInfo: false
  });

  useEffect(() => {
    loadPaymentConfig();
  }, []);

  const loadPaymentConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Ensure currentSession object exists
          const configWithDefaults = {
            ...data.config,
            penaltyStructure: {
              strike1: 5,
              strike2: 10,
              strike3: 0,
              ...data.config.penaltyStructure
            },
            currentSession: {
              name: 'Current Session',
              startDate: '',
              endDate: '',
              isActive: true,
              ...data.config.currentSession
            }
          };
          setConfig(configWithDefaults);
        }
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
      setMessage({ type: 'error', text: 'Failed to load payment configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save payment configuration' });
      }
    } catch (error) {
      console.error('Error saving payment config:', error);
      setMessage({ type: 'error', text: 'Error saving payment configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (sectionName, sectionData) => {
    setSavingSection(sectionName);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          ...sectionData
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${sectionName} saved successfully!` });
      } else {
        setMessage({ type: 'error', text: `Failed to save ${sectionName}` });
      }
    } catch (error) {
      console.error(`Error saving ${sectionName}:`, error);
      setMessage({ type: 'error', text: `Error saving ${sectionName}` });
    } finally {
      setSavingSection('');
    }
  };

  const updatePaymentMethod = (methodKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [methodKey]: {
          ...prev.paymentMethods[methodKey],
          [field]: value
        }
      }
    }));
  };

  const updateContactInfo = (field, value) => {
    setConfig(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const getMethodIcon = (methodKey) => {
    switch (methodKey) {
      case 'venmo': return <FaMobile />;
      case 'cashapp': return <FaDollarSign />;
      case 'paypal': return <FaPaypal />;
      case 'creditCard': return <FaCreditCard />;
      case 'applePay': return <FaApple />;
      case 'googlePay': return <FaGoogle />;
      case 'cash': return <FaMoneyBillWave />;
      case 'check': return <FaCheck />;
      default: return <FaCreditCard />;
    }
  };

  const toggleEditMode = (section) => {
    setEditModes(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const cancelEdit = (section) => {
    setEditModes(prev => ({
      ...prev,
      [section]: false
    }));
    // Reload the config to reset any unsaved changes
    loadPaymentConfig();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading payment configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#e53e3e', marginBottom: '20px', textAlign: 'center' }}>
        💳 Payment Configuration
      </h2>
      
      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '10px 15px',
          borderRadius: '6px',
          marginBottom: '20px',
          background: message.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(229, 62, 62, 0.2)',
          border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#e53e3e'}`,
          color: message.type === 'success' ? '#4CAF50' : '#e53e3e',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          {message.text}
        </div>
      )}

      {/* League Fee Structure */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#fff', margin: 0 }}>League Fee Structure</h3>
          <button
            onClick={() => toggleEditMode('feeStructure')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: editModes.feeStructure ? '#ff9800' : '#4CAF50',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {editModes.feeStructure ? '🔒 Cancel Edit' : '✏️ Edit'}
          </button>
        </div>
        
        <div style={{ 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid rgba(255,255,255,0.1)',
          background: editModes.feeStructure ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255,255,255,0.02)',
          opacity: editModes.feeStructure ? 1 : 0.8
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Registration Fee ($)</label>
              <input
                type="number"
                value={config.registrationFee}
                onChange={(e) => setConfig(prev => ({ ...prev, registrationFee: Number(e.target.value) }))}
                disabled={!editModes.feeStructure}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: editModes.feeStructure ? '#222' : '#333',
                  color: editModes.feeStructure ? '#fff' : '#888',
                  cursor: editModes.feeStructure ? 'text' : 'not-allowed'
                }}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Weekly Dues ($)</label>
              <input
                type="number"
                value={config.weeklyDues}
                onChange={(e) => setConfig(prev => ({ ...prev, weeklyDues: Number(e.target.value) }))}
                disabled={!editModes.feeStructure}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: editModes.feeStructure ? '#222' : '#333',
                  color: editModes.feeStructure ? '#fff' : '#888',
                  cursor: editModes.feeStructure ? 'text' : 'not-allowed'
                }}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Total Weeks</label>
              <input
                type="number"
                value={config.totalWeeks}
                onChange={(e) => setConfig(prev => ({ ...prev, totalWeeks: Number(e.target.value) }))}
                disabled={!editModes.feeStructure}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: editModes.feeStructure ? '#222' : '#333',
                  color: editModes.feeStructure ? '#fff' : '#888',
                  cursor: editModes.feeStructure ? 'text' : 'not-allowed'
                }}
                min="1"
              />
            </div>
            <div>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>Participation Fee ($)</label>
              <input
                type="number"
                value={config.participationFee}
                onChange={(e) => setConfig(prev => ({ ...prev, participationFee: Number(e.target.value) }))}
                disabled={!editModes.feeStructure}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: editModes.feeStructure ? '#222' : '#333',
                  color: editModes.feeStructure ? '#fff' : '#888',
                  cursor: editModes.feeStructure ? 'text' : 'not-allowed'
                }}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: 'rgba(76, 175, 80, 0.1)', 
          borderRadius: '6px',
          border: '1px solid #4CAF50'
        }}>
          <div style={{ color: '#4CAF50', fontSize: '14px' }}>
            <strong>Total Session Cost:</strong> ${config.registrationFee + (config.weeklyDues * config.totalWeeks)} 
            ({config.registrationFee} + {config.weeklyDues} × {config.totalWeeks} weeks)
          </div>
        </div>
        
        {/* Save/Cancel Buttons for Fee Structure */}
        {editModes.feeStructure && (
          <div style={{ marginTop: '15px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => handleSaveSection('Fee Structure', {
                registrationFee: config.registrationFee,
                weeklyDues: config.weeklyDues,
                totalWeeks: config.totalWeeks,
                participationFee: config.participationFee
              })}
              disabled={savingSection === 'Fee Structure'}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: savingSection === 'Fee Structure' ? '#666' : '#4CAF50',
                color: '#fff',
                cursor: savingSection === 'Fee Structure' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {savingSection === 'Fee Structure' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSave />}
              {savingSection === 'Fee Structure' ? 'Saving...' : 'Save Fee Structure'}
            </button>
            <button
              onClick={() => cancelEdit('feeStructure')}
              disabled={savingSection === 'Fee Structure'}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: '1px solid #666',
                background: 'transparent',
                color: '#ccc',
                cursor: savingSection === 'Fee Structure' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Placeholder for other sections */}
      <div style={{ textAlign: 'center', padding: '40px', color: '#ccc' }}>
        <p>Other sections will be loaded here...</p>
      </div>
    </div>
  );
}
