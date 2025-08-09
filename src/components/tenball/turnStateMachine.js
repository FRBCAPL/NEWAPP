// Centralized helpers for turn/phases to avoid scattering string checks

export const PHASES = {
  BREAK: 'break',
  PLAY: 'play',
};

export function isBreak(phase) {
  return phase === PHASES.BREAK;
}

export function isPlay(phase) {
  return phase === PHASES.PLAY;
}

// Determine next phase at the end of an animation step
export function nextPhaseAfterShot(previousPhase, allStopped) {
  if (previousPhase === PHASES.BREAK && allStopped) {
    return PHASES.PLAY;
  }
  return previousPhase;
}

// Should we enable push out after the break just ended?
export function shouldEnablePushOut(previousPhase, allStopped) {
  return previousPhase === PHASES.BREAK && allStopped;
}

// UI helper: whether push out controls/badge should show now
export function canShowPushOut(currentPhase, pushOutAvailable) {
  return currentPhase === PHASES.PLAY && pushOutAvailable;
}


