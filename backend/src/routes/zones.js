import express from 'express';
import { getDocs, getDoc, queryWhere, Collections } from '../db/firestore.js';
import { getZoneTrend } from '../config/gcp.js';
import { authenticate, optionalAuth, tierGuard } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/zones
 * Fetch all zones. Optional "?venueId=" query param.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const venueId = req.query.venueId || 'ARENA_PRIME';
    const zones = await queryWhere(Collections.ZONES, 'venueId', venueId);
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/trend?zoneId=GATE_A
 * Fetch historical pressure trend from BigQuery.
 * Open to authenticated users.
 */
router.get('/trend', authenticate, async (req, res, next) => {
  try {
    const { zoneId, venueId = 'ARENA_PRIME', minutes = 15 } = req.query;

    if (!zoneId) {
      return res.status(400).json({ error: 'zoneId query parameter is required.' });
    }

    const trend = await getZoneTrend(zoneId, parseInt(minutes, 10), venueId);
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
 * GET /api/zones/:id
 * Fetch a specific zone by ID.
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const zone = await getDoc(Collections.ZONES, req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

export default router;
