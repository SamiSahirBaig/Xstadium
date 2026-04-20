import { create } from 'zustand';

export const STEPS = [
  {
    id: 1,
    title: 'Pre-Game Baseline',
    body: 'The event is about to start. Notice the low pressure across the concourse and standard gates.',
    durationMs: 10000,
  },
  {
    id: 2,
    title: 'Half-Time Surge',
    body: 'Suddenly, the phase shifts to Half-Time. Hundreds of fans begin rushing the Food Courts natively driving up pressure limits.',
    durationMs: 12000,
  },
  {
    id: 3,
    title: 'Anomaly Threshold Crossed',
    body: 'The pressure exceeds expected limits! ArenaIQ instantly flags a SURGE anomaly pushing push-notifications out immediately.',
    durationMs: 10000,
  },
  {
    id: 4,
    title: 'AI Interdiction',
    body: 'The user prompts the AI Assistant. "Where is the fastest, safest escape route right now?" The AI interprets the exact live telemetry.',
    durationMs: 15000,
  },
  {
    id: 5,
    title: 'Smart Routing Polyline',
    body: 'A perfectly optimized path draws directly bounding away from the crowd into an uncrowded zone!',
    durationMs: 10000,
  },
  {
    id: 6,
    title: 'VIP Override Activated',
    body: 'For premium users, ArenaIQ completely shifts parameters revealing hidden corridors and VIP lounges completely separated from standard crowds.',
    durationMs: 10000,
  },
  {
    id: 7,
    title: 'Engagement Rewarded',
    body: 'Every optimized behavior is tracked. Following AI routes passively accumulates gamification Points unlocking tiers natively.',
    durationMs: 10000,
  }
];

export const usePresentationStore = create((set, get) => ({
  isActive: false,
  isPaused: false,
  currentStepIndex: 0,

  startPresentation: () => set({ isActive: true, isPaused: false, currentStepIndex: 0 }),
  stopPresentation: () => set({ isActive: false, isPaused: false, currentStepIndex: 0 }),
  
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  
  nextStep: () => set((state) => {
    if (state.currentStepIndex >= STEPS.length - 1) {
       return { isActive: false, currentStepIndex: 0 }; // Auto-complete
    }
    return { currentStepIndex: state.currentStepIndex + 1 };
  }),
  
  prevStep: () => set((state) => ({ 
    currentStepIndex: Math.max(0, state.currentStepIndex - 1) 
  })),

  getCurrentStep: () => STEPS[get().currentStepIndex] || null,
}));
