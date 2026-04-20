import { BigQuery } from '@google-cloud/bigquery';
import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const REGION = process.env.GCP_REGION || 'us-central1';

if (!PROJECT_ID) {
  throw new Error('[GCP Config] GCP_PROJECT_ID environment variable is not set.');
}

// ─── BigQuery Client ──────────────────────────────────────────────────────────
export const bigquery = new BigQuery({ projectId: PROJECT_ID });
export const DATASET_ID = process.env.BIGQUERY_DATASET || 'arenaiq_analytics';

// ─── Table References ─────────────────────────────────────────────────────────
export const Tables = {
  ZONE_SNAPSHOTS: 'zone_snapshots',
  USER_MOVEMENTS: 'user_movements',
  AI_INTERACTIONS: 'ai_interactions',
};

/**
 * Insert rows into a BigQuery table.
 * Rows are validated against the table schema automatically.
 *
 * @param {string} tableId - One of Tables.*
 * @param {Object[]} rows - Array of row objects matching table schema
 * @returns {Promise<void>}
 */
export const bqInsert = async (tableId, rows) => {
  if (!rows || rows.length === 0) return;

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(tableId)
      .insert(rows);
  } catch (err) {
    // BigQuery insert errors are in err.errors array
    if (err.name === 'PartialFailureError') {
      const details = err.errors?.map((e) => JSON.stringify(e)).join(', ');
      console.error(`[BigQuery] Partial insert failure on ${tableId}: ${details}`);
    } else {
      console.error(`[BigQuery] Insert error on ${tableId}:`, err.message);
    }
    // Don't throw — analytics failures should not crash the main flow
  }
};

/**
 * Run a BigQuery SQL query and return the results.
 *
 * @param {string} sql - Parameterized SQL query
 * @param {Object} [params] - Query parameters
 * @returns {Promise<Object[]>} Array of result rows
 */
export const bqQuery = async (sql, params = {}) => {
  const options = {
    query: sql,
    location: 'US',
    params,
  };
  const [rows] = await bigquery.query(options);
  return rows;
};

/**
 * Get zone pressure trend from BigQuery.
 * Returns avg pressure over the last N minutes in 1-minute buckets.
 *
 * @param {string} zoneId
 * @param {number} lastNMinutes
 * @param {string} [venueId='ARENA_PRIME']
 * @returns {Promise<Array<{minute: string, avg_pressure: number}>>}
 */
export const getZoneTrend = async (zoneId, lastNMinutes = 10, venueId = 'ARENA_PRIME') => {
  const sql = `
    SELECT
      TIMESTAMP_TRUNC(timestamp, MINUTE) AS minute,
      ROUND(AVG(pressure_score), 2)      AS avg_pressure,
      MAX(pressure_score)                AS max_pressure,
      MIN(pressure_score)                AS min_pressure
    FROM \`${PROJECT_ID}.${DATASET_ID}.${Tables.ZONE_SNAPSHOTS}\`
    WHERE
      zone_id  = @zoneId
      AND venue_id = @venueId
      AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @minutes MINUTE)
    GROUP BY minute
    ORDER BY minute ASC
  `;

  return bqQuery(sql, { zoneId, venueId, minutes: lastNMinutes });
};

// ─── Pub/Sub Client ───────────────────────────────────────────────────────────
export const pubsub = new PubSub({ projectId: PROJECT_ID });

// Topic names from env
export const Topics = {
  ZONE_UPDATES: process.env.PUBSUB_TOPIC_ZONE_UPDATES || 'zone-updates',
  ALERTS: process.env.PUBSUB_TOPIC_ALERTS || 'alerts',
};

export const Subscriptions = {
  ZONE_UPDATES: process.env.PUBSUB_SUB_ZONE_UPDATES || 'zone-updates-sub',
  ALERTS: 'alerts-sub',
};

/**
 * Publish a message to a Pub/Sub topic.
 *
 * @param {string} topicName - One of Topics.*
 * @param {Object} data - JSON-serializable object
 * @param {Object} [attributes] - Optional message attributes (key-value strings)
 * @returns {Promise<string>} Message ID
 */
export const publishMessage = async (topicName, data, attributes = {}) => {
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await pubsub.topic(topicName).publish(dataBuffer, attributes);
  return messageId;
};

console.info(`[GCP] ✅ BigQuery + Pub/Sub clients initialized (project: ${PROJECT_ID})`);

export { PROJECT_ID, REGION };
