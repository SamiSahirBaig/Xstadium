import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ShieldAlert, Check, AlertTriangle, Info, Clock } from 'lucide-react';
import { useZoneStore } from '../store/zoneStore.js';

export default function AlertsPage() {
  const { alerts, setAlerts } = useZoneStore();

  const handleMarkAllRead = () => {
    // Map existing alerts locally asserting 'resolved' flag bypassing strict db hooks instantly cleanly simulating UX.
    const resolvedAlerts = alerts.map(a => ({ ...a, resolved: true }));
    setAlerts(resolvedAlerts);
  };

  // Ensure active alerts are sorted latest-first organically.
  const activeAlerts = [...alerts]
    .filter(a => !a.resolved)
    .sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()));

  // Render icons recursively mapping severity levels
  const getSeverityIcon = (level) => {
    switch(level) {
      case 'CRITICAL': return <ShieldAlert size={20} color="var(--color-critical)" />;
      case 'WARNING': return <AlertTriangle size={20} color="var(--color-warning)" />;
      default: return <Info size={20} color="var(--color-primary)" />;
    }
  };

  // Extrapolate Framer-Motion conditional logic bounds
  const getAlertStyle = (level) => {
    const baseStyle = {
      background: 'var(--color-surface-2)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    };

    if (level === 'CRITICAL') {
      return {
         ...baseStyle,
         border: '1.5px solid var(--color-critical)',
         background: 'rgba(239, 68, 68, 0.05)'
      };
    }
    
    if (level === 'WARNING') {
       return {
         ...baseStyle,
         borderLeft: '4px solid var(--color-warning)'
       };
    }
    
    return baseStyle; // INFO bounds defaults natively
  };

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="container" style={{ paddingBottom: 'var(--space-6)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={24} className="text-accent" /> Live Alerts 
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>Real-time stadium feeds</p>
            </div>
            
            {activeAlerts.length > 0 && (
               <button 
                 onClick={handleMarkAllRead} 
                 className="icon-btn" 
                 style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--color-surface-2)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 'bold' }}
               >
                 <Check size={16} /> Mark All Read
               </button>
            )}
         </div>

         {activeAlerts.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 'var(--space-4)', textAlign: 'center', opacity: 0.6 }}
            >
               <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} style={{ background: 'var(--color-surface-2)', padding: '24px', borderRadius: '50%' }}>
                  <ShieldAlert size={48} color="var(--color-success)" />
               </motion.div>
               <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>No active alerts.</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Enjoy the event! Everything is running perfectly smoothly.</p>
               </div>
            </motion.div>
         ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AnimatePresence>
                {activeAlerts.map((alert) => (
                   <motion.div
                      key={alert.id || Math.random().toString()}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.01 }}
                      layout
                      style={getAlertStyle(alert.severity)}
                   >
                     <div style={{ flexShrink: 0 }}>
                       {alert.severity === 'CRITICAL' ? (
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                            {getSeverityIcon(alert.severity)}
                          </motion.div>
                       ) : (
                          getSeverityIcon(alert.severity)
                       )}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                         <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{alert.title || 'System Notification'}</h4>
                         <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <Clock size={12} />
                           {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                         </span>
                       </div>
                       <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                         {alert.message}
                       </p>
                       {alert.zoneId && (
                         <div style={{ marginTop: '8px', display: 'inline-block', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-accent)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                           ZONE: {alert.zoneId}
                         </div>
                       )}
                     </div>
                   </motion.div>
                ))}
              </AnimatePresence>
            </div>
         )}
      </div>
    </motion.div>
  );
}
