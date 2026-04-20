import { create } from 'zustand';

/**
 * routeStore — Active navigation route and routing UI state
 *
 * Manages the computed route displayed on the map,
 * the route sheet modal, and navigation step tracking.
 */
export const useRouteStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  activeRoute: null,       // Current computed route object
  alternateRoute: null,    // Alternate (less crowded) route if available

  isNavigating: false,     // True when user is actively following a route
  currentStep: 0,          // Index into activeRoute.path[]

  destination: null,       // Target zone ID
  origin: null,            // Starting zone ID

  isSheetOpen: false,      // Route selection sheet modal open
  isLoading: false,        // Route computation in progress

  secretRoutes: [],        // Available secret routes for this user

  // ── Route Setters ──────────────────────────────────────────────────────────
  setActiveRoute: (route) => set({ activeRoute: route, currentStep: 0 }),
  setAlternateRoute: (route) => set({ alternateRoute: route }),

  setIsNavigating: (v) => set({ isNavigating: v }),
  setCurrentStep: (step) => set({ currentStep: step }),

  advanceStep: () =>
    set((state) => {
      const max = state.activeRoute?.path?.length - 1 || 0;
      return { currentStep: Math.min(state.currentStep + 1, max) };
    }),

  setDestination: (zoneId) => set({ destination: zoneId }),
  setOrigin: (zoneId) => set({ origin: zoneId }),
  setSheetOpen: (v) => set({ isSheetOpen: v }),
  setLoading: (v) => set({ isLoading: v }),
  setSecretRoutes: (routes) => set({ secretRoutes: routes }),

  // ── Clear Route ─────────────────────────────────────────────────────────────
  clearRoute: () =>
    set({
      activeRoute: null,
      alternateRoute: null,
      isNavigating: false,
      currentStep: 0,
      destination: null,
      origin: null,
    }),

  // ── Computed Getters ────────────────────────────────────────────────────────
  getCurrentZoneInRoute: () => {
    const { activeRoute, currentStep } = get();
    return activeRoute?.path?.[currentStep] || null;
  },

  getNextZoneInRoute: () => {
    const { activeRoute, currentStep } = get();
    return activeRoute?.path?.[currentStep + 1] || null;
  },

  isRouteComplete: () => {
    const { activeRoute, currentStep } = get();
    if (!activeRoute?.path) return false;
    return currentStep >= activeRoute.path.length - 1;
  },

  getRemainingTime: () => {
    const { activeRoute, currentStep } = get();
    if (!activeRoute) return 0;
    const stepsLeft = (activeRoute.path?.length || 0) - currentStep;
    const timePerStep = activeRoute.totalTime / (activeRoute.path?.length || 1);
    return Math.round(stepsLeft * timePerStep);
  },
}));
