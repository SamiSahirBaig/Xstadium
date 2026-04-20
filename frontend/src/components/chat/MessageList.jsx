import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MessageList({ messages, isTyping }) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleZoneClick = (zoneId) => {
    // Navigating back to the map with state is a smooth approach
    navigate('/map', { state: { targetZone: zoneId } });
  };

  return (
    <div 
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Bot size={18} color="#f1f5f9" />
              </div>
            )}
            
            <div style={{
              background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              
              {/* Interactive Zone Pills generated sequentially per the backlog requirement */}
              {msg.suggestedZones && msg.suggestedZones.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {msg.suggestedZones.map(zone => (
                    <button
                      key={zone}
                      onClick={() => handleZoneClick(zone)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--color-accent)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <MapPin size={12} /> {zone}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
               <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <User size={18} color="var(--color-text-muted)" />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              display: 'flex', gap: 'var(--space-3)', alignSelf: 'flex-start'
            }}
          >
             <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={18} color="#f1f5f9" />
              </div>
              <div style={{
                background: 'var(--color-surface-2)',
                padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} style={{ width: 6, height: 6, background: 'var(--color-text-muted)', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} style={{ width: 6, height: 6, background: 'var(--color-text-muted)', borderRadius: '50%' }} />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} style={{ width: 6, height: 6, background: 'var(--color-text-muted)', borderRadius: '50%' }} />
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
