import React, { useRef, useEffect, useState } from 'react';
import { askCalendarAgent } from '../services/geminiService';
import { CalendarEvent, ChatMessage } from '../types';
import { SendIcon, SparklesIcon } from './Icons';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface ChatInterfaceProps {
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ events, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        id: 'intro',
        role: 'model',
        text: 'Hello! Ask me about your schedule.',
        timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Swipe down to close chat
  useSwipeGesture({
    onSwipeDown: () => {
      if (isOpen) {
        onClose();
      }
    },
  }, { threshold: 80, velocityThreshold: 0.4 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askCalendarAgent(events, userMsg.text);
      const aiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error asking calendar agent:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay/Modal Container */}
      <div className={`fixed inset-0 z-[90] pointer-events-none transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
         
         {/* Backdrop */}
         <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose} 
         />
         
         {/* Chat Window */}
         <div className={`absolute bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[360px] bg-[#121212] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col transition-all duration-300 h-[70vh] sm:h-[500px] border border-white/10 pointer-events-auto transform ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'} overflow-hidden`}>
            
            {/* Header */}
            <div className="relative p-4 border-b border-white/10 bg-[#121212] sm:rounded-t-3xl">
                <div className="relative flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="relative w-10 h-10 rounded-2xl bg-red-600/10 flex items-center justify-center shadow-lg shadow-red-500/10">
                            <SparklesIcon className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">AI Assistant</h3>
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Online • Powered by Gemini
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        className="w-9 h-9 rounded-xl bg-white/5 backdrop-blur-sm text-neutral-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 border border-white/10"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-red-600 text-white rounded-br-md' 
                            : 'bg-[#1C1C1E] text-neutral-100 rounded-bl-md border border-white/10'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                     <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="bg-[#1C1C1E] px-4 py-3 rounded-2xl rounded-bl-md border border-white/10">
                           <div className="flex gap-1.5">
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                           </div>
                         </div>
                     </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-[#121212] pb-safe sm:rounded-b-3xl">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="w-full bg-[#1C1C1E] border border-white/10 text-white text-sm rounded-2xl pl-5 pr-12 py-3.5 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-neutral-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 disabled:bg-neutral-700 transition-all duration-200 active:scale-95 shadow-lg disabled:shadow-none"
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </form>
            </div>

         </div>
      </div>
    </>
  );
};

export default ChatInterface;