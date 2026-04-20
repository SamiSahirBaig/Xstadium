# Firestore Schema

## Collections Overview

### `zones/{zoneId}`
Stores static and live metadata for each stadium zone.

```json
{
  "id": "GATE_A",
  "label": "Gate A — North Entrance",
  "maxCapacity": 800,
  "currentOccupancy": 0,
  "pressureScore": 0,
  "dangerLevel": "low",
  "trend": "stable",
  "mood": "relaxed",
  "moodEmoji": "😌",
  "estimatedWaitMinutes": 0,
  "isVIP": false,
  "hasFastLane": true,
  "color": "#3b82f6",
  "coordinates": { "lat": 28.6148, "lng": 77.2090 },
  "adjacentZones": ["CONCOURSE_N", "CONCOURSE_S"],
  "timestamp": "2026-04-20T10:00:00Z"
}
```

### `users/{uid}`
Fan profile, tier, points, and preferences.

```json
{
  "uid": "user_abc123",
  "displayName": "Sami Baig",
  "email": "sami@example.com",
  "tier": "GOLD",
  "tierExpiry": null,
  "points": 750,
  "currentZone": "CONCOURSE_N",
  "fcmToken": "fcm_token_here",
  "preferences": {
    "notifications": true,
    "navigationMode": "least_crowded",
    "audioEnabled": true
  },
  "badges": ["EARLY_BIRD", "EXPLORER"],
  "lastStory": null,
  "createdAt": "2026-04-20T09:00:00Z"
}
```

**Subcollections:**
- `users/{uid}/pointHistory` — individual point transactions
- `users/{uid}/intents` — AI-predicted user intents
- `users/{uid}/notifications` — in-app notification history

### `events/{eventId}`
Active event configuration.

```json
{
  "id": "event_001",
  "name": "Champions League Final",
  "venueId": "ARENA_PRIME",
  "startTime": "2026-04-20T18:00:00Z",
  "currentPhase": "PRE_GAME",
  "activeZones": ["GATE_A", "GATE_B", "GATE_C"],
  "isActive": true
}
```

### `alerts/{alertId}`
Crowd anomaly and system alerts.

```json
{
  "id": "alert_xyz",
  "zoneId": "FOOD_COURT_1",
  "type": "SURGE",
  "severity": "high",
  "message": "Unusual crowd surge detected at Food Court 1",
  "resolved": false,
  "timestamp": "2026-04-20T10:15:00Z"
}
```

### `routes/{routeId}`
Computed navigation routes.

```json
{
  "id": "route_abc",
  "userId": "user_abc123",
  "fromZone": "GATE_A",
  "toZone": "FOOD_COURT_1",
  "path": ["GATE_A", "CONCOURSE_N", "FOOD_COURT_1"],
  "totalTimeSeconds": 180,
  "pressureScore": 45,
  "isVIP": false,
  "isAlternatePath": false,
  "routeType": "STANDARD",
  "waypoints": [
    { "lat": 28.6148, "lng": 77.2090 },
    { "lat": 28.6152, "lng": 77.2095 }
  ],
  "timestamp": "2026-04-20T10:10:00Z"
}
```

## Firebase Realtime Database Structure

```
liveZones/
  {venueId}/
    {zoneId}/
      currentOccupancy: 450
      pressureScore: 56.25
      trend: "rising"
      timestamp: 1745139600000
```
