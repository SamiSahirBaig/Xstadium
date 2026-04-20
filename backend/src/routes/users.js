import express from 'express';
import { getDoc, getDocs, updateDoc, incrementField, arrayUnion, Collections } from '../db/firestore.js';
import { authenticate } from '../middleware/auth.js';
import { bqInsert, Tables } from '../config/gcp.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/users/me
 * Fetch the authenticated user's profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userDoc = await getDoc(Collections.USERS, req.user.uid);
    if (!userDoc) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(userDoc);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/me/preferences
 * Update specific preferences
 */
router.patch('/me/preferences', authenticate, async (req, res, next) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences object' });
    }

    const currentDoc = await getDoc(Collections.USERS, req.user.uid);
    const existingPrefs = currentDoc?.preferences || {};

    const updatedPrefs = { ...existingPrefs, ...preferences };
    
    await updateDoc(Collections.USERS, req.user.uid, { preferences: updatedPrefs });
    res.json({ message: 'Preferences updated successfully', preferences: updatedPrefs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/me/points
 * Add points to the user's account (e.g., from gamification/check-ins)
 * Note: In a production app, verifying the source of points is crucial.
 */
router.post('/me/points', authenticate, async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const pointsToAdd = parseInt(amount, 10);
    
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid points amount' });
    }

    await incrementField(Collections.USERS, req.user.uid, 'points', pointsToAdd);
    
    // Also update leaderboard
    await incrementField(Collections.LEADERBOARD, req.user.uid, 'points', pointsToAdd);

    res.json({ message: `Added ${pointsToAdd} points`, reason });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/me/badges
 * Award a badge to the user
 */
router.post('/me/badges', authenticate, async (req, res, next) => {
  try {
    const { badgeId } = req.body;
    if (!badgeId) {
      return res.status(400).json({ error: 'badgeId is required' });
    }

    await arrayUnion(Collections.USERS, req.user.uid, 'badges', badgeId);
    res.json({ message: `Badge ${badgeId} awarded` });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/check-in
 * Logs physical zone entries, computes AI mapping loyalty gamifications, and pipes arrays directly to BigQuery telemetry.
 */
router.post('/check-in', authenticate, async (req, res, next) => {
  try {
    const { currentZone, targetZone, followedRoute } = req.body;
    
    if (!targetZone) {
      return res.status(400).json({ error: 'Target trajectory boundaries missing.' });
    }

    // Capture destination baseline profile natively
    const destZoneDoc = await getDoc(Collections.ZONES, targetZone);
    const destPressure = destZoneDoc?.pressureScore || 0;

    let awardedPoints = 10; // Standard nominal increment mapping 
    let loyaltyBonus = false;

    // Advanced Gamification Penalty checks natively mapping routing
    if (followedRoute === true && destPressure <= 40) {
      awardedPoints = 50; // Super high bonus mapping execution array
      loyaltyBonus = true;
    }

    // 1. Record User's internal physics placement
    await updateDoc(Collections.USERS, req.user.uid, { currentZone: targetZone });

    // 2. Safely trigger distributed atomics across Firebase without hitting logic failures
    await incrementField(Collections.USERS, req.user.uid, 'points', awardedPoints);

    // 3. Log native arrays inside BigQuery Data Warehousing asynchronously 
    const mvmtRecord = {
      event_id: crypto.randomUUID(),
      user_id: req.user.uid,
      venue_id: 'ARENA_PRIME',
      from_zone: currentZone || 'UNKNOWN',
      to_zone: targetZone,
      route_taken: [],
      route_type: req.user.tier || 'STANDARD',
      total_time_s: null,
      pressure_avg: destPressure,
      user_tier: req.user.tier || 'STANDARD',
      timestamp: new Date().toISOString()
    };

    bqInsert(Tables.USER_MOVEMENTS, [mvmtRecord]).catch(e => {
        console.error('[Telemetry] BQ Insert Trajectory Failed:', e.message);
    });

    res.json({
       message: 'Check-in processed successfully.',
       awardedPoints,
       loyaltyBonus,
       newZone: targetZone
    });
  } catch(err) {
    next(err);
  }
});

/**
 * GET /api/users/leaderboard
 * Streams Firebase indices pushing the 50 best ranked arrays inside the stadium.
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const rankedUsers = await getDocs(Collections.USERS, {
      orderBy: 'points',
      direction: 'desc',
      limit: 50
    });
    
    // Natively stripping sensitive telemetry data dynamically
    const safeRanks = rankedUsers.map(user => ({
      uid: user.uid,
      displayName: user.displayName,
      points: user.points,
      tier: user.tier,
      photoURL: user.photoURL
    }));

    res.json(safeRanks);
  } catch(err) {
    next(err);
  }
});

export default router;
