import { pubsub, Subscriptions } from '../config/gcp.js';
import { updateDoc, Collections } from '../db/firestore.js';
import { broadcast } from './websocket.js';
import { insertZoneSnapshot } from './bigqueryService.js';
import { detectAnomalies } from './anomalyDetector.js';
import { computeMood } from './moodEngine.js';

export const startPubSubListener = () => {
  // If we're fully offline, PUBSUB_SKIP can be set.
  if (process.env.PUBSUB_SKIP === 'true') {
    console.info('[PubSub] ⏭️ Skipping Pub/Sub listener (PUBSUB_SKIP=true)');
    return;
  }

  const subscriptionName = Subscriptions.ZONE_UPDATES;
  const subscription = pubsub.subscription(subscriptionName);

  console.info(`[PubSub] 🎧 Listening for messages on subscription: ${subscriptionName}`);

  const messageHandler = async (message) => {
    try {
      const dataStr = message.data.toString();
      const parsedData = JSON.parse(dataStr);

      const {
        zoneId,
        currentOccupancy,
        pressureScore,
        trend,
        phase,
        timestamp
      } = parsedData;

      if (!zoneId) {
        console.warn(`[PubSub] ⚠️ Invalid message (missing zoneId): ${dataStr}`);
        message.ack();
        return;
      }

      // 1. Augment Data Payloads with Emotion State Machine
      const resolvedPhase = phase || 'PRE_GAME';
      const resolvedTrend = trend || 'stable';

      const { mood: computedMood, moodEmoji } = computeMood(parsedData, resolvedPhase);
      
      parsedData.mood = computedMood;
      parsedData.moodEmoji = moodEmoji;

      // 2. Update Firestore state for this zone
      // Notice we only update fields that change dynamically from the simulator
      await updateDoc(Collections.ZONES, zoneId, {
        currentOccupancy,
        pressureScore,
        trend: resolvedTrend,
        mood: computedMood,
        phase: resolvedPhase,
        lastUpdated: timestamp || Date.now()
      });

      // 3. Broadcast the live update to WebSocket clients
      broadcast({
        type: 'ZONE_UPDATE',
        data: parsedData
      });

      // 3. Queue the data for BigQuery Analytics insertion
      insertZoneSnapshot(parsedData);

      // 4. Run through Anomaly Detector
      detectAnomalies(parsedData);

      // 5. Acknowledge the message so it's not delivered again
      message.ack();

    } catch (err) {
      console.error('[PubSub] ❌ Error processing message:', err);
      // Nack allows the message to be retried by Pub/Sub
      message.nack();
    }
  };

  subscription.on('message', messageHandler);

  subscription.on('error', (error) => {
    console.error(`[PubSub] ❌ Subscription error:`, error);
  });
};
