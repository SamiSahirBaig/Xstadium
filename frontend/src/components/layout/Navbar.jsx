import { Bell, Wifi, WifiOff, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZoneStore } from '../../store/zoneStore.js';
import { useUserStore } from '../../store/userStore.js';
import { useAccessibilityStore } from '../../store/accessibilityStore.js';
import NotificationCenter from '../ui/NotificationCenter.jsx';
import styles from './Navbar.module.css';
import { useState, useEffect } from 'react';

const PHASE_LABELS = {
  PRE_GAME:  { label: 'Pre-Game',  color: '#3b82f6' },
  HALF_TIME: { label: 'Half-Time', color: '#f59e0b' },
  POST_GAME: { label: 'Post-Game', color: '#10b981' },
  EMERGENCY: { label: 'EMERGENCY', color: '#ef4444' },
};

const TIER_COLORS = {
  STANDARD: '#94a3b8',
  GOLD:     '#f59e0b',
  DIAMOND:  '#67e8f9',
  VIP:      '#c084fc',
};

export default function Navbar() {
  const { isConnected, eventPhase, getActiveAlertsCount, venueMood } = useZoneStore();
  const { profile } = useUserStore();
  const a11y = useAccessibilityStore();
  
  const [fcmUnread, setFcmUnread] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);

  useEffect(() => {
    const handleUnread = () => setFcmUnread(window.__globalUnreadFCMCount || 0);
    window.addEventListener('unread_count_updated', handleUnread);
    return () => window.removeEventListener('unread_count_updated', handleUnread);
  }, []);

  const alertCount = getActiveAlertsCount();
  const totalCount = alertCount + fcmUnread;

  const phase = PHASE_LABELS[eventPhase] || PHASE_LABELS.PRE_GAME;
  const tierColor = TIER_COLORS[profile?.tier || 'STANDARD'];
  const initials = (profile?.displayName || 'XS').slice(0, 2).toUpperCase();

  return (
    <header className={styles.navbar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoX}>X</span>
        <span className={styles.logoText}>stadium</span>
      </div>

      {/* Left-ish: Mood indicator */}
      {venueMood && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="badge"
           style={{ 
             background: 'var(--color-accent)', 
             color: '#fff', 
             fontWeight: 'bold', 
             textTransform: 'capitalize',
             gap: '4px',
             padding: '4px 8px',
             transition: 'background 2s ease'
           }}
        >
           {venueMood === 'euphoric' && '🎉'}
           {venueMood === 'anxious' && '⚠️'}
           {venueMood === 'frustrated' && '😤'}
           {venueMood === 'relaxed' && '🍹'}
           {venueMood === 'excited' && '🔥'}
           {" "}{venueMood}
        </motion.div>
      )}

      {/* Center: Phase indicator */}
      <motion.div
        className={styles.phase}
        animate={{ borderColor: [phase.color + '40', phase.color + 'aa', phase.color + '40'] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ color: phase.color }}
      >
        <span className={styles.phaseDot} style={{ background: phase.color }} />
        {phase.label}
      </motion.div>

      {/* Right: connection + alerts + avatar */}
      <div className={styles.right}>
        {/* WebSocket connection indicator */}
        {isConnected
          ? <Wifi size={14} style={{ color: 'var(--color-success)' }} />
          : <WifiOff size={14} style={{ color: 'var(--color-text-faint)' }} />
        }

        {/* Accessibility Menu */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setA11yOpen(!a11yOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
            <Eye size={18} />
          </div>
          <AnimatePresence>
            {a11yOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '150%',
                  right: 0,
                  width: '200px',
                  padding: 'var(--space-3)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)'
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Accessibility</div>
                <button 
                  onClick={a11y.toggleHighContrast}
                  style={{ textAlign: 'left', fontSize: '12px', padding: '6px', borderRadius: '4px', background: a11y.highContrast ? 'var(--color-accent-glow)' : 'transparent', color: a11y.highContrast ? 'var(--color-accent)' : '#fff' }}
                >
                  High Contrast
                </button>
                <button 
                  onClick={a11y.toggleDyslexicFont}
                  style={{ textAlign: 'left', fontSize: '12px', padding: '6px', borderRadius: '4px', background: a11y.dyslexicFont ? 'var(--color-accent-glow)' : 'transparent', color: a11y.dyslexicFont ? 'var(--color-accent)' : '#fff' }}
                >
                  Dyslexia Font
                </button>
                <button 
                  onClick={a11y.toggleReducedMotion}
                  style={{ textAlign: 'left', fontSize: '12px', padding: '6px', borderRadius: '4px', background: a11y.reducedMotion ? 'var(--color-accent-glow)' : 'transparent', color: a11y.reducedMotion ? 'var(--color-accent)' : '#fff' }}
                >
                  Reduced Motion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification bell */}
        <div className={styles.bellWrap} onClick={() => setIsPanelOpen(true)} style={{ cursor: 'pointer' }}>
          <Bell size={18} />
          {totalCount > 0 && (
            <motion.span
              className={styles.badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={totalCount}
            >
              {totalCount > 9 ? '9+' : totalCount}
            </motion.span>
          )}
        </div>

        {/* User avatar */}
        <div className={styles.avatar} style={{ borderColor: tierColor }}>
          {initials}
        </div>
      </div>
      
      {/* Slide Out Panel limits mapping overlay bounds natively */}
      <NotificationCenter isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </header>
  );
}
