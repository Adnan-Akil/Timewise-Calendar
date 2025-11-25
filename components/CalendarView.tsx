import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { CalendarEvent, ViewMode, EventType } from "../types";
import { ChevronRightIcon } from "./Icons";
import { useSwipeGesture } from "../hooks/useSwipeGesture";

interface CalendarViewProps {
  events: CalendarEvent[];
  mode: ViewMode;
  currentDate: Date;
  now: Date;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  mode,
  currentDate,
  now,
  onDateClick,
  onEventClick,
}) => {
  // State for date popup (used in month view)
  const [selectedDateForPopup, setSelectedDateForPopup] = useState<Date | null>(null);

  // Swipe gesture support for month navigation
  useSwipeGesture({
    onSwipeLeft: () => {
      if (mode === ViewMode.MONTH) {
        changeMonth(1); // Next month
      }
    },
    onSwipeRight: () => {
      if (mode === ViewMode.MONTH) {
        changeMonth(-1); // Previous month
      }
    },
    onSwipeDown: () => {
      if (selectedDateForPopup) {
        setSelectedDateForPopup(null); // Close popup
      }
    },
  }, { threshold: 50, velocityThreshold: 0.3 });

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
      <div className="h-full flex flex-col animate-in fade-in duration-300">
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
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-neutral-500 text-xs font-bold tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-4 sm:gap-y-6">
              {daysInMonth.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;

                const dayEvents = getEventsForDay(date);
                const isToday = date.toDateString() === now.toDateString();
                const isSelected = date.getDate() === currentDate.getDate();

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDateForPopup(date)}
                    className="flex flex-col items-center gap-1 cursor-pointer group relative min-h-[32px]"
                  >
                    <div
                      className={`
                                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                                    ${
                                      isToday
                                        ? "bg-white text-black font-bold shadow-lg shadow-white/20"
                                        : isSelected
                                        ? "bg-neutral-700 text-white ring-1 ring-white/20"
                                        : "text-neutral-300 group-hover:bg-neutral-800"
                                    }
                                `}
                    >
                      {date.getDate()}
                    </div>
                    {/* Event Indicators */}
                    <div className="flex gap-0.5 h-1 absolute -bottom-1">
                      {dayEvents.slice(0, 3).map((e, idx) => {
                        let indicatorColor = "bg-[#FF9F5A]"; // Default
                        if (e.type === EventType.CLASS)
                          indicatorColor = "bg-blue-400";
                        if (e.type === EventType.MEETING)
                          indicatorColor = "bg-purple-400";
                        if (e.googleId) indicatorColor = "bg-red-400"; // Google Calendar events
                        return (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${indicatorColor}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day-wise Task Grid below calendar - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
          <div className="space-y-4">
            {/* Get all days from current day to end of month that have events */}
            {(() => {
              // Get today's date (start of day for comparison)
              const today = new Date(now);
              today.setHours(0, 0, 0, 0);

              // Get all unique dates that have events from today onwards
              const daysWithEvents = daysInMonth
                .filter((date) => date !== null && date >= today)
                .map((date) => ({
                  date: date!,
                  events: getEventsForDay(date!),
                }))
                .filter((day) => day.events.length > 0);

              return daysWithEvents.length > 0 ? (
                daysWithEvents.map(({ date, events }) => (
                  <div
                    key={date.toISOString()}
                    className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5 shadow-sm animate-in fade-in duration-300"
                  >
                    {/* Date Header */}
                    <div className="mb-3 pb-2 border-b border-white/5">
                      <h3 className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                        {date.toLocaleDateString("default", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick && onEventClick(event)}
                          className="flex gap-3 items-start p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                          {/* Avatar/Icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-none text-white font-bold text-sm border"
                            style={{
                              backgroundColor: event.color
                                ? `${event.color}15`
                                : "#333",
                              borderColor: event.color || "#555",
                            }}
                          >
                            {event.title.charAt(0)}
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate group-hover:text-white/90">
                                  {event.title}
                                </h4>
                                <p className="text-neutral-500 text-xs mt-0.5">
                                  {event.type}
                                </p>
                              </div>
                              {event.googleId && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                                  Google
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-600 text-xs mt-1">
                              {event.start.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {event.end.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 text-center">
                  <p className="text-neutral-600 text-sm">
                    No events scheduled this month
                  </p>
                </div>
              );
            })()}
          </div>
          {/* Spacer for bottom nav visibility */}
          <div className="h-8" />
        </div>

        {/* Date Pop-up Modal */}
        {selectedDateForPopup && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedDateForPopup(null)}
            />

            {/* Pop-up Sheet */}
            <div className="relative bg-[#1C1C1E] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe mb-0 max-h-[70vh] flex flex-col">
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-4" />

              {/* Date Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  {selectedDateForPopup.toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDateForPopup(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* Events List - Scrollable */}
              <div className="flex-1 overflow-y-auto -mx-2 px-2 no-scrollbar">
                {(() => {
                  const dayEvents = getEventsForDay(selectedDateForPopup);
                  return dayEvents.length > 0 ? (
                    <div className="space-y-3">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedDateForPopup(null);
                            onEventClick && onEventClick(event);
                          }}
                          className="flex gap-3 items-start p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all cursor-pointer group"
                        >
                          {/* Avatar/Icon */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-none text-white font-bold text-sm border"
                            style={{
                              backgroundColor: event.color
                                ? `${event.color}15`
                                : "#333",
                              borderColor: event.color || "#555",
                            }}
                          >
                            {event.title.charAt(0)}
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-base truncate group-hover:text-white/90">
                                  {event.title}
                                </h4>
                                <p className="text-neutral-500 text-xs mt-0.5">
                                  {event.type}
                                </p>
                              </div>
                              {event.googleId && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                                  Google
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-sm mt-2 font-medium">
                              {event.start.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {event.end.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-neutral-600 text-sm">
                        No events scheduled for this day
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
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
const InfiniteTimelineView = ({
  currentDate,
  events,
  getEventsForDay,
  onDateClick,
  onEventClick,
  now,
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineDays, setTimelineDays] = useState<Date[]>([]);
  const isPrependingRef = useRef(false);
  const scrollTimeoutRef = useRef<any>(null);
  const anchorElementRef = useRef<string | null>(null);
  const anchorOffsetRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const isRapidScrollingRef = useRef(false);

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

  // Handle Prepend Scroll Restoration using anchor element
  useLayoutEffect(() => {
    if (isPrependingRef.current && containerRef.current && anchorElementRef.current) {
      // Only restore scroll position if NOT rapidly scrolling
      if (!isRapidScrollingRef.current) {
        const anchorEl = containerRef.current.querySelector(
          `[data-date="${anchorElementRef.current}"]`
        ) as HTMLElement;
        
        if (anchorEl) {
          const currentOffset = anchorEl.offsetTop;
          const scrollAdjustment = currentOffset - anchorOffsetRef.current;
          containerRef.current.scrollTop += scrollAdjustment;
        }
      }
      
      isPrependingRef.current = false;
      anchorElementRef.current = null;
    }
  }, [timelineDays]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;
    const scrollDelta = Math.abs(scrollTop - lastScrollTopRef.current);
    
    // Detect rapid scrolling (more than 80px in less than 120ms)
    if (timeDelta < 120 && scrollDelta > 80) {
      isRapidScrollingRef.current = true;
    } else if (timeDelta > 200) {
      isRapidScrollingRef.current = false;
    }
    
    lastScrollTimeRef.current = now;
    lastScrollTopRef.current = scrollTop;

    // 1. Infinite Scroll Logic - with much higher threshold and debouncing
    if (scrollTop < 800 && !isPrependingRef.current) {
      isPrependingRef.current = true;
      
      // Find the first visible element to use as anchor (only if not rapid scrolling)
      if (!isRapidScrollingRef.current) {
        const wrapper = containerRef.current.children[0];
        if (wrapper && wrapper.children.length > 0) {
          const firstVisibleEl = wrapper.children[0] as HTMLElement;
          const dateStr = firstVisibleEl.getAttribute("data-date");
          if (dateStr) {
            anchorElementRef.current = dateStr;
            anchorOffsetRef.current = firstVisibleEl.offsetTop;
          }
        }
      }

      // Delay the prepend to allow scroll momentum to settle
      setTimeout(() => {
        requestAnimationFrame(() => {
          setTimelineDays((prev) => {
            const firstDate = prev[0];
            const newDays = [];
            for (let i = 10; i >= 1; i--) {
              const d = new Date(firstDate);
              d.setDate(d.getDate() - i);
              newDays.push(d);
            }
            return [...newDays, ...prev];
          });
        });
      }, 100); // Delay prepend by 100ms
    } else if (scrollHeight - scrollTop - clientHeight < 400 && !isPrependingRef.current) {
      setTimelineDays((prev) => {
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

    // 2. Detect Visible Month for Header Sync - Debounced with RAF
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current || !onDateClick) return;

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        // Find element near top of viewport
        const containerRect = containerRef.current.getBoundingClientRect();
        const wrapper = containerRef.current.children[0];
        if (!wrapper) return;

        const rows = Array.from(wrapper.children) as HTMLElement[];
        for (const row of rows) {
          const rect = row.getBoundingClientRect();
          // If the row's bottom is below the top threshold, it's the visible one
          if (rect.bottom > containerRect.top + 80) {
            const dStr = row.getAttribute("data-date");
            if (dStr) {
              const visibleDate = new Date(dStr);
              // Only update if month/year actually changed
              if (
                visibleDate.getMonth() !== currentDate.getMonth() ||
                visibleDate.getFullYear() !== currentDate.getFullYear()
              ) {
                onDateClick(visibleDate);
              }
            }
            break; // Found the top-most visible
          }
        }
      });
    }, 200); // Increased debounce time for smoother feel
  };

  const jumpToToday = () => {
    const today = new Date(now);

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
                    <div
                      className="absolute top-0 -left-[3px] w-2 h-2 rounded-full ring-4 ring-black"
                      style={{
                        backgroundColor: dayEvents.some((e) => e.googleId)
                          ? "#ef4444"
                          : "#FF9F5A",
                      }}
                    />
                  )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 pt-2 pb-4 min-w-0">
                  {dayEvents.length === 0 ? (
                    <div className="text-neutral-800 text-sm font-medium pt-2 select-none">
                      No events
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dayEvents.map((event: CalendarEvent, eIdx: number) => {
                        const isCurrent = now >= event.start && now < event.end;
                        const isPast = now >= event.end;

                        return (
                          <div
                            key={event.id}
                            className={`relative group/item cursor-pointer transition-all duration-300 ${
                              isPast ? "opacity-50 grayscale" : ""
                            }`}
                            onClick={() => onEventClick && onEventClick(event)}
                          >
                            {isCurrent && (
                              <div className="flex items-center gap-2 mb-2 animate-pulse">
                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                <span className="text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                  Happening Now
                                </span>
                              </div>
                            )}

                            <div className={`flex items-start justify-between pr-2 transition-all duration-300 ${isCurrent ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xl sm:text-2xl font-bold mb-1 tracking-tight leading-tight ${isCurrent ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'text-white'}`}>
                                  <span className="tabular-nums tracking-tighter">
                                    {event.start
                                      .toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })
                                      .toLowerCase()
                                      .replace(" ", "")}
                                  </span>
                                  <span className="text-neutral-600 mx-1 font-light">
                                    |
                                  </span>
                                  <span className="tabular-nums text-neutral-400 tracking-tighter">
                                    {event.end
                                      .toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })
                                      .toLowerCase()
                                      .replace(" ", "")}
                                  </span>
                                </div>
                                <div className="text-neutral-300 font-medium text-base sm:text-lg truncate pr-4">
                                  {event.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-neutral-600 text-xs font-medium uppercase tracking-wider">
                                    {event.type}
                                  </span>
                                  {event.googleId && (
                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                      Google
                                    </span>
                                  )}
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
        style={{ bottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        aria-label="Jump to Today"
      >
        <div className="relative w-4 h-4 border border-current rounded-[1px] flex items-center justify-center">
          <div className="w-2 h-[1px] bg-current absolute top-[3px]"></div>
          <div className="text-[6px] font-bold mt-1">{now.getDate()}</div>
        </div>
      </button>
    </div>
  );
};

export default CalendarView;
