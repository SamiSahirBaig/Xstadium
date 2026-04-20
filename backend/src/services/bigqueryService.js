import { bqInsert, Tables } from '../config/gcp.js';

// In-memory buffer for batched zone snapshots
let zoneSnapshotBuffer = [];

// Flush interval in milliseconds (30 seconds)
const FLUSH_INTERVAL_MS = 30 * 1000;

/**
 * Format a Javascript timestamp to a BigQuery TIMESTAMP via BigQuery API.
 * The BQ library accepts normal javascript Date objects.
 */
const toBigQueryTimestamp = (ts) => {
  if (!ts) return new Date();
  return new Date(ts);
};

/**
 * Add a zone snapshot to the batch buffer.
 * Expected data format: { zoneId, venueId, pressureScore, occupancy, phase, mood, trend, timestamp }
 */
export const insertZoneSnapshot = (zoneData) => {
  zoneSnapshotBuffer.push({
    zone_id: zoneData.zoneId,
    venue_id: zoneData.venueId || 'ARENA_PRIME',
    pressure_score: zoneData.pressureScore,
    occupancy: zoneData.occupancy || zoneData.currentOccupancy || 0,
    max_capacity: zoneData.maxCapacity || 0, // Fallback if missing
    danger_level: zoneData.dangerLevel || null,
    trend: zoneData.trend || null,
    mood: zoneData.mood || null,
    phase: zoneData.phase || null,
    timestamp: toBigQueryTimestamp(zoneData.timestamp),
  });
};

/**
 * Run the flush operation on an interval
 */
setInterval(async () => {
  if (zoneSnapshotBuffer.length === 0) return;

  // Copy and clear the buffer immediately payload thread-safety
  const batch = [...zoneSnapshotBuffer];
  zoneSnapshotBuffer = [];

  try {
    await bqInsert(Tables.ZONE_SNAPSHOTS, batch);
    console.info(`[BigQuery] 📊 Flushed ${batch.length} zone snapshots.`);
  } catch (err) {
    console.error(`[BigQuery] ❌ Failed to flush snapshot batch:`, err);
    // On failure we drop the analytics ticks instead of backing up memory buffer infinitely.
  }
}, FLUSH_INTERVAL_MS);

/**
 * Immediately insert a User Movement record
 */
export const insertUserMovement = async (movementData) => {
  try {
    await bqInsert(Tables.USER_MOVEMENTS, [{
      event_id: movementData.eventId,
      user_id: movementData.userId,
      venue_id: movementData.venueId || 'ARENA_PRIME',
      from_zone: movementData.fromZone || null,
      to_zone: movementData.toZone,
      route_taken: movementData.routeTaken || [],
      route_type: movementData.routeType || null,
      total_time_s: movementData.totalTimeS || null,
      pressure_avg: movementData.pressureAvg || null,
      user_tier: movementData.userTier || null,
      timestamp: toBigQueryTimestamp(movementData.timestamp),
    }]);
  } catch (err) {
    console.error('[BigQuery] ❌ Failed to insert user movement:', err);
  }
};

/**
 * Immediately insert an AI Interaction record
 */
export const insertAIInteraction = async (interactionData) => {
  try {
    await bqInsert(Tables.AI_INTERACTIONS, [{
      interaction_id: interactionData.interactionId,
      user_id: interactionData.userId,
      session_id: interactionData.sessionId || null,
      query: interactionData.query,
      response_summary: interactionData.responseSummary || null,
      intent: interactionData.intent || null,
      suggested_zones: interactionData.suggestedZones || [],
      user_tier: interactionData.userTier || null,
      latency_ms: interactionData.latencyMs || null,
      model: interactionData.model || null,
      timestamp: toBigQueryTimestamp(interactionData.timestamp),
    }]);
  } catch (err) {
    console.error('[BigQuery] ❌ Failed to insert AI interaction:', err);
  }
};
