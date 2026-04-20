import express from 'express';
import NodeCache from 'node-cache';
import { getDoc, queryWhere, Collections, addToSubcollection, incrementField } from '../db/firestore.js';
import { getZoneTrend } from '../config/gcp.js';
import { authenticate, optionalAuth, tierGuard } from '../middleware/auth.js';
import { calculateOptimalRoute } from '../services/routingEngine.js';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 5 });

const enrichZoneData = (zone) => {
  const pressure = zone.pressureScore || 0;
  
  let dangerLevel = 'low';
  if (pressure > 90) dangerLevel = 'critical';
  else if (pressure >= 70) dangerLevel = 'high';
  else if (pressure >= 40) dangerLevel = 'medium';

  return {
    ...zone,
    dangerLevel,
    estimatedWaitMinutes: Math.round(pressure / 10),
    hasRecentReports: pressure > 80 // Dynamic proxy assuming heavy zones natively attract reports
  };
};

/**
 * GET /api/zones
 * Fetch all zones. Optional "?venueId=" query param.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const venueId = req.query.venueId || 'ARENA_PRIME';
    const cacheKey = `zones_${venueId}`;
    
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const rawZones = await queryWhere(Collections.ZONES, 'venueId', venueId);
    const zones = rawZones.map(enrichZoneData);
    
    cache.set(cacheKey, zones);
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/:id/trend
 * Fetch historical pressure trend from BigQuery.
 * Open to authenticated users.
 */
router.get('/:id/trend', authenticate, async (req, res, next) => {
  try {
    const zoneId = req.params.id;
    const { venueId = 'ARENA_PRIME', minutes = 15 } = req.query;

    const cacheKey = `trend_${venueId}_${zoneId}_${minutes}`;
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const trend = await getZoneTrend(zoneId, parseInt(minutes, 10), venueId);
    cache.set(cacheKey, trend);
    
    res.json(trend);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/vip-only
 * Example of a VIP guarded route. Returns secret VIP zones/routes.
 */
router.get('/vip-secrets', authenticate, tierGuard('VIP'), async (req, res, next) => {
  try {
    // In a real app, this might fetch secret routes from a different collection
    // For now, we'll return a static response demonstrating the tierGuard works.
    res.json({
      secretRoutes: [
        { id: 'secret_1', name: 'Underground Tunnel A', from: 'VIP_LOUNGE', to: 'SECTION_101', estimatedTime: 120 }
      ]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/snapshot
 * Fetch the current state of all zones from Firestore.
 */
router.get('/snapshot', optionalAuth, async (req, res, next) => {
  try {
    const venueId = req.query.venueId || 'ARENA_PRIME';
    const cacheKey = `snapshot_${venueId}`;
    
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const rawZones = await queryWhere(Collections.ZONES, 'venueId', venueId);
    const snapshot = rawZones.map(enrichZoneData);
    
    cache.set(cacheKey, snapshot);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/route?from=X&to=Y
 * Programmatic routing execution passing over the internal graph.
 */
router.get('/route', authenticate, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from or to parameters' });
    }

    const isVip = req.user?.tier === 'VIP';
    const routingPayload = await calculateOptimalRoute(from.toUpperCase(), to.toUpperCase(), isVip);
    
    res.json(routingPayload);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/:id
 * Fetch a specific zone by ID.
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `zone_${req.params.id}`;
    
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const rawZone = await getDoc(Collections.ZONES, req.params.id);
    if (!rawZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const zone = enrichZoneData(rawZone);
    cache.set(cacheKey, zone);
    
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/zones/:id/report
 * User manually reports crowd levels for points and community verification.
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const zoneId = req.params.id;
    const { reportType, notes } = req.body;
    const userId = req.user.uid;

    if (!reportType) return res.status(400).json({ error: 'reportType required' });

    // 1. Log Report inside Zone subcollection natively
    await addToSubcollection(Collections.ZONES, zoneId, 'reports', {
      userId,
      reportType,
      notes: notes || '',
      timestamp: new Date().toISOString()
    });

    // 2. Award User gamification points for valid telemetry
    await incrementField(Collections.USERS, userId, 'points', 5);

    // 3. Trigger alert system natively if VERY CROWDED triggers cross threshold (Placeholder for hackathon)
    if (reportType === 'VERY_CROWDED') {
      console.log(`[ZONE REPORT] ${zoneId} reported VERY_CROWDED by ${userId}. Alert logic evaluating.`);
    }

    res.json({ success: true, pointsAwarded: 5 });
  } catch (err) {
    next(err);
  }
});

export default router;
