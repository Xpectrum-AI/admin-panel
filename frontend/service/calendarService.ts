const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export const calendarService = {
  async createCalendar(data: any): Promise<any> {
    const response = await fetch(`/api/calendar/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create calendar');
    }

    const result = await response.json();
    return result.data || result;
  },

  async getDoctorCalendar(doctorId: string): Promise<any> {
    const response = await fetch(`/api/calendar/doctor/${doctorId}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get doctor calendar');
    }

    const result = await response.json();
    return result.data || result;
  },

  async getOrgCalendars(organizationId: string): Promise<any> {
    const response = await fetch(`/api/calendar/organization/${organizationId}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get organization calendars');
    }

    const result = await response.json();
    return result.data || result;
  },

  async shareCalendar(data: any): Promise<any> {
    const response = await fetch(`/api/calendar/share`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to share calendar');
    }

    const result = await response.json();
    return result.data || result;
  }
};