# API Keys & Service Setup Guide

## 1. Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key**
4. Copy the key and add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

## 2. Google Maps JavaScript API Key

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click **Create Credentials → API Key**
4. Under **Key restrictions → Application restrictions**, select **HTTP referrers**
5. Add: `localhost:*`, `127.0.0.1:*`
6. Under **API restrictions**, restrict to: Maps JavaScript API, Routes API
7. Copy the key and add to `frontend/.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```

## 3. Google Cloud Service Account (Pub/Sub, BigQuery, Vertex AI)

1. In Google Cloud Console → **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
   - Name: `xstadium-backend`
   - Description: `Backend service account for Xstadium`
3. Grant roles:
   - `BigQuery Data Editor`
   - `Pub/Sub Publisher`
   - `Pub/Sub Subscriber`
   - `Vertex AI User`
4. Click **Create Key → JSON** — download `service-account-key.json`
5. Place it in the `backend/` folder (it is gitignored)
6. Add to `backend/.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```

## 4. Firebase Project Setup

1. Visit [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable these services:
   - **Firestore Database** (Native mode)
   - **Realtime Database**
   - **Authentication** (Anonymous + Google)
   - **Cloud Messaging**
   - **Hosting**
4. Go to **Project Settings → Your Apps → Web App**
5. Copy the config object to `frontend/.env` as `VITE_FIREBASE_*` variables
6. Go to **Project Settings → Service accounts**
7. Click **Generate new private key** — this is your Firebase Admin SDK key
   - Save as `backend/service-account-key.json` (same file as GCP if same project)

## 5. Required APIs to Enable

Run these gcloud commands or enable manually in the Cloud Console:

```bash
gcloud services enable \
  generativelanguage.googleapis.com \
  maps-javascript-api.googleapis.com \
  routes.googleapis.com \
  pubsub.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com
```

## Security Reminders

> ⚠️ **NEVER** commit `.env` files or `service-account-key.json` to git.  
> These files are listed in `.gitignore`.  
> Rotate keys immediately if accidentally exposed.
