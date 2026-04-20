import { GoogleGenerativeAI } from '@google/generative-ai';
import { bqInsert, Tables } from '../config/gcp.js';
import crypto from 'crypto';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are the Xstadium Sentient AI — an expert, proactive, and highly knowledgeable concierge and guide for ArenaIQ X.
Your core objective is to ensure every attendee feels like a VIP. You have real-time access to stadium data, including crowd pressure levels, routing, and gamification points.

Key Persona Traits:
- Helpful, concise, and dynamic.
- You anticipate needs. If someone asks for food, consider their tier and suggest fast paths.
- Avoid overly long responses. Be snappy and actionable.

Always format your responses properly using Markdown. If you are recommending specific zones or routes, present them clearly.
`;

/**
 * Generate a response using the Gemini API based on user prompt and context.
 * 
 * @param {string} query - The user's message
 * @param {Object} context - Contextual data (e.g., user tier, current zone, live alerts)
 * @param {string} userId - Firebase UID for analytics logging
 * @returns {Promise<string>} The AI's response text
 */
export const generateAssistance = async (query, context = {}, userId) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

  // Construct a contextualized prompt
  const contextualPrompt = `
${SYSTEM_PROMPT}

User Context:
- Tier: ${context.tier || 'STANDARD'}
- Current Location: ${context.currentZone || 'Unknown'}
- Preferred Navigation: ${context.preferences?.navigationMode || 'standard'}

User Query: "${query}"

Provide the best actionable advice based on this context.
`;

  const startTime = Date.now();

  try {
    const result = await model.generateContent(contextualPrompt);
    const responseText = result.response.text();
    const latencyMs = Date.now() - startTime;

    // Log the interaction to BigQuery asynchronously to avoid blocking
    if (userId) {
      logAnalyticsInteraction(userId, query, responseText, context.tier, latencyMs).catch(err => {
        console.error('[AI Service] Failed to log interaction to BigQuery:', err.message);
      });
    }

    return responseText;
  } catch (error) {
    console.error('[AI Service] Gemini Generation Error:', error);
    throw new Error('Failed to generate AI response. Please try again later.');
  }
};

/**
 * Logs the AI interaction telemetry to BigQuery.
 */
async function logAnalyticsInteraction(userId, query, responseText, tier, latencyMs) {
  const row = {
    interaction_id: crypto.randomUUID(),
    user_id: userId,
    session_id: null,
    query: query,
    response_summary: responseText.substring(0, 500),
    intent: 'GENERAL', // A more complex system would classify intent here
    suggested_zones: [], // A more complex system would extract zones here
    user_tier: tier || 'STANDARD',
    latency_ms: latencyMs,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
  };

  await bqInsert(Tables.AI_INTERACTIONS, [row]);
}
