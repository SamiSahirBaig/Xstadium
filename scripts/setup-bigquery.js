#!/usr/bin/env node
/**
 * scripts/setup-bigquery.js
 *
 * Creates the BigQuery dataset and all required tables for Xstadium analytics.
 *
 * Usage: node scripts/setup-bigquery.js
 *
 * Safe to run multiple times — skips existing datasets/tables.
 */

import { BigQuery } from '@google-cloud/bigquery';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const DATASET_ID = process.env.BIGQUERY_DATASET || 'arenaiq_analytics';

if (!PROJECT_ID) {
  console.error(`${RED}❌ GCP_PROJECT_ID is not set in backend/.env${RESET}`);
  process.exit(1);
}

const bigquery = new BigQuery({ projectId: PROJECT_ID });

// ─── Table Schemas ────────────────────────────────────────────────────────────

const TABLES = [
  {
    id: 'zone_snapshots',
    description: 'Point-in-time crowd snapshots per zone — feeds forecasting and analytics',
    schema: [
      { name: 'zone_id',        type: 'STRING',    mode: 'REQUIRED', description: 'Zone identifier (e.g. GATE_A)' },
      { name: 'venue_id',       type: 'STRING',    mode: 'REQUIRED', description: 'Venue identifier (e.g. ARENA_PRIME)' },
      { name: 'pressure_score', type: 'FLOAT64',   mode: 'REQUIRED', description: 'Crowd pressure 0–100' },
      { name: 'occupancy',      type: 'INT64',     mode: 'REQUIRED', description: 'Current head count in zone' },
      { name: 'max_capacity',   type: 'INT64',     mode: 'REQUIRED', description: 'Zone max capacity' },
      { name: 'danger_level',   type: 'STRING',    mode: 'NULLABLE', description: 'low | medium | high | critical' },
      { name: 'trend',          type: 'STRING',    mode: 'NULLABLE', description: 'rising | falling | stable' },
      { name: 'mood',           type: 'STRING',    mode: 'NULLABLE', description: 'euphoric | anxious | relaxed | excited | frustrated' },
      { name: 'phase',          type: 'STRING',    mode: 'NULLABLE', description: 'PRE_GAME | HALF_TIME | POST_GAME | EMERGENCY' },
      { name: 'timestamp',      type: 'TIMESTAMP', mode: 'REQUIRED', description: 'UTC timestamp of the snapshot' },
    ],
    timePartitioning: {
      type: 'DAY',
      field: 'timestamp',
    },
    clustering: ['zone_id', 'venue_id'],
  },
  {
    id: 'user_movements',
    description: 'Tracks fan navigation events — routes taken, zones visited',
    schema: [
      { name: 'event_id',     type: 'STRING',             mode: 'REQUIRED', description: 'Unique movement event ID' },
      { name: 'user_id',      type: 'STRING',             mode: 'REQUIRED', description: 'Firebase UID' },
      { name: 'venue_id',     type: 'STRING',             mode: 'REQUIRED', description: 'Venue identifier' },
      { name: 'from_zone',    type: 'STRING',             mode: 'NULLABLE', description: 'Starting zone ID' },
      { name: 'to_zone',      type: 'STRING',             mode: 'REQUIRED', description: 'Destination zone ID' },
      { name: 'route_taken',  type: 'STRING', mode: 'REPEATED', description: 'Ordered list of zone IDs in the route' },
      { name: 'route_type',   type: 'STRING',             mode: 'NULLABLE', description: 'STANDARD | VIP | SECRET | FAST_LANE' },
      { name: 'total_time_s', type: 'INT64',              mode: 'NULLABLE', description: 'Estimated route travel time seconds' },
      { name: 'pressure_avg', type: 'FLOAT64',            mode: 'NULLABLE', description: 'Average pressure along the route' },
      { name: 'user_tier',    type: 'STRING',             mode: 'NULLABLE', description: 'User tier at time of movement' },
      { name: 'timestamp',    type: 'TIMESTAMP',          mode: 'REQUIRED', description: 'UTC timestamp' },
    ],
    timePartitioning: {
      type: 'DAY',
      field: 'timestamp',
    },
    clustering: ['user_id', 'venue_id'],
  },
  {
    id: 'ai_interactions',
    description: 'Logs every Gemini AI assistant interaction for analysis and improvement',
    schema: [
      { name: 'interaction_id',    type: 'STRING',    mode: 'REQUIRED', description: 'Unique interaction ID' },
      { name: 'user_id',           type: 'STRING',    mode: 'REQUIRED', description: 'Firebase UID' },
      { name: 'session_id',        type: 'STRING',    mode: 'NULLABLE', description: 'Chat session ID' },
      { name: 'query',             type: 'STRING',    mode: 'REQUIRED', description: 'User query text' },
      { name: 'response_summary',  type: 'STRING',    mode: 'NULLABLE', description: 'First 500 chars of AI response' },
      { name: 'intent',            type: 'STRING',    mode: 'NULLABLE', description: 'NAVIGATE | RECOMMEND | ALERT_QUERY | GENERAL | VISION_ANALYSIS' },
      { name: 'suggested_zones',   type: 'STRING', mode: 'REPEATED', description: 'Zone IDs suggested in response' },
      { name: 'user_tier',         type: 'STRING',    mode: 'NULLABLE', description: 'User tier at time of interaction' },
      { name: 'latency_ms',        type: 'INT64',     mode: 'NULLABLE', description: 'Time from request to response in ms' },
      { name: 'model',             type: 'STRING',    mode: 'NULLABLE', description: 'Gemini model used' },
      { name: 'timestamp',         type: 'TIMESTAMP', mode: 'REQUIRED', description: 'UTC timestamp' },
    ],
    timePartitioning: {
      type: 'DAY',
      field: 'timestamp',
    },
    clustering: ['intent', 'user_tier'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createDatasetIfMissing() {
  const dataset = bigquery.dataset(DATASET_ID);
  const [exists] = await dataset.exists();

  if (exists) {
    console.log(`  ${YELLOW}⟳  Dataset already exists:${RESET} ${DATASET_ID}`);
    return dataset;
  }

  const [newDataset] = await bigquery.createDataset(DATASET_ID, {
    location: process.env.GCP_REGION || 'US',
    description: 'Xstadium analytics — crowd telemetry, user movements, AI interactions',
  });

  console.log(`  ${GREEN}✅ Created dataset:${RESET} ${DATASET_ID} (location: ${process.env.GCP_REGION || 'US'})`);
  return newDataset;
}

async function createTableIfMissing(dataset, tableConfig) {
  const table = dataset.table(tableConfig.id);
  const [exists] = await table.exists();

  if (exists) {
    console.log(`  ${YELLOW}⟳  Table already exists:${RESET} ${tableConfig.id}`);
    return;
  }

  const options = {
    schema: tableConfig.schema,
    description: tableConfig.description,
  };

  if (tableConfig.timePartitioning) {
    options.timePartitioning = tableConfig.timePartitioning;
  }
  if (tableConfig.clustering) {
    options.clustering = { fields: tableConfig.clustering };
  }

  await dataset.createTable(tableConfig.id, options);
  console.log(`  ${GREEN}✅ Created table:${RESET} ${tableConfig.id} (${tableConfig.schema.length} columns)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Xstadium — BigQuery Setup                 ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}`);
  console.log(`  Project: ${PROJECT_ID}`);
  console.log(`  Dataset: ${DATASET_ID}\n`);

  console.log(`${BOLD}Creating Dataset...${RESET}`);
  const dataset = await createDatasetIfMissing();

  console.log(`\n${BOLD}Creating Tables...${RESET}`);
  for (const tableConfig of TABLES) {
    await createTableIfMissing(dataset, tableConfig);
  }

  console.log(`\n${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`${GREEN}${BOLD}  ✅ BigQuery setup complete!${RESET}`);
  console.log(`  Dataset: ${CYAN}${PROJECT_ID}.${DATASET_ID}${RESET}`);
  console.log(`  Tables:  ${TABLES.map((t) => t.id).join(', ')}`);
  console.log(`\n  Run ${CYAN}node scripts/check-gcp.js${RESET} to verify all services.\n`);
}

main().catch((err) => {
  console.error(`\n${RED}❌ BigQuery setup failed:${RESET}`, err.message);
  process.exit(1);
});
