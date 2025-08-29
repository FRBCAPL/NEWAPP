import React, { useState } from "react";
import { BACKEND_URL } from '../../config.js';
import ResponsiveWrapper from "../ResponsiveWrapper";
import PoolSimulation from "../PoolSimulation";
import './EmbeddedLoginForm.css';

export default function EmbeddedLoginForm({ onSuccess, onShowSignup }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);


  const verifyInput = async () => {
    if (!input || input.trim() === '') {
      setMessage("Please enter your email or PIN.");
      return;
    }
    
    const trimmedInput = input.trim();
    setMessage("");
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: trimmedInput
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        setMessage("");
        // Pass userType along with user data
        onSuccess(`${data.user.firstName} ${data.user.lastName}`.trim(), data.user.email, data.user.pin, data.userType);
      } else {
        // Handle different error cases
        if (response.status === 401) {
          setMessage(data.message || "Invalid email or PIN. Please try again.");
        } else if (response.status === 400) {
          setMessage(data.message || "Please enter a valid email or PIN.");
        } else if (response.status >= 500) {
          setMessage("Server error. Please try again in a moment.");
        } else {
          setMessage(data.message || "Login failed. Please try again or contact frbcapl@gmail.com for help.");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("Login verification error:", error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setMessage("Cannot connect to server. Please check your connection and try again.");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === "Enter") verifyInput();
  };

  // Simple error display
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h3>Error</h3>
        <p>Something went wrong. Please refresh the page and try again.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      minHeight: '500px'
    }}>
      <div style={{ 
        position: 'relative',
        width: '800px',
        height: '400px'
      }}>
        
        {/* Login Form Overlay - wider to fit title on one line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          width: '380px',
          pointerEvents: 'auto'
        }}>
          <div style={{ 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #e53e3e',
            borderRadius: '12px',
            width: '100%'
          }}>
            {/* Title First */}
            <h3 style={{ 
              color: 'white', 
              textAlign: 'center', 
              marginBottom: '16px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              🔒 Front Range Pool League
            </h3>
            
            {/* Login Section Second */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Email or PIN"
                autoFocus
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e53e3e',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <button
              onClick={verifyInput}
              disabled={loading}
              type="button"
              style={{
                width: '100%',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                padding: '12px',
                fontSize: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              {loading ? "Verifying..." : "Login to Access Hub"}
            </button>

            {/* First Time User Button */}
            <button
              onClick={onShowSignup}
              type="button"
              style={{
                width: '100%',
                background: 'transparent',
                color: '#FF6B35',
                border: '2px solid #FF6B35',
                padding: '10px',
                fontSize: '0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#FF6B35';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#FF6B35';
              }}
            >
              🆕 First Time User? Apply for Access
            </button>




            
            {message && (
              <p style={{
                color: '#ff6b6b',
                textAlign: 'center',
                margin: '0 0 16px 0',
                fontSize: '0.8rem',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)'
              }}>
                {message}
              </p>
            )}
            
            {/* Apps Selection Third */}
            <p style={{
              color: '#ccc',
              fontSize: '0.7rem',
              textAlign: 'center',
              margin: '0'
            }}>
              Access league matches, ladder challenges, and more
            </p>
          </div>
        </div>

        {/* Pool Simulation - centered */}
        <ResponsiveWrapper aspectWidth={800} aspectHeight={400}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            <PoolSimulation />
          </div>
        </ResponsiveWrapper>
      </div>


    </div>
  );
}
