
import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { CalendarEvent, ViewMode, EventType } from '../types';
import { ChevronRightIcon } from './Icons';

interface CalendarViewProps {
  events: CalendarEvent[];
  mode: ViewMode;
  currentDate: Date;
  now: Date;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, mode, currentDate, now, onDateClick, onEventClick }) => {
  
  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    ).sort((a,b) => a.start.getTime() - b.start.getTime());
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Mon start
    
    for(let i=0; i<firstDayIndex; i++) days.push(null);
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    if (onDateClick) {
        const newDate = new Date(currentDate);
        newDate.setDate(1); 
        newDate.setMonth(newDate.getMonth() + offset);
        onDateClick(newDate);
    }
  };

  // --- MONTH VIEW ---
  if (mode === ViewMode.MONTH) {
    return (
      <div className="h-full overflow-y-auto pt-2 md:pt-4 pb-32 animate-in fade-in duration-300 no-scrollbar">
        
        {/* Calendar Widget */}
        <div className="px-4 mb-6">
            <div className="bg-[#1C1C1E] rounded-3xl p-6 shadow-2xl mx-auto w-full border border-white/5 flex flex-col">
                {/* Header Date */}
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="text-neutral-500 hover:text-white p-2"
                    >
                    &larr;
                    </button>
                    <div className="text-white font-medium text-lg">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <button 
                        onClick={() => changeMonth(1)}
                        className="text-neutral-500 hover:text-white p-2"
                    >
                    &rarr;
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
                        <div key={day} className="text-center text-neutral-500 text-xs font-bold tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-4 sm:gap-y-6">
                    {daysInMonth.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} />;
                        
                        const dayEvents = getEventsForDay(date);
                        // Use 'now' prop for determining real-time Today
                        const isToday = date.toDateString() === now.toDateString();
                        const isSelected = date.getDate() === currentDate.getDate();
                        
                        return (
                            <div 
                                key={i} 
                                onClick={() => onDateClick && onDateClick(date)}
                                className="flex flex-col items-center gap-1 cursor-pointer group relative min-h-[32px]"
                            >
                                <div className={`
                                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                    ${isToday 
                                        ? 'bg-white text-black font-bold shadow-lg shadow-white/20' 
                                        : isSelected 
                                            ? 'bg-neutral-700 text-white ring-1 ring-white/20' 
                                            : 'text-neutral-300 group-hover:bg-neutral-800'}
                                `}>
                                    {date.getDate()}
                                </div>
                                {/* Event Indicators */}
                                <div className="flex gap-0.5 h-1 absolute -bottom-1">
                                    {dayEvents.slice(0, 3).map((e, idx) => (
                                        <div key={idx} className={`w-1 h-1 rounded-full ${e.type === EventType.CLASS ? 'bg-blue-400' : 'bg-[#FF9F5A]'}`} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* List below calendar */}
        <div className="px-6 space-y-3">
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm py-2 z-10 mb-2">
                <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest pl-2">
                    {currentDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric' })}
                </h3>
            </div>
            <div key={currentDate.toISOString()} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {getEventsForDay(currentDate).map(event => (
                    <div 
                        key={event.id} 
                        onClick={() => onEventClick && onEventClick(event)}
                        className="bg-[#1C1C1E] p-4 rounded-2xl flex gap-4 items-center border border-white/5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-none text-white font-bold border border-white/10">
                             {event.title.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate text-sm">{event.title}</h4>
                            <p className="text-neutral-500 text-xs truncate mt-0.5">
                                {event.start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                ))}
                 {getEventsForDay(currentDate).length === 0 && (
                    <div className="text-neutral-600 text-sm italic pl-2 py-4">No events scheduled for this day.</div>
                 )}
            </div>
             {/* Spacer for bottom nav visibility */}
             <div className="h-8" />
        </div>
      </div>
    );
  }

  // --- TIMELINE VIEW ---
  if (mode === ViewMode.WEEK) {
    return <InfiniteTimelineView 
        currentDate={currentDate} 
        events={events} 
        getEventsForDay={getEventsForDay} 
        onDateClick={onDateClick}
        onEventClick={onEventClick}
        now={now}
    />;
  }

  return null;
};

// Separated component for Timeline complexity
const InfiniteTimelineView = ({ currentDate, events, getEventsForDay, onDateClick, onEventClick, now }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [timelineDays, setTimelineDays] = useState<Date[]>([]);
    const prevScrollHeightRef = useRef<number>(0);
    const isPrependingRef = useRef(false);
    const scrollTimeoutRef = useRef<any>(null);

    // Initial Load & Reset on explicit external Date change (if needed)
    useEffect(() => {
        // Initialize with a buffer around currentDate
        const initialDays = [];
        for (let i = -14; i <= 21; i++) {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + i);
            initialDays.push(d);
        }
        setTimelineDays(initialDays);
        
        // Scroll to center initially
        setTimeout(() => {
            scrollToDate(currentDate, 'instant');
        }, 50);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const scrollToDate = (date: Date, behavior: ScrollBehavior = 'smooth') => {
        if (!containerRef.current) return;
        const dateStr = date.toDateString();
        const el = containerRef.current.querySelector(`[data-date="${dateStr}"]`);
        if (el) {
            el.scrollIntoView({ block: 'start', behavior });
            // Small correction for padding/header
            if (behavior === 'instant') {
               containerRef.current.scrollTop -= 20;
            }
        }
    };

    // Handle Prepend Scroll Restoration
    useLayoutEffect(() => {
        if (isPrependingRef.current && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                containerRef.current.scrollTop += diff;
            }
            isPrependingRef.current = false;
        }
    }, [timelineDays]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

        // 1. Infinite Scroll Logic
        if (scrollTop < 200 && !isPrependingRef.current) {
            isPrependingRef.current = true;
            prevScrollHeightRef.current = scrollHeight;
            
            setTimelineDays(prev => {
                const firstDate = prev[0];
                const newDays = [];
                for (let i = 10; i >= 1; i--) {
                    const d = new Date(firstDate);
                    d.setDate(d.getDate() - i);
                    newDays.push(d);
                }
                return [...newDays, ...prev];
            });
        } else if (scrollHeight - scrollTop - clientHeight < 400) {
            setTimelineDays(prev => {
                const lastDate = prev[prev.length - 1];
                const newDays = [];
                for (let i = 1; i <= 10; i++) {
                    const d = new Date(lastDate);
                    d.setDate(d.getDate() + i);
                    newDays.push(d);
                }
                return [...prev, ...newDays];
            });
        }

        // 2. Detect Visible Month for Header Sync
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            if (!containerRef.current || !onDateClick) return;
            
            // Find element near top of viewport
            const containerRect = containerRef.current.getBoundingClientRect();
            // Iterate children to find the one crossing the "read line" (e.g. 50px from top)
            // The container structure is div > div(list container) > divs(rows)
            // Actually our render is div(container) > div(list wrapper) > map(div)
            const wrapper = containerRef.current.children[0];
            if (!wrapper) return;

            const rows = Array.from(wrapper.children) as HTMLElement[];
            for (const row of rows) {
                const rect = row.getBoundingClientRect();
                // If the row's bottom is below the top threshold, it's the visible one
                if (rect.bottom > containerRect.top + 80) {
                     const dStr = row.getAttribute('data-date');
                     if (dStr) {
                         const visibleDate = new Date(dStr);
                         // Check if month changed to avoid excessive updates
                         if (visibleDate.getMonth() !== currentDate.getMonth() || visibleDate.getFullYear() !== currentDate.getFullYear()) {
                             onDateClick(visibleDate);
                         }
                     }
                     break; // Found the top-most visible
                }
            }
        }, 100);
    };

    const jumpToToday = () => {
        const today = new Date(now); // Use 'now'
        
        // Reset timeline days around today
        const newDays = [];
        for (let i = -14; i <= 14; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            newDays.push(d);
        }
        setTimelineDays(newDays);
        isPrependingRef.current = false;
        
        // Update header
        if (onDateClick) onDateClick(today);

        // Force scroll after render
        setTimeout(() => {
            scrollToDate(today, 'smooth');
        }, 100);
    };

    return (
        <div className="h-full relative animate-in slide-in-from-right-4 duration-300">
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-6 pt-2 pb-32 no-scrollbar scroll-smooth"
            >
                <div className="space-y-8 sm:space-y-12">
                    {timelineDays.map((day, idx) => {
                        const dayEvents = getEventsForDay(day);
                        // Use 'now' for isToday check
                        const isToday = day.toDateString() === now.toDateString();

                        return (
                            <div 
                                key={day.toISOString()} 
                                data-date={day.toDateString()}
                                className="flex gap-4 sm:gap-6 group min-h-[100px]"
                            >
                                {/* Left: Giant Number */}
                                <div className="w-16 sm:w-24 flex-none text-right pt-1">
                                    <div className={`text-5xl sm:text-7xl font-black tracking-tighter leading-none font-display transition-colors
                                        ${isToday ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-neutral-800 group-hover:text-neutral-700'}
                                    `}>
                                        {day.getDate()}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 mr-1 ${isToday ? 'text-white' : 'text-neutral-600'}`}>
                                        {day.toLocaleDateString('default', { weekday: 'short' })}
                                    </div>
                                </div>

                                {/* Divider Line */}
                                <div className="w-px bg-neutral-800 relative mt-3 mb-4 flex-none">
                                     {dayEvents.length > 0 && (
                                         <div className="absolute top-0 -left-[3px] w-2 h-2 bg-[#FF9F5A] rounded-full ring-4 ring-black" />
                                     )}
                                </div>

                                {/* Right: Content */}
                                <div className="flex-1 pt-2 pb-4 min-w-0">
                                    {dayEvents.length === 0 ? (
                                        <div className="text-neutral-800 text-sm font-medium pt-2 select-none">No events</div>
                                    ) : (
                                        <div className="space-y-6">
                                            {dayEvents.map((event: CalendarEvent, eIdx: number) => {
                                                // Real-time status logic
                                                const isCurrent = now >= event.start && now < event.end;
                                                const isPast = now >= event.end;

                                                return (
                                                    <div 
                                                        key={event.id} 
                                                        className={`relative group/item cursor-pointer transition-all duration-300 ${isPast ? 'opacity-50 grayscale' : ''}`}
                                                        onClick={() => onEventClick && onEventClick(event)}
                                                    >
                                                        {isCurrent && (
                                                            <div className="flex items-center gap-2 mb-2 animate-pulse">
                                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                                <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Happening Now</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-start justify-between pr-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight leading-tight">
                                                                    <span className="tabular-nums tracking-tighter">{event.start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}).toLowerCase().replace(' ', '')}</span>
                                                                    <span className="text-neutral-600 mx-1 font-light">|</span>
                                                                    <span className="tabular-nums text-neutral-400 tracking-tighter">{event.end.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}).toLowerCase().replace(' ', '')}</span>
                                                                </div>
                                                                <div className="text-neutral-300 font-medium text-base sm:text-lg truncate pr-4">
                                                                    {event.title}
                                                                </div>
                                                                <div className="text-neutral-600 text-xs font-medium uppercase tracking-wider mt-1">
                                                                    {event.type}
                                                                </div>
                                                            </div>
                                                            <ChevronRightIcon className="w-5 h-5 text-neutral-700 group-hover/item:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Jump to Today Button - Moved closer to navbar */}
            <button 
                onClick={jumpToToday}
                className="absolute right-6 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all z-20 border border-white/5 opacity-70 hover:opacity-100"
                style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
                aria-label="Jump to Today"
            >
                <div className="relative w-4 h-4 border border-current rounded-[1px] flex items-center justify-center">
                    <div className="w-2 h-[1px] bg-current absolute top-[3px]"></div>
                    <div className="text-[6px] font-bold mt-1">
                        {now.getDate()}
                    </div>
                </div>
            </button>
        </div>
    );
};

export default CalendarView;
