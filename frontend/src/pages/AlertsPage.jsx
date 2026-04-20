import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ShieldAlert, Check, AlertTriangle, Info, Clock, Camera, Upload, Loader2, X, Zap, Shield, MapPin, AlertOctagon } from 'lucide-react';
import { useZoneStore } from '../store/zoneStore.js';
import { useUserStore } from '../store/userStore.js';

export default function AlertsPage() {
  const { alerts, setAlerts } = useZoneStore();
  const { user } = useUserStore();

  // ── Vision AI State ──────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [visionPreview, setVisionPreview] = useState(null);   // base64 preview
  const [visionFile, setVisionFile] = useState(null);         // File object
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState(null);     // API response
  const [visionError, setVisionError] = useState('');

  const DENSITY_CONFIG = {
    low:      { color: '#10b981', label: 'Low',      icon: Shield },
    medium:   { color: '#f59e0b', label: 'Medium',   icon: AlertTriangle },
    high:     { color: '#f97316', label: 'High',     icon: AlertOctagon },
    critical: { color: '#ef4444', label: 'Critical', icon: ShieldAlert },
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVisionFile(file);
    setVisionResult(null);
    setVisionError('');
    const reader = new FileReader();
    reader.onload = (ev) => setVisionPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!visionFile || !user) return;
    setVisionLoading(true);
    setVisionError('');
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append('photo', visionFile);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/ai/analyze-crowd-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setVisionResult(data);
    } catch (err) {
      setVisionError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setVisionLoading(false);
    }
  };

  const clearVision = () => {
    setVisionFile(null);
    setVisionPreview(null);
    setVisionResult(null);
    setVisionError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

         {/* ─── Vision AI Panel ──────────────────────────────────────── */}
         <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           style={{
             background: 'var(--color-surface-2)',
             border: '1px solid rgba(139, 92, 246, 0.3)',
             borderRadius: 'var(--radius-lg)',
             padding: 'var(--space-4)',
             marginBottom: 'var(--space-5)',
           }}
         >
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-3)' }}>
             <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '8px', borderRadius: '8px' }}>
               <Camera size={20} color="#8b5cf6" />
             </div>
             <div>
               <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>📸 Gemini Vision — Crowd Analysis</h3>
               <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>Submit a photo for real-time AI crowd density & hazard detection</p>
             </div>
           </div>

           {/* Hidden file input — accepts camera on mobile */}
           <input
             ref={fileInputRef}
             type="file"
             accept="image/jpeg,image/png,image/webp"
             capture="environment"
             onChange={handleFileSelect}
             style={{ display: 'none' }}
             id="vision-file-input"
           />

           {!visionPreview ? (
             <div
               onClick={() => fileInputRef.current?.click()}
               style={{
                 border: '2px dashed rgba(139, 92, 246, 0.4)',
                 borderRadius: 'var(--radius-md)',
                 padding: 'var(--space-6)',
                 textAlign: 'center',
                 cursor: 'pointer',
                 transition: 'all 0.2s',
               }}
             >
               <Upload size={32} color="#8b5cf6" style={{ margin: '0 auto 12px' }} />
               <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Tap to upload a photo</p>
               <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Opens camera on mobile · JPG / PNG · Max 10 MB</p>
             </div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
               {/* Preview + clear */}
               <div style={{ position: 'relative' }}>
                 <img
                   src={visionPreview}
                   alt="Crowd preview"
                   style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                 />
                 <button
                   onClick={clearVision}
                   style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}
                 >
                   <X size={16} color="#fff" />
                 </button>
               </div>

               {/* Analyze button */}
               {!visionResult && (
                 <button
                   onClick={handleAnalyze}
                   disabled={visionLoading}
                   style={{
                     background: visionLoading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                     color: '#fff', border: 'none', borderRadius: 'var(--radius-full)',
                     padding: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                   }}
                 >
                   {visionLoading
                     ? <><Loader2 size={16} className="animate-spin" /> Analyzing with Gemini Vision...</>
                     : <><Zap size={16} /> Analyze Crowd Photo</>
                   }
                 </button>
               )}

               {/* Error */}
               {visionError && (
                 <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>⚠ {visionError}</p>
               )}

               {/* Result Card */}
               <AnimatePresence>
                 {visionResult && (() => {
                   const cfg = DENSITY_CONFIG[visionResult.density] || DENSITY_CONFIG.medium;
                   const DensityIcon = cfg.icon;
                   return (
                     <motion.div
                       key="result"
                       initial={{ opacity: 0, y: 10, scale: 0.97 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0 }}
                       style={{
                         background: `rgba(${visionResult.density === 'critical' ? '239,68,68' : '13,21,38'}, 0.1)`,
                         border: `1.5px solid ${cfg.color}`,
                         borderRadius: 'var(--radius-md)',
                         padding: 'var(--space-4)',
                         display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                       }}
                     >
                       {/* Density badge */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <DensityIcon size={22} color={cfg.color} />
                         <div>
                           <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Crowd Density</div>
                           <div style={{ fontSize: '20px', fontWeight: 'bold', color: cfg.color }}>{cfg.label}</div>
                         </div>
                         <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                           {Math.round((visionResult.confidence || 0) * 100)}% confidence
                         </div>
                       </div>

                       {/* Estimated area */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                         <MapPin size={14} color="var(--color-text-muted)" />
                         <span style={{ color: 'var(--color-text-muted)' }}>Detected area:</span>
                         <span style={{ fontWeight: 'bold' }}>{visionResult.estimatedArea}</span>
                       </div>

                       {/* Hazards */}
                       {visionResult.hazards?.length > 0 && (
                         <div>
                           <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '6px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                             <AlertTriangle size={12} /> Hazards Detected
                           </div>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                             {visionResult.hazards.map((h, i) => (
                               <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>
                                 {h}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Recommendation */}
                       <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', fontSize: '13px', lineHeight: 1.5, borderLeft: `3px solid ${cfg.color}` }}>
                         <strong>Recommended Action:</strong> {visionResult.recommendation}
                       </div>

                       {/* Auto-alert notice */}
                       {visionResult.alertId && (
                         <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)', fontSize: '12px', color: '#ef4444', display: 'flex', gap: '6px', alignItems: 'center' }}>
                           <ShieldAlert size={14} />
                           Critical density auto-alert created in Firestore (ID: {visionResult.alertId})
                         </div>
                       )}

                       {/* Analyse another */}
                       <button
                         onClick={clearVision}
                         style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-full)', padding: '8px', fontSize: '13px', cursor: 'pointer' }}
                       >
                         Analyse another photo
                       </button>
                     </motion.div>
                   );
                 })()}
               </AnimatePresence>
             </div>
           )}
         </motion.div>
         {/* ─────────────────────────────────────────────────────────── */}

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
