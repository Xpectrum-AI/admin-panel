export interface Agent {
  agentId: string;
  chatbot_api?: string;
  chatbot_key?: string;
  tts_config?: {
    voice_id?: string;
    tts_api_key?: string;
    model?: string;
    speed?: number;
  };
  stt_config?: {
    api_key?: string;
    model?: string;
    language?: string;
  };
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
  attendees?: any[];
  description?: string;
} 