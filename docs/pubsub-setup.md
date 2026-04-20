# Cloud Pub/Sub Setup Guide

## Overview

Xstadium uses Google Cloud Pub/Sub for real-time streaming of zone crowd data from the simulator to the backend server. This decouples the simulator from the backend and enables horizontal scaling.

## Architecture

```
Simulator (crowdEngine.js)
    │
    │  publish every 3s
    ▼
[Pub/Sub Topic: zone-updates]
    │
    │  subscribe (pull)
    ▼
Backend (pubsubListener.js)
    ├──► Firestore zones/{id}  (persistent state)
    ├──► WebSocket broadcast   (real-time frontend)
    └──► BigQuery              (analytics ingestion)

Anomaly Detector
    │
    │  publish on anomaly
    ▼
[Pub/Sub Topic: alerts]
    │
    │  subscribe (pull)
    ▼
Backend (alertHandler.js)
    ├──► Firestore alerts/{id}
    └──► FCM push notifications
```

## Quick Setup (Recommended)

Run the automated setup script:

```bash
# 1. Make sure backend/.env is configured with GCP_PROJECT_ID
# 2. Run the setup script
node scripts/setup-pubsub.js
```

## Manual Setup (gcloud CLI)

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create topics
gcloud pubsub topics create zone-updates
gcloud pubsub topics create alerts

# Create subscriptions
gcloud pubsub subscriptions create zone-updates-sub \
  --topic=zone-updates \
  --ack-deadline=30 \
  --message-retention-duration=10m

gcloud pubsub subscriptions create alerts-sub \
  --topic=alerts \
  --ack-deadline=60 \
  --message-retention-duration=1h
```

## Topics Reference

### `zone-updates`

Published by the crowd simulator every 3 seconds per zone.

**Message Schema:**
```json
{
  "zoneId": "GATE_A",
  "venueId": "ARENA_PRIME",
  "currentOccupancy": 450,
  "pressureScore": 56.25,
  "trend": "rising",
  "mood": "excited",
  "phase": "PRE_GAME",
  "timestamp": 1745139600000
}
```

### `alerts`

Published by the anomaly detector when pressure spikes are detected.

**Message Schema:**
```json
{
  "alertId": "alert_abc123",
  "zoneId": "FOOD_COURT_1",
  "venueId": "ARENA_PRIME",
  "type": "SURGE",
  "severity": "high",
  "message": "Crowd surge detected — pressure jumped 25 points in 30 seconds",
  "previousPressure": 50,
  "currentPressure": 91,
  "timestamp": 1745139600000
}
```

## Subscriptions Reference

| Subscription | Topic | Ack Deadline | Retention |
|---|---|---|---|
| `zone-updates-sub` | `zone-updates` | 30s | 10 min |
| `alerts-sub` | `alerts` | 60s | 1 hour |

## Local Development

When running locally, the simulator publishes to the **real** Pub/Sub topic (no local emulator for Pub/Sub). Ensure your service account has `roles/pubsub.publisher` and `roles/pubsub.subscriber`.

For fully offline development, set `PUBSUB_SKIP=true` in your `.env` — the simulator will write directly to Firebase Realtime DB without Pub/Sub.

## Verifying Setup

```bash
# Check all Pub/Sub resources exist
node scripts/check-gcp.js

# Manually publish a test message
gcloud pubsub topics publish zone-updates \
  --message='{"zoneId":"GATE_A","pressureScore":50,"test":true}'

# Pull and acknowledge test messages from subscription
gcloud pubsub subscriptions pull zone-updates-sub --auto-ack --limit=5
```
