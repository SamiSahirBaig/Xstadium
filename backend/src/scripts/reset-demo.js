// scripts/reset-demo.js
import admin, { firestore, rtdb } from '../config/firebase.js';
import { BigQuery } from '@google-cloud/bigquery';
import readline from 'readline';

const bq = new BigQuery();

const PROMPT = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ZONES = [
  'GATE_A', 'GATE_B', 'GATE_C', 
  'CONCOURSE_N', 'CONCOURSE_S', 
  'FOOD_COURT_1', 'FOOD_COURT_2', 
  'VIP_LOUNGE', 'FIELD_LEVEL', 
  'UPPER_DECK_E', 'UPPER_DECK_W', 
  'MEDICAL_ZONE'
];

async function deleteCollection(collectionPath) {
  const collectionRef = firestore.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(500);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function truncateBigQuery() {
  const dataset = bq.dataset('arenaiq_analytics');
  const tables = ['ai_interactions', 'user_movements'];
  for (const table of tables) {
    try {
      await dataset.table(table).query(`TRUNCATE TABLE \`${dataset.id}.${table}\``);
      console.log(`[BQ] TRUNCATED \`${table}\``);
    } catch (e) {
      console.warn(`[BQ] Skipping ${table}: ${e.message}`);
    }
  }
}

async function resetDemo() {
  try {
    console.log('[FIREBASE] Wiping alerts collection...');
    await deleteCollection('alerts');
    console.log('[FIREBASE] alerts collection cleared. 0ms');

    console.log('[FIREBASE] Wiping routes collection...');
    await deleteCollection('routes');
    console.log('[FIREBASE] routes collection cleared. 0ms');

    console.log('[RTDB] Resetting liveZone pressures to 20...');
    const dbRef = rtdb.ref('liveZones/ARENA_PRIME');
    const updates = {};
    for (const zone of ZONES) {
      updates[`${zone}/pressureScore`] = 20;
    }
    await dbRef.update(updates);
    console.log('[RTDB] liveZones set to baseline 20. 0ms');

    console.log('[FIREBASE] Resetting demo user points...');
    try {
        const usersSnapshot = await firestore.collection('users').get();
        const batch = firestore.batch();
        usersSnapshot.forEach(doc => {
            batch.update(doc.ref, { points: 0, tier: 'STANDARD' });
        });
        await batch.commit();
        console.log('[FIREBASE] Users reset successfully.');
    } catch (e) {
        console.warn('User reset missing', e.message);
    }
    
    console.log('[BIGQUERY] Wiping analytics logs...');
    await truncateBigQuery();
    
    console.log('✅ DEMO HAS BEEN COMPLETELY RESET. The environment is now perfectly clean.');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
  }
}

PROMPT.question('⚠️ WARNING: This will WIPE ALL routing, alerts, user points, and analytic interactions globally. Type "Y" to proceed: ', (answer) => {
  if (answer.trim().toUpperCase() === 'Y') {
    resetDemo();
  } else {
    console.log('Reset cancelled.');
    process.exit(0);
  }
});
