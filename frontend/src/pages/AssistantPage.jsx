import { motion } from 'framer-motion';
import { useAssistant } from '../hooks/useAssistant.js';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';
import { Bot } from 'lucide-react';

export default function AssistantPage() {
  const { 
    messages, 
    isTyping, 
    isListening, 
    sendMessage, 
    startListening, 
    stopListening,
  } = useAssistant();

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - var(--bottom-nav-height))',
        background: 'var(--color-background)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Particle Effects */}
      <motion.div 
        animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
           position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
           background: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.05) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%)',
           zIndex: 0, pointerEvents: 'none'
        }} 
      />
      {/* Native Sticky Header */}
      <div 
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)', 
          padding: 'var(--space-4)', background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)', flexShrink: 0, 
          paddingTop: 'calc(var(--space-4) + env(safe-area-inset-top))',
          position: 'relative', zIndex: 10
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bot size={22} color="var(--color-accent)" />
        </div>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'var(--font-bold)', margin: 0 }}>ArenaIQ Assistant</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
             {isTyping ? 'Thinking...' : 'Gemini 1.5 Powered'}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', textAlign: 'center', position: 'relative', zIndex: 10 }}>
           <h3 style={{ marginBottom: 'var(--space-4)' }}>Ask about the Stadium</h3>
           <div style={{ display: 'grid', gap: '10px', width: '100%', maxWidth: '400px' }}>
             {[
               "Where is it least crowded right now?",
               "Find me the fastest route to Gate C",
               "What's happening at the food court?",
               "I'm a VIP — what exclusive spots can I access?",
               "Show me my current gamification points"
             ].map((prompt, i) => (
                <motion.button 
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(prompt)}
                  style={{
                     background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                     color: 'var(--color-text)', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                     fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                     boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {prompt}
                </motion.button>
             ))}
           </div>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MessageList messages={messages} isTyping={isTyping} />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10 }}>
        <MessageInput 
          onSend={sendMessage} 
          isTyping={isTyping}
          isListening={isListening}
          onStartListen={startListening}
          onStopListen={stopListening}
        />
      </div>
    </motion.div>
  );
}
