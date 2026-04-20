#!/usr/bin/env node
/**
 * scripts/check-gcp.js
 *
 * GCP API Health Check — Issue #3
 * Verifies that all required Google Cloud APIs are enabled and reachable.
 *
 * Usage: node scripts/check-gcp.js
 *
 * Requirements:
 *   - GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON set in .env
 *   - GCP_PROJECT_ID set in .env
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend .env
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const pass = (msg) => console.log(`  ${GREEN}✅ PASS${RESET} — ${msg}`);
const fail = (msg) => console.log(`  ${RED}❌ FAIL${RESET} — ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠️  WARN${RESET} — ${msg}`);
const info = (msg) => console.log(`  ${CYAN}ℹ️  INFO${RESET} — ${msg}`);

const results = { passed: 0, failed: 0, warned: 0 };

// ─── Checks ───────────────────────────────────────────────────────────────────

async function checkEnvironmentVariables() {
  console.log(`\n${BOLD}[1/6] Environment Variables${RESET}`);

  const required = [
    'GCP_PROJECT_ID',
    'GEMINI_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_DATABASE_URL',
    'BIGQUERY_DATASET',
    'PUBSUB_TOPIC_ZONE_UPDATES',
    'PUBSUB_SUB_ZONE_UPDATES',
  ];

  let allPresent = true;
  for (const key of required) {
    if (process.env[key]) {
      pass(`${key} is set`);
      results.passed++;
    } else {
      fail(`${key} is NOT set in backend/.env`);
      results.failed++;
      allPresent = false;
    }
  }

  return allPresent;
}

async function checkServiceAccountKey() {
  console.log(`\n${BOLD}[2/6] Service Account Key${RESET}`);

  const keyPath = resolve(__dirname, '../backend/', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account-key.json');

  if (existsSync(keyPath)) {
    try {
      const key = JSON.parse(readFileSync(keyPath, 'utf8'));
      pass(`service-account-key.json found at: ${keyPath}`);
      pass(`Project ID in key: ${key.project_id}`);
      pass(`Service account email: ${key.client_email}`);
      info(`Key type: ${key.type}`);
      results.passed += 3;

      if (key.project_id !== process.env.GCP_PROJECT_ID) {
        warn(`Project ID mismatch! Key: "${key.project_id}", env: "${process.env.GCP_PROJECT_ID}"`);
        results.warned++;
      }
      return true;
    } catch (err) {
      fail(`service-account-key.json is invalid JSON: ${err.message}`);
      results.failed++;
      return false;
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    pass('Service account found in FIREBASE_SERVICE_ACCOUNT_JSON env var');
    results.passed++;
    return true;
  } else {
    fail(`No service account key found. Expected at: ${keyPath}`);
    info('Run: gcloud iam service-accounts keys create backend/service-account-key.json --iam-account=xstadium-backend@<PROJECT_ID>.iam.gserviceaccount.com');
    results.failed++;
    return false;
  }
}

async function checkGeminiAPI() {
  console.log(`\n${BOLD}[3/6] Gemini AI API${RESET}`);

  if (!process.env.GEMINI_API_KEY) {
    fail('GEMINI_API_KEY not set — skipping Gemini API check');
    results.failed++;
    return false;
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    const result = await model.generateContent('Reply with exactly: OK');
    const text = result.response.text().trim();

    if (text.includes('OK')) {
      pass(`Gemini API responding (model: ${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})`);
      results.passed++;
      return true;
    } else {
      warn(`Gemini responded but unexpected output: "${text}"`);
      results.warned++;
      return true;
    }
  } catch (err) {
    fail(`Gemini API error: ${err.message}`);
    info('Check your GEMINI_API_KEY at: https://aistudio.google.com');
    results.failed++;
    return false;
  }
}

async function checkBigQuery() {
  console.log(`\n${BOLD}[4/6] BigQuery${RESET}`);

  try {
    const { BigQuery } = await import('@google-cloud/bigquery');
    const bigquery = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });

    const dataset = bigquery.dataset(process.env.BIGQUERY_DATASET || 'arenaiq_analytics');
    const [exists] = await dataset.exists();

    if (exists) {
      pass(`BigQuery dataset "${process.env.BIGQUERY_DATASET}" exists`);
      results.passed++;

      // Check expected tables
      const tables = ['zone_snapshots', 'user_movements', 'ai_interactions'];
      for (const tableName of tables) {
        const table = dataset.table(tableName);
        const [tableExists] = await table.exists();
        if (tableExists) {
          pass(`Table exists: ${tableName}`);
          results.passed++;
        } else {
          warn(`Table missing: ${tableName} (will be created on first run)`);
          results.warned++;
        }
      }
    } else {
      warn(`BigQuery dataset "${process.env.BIGQUERY_DATASET}" does not exist yet — will be created on first run`);
      results.warned++;
    }
    return true;
  } catch (err) {
    fail(`BigQuery error: ${err.message}`);
    info('Ensure BigQuery API is enabled: gcloud services enable bigquery.googleapis.com');
    results.failed++;
    return false;
  }
}

async function checkPubSub() {
  console.log(`\n${BOLD}[5/6] Cloud Pub/Sub${RESET}`);

  try {
    const { PubSub } = await import('@google-cloud/pubsub');
    const pubsub = new PubSub({ projectId: process.env.GCP_PROJECT_ID });

    const [topics] = await pubsub.getTopics();
    const topicNames = topics.map((t) => t.name.split('/').pop());

    const requiredTopics = [
      process.env.PUBSUB_TOPIC_ZONE_UPDATES || 'zone-updates',
      process.env.PUBSUB_TOPIC_ALERTS || 'alerts',
    ];

    for (const topic of requiredTopics) {
      if (topicNames.includes(topic)) {
        pass(`Pub/Sub topic exists: ${topic}`);
        results.passed++;
      } else {
        warn(`Pub/Sub topic missing: "${topic}" — run: node scripts/setup-pubsub.js`);
        results.warned++;
      }
    }

    // Check subscription
    const [subs] = await pubsub.getSubscriptions();
    const subNames = subs.map((s) => s.name.split('/').pop());
    const requiredSub = process.env.PUBSUB_SUB_ZONE_UPDATES || 'zone-updates-sub';

    if (subNames.includes(requiredSub)) {
      pass(`Pub/Sub subscription exists: ${requiredSub}`);
      results.passed++;
    } else {
      warn(`Pub/Sub subscription missing: "${requiredSub}" — run: node scripts/setup-pubsub.js`);
      results.warned++;
    }

    return true;
  } catch (err) {
    fail(`Pub/Sub error: ${err.message}`);
    info('Ensure Pub/Sub API is enabled: gcloud services enable pubsub.googleapis.com');
    results.failed++;
    return false;
  }
}

async function checkMapsAPIKey() {
  console.log(`\n${BOLD}[6/6] Google Maps API Key${RESET}`);

  // Maps key lives in frontend env
  const frontendEnvPath = resolve(__dirname, '../frontend/.env');

  if (!existsSync(frontendEnvPath)) {
    warn('frontend/.env not found — copy frontend/.env.example and fill in your Maps API key');
    results.warned++;
    return false;
  }

  const envContent = readFileSync(frontendEnvPath, 'utf8');
  const match = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/);

  if (!match || !match[1] || match[1].trim() === 'your_google_maps_api_key_here') {
    warn('VITE_GOOGLE_MAPS_API_KEY is not set in frontend/.env');
    info('Get your key at: https://console.cloud.google.com/apis/credentials');
    results.warned++;
    return false;
  }

  pass('VITE_GOOGLE_MAPS_API_KEY is set in frontend/.env');
  results.passed++;
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Xstadium — GCP API Health Check           ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}`);
  console.log(`  Project: ${process.env.GCP_PROJECT_ID || 'NOT SET'}`);
  console.log(`  Time:    ${new Date().toISOString()}\n`);

  await checkEnvironmentVariables();
  await checkServiceAccountKey();
  await checkGeminiAPI();
  await checkBigQuery();
  await checkPubSub();
  await checkMapsAPIKey();

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Results Summary${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`  ${GREEN}✅ Passed:  ${results.passed}${RESET}`);
  console.log(`  ${YELLOW}⚠️  Warned:  ${results.warned}${RESET}`);
  console.log(`  ${RED}❌ Failed:  ${results.failed}${RESET}`);

  if (results.failed === 0 && results.warned === 0) {
    console.log(`\n${GREEN}${BOLD}  🎉 All checks passed! You're ready to run Xstadium.${RESET}\n`);
    process.exit(0);
  } else if (results.failed === 0) {
    console.log(`\n${YELLOW}${BOLD}  ⚠️  Some warnings — review above before going to production.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}${BOLD}  ❌ ${results.failed} check(s) failed — fix the issues above before running.${RESET}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${RED}Unhandled error in check-gcp.js:${RESET}`, err);
  process.exit(1);
});
