import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Zap, ShieldAlert, Users, RotateCcw, Activity, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, update } from 'firebase/database';
import { db, rtdb } from '../config/firebase.js';
import { useZoneStore } from '../store/zoneStore.js';
import { useUserStore } from '../store/userStore.js';
import { usePresentationStore } from '../store/presentationStore.js';
import InteractiveStadium from '../components/map/InteractiveStadium.jsx';
import { Box } from 'lucide-react';

const ZONES = [
  'GATE_A', 'GATE_B', 'GATE_C', 
  'CONCOURSE_N', 'CONCOURSE_S', 
  'FOOD_COURT_1', 'FOOD_COURT_2', 
  'VIP_LOUNGE', 'FIELD_LEVEL', 
  'UPPER_DECK_E', 'UPPER_DECK_W', 
  'MEDICAL_ZONE'
];

export default function DemoPanel() {
  const { eventPhase, zones } = useZoneStore();
  const { user, profile, updateTier } = useUserStore();
  const { startPresentation } = usePresentationStore();
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (msg) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handlePhaseChange = async (e) => {
    const newPhase = e.target.value;
    try {
      await updateDoc(doc(db, 'events', 'demo'), { currentPhase: newPhase });
      addLog(`Phase shifted to ${newPhase}`);
    } catch (err) {
      addLog(`ERR: Failed to set phase: ${err.message}`);
    }
  };

  const handlePressureOverride = async (zoneId, pressure) => {
    try {
      const p = Math.max(0, Math.min(100, Number(pressure)));
      const capacity = zones[zoneId]?.maxCapacity || 1000;
      const currentOccupancy = Math.floor((p / 100) * capacity);
      
      await update(ref(rtdb, `liveZones/ARENA_PRIME/${zoneId}`), {
        pressureScore: p,
        currentOccupancy,
        trend: p > 80 ? 'rising' : 'stable',
        timestamp: Date.now()
      });
      addLog(`OVERRIDE: ${zoneId} -> ${p}%`);
    } catch (err) {
      addLog(`ERR: Override failed: ${err.message}`);
    }
  };

  const toggleVIP = async () => {
    if (!user) {
      addLog('ERR: No active user to upgrade.');
      return;
    }
    setLoading(true);
    try {
      const newTier = profile?.tier === 'VIP' ? 'STANDARD' : 'VIP';
      await updateDoc(doc(db, 'users', user.uid), { tier: newTier });
      updateTier(newTier);
      addLog(`USER_UPDATE: Tier set to ${newTier}`);
    } catch (err) {
      addLog(`ERR: VIP Toggle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = async (zoneId) => {
    try {
      // Pushing a massive spike to trigger anomalyDetector
      await handlePressureOverride(zoneId, 98);
      addLog(`TRIGGER: Forced critical surge at ${zoneId}`);
    } catch (err) {
      addLog(`ERR: Alert trigger failed.`);
    }
  };

  const simulateCrowdRush = async () => {
    addLog(`INIT: Simulating Crowd Rush (3 zones)`);
    const randomZones = [...ZONES].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const z of randomZones) {
      await handlePressureOverride(z, Math.floor(Math.random() * 10) + 90);
    }
    
    // Auto-reset after 30 seconds
    setTimeout(() => {
      addLog(`RESET: Crowd Rush concluding...`);
      for (const z of randomZones) {
        handlePressureOverride(z, 40);
      }
    }, 30000);
  };

  const resetAll = async () => {
    addLog(`INIT: Global Reset Sequence`);
    for (const z of ZONES) {
      await handlePressureOverride(z, 30);
    }
    await updateDoc(doc(db, 'events', 'demo'), { currentPhase: 'PRE_GAME' });
    addLog(`SUCCESS: Simulation state reset.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        padding: 'var(--space-6)',
        fontFamily: 'var(--font-mono)',
        color: '#00ff88',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', borderBottom: '1px solid #00ff8840', paddingBottom: 'var(--space-4)' }}>
        <Terminal size={28} color="#00ff88" />
        <h1 style={{ color: '#00ff88', fontSize: '24px', fontWeight: 'bold', margin: 0, textShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }}>
          XSTADIUM // DEMO_ROOT
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Environment Controls */}
        <div style={{ border: '1px solid #00ff8840', background: 'rgba(0, 255, 136, 0.05)', padding: 'var(--space-4)', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
             <Activity size={18} /> Global Simulation
          </h2>
          
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>EVENT_PHASE</label>
            <select 
              value={eventPhase || 'PRE_GAME'} 
              onChange={handlePhaseChange}
              style={{ width: '100%', background: '#000', color: '#00ff88', border: '1px solid #00ff88', padding: '8px', fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="PRE_GAME">PRE_GAME</option>
              <option value="HALF_TIME">HALF_TIME</option>
              <option value="POST_GAME">POST_GAME</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>
          </div>

          <button 
             onClick={simulateCrowdRush}
             style={{ width: '100%', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: '1px solid #00ff88', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginBottom: '12px' }}
          >
            <Users size={16} /> EXCUTE CROWD_RUSH
          </button>

          <button 
             onClick={resetAll}
             style={{ width: '100%', background: 'rgba(255, 0, 0, 0.1)', color: '#ff4444', border: '1px solid #ff4444', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginBottom: '12px' }}
          >
            <RotateCcw size={16} /> RESET_SYSTEM
          </button>

          <button 
             onClick={startPresentation}
             style={{ width: '100%', background: '#00ff88', color: '#000', border: 'none', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
          >
             START_PITCH_SEQUENCE
          </button>
        </div>

        {/* User Overrides */}
        <div style={{ border: '1px solid #00ff8840', background: 'rgba(0, 255, 136, 0.05)', padding: 'var(--space-4)', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
             <Zap size={18} /> User Overrides
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
             <span style={{ fontSize: '14px' }}>Current Target: <span style={{ color: '#fff' }}>{profile?.displayName || 'N/A'}</span></span>
             <span className="badge" style={{ background: profile?.tier === 'VIP' ? 'var(--color-accent-2)' : '#333', color: '#fff' }}>{profile?.tier || 'N/A'}</span>
          </div>

          <button 
             onClick={toggleVIP}
             disabled={loading}
             style={{ width: '100%', background: '#000', color: '#00ff88', border: '1px solid #00ff88', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px' }}
          >
            TOGGLE_VIP_STATUS
          </button>

          <h3 style={{ fontSize: '14px', borderTop: '1px solid #00ff8840', paddingTop: '12px', marginTop: '12px' }}>Live Shareable Demo</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ background: '#fff', padding: '8px', borderRadius: '8px' }}>
                  <QRCodeSVG id="demo-qr-export" value="https://arenaiq.demo/live?token=DEMO2026" size={80} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>Scan to join as Gold tier with guided Joyride tour.</p>
                 <a 
                    onClick={() => {
                        const svg = document.getElementById('demo-qr-export');
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'arenaiq-demo-qr.svg';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                    style={{ background: '#00ff88', color: '#000', padding: '6px', textAlign: 'center', borderRadius: '4px', fontSize: '12px',cursor: 'pointer', fontWeight: 'bold' }}
                 >
                    DOWNLOAD_SVG
                 </a>
              </div>
          </div>
        </div>

        {/* Console Log */}
        <div style={{ border: '1px solid #00ff8840', background: '#000', padding: 'var(--space-4)', borderRadius: '4px', gridColumn: '1 / -1', minHeight: '150px' }}>
           <h2 style={{ fontSize: '14px', marginBottom: 'var(--space-2)', color: '#00ff8880' }}>{'// SYSTEM_LOG'}</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', opacity: 0.8 }}>
             {log.map((l, i) => (
                <div key={i}>{l}</div>
             ))}
             {log.length === 0 && <div>Awaiting commands...</div>}
           </div>
        </div>

        {/* 3D Model Hologram */}
        <div style={{ gridColumn: '1 / -1', border: '1px solid #00ff8840', background: 'rgba(0, 255, 136, 0.05)', padding: 'var(--space-4)', borderRadius: '4px', height: '400px', display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Box size={18} /> Physical 3D Render (InteractiveStadium.jsx)
           </h2>
           <div style={{ flex: 1, position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid #00ff8820' }}>
              <InteractiveStadium />
           </div>
        </div>

        {/* Zone Overrides */}
        <div style={{ gridColumn: '1 / -1', border: '1px solid #00ff8840', background: 'rgba(0, 255, 136, 0.05)', padding: 'var(--space-4)', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
             <ShieldAlert size={18} /> Directed Attacks (Zone Manipulation)
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
             {ZONES.map(z => (
                <div key={z} style={{ border: '1px dashed #00ff8840', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>{z}</span>
                      <span style={{ color: zones[z]?.pressureScore > 80 ? '#ff4444' : '#00ff88' }}>
                        {Math.round(zones[z]?.pressureScore || 0)}%
                      </span>
                   </div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                         type="range" min="0" max="100" 
                         value={zones[z]?.pressureScore || 0}
                         onChange={(e) => handlePressureOverride(z, e.target.value)}
                         style={{ flex: 1, accentColor: '#00ff88' }}
                      />
                      <button 
                         onClick={() => triggerAlert(z)}
                         title="Trigger Surge Alert"
                         style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', cursor: 'pointer', padding: '0 8px', borderRadius: '4px' }}
                      >
                         SPIKE
                      </button>
                   </div>
                </div>
             ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
