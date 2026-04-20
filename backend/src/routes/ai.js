import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import crypto from 'crypto';
import { chatWithArenaIQ } from '../services/geminiService.js';
import { analyzeCrowdPhoto } from '../services/visionService.js';
import { authenticate } from '../middleware/auth.js';
import { queryWhere, addDoc, Collections } from '../db/firestore.js';
import { bqInsert, Tables } from '../config/gcp.js';

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

// ─── Multer (memory storage — no disk writes) ─────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * POST /api/ai/analyze-crowd-photo
 * Accepts multipart image, sends to Gemini Vision, returns structured analysis.
 * If density is "critical", auto-creates an alert in Firestore.
 */
router.post(
  '/analyze-crowd-photo',
  authenticate,
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided. Field name must be "photo".' });
      }

      const analysis = await analyzeCrowdPhoto(
        req.file.buffer,
        req.file.mimetype,
        req.user?.uid
      );

      // Auto-create Firestore alert if crowd is critical
      if (analysis.density === 'critical') {
        const alertId = await addDoc(Collections.ALERTS, {
          type: 'VISION_CRITICAL',
          zoneId: analysis.estimatedArea,
          severity: 'critical',
          message: `🚨 Vision AI detected CRITICAL crowd density in "${analysis.estimatedArea}". Recommendation: ${analysis.recommendation}`,
          hazards: analysis.hazards,
          autoTriggered: true,
          source: 'GEMINI_VISION',
          triggeredBy: req.user?.uid || 'SYSTEM',
          resolved: false,
          timestamp: new Date().toISOString(),
        });
        analysis.alertId = alertId;
        console.warn(`[Vision] Critical density alert created: ${alertId} for zone "${analysis.estimatedArea}"`);
      }

      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
