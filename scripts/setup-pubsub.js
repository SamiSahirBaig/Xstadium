#!/usr/bin/env node
/**
 * scripts/setup-pubsub.js
 *
 * Creates all required Pub/Sub topics and subscriptions for Xstadium.
 *
 * Usage: node scripts/setup-pubsub.js
 *
 * Safe to run multiple times — skips existing topics/subscriptions.
 */

import { PubSub } from '@google-cloud/pubsub';
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

if (!PROJECT_ID) {
  console.error(`${RED}❌ GCP_PROJECT_ID is not set in backend/.env${RESET}`);
  process.exit(1);
}

const pubsub = new PubSub({ projectId: PROJECT_ID });

// ─── Configuration ────────────────────────────────────────────────────────────
const TOPICS_CONFIG = [
  {
    topicName: process.env.PUBSUB_TOPIC_ZONE_UPDATES || 'zone-updates',
    description: 'Live zone crowd density updates from the simulator',
    subscriptions: [
      {
        name: process.env.PUBSUB_SUB_ZONE_UPDATES || 'zone-updates-sub',
        ackDeadlineSeconds: 30,
        retainAckedMessages: false,
        messageRetentionDuration: { seconds: 600 }, // 10 minutes
      },
    ],
  },
  {
    topicName: process.env.PUBSUB_TOPIC_ALERTS || 'alerts',
    description: 'Crowd anomaly and emergency alerts from the anomaly detector',
    subscriptions: [
      {
        name: 'alerts-sub',
        ackDeadlineSeconds: 60,
        retainAckedMessages: false,
        messageRetentionDuration: { seconds: 3600 }, // 1 hour
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function topicExists(topicName) {
  const [topics] = await pubsub.getTopics();
  return topics.some((t) => t.name.endsWith(`/${topicName}`));
}

async function subscriptionExists(subName) {
  const [subs] = await pubsub.getSubscriptions();
  return subs.some((s) => s.name.endsWith(`/${subName}`));
}

async function createTopicIfMissing(topicName, description) {
  const exists = await topicExists(topicName);
  if (exists) {
    console.log(`  ${YELLOW}⟳  Topic already exists:${RESET} ${topicName}`);
    return pubsub.topic(topicName);
  }

  const [topic] = await pubsub.createTopic(topicName);
  console.log(`  ${GREEN}✅ Created topic:${RESET} ${topicName} — ${description}`);
  return topic;
}

async function createSubscriptionIfMissing(topic, subConfig) {
  const exists = await subscriptionExists(subConfig.name);
  if (exists) {
    console.log(`  ${YELLOW}⟳  Subscription already exists:${RESET} ${subConfig.name}`);
    return;
  }

  await topic.createSubscription(subConfig.name, {
    ackDeadlineSeconds: subConfig.ackDeadlineSeconds,
    retainAckedMessages: subConfig.retainAckedMessages,
    messageRetentionDuration: subConfig.messageRetentionDuration,
  });

  console.log(`  ${GREEN}✅ Created subscription:${RESET} ${subConfig.name} → ${topic.name.split('/').pop()}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Xstadium — Pub/Sub Setup                  ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}`);
  console.log(`  Project: ${PROJECT_ID}\n`);

  let totalTopics = 0;
  let totalSubs = 0;

  for (const config of TOPICS_CONFIG) {
    console.log(`\n${BOLD}Topic: ${config.topicName}${RESET}`);
    const topic = await createTopicIfMissing(config.topicName, config.description);
    totalTopics++;

    for (const subConfig of config.subscriptions) {
      await createSubscriptionIfMissing(topic, subConfig);
      totalSubs++;
    }
  }

  console.log(`\n${BOLD}═══════════════════════════════════════════════${RESET}`);
  console.log(`${GREEN}${BOLD}  ✅ Pub/Sub setup complete!${RESET}`);
  console.log(`  Topics processed:        ${totalTopics}`);
  console.log(`  Subscriptions processed: ${totalSubs}`);
  console.log(`\n  Run ${CYAN}node scripts/check-gcp.js${RESET} to verify all services.\n`);
}

main().catch((err) => {
  console.error(`\n${RED}❌ Pub/Sub setup failed:${RESET}`, err.message);
  console.error(err.stack);
  process.exit(1);
});
