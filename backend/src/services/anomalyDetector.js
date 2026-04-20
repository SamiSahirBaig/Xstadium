import { addDoc, Collections } from '../db/firestore.js';
import { publishMessage, Topics } from '../config/gcp.js';
import { sendToTopic } from './notificationService.js';

// In-memory sliding window and debounce maps
// buffers structure: { [zoneId]: [pressure1, pressure2, ..., pressure10] }
const pressureBuffers = {};
// lastAlerts structure: { [zoneId]: timestamp_of_last_alert }
const lastAlerts = {};

const WINDOW_SIZE = 10;
const DEBOUNCE_MS = 60 * 1000; // 60 seconds

export const detectAnomalies = async (zoneData) => {
  const { zoneId, pressureScore, venueId } = zoneData;
  if (!zoneId || pressureScore === null || pressureScore === undefined) return;

  // Initialize arrays if empty
  if (!pressureBuffers[zoneId]) {
    pressureBuffers[zoneId] = [];
  }
  if (!lastAlerts[zoneId]) {
    lastAlerts[zoneId] = 0;
  }

  const buffer = pressureBuffers[zoneId];
  
  // Keep rolling window up to WINDOW_SIZE
  buffer.push(pressureScore);
  if (buffer.length > WINDOW_SIZE) {
    buffer.shift();
  }

  // Calculate rolling average
  const sum = buffer.reduce((acc, val) => acc + val, 0);
  const rollingAverage = sum / buffer.length;

  // Check conditions
  const isSpike = (pressureScore - rollingAverage) > 20;
  const isCritical = pressureScore > 90;

  if (isSpike || isCritical) {
    const now = Date.now();
    // Enforce 60s debounce
    if (now - lastAlerts[zoneId] < DEBOUNCE_MS) {
      return; 
    }
    
    // Register trigger
    lastAlerts[zoneId] = now;

    let severity = 'high';
    let message = `Rapid pressure surge detected in ${zoneId} (+${Math.round(pressureScore - rollingAverage)}% spike).`;
    
    if (isCritical) {
        severity = 'critical';
        message = `CRITICAL DANGER: ${zoneId} has reached breaking capacity (${Math.round(pressureScore)}%). Secure zone immediately.`;
    }

    const alertPayload = {
      zoneId,
      venueId: venueId || 'ARENA_PRIME',
      type: 'SURGE',
      severity,
      message,
      timestamp: new Date().toISOString()
    };

    console.warn(`[ALERT] 🚨 ${message}`);

    try {
      // 1. Write to Firestore
      await addDoc(Collections.ALERTS, alertPayload);

      // 2. Publish to Pub/Sub
      await publishMessage(Topics.ALERTS, alertPayload);
      
      // 3. Trigger Firebase Cloud Messaging broadcasting over zone topics physically
      await sendToTopic(`zone-${zoneId}`, isCritical ? 'Critical Surge Alert' : 'Capacity Warning', message, { zoneId, severity });

    } catch (err) {
      console.error('[AnomalyDetector] ❌ Failed to escalate alert:', err);
    }
  }
};
