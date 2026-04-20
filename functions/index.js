import { initializeApp } from 'firebase-admin/app';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (Functions SDK handles credentials automatically)
initializeApp();

const db = getFirestore();

/**
 * Cloud Function: onUserCreated
 * Triggered when a new user document is created in Firestore.
 * Seeds the initial leaderboard entry for the user.
 */
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data?.data();

  if (!userData) return;

  // Add to leaderboard with initial 0 points
  await db.collection('leaderboard').doc(userId).set({
    userId,
    displayName: userData.displayName || 'Stadium Fan',
    tier: userData.tier || 'STANDARD',
    points: 0,
    updatedAt: new Date(),
  });

  console.info(`[onUserCreated] Leaderboard entry created for: ${userId}`);
});

/**
 * Cloud Function: healthCheck
 * Simple HTTP endpoint to verify Functions are deployed and running.
 */
export const healthCheck = onRequest((req, res) => {
  res.json({
    status: 'ok',
    service: 'xstadium-functions',
    timestamp: new Date().toISOString(),
  });
});
