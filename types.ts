
export enum ViewMode {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
}

export enum EventType {
  CLASS = 'CLASS',
  STUDY = 'STUDY',
  EXAM = 'EXAM',
  SOCIAL = 'SOCIAL',
  GYM = 'GYM',
  WORK = 'WORK',
  MEETING = 'MEETING',
  OTHER = 'OTHER',
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: EventType;
  color?: string; // Hex override
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  isGoogleConnected: boolean;
  hasCompletedTour: boolean;
}

export interface AnalyticsData {
  name: string;
  value: number;
  color: string;
}
