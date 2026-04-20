import { adminAuth } from '../config/firebase.js';
import { getDoc, Collections } from '../db/firestore.js';

/**
 * Middleware: Verify Firebase ID Token
 *
 * Expects: Authorization: Bearer <firebase-id-token>
 * Attaches req.user = { uid, email, tier, ... } on success.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Fetch user Firestore document to get tier and preferences
    const userDoc = await getDoc(Collections.USERS, decoded.uid);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
      tier: userDoc?.tier || 'STANDARD',
      points: userDoc?.points || 0,
      preferences: userDoc?.preferences || {},
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.code || err.message);

    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'TokenExpired', message: 'ID token has expired.' });
    }

    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid ID token.' });
  }
};

/**
 * Middleware Factory: Tier Guard
 *
 * Returns a middleware that blocks access unless the user's tier meets
 * the minimum required tier level.
 *
 * Tier hierarchy: STANDARD < GOLD < DIAMOND < VIP
 *
 * @param {string} requiredTier - 'GOLD' | 'DIAMOND' | 'VIP'
 * @returns {function} Express middleware
 *
 * @example
 * router.get('/vip-route', authenticate, tierGuard('VIP'), handler)
 */
export const tierGuard = (requiredTier) => {
  const tierRank = { STANDARD: 0, GOLD: 1, DIAMOND: 2, VIP: 3 };
  const required = tierRank[requiredTier] ?? 0;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated.' });
    }

    const userRank = tierRank[req.user.tier] ?? 0;

    if (userRank < required) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This feature requires ${requiredTier} tier or higher. Your tier: ${req.user.tier}`,
        requiredTier,
        currentTier: req.user.tier,
        upgradeHint: 'Earn points to unlock higher tiers automatically.',
      });
    }

    next();
  };
};

/**
 * Optional auth middleware — attaches req.user if token is present,
 * but does NOT block unauthenticated requests.
 * Use for routes that have different behavior for authed vs anonymous users.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await getDoc(Collections.USERS, decoded.uid);
    req.user = {
      uid: decoded.uid,
      tier: userDoc?.tier || 'STANDARD',
      points: userDoc?.points || 0,
    };
  } catch {
    req.user = null;
  }

  next();
};
