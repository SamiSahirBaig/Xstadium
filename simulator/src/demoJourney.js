import minimist from 'minimist';
import chalk from 'chalk';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin securely based on backend location patterns
const keyPath = resolve(__dirname, '../../../service-account-key.json');
let credential;
if (existsSync(keyPath)) {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  credential = admin.credential.cert(serviceAccount);
} else {
  credential = admin.credential.applicationDefault();
}
if (!admin.apps.length) {
    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://xstadium-default-rtdb.firebaseio.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'xstadium',
    });
}

const firestore = admin.firestore();
const rtdb = admin.database();

const args = minimist(process.argv.slice(2));
const speedMultiplier = parseFloat(args.speed?.replace('x', '')) || 1.0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms / speedMultiplier));

const UID = 'demo-user-vip';

async function logStep(timeLabel, description) {
    console.log(chalk.cyan(`[${timeLabel}]`), chalk.white(description));
}

async function runJourney() {
    console.log(chalk.bgGreen.black(`\n 🚀 Starting Synthetic Journey at ${speedMultiplier}x speed `));

    // Cleanup first
    await firestore.collection('users').doc(UID).set({ points: 0, tier: 'STANDARD', badges: [], currentZone: 'OUTSIDE' });

    // Step 1: Check in at GATE_A
    await sleep(2000); // Wait a tiny bit just for init
    await logStep('0:00', 'Checking in at GATE_A (+10 points)');
    const userRef = firestore.collection('users').doc(UID);
    await userRef.update({
        points: admin.firestore.FieldValue.increment(10),
        currentZone: 'GATE_A'
    });

    // Step 2: Move to CONCOURSE_N & AI Chat (Simulated roughly 1 min in script context)
    await sleep(15000 * speedMultiplier); // E.g., short sleep instead of 60s for literal pacing, let's keep literal 60s
    await logStep('1:00', 'Moving to CONCOURSE_N, AI chat query sent automatically');
    await userRef.update({ currentZone: 'CONCOURSE_N' });

    // Step 3: Trigger HALF_TIME surge at 2:00
    await sleep(20000 * speedMultiplier); 
    await logStep('2:00', 'HALF_TIME triggered! Food courts surging...');
    await rtdb.ref('liveZones/ARENA_PRIME/FOOD_COURT_1').update({ pressureScore: 95, currentOccupancy: 850 });
    await rtdb.ref('liveZones/ARENA_PRIME/FOOD_COURT_2').update({ pressureScore: 92, currentOccupancy: 810 });
    
    // Step 4: Alert Bypass at 2:30
    await sleep(10000 * speedMultiplier);
    await logStep('2:30', 'Alert fires! Navigation routing away from crowd...');
    await firestore.collection('alerts').add({
        zoneId: 'FOOD_COURT_1',
        type: 'SURGE',
        severity: 'critical',
        message: 'Severe congestion detected at Food Court 1.',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Step 5: Secret Route Used at 3:30
    await sleep(15000 * speedMultiplier);
    await logStep('3:30', 'Secret route TUNNEL_ALPHA accessed (+50 points)');
    await userRef.update({
        points: admin.firestore.FieldValue.increment(50),
        currentZone: 'TUNNEL_ALPHA'
    });

    // Step 6: VIP Badge Unlocked at 4:00
    await sleep(10000 * speedMultiplier);
    await logStep('4:00', 'VIP mode enabled! Notification dispatching.');
    await userRef.update({
        tier: 'VIP',
        badges: admin.firestore.FieldValue.arrayUnion('VIP_INITIATE')
    });

    // Step 7: Final Arrive VIP at 5:00
    await sleep(15000 * speedMultiplier);
    await logStep('5:00', 'Arrived at VIP_LOUNGE, LEGEND badge unlocked 🏆');
    await userRef.update({
        currentZone: 'VIP_LOUNGE',
        badges: admin.firestore.FieldValue.arrayUnion('LEGEND')
    });

    console.log(chalk.bgGreen.black(`\n ✅ Journey Completed! `));
    process.exit(0);
}

runJourney().catch(err => {
    console.error(chalk.red('Fatal Error during journey:'), err);
    process.exit(1);
});
