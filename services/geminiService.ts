import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CalendarEvent } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // Handled by environment
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
          startIso: { type: Type.STRING, description: "ISO string of start time" },
          endIso: { type: Type.STRING, description: "ISO string of end time" },
          reason: { type: Type.STRING, description: "Why this slot was chosen" },
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
      enum: ["CLASS", "STUDY", "EXAM", "SOCIAL", "GYM", "WORK", "MEETING", "OTHER"] 
    }
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
  const eventsContext = JSON.stringify(existingEvents.map(e => ({
    title: e.title,
    start: e.start.toISOString(),
    end: e.end.toISOString()
  })));

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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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

  const eventsContext = JSON.stringify(existingEvents.map(e => ({
    title: e.title,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    type: e.type
  })));

  const systemInstruction = `
    You are a smart calendar assistant for a student.
    You have access to their schedule in JSON format.
    Answer questions concisely and helpfully.
    If asked about "busy" days, analyze the density of events.
    If asked about "free" time, look for gaps.
    Tone: Professional, encouraging, helpful.
    Current Date: ${new Date().toDateString()}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: `Schedule Data: ${eventsContext}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error asking calendar agent:", error);
    return "I'm having trouble accessing the calendar intelligence right now.";
  }
};