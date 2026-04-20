import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100dvh', background: 'var(--color-bg)', padding: 'var(--space-6)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <BarChart3 size={24} color="var(--color-accent)" />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>Analytics</h1>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        BigQuery-powered analytics dashboard — coming in Issue #35
      </p>
    </motion.div>
  );
}
