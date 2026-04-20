import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import BottomNav from './BottomNav.jsx';
import { useZoneStore } from '../../store/zoneStore.js';
import { useAccessibilityStore } from '../../store/accessibilityStore.js';

const MOOD_COLORS = {
  euphoric: '#f59e0b',
  anxious: '#ef4444',
  frustrated: '#f97316',
  relaxed: '#10b981',
  excited: '#8b5cf6'
};

/**
 * AppShell — Persistent layout wrapper for all authenticated pages.
 * Renders: top Navbar + page content (via <Outlet>) + bottom BottomNav.
 */
export default function AppShell() {
  const { setVenueMood } = useZoneStore();
  const { highContrast, dyslexicFont, reducedMotion } = useAccessibilityStore();

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
    document.documentElement.classList.toggle('a11y-dyslexic', dyslexicFont);
    document.documentElement.classList.toggle('a11y-reduced-motion', reducedMotion);
  }, [highContrast, dyslexicFont, reducedMotion]);

  useEffect(() => {
    const fetchMood = async () => {
      try {
        const res = await fetch('/api/venue/mood');
        const data = await res.json();
        if (data.dominantMood) {
          setVenueMood(data.dominantMood);
          const root = document.documentElement;
          root.style.setProperty('--color-accent', MOOD_COLORS[data.dominantMood] || '#3b82f6');
        }
      } catch (err) {
        console.error('Mood poll failed', err);
      }
    };
    
    fetchMood();
    const interval = setInterval(fetchMood, 30000);
    return () => clearInterval(interval);
  }, [setVenueMood]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
