import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { initWebSocket, disconnectWebSocket } from './services/websocketClient.js';
import AppShell from './components/layout/AppShell.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import OfflineIndicator from './components/ui/OfflineIndicator.jsx';
import { useUserStore } from './store/userStore.js';
import { onAuthChange } from './config/firebase.js';
import { initNotifications } from './services/notificationClient.js';
import PresentationRunner from './components/ui/PresentationRunner.jsx';
import TourGuide from './components/ui/TourGuide.jsx';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
const OnboardingPage = lazy(() => import('./pages/OnboardingPage.jsx'));
const MapPage        = lazy(() => import('./pages/MapPage.jsx'));
const AssistantPage  = lazy(() => import('./pages/AssistantPage.jsx'));
const RewardsPage    = lazy(() => import('./pages/RewardsPage.jsx'));
const AlertsPage     = lazy(() => import('./pages/AlertsPage.jsx'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage.jsx'));
const DemoPanel      = lazy(() => import('./pages/DemoPanel.jsx'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard.jsx'));

// ─── Protected Route ──────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, isLoading } = useUserStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

// ─── Animated Routes ──────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Onboarding (first visit, no shell) ── */}
        <Route path="/" element={<OnboardingPage />} />

        {/* ── Main App (with persistent shell) ── */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/map"       element={<MapPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/rewards"   element={<RewardsPage />} />
          <Route path="/alerts"    element={<AlertsPage />} />
          <Route path="/profile"   element={<ProfilePage />} />
        </Route>

        {/* ── Demo / Special Routes (no auth required) ── */}
        <Route path="/demo"       element={<DemoPanel />} />
        <Route path="/analytics"  element={<AnalyticsDashboard />} />
        <Route path="/demo-entry" element={<OnboardingPage demoMode />} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { setUser, setLoading } = useUserStore();

  // Subscribe to Firebase auth state and WebSocket stream on mount
  useEffect(() => {
    initWebSocket();
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        initNotifications(firebaseUser.uid);
      }
    });
    return () => {
      unsubscribe();
      disconnectWebSocket();
    };
  }, [setUser, setLoading]);

  return (
    <BrowserRouter>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
        <PresentationRunner />
        <TourGuide />
      </Suspense>
    </BrowserRouter>
  );
}
