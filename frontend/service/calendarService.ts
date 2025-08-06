const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export interface CreateCalendarRequest {
  doctor_id: string;
  user_name: string;
  timezone: string;
}

export interface ShareCalendarRequest {
  calendar_id: string;
  share_email: string;
  role: string;
}

export interface GoogleCalendarResponse {
  message: string;
  calendar_id: string;
}

export interface DoctorCalendarResponse {
  calendar: any;
}

export interface OrgCalendarsResponse {
  organization_id: string;
  total_doctors: number;
  calendars: any[];
}

export interface ShareCalendarResponse {
  message: string;
  google_calendar_shared: boolean;
  local_database_updated: boolean;
}

export interface CalendarEventsResponse {
  calendar_id: string;
  events: any[];
}

export const calendarService = {
  async createCalendar(data: CreateCalendarRequest): Promise<GoogleCalendarResponse> {
    const response = await fetch(`/api/calendar/create`, {
      method: 'POST',
      headers,
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

  async getDoctorCalendar(doctorId: string): Promise<DoctorCalendarResponse> {
    const response = await fetch(`/api/calendar/doctor/${doctorId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async getOrgCalendars(organizationId: string): Promise<OrgCalendarsResponse> {
    const response = await fetch(`/api/calendar/organization/${organizationId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  },

  async shareCalendar(data: ShareCalendarRequest): Promise<ShareCalendarResponse> {
    const response = await fetch(`/api/calendar/share`, {
      method: 'POST',
      headers,
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
}