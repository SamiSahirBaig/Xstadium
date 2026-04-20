import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

export default function AssistantPage() {
  return (
    <motion.div
      className="page container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-5)', textAlign: 'center' }}>
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            width: 80, height: 80, borderRadius: '24px',
            background: 'rgba(139,92,246,0.15)',
            border: '1.5px solid rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(139,92,246,0.25)',
          }}
        >
          <Bot size={38} color="#8b5cf6" />
        </motion.div>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            AI Assistant
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Gemini-powered chat coming in Issue #27
          </p>
        </div>
        <div className="badge badge-vip"><Sparkles size={11} /> Gemini 1.5 Flash</div>
      </div>
    </motion.div>
  );
}
