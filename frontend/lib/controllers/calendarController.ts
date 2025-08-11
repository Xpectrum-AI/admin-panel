const LIVE_API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d1fs86umxjjz67.cloudfront.net';
const LIVE_API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

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

export const calendarController = {
  async createCalendar(data: CreateCalendarRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validate required fields
      if (!data.doctor_id || !data.user_name || !data.timezone) {
        throw new Error('Missing required fields: doctor_id, user_name, timezone');
      }

      const url = `${LIVE_API_BASE_URL}/calendar/create`;
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

      const result = await response.json();
      return {
        status: 'success',
        message: 'Calendar created successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create calendar');
    }
  },

  async getDoctorCalendar(doctorId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }

      const url = `${LIVE_API_BASE_URL}/calendar/doctor/${doctorId}`;
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
        message: 'Doctor calendar retrieved successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get doctor calendar');
    }
  },

  async getOrgCalendars(organizationId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const url = `${LIVE_API_BASE_URL}/calendar/organization/${organizationId}`;
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
        message: 'Organization calendars retrieved successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get organization calendars');
    }
  },

  async shareCalendar(data: ShareCalendarRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validate required fields
      if (!data.calendar_id || !data.share_email || !data.role) {
        throw new Error('Missing required fields: calendar_id, share_email, role');
      }

      const url = `${LIVE_API_BASE_URL}/calendar/share`;
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

      const result = await response.json();
      return {
        status: 'success',
        message: 'Calendar shared successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to share calendar');
    }
  }
}; 