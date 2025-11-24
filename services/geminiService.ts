import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CalendarEvent } from "../types";

// Initialize Gemini Client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Schema for scheduling suggestions
const scheduleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startIso: {
            type: Type.STRING,
            description: "ISO string of start time",
          },
          endIso: { type: Type.STRING, description: "ISO string of end time" },
          reason: {
            type: Type.STRING,
            description: "Why this slot was chosen",
          },
        },
        required: ["title", "startIso", "endIso", "reason"],
      },
    },
  },
};

// Schema for single event extraction
const eventExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    startIso: { type: Type.STRING, description: "ISO string of start time" },
    endIso: { type: Type.STRING, description: "ISO string of end time" },
    description: { type: Type.STRING },
    type: {
      type: Type.STRING,
      enum: [
        "CLASS",
        "STUDY",
        "EXAM",
        "SOCIAL",
        "GYM",
        "WORK",
        "MEETING",
        "OTHER",
      ],
    },
  },
  required: ["title", "startIso", "endIso", "type"],
};

export const getScheduleSuggestions = async (
  existingEvents: CalendarEvent[],
  taskDescription: string,
  durationMinutes: number
) => {
  if (!apiKey) return null;

  const now = new Date();
  const eventsContext = JSON.stringify(
    existingEvents.map((e) => ({
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
    }))
  );

  const prompt = `
    Current Date/Time: ${now.toISOString()}
    User Task: "${taskDescription}"
    Duration: ${durationMinutes} minutes.

    Existing Schedule:
    ${eventsContext}

    Find 3 optimal time slots for this task within the next 3 days.
    Avoid overlapping with existing events.
    Prioritize typical study hours (9am - 9pm).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleResponseSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching schedule suggestions:", error);
    return null;
  }
};

export const parseSmartTask = async (text: string) => {
  if (!apiKey) return null;

  const now = new Date();
  const prompt = `
    Current Date/Time: ${now.toISOString()}
    User Input: "${text}"
    
    Extract a calendar event from the input. 
    - If time is missing, assume 9:00 AM on the mentioned date.
    - If date is missing, assume today or tomorrow based on context.
    - If duration is missing, assume 1 hour.
    - Infer the Event Type (CLASS, STUDY, EXAM, SOCIAL, GYM, WORK, MEETING, OTHER) based on keywords.
    - Provide a short description if context is available.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventExtractionSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error parsing smart task:", error);
    return null;
  }
};

export const askCalendarAgent = async (
  existingEvents: CalendarEvent[],
  question: string
) => {
  if (!apiKey) return "API Key missing. Please configure your environment.";

  const eventsContext = JSON.stringify(
    existingEvents.map((e) => ({
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      type: e.type,
    }))
  );

    const systemInstruction = `
    You are a Calendar AI Assistant. Your ONLY responsibilities are:
    - Reading the user's calendar data
    - Checking availability
    - Creating, modifying, moving, or deleting events ONLY when explicitly requested
    - Answering direct questions about their schedule
    - Giving brief, high-signal insights about patterns or conflicts
    
    CRITICAL CONTEXT:
    - Current Year: ${new Date().getFullYear()}
    - Current Date: ${new Date().toDateString()}
    - User's Timezone: Assume local time unless specified otherwise
    
    SCHEDULE DATA:
    ${eventsContext}
    
    DO NOT:
    - Give generic advice
    - Create events without explicit permission
    - Guess missing details (duration, date, time, title)
    - Add productivity tips unless asked
    - Answer questions outside calendar/time/scheduling
    
    DECISION SEQUENCE - Follow this every time:
    
    1. INTERPRET INTENT - Classify the prompt into:
       • Check availability
       • Find a time slot
       • Summarize schedule
       • Modify events
       • Create events
       • Conflict detection
       • General insights
       If it doesn't fit, ask for clarification.
    
    2. IF DETAILS ARE MISSING, ALWAYS ASK BEFORE ACTING
       Missing details include:
       • Duration
       • Date
       • Title
       • Ambiguous time range ("sometime this afternoon")
       • Conflicting instructions
       Never assume. Always ask.
    
    3. GIVE THE ANSWER IN THE MOST COMPACT FORM POSSIBLE
       • Max 2–4 sentences
       • No small talk, no filler
       • Use plain text only (NO markdown bolding, italics, or headers)
       • Use clear line breaks between thoughts
    
    OUTPUT FORMAT:
    [Direct answer]
    
    [Relevant times in user's timezone]
    
    [If needed: one clarifying question]
    
    [Optional: single insight about conflicts or patterns]
    
    EXAMPLES:
    
    User: "Can I fit a meeting with John this week?"
    You: "What's the meeting duration and preferred days? I'll scan your week once I have that."
    
    User: "Lunch with Sarah tomorrow?"
    You: "You're free between 12:00–14:00 tomorrow. Want me to add an event for 1 hour? If yes, what time?"
    
    User: "What do I have today?"
    You: "Today's schedule:
    
    9:00 AM - 10:30 AM: Team Meeting
    2:00 PM - 3:00 PM: Code Review
    
    You're free after 3 PM."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Schedule Data: ${eventsContext}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error asking calendar agent:", error);
    return "I'm having trouble accessing the calendar intelligence right now.";
  }
};
