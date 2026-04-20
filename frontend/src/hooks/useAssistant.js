import { useState, useRef, useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore.js';

export function useAssistant() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { user } = useUserStore();
  
  // Keep the same session active until refresh
  const sessionIdRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Generate isolated random string if missing
    if (!sessionIdRef.current) {
      sessionIdRef.current = Math.random().toString(36).substring(2, 10);
    }

    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Append user message immediately
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Execute proxy call
      const token = user ? await user.getIdToken() : '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

      const res = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current,
          currentZone: 'GATE_A' // Mocking frontend injection for demo if outside bounds
        })
      });

      if (!res.ok) throw new Error('API Execution Failed');

      const data = await res.json();
      
      // Map AI Response
      const aiMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.reply || data.response || "No response received.", // Fallbacks
        intent: data.intent,
        suggestedZones: data.suggestedZones || []
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: "Oops. I'm having trouble reaching the Arena IQ core. Please try again soon." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = useCallback((onSpeechResult) => {
    if (!recognitionRef.current) {
      alert("Voice recognition isn't supported in this browser.");
      return;
    }
    
    // Bind overriding payload resolution dynamically
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onSpeechResult) onSpeechResult(transcript);
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech API Start Edge Case", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    messages,
    isTyping,
    isListening,
    sendMessage,
    startListening,
    stopListening,
    isVoiceSupported: !!recognitionRef.current
  };
}
