import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Square } from 'lucide-react';
import { usePresentationStore, STEPS } from '../../store/presentationStore.js';
import { ref, update } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { rtdb, db } from '../../config/firebase.js';

export default function PresentationRunner() {
  const { isActive, isPaused, currentStepIndex, nextStep, prevStep, pause, resume, stopPresentation } = usePresentationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const step = STEPS[currentStepIndex];

  // The actual automation runner loops
  useEffect(() => {
    if (!isActive || isPaused || !step) return;

    // Trigger action when entering step
    executeStepAction(currentStepIndex);

    // Set timeout to auto-advance
    const timer = setTimeout(() => {
      nextStep();
    }, step.durationMs);

    return () => clearTimeout(timer);
  }, [isActive, isPaused, currentStepIndex, step, nextStep]);

  const executeStepAction = async (index) => {
    try {
      if (index === 0) {
        // Pre-Game map state
        if (location.pathname !== '/map') navigate('/map');
        await updateDoc(doc(db, 'events', 'demo'), { currentPhase: 'PRE_GAME' });
        await update(ref(rtdb, 'liveZones/ARENA_PRIME/FOOD_COURT_1'), { pressureScore: 30, timestamp: Date.now() });
      } 
      else if (index === 1) {
        // Half-Time Surge
        await updateDoc(doc(db, 'events', 'demo'), { currentPhase: 'HALF_TIME' });
        await update(ref(rtdb, 'liveZones/ARENA_PRIME/FOOD_COURT_1'), { pressureScore: 92, trend: 'rising', timestamp: Date.now() });
        await update(ref(rtdb, 'liveZones/ARENA_PRIME/CONCOURSE_S'), { pressureScore: 85, trend: 'rising', timestamp: Date.now() });
      }
      else if (index === 2) {
        // Alert Fires (already triggered by backend via RTDB change)
      }
      else if (index === 3) {
        // AI Interface
        if (location.pathname !== '/assistant') navigate('/assistant');
      }
      else if (index === 4) {
        // Routing Polyline
        if (location.pathname !== '/map') navigate('/map');
      }
      else if (index === 5) {
        // VIP Override Show
      }
      else if (index === 6) {
        // Gamification / Points
        if (location.pathname !== '/rewards') navigate('/rewards');
      }
    } catch (err) {
      console.error('[Presentation Runner Error]', err);
    }
  };

  if (!isActive || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: 'fixed',
          bottom: '80px', // Above bottom nav
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '450px',
          background: 'rgba(5, 11, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.2)',
          padding: 'var(--space-4)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            auto-seq // {currentStepIndex + 1}/{STEPS.length}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={prevStep} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipBack size={16} /></button>
             {isPaused ? (
                <button onClick={resume} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Play size={16} /></button>
             ) : (
                <button onClick={pause} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Pause size={16} /></button>
             )}
             <button onClick={nextStep} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><SkipForward size={16} /></button>
             <button onClick={stopPresentation} style={{ background: 'none', border: 'none', color: 'var(--color-critical)', cursor: 'pointer', marginLeft: '8px' }}><Square size={16} /></button>
          </div>
        </div>

        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>{step.title}</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.body}</p>
        </div>

        {/* Progress Bar natively ticking over step.durationMs */}
        {!isPaused && (
           <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
              <motion.div 
                 initial={{ width: '0%' }}
                 animate={{ width: '100%' }}
                 transition={{ duration: step.durationMs / 1000, ease: "linear" }}
                 style={{ height: '100%', background: 'var(--color-primary)' }}
              />
           </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
