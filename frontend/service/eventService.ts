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
    
    // Handle nested response structure
    let eventsData;
    console.log('Raw API response:', result);
    
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
  }
}; 