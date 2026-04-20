import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Users, ShieldAlert, Navigation, Bot, Database, Server, Wifi } from 'lucide-react';
import { useZoneStore } from '../store/zoneStore.js';

// Counter animation component
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = count;
    const end = value;
    if (start === end) return;
    
    const duration = 1000;
    const increment = (end - start) / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, count]);
  
  return <span>{count.toLocaleString()}</span>;
};

// Simulated mock data payload initialized linearly
const initChartData = () => {
    return Array.from({ length: 20 }, (_, i) => ({
       time: new Date(Date.now() - (19 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       avgPressure: Math.floor(Math.random() * 20) + 30, // 30-50 range
       surgeEvents: Math.floor(Math.random() * 2),
    }));
};

export default function AnalyticsDashboard() {
  const { zones, isConnected } = useZoneStore();
  const [chartData, setChartData] = useState(initChartData());
  const [metrics, setMetrics] = useState({
      users: 14205,
      aiQueries: 3842,
      alerts: 12,
      routes: 8931
  });

  // Effect to push physical Live Pressure data array onto chart payload natively!
  useEffect(() => {
      const interval = setInterval(() => {
         const currentAvg = Object.values(zones).reduce((acc, z) => acc + (z.pressureScore || 0), 0) / Math.max(1, Object.keys(zones).length);
         const hasAlerts = Object.values(zones).some(z => z.pressureScore > 90);
         
         setChartData(prev => {
             const newData = [...prev.slice(1), {
                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 avgPressure: Math.round(currentAvg) || 45,
                 surgeEvents: hasAlerts ? 3 : 0
             }];
             return newData;
         });
         
         // Jitter metrics
         setMetrics(m => ({
             ...m,
             users: m.users + Math.floor(Math.random() * 10) - 2,
             aiQueries: m.aiQueries + Math.floor(Math.random() * 5),
             routes: m.routes + Math.floor(Math.random() * 8)
         }));

      }, 5000);
      
      return () => clearInterval(interval);
  }, [zones]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        padding: 'var(--space-6)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <Activity color="var(--color-primary)" /> ArenaIQ X // Global Analytics
        </h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isConnected ? '#00ff88' : '#ff4444' }}>
              <Wifi size={14} /> WebSocket: {isConnected ? 'LIVE' : 'DISCONNECTED'}
           </span>
           <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff88' }}>
              <Database size={14} /> BigQuery: SYNCED
           </span>
        </div>
      </div>

      {/* KPI Core Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
         <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Total Active Users <Users size={16} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff' }}>
                <AnimatedCounter value={metrics.users} />
             </div>
             <div style={{ fontSize: '12px', color: '#00ff88', marginTop: '4px' }}>+12.4% vs last hour</div>
         </div>

         <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                AI Queries Today <Bot size={16} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                <AnimatedCounter value={metrics.aiQueries} />
             </div>
             <div style={{ fontSize: '12px', color: '#00ff88', marginTop: '4px' }}>+84.2% adoption rate</div>
         </div>

         <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Routes Computed <Navigation size={16} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                <AnimatedCounter value={metrics.routes} />
             </div>
             <div style={{ fontSize: '12px', color: '#00ff88', marginTop: '4px' }}>Average latency: 42ms</div>
         </div>

         <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-critical)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.1) inset' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-critical)', marginBottom: '8px' }}>
                Alerts Triggered <ShieldAlert size={16} />
             </div>
             <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-critical)' }}>
                <AnimatedCounter value={metrics.alerts} />
             </div>
             <div style={{ fontSize: '12px', color: 'var(--color-critical)', marginTop: '4px' }}>Resolution rate: 100%</div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: 'var(--space-6)' }}>
         {/* Live Pressure Graph */}
         <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', height: '400px' }}>
             <h3 style={{ margin: 0, marginBottom: '24px', fontSize: '16px' }}>Global Pressure Telemetry (Rolling 10m window)</h3>
             <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip 
                       contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
                       labelStyle={{ color: '#888' }}
                    />
                    <Area type="monotone" dataKey="avgPressure" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPressure)" />
                 </AreaChart>
             </ResponsiveContainer>
         </div>
      </div>

      {/* System Status Limits Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
            <div>
               <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Gemini Pro Vision AI</div>
               <div style={{ fontWeight: 'bold' }}>Optimal (1.2s avg)</div>
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
            <div>
               <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>GCP Pub/Sub Streams</div>
               <div style={{ fontWeight: 'bold' }}>Syncing (0.01s latency)</div>
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
            <div>
               <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>FCM Push Targets</div>
               <div style={{ fontWeight: 'bold' }}>Connected (100% DLV)</div>
            </div>
         </div>
      </div>

    </motion.div>
  );
}
