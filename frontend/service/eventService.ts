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

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

export const eventService = {
  async createEvent(data: CreateEventRequest): Promise<EventResponse> {
    const response = await fetch(`/api/event/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async listEvents(calendarId: string, upcomingOnly: boolean = true): Promise<ListEventsResponse> {
    const response = await fetch(`/api/event/list?calendar_id=${encodeURIComponent(calendarId)}&upcoming_only=${upcomingOnly}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async updateEvent(data: UpdateEventRequest): Promise<EventResponse> {
    const response = await fetch(`/api/event/update`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<DeleteEventResponse> {
    const response = await fetch(`/api/event/delete?calendar_id=${encodeURIComponent(calendarId)}&event_id=${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },
}; 