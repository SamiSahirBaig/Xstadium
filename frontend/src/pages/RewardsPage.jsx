import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Compass, Footprints, MessageSquare, FastForward, Navigation, Unlock, Clock, History } from 'lucide-react';
import { useUserStore } from '../store/userStore.js';

const BADGE_DEFINITIONS = [
  { id: 'EARLY_BIRD', icon: Clock, label: 'Early Bird', desc: 'First check-in' },
  { id: 'EXPLORER', icon: Footprints, label: 'Explorer', desc: 'Visited 5 zones' },
  { id: 'VIP_INITIATE', icon: Star, label: 'Initiate', desc: 'Reached 200 points' },
  { id: 'CROWD_NAVIGATOR', icon: Compass, label: 'Navigator', desc: 'Routed 3x' },
  { id: 'SECRET_SEEKER', icon: Unlock, label: 'Seeker', desc: 'Used secret route' },
  { id: 'HALF_TIME_HERO', icon: FastForward, label: 'Hero', desc: 'Half-time play' },
  { id: 'AI_WHISPERER', icon: MessageSquare, label: 'Whisperer', desc: '10 AI chats' },
  { id: 'LEGEND', icon: Navigation, label: 'Legend', desc: 'VIP tier unlocked' }
];

export default function RewardsPage() {
  const { profile } = useUserStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive points securely bounding standard limits
  const points = profile?.points || 0;
  let nextTier = 'GOLD';
  let nextThreshold = 500;
  
  if (points >= 2000) { nextTier = 'MAXED'; nextThreshold = points; }
  else if (points >= 500) { nextTier = 'DIAMOND'; nextThreshold = 2000; }

  const progressPercent = nextTier === 'MAXED' ? 100 : Math.min(100, Math.round((points / nextThreshold) * 100));

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${baseUrl}/api/users/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.slice(0, 10)); // Top 10 limit from backlog requirement
        }
      } catch (err) {
        console.error('Leaderboard Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const unlockedBadges = profile?.badges || [];

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="container" style={{ paddingBottom: 'var(--space-6)' }}>
        
        {/* Tier & Points Hero Card */}
        <div style={{ background: 'var(--color-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ width: 70, height: 70, margin: '0 auto var(--space-3)', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={32} color="#fff" />
          </motion.div>
          <h2 style={{ fontSize: '32px', margin: 0 }}>{points}</h2>
          <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{profile?.tier || 'STANDARD'} MEMBER</span>
          
          <div style={{ marginTop: 'var(--space-4)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span className="text-muted">Next: {nextTier}</span>
              <span className="text-muted">{points} / {nextThreshold}</span>
            </div>
            <div style={{ height: 8, background: 'var(--color-surface)', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Achievement Badges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: 'var(--space-5)' }}>
          {BADGE_DEFINITIONS.map((b) => {
            const isUnlocked = unlockedBadges.includes(b.id);
            const Icon = b.icon;
            return (
              <motion.div key={b.id} whileTap={{ scale: 0.95 }} style={{ 
                aspectRatio: '1/1', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center', padding: '8px',
                border: isUnlocked ? '1.5px solid var(--color-gold)' : '1.5px solid transparent',
                filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.5)'
              }}>
                <Icon size={24} color={isUnlocked ? "var(--color-gold)" : "var(--color-text-muted)"} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: 1.1 }}>{b.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <h3 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} className="text-muted" /> Recent Activity
        </h3>
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Mock Feed matching issue placeholder specs */}
          <div className="flex gap-2 text-sm justify-between items-center text-muted">
            <span>🏟️ Check-in at GATE_B</span> <span className="font-bold text-accent">+10 pts</span>
          </div>
          <div className="flex gap-2 text-sm justify-between items-center text-muted">
            <span>✨ Used AI Avoidance Route</span> <span className="font-bold text-accent">+50 pts</span>
          </div>
        </div>

        {/* Leaderboard Array */}
        <h3 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Medal size={20} color="var(--color-accent)" /> Top 10 Fans
        </h3>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>Loading telemetry...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaderboard.map((usr, index) => {
              const isCurrentUser = profile && profile.uid === usr.uid;
              return (
                <motion.div key={usr.uid || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '16px',
                    background: isCurrentUser ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-surface-2)',
                    border: isCurrentUser ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    borderRadius: 'var(--radius-md)'
                }}>
                  <span style={{ fontWeight: 'bold', minWidth: '24px', color: index < 3 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>#{index + 1}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{usr.displayName || 'Anonymous Fan'}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{usr.tier}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    <span>{usr.points}</span> <Star size={14} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
