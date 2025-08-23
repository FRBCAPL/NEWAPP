import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../config.js';
import { 
  FaDollarSign, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaClock,
  FaUser,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMoneyBillWave,
  FaCreditCard,
  FaMobile
} from 'react-icons/fa';

export default function PaymentTracker() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentType: 'weekly_dues',
    paymentMethod: 'cash',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [penaltyData, setPenaltyData] = useState({
    amount: '',
    reason: '',
    strikeLevel: '1',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/search?approved=true`);
      if (response.ok) {
        const data = await response.json();
        const playersWithPayments = data.users.map(player => ({
          ...player,
          paymentHistory: player.paymentHistory || [],
          penalties: player.penalties || [],
          currentBalance: calculateCurrentBalance(player),
          paymentStatus: getPaymentStatus(player)
        }));
        setPlayers(playersWithPayments);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const [feeConfig, setFeeConfig] = useState({
    registrationFee: 30,
    weeklyDues: 10,
    totalWeeks: 10,
    penaltyStructure: {
      strike1: 5,
      strike2: 10,
      strike3: 0
    }
  });

  useEffect(() => {
    loadFeeConfig();
  }, []);

  const loadFeeConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payment-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setFeeConfig({
            registrationFee: data.config.registrationFee || 30,
            weeklyDues: data.config.weeklyDues || 10,
            totalWeeks: data.config.totalWeeks || 10,
            penaltyStructure: data.config.penaltyStructure || {
              strike1: 5,
              strike2: 10,
              strike3: 0
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading fee config:', error);
    }
  };

  const calculateCurrentBalance = (player) => {
    // Calculate what they should have paid
    const expectedTotal = feeConfig.registrationFee + (feeConfig.weeklyDues * feeConfig.totalWeeks);
    
    // Calculate what they have paid
    const totalPaid = (player.paymentHistory || []).reduce((sum, payment) => {
      if (payment.paymentType === 'registration_fee' || payment.paymentType === 'weekly_dues') {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    
    // Calculate penalties owed
    const totalPenalties = (player.penalties || []).reduce((sum, penalty) => {
      return sum + penalty.amount;
    }, 0);
    
    return expectedTotal - totalPaid + totalPenalties;
  };

  const getPaymentStatus = (player) => {
    const balance = calculateCurrentBalance(player);
    if (balance <= 0) return 'paid';
    if (balance <= 20) return 'partial';
    return 'overdue';
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || player.paymentStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleAddPayment = async () => {
    if (!selectedPlayer || !paymentData.amount) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${selectedPlayer._id}/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      if (response.ok) {
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          paymentType: 'weekly_dues',
          paymentMethod: 'cash',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
        loadPlayers();
      }
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleAddPenalty = async () => {
    if (!selectedPlayer || !penaltyData.amount) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${selectedPlayer._id}/add-penalty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(penaltyData)
      });
      
      if (response.ok) {
        setShowPenaltyModal(false);
        setPenaltyData({
          amount: '',
          reason: '',
          strikeLevel: '1',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
        loadPlayers();
      }
    } catch (error) {
      console.error('Error adding penalty:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'partial': return '#FF9800';
      case 'overdue': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <FaCheckCircle />;
      case 'partial': return <FaClock />;
      case 'overdue': return <FaExclamationTriangle />;
      default: return <FaUser />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <FaMoneyBillWave />;
      case 'venmo': return <FaMobile />;
      case 'credit_card': return <FaCreditCard />;
      default: return <FaDollarSign />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ animation: 'spin 1s linear infinite' }}>🔄</div>
        <p>Loading payment data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#e53e3e', marginBottom: '20px', textAlign: 'center' }}>
        💰 Payment Tracker
      </h2>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          padding: '15px', 
          background: 'rgba(76, 175, 80, 0.1)', 
          borderRadius: '8px', 
          border: '1px solid #4CAF50',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
            {players.filter(p => p.paymentStatus === 'paid').length}
          </div>
          <div style={{ color: '#fff' }}>Fully Paid</div>
        </div>
        <div style={{ 
          padding: '15px', 
          background: 'rgba(255, 152, 0, 0.1)', 
          borderRadius: '8px', 
          border: '1px solid #FF9800',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
            {players.filter(p => p.paymentStatus === 'partial').length}
          </div>
          <div style={{ color: '#fff' }}>Partial Payment</div>
        </div>
        <div style={{ 
          padding: '15px', 
          background: 'rgba(244, 67, 54, 0.1)', 
          borderRadius: '8px', 
          border: '1px solid #f44336',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {players.filter(p => p.paymentStatus === 'overdue').length}
          </div>
          <div style={{ color: '#fff' }}>Overdue</div>
        </div>
        <div style={{ 
          padding: '15px', 
          background: 'rgba(102, 102, 102, 0.1)', 
          borderRadius: '8px', 
          border: '1px solid #666',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666' }}>
            ${players.reduce((sum, p) => sum + Math.max(0, p.currentBalance), 0).toFixed(2)}
          </div>
          <div style={{ color: '#fff' }}>Total Outstanding</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: '#222',
              color: '#fff'
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #444',
            background: '#222',
            color: '#fff',
            minWidth: '150px'
          }}
        >
          <option value="all">All Status</option>
          <option value="paid">Fully Paid</option>
          <option value="partial">Partial Payment</option>
          <option value="overdue">Overdue</option>
        </select>
        <button
          onClick={() => {/* Export functionality */}}
          style={{
            padding: '10px 15px',
            borderRadius: '6px',
            border: 'none',
            background: '#4CAF50',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaDownload /> Export
        </button>
      </div>

      {/* Players List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredPlayers.map((player) => (
          <div key={player._id} style={{
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ 
                  color: getStatusColor(player.paymentStatus),
                  fontSize: '18px'
                }}>
                  {getStatusIcon(player.paymentStatus)}
                </span>
                <h4 style={{ color: '#fff', margin: 0 }}>
                  {player.firstName} {player.lastName}
                </h4>
              </div>
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                {player.email} • {player.phone || 'No phone'}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: player.currentBalance > 0 ? '#f44336' : '#4CAF50'
              }}>
                ${player.currentBalance.toFixed(2)}
              </div>
              <div style={{ color: '#ccc', fontSize: '12px' }}>
                {player.currentBalance > 0 ? 'Owed' : 'Paid'}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setSelectedPlayer(player);
                  setShowPaymentModal(true);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#4CAF50',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaPlus /> Payment
              </button>
              <button
                onClick={() => {
                  setSelectedPlayer(player);
                  setShowPenaltyModal(true);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#f44336',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaExclamationTriangle /> Penalty
              </button>
              <button
                onClick={() => {
                  setSelectedPlayer(player);
                  // Show detailed view
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #666',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaEye /> Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#333',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>
              Add Payment - {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Payment Type
                </label>
                                 <select
                   value={paymentData.paymentType}
                   onChange={(e) => {
                     const type = e.target.value;
                     let defaultAmount = 0;
                     if (type === 'registration_fee') defaultAmount = feeConfig.registrationFee;
                     else if (type === 'weekly_dues') defaultAmount = feeConfig.weeklyDues;
                     else if (type === 'participation_fee') defaultAmount = feeConfig.registrationFee + (feeConfig.weeklyDues * feeConfig.totalWeeks);
                     
                     setPaymentData(prev => ({ 
                       ...prev, 
                       paymentType: type,
                       amount: defaultAmount
                     }));
                   }}
                   style={{
                     width: '100%',
                     padding: '8px 12px',
                     borderRadius: '6px',
                     border: '1px solid #444',
                     background: '#222',
                     color: '#fff'
                   }}
                 >
                   <option value="registration_fee">Registration Fee (${feeConfig.registrationFee})</option>
                   <option value="weekly_dues">Weekly Dues (${feeConfig.weeklyDues})</option>
                   <option value="participation_fee">Participation Fee (${feeConfig.registrationFee + (feeConfig.weeklyDues * feeConfig.totalWeeks)})</option>
                   <option value="penalty">Penalty Payment</option>
                   <option value="other">Other</option>
                 </select>
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                  step="0.01"
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="venmo">Venmo</option>
                  <option value="credit_card">Credit/Debit Card</option>
                  <option value="check">Check</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                  placeholder="Optional notes about this payment..."
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleAddPayment}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#4CAF50',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Add Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #666',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#333',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>
              Add Penalty - {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Strike Level
                </label>
                                 <select
                   value={penaltyData.strikeLevel}
                   onChange={(e) => {
                     const level = e.target.value;
                     setPenaltyData(prev => ({ 
                       ...prev, 
                       strikeLevel: level,
                       amount: level === '1' ? feeConfig.penaltyStructure.strike1 :
                               level === '2' ? feeConfig.penaltyStructure.strike2 :
                               level === '3' ? feeConfig.penaltyStructure.strike3 : 0
                     }));
                   }}
                   style={{
                     width: '100%',
                     padding: '8px 12px',
                     borderRadius: '6px',
                     border: '1px solid #444',
                     background: '#222',
                     color: '#fff'
                   }}
                 >
                   <option value="1">Strike 1 - ${feeConfig.penaltyStructure.strike1} fine</option>
                   <option value="2">Strike 2 - ${feeConfig.penaltyStructure.strike2} fine</option>
                   <option value="3">
                     Strike 3 - {feeConfig.penaltyStructure.strike3 > 0 ? `$${feeConfig.penaltyStructure.strike3} fine` : 'Removal'}
                   </option>
                 </select>
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Fine Amount ($)
                </label>
                <input
                  type="number"
                  value={penaltyData.amount}
                  onChange={(e) => setPenaltyData(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                  step="0.01"
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Reason
                </label>
                <input
                  type="text"
                  value={penaltyData.reason}
                  onChange={(e) => setPenaltyData(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                  placeholder="Reason for penalty..."
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={penaltyData.date}
                  onChange={(e) => setPenaltyData(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Notes
                </label>
                <textarea
                  value={penaltyData.notes}
                  onChange={(e) => setPenaltyData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#222',
                    color: '#fff',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                  placeholder="Additional details about the penalty..."
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleAddPenalty}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#f44336',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Add Penalty
              </button>
              <button
                onClick={() => setShowPenaltyModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #666',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  flex: '1'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
