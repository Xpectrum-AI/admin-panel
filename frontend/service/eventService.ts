const API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export const eventService = {
  async createEvent(data: any): Promise<any> {
    console.log('EventService: Creating event with data:', data);
    
    const response = await fetch(`/api/event/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    console.log('EventService: Response status:', response.status);
    console.log('EventService: Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('EventService: Error response:', errorData);
      throw new Error(errorData.error || 'Failed to create event');
    }

    const result = await response.json();
    console.log('EventService: Success response:', result);
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
    
    // Handle nested response structure
    let eventsData;
    console.log('Raw API response:', result);
    console.log('Events count in response:', result.data?.data?.events?.length || result.data?.events?.length || result.events?.length || 'No events array found');
    
    // Check for the specific nested structure from your API
    if (result.data && result.data.data && result.data.data.events) {
      eventsData = result.data.data;
      console.log('Found nested structure level 2');
    } else if (result.data && result.data.events) {
      eventsData = result.data;
      console.log('Found nested structure level 1');
    } else if (result.events) {
      eventsData = result;
      console.log('Found flat structure');
    } else {
      eventsData = result.data || result;
      console.log('Using fallback structure');
    }
    
    console.log('Extracted events data:', eventsData);
    console.log('Final events count:', eventsData.events?.length || 0);
    
    // Transform event_id to id for frontend compatibility
    if (eventsData.events && Array.isArray(eventsData.events)) {
      console.log('Original events:', eventsData.events);
      eventsData.events = eventsData.events.map((event: any) => {
        const transformedEvent = {
          ...event,
          id: event.event_id || event.id
        };
        console.log('Transformed event:', transformedEvent);
        return transformedEvent;
      });
      console.log('Final transformed events:', eventsData.events);
    } else {
      console.log('No events array found in eventsData:', eventsData);
    }
    
    return eventsData;
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
  },

  async syncGoogleCalendarEvents(calendarId: string): Promise<any> {
    const response = await fetch(`/api/event/sync-google?calendar_id=${calendarId}`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to refresh events');
    }
    const result = await response.json();
    return result.data || result;
  },

  async fetchGoogleCalendarEvents(calendarId: string): Promise<any> {
    try {
      // Fetch events directly from Google Calendar API
      const response = await fetch(`/api/event/fetch-google?calendar_id=${calendarId}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Google Calendar events');
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }
}; 