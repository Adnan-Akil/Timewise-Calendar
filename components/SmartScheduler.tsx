
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { parseSmartTask } from '../services/geminiService';
import { CalendarEvent, EventType } from '../types';
import { SparklesIcon, PlusIcon, CalendarIcon, ListIcon } from './Icons';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface SmartSchedulerProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onNavigate: (date: Date) => void;
}

const SmartScheduler: React.FC<SmartSchedulerProps> = ({ events, onAddEvent, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  
  // AI State
  const [aiInput, setAiInput] = useState('');

  // Manual State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('10:00');
  const [manualRepetition, setManualRepetition] = useState('none');

  // Swipe down to close modal
  useSwipeGesture({
    onSwipeDown: () => {
      if (isOpen) {
        setIsOpen(false);
      }
    },
  }, { threshold: 80, velocityThreshold: 0.4 });

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setLoading(true);
    const result = await parseSmartTask(aiInput);
    
    if (result && result.title) {
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: result.title,
            start: new Date(result.startIso),
            end: new Date(result.endIso),
            type: result.type as EventType || EventType.OTHER,
            description: result.description || `AI added from: "${aiInput}"`
        };
        
        onAddEvent(newEvent);
        closeModal();
        onNavigate(newEvent.start);
    }
    setLoading(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualTitle || !manualDate || !manualStartTime || !manualEndTime) return;

      const start = new Date(`${manualDate}T${manualStartTime}`);
      const end = new Date(`${manualDate}T${manualEndTime}`);

      const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: manualTitle,
          start: start,
          end: end,
          type: EventType.OTHER, // Default for manual
          description: `Repeats: ${manualRepetition}`
      };

      onAddEvent(newEvent);
      closeModal();
      onNavigate(start);
  };

  const closeModal = () => {
      setIsOpen(false);
      setAiInput('');
      setManualTitle('');
      setMode('ai');
  };

  return (
    <>
      {/* Inline Button in Grid */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 rounded-2xl bg-white text-black shadow-lg shadow-white/10 hover:bg-neutral-200 active:scale-95 transition-all duration-200 flex items-center justify-center ring-1 ring-white/20 hover:shadow-xl hover:shadow-white/20"
      >
        <PlusIcon className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Modal / Bottom Sheet */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" role="dialog">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal} />
            
            {/* Content Card */}
            <div 
                className="relative bg-[#1C1C1E] w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up pb-safe border-t border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-1" onClick={closeModal}>
                    <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
                </div>

                <div className="px-6 pb-6 pt-2">
                    
                    {/* Header with Tabs */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex p-1 bg-neutral-900 rounded-xl border border-white/5">
                            <button 
                                onClick={() => setMode('manual')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'manual' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                Manual
                            </button>
                            <button 
                                onClick={() => setMode('ai')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${mode === 'ai' ? 'bg-[#FF9F5A] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <SparklesIcon className="w-3 h-3" />
                                AI Assist
                            </button>
                        </div>
                        <button 
                            onClick={closeModal}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        >
                            &times;
                        </button>
                    </div>

                    {mode === 'ai' ? (
                        <form onSubmit={handleAiSubmit} className="space-y-4">
                             <div className="relative group">
                                <textarea 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="e.g. 'Gym workout tomorrow at 6pm for 1 hour'"
                                    className="w-full h-40 p-4 bg-black/50 border border-neutral-800 rounded-2xl text-lg text-white placeholder:text-neutral-600 focus:border-[#FF9F5A] focus:outline-none resize-none transition-colors"
                                    autoFocus
                                />
                                <div className="absolute bottom-4 right-4 text-neutral-600 pointer-events-none">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                            </div>
                             <button 
                                type="submit" 
                                disabled={loading || !aiInput.trim()}
                                className="w-full py-4 bg-[#FF9F5A] text-white rounded-2xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                  <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <SparklesIcon className="w-5 h-5" />
                                    Create with AI
                                  </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Event Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                    className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white focus:border-white/20 focus:outline-none transition-colors"
                                    placeholder="Title"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Date</label>
                                    <input 
                                        type="date"
                                        required 
                                        value={manualDate}
                                        onChange={(e) => setManualDate(e.target.value)}
                                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Repetition</label>
                                    <select 
                                        value={manualRepetition}
                                        onChange={(e) => setManualRepetition(e.target.value)}
                                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="none">None</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={manualStartTime}
                                        onChange={(e) => setManualStartTime(e.target.value)}
                                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">End Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={manualEndTime}
                                        onChange={(e) => setManualEndTime(e.target.value)}
                                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 mt-2"
                            >
                                Add Event
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SmartScheduler;
