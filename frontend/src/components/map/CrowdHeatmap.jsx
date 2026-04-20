import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoot } from 'react-dom/client';
import { Activity, Clock, Users, X, MapPin, CheckCircle, Megaphone, Loader2 } from 'lucide-react';
import { useZoneStore } from '../../store/zoneStore.js';
import { useUserStore } from '../../store/userStore.js';
import { darkMapStyle } from './MapDarkTheme.js';
import MoodBadge from '../MoodBadge.jsx';
import './CrowdHeatmap.css';

// Default map focus: New Delhi Reference as noted in requirements
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const ZoneDetailsPanel = memo(({ zoneId, onClose, triggerToast }) => {
  const zone = useZoneStore(state => state.getZoneById(zoneId));
  const { checkInToZone, profile } = useUserStore();
  const [checkingIn, setCheckingIn] = useState(false);
  const [reportingCrowd, setReportingCrowd] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  if (!zone) return null;

  const handleReportCrowd = async (reportType) => {
    try {
      setReportingCrowd(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const token = await profile?.getIdToken?.() || profile?.token;
      
      const res = await fetch(`${baseUrl}/api/zones/${zoneId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reportType, notes: 'User telemetry confirmed via UI' })
      });

      if (res.ok) {
        triggerToast('+5 Points! Community Telemetry Verified!');
        setReportMenuOpen(false);
      } else {
         console.warn("Failed reporting.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportingCrowd(false);
    }
  };

  return (
    <motion.div 
      className="glass-card"
      style={{
        position: 'absolute',
        bottom: 'var(--space-20)',
        left: 'calc(50% - 175px)',
        width: 350,
        padding: 'var(--space-4)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="flex gap-2 items-center">
            <h2 className="text-lg font-bold">{zone.label || zone.id}</h2>
            <MoodBadge mood={zone.mood} moodEmoji={zone.moodEmoji} />
          </div>
          <div className="flex gap-2" style={{ marginTop: 'var(--space-1)' }}>
            <span className={`badge bg-pressure-${zone.dangerLevel || 'low'} pressure-${zone.dangerLevel || 'low'}`}>
              {(zone.dangerLevel || 'low').toUpperCase()}
            </span>
            {zone.isVIP && <span className="badge badge-vip">VIP</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--color-text-faint)' }}>
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center bg-surface-2" style={{ background: 'var(--color-surface-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted" />
            <span className="text-sm">Occupancy</span>
          </div>
          <span className="font-semibold">{Math.round(zone.currentOccupancy || 0)} / {zone.maxCapacity || 0}</span>
        </div>

        <div className="flex justify-between items-center bg-surface-2" style={{ background: 'var(--color-surface-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-muted" />
            <span className="text-sm">Pressure</span>
          </div>
          <span className="font-semibold">{Math.round(zone.pressureScore || 0)}%</span>
        </div>

        <div className="flex justify-between items-center bg-surface-2" style={{ background: 'var(--color-surface-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted" />
            <span className="text-sm">Wait Time</span>
          </div>
          <span className="font-semibold">{zone.estimatedWaitMinutes || 0} min</span>
        </div>
      </div>
      
      {/* Issue 25: Community Verification Stamp */}
      {zone.hasRecentReports && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-gold)', fontWeight: 'bold', marginTop: '4px' }}>
           <CheckCircle size={14} /> Community Verified
        </div>
      )}

      <button
        onClick={async () => {
          setCheckingIn(true);
          const result = await checkInToZone(zone.id, true);
          setCheckingIn(false);
          if (result) {
            triggerToast(result.loyaltyBonus ? `+${result.awardedPoints} Points! AI Route Avoided Congestion!` : `+${result.awardedPoints} Check In Points!`);
            onClose(); // Hide panel to focus on mapping
          }
        }}
        disabled={checkingIn}
        style={{
          marginTop: 'var(--space-2)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          border: 'none',
          cursor: checkingIn ? 'default' : 'pointer',
          opacity: checkingIn ? 0.7 : 1
        }}
      >
        <MapPin size={18} /> {checkingIn ? 'Checking In...' : 'Check In Here'}
      </button>

      {/* Issue 25: Report Crowd Gamification Tools */}
      <div style={{ position: 'relative' }}>
         <button
           onClick={() => setReportMenuOpen(!reportMenuOpen)}
           style={{
             width: '100%',
             background: 'var(--color-surface-2)',
             color: 'var(--color-text)',
             padding: '8px 16px',
             borderRadius: 'var(--radius-md)',
             fontWeight: 'bold',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             gap: '8px',
             border: '1px solid var(--color-surface-2)',
             cursor: 'pointer'
           }}
         >
           {reportingCrowd ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />} 
           Report Crowd Conditions
         </button>

         {reportMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px',
              background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10
            }}>
               <button onClick={() => handleReportCrowd('EMPTY')} className="btn-secondary" style={{ textAlign: 'left', padding: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🟢 Very Empty</button>
               <button onClick={() => handleReportCrowd('MODERATE')} className="btn-secondary" style={{ textAlign: 'left', padding: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🟡 Running Normal</button>
               <button onClick={() => handleReportCrowd('VERY_CROWDED')} className="btn-secondary" style={{ textAlign: 'left', padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔴 Too Crowded</button>
            </div>
         )}
      </div>
    </motion.div>
  );
});
ZoneDetailsPanel.displayName = 'ZoneDetailsPanel';

const MapComponent = memo(() => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const zonesArray = useZoneStore(state => state.getZonesArray());
  const heatmapLayerRef = useRef(null);
  const overlaysRef = useRef({});
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [is3D, setIs3D] = useState(true);

  const handleClosePanel = useCallback(() => {
    setSelectedZoneId(null);
  }, []);

  const handleTriggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const toggle3D = useCallback(() => {
    if (!map) return;
    const new3D = !is3D;
    setIs3D(new3D);
    map.setTilt(new3D ? 45 : 0);
    map.setHeading(new3D ? -45 : 0);
  }, [map, is3D]);

  // 1. Initialize Map
  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: DEFAULT_CENTER.lat - 0.01, lng: DEFAULT_CENTER.lng }, // Start slightly off-center
        zoom: 14,
        tilt: 0,
        heading: 0,
        mapId: import.meta.env.VITE_MAP_ID || 'c3cb3d95ae40cc96', // Explicit mapId enabling vectors globally
        disableDefaultUI: true,
        styles: darkMapStyle,
      });
      setMap(newMap);

      // Perform cinematic 3D pan on initialization
      setTimeout(() => {
        newMap.panTo(DEFAULT_CENTER);
        
        let targetZoom = 17;
        let currentZoom = 14;
        const zoomIn = setInterval(() => {
           if (currentZoom >= targetZoom) clearInterval(zoomIn);
           else newMap.setZoom(++currentZoom);
        }, 150);

        newMap.setTilt(45);
        newMap.setHeading(-45);
      }, 500);

      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: [],
        map: newMap,
        radius: 40,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(16, 185, 129, 1)',   // Low (Green)
          'rgba(245, 158, 11, 1)',   // Medium (Yellow)
          'rgba(249, 115, 22, 1)',   // High (Orange)
          'rgba(239, 68, 68, 1)'     // Critical (Red)
        ]
      });
      heatmapLayerRef.current = heatmap;
    }
  }, [mapRef, map]);

  // 2. Map Zone Updates to Heatmap
  useEffect(() => {
    if (!map || !heatmapLayerRef.current || !zonesArray.length) return;

    const heatmapData = zonesArray
      .filter(z => z.coordinates && z.coordinates.lat && z.coordinates.lng)
      .map(z => ({
        location: new window.google.maps.LatLng(z.coordinates.lat, z.coordinates.lng),
        weight: z.pressureScore || 0
      }));

    heatmapLayerRef.current.setData(heatmapData);
  }, [zonesArray, map]);

  // 3. Custom Overlay Views for Labels
  useEffect(() => {
    if (!map) return;

    class ZoneOverlay extends window.google.maps.OverlayView {
      constructor(zone, onClick) {
        super();
        this.zone = zone;
        this.onClick = onClick;
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.cursor = 'pointer';
        this.div.style.transform = 'translate(-50%, -50%)'; 
        this.root = createRoot(this.div);
      }
      onAdd() {
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div);
        this.div.addEventListener('click', () => this.onClick(this.zone.id));
      }
      draw() {
        const projection = this.getProjection();
        if (!projection || !this.zone.coordinates) return;
        const position = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(this.zone.coordinates.lat, this.zone.coordinates.lng)
        );
        if (position) {
          this.div.style.left = position.x + 'px';
          this.div.style.top = position.y + 'px';
        }
        this.renderReact();
      }
      renderReact() {
        const { label, dangerLevel, pressureScore } = this.zone;
        const isCritical = dangerLevel === 'critical';
        this.root.render(
          <div className={`zone-label-overlay ${isCritical ? 'critical-zone-overlay' : ''} bg-surface glass`}>
             <div className="zone-label-name">{label || this.zone.id}</div>
             <div className={`zone-label-pressure pressure-${dangerLevel || 'low'}`}>
               {Math.round(pressureScore || 0)}%
             </div>
          </div>
        );
      }
      updateZone(newZone) {
        this.zone = newZone;
        this.renderReact();
      }
      onRemove() {
        this.root.unmount();
        if (this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
      }
    }

    // Upsert overlays mapping
    zonesArray.forEach((zone) => {
      // Must have valid coordinates to render an overlay
      if (!zone.coordinates || !zone.coordinates.lat) return;
      
      if (overlaysRef.current[zone.id]) {
        overlaysRef.current[zone.id].updateZone(zone);
      } else {
        const overlay = new ZoneOverlay(zone, (id) => setSelectedZoneId(id));
        overlay.setMap(map);
        overlaysRef.current[zone.id] = overlay;
      }
    });

  }, [zonesArray, map]);

  return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      <AnimatePresence>
        {selectedZoneId && (
          <ZoneDetailsPanel 
            zoneId={selectedZoneId} 
            onClose={handleClosePanel} 
            triggerToast={handleTriggerToast} 
          />
        )}
      </AnimatePresence>

      {/* Gamification Toast Notification Overlay */}
      <AnimatePresence>
        {toastMessage && (
           <motion.div
             initial={{ opacity: 0, y: -50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -20, scale: 0.95 }}
             style={{
               position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
               background: 'var(--color-primary)', color: '#fff', fontWeight: 'bold',
               padding: '12px 24px', borderRadius: 'var(--radius-full)', zIndex: 9999,
               boxShadow: '0 4px 20px var(--color-accent-glow)', textAlign: 'center', whiteSpace: 'nowrap'
             }}
           >
             {toastMessage}
           </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={toggle3D}
        className="glass-card"
        style={{
          position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 60,
          padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 'bold',
          color: is3D ? '#fff' : 'var(--color-text-faint)', border: `1px solid ${is3D ? 'var(--color-primary)' : 'var(--color-border)'}`,
          transition: 'all 0.3s'
        }}
      >
        {is3D ? '3D ISOMETRIC' : '2D FLAT MAP'}
      </button>

      <div className="heatmap-legend glass-card">
        <span className="text-xs text-muted">Low</span>
        <div className="legend-gradient"></div>
        <span className="text-xs text-muted">Max</span>
      </div>
    </>
  );
});
MapComponent.displayName = 'MapComponent';

export default function CrowdHeatmap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center h-full">
        <div className="badge badge-warning mb-4">API Key Missing</div>
        <p className="text-muted">Set VITE_GOOGLE_MAPS_API_KEY in frontend/.env to view the map.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - var(--navbar-height) - var(--bottom-nav-height))' }}>
      <Wrapper apiKey={apiKey} libraries={['visualization']}>
        <MapComponent />
      </Wrapper>
    </div>
  );
}
