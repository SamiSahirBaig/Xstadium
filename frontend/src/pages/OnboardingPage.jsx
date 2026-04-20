import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Navigation, Bot, ChevronRight, ArrowRight } from 'lucide-react';
import { signInAnon } from '../config/firebase.js';

const SLIDES = [
  {
    icon: Zap,
    iconColor: '#f59e0b',
    title: 'Welcome to Xstadium',
    subtitle: 'The Sentient Stadium OS',
    body: 'Your AI-powered companion for the ultimate stadium experience. Real-time crowd intelligence at your fingertips.',
    bg: 'radial-gradient(ellipse at top, rgba(59,130,246,0.15) 0%, transparent 70%)',
  },
  {
    icon: Navigation,
    iconColor: '#10b981',
    title: 'Never Get Lost',
    subtitle: 'or Stuck in a Crowd',
    body: 'Live heatmaps show crowd density across every zone. Smart routing finds you the fastest, least crowded path.',
    bg: 'radial-gradient(ellipse at top, rgba(16,185,129,0.15) 0%, transparent 70%)',
  },
  {
    icon: Bot,
    iconColor: '#8b5cf6',
    title: 'Your AI Guide',
    subtitle: 'Powered by Gemini',
    body: "Just ask: \"Where's the nearest quiet food court?\" Your AI knows the stadium better than anyone.",
    bg: 'radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 70%)',
  },
];

const pageVariants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
};

export default function OnboardingPage({ demoMode = false }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasOnboarded = localStorage.getItem('xstadium_onboarded');

  // Skip onboarding if already done
  useEffect(() => {
    if (hasOnboarded && !demoMode) {
      navigate('/map', { replace: true });
    }
  }, [hasOnboarded, demoMode, navigate]);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await signInAnon();
      localStorage.setItem('xstadium_onboarded', 'true');
      navigate('/map', { replace: true });
    } catch (err) {
      console.error('Anonymous sign-in failed:', err);
      // Still proceed in demo environments
      localStorage.setItem('xstadium_onboarded', 'true');
      navigate('/map', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('xstadium_onboarded', 'true');
    handleGetStarted();
  };

  const current = SLIDES[step];
  const Icon = current.icon;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <motion.div
        key={step}
        style={{
          position: 'absolute', inset: 0,
          background: current.bg,
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      {/* Floating orbs */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], x: [0, i % 2 === 0 ? 10 : -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
          style={{
            position: 'absolute',
            width: 80 + i * 30,
            height: 80 + i * 30,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${current.iconColor}20 0%, transparent 70%)`,
            top: `${10 + i * 20}%`,
            left: i % 2 === 0 ? `${5 + i * 5}%` : undefined,
            right: i % 2 !== 0 ? `${5 + i * 5}%` : undefined,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-5)' }}>
        {step < SLIDES.length - 1 && (
          <button onClick={handleSkip} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.35 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}
          >
            {/* Icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                width: 96, height: 96,
                borderRadius: '28px',
                background: `${current.iconColor}18`,
                border: `1.5px solid ${current.iconColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${current.iconColor}30`,
              }}
            >
              <Icon size={42} color={current.iconColor} />
            </motion.div>

            {/* Text */}
            <div style={{ textAlign: 'center', maxWidth: 320 }}>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-extrabold)', lineHeight: 1.2, marginBottom: 'var(--space-2)' }}>
                {current.title}
              </h1>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {current.subtitle}
              </p>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                {current.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8, background: i === step ? 'var(--color-accent)' : 'var(--color-surface-3)' }}
              transition={{ duration: 0.3 }}
              style={{ height: 8, borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* CTA button */}
        {step < SLIDES.length - 1 ? (
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={() => setStep((s) => s + 1)}
            style={{ justifyContent: 'center', gap: 'var(--space-2)' }}
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleGetStarted}
            disabled={loading}
            style={{ justifyContent: 'center', gap: 'var(--space-2)' }}
          >
            {loading ? 'Loading...' : <>Get Started <ArrowRight size={18} /></>}
          </button>
        )}
      </div>
    </div>
  );
}
