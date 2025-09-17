import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BACKEND_URL } from '../../config.js';
import './SimplifiedAdminDashboard.css';

const SimplifiedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
    fetchAllUsers();
  }, []);

  // Fetch users pending approval
  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/all-users`);
      const data = await response.json();
      
      if (data.success) {
        // Filter for pending users
        const pending = data.users.filter(user => 
          user.isPendingApproval || (!user.isApproved && !user.isActive)
        );
        setPendingUsers(pending);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/all-users`);
      const data = await response.json();
      
      if (data.success) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  // Approve user and add to ladder
  const handleApproveUser = async (userId, userData) => {
    try {
      // Step 1: Approve the user
      const approveResponse = await fetch(`${BACKEND_URL}/api/unified-auth/admin/update-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true,
          isApproved: true,
          isPendingApproval: false
        })
      });

      if (!approveResponse.ok) {
        throw new Error('Failed to approve user');
      }

      // Step 2: Create ladder profile
      const ladderProfileResponse = await fetch(`${BACKEND_URL}/api/ladder/player/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          pin: userData.pin,
          fargoRate: 400 // Default Fargo rate
        })
      });

      if (ladderProfileResponse.ok) {
        alert('✅ User approved and added to ladder successfully!');
        fetchPendingUsers();
        fetchAllUsers();
      } else {
        alert('⚠️ User approved but failed to add to ladder. You may need to add them manually.');
        fetchPendingUsers();
        fetchAllUsers();
      }

    } catch (error) {
      console.error('Error approving user:', error);
      alert('❌ Error approving user: ' + error.message);
    }
  };

  // Reject user
  const handleRejectUser = async (userId) => {
    if (!confirm('Are you sure you want to reject this user?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/admin/delete-user/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ User rejected and removed from system');
        fetchPendingUsers();
        fetchAllUsers();
      } else {
        throw new Error('Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('❌ Error rejecting user: ' + error.message);
    }
  };

  // Reactivate user account
  const handleReactivateUser = async (userId) => {
    if (!confirm('Are you sure you want to reactivate this user account?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/admin/update-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true
        })
      });

      if (response.ok) {
        alert('✅ User account reactivated successfully!');
        fetchPendingUsers();
        fetchAllUsers();
      } else {
        throw new Error('Failed to reactivate user');
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('❌ Error reactivating user: ' + error.message);
    }
  };

  // Soft delete user (move to deleted_users collection)
  const handleSoftDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to remove "${userName}"? They will be moved to a deleted users collection and can be recovered later.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/unified-auth/admin/soft-delete-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletedAt: new Date().toISOString(),
          deletedBy: 'admin'
        })
      });

      if (response.ok) {
        alert(`✅ "${userName}" has been moved to deleted users collection. They can be recovered later if needed.`);
        fetchPendingUsers();
        fetchAllUsers();
      } else {
        throw new Error('Failed to soft delete user');
      }
    } catch (error) {
      console.error('Error soft deleting user:', error);
      alert('❌ Error removing user: ' + error.message);
    }
  };


  // Filter users based on search
  const filteredUsers = allUsers.filter(user => 
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="simplified-admin-dashboard">
      <div className="dashboard-header">
        <h2>🎯 Simplified Admin Dashboard</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending Approvals ({pendingUsers.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            👥 All Users ({allUsers.length})
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'pending' && (
          <div className="pending-section">
            <h3>⏳ Users Pending Approval</h3>
            
            {loading ? (
              <div className="loading">Loading pending users...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="empty-state">
                🎉 No pending approvals! All caught up.
              </div>
            ) : (
              <div className="user-cards">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="user-card pending">
                    <div className="user-header">
                      <h4>{user.firstName} {user.lastName}</h4>
                      <span className="status-badge pending">PENDING</span>
                    </div>
                    
                    <div className="user-details">
                      <p><strong>📧 Email:</strong> {user.email}</p>
                      <p><strong>📱 Phone:</strong> {user.phone || 'Not provided'}</p>
                      <p><strong>📅 Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      <p><strong>🔑 PIN:</strong> {user.pin}</p>
                    </div>

                    <div className="user-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveUser(user._id, user)}
                      >
                        ✅ Approve & Add to Ladder
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectUser(user._id)}
                      >
                        ❌ Reject
                      </button>
                      <button 
                        className="soft-delete-btn"
                        onClick={() => handleSoftDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                      >
                        🗑️ Remove
                      </button>
                      <button 
                        className="details-btn"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="all-users-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="user-cards">
              {filteredUsers.map((user) => (
                <div key={user._id} className={`user-card ${user.isActive ? 'active' : 'inactive'}`}>
                  <div className="user-header">
                    <h4>{user.firstName} {user.lastName}</h4>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  
                  <div className="user-details">
                    <p><strong>📧 Email:</strong> {user.email}</p>
                    <p><strong>📱 Phone:</strong> {user.phone || 'Not provided'}</p>
                    <p><strong>📅 Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p><strong>🔑 PIN:</strong> {user.pin}</p>
                    <p><strong>✅ Approved:</strong> {user.isApproved ? 'Yes' : 'No'}</p>
                  </div>

                  <div className="user-actions">
                    <button 
                      className="details-btn"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetails(true);
                      }}
                    >
                      👁️ View Details
                    </button>
                    {!user.isActive && (
                      <button 
                        className="reactivate-btn"
                        onClick={() => handleReactivateUser(user._id)}
                      >
                        🔄 Reactivate Account
                      </button>
                    )}
                    <button 
                      className="soft-delete-btn"
                      onClick={() => handleSoftDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && createPortal(
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 User Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUserDetails(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {selectedUser.phone || 'Not provided'}
                </div>
                <div className="detail-item">
                  <strong>PIN:</strong> {selectedUser.pin}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="detail-item">
                  <strong>Approved:</strong> {selectedUser.isApproved ? 'Yes' : 'No'}
                </div>
                <div className="detail-item">
                  <strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                </div>
                <div className="detail-item">
                  <strong>Last Updated:</strong> {new Date(selectedUser.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SimplifiedAdminDashboard;
