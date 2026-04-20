import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, MessageSquare, Trophy, Bell, User } from 'lucide-react';
import { useZoneStore } from '../../store/zoneStore.js';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { to: '/map',       icon: Map,            label: 'Map',     id: 'tour-heatmap' },
  { to: '/assistant', icon: MessageSquare,  label: 'AI',      id: 'tour-assistant' },
  { to: '/rewards',   icon: Trophy,         label: 'Rewards', id: 'tour-rewards' },
  { to: '/alerts',    icon: Bell,           label: 'Alerts',  showBadge: true, id: 'tour-route' }, // Linking route logic here as overlay falls into map
  { to: '/profile',   icon: User,           label: 'Profile' },
];

export default function BottomNav() {
  const { getActiveAlertsCount } = useZoneStore();
  const alertCount = getActiveAlertsCount();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(({ to, icon: Icon, label, showBadge, id }) => (
        <NavLink
          key={to}
          to={to}
          id={id}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <div className={styles.iconWrap}>
                <Icon size={22} />
                {showBadge && alertCount > 0 && (
                  <motion.span
                    className={styles.badge}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {alertCount > 9 ? '9+' : alertCount}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    className={styles.activeGlow}
                    layoutId="bottomNavGlow"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span className={styles.label}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
