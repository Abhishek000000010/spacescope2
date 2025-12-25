
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Sparkles, Loader2, 
  Terminal, Globe, Rocket, HelpCircle, Bot 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are the 'SpaceScope AI Navigator', a high-tech, helpful cosmic guide for the SpaceScope platform. 
Your persona is enthusiastic, scientific, and futuristic.

KNOWLEDGE BASE:
- Platform Name: SpaceScope.
- Home Page: Features NASA's Picture of the Day (APOD).
- Events Page: Tracks real-time NASA Asteroid data (NeoWs) and celestial events (meteor showers, eclipses).
- Weather Page: Moniters Solar Wind, Flux, and Ionospheric activity. Features a Live Aurora Map (Pro only) and AI Threat Synthesis.
- Missions Page: A high-fidelity horizontal timeline of human space flight history.
- Learning Hub: An AI-powered Research Lab for any cosmic topic and a mini-quiz system.
- Premium Services: 'Pro Alerts' (real-time notifications), 'Pro Learning' (verified certificates), and 'Cosmic Marketplace' (authentic fragments and gear).
- Business Model: Basic tools are free. Pro Access costs ₹49/month.

RULES:
1. Keep responses concise (max 3 sentences) unless asked for deep detail.
2. If a user asks where to find something, provide the specific page name.
3. You can answer any general space science question (black holes, gravity, etc.) with accuracy.
4. Use occasional space-themed terminology (e.g., 'Copy that', 'Establishing uplink', 'Orbiting your query').`;

const CosmicChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Greetings, explorer. I am the SpaceScope Navigator. How can I assist your journey through the cosmos today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `System Context: ${SYSTEM_INSTRUCTION}` }] },
          ...messages.map(m => ({
            role: m.role === 'bot' ? 'model' : 'user',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ] as any,
      });

      const botReply = response.text || "Uplink intermittent. Please re-transmit your query.";
      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Signal lost in the nebula. Please try again when clear of interference." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, y: 20, filter: 'blur(10px)' }}
            className="absolute bottom-20 right-0 w-[90vw] sm:w-[400px] h-[550px] glass-card rounded-[2.5rem] border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-orbitron font-bold text-white tracking-wider">AI Navigator</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Uplink Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#030014]/40"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-cyan-600 text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-2">
                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                    <span className="text-[10px] uppercase font-bold text-cyan-500/60 tracking-widest">Processing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the platform or space..."
                  className="w-full bg-[#030014]/50 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all disabled:opacity-20"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-3 text-[9px] text-center text-gray-600 uppercase tracking-widest font-bold">
                Powered by SpaceScope Intelligence v3.0
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,232,255,0.3)] transition-all ${
          isOpen ? 'bg-purple-600 text-white' : 'bg-cyan-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} className="animate-pulse" />}
      </motion.button>
    </div>
  );
};

export default CosmicChatbot;
