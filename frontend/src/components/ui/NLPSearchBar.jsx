import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, X, Loader2, Navigation } from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant.js';

export default function NLPSearchBar() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  
  const { messages, isTyping, isListening, sendMessage, startListening, stopListening } = useAssistant();

  // Find the exact last message produced by the assistant related to the ongoing search
  const latestResponse = messages.filter(m => m.role === 'model').at(-1);

  const handleSearch = (e) => {
     e.preventDefault();
     if (!query.trim()) return;
     sendMessage(query);
     setIsExpanded(true);
  };

  const toggleVoice = () => {
     if (isListening) {
         stopListening();
     } else {
         startListening();
         setIsExpanded(true);
     }
  };

  return (
    <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 100 }}>
       <motion.div 
          layout
          className="glass-card"
          style={{
             display: 'flex', flexDirection: 'column',
             borderRadius: isExpanded ? '16px' : '99px',
             overflow: 'hidden', transition: 'border-radius 0.3s'
          }}
       >
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: '12px' }}>
             <Search size={20} color="var(--color-text-muted)" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }} />
             <input 
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask AI (e.g. 'Safest route to VIP Lounge')"
                onFocus={() => setIsExpanded(true)}
                style={{
                   flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none'
                }}
             />
             <button type="button" onClick={toggleVoice} style={{ color: isListening ? '#ef4444' : 'var(--color-accent)', padding: '6px' }}>
                {isListening ? <MicOff size={20} className="critical-zone" /> : <Mic size={20} />}
             </button>
             {isExpanded && (
                <button type="button" onClick={() => setIsExpanded(false)} style={{ color: 'var(--color-text-faint)', marginLeft: '8px' }}>
                   <X size={20} />
                </button>
             )}
          </form>

          <AnimatePresence>
             {isExpanded && (isTyping || latestResponse) && (
                <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="nlps-results"
                   style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '16px' }}
                >
                   {isTyping ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
                         <Loader2 size={16} className="animate-spin" /> Analyzing venue parameters and vectors...
                      </div>
                   ) : (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                         <div style={{ background: 'var(--color-surface-2)', padding: '8px', borderRadius: '50%' }}>
                            <Navigation size={18} color="var(--color-primary)" />
                         </div>
                         <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.5' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>
                               {latestResponse?.content}
                            </pre>
                         </div>
                      </div>
                   )}
                </motion.div>
             )}
          </AnimatePresence>
       </motion.div>
    </div>
  );
}
