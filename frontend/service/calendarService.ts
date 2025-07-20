const API_BASE = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://admin-test.xpectrum-ai.com/';

export interface CalendarService {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  timezone: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  event_count: number;
}

export interface ServiceStats {
  total_services: number;
  active_services: number;
  total_events: number;
  total_users: number;
}

export interface CreateServiceData {
  name: string;
  description: string;
  timezone: string;
}

export interface UpdateServiceData {
  name: string;
  description: string;
  timezone: string;
}

export const calendarServiceAPI = {
  // Fetch all calendar services
  async getServices(token: string): Promise<{ success: boolean; calendars?: any[]; events?: any[]; timezone?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/calendar/events`, { headers : { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        return { success: false, error: 'Failed to fetch data from server' };
      }
      const data = await response.json();
      return {
        success: true,
        calendars: data.calendars,
        events: data.events,
        timezone: data.timezone
      };
    } catch (error) {
      return { success: false, error: 'Failed to connect to server' };
    }
  },

  // Create new calendar service
  async createService(token: string, data: any): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/calendar/events`, {
        method: 'POST',
        headers : { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } ,
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok && result.event) {
        return { success: true, event: result.event };
      } else {
        return { success: false, error: result.error || result.message || 'Failed to create event' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create service' };
    }
  },

  // Update existing service
  async updateService(id: string, data: UpdateServiceData): Promise<{ success: boolean; service?: CalendarService; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to update service' };
    }
  },

  // Delete service
  async deleteService(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete service' };
    }
  },

  // Toggle service status
  async toggleStatus(id: string, status: 'active' | 'inactive'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to update service status' };
    }
  },

  // Get service by ID
  async getService(id: string): Promise<{ success: boolean; service?: CalendarService; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar/${id}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to fetch service' };
    }
  },

  // Get user info
  async getUser(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return { user: null };
    }
  },

  // Get calendar access
  async getCalendarAccess(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/calendar/access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return { has_calendar_access: false };
    }
  },

  // Buy service
  async buyService(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/buy-service`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return { redirect_url: '' };
    }
  },

  // Update user timezone
  async updateUserTimezone(token: string, timezone: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/update-user-timezone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timezone })
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  },

  // Logout
  async logout(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  }
}; 