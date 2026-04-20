import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, ShieldAlert, Award, Clock, Info } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { useUserStore } from '../../store/userStore.js';

const getIcon = (type) => {
  switch (type) {
    case 'SURGE': return <ShieldAlert size={18} color="var(--color-critical)" />;
    case 'MILESTONE': return <Award size={18} color="var(--color-gold)" />;
    default: return <Info size={18} color="var(--color-primary)" />;
  }
};

export default function NotificationCenter({ isOpen, onClose }) {
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user || !user.uid) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(docs);
      
      // Update global unread metrics inside window seamlessly
      const unreadCount = docs.filter(d => !d.read).length;
      if (window) {
         window.__globalUnreadFCMCount = unreadCount;
         window.dispatchEvent(new Event('unread_count_updated'));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (docId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', docId), { read: true });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const clearAll = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
           const ref = doc(db, 'users', user.uid, 'notifications', n.id);
           batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed clearing notifications:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop limits mapping clicks seamlessly outside */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              zIndex: 9998
            }}
          />

          {/* Dynamic Panel Physics Slider */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: '400px',
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', zIndex: 9999,
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header hooks */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} /> Notifications
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={clearAll} className="icon-btn" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-surface-2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCheck size={14} /> Clear
                </button>
                <button onClick={onClose} className="icon-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* List Array Limits */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 'var(--space-8)' }}>
                  <Bell size={40} style={{ marginBottom: 'var(--space-2)' }} />
                  <p>You&apos;re all caught up!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map(n => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: n.read ? 0.6 : 1, y: 0 }}
                      style={{
                         background: n.read ? 'var(--color-bg)' : 'var(--color-surface-2)',
                         padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                         borderLeft: n.read ? 'none' : '3px solid var(--color-primary)',
                         cursor: 'pointer'
                      }}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: n.read ? 'normal' : 'bold' }}>{n.title}</h4>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>{n.body}</p>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-faint)', marginTop: '8px' }}>
                            <Clock size={10} /> {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
