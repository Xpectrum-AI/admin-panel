const LIVE_API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || '';
const LIVE_API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

export interface CreateEventRequest {
  calendar_id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface UpdateEventRequest {
  calendar_id: string;
  event_id: string;
  summary?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
  attendee_email?: string;
  event_type?: string;
  timezone?: string;
}

export interface EventResponse {
  event_id: string;
  message: string;
}

export interface ListEventsRequest {
  calendar_id: string;
  upcoming_only?: boolean;
}

export interface ListEventsResponse {
  events: any[];
}

export const eventController = {
  async createEvent(data: CreateEventRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      console.log('EventController: Creating event with data:', data);
      
      // Validate required fields
      if (!data.calendar_id || !data.summary || !data.start || !data.end) {
        throw new Error('Missing required fields: calendar_id, summary, start, end');
      }

      const url = `${LIVE_API_BASE_URL}/event/create`;
      console.log('EventController: Sending request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LIVE_API_KEY,
        },
        body: JSON.stringify(data),
      });

      console.log('EventController: Response status:', response.status);
      console.log('EventController: Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('EventController: Error response:', errorData);
        const error = new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const result = await response.json();
      console.log('EventController: Success response:', result);
      return {
        status: 'success',
        message: 'Event created successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event');
    }
  },

  async listEvents(data: ListEventsRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validate required fields
      if (!data.calendar_id) {
        throw new Error('Missing required field: calendar_id');
      }

      const params = new URLSearchParams({
        calendar_id: data.calendar_id,
        upcoming_only: data.upcoming_only ? 'true' : 'false'
      });

      const url = `${LIVE_API_BASE_URL}/event/list?${params.toString()}`;
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

      const result = await response.json();
      return {
        status: 'success',
        message: 'Events retrieved successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list events');
    }
  },

  async updateEvent(data: UpdateEventRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validate required fields
      if (!data.calendar_id || !data.event_id) {
        throw new Error('Missing required fields: calendar_id, event_id');
      }

      // Validate at least one field is provided for update
      const hasUpdates = Object.keys(data).some(key => 
        key !== 'calendar_id' && key !== 'event_id' && data[key as keyof UpdateEventRequest] !== undefined
      );
      if (!hasUpdates) {
        throw new Error('At least one field must be provided for update');
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

      const result = await response.json();
      return {
        status: 'success',
        message: 'Event updated successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update event');
    }
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validate required fields
      if (!calendarId || !eventId) {
        throw new Error('Missing required fields: calendar_id, event_id');
      }

      const params = new URLSearchParams({
        calendar_id: calendarId,
        event_id: eventId
      });

      const url = `${LIVE_API_BASE_URL}/event/delete?${params.toString()}`;
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

      const result = await response.json();
      return {
        status: 'success',
        message: 'Event deleted successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete event');
    }
  }
}; 