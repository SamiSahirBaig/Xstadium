import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * userStore — Authenticated user state, tier, points, and preferences
 *
 * Persisted to localStorage so user data survives page refresh.
 * Firebase auth state is synced in App.jsx via onAuthChange.
 */
export const useUserStore = create(
  persist(
    (set, get) => ({
      // ── Auth State ──────────────────────────────────────────────────────────
      user: null,         // Firebase User object
      isLoading: true,    // true while Firebase resolves auth state

      // ── Profile (from Firestore) ────────────────────────────────────────────
      profile: null,      // { uid, displayName, tier, points, badges, preferences }

      // ── Setters ─────────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setProfile: (profile) => set({ profile }),

      updatePoints: (newPoints) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, points: newPoints } : state.profile,
        })),

      updateTier: (newTier) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, tier: newTier } : state.profile,
        })),

      addBadge: (badgeId) =>
        set((state) => {
          if (!state.profile) return state;
          const badges = [...(state.profile.badges || [])];
          if (!badges.includes(badgeId)) badges.push(badgeId);
          return { profile: { ...state.profile, badges } };
        }),

      updatePreferences: (prefs) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, preferences: { ...state.profile.preferences, ...prefs } }
            : state.profile,
        })),

      // ── Computed Getters ────────────────────────────────────────────────────
      isVIP: () => {
        const { profile } = get();
        return profile?.tier ? ['VIP', 'DIAMOND', 'GOLD'].includes(profile.tier) : false;
      },

      isAuthenticated: () => {
        const { user } = get();
        return !!user;
      },

      // ── API Actions ─────────────────────────────────────────────────────────
      checkInToZone: async (targetZone, followedRoute = false) => {
        const { user, profile } = get();
        if (!user || !profile) return null;
        
        try {
          const token = await user.getIdToken();
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          const res = await fetch(`${baseUrl}/api/users/check-in`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentZone: profile.currentZone || 'UNKNOWN', targetZone, followedRoute })
          });
          
          if (!res.ok) throw new Error('Check-in Request Failed');
          const data = await res.json();
          
          // Atomically modify the UI state matching Firebase explicitly
          set(state => ({
            profile: { 
               ...state.profile, 
               points: (state.profile.points || 0) + data.awardedPoints, 
               currentZone: targetZone 
            }
          }));
          return data;
        } catch (err) {
          console.error('[userStore] Check-in Mutation Error:', err);
          return null;
        }
      },

      // ── Logout ──────────────────────────────────────────────────────────────
      clearUser: () => set({ user: null, profile: null, isLoading: false }),
    }),
    {
      name: 'xstadium-user',
      // Only persist profile and preferences — not auth state (re-resolved on mount)
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
