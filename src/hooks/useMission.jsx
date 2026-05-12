import { createContext, useContext, useReducer, useMemo } from 'react';

const MissionContext = createContext(null);

const initialState = {
  missionType: 'interplanetary',
  origin: 'earth',
  destination: 'mars',
  payloadMass: 1000,
  // The real 2026 Earth→Mars launch window opens late 2026; eye centers ~Nov 2026 / ~Jul 2027.
  launchWindow:  { start: new Date('2026-09-01T00:00:00Z'), end: new Date('2027-02-01T00:00:00Z') },
  arrivalWindow: { start: new Date('2027-05-01T00:00:00Z'), end: new Date('2027-12-01T00:00:00Z') },
  transferType: 'lambert',
  selected: { launchDate: null, arrivalDate: null },
  results: null,
  porkchop: null,
  computing: false,
  progress: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MISSION_TYPE':  return { ...state, missionType: action.value };
    case 'SET_ORIGIN':        return { ...state, origin: action.value };
    case 'SET_DESTINATION':   return { ...state, destination: action.value };
    case 'SET_PAYLOAD':       return { ...state, payloadMass: action.value };
    case 'SET_LAUNCH_WINDOW': return { ...state, launchWindow: action.value };
    case 'SET_ARRIVAL_WINDOW':return { ...state, arrivalWindow: action.value };
    case 'SET_TRANSFER_TYPE': return { ...state, transferType: action.value };
    case 'SET_SELECTED':      return { ...state, selected: action.value, results: action.results ?? state.results };
    case 'SET_RESULTS':       return { ...state, results: action.value };
    case 'SET_PORKCHOP':      return { ...state, porkchop: action.value, computing: false, progress: 1 };
    case 'SET_COMPUTING':     return { ...state, computing: action.value, progress: action.value ? 0 : state.progress };
    case 'SET_PROGRESS':      return { ...state, progress: action.value };
    default: return state;
  }
}

export function MissionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ ...state, dispatch }), [state]);
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMission must be used within MissionProvider');
  return ctx;
}
