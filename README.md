# Xstadium — AI-Powered Sentient Stadium OS

> **Hackathon Project** | Transforming large-scale sporting venues into intelligent, personalized experiences for every attendee.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)

---

## 🏟️ What is Xstadium?

Xstadium is an AI-powered stadium operating system that makes every attendee feel like a VIP. It combines real-time crowd intelligence, predictive AI, smart routing, and gamification to create an unparalleled fan experience.

### Core Capabilities

| Feature | Description |
|---|---|
| 🗺️ **Live Crowd Heatmap** | Real-time crowd density across all stadium zones |
| 🤖 **AI Assistant** | Gemini-powered natural language navigation guide |
| 🧭 **Smart Routing** | Least-crowded path computation using Dijkstra |
| 🏅 **Gamification** | Points, badges, leaderboards, and tier system |
| 👑 **VIP Experience** | Fast lanes, secret routes, concierge AI |
| 🔔 **Push Notifications** | Real-time alerts and personalized nudges |
| 😊 **Emotion Layer** | Crowd mood detection and adaptive UI theming |
| 📊 **Analytics** | BigQuery-powered historical trend dashboard |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite (PWA) |
| **Backend** | Node.js + Express |
| **Simulator** | Node.js crowd engine |
| **Database** | Firebase Firestore + Realtime Database |
| **AI** | Google Gemini 1.5 Flash + Vertex AI |
| **Maps** | Google Maps JavaScript API |
| **Streaming** | Google Cloud Pub/Sub |
| **Analytics** | BigQuery |
| **Auth** | Firebase Authentication |
| **Functions** | Firebase Cloud Functions |

---

## 📁 Project Structure

```
xstadium/
├── frontend/          # React PWA (Vite)
├── backend/           # Node.js Express API server
├── simulator/         # Crowd data simulation engine
├── functions/         # Firebase Cloud Functions
├── docs/              # Architecture docs & API contracts
├── scripts/           # Utility scripts (seed, reset)
├── package.json       # Root monorepo config
├── .eslintrc.js       # Shared ESLint config
└── .prettierrc        # Shared Prettier config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud SDK (for Pub/Sub & BigQuery)

### 1. Clone & Install

```bash
git clone https://github.com/SamiSahirBaig/Xstadium.git
cd Xstadium
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` files in each workspace and fill in your credentials:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp simulator/.env.example simulator/.env
```

### 3. Set Up Firebase

```bash
firebase login
firebase init   # Select: Firestore, Realtime DB, Functions, Hosting
firebase emulators:start
```

### 4. Run Development Servers

```bash
# Run backend + frontend concurrently
npm run dev

# Or run individually
npm run dev:backend
npm run dev:frontend
npm run dev:simulator
```

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend dev servers |
| `npm run dev:simulator` | Start crowd simulation engine |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run format` | Format all files with Prettier |
| `npm run demo:reset` | Reset demo data to baseline |

---

## 🔑 Required API Keys & Services

See [`docs/api-keys.md`](./docs/api-keys.md) for full setup instructions.

- Google Gemini API key
- Google Maps JavaScript API key
- Google Cloud service account (Pub/Sub, BigQuery, Vertex AI)
- Firebase project credentials

---

## 📖 Documentation

- [`docs/firestore-schema.md`](./docs/firestore-schema.md) — Database schema
- [`docs/api-keys.md`](./docs/api-keys.md) — API key setup guide
- [`docs/pubsub-setup.md`](./docs/pubsub-setup.md) — Pub/Sub configuration
- [`docs/scaling.md`](./docs/scaling.md) — Multi-venue scaling architecture

---

## 🏆 License

MIT — Built for hackathon purposes.
