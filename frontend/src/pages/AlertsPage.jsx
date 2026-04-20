import { motion } from 'framer-motion';
import { Bell, ShieldAlert } from 'lucide-react';

export default function AlertsPage() {
  return (
    <motion.div
      className="page container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', textAlign: 'center' }}>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 80, height: 80, borderRadius: '24px',
            background: 'rgba(239,68,68,0.15)',
            border: '1.5px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(239,68,68,0.2)',
          }}
        >
          <Bell size={38} color="#ef4444" />
        </motion.div>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            Live Alerts
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Real-time crowd alerts coming in Issue #28
          </p>
        </div>
        <div className="badge badge-success"><ShieldAlert size={11} /> All Clear</div>
      </div>
    </motion.div>
  );
}
