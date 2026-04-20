import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Crown, Bell, Settings, Shield, ChevronRight } from 'lucide-react';
import { useUserStore } from '../store/userStore.js';
import { auth } from '../config/firebase.js';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  const { profile, clearUser, updatePreferences } = useUserStore();
  
  // Local states binding gracefully onto preference matrices
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.preferences?.notifications ?? true);
  const [highContrast, setHighContrast] = useState(profile?.preferences?.highContrast ?? false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    updatePreferences({ notifications: next });
  };

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    updatePreferences({ highContrast: next });
    
    // Physical DOM injection matching High Contrast metrics
    if (next) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const handleSignOut = async () => {
     try {
       setIsLoggingOut(true);
       await signOut(auth);
       clearUser();
     } catch (err) {
       console.error("Logout failed:", err);
       setIsLoggingOut(false);
     }
  };

  // Build standard initials logic mapping UX natively
  const initials = (profile?.displayName || 'Fan').slice(0, 2).toUpperCase();
  const tier = profile?.tier || 'STANDARD';
  const isVIP = ['VIP', 'DIAMOND', 'GOLD'].includes(tier);

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="container" style={{ paddingBottom: 'var(--space-6)' }}>
        
        {/* Profile Hero Header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          background: 'var(--color-surface-2)', padding: 'var(--space-5)', 
          borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Subtle Glow Backgrounds mapped for VIP loops */}
          {isVIP && (
             <motion.div 
               animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(60deg)', 'hue-rotate(0deg)'] }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15), transparent 60%)', pointerEvents: 'none' }}
             />
          )}

          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: isVIP ? 'linear-gradient(135deg, var(--color-gold), #fcd34d)' : 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 'bold', color: isVIP ? '#000' : '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            marginBottom: 'var(--space-3)', position: 'relative', zIndex: 2
          }}>
            {initials}
          </div>
          
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', position: 'relative', zIndex: 2 }}>
            {profile?.displayName || 'Stadium Fan'}
          </h1>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <span className={`badge ${isVIP ? 'badge-warning text-black font-bold' : 'bg-surface'}`} style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 10px' }}>
               <Crown size={14} color={isVIP ? '#000' : 'var(--color-text-muted)'} /> 
               {tier}
            </span>
          </div>
        </div>

        {/* Global Configuration Toggles */}
        <h3 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
           <Settings size={18} className="text-muted" /> Application Settings
        </h3>
        
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
           
           {/* Notification Toggle Loop */}
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Bell size={18} color="var(--color-primary)" />
               </div>
               <span style={{ fontWeight: '500', fontSize: '15px' }}>Push Notifications</span>
             </div>
             
             <button onClick={toggleNotifications} style={{ width: 50, height: 28, background: notificationsEnabled ? 'var(--color-success)' : 'var(--color-surface)', borderRadius: '14px', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>
                <motion.div 
                   animate={{ x: notificationsEnabled ? 22 : 2 }}
                   transition={{ type: "spring", stiffness: 500, damping: 30 }}
                   style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
             </button>
           </div>

           {/* High Contrast Toggle Loop */}
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Shield size={18} color="var(--color-warning)" />
               </div>
               <span style={{ fontWeight: '500', fontSize: '15px' }}>High Contrast Mode</span>
             </div>
             
             <button onClick={toggleContrast} style={{ width: 50, height: 28, background: highContrast ? 'var(--color-success)' : 'var(--color-surface)', borderRadius: '14px', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>
                <motion.div 
                   animate={{ x: highContrast ? 22 : 2 }}
                   transition={{ type: "spring", stiffness: 500, damping: 30 }}
                   style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
             </button>
           </div>
        </div>

        {/* Security Triggers */}
        <h3 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
           Account Security
        </h3>
        
        <button 
           onClick={handleSignOut}
           disabled={isLoggingOut}
           style={{
              width: '100%', background: 'var(--color-surface-2)', padding: '16px', borderRadius: 'var(--radius-lg)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              color: 'var(--color-critical)', border: 'none', cursor: 'pointer', fontWeight: 'bold'
           }}
        >
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <LogOut size={18} />
             <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
           </div>
           <ChevronRight size={18} color="var(--color-text-muted)" />
        </button>

      </div>
    </motion.div>
  );
}
