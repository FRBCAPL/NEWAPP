import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import DraggableModal from '../modal/DraggableModal.jsx';

const PaymentTracking = ({ onClose }) => {
  const [pendingPayments, setPendingPayments] = useState({
    pendingMemberships: [],
    pendingMatches: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/monetization/pending-payments`);
      if (response.ok) {
        const data = await response.json();
        setPendingPayments(data);
      } else {
        setError('Failed to load pending payments');
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
      setError('Network error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (verified) => {
    if (!selectedPayment) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/monetization/verify-payment-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedPayment.type,
          email: selectedPayment.email,
          paymentId: selectedPayment.paymentId,
          verified: verified,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        // Reload pending payments
        await loadPendingPayments();
        setShowVerifyModal(false);
        setSelectedPayment(null);
        setAdminNotes('');
      } else {
        setError('Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Network error verifying payment');
    }
  };

  const openVerifyModal = (payment, type) => {
    setSelectedPayment({
      ...payment,
      type: type
    });
    setShowVerifyModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DraggableModal
        open={true}
        onClose={onClose}
        title="Payment Tracking"
        maxWidth="1000px"
      >
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loading-spinner">Loading pending payments...</div>
        </div>
      </DraggableModal>
    );
  }

  return (
    <>
      <DraggableModal
        open={true}
        onClose={onClose}
        title="Payment Tracking & Verification"
        maxWidth="1200px"
      >
        <div style={{ padding: '1rem 0' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Pending Memberships */}
            <div>
              <h3 style={{ color: '#4caf50', marginBottom: '1rem' }}>
                📋 Pending Membership Payments ({pendingPayments.pendingMemberships.length})
              </h3>
              
              {pendingPayments.pendingMemberships.length === 0 ? (
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(76, 175, 80, 0.1)', 
                  borderRadius: '8px',
                  color: '#4caf50'
                }}>
                  ✅ No pending membership payments
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {pendingPayments.pendingMemberships.map((membership, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>{membership.email}</strong>
                        <span style={{ color: '#4caf50', fontWeight: 'bold' }}>${membership.amount}</span>
                      </div>
                      
                      <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <div>Method: {membership.paymentMethod}</div>
                        <div>Last Payment: {formatDate(membership.lastPaymentDate)}</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openVerifyModal(membership, 'membership')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Verify Payment
                        </button>
                        <button
                          onClick={() => window.open(`mailto:${membership.email}?subject=Payment Verification Needed&body=Hi, we need to verify your payment for the ladder membership. Please provide transaction details.`, '_blank')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            color: '#ccc',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Match Fees */}
            <div>
              <h3 style={{ color: '#ff9800', marginBottom: '1rem' }}>
                ⚔️ Pending Match Fee Payments ({pendingPayments.pendingMatches.length})
              </h3>
              
              {pendingPayments.pendingMatches.length === 0 ? (
                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(255, 152, 0, 0.1)', 
                  borderRadius: '8px',
                  color: '#ff9800'
                }}>
                  ✅ No pending match fee payments
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {pendingPayments.pendingMatches.map((match, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>{match.challenger} vs {match.defender}</strong>
                        <span style={{ color: '#ff9800', fontWeight: 'bold' }}>${match.amount}</span>
                      </div>
                      
                      <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <div>Method: {match.paymentMethod || 'Not specified'}</div>
                        <div>Match Date: {formatDate(match.matchDate)}</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openVerifyModal(match, 'match_fee')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Verify Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '8px' 
          }}>
            <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>📊 Payment Tracking Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
              <div>
                <strong>Total Pending:</strong> {pendingPayments.pendingMemberships.length + pendingPayments.pendingMatches.length}
              </div>
              <div>
                <strong>Memberships:</strong> {pendingPayments.pendingMemberships.length}
              </div>
              <div>
                <strong>Match Fees:</strong> {pendingPayments.pendingMatches.length}
              </div>
            </div>
          </div>
        </div>
      </DraggableModal>

      {/* Payment Verification Modal */}
      {showVerifyModal && selectedPayment && (
        <DraggableModal
          open={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          title={`Verify Payment - ${selectedPayment.type === 'membership' ? 'Membership' : 'Match Fee'}`}
          maxWidth="500px"
        >
          <div style={{ padding: '1rem 0' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#fff' }}>
                {selectedPayment.type === 'membership' ? selectedPayment.email : `${selectedPayment.challenger} vs ${selectedPayment.defender}`}
              </strong>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '0.5rem' }}>
                Admin Notes (Optional):
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about payment verification..."
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleVerifyPayment(true)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                ✅ Verify Payment
              </button>
              <button
                onClick={() => handleVerifyPayment(false)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                ❌ Reject Payment
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
    </>
  );
};

export default PaymentTracking;
