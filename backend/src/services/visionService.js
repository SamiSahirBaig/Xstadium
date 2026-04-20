import { GoogleGenerativeAI } from '@google/generative-ai';
import { bqInsert, Tables } from '../config/gcp.js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const VISION_PROMPT = `Analyze this stadium crowd photo. Estimate:
1) crowd density (must be exactly one of: "low", "medium", "high", "critical")
2) any safety hazards visible (list as array of strings, empty array if none)
3) which area of the stadium this appears to be (best guess as a string)
4) recommended action for stadium staff (a clear, actionable string)

Respond ONLY with a valid JSON object matching this exact schema, no markdown:
{
  "density": "low" | "medium" | "high" | "critical",
  "hazards": ["string"],
  "estimatedArea": "string",
  "recommendation": "string",
  "confidence": 0.0-1.0
}`;

/**
 * Analyze a crowd photo using Gemini Vision.
 * @param {Buffer} imageBuffer - Raw image bytes
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} [userId] - Optional UID for BigQuery logging
 * @returns {Promise<{density, hazards, estimatedArea, recommendation, confidence}>}
 */
export const analyzeCrowdPhoto = async (imageBuffer, mimeType, userId = null) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash',
  });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType,
    },
  };

  const startTime = Date.now();

  let parsed;
  try {
    const result = await model.generateContent([VISION_PROMPT, imagePart]);
    const rawText = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[VisionService] Gemini parsing error:', err.message);
    // Safe fallback so the endpoint never crashes
    parsed = {
      density: 'medium',
      hazards: [],
      estimatedArea: 'Unknown Area',
      recommendation: 'Unable to analyze image automatically. Please review manually.',
      confidence: 0,
    };
  }

  const latencyMs = Date.now() - startTime;

  // Log to BigQuery ai_interactions asynchronously
  if (userId) {
    bqInsert(Tables.AI_INTERACTIONS, [{
      interaction_id: crypto.randomUUID(),
      user_id: userId,
      session_id: 'VISION_SESSION',
      query: 'CROWD_PHOTO_UPLOAD',
      response_summary: JSON.stringify(parsed).substring(0, 500),
      intent: 'VISION_ANALYSIS',
      suggested_zones: [],
      user_tier: 'SECURITY',
      latency_ms: latencyMs,
      model: process.env.GEMINI_VISION_MODEL || 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
    }]).catch(e => console.error('[VisionService] BQ log failed:', e.message));
  }

  return {
    density: parsed.density || 'medium',
    hazards: parsed.hazards || [],
    estimatedArea: parsed.estimatedArea || 'Unknown',
    recommendation: parsed.recommendation || 'No recommendation.',
    confidence: parsed.confidence ?? 0.8,
    analysisTimestamp: new Date().toISOString(),
  };
};
