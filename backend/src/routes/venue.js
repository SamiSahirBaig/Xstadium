import express from 'express';
import { queryWhere, Collections } from '../db/firestore.js';
import { rtdb } from '../config/firebase.js';

const router = express.Router();

/**
 * Infer mood natively mapping pressure metrics into emotional schemas.
 */
function inferZoneMood(pressureScore) {
  if (pressureScore >= 90) return 'anxious';
  if (pressureScore >= 70) return 'frustrated';
  if (pressureScore >= 50) return 'euphoric';
  if (pressureScore >= 30) return 'excited';
  return 'relaxed';
}

router.get('/mood', async (req, res, next) => {
  try {
    const venueId = req.query.venueId || 'ARENA_PRIME';

    // To ensure ultimate real-time fidelity, we grab live pressure from RTDB or fall back to Firestore.
    // For simplicity, we just query firestore /zones as standard array, but RTDB handles live.
    const rawZones = await queryWhere(Collections.ZONES, 'venueId', venueId);
    
    // Check if live dataset is updating them (simulations) Let's assume RTDB pushes to Firestore frequently, 
    // but just in case we fetch current RTDB pressures
    const liveSnapshot = await rtdb.ref(`liveZones/${venueId}`).once('value');
    const liveData = liveSnapshot.val() || {};

    const distribution = {
      euphoric: 0,
      anxious: 0,
      frustrated: 0,
      excited: 0,
      relaxed: 0
    };

    let dominantMood = 'relaxed';
    let maxCount = 0;

    rawZones.forEach(zone => {
      // Prioritize RTDB live pressure, fallback to doc pressure
      const liveZone = liveData[zone.id];
      const pressureScore = liveZone ? liveZone.pressureScore : (zone.pressureScore || 0);
      
      const mood = inferZoneMood(pressureScore);
      distribution[mood] = (distribution[mood] || 0) + 1;
    });

    for (const [mood, count] of Object.entries(distribution)) {
       if (count > maxCount) {
          maxCount = count;
          dominantMood = mood;
       }
    }

    res.json({
        dominantMood,
        distribution
    });

  } catch (err) {
    next(err);
  }
});

export default router;
