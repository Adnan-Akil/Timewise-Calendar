import { CalendarEvent, EventType } from "../types";

// --- CONFIGURATION ---
// Get credentials from environment variables
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GOOGLE_API_KEY";

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Global type definition hack for gapi/google since we don't have @types installed in this env
declare var gapi: any;
declare var google: any;

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
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          console.log("GAPI initialized successfully");
          if (gisInited) callback();
        } catch (e) {
          console.error("Error initializing GAPI client:", e);
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
    } else {
      checkGapi();
      checkGis();
    }
  }, 500);

  // Stop polling after 10 seconds to avoid infinite checking
  setTimeout(() => clearInterval(interval), 10000);
};

export const handleAuthClick = async (): Promise<boolean> => {
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
      resolve(true);
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      console.log("Requesting new access token with consent");
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      console.log("Requesting access token without consent prompt");
      tokenClient.requestAccessToken({ prompt: "" });
    }
  });
};

export const handleSignOut = () => {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
  }
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

export const listUpcomingEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const request = {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 50,
      orderBy: "startTime",
      // CRITICAL: This parameter limits the response to strictly the fields we need.
      // This minimizes data transfer and ensures no unwanted PII is fetched.
      fields: "items(id, summary, description, start, end)",
    };

    const response = await gapi.client.calendar.events.list(request);
    const events = response.result.items;

    if (!events || events.length === 0) {
      return [];
    }

    return events.map(mapGoogleEventToAppEvent);
  } catch (err) {
    console.error("Error fetching Google Calendar events", err);
    return [];
  }
};
