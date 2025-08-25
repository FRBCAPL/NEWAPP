import React from 'react';
import { useMobileOptimization } from '../hooks/useMobileOptimization';
import MobileBottomNavigation from './dashboard/MobileBottomNavigation';
import MobileOptimizedCard from './dashboard/MobileOptimizedCard';
import MobileSection, { MobileStatsGrid, MobileStatCard } from './dashboard/MobileSection';

export default function MobileTestPage() {
  const { 
    isMobile, 
    isTablet, 
    screenSize, 
    touchCapable, 
    orientation,
    mobileUtils,
    breakpoints,
    getBreakpoint 
  } = useMobileOptimization();

  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%)',
      color: '#fff',
      padding: '16px',
      paddingBottom: '100px'
    }}>
      {/* Mobile Detection Info */}
      <MobileSection title="Mobile Detection Test">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>📱 Is Mobile: <strong>{isMobile ? 'YES' : 'NO'}</strong></div>
          <div>📱 Is Tablet: <strong>{isTablet ? 'YES' : 'NO'}</strong></div>
          <div>📱 Touch Capable: <strong>{touchCapable ? 'YES' : 'NO'}</strong></div>
          <div>📱 Orientation: <strong>{orientation}</strong></div>
          <div>📱 Screen Size: <strong>{screenSize.width} x {screenSize.height}</strong></div>
          <div>📱 Breakpoint: <strong>{getBreakpoint()}</strong></div>
        </div>
      </MobileSection>

      {/* Touch Test Cards */}
      <MobileSection title="Touch Interaction Test">
        <MobileOptimizedCard
          title="Swipe Test Card"
          subtitle="Try swiping left or right"
          onTap={() => alert('Card tapped!')}
          onSwipeLeft={() => alert('Swiped left!')}
          onSwipeRight={() => alert('Swiped right!')}
        >
          <div style={{ padding: '8px 0' }}>
            <p>This card supports swipe gestures. Try swiping left or right to see the action indicators.</p>
          </div>
        </MobileOptimizedCard>

        <MobileOptimizedCard
          title="Tap Test Card"
          subtitle="Tap to test touch response"
          onTap={() => alert('Touch response working!')}
        >
          <div style={{ padding: '8px 0' }}>
            <p>Tap this card to test touch responsiveness and visual feedback.</p>
          </div>
        </MobileOptimizedCard>
      </MobileSection>

      {/* Stats Grid Test */}
      <MobileSection title="Stats Grid Test">
        <MobileStatsGrid columns={2}>
          <MobileStatCard
            title="Test Stat 1"
            value="42"
            subtitle="Sample data"
            color="#e53e3e"
            onClick={() => alert('Stat 1 clicked!')}
          />
          <MobileStatCard
            title="Test Stat 2"
            value="17"
            subtitle="More data"
            color="#10b981"
            onClick={() => alert('Stat 2 clicked!')}
          />
        </MobileStatsGrid>
      </MobileSection>

      {/* Bottom Navigation Test */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAction={() => alert('Quick action!')}
        pendingCount={3}
        sentCount={5}
        matchesCount={12}
      />
    </div>
  );
}
