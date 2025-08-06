const LIVE_API_BASE_URL = "http://voice-integration-alb-test-883972788.us-west-1.elb.amazonaws.com" //process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://multiagents.livekit.xpectrum-ai.com';
const LIVE_API_KEY = "xpectrum-ai@123" //process.env.NEXT_PUBLIC_API_KEY || '';

export interface CreateEventRequest {
  calendar_id: string;
  summary: string;
  start: string;
  end: string;
  attendee_email?: string;
}

export interface UpdateEventRequest {
  calendar_id: string;
  event_id: string;
  summary: string;
  start: string;
  end: string;
}

export interface EventResponse {
  event_id: string;
  summary: string;
  start: string;
  end: string;
  attendee_email?: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface ListEventsResponse {
  events: any[];
  total_count: number;
  source: string;
  calendar_id: string;
}

export interface DeleteEventResponse {
  status: string;
  google_calendar_id: string;
}

export const eventController = {
  async createEvent(data: CreateEventRequest): Promise<EventResponse> {
    if (!data.calendar_id || !data.summary || !data.start || !data.end) {
      throw new Error('Missing required fields: calendar_id, summary, start, end');
    }

    const url = `${LIVE_API_BASE_URL}/event/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIVE_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async listEvents(calendarId: string, upcomingOnly: boolean = true): Promise<ListEventsResponse> {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    const url = `${LIVE_API_BASE_URL}/event/list?calendar_id=${encodeURIComponent(calendarId)}&upcoming_only=${upcomingOnly}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIVE_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async updateEvent(data: UpdateEventRequest): Promise<EventResponse> {
    if (!data.calendar_id || !data.event_id || !data.summary || !data.start || !data.end) {
      throw new Error('Missing required fields: calendar_id, event_id, summary, start, end');
    }

    const url = `${LIVE_API_BASE_URL}/event/update`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIVE_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<DeleteEventResponse> {
    if (!calendarId || !eventId) {
      throw new Error('Calendar ID and Event ID are required');
    }

    const url = `${LIVE_API_BASE_URL}/event/delete?calendar_id=${encodeURIComponent(calendarId)}&event_id=${encodeURIComponent(eventId)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIVE_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },
}; 