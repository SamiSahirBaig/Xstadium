import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Initialization ───────────────────────────────────────────
// Prevents re-initialization when module is hot-reloaded in dev (nodemon)
if (!admin.apps.length) {
  let credential;

  const keyPath = resolve(__dirname, '../../', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account-key.json');

  if (existsSync(keyPath)) {
    // Use service account key file (local development & CI)
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
    console.info('[Firebase Admin] ✅ Using service account key file');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Use JSON string from environment variable (production/Cloud Run)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
    console.info('[Firebase Admin] ✅ Using service account from env var');
  } else {
    // Fall back to Application Default Credentials (GCP-hosted environments)
    credential = admin.credential.applicationDefault();
    console.info('[Firebase Admin] ✅ Using Application Default Credentials');
  }

  admin.initializeApp({
    credential,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  console.info(`[Firebase Admin] 🔥 Initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
}

// ─── Export Services ──────────────────────────────────────────────────────────
export const firestore = admin.firestore();
export const rtdb = admin.database();
export const fcm = admin.messaging();
export const adminAuth = admin.auth();

export default admin;
