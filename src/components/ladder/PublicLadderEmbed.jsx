import React, { useState } from 'react';
import LadderApp from './LadderApp.jsx';

// This component renders the existing public ladder view without any authentication
const PublicLadderEmbed = () => {
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#000',
      overflow: 'auto',
      padding: '20px',
      margin: 0,
      position: 'relative',
      top: 0,
      left: 0,
      boxSizing: 'border-box'
    }}>
      {/* Red modal border container */}
      <div style={{
        border: '3px solid #e53e3e',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(229, 62, 62, 0.3)',
        minHeight: 'calc(100vh - 40px)',
        boxSizing: 'border-box'
      }}>
        <LadderApp
          playerName="Guest"
          playerLastName="User"
          senderEmail="guest@frontrangepool.com"
          userPin="GUEST"
          onLogout={() => {}}
          isAdmin={false}
          showClaimForm={false}
          initialView="ladders"
          isPublicView={true}
          onClaimLadderPosition={() => {}}
          claimedPositions={[]}
          isPositionClaimed={() => false}
        />
      </div>
    </div>
  );
};

export default PublicLadderEmbed;