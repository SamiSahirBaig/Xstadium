import { motion } from 'framer-motion';

export default function MoodBadge({ mood, moodEmoji }) {
  if (!mood || mood === 'neutral') return null;

  return (
    <motion.div 
      className="badge" 
      style={{
         background: 'rgba(255,255,255,0.06)',
         border: '1px solid var(--color-border)',
         gap: '6px',
         padding: '4px 10px',
         color: 'var(--color-text)',
      }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
    >
      <span style={{ fontSize: '14px' }}>{moodEmoji}</span>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{mood}</span>
    </motion.div>
  );
}
