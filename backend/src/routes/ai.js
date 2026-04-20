import express from 'express';
import { generateAssistance } from '../services/ai.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Send a message to the Xstadium Sentient AI.
 * Requires authentication so user context can be injected natively.
 */
router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { query, currentZone } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter in request body.' });
    }

    // Build context object using user profile from Auth token + request payload
    const context = {
      tier: req.user?.tier || 'STANDARD',
      preferences: req.user?.preferences || {},
      currentZone: currentZone || req.user?.currentZone || 'Unknown',
    };

    const responseText = await generateAssistance(query, context, req.user?.uid);

    res.json({
      response: responseText,
      contextUsed: context
    });
  } catch (err) {
    next(err);
  }
});

export default router;
