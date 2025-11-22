
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent, EventType } from '../types';

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
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#1C1C1E] rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/50">
          <h2 className="text-xl font-bold text-white">Edit Event</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center hover:bg-neutral-700 hover:text-white transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Event Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3.5 bg-black/20 border border-neutral-700 rounded-2xl text-white focus:border-white/20 focus:outline-none transition-colors"
              placeholder="Event Title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Date</label>
              <input 
                type="date"
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-black/20 border border-neutral-700 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full p-3 bg-black/20 border border-neutral-700 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors appearance-none"
              >
                 {Object.values(EventType).map(t => (
                     <option key={t} value={t}>{t}</option>
                 ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Start Time</label>
              <input 
                type="time" 
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 bg-black/20 border border-neutral-700 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">End Time</label>
              <input 
                type="time" 
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 bg-black/20 border border-neutral-700 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-neutral-500 mb-1.5 ml-1">Description</label>
             <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-black/20 border border-neutral-700 rounded-xl text-white focus:border-white/20 focus:outline-none transition-colors resize-none h-24"
                placeholder="Notes..."
             />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors"
            >
                Delete
            </button>
            <button 
                type="submit" 
                className="flex-[2] py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
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
