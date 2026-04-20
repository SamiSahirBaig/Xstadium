import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

// ─── Firebase Client Configuration ───────────────────────────────────────────
// All values sourced from environment variables (see frontend/.env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// ─── Initialize App ───────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// ─── Initialize Services ──────────────────────────────────────────────────────
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize messaging only in browser (not during SSR or if not supported)
export let messaging = null;
if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch {
    console.warn('[Firebase] Messaging not supported in this environment.');
  }
}

// ─── Emulator Connection (Development Only) ───────────────────────────────────
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectDatabaseEmulator(rtdb, 'localhost', 9000);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.info('[Firebase] 🔧 Connected to local emulators');
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Sign in anonymously — used on first app launch during onboarding.
 * Returns the Firebase User object.
 */
export const signInAnon = () => signInAnonymously(auth);

/**
 * Sign in with Google popup — upgrades anonymous session to a real account.
 * Returns the UserCredential object.
 */
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

/**
 * Subscribe to auth state changes.
 * @param {function} callback - Called with (user | null)
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Get the current user's ID token for API authentication.
 * @returns {Promise<string>} The Firebase ID token
 */
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.getIdToken();
};

export default app;
