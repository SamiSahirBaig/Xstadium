import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import BottomNav from './BottomNav.jsx';

/**
 * AppShell — Persistent layout wrapper for all authenticated pages.
 * Renders: top Navbar + page content (via <Outlet>) + bottom BottomNav.
 */
export default function AppShell() {
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
