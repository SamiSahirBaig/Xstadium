import { create } from 'zustand';

/**
 * zoneStore — Live zone pressure data from WebSocket / Firestore
 *
 * Updated in real-time by the WebSocket listener service.
 * Not persisted — always fetched fresh on mount.
 */
export const useZoneStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  zones: {},        // { [zoneId]: ZoneData }
  alerts: [],       // Active alerts array
  venueMood: null,  // Dominant venue mood string
  eventPhase: 'PRE_GAME', // PRE_GAME | HALF_TIME | POST_GAME | EMERGENCY
  isConnected: false,   // WebSocket connection state
  lastUpdated: null,    // Timestamp of last zone update

  // ── Zone Setters ───────────────────────────────────────────────────────────
  setZones: (zones) => set({ zones, lastUpdated: Date.now() }),

  updateZone: (zoneId, data) =>
    set((state) => ({
      zones: {
        ...state.zones,
        [zoneId]: { ...state.zones[zoneId], ...data },
      },
      lastUpdated: Date.now(),
    })),

  setZonesFromArray: (zonesArray) => {
    const zonesMap = {};
    zonesArray.forEach((zone) => { zonesMap[zone.id] = zone; });
    set({ zones: zonesMap, lastUpdated: Date.now() });
  },

  // ── Alert Management ───────────────────────────────────────────────────────
  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 alerts
    })),

  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    })),

  // ── Venue State ────────────────────────────────────────────────────────────
  setVenueMood: (mood) => set({ venueMood: mood }),
  setEventPhase: (phase) => set({ eventPhase: phase }),
  setConnected: (isConnected) => set({ isConnected }),

  // ── Computed Getters ───────────────────────────────────────────────────────
  getZoneById: (zoneId) => get().zones[zoneId] || null,

  getZonesArray: () => Object.values(get().zones),

  getCriticalZones: () =>
    Object.values(get().zones).filter((z) => z.dangerLevel === 'critical'),

  getZonePressureColor: (zoneId) => {
    const zone = get().zones[zoneId];
    if (!zone) return 'var(--color-text-faint)';
    const p = zone.pressureScore;
    if (p >= 90) return 'var(--color-pressure-critical)';
    if (p >= 70) return 'var(--color-pressure-high)';
    if (p >= 40) return 'var(--color-pressure-medium)';
    return 'var(--color-pressure-low)';
  },

  getActiveAlertsCount: () =>
    get().alerts.filter((a) => !a.resolved).length,
}));
