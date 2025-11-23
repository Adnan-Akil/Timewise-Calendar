import React, { useState, useEffect } from "react";
import { CalendarEvent, EventType, UserSettings, ViewMode } from "./types";
import CalendarView from "./components/CalendarView";
import SmartScheduler from "./components/SmartScheduler";
import ChatInterface from "./components/ChatInterface";
import EditEventModal from "./components/EditEventModal";
import Tour from "./components/Tour";
import {
  CalendarIcon,
  CogIcon,
  ListIcon,
  SparklesIcon,
  PlusIcon,
} from "./components/Icons";
import {
  initializeGoogleApi,
  handleAuthClick,
  listUpcomingEvents,
  handleSignOut,
} from "./services/googleCalendarService";

const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem("regalPlanSettings");
      return saved
        ? JSON.parse(saved)
        : {
            theme: "dark",
            isGoogleConnected: false,
            hasCompletedTour: false,
          };
    } catch (e) {
      return {
        theme: "dark",
        isGoogleConnected: false,
        hasCompletedTour: false,
      };
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Real-time Clock
  const [now, setNow] = useState(new Date());

  // Google API State
  const [isApiReady, setIsApiReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Event Editing State
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Initial Mock Events
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Weekly Leadership",
      type: EventType.MEETING,
      start: new Date(new Date().setHours(11, 0, 0, 0)),
      end: new Date(new Date().setHours(11, 30, 0, 0)),
    },
    {
      id: "2",
      title: "Product Strategy",
      type: EventType.MEETING,
      start: new Date(new Date().setHours(13, 0, 0, 0)),
      end: new Date(new Date().setHours(15, 0, 0, 0)),
    },
    {
      id: "3",
      title: "Kick-Off",
      type: EventType.WORK,
      start: new Date(new Date().setDate(new Date().getDate() + 2)),
      end: new Date(new Date().setDate(new Date().getDate() + 2)),
    },
  ] as any);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("regalPlanSettings", JSON.stringify(settings));
    document.documentElement.classList.add("dark");
  }, [settings]);

  // Real-time clock ticker (updates every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Google API on mount
  useEffect(() => {
    // The service now handles polling internally, so we just call it once on mount
    initializeGoogleApi(() => {
      console.log("Google API Initialized successfully");
      setIsApiReady(true);
    });
  }, []);

  // --- Handlers ---
  const handleToggleGoogle = async () => {
    if (!isApiReady) {
      alert(
        "Google API not loaded yet. Check your internet connection or API keys."
      );
      return;
    }

    if (settings.isGoogleConnected) {
      // Disconnect Logic
      handleSignOut();
      setSettings((prev) => ({ ...prev, isGoogleConnected: false }));
      // Remove google events from state
      setEvents((prev) => prev.filter((e) => !e.googleId));
    } else {
      // Connect Logic
      try {
        setIsSyncing(true);
        const success = await handleAuthClick();
        if (success) {
          setSettings((prev) => ({ ...prev, isGoogleConnected: true }));

          // Fetch events immediately after login
          try {
            const googleEvents = await listUpcomingEvents();
            console.log(`Successfully fetched ${googleEvents.length} Google Calendar events`);

            // Merge logic: Add new events, filtering duplicates
            setEvents((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newEvents = googleEvents.filter(
                (ge) => !existingIds.has(ge.id)
              );
              console.log(
                `Merging ${newEvents.length} new events with ${prev.length} existing events`
              );
              return [...prev, ...newEvents];
            });
          } catch (fetchError) {
            console.error("Failed to fetch calendar events:", fetchError);
            alert("Connected to Google but couldn't fetch events. Check console.");
          }
        }
      } catch (error) {
        console.error("Login failed", error);
        alert(
          "Failed to connect to Google Calendar. Check console for details."
        );
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleAddEvent = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const completeTour = () => {
    setSettings((prev) => ({ ...prev, hasCompletedTour: true }));
    // Reset view to Week/Timeline after tour
    setViewMode(ViewMode.WEEK);
    setIsChatOpen(false);
  };

  const handleTourViewChange = (mode: ViewMode, chat: boolean) => {
    setViewMode(mode);
    setIsChatOpen(chat);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const mockAction = (msg: string) => {
    alert(msg); // Simple feedback
  };

  // --- Render ---
  return (
    <div className="h-full w-full bg-black text-white font-sans relative flex flex-col supports-[height:100dvh]:h-[100dvh]">
      {/* Onboarding Tour */}
      {!settings.hasCompletedTour && (
        <Tour onComplete={completeTour} onViewChange={handleTourViewChange} />
      )}

      {/* Header */}
      <header className="flex-none pt-safe px-6 pb-2 bg-black/80 backdrop-blur-md z-30 sticky top-0 border-b border-white/5">
        <div className="flex justify-between items-end pt-4 md:pt-6 pb-2">
          <div>
            <h1 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1">
              {viewMode === ViewMode.WEEK ? "Timeline" : "Calendar"}
            </h1>
            <h2 className="text-3xl font-bold text-white tracking-tight animate-fade-in">
              {currentDate.toLocaleString("default", { month: "long" })}
              <span className="text-neutral-600 ml-2 text-xl">
                {currentDate.getFullYear()}
              </span>
            </h2>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full max-w-md mx-auto md:max-w-4xl">
        <CalendarView
          events={events}
          mode={viewMode}
          currentDate={currentDate}
          now={now}
          onDateClick={handleDateSelect}
          onEventClick={(event) => setEditingEvent(event)}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="flex-none bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 pb-safe z-40">
        <div className="h-20 w-full max-w-lg mx-auto grid grid-cols-5 items-center justify-items-center px-2">
          {/* 1. Month */}
          <button
            onClick={() => setViewMode(ViewMode.MONTH)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 ${
              viewMode === ViewMode.MONTH ? "text-white" : "text-neutral-600"
            }`}
          >
            <CalendarIcon className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[10px] font-medium">Month</span>
          </button>

          {/* 2. Timeline */}
          <button
            onClick={() => setViewMode(ViewMode.WEEK)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 ${
              viewMode === ViewMode.WEEK ? "text-white" : "text-neutral-600"
            }`}
          >
            <ListIcon className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[10px] font-medium">Timeline</span>
          </button>

          {/* 3. CENTER: Smart Add (Inline) */}
          <div className="flex items-center justify-center -mt-2.5">
            <SmartScheduler
              events={events}
              onAddEvent={handleAddEvent}
              onNavigate={handleDateSelect}
            />
          </div>

          {/* 4. AI Chat */}
          <button
            onClick={() => setIsChatOpen(true)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 ${
              isChatOpen ? "text-white" : "text-neutral-600"
            }`}
          >
            <SparklesIcon className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[10px] font-medium">Assistant</span>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 ${
              showSettingsModal ? "text-white" : "text-neutral-600"
            }`}
          >
            <CogIcon className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>

      <ChatInterface
        events={events}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Settings Bottom Sheet */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowSettingsModal(false)}
          />

          {/* Sheet */}
          <div className="relative bg-[#1C1C1E] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe mb-0">
            <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {/* Google Sync */}
              <button
                onClick={handleToggleGoogle}
                disabled={!isApiReady || isSyncing}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  settings.isGoogleConnected
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-neutral-900 border-neutral-800 hover:border-white/20"
                } ${isSyncing ? "opacity-50" : ""}`}
              >
                <span
                  className={`font-medium ${
                    settings.isGoogleConnected
                      ? "text-green-400"
                      : "text-neutral-300"
                  }`}
                >
                  {isSyncing
                    ? "Syncing..."
                    : settings.isGoogleConnected
                    ? "Google Calendar Connected"
                    : "Connect Google Calendar"}
                </span>
                {settings.isGoogleConnected ? (
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                    ON
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Add Calendar */}
              <button
                onClick={() => mockAction("Add Calendar feature coming soon!")}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-white/20 transition-all group"
              >
                <span className="font-medium text-neutral-300 group-hover:text-white">
                  Add Another Calendar
                </span>
                <PlusIcon className="w-5 h-5 text-neutral-500 group-hover:text-white" />
              </button>

              {/* Import/Export */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => mockAction("Importing...")}
                  className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-white/20 transition-all text-neutral-300 font-medium"
                >
                  Import
                </button>
                <button
                  onClick={() => mockAction("Exporting...")}
                  className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-white/20 transition-all text-neutral-300 font-medium"
                >
                  Export
                </button>
              </div>

              <button
                onClick={() => {
                  setSettings((s) => ({ ...s, hasCompletedTour: false }));
                  setShowSettingsModal(false);
                }}
                className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-white/20 transition-all mt-4"
              >
                <span className="font-medium text-neutral-300">
                  Replay Tour
                </span>
                <span className="text-xs text-neutral-500">Restart</span>
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-neutral-600">
                  Timewise Calendar v1.2.1
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
