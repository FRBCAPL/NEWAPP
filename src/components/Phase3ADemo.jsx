import React from 'react';
import { useDashboardReducer, DASHBOARD_ACTIONS } from '../hooks/useDashboardReducer';

/**
 * 🚀 PHASE 3A DEMO: Master Reducer System
 * 
 * This component demonstrates the power of our new reducer-based state management.
 * Add this temporarily to see the improvements in action!
 * 
 * Usage: Import and add <Phase3ADemo /> to any component
 */
export default function Phase3ADemo() {
  const { state, actions, computed } = useDashboardReducer();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ 
        marginBottom: '15px', 
        fontWeight: 'bold',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        🚀 Phase 3A: Master Reducer Demo
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>📊 State Structure:</strong>
        <div style={{ marginLeft: '10px', marginTop: '5px' }}>
          <div>🎛️ UI: {Object.keys(state.ui).length} modal states</div>
          <div>📁 Data: {Object.keys(state.data).length} data properties</div>
          <div>⏳ Loading: {Object.keys(state.loading).length} loading states</div>
          <div>❌ Errors: {Object.keys(state.errors).length} error states</div>
          <div>📝 Forms: {Object.keys(state.forms).length} form fields</div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong>🎯 Active States:</strong>
        <div style={{ marginLeft: '10px', marginTop: '5px' }}>
          <div>Notes: {state.data.notes.length} items</div>
          <div>Loading: {computed.isLoading ? '🟡 Yes' : '🟢 No'}</div>
          <div>Errors: {computed.hasErrors ? '🔴 Yes' : '🟢 None'}</div>
          <div>Phase: {computed.effectivePhase}</div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>⚡ Quick Actions:</strong>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => actions.toggleModal('showNoteModal', !state.ui.showNoteModal)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Toggle Note Modal
          </button>
          
          <button
            onClick={() => actions.addNote({
              _id: Date.now().toString(),
              text: `Demo note ${Date.now()}`,
              createdAt: new Date()
            })}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Add Demo Note
          </button>
          
          <button
            onClick={() => actions.setError({ noteError: 'Demo error message' })}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Test Error
          </button>
        </div>
      </div>

      <div style={{ 
        fontSize: '10px', 
        textAlign: 'center',
        opacity: 0.8,
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        🎉 Phase 3A: Professional State Management
      </div>
    </div>
  );
}
