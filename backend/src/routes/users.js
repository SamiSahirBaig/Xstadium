import express from 'express';
import { getDoc, updateDoc, incrementField, arrayUnion, Collections } from '../db/firestore.js';
import { authenticate } from '../middleware/auth.js';

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

export default router;
