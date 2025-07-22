import { useReducer, useCallback, useMemo } from 'react';

// 🎯 ACTION TYPES - Well organized and typed
export const DASHBOARD_ACTIONS = {
  // UI State Actions
  SET_UI_STATE: 'SET_UI_STATE',
  TOGGLE_MODAL: 'TOGGLE_MODAL',
  RESET_UI_STATE: 'RESET_UI_STATE',
  
  // Data Actions
  SET_DIVISIONS: 'SET_DIVISIONS',
  SET_SELECTED_DIVISION: 'SET_SELECTED_DIVISION',
  SET_NOTES: 'SET_NOTES',
  ADD_NOTE: 'ADD_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_PLAYERS: 'SET_PLAYERS',
  SET_MATCHES: 'SET_MATCHES',
  
  // Selection Actions
  SET_SELECTED_PROPOSAL: 'SET_SELECTED_PROPOSAL',
  SET_SELECTED_MATCH: 'SET_SELECTED_MATCH',
  SET_SELECTED_OPPONENT: 'SET_SELECTED_OPPONENT',
  SET_COUNTER_PROPOSAL: 'SET_COUNTER_PROPOSAL',
  
  // Form Actions
  SET_FORM_DATA: 'SET_FORM_DATA',
  RESET_FORM: 'RESET_FORM',
  SET_PROPOSAL_NOTE: 'SET_PROPOSAL_NOTE',
  SET_NEW_NOTE: 'SET_NEW_NOTE',
  
  // Loading Actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Counter Actions
  SET_COUNTERS: 'SET_COUNTERS',
  INCREMENT_COUNTER: 'INCREMENT_COUNTER',
  
  // Phase Actions
  SET_PHASE: 'SET_PHASE',
  SET_PHASE_OVERRIDE: 'SET_PHASE_OVERRIDE',
  
  // Bulk Actions
  BULK_UPDATE: 'BULK_UPDATE',
  RESET_ALL: 'RESET_ALL'
};

// 🏗️ INITIAL STATE - Perfectly organized
const createInitialState = () => ({
  // UI State - All modal and display states
  ui: {
    // Modal visibility
    showStandings: false,
    showProposalListModal: false,
    showSentProposalListModal: false,
    showCounterModal: false,
    showNoteModal: false,
    showAllMatchesModal: false,
    showOpponents: false,
    showPlayerSearch: false,
    showAdminPlayerSearch: false,
    showPlayerAvailability: false,
    showProposalModal: false,
    showChatModal: false,
    showCompletedModal: false,
    showConfirmationNotice: false,
    showProposalDetailsModal: false,
    showEditProposalModal: false,
    
    // General UI state
    modalOpen: false,
    winnerModalOpen: false,
    showAllMatches: false,
  },
  
  // Business Data - Core application data
  data: {
    divisions: [],
    selectedDivision: "",
    notes: [],
    players: [],
    scheduledMatches: [],
    
    // Statistics
    numToSchedule: 0,
    totalCompleted: 0,
    currentPhaseTotal: 0,
    pendingCount: 0,
    sentCount: 0,
    unreadMessages: 0,
  },
  
  // Selection State - Currently selected items
  selection: {
    proposal: null,
    match: null,
    opponent: null,
    counterProposal: null,
    winnerModalMatch: null,
    winnerModalPlayers: { player1: '', player2: '' },
  },
  
  // Form State - All form inputs and temporary data
  forms: {
    proposalNote: "",
    newNote: "",
    proposalData: null,
    noteError: "",
  },
  
  // Loading State - All loading indicators
  loading: {
    notes: true,
    isLoadingNotes: false,
    isCreatingProposal: false,
    divisions: false,
    players: false,
    matches: false,
  },
  
  // Error State - All error messages
  errors: {
    noteError: "",
    divisionError: "",
    proposalError: "",
    generalError: "",
  },
  
  // Phase State - Game phase management
  phase: {
    currentPhase: "scheduled",
    phaseOverride: null,
  },
  
  // Match State - Match-specific data
  matches: {
    completingMatchId: null,
  }
});

// 🔧 REDUCER FUNCTION - The heart of our state management
function dashboardReducer(state, action) {
  switch (action.type) {
    case DASHBOARD_ACTIONS.SET_UI_STATE:
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };
      
    case DASHBOARD_ACTIONS.TOGGLE_MODAL: {
      const { modalName, isOpen, resetData = {} } = action.payload;
      return {
        ...state,
        ui: {
          ...state.ui,
          [modalName]: isOpen
        },
        // Reset related data when closing modals
        ...(Object.keys(resetData).length > 0 ? {
          selection: { ...state.selection, ...resetData }
        } : {})
      };
    }
    
    case DASHBOARD_ACTIONS.SET_NOTES:
      return {
        ...state,
        data: { ...state.data, notes: action.payload },
        loading: { ...state.loading, notes: false }
      };
      
    case DASHBOARD_ACTIONS.ADD_NOTE: {
      const newNote = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          notes: [newNote, ...state.data.notes]
        },
        forms: {
          ...state.forms,
          newNote: "",
          noteError: ""
        },
        ui: {
          ...state.ui,
          showNoteModal: false
        }
      };
    }
    
    case DASHBOARD_ACTIONS.SET_LOADING: {
      const loadingUpdates = action.payload;
      return {
        ...state,
        loading: { ...state.loading, ...loadingUpdates }
      };
    }
    
    case DASHBOARD_ACTIONS.SET_ERROR: {
      const errorUpdates = action.payload;
      return {
        ...state,
        errors: { ...state.errors, ...errorUpdates }
      };
    }
    
    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🚨 Unknown action type: ${action.type}`);
      }
      return state;
  }
}

// 🎨 CUSTOM HOOK - The beautiful API
export function useDashboardReducer() {
  const [state, dispatch] = useReducer(dashboardReducer, createInitialState());
  
  // 🚀 Memoized action creators for performance
  const actions = useMemo(() => ({
    // UI Actions
    setUiState: (updates) => 
      dispatch({ type: DASHBOARD_ACTIONS.SET_UI_STATE, payload: updates }),
      
    toggleModal: (modalName, isOpen, resetData = {}) => 
      dispatch({ 
        type: DASHBOARD_ACTIONS.TOGGLE_MODAL, 
        payload: { modalName, isOpen, resetData } 
      }),
      
    // Data Actions
    setNotes: (notes) => 
      dispatch({ type: DASHBOARD_ACTIONS.SET_NOTES, payload: notes }),
      
    addNote: (note) => 
      dispatch({ type: DASHBOARD_ACTIONS.ADD_NOTE, payload: note }),
      
    // Loading Actions
    setLoading: (loadingState) => 
      dispatch({ type: DASHBOARD_ACTIONS.SET_LOADING, payload: loadingState }),
      
    // Error Actions
    setError: (errorState) => 
      dispatch({ type: DASHBOARD_ACTIONS.SET_ERROR, payload: errorState }),
      
  }), []);
  
  // 🎯 Computed values for better performance
  const computed = useMemo(() => ({
    effectivePhase: state.phase.phaseOverride || state.phase.currentPhase,
    hasErrors: Object.values(state.errors).some(error => error !== ""),
    isLoading: Object.values(state.loading).some(loading => loading === true),
  }), [state.phase, state.errors, state.loading]);
  
  return {
    state,
    actions,
    computed,
    dispatch,
  };
}

export { createInitialState };
