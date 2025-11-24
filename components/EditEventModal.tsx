
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent, EventType } from '../types';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface EditEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, isOpen, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<EventType>(EventType.OTHER);
  const [description, setDescription] = useState('');

  // Swipe down to close modal
  useSwipeGesture({
    onSwipeDown: () => {
      if (isOpen) {
        onClose();
      }
    },
  }, { threshold: 80, velocityThreshold: 0.4 });

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      // Format date as YYYY-MM-DD for input
      const d = event.start;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);

      // Format times as HH:MM
      const formatTime = (dateObj: Date) => {
        return dateObj.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
      };
      setStartTime(formatTime(event.start));
      setEndTime(formatTime(event.end));
      
      setType(event.type);
      setDescription(event.description || '');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    onSave({
      ...event,
      title,
      start,
      end,
      type,
      description
    });
    onClose();
  };

  const handleDelete = () => {
      onDelete(event.id);
      onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Content - Compact and Centered */}
      <div className="relative w-full max-w-[340px] bg-[#121212] rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212]">
          <div>
            <h2 className="text-base font-bold text-white">Edit Event</h2>
            <p className="text-[10px] text-neutral-500 mt-0.5">Update event details</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 backdrop-blur-sm text-neutral-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 border border-white/10"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Event Title */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">Event Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all placeholder:text-neutral-600"
              placeholder="Event Title"
            />
          </div>

          {/* Date and Type */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">Date</label>
              <input 
                type="date"
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-xs focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full p-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-xs focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all appearance-none"
              >
                 {Object.values(EventType).map(t => (
                     <option key={t} value={t}>{t}</option>
                 ))}
              </select>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">Start</label>
              <input 
                type="time" 
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-xs focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">End</label>
              <input 
                type="time" 
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-xs focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
             <label className="block text-[10px] font-semibold text-neutral-400 mb-1.5 ml-1">Description</label>
             <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all resize-none h-16 placeholder:text-neutral-600"
                placeholder="Add notes..."
             />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button 
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-semibold text-sm hover:bg-red-500/20 active:scale-[0.98] transition-all duration-200"
            >
                Delete
            </button>
            <button 
                type="submit" 
                className="flex-[2] py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/20"
            >
                Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditEventModal;
