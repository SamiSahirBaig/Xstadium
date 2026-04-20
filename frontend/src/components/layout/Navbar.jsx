import { Bell, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useZoneStore } from '../../store/zoneStore.js';
import { useUserStore } from '../../store/userStore.js';
import styles from './Navbar.module.css';

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
  const { isConnected, eventPhase, getActiveAlertsCount } = useZoneStore();
  const { profile } = useUserStore();
  const alertCount = getActiveAlertsCount();
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

        {/* Notification bell */}
        <div className={styles.bellWrap}>
          <Bell size={18} />
          {alertCount > 0 && (
            <motion.span
              className={styles.badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={alertCount}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </motion.span>
          )}
        </div>

        {/* User avatar */}
        <div className={styles.avatar} style={{ borderColor: tierColor }}>
          {initials}
        </div>
      </div>
    </header>
  );
}
