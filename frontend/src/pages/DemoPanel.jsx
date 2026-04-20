import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function DemoPanel() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100dvh',
        background: '#000',
        padding: 'var(--space-6)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <Terminal size={24} color="#00ff88" />
        <h1 style={{ color: '#00ff88', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)' }}>
          XSTADIUM // DEMO CONTROL
        </h1>
      </div>
      <p style={{ color: '#00ff8880', fontSize: 'var(--text-sm)' }}>
        █ Demo control panel — full implementation in Issue #33
      </p>
      <p style={{ color: '#00ff8860', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>
        &gt; Phase selector, pressure override, VIP toggle, crowd rush — all coming soon
      </p>
    </motion.div>
  );
}
