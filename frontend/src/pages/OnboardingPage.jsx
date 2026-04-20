import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, MapPin } from 'lucide-react';
import { signInAnon, signInWithGoogle } from '../config/firebase.js';

export default function OnboardingPage({ demoMode = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hasOnboarded = localStorage.getItem('xstadium_onboarded');

  const location = useLocation();

  // Skip onboarding if already authenticated or completed
  useEffect(() => {
    if (hasOnboarded && !demoMode) {
      navigate(location.search ? `/map${location.search}` : '/map', { replace: true });
    }
  }, [hasOnboarded, demoMode, navigate, location.search]);

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAnon();
      localStorage.setItem('xstadium_onboarded', 'true');
      const searchParams = new URLSearchParams(location.search);
      const isDemo = searchParams.get('token') === 'DEMO2026';
      navigate(isDemo ? `/map?token=DEMO2026` : '/map', { replace: true });
    } catch (err) {
      console.error('Anonymous sign-in failed:', err);
      if (demoMode) {
         localStorage.setItem('xstadium_onboarded', 'true');
         navigate('/map', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      localStorage.setItem('xstadium_onboarded', 'true');
      navigate('/map', { replace: true });
    } catch (err) {
      console.error('Google sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

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
      {/* 
        Issue 30: Full Screen Background (Stylized Map / Dark Glow) 
      */}
      <motion.div
        animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(15deg)', 'hue-rotate(0deg)'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% -20%, rgba(56, 189, 248, 0.15) 0%, transparent 60%), radial-gradient(circle at 50% 120%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0
        }}
      />

      {/* Grid Pattern Layout Native Overlay */}
      <div style={{
         position: 'absolute', inset: 0,
         backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
         backgroundSize: '30px 30px',
         pointerEvents: 'none', zIndex: 0
      }} />

      {/* Main Container Hero Constraints */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', position: 'relative', zIndex: 10 }}>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)'
          }}
        >
           {/* Animated Logo Glow Elements */}
           <motion.div
             animate={{ boxShadow: ['0 0 20px rgba(56,189,248,0.2)', '0 0 60px rgba(56,189,248,0.6)', '0 0 20px rgba(56,189,248,0.2)'] }}
             transition={{ duration: 3, repeat: Infinity }}
             style={{
                width: 80, height: 80, borderRadius: '24px', background: 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(56, 189, 248, 0.3)'
             }}
           >
             <MapPin size={40} color="var(--color-primary)" />
           </motion.div>

           <div style={{ textAlign: 'center' }}>
             <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>
               ArenaIQ <span style={{ color: 'var(--color-primary)' }}>X</span>
             </h1>
             <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '8px' }}>
               The Sentient Stadium OS
             </p>
           </div>
        </motion.div>
      </div>

      {/* Login Interaction Anchors */}
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
         style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative', zIndex: 10, background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)' }}
      >
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', background: '#fff', color: '#000', padding: '16px', borderRadius: 'var(--radius-lg)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
            fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
           <LogIn size={20} />
           {loading ? 'Authenticating...' : 'Sign In with Google'}
        </button>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          style={{
            width: '100%', background: 'var(--color-surface-2)', color: 'var(--color-text)', padding: '16px', borderRadius: 'var(--radius-lg)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
            fontSize: '16px', fontWeight: 'bold', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s'
          }}
        >
           <User size={20} />
           Enter as Guest
        </button>
        
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '8px' }}>
           By continuing, you accept the Hackathon Event terms of service strictly formatting analytics.
        </p>
      </motion.div>
    </div>
  );
}
