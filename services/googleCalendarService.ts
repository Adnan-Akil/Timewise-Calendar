import { CalendarEvent, EventType } from "../types";

// --- CONFIGURATION ---
// Get credentials from environment variables
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_GOOGLE_API_KEY";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar";

// Debug: Log environment variable status (remove in production)
console.log('Environment check:', {
  hasClientId: !!CLIENT_ID && CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID',
  hasApiKey: !!API_KEY && API_KEY !== 'YOUR_GOOGLE_API_KEY',
  clientIdPreview: CLIENT_ID?.substring(0, 20) + '...',
});


let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let calendarApiLoaded = false;
let currentAccessToken: any = null;

// Storage keys for persistent auth
const AUTH_STORAGE_KEY = 'timewise_google_auth';
const TOKEN_EXPIRY_KEY = 'timewise_token_expiry';

// Global type definition hack for gapi/google since we don't have @types installed in this env
declare var gapi: any;
declare var google: any;

const loadCalendarApi = async () => {
  if (calendarApiLoaded) return;
  try {
    if (gapi && gapi.client) {
      // Instead of loading discovery, just mark it as ready
      // We'll use REST API calls directly
      calendarApiLoaded = true;
      console.log("Calendar API ready for use");
    }
  } catch (e) {
    console.error("Error preparing calendar API:", e);
    throw e;
  }
};

// Persist auth state to localStorage
const persistAuthState = (token: any) => {
  try {
    if (token && token.access_token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(token));
      // Tokens typically expire in 1 hour
      const expiryTime = Date.now() + (3600 * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      console.log('Auth state persisted to localStorage');
    }
  } catch (e) {
    console.error('Failed to persist auth state:', e);
  }
};

// Restore auth state from localStorage
const restoreAuthState = (): boolean => {
  try {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!storedToken || !expiryTime) {
      return false;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(expiryTime)) {
      console.log('Stored token expired, clearing...');
      clearAuthState();
      return false;
    }
    
    const token = JSON.parse(storedToken);
    if (gapi && gapi.client) {
      gapi.client.setToken(token);
      currentAccessToken = token.access_token;
      console.log('Auth state restored from localStorage');
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to restore auth state:', e);
    return false;
  }
};

// Clear auth state from localStorage
const clearAuthState = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('Auth state cleared from localStorage');
  } catch (e) {
    console.error('Failed to clear auth state:', e);
  }
};

// Check if user is already authenticated
export const checkStoredAuth = (): boolean => {
  if (!gapiInited) {
    console.log('GAPI not initialized yet, cannot check stored auth');
    return false;
  }
  return restoreAuthState();
};

export const initializeGoogleApi = (callback: () => void) => {
  // Check if credentials are configured
  if (CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || !CLIENT_ID) {
    console.error(
      "Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file"
    );
    callback();
    return;
  }

  // If already initialized, run callback immediately
  if (gapiInited && gisInited) {
    callback();
    return;
  }

  // Attempt to load GAPI client
  const checkGapi = () => {
    if (typeof gapi !== "undefined" && !gapiInited) {
      gapi.load("client", async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
          });
          // Load calendar API right after init
          await loadCalendarApi();
          gapiInited = true;
          console.log("GAPI initialized successfully with Calendar API");
          if (gisInited) callback();
        } catch (e) {
          console.error("Error initializing GAPI client:", e);
          // Mark as attempted so we don't keep retrying
          gapiInited = true;
          if (gisInited) callback();
        }
      });
    }
  };

  // Attempt to load Google Identity Services
  const checkGis = () => {
    if (typeof google !== "undefined" && !gisInited) {
      try {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: "", // defined at request time
        });
        gisInited = true;
        console.log("Google Identity Services initialized successfully");
        if (gapiInited) callback();
      } catch (e) {
        console.error("Error initializing GIS client:", e);
      }
    }
  };

  // Initial check
  checkGapi();
  checkGis();

  // Polling fallback: needed because scripts load asynchronously
  const interval = setInterval(() => {
    if (gapiInited && gisInited) {
      clearInterval(interval);
      console.log("Both GAPI and GIS are initialized");
      callback();
    } else {
      checkGapi();
      checkGis();
    }
  }, 500);

  // Stop polling after 10 seconds to avoid infinite checking
  setTimeout(() => {
    clearInterval(interval);
    if (gisInited || gapiInited) {
      console.log("Initialization completed with available services");
      callback();
    }
  }, 10000);
};

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

// ... (existing imports)

export const handleAuthClick = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      console.log("Starting native Google Sign-In...");
      await GoogleAuth.initialize();
      const user = await GoogleAuth.signIn();
      console.log("Native sign-in successful:", user);
      
      currentAccessToken = user.authentication.accessToken;
      
      // Persist auth state (optional, plugin handles some session stuff but we can sync)
      // For now, just setting the token is enough for the API calls to work if we pass it manually
      // But gapi.client won't be populated. We need to ensure our API calls use currentAccessToken.
      
      // We need to initialize gapi client manually with this token if possible, 
      // or just ensure our fetch calls use `currentAccessToken` which they do.
      
      return true;
    } catch (error) {
      console.error("Native sign-in failed:", error);
      return false;
    }
  }

  // Web Fallback
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      console.error(
        "Token client not initialized. Google scripts may not have loaded."
      );
      reject(
        new Error(
          "Google authentication client not ready. Please refresh the page."
        )
      );
      return;
    }

    if (!gapi || !gapi.client) {
      console.error("GAPI client not ready");
      reject(new Error("GAPI client not initialized"));
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        console.error("Auth Error:", resp);
        reject(new Error(`OAuth error: ${resp.error}`));
        return;
      }

      console.log("OAuth token obtained successfully");
      console.log("Token scope:", resp.scope);

      // Store the current access token
      currentAccessToken = resp.access_token;
      
      // Persist auth state to localStorage
      const token = gapi.client.getToken();
      if (token) {
        persistAuthState(token);
      }

      // Ensure calendar API is loaded after getting token
      try {
        if (!calendarApiLoaded) {
          await loadCalendarApi();
        }
        resolve(true);
      } catch (e) {
        console.error("Failed to ensure calendar API after auth:", e);
        // Still resolve true since we have the token, API loading is secondary
        resolve(true);
      }
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      console.log(
        "Requesting new access token with consent for scopes:",
        SCOPES
      );
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      console.log("Requesting access token without consent prompt");
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
};

export const handleSignOut = () => {
    if (Capacitor.isNativePlatform()) {
        GoogleAuth.signOut();
    }
    
  if (typeof gapi !== 'undefined' && gapi.client) {
    const token = gapi.client.getToken();
    if (token !== null) {
        console.log("Revoking token and signing out");
        google.accounts.oauth2.revoke(token.access_token, () => {
        console.log("Token revoked");
        });
        gapi.client.setToken("");
    }
  }
  
  currentAccessToken = null;
  calendarApiLoaded = false; // Reset calendar API flag
  clearAuthState(); // Clear from localStorage
};

// --- DATA MAPPING ---

// Maps a Google Calendar API Event resource to your app's CalendarEvent interface
const mapGoogleEventToAppEvent = (gEvent: any): CalendarEvent => {
  // Handle both specific time events and all-day events
  const start = gEvent.start.dateTime
    ? new Date(gEvent.start.dateTime)
    : new Date(gEvent.start.date);
  const end = gEvent.end.dateTime
    ? new Date(gEvent.end.dateTime)
    : new Date(gEvent.end.date);

  // Fix for all-day events or missing end times: ensure end > start
  if (end.getTime() <= start.getTime()) {
    end.setHours(end.getHours() + 1);
  }

  return {
    id: gEvent.id,
    googleId: gEvent.id,
    title: gEvent.summary || "(No Title)",
    description: gEvent.description || "", // Only capture description if present
    start: start,
    end: end,
    type: EventType.OTHER, // Default type for external events
    color: "#4285F4", // Google Blue visual indicator
  };
};

// Helper to get token (Native or Web)
const getAccessToken = () => {
    if (currentAccessToken) return currentAccessToken;
    if (typeof gapi !== 'undefined' && gapi.client) {
        const token = gapi.client.getToken();
        return token ? token.access_token : null;
    }
    return null;
};

// Fetch list of all calendars
export const listAllCalendars = async (): Promise<any[]> => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("No access token available");
      return [];
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch calendar list:', response.status);
      return [];
    }

    const data = await response.json();
    console.log(`Found ${data.items?.length || 0} calendars`);
    return data.items || [];
  } catch (err) {
    console.error('Error fetching calendar list:', err);
    return [];
  }
};

export const listUpcomingEvents = async (): Promise<CalendarEvent[]> => {
  try {
    // Ensure we have a token
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("No access token available. User must authenticate first.");
      return [];
    }

    console.log(
      "Using access token:",
      accessToken.substring(0, 20) + "..."
    );

    // First, get all calendars
    const calendars = await listAllCalendars();
    if (calendars.length === 0) {
      console.log('No calendars found');
      return [];
    }

    console.log('Fetching events from calendars:', calendars.map(c => c.summary));

    // Fetch events from 3 months ago to 1 year in future (optimized range)
    const now = new Date();
    const timeMin = new Date(
      now.getTime() - 90 * 24 * 60 * 60 * 1000 // 3 months past
    ).toISOString();
    const timeMax = new Date(
      now.getTime() + 365 * 24 * 60 * 60 * 1000 // 1 year future
    ).toISOString();

    console.log(`Fetching all calendar events from ${timeMin} to ${timeMax}`);

    let allEvents: any[] = [];

    // Fetch events from each calendar
    for (const calendar of calendars) {
      try {
        console.log(`Fetching events from calendar: ${calendar.summary} (${calendar.id})`);
        
        let pageToken: string | undefined;
        let pageCount = 0;

        // Handle pagination for each calendar
        do {
          const params = new URLSearchParams({
            timeMin: timeMin,
            timeMax: timeMax,
            showDeleted: "false",
            singleEvents: "true",
            maxResults: "2500",
            orderBy: "startTime",
          });

          if (pageToken) {
            params.append("pageToken", pageToken);
          }

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Calendar API error for ${calendar.summary}:`, response.status, errorData);
            break;
          }

          const data = await response.json();
          console.log(
            `Calendar "${calendar.summary}" page ${pageCount + 1} returned ${data.items?.length || 0} events`
          );

          if (data.items && data.items.length > 0) {
            // Add calendar info to each event
            const eventsWithCalendar = data.items.map((event: any) => ({
              ...event,
              calendarId: calendar.id,
              calendarName: calendar.summary,
              calendarColor: calendar.backgroundColor,
            }));
            allEvents = allEvents.concat(eventsWithCalendar);
          }

          pageToken = data.nextPageToken;
          pageCount++;
        } while (pageToken);

        console.log(`Finished fetching from "${calendar.summary}", total events so far: ${allEvents.length}`);
      } catch (calErr) {
        console.error(`Error fetching events from calendar ${calendar.summary}:`, calErr);
        // Continue with other calendars
      }
    }

    console.log(
      `Successfully fetched ${allEvents.length} events from ${calendars.length} Google Calendars`
    );

    if (allEvents.length === 0) {
      console.log("No events found in any calendar");
      return [];
    }

    const mappedEvents = allEvents.map((event: any) => {
      return mapGoogleEventToAppEvent(event);
    });
    console.log("Mapped events count:", mappedEvents.length);
    return mappedEvents;
  } catch (err) {
    console.error("Error fetching Google Calendar events:", err);
    return [];
  }
};

// Create a new event in Google Calendar
export const createGoogleCalendarEvent = async (
  event: CalendarEvent
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("No access token available");
      return false;
    }

    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
      },
      end: {
        dateTime: event.end.toISOString(),
      },
    };

    console.log("Creating Google Calendar event:", googleEvent);

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to create event:", response.status, errorData);
      return false;
    }

    const createdEvent = await response.json();
    console.log("Event created successfully:", createdEvent);
    return true;
  } catch (err) {
    console.error("Error creating Google Calendar event:", err);
    return false;
  }
};

// Update an event in Google Calendar
export const updateGoogleCalendarEvent = async (
  event: CalendarEvent
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("No access token available");
      return false;
    }

    if (!event.googleId) {
      console.error("Event does not have a Google Calendar ID");
      return false;
    }

    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
      },
      end: {
        dateTime: event.end.toISOString(),
      },
    };

    console.log("Updating Google Calendar event:", event.googleId, googleEvent);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to update event:", response.status, errorData);
      return false;
    }

    const updatedEvent = await response.json();
    console.log("Event updated successfully:", updatedEvent);
    return true;
  } catch (err) {
    console.error("Error updating Google Calendar event:", err);
    return false;
  }
};

// Delete an event from Google Calendar
export const deleteGoogleCalendarEvent = async (
  eventId: string
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error("No access token available");
      return false;
    }

    console.log("Deleting Google Calendar event:", eventId);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to delete event:", response.status, errorData);
      return false;
    }

    console.log("Event deleted successfully");
    return true;
  } catch (err) {
    console.error("Error deleting Google Calendar event:", err);
    return false;
  }
};
