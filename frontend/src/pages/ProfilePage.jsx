import { motion } from 'framer-motion';
import { User, Crown } from 'lucide-react';
import { useUserStore } from '../store/userStore.js';

export default function ProfilePage() {
  const { profile } = useUserStore();
  return (
    <motion.div
      className="page container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--gradient-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)',
          boxShadow: 'var(--shadow-accent)',
        }}>
          {(profile?.displayName || 'XS').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            {profile?.displayName || 'Stadium Fan'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Profile & settings coming in Issue #29
          </p>
        </div>
        <div className="badge badge-accent">
          <Crown size={11} /> {profile?.tier || 'STANDARD'}
        </div>
      </div>
    </motion.div>
  );
}
