
import React, { useRef, useEffect, useState } from 'react';
import { askCalendarAgent } from '../services/geminiService';
import { CalendarEvent, ChatMessage } from '../types';
import { SendIcon, SparklesIcon } from './Icons';

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

    const responseText = await askCalendarAgent(events, userMsg.text);
    
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText || "I couldn't generate a response.",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <>
      {/* Overlay/Modal Container - Pointer events controlled to allow clicking behind if needed, but here we block for modal feel */}
      <div className={`fixed inset-0 z-[90] pointer-events-none transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
         
         {/* Backdrop - Only on mobile is it fully blocking, on desktop it's transparent/clickable outside */}
         <div 
            className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto sm:pointer-events-none sm:bg-transparent sm:backdrop-blur-none ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={onClose} 
         />
         
         {/* Chat Window */}
         <div className={`absolute bottom-0 right-0 sm:bottom-24 sm:right-6 w-full sm:w-[360px] bg-[#1C1C1E] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 h-[65vh] sm:h-[480px] border border-white/10 pointer-events-auto transform ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
            
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#1C1C1E] sm:rounded-t-2xl z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Assistant</h3>
                        <p className="text-[10px] text-neutral-400">Powered by Gemini</p>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center hover:bg-neutral-700 hover:text-white transition-colors"
                >
                    &times;
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-neutral-800 text-neutral-200 rounded-bl-sm border border-white/5'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                     <div className="flex justify-start">
                         <div className="bg-neutral-800 px-3 py-2 rounded-2xl rounded-bl-sm border border-white/5">
                           <div className="flex gap-1">
                             <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                             <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                             <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                           </div>
                         </div>
                     </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/5 bg-[#1C1C1E] pb-safe sm:rounded-b-2xl">
                <form onSubmit={handleSend} className="relative flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/50 border border-white/10 text-white text-sm rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-neutral-600"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:bg-neutral-700 transition-colors"
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