import { firestore, rtdb } from '../config/firebase.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ─── Collection References ────────────────────────────────────────────────────
export const Collections = {
  ZONES: 'zones',
  USERS: 'users',
  EVENTS: 'events',
  ALERTS: 'alerts',
  ROUTES: 'routes',
  LEADERBOARD: 'leaderboard',
};

// ─── Firestore Helpers ────────────────────────────────────────────────────────

/**
 * Get a single document by collection and ID.
 * Returns the document data with its ID, or null if not found.
 *
 * @param {string} collection
 * @param {string} docId
 * @returns {Promise<Object|null>}
 */
export const getDoc = async (collection, docId) => {
  const snap = await firestore.collection(collection).doc(docId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Get all documents in a collection.
 * Returns an array of document data objects with IDs.
 *
 * @param {string} collection
 * @param {Object} [options]
 * @param {string} [options.orderBy] - Field to order by
 * @param {string} [options.direction='asc'] - 'asc' | 'desc'
 * @param {number} [options.limit] - Max number of documents
 * @returns {Promise<Object[]>}
 */
export const getDocs = async (collection, options = {}) => {
  let query = firestore.collection(collection);
  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.direction || 'asc');
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Set a document (creates or overwrites).
 *
 * @param {string} collection
 * @param {string} docId
 * @param {Object} data
 * @param {boolean} [merge=false] - Merge with existing doc instead of overwrite
 * @returns {Promise<void>}
 */
export const setDoc = async (collection, docId, data, merge = false) => {
  await firestore.collection(collection).doc(docId).set(
    { ...data, updatedAt: Timestamp.now() },
    { merge }
  );
};

/**
 * Update specific fields in a document.
 *
 * @param {string} collection
 * @param {string} docId
 * @param {Object} data
 * @returns {Promise<void>}
 */
export const updateDoc = async (collection, docId, data) => {
  await firestore.collection(collection).doc(docId).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Add a new document with an auto-generated ID.
 *
 * @param {string} collection
 * @param {Object} data
 * @returns {Promise<string>} The new document ID
 */
export const addDoc = async (collection, data) => {
  const ref = await firestore.collection(collection).add({
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

/**
 * Delete a document.
 *
 * @param {string} collection
 * @param {string} docId
 * @returns {Promise<void>}
 */
export const deleteDoc = async (collection, docId) => {
  await firestore.collection(collection).doc(docId).delete();
};

/**
 * Increment a numeric field atomically.
 *
 * @param {string} collection
 * @param {string} docId
 * @param {string} field
 * @param {number} amount
 * @returns {Promise<void>}
 */
export const incrementField = async (collection, docId, field, amount = 1) => {
  await firestore.collection(collection).doc(docId).update({
    [field]: FieldValue.increment(amount),
    updatedAt: Timestamp.now(),
  });
};

/**
 * Add item to an array field atomically (no duplicates).
 *
 * @param {string} collection
 * @param {string} docId
 * @param {string} field
 * @param {*} value
 * @returns {Promise<void>}
 */
export const arrayUnion = async (collection, docId, field, value) => {
  await firestore.collection(collection).doc(docId).update({
    [field]: FieldValue.arrayUnion(value),
    updatedAt: Timestamp.now(),
  });
};

/**
 * Query documents by a single field equality.
 *
 * @param {string} collection
 * @param {string} field
 * @param {*} value
 * @returns {Promise<Object[]>}
 */
export const queryWhere = async (collection, field, value) => {
  const snap = await firestore.collection(collection).where(field, '==', value).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get documents from a subcollection.
 *
 * @param {string} collection
 * @param {string} docId
 * @param {string} subcollection
 * @param {Object} [options]
 * @returns {Promise<Object[]>}
 */
export const getSubcollection = async (collection, docId, subcollection, options = {}) => {
  let query = firestore.collection(collection).doc(docId).collection(subcollection);
  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.direction || 'desc');
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Add a document to a subcollection.
 *
 * @param {string} collection
 * @param {string} docId
 * @param {string} subcollection
 * @param {Object} data
 * @returns {Promise<string>} New document ID
 */
export const addToSubcollection = async (collection, docId, subcollection, data) => {
  const ref = await firestore
    .collection(collection)
    .doc(docId)
    .collection(subcollection)
    .add({ ...data, createdAt: Timestamp.now() });
  return ref.id;
};

// ─── Realtime Database Helpers ────────────────────────────────────────────────

/**
 * Write data to a Realtime Database path.
 *
 * @param {string} path - e.g. 'liveZones/ARENA_PRIME/GATE_A'
 * @param {Object} data
 * @returns {Promise<void>}
 */
export const rtdbSet = async (path, data) => {
  await rtdb.ref(path).set({ ...data, timestamp: Date.now() });
};

/**
 * Update specific fields at a Realtime Database path.
 *
 * @param {string} path
 * @param {Object} data
 * @returns {Promise<void>}
 */
export const rtdbUpdate = async (path, data) => {
  await rtdb.ref(path).update({ ...data, timestamp: Date.now() });
};

/**
 * Read data at a Realtime Database path once.
 *
 * @param {string} path
 * @returns {Promise<*>} The value at the path, or null
 */
export const rtdbGet = async (path) => {
  const snap = await rtdb.ref(path).once('value');
  return snap.val();
};

// ─── User Document Helpers ────────────────────────────────────────────────────

/**
 * Create a new user document in Firestore on first sign-in.
 * Safe to call multiple times — uses merge to avoid overwrites.
 *
 * @param {string} uid
 * @param {Object} profile - { displayName, email?, photoURL? }
 * @returns {Promise<void>}
 */
export const initUserDocument = async (uid, profile = {}) => {
  const existing = await getDoc(Collections.USERS, uid);
  if (existing) return; // Already initialized

  await setDoc(Collections.USERS, uid, {
    uid,
    displayName: profile.displayName || 'Stadium Fan',
    email: profile.email || null,
    photoURL: profile.photoURL || null,
    tier: 'STANDARD',
    tierExpiry: null,
    points: 0,
    currentZone: null,
    fcmToken: null,
    badges: [],
    lastStory: null,
    preferences: {
      notifications: true,
      navigationMode: 'least_crowded',
      audioEnabled: true,
    },
  });

  console.info(`[Firestore] 👤 User document created: ${uid}`);
};

export { FieldValue, Timestamp };
