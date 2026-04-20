import { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MessageInput({ onSend, isListening, onStartListen, onStopListen, isTyping }) {
  const [text, setText] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (text.trim() && !isTyping) {
      onSend(text);
      setText('');
    }
  };

  const toggleListen = () => {
    if (isListening) onStopListen();
    else {
      // Clear out field when capturing new intent natively
      setText('');
      onStartListen((parsedTranscript) => {
        onSend(parsedTranscript);
      });
    }
  };

  return (
    <form 
      onSubmit={submit}
      style={{
        display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-3)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'max(var(--space-3), env(safe-area-inset-bottom))'
      }}
    >
      <button
        type="button"
        onClick={toggleListen}
        className="icon-btn"
        style={{
          background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-surface-2)',
          color: isListening ? 'var(--color-critical)' : 'var(--color-text-muted)',
          borderRadius: '50%',
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {isListening ? (
           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
             <Mic size={20} />
           </motion.div>
        ) : (
          <MicOff size={20} />
        )}
      </button>

      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={isOffline ? "You are offline." : isListening ? "Listening natively..." : "Message ArenaIQ..."}
        disabled={isListening || isTyping || isOffline}
        style={{
          flex: 1,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding: '0 var(--space-4)',
          color: 'var(--color-text)',
          fontSize: '15px'
        }}
      />

      <button
        type="submit"
        disabled={!text.trim() || isTyping || isListening || isOffline}
        style={{
          background: text.trim() && !isTyping && !isOffline ? 'var(--color-primary)' : 'var(--color-surface-2)',
          color: text.trim() && !isTyping && !isOffline ? '#fff' : 'var(--color-text-muted)',
          borderRadius: '50%', width: 44, height: 44, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: text.trim() && !isTyping && !isOffline ? 'pointer' : 'default',
          transition: 'all 0.2s'
        }}
      >
        <Send size={18} />
      </button>
    </form>
  );
}
