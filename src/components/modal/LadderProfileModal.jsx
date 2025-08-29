import React, { useState, useEffect } from 'react';

const LadderProfileModal = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  isMobile, 
  onUserUpdate,
  availableLocations = [] // Available pool locations for challenges
}) => {
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [localUser, setLocalUser] = useState(currentUser);

  // Sync local user state with currentUser prop changes
  useEffect(() => {
    setLocalUser(currentUser);
  }, [currentUser]);

  // Start editing a specific section
  const startEditing = (section, data) => {
    setEditingSection(section);
    setEditData(data);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  // Save changes for a section
  const saveSection = async (section) => {
    try {
      console.log('Saving ladder profile section:', section);
      console.log('Edit data:', editData);
      console.log('Current user:', currentUser);
      
      // Check if we have a valid user email
      const userEmail = currentUser?.email;
      if (!userEmail) {
        console.error('No valid user email found');
        alert('Error: No valid user email found. Please refresh the page and try again.');
        return;
      }
      
      console.log('Using user email:', userEmail);
      
      // Force localhost for now
      const backendUrl = 'http://localhost:8080';
      console.log('Using backend URL:', backendUrl);
      
      // First, get the user by email to get their MongoDB _id
      const userResponse = await fetch(`${backendUrl}/api/users/${encodeURIComponent(userEmail)}`);
      if (!userResponse.ok) {
        console.error('Failed to fetch user by email');
        alert('Error: Failed to fetch user data. Please refresh the page and try again.');
        return;
      }
      
      const userData = await userResponse.json();
      const userId = userData.user?._id || userData._id;
      
      if (!userId) {
        console.error('No user ID found in response');
        alert('Error: No user ID found. Please refresh the page and try again.');
        return;
      }
      
      console.log('Found user ID:', userId);
      
      // Handle special cases where the field name differs
      if (section === 'basic') {
        // For basic info, we need to send individual fields
        const requestBody = {
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
          phone: editData.phone
        };
        
        console.log('Sending basic info update:', requestBody);
        
        const response = await fetch(`${backendUrl}/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const updatedUser = await response.json();
          console.log('Basic info updated successfully:', updatedUser);
          // Update local state immediately for instant UI update
          setLocalUser(updatedUser.user);
          onUserUpdate(updatedUser.user);
          setEditingSection(null);
          setEditData({});
          // Show success feedback
          alert('✅ Ladder profile updated successfully!');
        } else {
          const errorData = await response.json();
          console.error('Basic info update failed:', errorData);
          alert(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
        }
        return;
      }
      
      // For other sections, get the correct field value
      let fieldValue;
      if (section === 'ladderLocations') {
        fieldValue = editData.ladderLocations;
      } else if (section === 'ladderAvailability') {
        fieldValue = editData.ladderAvailability;
      } else if (section === 'preferredContacts') {
        fieldValue = editData.preferredContacts;
      } else {
        fieldValue = editData[section];
      }
      
      const requestBody = { [section]: fieldValue };
      console.log('Sending section update:', requestBody);
      
      const response = await fetch(`${backendUrl}/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Section updated successfully:', updatedUser);
        // Update local state immediately for instant UI update
        setLocalUser(updatedUser.user);
        onUserUpdate(updatedUser.user);
        setEditingSection(null);
        setEditData({});
        // Show success feedback
        alert('✅ Ladder profile updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Section update failed:', errorData);
        alert(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating ladder profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle contact preference changes
  const handleContactChange = (preference, checked) => {
    const currentContacts = editData.preferredContacts || localUser.preferredContacts || [];
    const newContacts = checked
      ? [...currentContacts, preference]
      : currentContacts.filter(p => p !== preference);
    
    setEditData(prev => ({
      ...prev,
      preferredContacts: newContacts
    }));
  };

  // Handle availability changes for ladder challenges
  const handleAvailabilityChange = (day, slot, checked) => {
    const currentAvailability = editData.ladderAvailability || localUser.ladderAvailability || {};
    const currentDaySlots = currentAvailability[day] || [];
    
    const newDaySlots = checked 
      ? [...currentDaySlots, slot]
      : currentDaySlots.filter(s => s !== slot);
    
    setEditData(prev => ({
      ...prev,
      ladderAvailability: {
        ...currentAvailability,
        [day]: newDaySlots
      }
    }));
  };

  // Handle location changes for ladder challenges
  const handleLocationChange = (location, checked) => {
    const currentLocations = editData.ladderLocations || localUser.ladderLocations || '';
    const locationArray = currentLocations.split('\n').filter(Boolean);
    
    const newLocations = checked
      ? [...locationArray, location]
      : locationArray.filter(loc => loc !== location);
    
    setEditData(prev => ({
      ...prev,
      ladderLocations: newLocations.join('\n')
    }));
  };

  // Handle new location addition
  const handleAddNewLocation = (newLocation) => {
    if (!newLocation.trim()) return;
    
    const currentLocations = editData.ladderLocations || localUser.ladderLocations || '';
    const locationArray = currentLocations.split('\n').filter(Boolean);
    
    // Check if location already exists
    if (locationArray.some(loc => loc.trim().toLowerCase() === newLocation.trim().toLowerCase())) {
      alert('This location is already in your list!');
      return;
    }
    
    const newLocations = [...locationArray, newLocation.trim()];
    setEditData(prev => ({
      ...prev,
      ladderLocations: newLocations.join('\n')
    }));
  };

  // Get user's current locations (from edit data or current user)
  const getUserLocations = () => {
    const locations = editData.ladderLocations || localUser.ladderLocations || '';
    return locations.split('\n').filter(Boolean);
  };

  // Get locations not yet selected by user
  const getUnselectedLocations = () => {
    const userLocations = getUserLocations();
    return availableLocations.filter(location => 
      !userLocations.some(userLoc => 
        userLoc.trim().toLowerCase() === location.trim().toLowerCase()
      )
    );
  };

  // Copy availability from League app
  const copyFromLeague = async () => {
    try {
      const backendUrl = 'http://localhost:8080';
      const userEmail = currentUser?.email;
      
      if (!userEmail) {
        alert('Error: No valid user email found.');
        return;
      }
      
      const userResponse = await fetch(`${backendUrl}/api/users/${encodeURIComponent(userEmail)}`);
      if (!userResponse.ok) {
        alert('Error: Failed to fetch user data.');
        return;
      }
      
      const userData = await userResponse.json();
      const user = userData.user || userData;
      
      if (!user.availability || Object.keys(user.availability).length === 0) {
        alert('No availability data found in League profile.');
        return;
      }
      
      const confirmed = window.confirm(
        'This will replace your current ladder availability with your league availability. Continue?'
      );
      
      if (confirmed) {
        setEditData(prev => ({
          ...prev,
          ladderAvailability: user.availability
        }));
        alert('✅ League availability copied to ladder profile!');
      }
    } catch (error) {
      console.error('Error copying from league:', error);
      alert('Error copying availability from league.');
    }
  };

  // Copy locations from League app
  const copyLocationsFromLeague = async () => {
    try {
      const backendUrl = 'http://localhost:8080';
      const userEmail = currentUser?.email;
      
      if (!userEmail) {
        alert('Error: No valid user email found.');
        return;
      }
      
      const userResponse = await fetch(`${backendUrl}/api/users/${encodeURIComponent(userEmail)}`);
      if (!userResponse.ok) {
        alert('Error: Failed to fetch user data.');
        return;
      }
      
      const userData = await userResponse.json();
      const user = userData.user || userData;
      
      if (!user.locations) {
        alert('No locations data found in League profile.');
        return;
      }
      
      const confirmed = window.confirm(
        'This will replace your current ladder locations with your league locations. Continue?'
      );
      
      if (confirmed) {
        setEditData(prev => ({
          ...prev,
          ladderLocations: user.locations
        }));
        alert('✅ League locations copied to ladder profile!');
      }
    } catch (error) {
      console.error('Error copying locations from league:', error);
      alert('Error copying locations from league.');
    }
  };

  if (!isOpen || !localUser) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        padding: isMobile ? "10px" : "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          transform: `translate(0px, 0px)`,
          cursor: "default",
          background: "linear-gradient(120deg, #232323 80%, #2a0909 100%)",
          color: "#fff",
          border: "2px solid #e53e3e",
          borderRadius: isMobile ? "0" : "1rem",
          boxShadow: "0 0 32px #e53e3e, 0 0 40px rgba(0,0,0,0.85)",
          width: isMobile ? "95vw" : "auto",
          maxWidth: isMobile ? "95vw" : "750px",
          minWidth: isMobile ? "auto" : "500px",
          margin: isMobile ? "0" : "0 auto",
          left: 0,
          right: 0,
          animation: "modalBounceIn 0.5s cubic-bezier(.21,1.02,.73,1.01)",
          padding: 0,
          position: "relative",
          fontFamily: "inherit",
          boxSizing: "border-box",
          textAlign: "center",
          maxHeight: isMobile ? "70vh" : "75vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#e53e3e",
          padding: "0.8rem 1rem 0.6rem 1rem",
          borderTopLeftRadius: "1rem",
          borderTopRightRadius: "1rem",
          position: "relative",
          cursor: "grab",
          userSelect: "none",
          gap: "0.8rem"
        }}>
          <span 
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, #fff0 0%, #e53e3e 60%, #fff0 100%)",
              borderTopLeftRadius: "1rem",
              borderTopRightRadius: "1rem",
              pointerEvents: "none"
            }}
          ></span>
          <h2 
            style={{
              margin: 0,
              fontSize: isMobile ? "0.9rem" : "1rem",
              fontWeight: "bold",
              textAlign: "center",
              letterSpacing: "0.02em",
              color: "#fff",
              textShadow: "0 1px 12px #000a",
              zIndex: 2,
              flex: 1,
              wordBreak: "break-word",
              minWidth: 0
            }}
          >
            ⚔️ Ladder Challenge Profile
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              transition: "background-color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              minWidth: "24px",
              zIndex: 3
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{
          padding: isMobile ? "0.8rem" : "1rem",
          overflowY: "auto",
          maxHeight: isMobile ? "calc(60vh - 80px)" : "calc(65vh - 80px)"
        }}>
          <div style={{
            display: 'grid',
            gap: isMobile ? '8px' : '10px'
          }}>
            
            {/* Basic Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  👤 Basic Information
                </div>
                {editingSection !== 'basic' && (
                  <button
                    onClick={() => startEditing('basic', {
                      firstName: localUser.firstName || '',
                      lastName: localUser.lastName || '',
                      email: localUser.email || '',
                      phone: localUser.phone || ''
                    })}
                    style={{
                      background: 'rgba(76, 175, 80, 0.2)',
                      border: '1px solid rgba(76, 175, 80, 0.4)',
                      color: '#4CAF50',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.2)'}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
              
              {editingSection === 'basic' ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={editData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="First Name"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                        fontSize: '0.9rem'
                      }}
                    />
                    <input
                      type="text"
                      value={editData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Last Name"
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email"
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Phone"
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => saveSection('basic')}
                      style={{
                        background: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#cccccc', lineHeight: '1.4', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                  <div><strong>Name:</strong> {localUser.firstName} {localUser.lastName}</div>
                  <div><strong>Email:</strong> {localUser.email}</div>
                  <div><strong>Phone:</strong> {localUser.phone || 'Not provided'}</div>
                </div>
              )}
            </div>

            {/* Contact Methods for Challenges */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  📞 Challenge Contact Methods
                </div>
                {editingSection !== 'contacts' && (
                  <button
                    onClick={() => startEditing('contacts', {
                      preferredContacts: localUser.preferredContacts || []
                    })}
                    style={{
                      background: 'rgba(76, 175, 80, 0.2)',
                      border: '1px solid rgba(76, 175, 80, 0.4)',
                      color: '#4CAF50',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.2)'}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
              
              {editingSection === 'contacts' ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['email', 'phone', 'text'].map((method) => (
                      <label key={method} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <input
                          type="checkbox"
                          checked={(editData.preferredContacts || []).includes(method)}
                          onChange={(e) => handleContactChange(method, e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: '#e53e3e' }}
                        />
                        <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => saveSection('preferredContacts')}
                      style={{
                        background: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#cccccc', lineHeight: '1.5', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  {localUser.preferredContacts && localUser.preferredContacts.length > 0 
                    ? localUser.preferredContacts.map(method => method.charAt(0).toUpperCase() + method.slice(1)).join(', ')
                    : 'No preferred methods set'
                  }
                </div>
              )}
            </div>

            {/* Challenge Availability */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  ⏰ Challenge Availability
                </div>
                                 {editingSection !== 'availability' && (
                   <div style={{ display: 'flex', gap: '4px' }}>
                     <button
                       onClick={() => startEditing('availability', {
                         ladderAvailability: localUser.ladderAvailability || {}
                       })}
                       style={{
                         background: 'rgba(76, 175, 80, 0.2)',
                         border: '1px solid rgba(76, 175, 80, 0.4)',
                         color: '#4CAF50',
                         padding: '4px 8px',
                         borderRadius: '4px',
                         fontSize: isMobile ? '0.7rem' : '0.8rem',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.2)'}
                     >
                       ✏️ Edit
                     </button>
                     <button
                       onClick={copyFromLeague}
                       style={{
                         background: 'rgba(255, 193, 7, 0.2)',
                         border: '1px solid rgba(255, 193, 7, 0.4)',
                         color: '#ffc107',
                         padding: '4px 8px',
                         borderRadius: '4px',
                         fontSize: isMobile ? '0.7rem' : '0.8rem',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(255, 193, 7, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(255, 193, 7, 0.2)'}
                     >
                       📋 Copy from League
                     </button>
                   </div>
                 )}
              </div>
              
                             {editingSection === 'availability' ? (
                 <div style={{ display: 'grid', gap: '6px' }}>
                   <div style={{ 
                     color: '#ffc107', 
                     fontSize: '0.85rem', 
                     fontWeight: 'bold',
                     marginBottom: '4px'
                   }}>
                     Quick Time Slot Editor:
                   </div>
                   
                   {/* Quick Add Section */}
                   <div style={{
                     padding: '4px',
                     background: 'rgba(255, 255, 255, 0.03)',
                     borderRadius: '3px',
                     border: '1px solid rgba(255, 255, 255, 0.08)'
                   }}>
                     <div style={{ 
                       color: '#4CAF50', 
                       fontSize: '0.8rem', 
                       fontWeight: 'bold',
                       marginBottom: '3px'
                     }}>
                       ➕ Quick Add:
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '3px', alignItems: 'end' }}>
                       <select
                         id="quick-day"
                         style={{
                           padding: '3px 4px',
                           borderRadius: '3px',
                           border: '1px solid rgba(255, 255, 255, 0.15)',
                           background: 'rgba(0, 0, 0, 0.4)',
                           color: '#ffffff',
                           fontSize: '0.8rem',
                           minHeight: '24px'
                         }}
                       >
                         <option value="">Day</option>
                         <option value="Mon">Mon</option>
                         <option value="Tue">Tue</option>
                         <option value="Wed">Wed</option>
                         <option value="Thu">Thu</option>
                         <option value="Fri">Fri</option>
                         <option value="Sat">Sat</option>
                         <option value="Sun">Sun</option>
                       </select>
                       <input
                         type="time"
                         id="quick-start"
                         style={{
                           padding: '3px 4px',
                           borderRadius: '3px',
                           border: '1px solid rgba(255, 255, 255, 0.15)',
                           background: 'rgba(0, 0, 0, 0.4)',
                           color: '#ffffff',
                           fontSize: '0.8rem',
                           minHeight: '24px'
                         }}
                       />
                       <input
                         type="time"
                         id="quick-end"
                         style={{
                           padding: '3px 4px',
                           borderRadius: '3px',
                           border: '1px solid rgba(255, 255, 255, 0.15)',
                           background: 'rgba(0, 0, 0, 0.4)',
                           color: '#ffffff',
                           fontSize: '0.8rem',
                           minHeight: '24px'
                         }}
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const daySelect = document.getElementById('quick-day');
                           const startInput = document.getElementById('quick-start');
                           const endInput = document.getElementById('quick-end');
                           const day = daySelect.value;
                           const startTime = startInput.value;
                           const endTime = endInput.value;
                           
                           if (!day || !startTime || !endTime) {
                             alert('Please select day, start, and end times.');
                             return;
                           }
                           
                           if (startTime >= endTime) {
                             alert('End time must be after start time.');
                             return;
                           }
                           
                           const formatTime = (time) => {
                             const [hours, minutes] = time.split(':');
                             const hour = parseInt(hours);
                             const ampm = hour >= 12 ? 'PM' : 'AM';
                             const displayHour = hour % 12 || 12;
                             return `${displayHour}:${minutes} ${ampm}`;
                           };
                           
                           const newSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
                           const currentSlots = editData.ladderAvailability?.[day] || localUser.ladderAvailability?.[day] || [];
                           
                           if (currentSlots.includes(newSlot)) {
                             alert('This time slot already exists.');
                             return;
                           }
                           
                           const newSlots = [...currentSlots, newSlot];
                           
                           setEditData(prev => ({
                             ...prev,
                             ladderAvailability: {
                               ...prev.ladderAvailability,
                               [day]: newSlots
                             }
                           }));
                           
                           // Clear inputs
                           daySelect.value = '';
                           startInput.value = '';
                           endInput.value = '';
                         }}
                         style={{
                           background: 'rgba(76, 175, 80, 0.3)',
                           border: '1px solid rgba(76, 175, 80, 0.5)',
                           color: '#4CAF50',
                           padding: '3px 6px',
                           borderRadius: '3px',
                           fontSize: '0.75rem',
                           cursor: 'pointer',
                           fontWeight: 'bold',
                           minHeight: '24px'
                         }}
                       >
                         Add
                       </button>
                     </div>
                   </div>
                   
                   {/* Current Slots Display */}
                   <div style={{
                     padding: '4px',
                     background: 'rgba(255, 255, 255, 0.03)',
                     borderRadius: '3px',
                     border: '1px solid rgba(255, 255, 255, 0.08)'
                   }}>
                     <div style={{ 
                       color: '#4CAF50', 
                       fontSize: '0.8rem', 
                       fontWeight: 'bold',
                       marginBottom: '3px'
                     }}>
                       📅 Current Slots:
                     </div>
                     <div style={{ 
                       maxHeight: '120px', 
                       overflowY: 'auto',
                       display: 'grid',
                       gap: '3px'
                     }}>
                       {Object.entries(editData.ladderAvailability || localUser.ladderAvailability || {}).map(([day, slots]) => 
                         slots.map((slot, index) => (
                           <div key={`${day}-${index}`} style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between',
                             padding: '3px 5px',
                             background: 'rgba(76, 175, 80, 0.1)',
                             borderRadius: '3px',
                             border: '1px solid rgba(76, 175, 80, 0.2)',
                             fontSize: '0.75rem'
                           }}>
                             <span style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: '500' }}>
                               <strong>{day}:</strong> {slot}
                             </span>
                             <button
                               type="button"
                               onClick={() => {
                                 const newSlots = slots.filter((_, i) => i !== index);
                                 setEditData(prev => ({
                                   ...prev,
                                   ladderAvailability: {
                                     ...prev.ladderAvailability,
                                     [day]: newSlots
                                   }
                                 }));
                               }}
                               style={{
                                 background: 'rgba(220, 53, 69, 0.2)',
                                 border: '1px solid rgba(220, 53, 69, 0.3)',
                                 color: '#dc3545',
                                 padding: '2px 4px',
                                 borderRadius: '2px',
                                 fontSize: '0.65rem',
                                 cursor: 'pointer',
                                 fontWeight: 'bold'
                               }}
                             >
                               ✕
                             </button>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                   
                   <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                     <button
                       onClick={() => saveSection('ladderAvailability')}
                       style={{
                         background: '#4CAF50',
                         color: '#fff',
                         border: 'none',
                         padding: '4px 8px',
                         borderRadius: '3px',
                         fontSize: '0.75rem',
                         cursor: 'pointer'
                       }}
                     >
                       💾 Save
                     </button>
                     <button
                       onClick={cancelEditing}
                       style={{
                         background: '#6c757d',
                         color: '#fff',
                         border: 'none',
                         padding: '4px 8px',
                         borderRadius: '3px',
                         fontSize: '0.75rem',
                         cursor: 'pointer'
                       }}
                     >
                       ❌ Cancel
                     </button>
                   </div>
                 </div>
                             ) : (
                 <div style={{ color: '#cccccc', lineHeight: '1.4', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                   {localUser.ladderAvailability && Object.keys(localUser.ladderAvailability).length > 0 
                     ? (() => {
                        const availableDays = Object.entries(localUser.ladderAvailability)
                          .filter(([day, slots]) => slots && slots.length > 0);
                        
                        if (availableDays.length === 0) return 'No availability set';
                        
                        // Group days into a more compact format
                        const dayNames = {
                          'Mon': 'Mon',
                          'Tue': 'Tue', 
                          'Wed': 'Wed',
                          'Thu': 'Thu',
                          'Fri': 'Fri',
                          'Sat': 'Sat',
                          'Sun': 'Sun'
                        };
                        
                        return (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '6px'
                          }}>
                            {availableDays.map(([day, slots]) => (
                              <div key={day} style={{ 
                                padding: '4px 6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.85rem'
                              }}>
                               <span style={{ fontWeight: 'bold', color: '#ffc107' }}>{dayNames[day]}:</span> {slots.join(', ')}
                             </div>
                            ))}
                          </div>
                        );
                      })()
                    : 'No availability set'
                  }
                </div>
              )}
            </div>

            {/* Challenge Locations */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: isMobile ? '6px' : '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  📍 Challenge Locations
                </div>
                                 {editingSection !== 'locations' && (
                   <div style={{ display: 'flex', gap: '4px' }}>
                     <button
                       onClick={() => startEditing('locations', {
                         ladderLocations: localUser.ladderLocations || ''
                       })}
                       style={{
                         background: 'rgba(76, 175, 80, 0.2)',
                         border: '1px solid rgba(76, 175, 80, 0.4)',
                         color: '#4CAF50',
                         padding: '4px 8px',
                         borderRadius: '4px',
                         fontSize: isMobile ? '0.7rem' : '0.8rem',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(76, 175, 80, 0.2)'}
                     >
                       ✏️ Edit
                     </button>
                     <button
                       onClick={copyLocationsFromLeague}
                       style={{
                         background: 'rgba(255, 193, 7, 0.2)',
                         border: '1px solid rgba(255, 193, 7, 0.4)',
                         color: '#ffc107',
                         padding: '4px 8px',
                         borderRadius: '4px',
                         fontSize: isMobile ? '0.7rem' : '0.8rem',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(255, 193, 7, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(255, 193, 7, 0.2)'}
                     >
                       📋 Copy from League
                     </button>
                   </div>
                 )}
              </div>
              
              {editingSection === 'locations' ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {/* Current Selected Locations */}
                  {getUserLocations().length > 0 && (
                    <div>
                      <div style={{ 
                        color: '#4CAF50', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}>
                        📍 Your Selected Locations:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                        {getUserLocations().map((location, index) => (
                          <label key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                          }}>
                            <input
                              type="checkbox"
                              checked={getUserLocations().includes(location)}
                              onChange={(e) => handleLocationChange(location, e.target.checked)}
                              style={{ cursor: 'pointer', accentColor: '#4CAF50' }}
                            />
                            <span style={{ color: '#4CAF50', fontSize: '0.75rem' }}>
                              {location}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Available Locations to Add */}
                  {getUnselectedLocations().length > 0 && (
                    <div>
                      <div style={{ 
                        color: '#ffc107', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}>
                        ➕ Available Locations to Add:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                        {getUnselectedLocations().map((location, index) => (
                          <label key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid rgba(255, 193, 7, 0.3)'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleAddNewLocation(location)}
                              style={{ 
                                cursor: 'pointer', 
                                background: 'none',
                                border: 'none',
                                color: '#ffc107',
                                fontSize: '0.75rem',
                                padding: '0',
                                margin: '0'
                              }}
                            >
                              ➕ Add
                            </button>
                            <span style={{ color: '#ffc107', fontSize: '0.75rem' }}>
                              {location}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No locations available message */}
                  {getUnselectedLocations().length === 0 && getUserLocations().length === 0 && (
                    <div style={{ 
                      color: '#888', 
                      fontSize: '0.8rem', 
                      textAlign: 'center',
                      fontStyle: 'italic'
                    }}>
                      No locations available. Contact admin to add more locations.
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => saveSection('ladderLocations')}
                      style={{
                        background: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '6px'
                }}>
                  {localUser.ladderLocations && localUser.ladderLocations.split('\n').filter(Boolean).map((location, index) => (
                    <span 
                      key={index} 
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        padding: '5px 8px',
                        borderRadius: '8px',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '3px',
                        width: '100%',
                        minHeight: '24px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={location}
                    >
                      📍 {location}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Close Button */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button
              style={{
                background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: isMobile ? '10px 20px' : '12px 24px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)',
                minWidth: isMobile ? '100px' : '120px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #5a6268, #495057)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
              }}
              onClick={onClose}
            >
              ❌ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LadderProfileModal;
