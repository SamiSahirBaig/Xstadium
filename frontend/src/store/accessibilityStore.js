import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAccessibilityStore = create(
  persist(
    (set) => ({
      highContrast: false,
      dyslexicFont: false,
      reducedMotion: false,
      
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      toggleDyslexicFont: () => set((state) => ({ dyslexicFont: !state.dyslexicFont })),
      toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
    }),
    {
      name: 'arena-a11y-storage',
    }
  )
);
