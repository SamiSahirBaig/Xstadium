import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        gap: '1rem',
      }}
    >
      {/* Spinning logo ring */}
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--color-accent)',
            borderRightColor: 'var(--color-accent-2)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 8,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--color-accent-2)',
            animation: 'spin 1.2s linear infinite reverse',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 20,
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
          }}
        />
      </div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Xstadium
      </motion.p>
    </motion.div>
  );
}
