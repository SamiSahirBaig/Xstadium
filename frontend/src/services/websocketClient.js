import { useZoneStore } from '../store/zoneStore.js';

let ws = null;
let reconnectTimer = null;

export const initWebSocket = () => {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  const endpoint = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  console.log(`[WebSocket] Connecting to ${endpoint}...`);
  ws = new WebSocket(endpoint);

  ws.onopen = async () => {
    console.log('[WebSocket] Connected');
    useZoneStore.getState().setConnected(true);

    // Fetch initial state snapshot immediately upon connection
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/zones/snapshot`);
      if (res.ok) {
        const zones = await res.json();
        useZoneStore.getState().setZonesFromArray(zones);
      }
    } catch (err) {
      console.error('[WebSocket] Failed to fetch initial snapshot:', err);
    }
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'ZONE_UPDATE') {
        const data = message.data;
        
        // Rapid local data enrichment (to mirror the node /snapshot enrichment logic)
        const pressure = data.pressureScore || 0;
        let dangerLevel = 'low';
        if (pressure > 90) dangerLevel = 'critical';
        else if (pressure >= 70) dangerLevel = 'high';
        else if (pressure >= 40) dangerLevel = 'medium';
        const estimatedWaitMinutes = Math.round(pressure / 10);

        useZoneStore.getState().updateZone(data.zoneId, {
          ...data,
          dangerLevel,
          estimatedWaitMinutes,
        });
      }
    } catch (err) {
      console.error('[WebSocket] Error parsing message:', err);
    }
  };

  ws.onclose = () => {
    console.warn('[WebSocket] Disconnected. Reconnecting in 5s...');
    useZoneStore.getState().setConnected(false);
    ws = null;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(initWebSocket, 5000);
  };

  ws.onerror = (err) => {
    console.error('[WebSocket] Error:', err);
    ws.close();
  };
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  clearTimeout(reconnectTimer);
  useZoneStore.getState().setConnected(false);
};
