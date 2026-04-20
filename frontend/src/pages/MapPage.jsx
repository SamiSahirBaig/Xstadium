import { motion } from 'framer-motion';
import { MapPin, Layers } from 'lucide-react';

export default function MapPage() {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'relative' }}
    >
      {/* Placeholder — replaced by CrowdHeatmap in Issue #11 */}
      <div
        style={{
          height: 'calc(100dvh - var(--navbar-height) - var(--bottom-nav-height))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          background: 'var(--color-surface)',
          margin: 0,
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <MapPin size={56} color="var(--color-accent)" />
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            Live Crowd Map
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Google Maps heatmap coming in Issue #11
          </p>
        </div>
        <div className="badge badge-accent" style={{ gap: 'var(--space-2)' }}>
          <Layers size={12} /> 12 Zones Tracked
        </div>
      </div>
    </motion.div>
  );
}
