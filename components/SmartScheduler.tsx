
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent, EventType } from '../types';
import { PlusIcon, ChevronRightIcon, CalendarIcon } from './Icons';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import SwipeSelect from './SwipeSelect';
import TimeWheel from './TimeWheel';

interface SmartSchedulerProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onNavigate: (date: Date) => void;
}

const SmartScheduler: React.FC<SmartSchedulerProps> = ({ events, onAddEvent, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  
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
      setManualTitle('');
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
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">New Event</h2>
                        <button 
                            onClick={closeModal}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Event Title</label>
                            <input 
                                type="text" 
                                required
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                                className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white focus:border-white/20 focus:outline-none transition-colors min-h-[56px] text-base"
                                placeholder="Title"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Date</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        required 
                                        value={manualDate}
                                        onChange={(e) => setManualDate(e.target.value)}
                                        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark] min-h-[48px] appearance-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Repetition</label>
                                <SwipeSelect
                                    value={manualRepetition}
                                    onChange={setManualRepetition}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                        { value: 'yearly', label: 'Yearly' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Start Time</label>
                                <TimeWheel 
                                    value={manualStartTime}
                                    onChange={setManualStartTime}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">End Time</label>
                                <TimeWheel 
                                    value={manualEndTime}
                                    onChange={setManualEndTime}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 mt-2 min-h-[56px]"
                        >
                            Add Event
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SmartScheduler;
