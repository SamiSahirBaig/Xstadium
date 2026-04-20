import express from 'express';
import { firestore } from '../config/firebase.js';
import { Collections } from '../db/firestore.js';

const router = express.Router();

/**
 * GET /api/alerts/active
 * Returns all active or recent alerts within the last 15 minutes.
 */
router.get('/active', async (req, res) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const snapshot = await firestore
      .collection(Collections.ALERTS)
      .where('timestamp', '>=', fifteenMinutesAgo)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
      
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(alerts);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
