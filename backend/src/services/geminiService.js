import { GoogleGenerativeAI } from '@google/generative-ai';
import { bqInsert, Tables } from '../config/gcp.js';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Memory-based session cache: mapping sessionId to the ChatSession object
// In production, consider saving history to Firestore or Redis
const sessions = new Map();

const getSystemInstruction = (zonesSnapshot, userContext) => {
  return `You are ArenaIQ, the sentient AI guide of this stadium. You help fans navigate, avoid crowds, and maximize their experience.
You are concise, dynamic, and extremely helpful. You have access to real-time telemetry.

Current User Context:
- Tier: ${userContext.tier}
- Preferred Navigation: ${userContext.preferences?.navigationMode || 'standard'}
- Current Physical Location: ${userContext.currentZone}

Current Live Stadium Pressure Levels (Snapshot):
${JSON.stringify(zonesSnapshot.map(z => ({ 
  id: z.id, 
  pressure: z.pressureScore, 
  dangerLevel: z.dangerLevel, 
  mood: z.mood,
  waitMins: z.estimatedWaitMinutes 
})))}

Important: You MUST ALWAYS respond with a pure JSON object matching this schema EXACTLY (No markdown blocks to wrap it! Just pure JSON parseable string!):
{
  "reply": "Your markdown formatted friendly response addressing the user",
  "intent": "NAVIGATE" | "RECOMMEND" | "ALERT_QUERY" | "GENERAL",
  "suggestedZones": ["ZONE_ID_1", "ZONE_ID_2"] // Only include if suggesting specific paths or locations
}`;
};

export const chatWithArenaIQ = async (message, sessionId, userContext, zonesSnapshot) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let chatSession = sessions.get(sessionId);
  
  if (!chatSession) {
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      // Pass the instruction explicitly natively
      systemInstruction: getSystemInstruction(zonesSnapshot, userContext),
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    chatSession = model.startChat({ history: [] });
    sessions.set(sessionId, chatSession);
  }

  const startTime = Date.now();
  let parsedContent;

  try {
    const result = await chatSession.sendMessage(message);
    const rawText = result.response.text();
    parsedContent = JSON.parse(rawText);
  } catch (err) {
    console.error('[Gemini Service] Fallback Parsing Error:', err);
    // If the model weirdly breaks JSON, provide a safety net
    parsedContent = {
      reply: "I'm having a slight cognitive glitch right now processing the stadium telemetry. Could you repeat that?",
      intent: 'GENERAL',
      suggestedZones: []
    };
  }

  const latencyMs = Date.now() - startTime;

  // Asynchronously Log the interaction to BigQuery
  if (userContext.uid) {
    const logData = {
      interaction_id: crypto.randomUUID(),
      user_id: userContext.uid,
      session_id: sessionId,
      query: message,
      response_summary: parsedContent.reply.substring(0, 500),
      intent: parsedContent.intent || 'GENERAL',
      suggested_zones: parsedContent.suggestedZones || [],
      user_tier: userContext.tier || 'STANDARD',
      latency_ms: latencyMs,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    };
    
    bqInsert(Tables.AI_INTERACTIONS, [logData]).catch(err => {
      console.error('[Gemini Service] BQ Telemetry Insert Failed:', err.message);
    });
  }

  return {
    reply: parsedContent.reply,
    intent: parsedContent.intent || 'GENERAL',
    suggestedZones: parsedContent.suggestedZones || [],
    timestamp: new Date().toISOString()
  };
};
