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
  PlusIcon,
  SparklesIcon,
  ChevronRightIcon,
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

  // Auto-sync on load if already authenticated
  useEffect(() => {
    if (!isApiReady) return;

    // Import the checkStoredAuth function
    import("./services/googleCalendarService").then(
      ({ checkStoredAuth, listUpcomingEvents }) => {
        const hasStoredAuth = checkStoredAuth();
        if (hasStoredAuth) {
          console.log("Found stored authentication, auto-syncing...");
          setSettings((prev) => ({ ...prev, isGoogleConnected: true }));
          setIsSyncing(true);

          // Fetch events automatically
          listUpcomingEvents()
            .then((googleEvents) => {
              console.log(
                `Auto-sync: Successfully fetched ${googleEvents.length} Google Calendar events`
              );

              // Merge logic: Add new events, filtering duplicates
              setEvents((prev) => {
                const existingIds = new Set(prev.map((e) => e.id));
                const newEvents = googleEvents.filter(
                  (ge) => !existingIds.has(ge.id)
                );
                console.log(
                  `Auto-sync: Merging ${newEvents.length} new events with ${prev.length} existing events`
                );
                return [...prev, ...newEvents];
              });
            })
            .catch((error) => {
              console.error("Auto-sync failed:", error);
              // Don't show alert on auto-sync failure, just log it
            })
            .finally(() => {
              setIsSyncing(false);
            });
        }
      }
    );
  }, [isApiReady]);

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
            console.log(
              `Successfully fetched ${googleEvents.length} Google Calendar events`
            );

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
            alert(
              "Connected to Google but couldn't fetch events. Check console."
            );
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
            className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowSettingsModal(false)}
          />

          {/* Sheet */}
          <div className="relative bg-gradient-to-b from-[#1C1C1E] to-[#151517] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 shadow-2xl animate-slide-up pb-safe mb-0 overflow-hidden">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Settings</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Manage your preferences</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm text-neutral-400 hover:bg-white/10 hover:text-white transition-all duration-200 active:scale-95 border border-white/10"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Google Sync */}
              <button
                onClick={handleToggleGoogle}
                disabled={!isApiReady || isSyncing}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                  settings.isGoogleConnected
                    ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/10"
                    : "bg-[#252527] border-white/10 hover:border-white/20 hover:bg-[#2A2A2C]"
                } ${isSyncing ? "opacity-50 cursor-wait" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    settings.isGoogleConnected 
                      ? "bg-green-500/20" 
                      : "bg-white/5"
                  }`}>
                    <svg className={`w-5 h-5 ${settings.isGoogleConnected ? "text-green-400" : "text-neutral-500"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold block text-sm ${
                      settings.isGoogleConnected
                        ? "text-green-400"
                        : "text-neutral-200"
                    }`}>
                      {isSyncing
                        ? "Syncing..."
                        : settings.isGoogleConnected
                        ? "Google Calendar"
                        : "Connect Google"}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {settings.isGoogleConnected ? "Connected" : "Sync your events"}
                    </span>
                  </div>
                </div>
                {settings.isGoogleConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-green-400">ON</span>
                  </div>
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-neutral-600" />
                )}
              </button>

              {/* Add Calendar */}
              <button
                onClick={() => mockAction("Add Calendar feature coming soon!")}
                className="w-full flex items-center justify-between p-4 bg-[#252527] rounded-2xl border border-white/10 hover:border-white/20 hover:bg-[#2A2A2C] transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <PlusIcon className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-neutral-200 group-hover:text-white text-sm block transition-colors">
                      Add Calendar
                    </span>
                    <span className="text-xs text-neutral-500">
                      Connect another account
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </button>

              {/* Import/Export */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => mockAction("Importing...")}
                  className="p-4 bg-[#252527] rounded-2xl border border-white/10 hover:border-white/20 hover:bg-[#2A2A2C] transition-all duration-200 active:scale-[0.98] text-neutral-200 font-semibold text-sm"
                >
                  Import
                </button>
                <button
                  onClick={() => mockAction("Exporting...")}
                  className="p-4 bg-[#252527] rounded-2xl border border-white/10 hover:border-white/20 hover:bg-[#2A2A2C] transition-all duration-200 active:scale-[0.98] text-neutral-200 font-semibold text-sm"
                >
                  Export
                </button>
              </div>

              {/* Replay Tour */}
              <button
                onClick={() => {
                  setSettings((s) => ({ ...s, hasCompletedTour: false }));
                  setShowSettingsModal(false);
                }}
                className="w-full flex items-center justify-between p-4 bg-[#252527] rounded-2xl border border-white/10 hover:border-white/20 hover:bg-[#2A2A2C] transition-all duration-200 active:scale-[0.98] mt-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-neutral-200 group-hover:text-white text-sm block transition-colors">
                      Replay Tour
                    </span>
                    <span className="text-xs text-neutral-500">
                      See the guide again
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </button>

              {/* Version */}
              <div className="pt-6 text-center border-t border-white/5 mt-4">
                <p className="text-xs text-neutral-600">
                  Timewise Calendar <span className="text-neutral-500">v1.2.1</span>
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
