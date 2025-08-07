const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export const eventService = {
  async createEvent(data: any): Promise<any> {
    const response = await fetch(`/api/event/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create event');
    }

    const result = await response.json();
    return result.data || result;
  },

  async listEvents(calendarId: string, upcomingOnly: boolean = true): Promise<any> {
    const params = new URLSearchParams({
      calendar_id: calendarId,
      upcoming_only: upcomingOnly.toString()
    });

    const response = await fetch(`/api/event/list?${params.toString()}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to list events');
    }

    const result = await response.json();
    return result.data || result;
  },

  async updateEvent(data: any): Promise<any> {
    const response = await fetch(`/api/event/update`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update event');
    }

    const result = await response.json();
    return result.data || result;
  },

  async deleteEvent(calendarId: string, eventId: string): Promise<any> {
    const params = new URLSearchParams({
      calendar_id: calendarId,
      event_id: eventId
    });

    const response = await fetch(`/api/event/delete?${params.toString()}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete event');
    }

    const result = await response.json();
    return result.data || result;
  }
}; 