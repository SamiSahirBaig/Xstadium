import express from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithArenaIQ } from '../services/geminiService.js';
import { authenticate } from '../middleware/auth.js';
import { queryWhere, Collections } from '../db/firestore.js';

const router = express.Router();

// Strict 20 req/min ratelimit based roughly on user uid or ip
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user?.uid || req.ip,
  message: { error: 'Too many requests to AI endpoint. Please try again later.' }
});

const getEnrichedSnapshot = async () => {
    const rawZones = await queryWhere(Collections.ZONES, 'venueId', 'ARENA_PRIME');
    return rawZones.map(zone => {
      const pressure = zone.pressureScore || 0;
      let dangerLevel = 'low';
      if (pressure > 90) dangerLevel = 'critical';
      else if (pressure >= 70) dangerLevel = 'high';
      else if (pressure >= 40) dangerLevel = 'medium';

      return {
        ...zone,
        dangerLevel,
        estimatedWaitMinutes: Math.round(pressure / 10)
      };
    });
};

/**
 * POST /api/ai/chat
 * Send a message to the Xstadium Sentient AI.
 * Rate limited to protect upstream billing.
 */
router.post('/chat', authenticate, aiRateLimiter, async (req, res, next) => {
  try {
    const { message, sessionId, currentZone } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter in request body.' });
    }

    // Capture precise stadium state
    const zonesSnapshot = await getEnrichedSnapshot();

    // Map the resolved Firebase JWT user down to Gemini
    const userContext = {
      uid: req.user?.uid,
      tier: req.user?.tier || 'STANDARD',
      preferences: req.user?.preferences || {},
      currentZone: currentZone || req.user?.currentZone || 'Unknown',
    };

    // Forward the payload down the engine
    const geminiResponse = await chatWithArenaIQ(
      message, 
      sessionId || req.user?.uid || 'default-session', 
      userContext, 
      zonesSnapshot
    );

    res.json(geminiResponse);
  } catch (err) {
    next(err);
  }
});

export default router;
