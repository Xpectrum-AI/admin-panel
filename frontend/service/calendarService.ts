const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8086/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'xpectrum-ai@123';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
};

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
  async getServices(): Promise<{ success: boolean; services?: CalendarService[]; stats?: ServiceStats; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar`, { headers });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to connect to server' };
    }
  },

  // Create new calendar service
  async createService(data: CreateServiceData): Promise<{ success: boolean; service?: CalendarService; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to create service' };
    }
  },

  // Update existing service
  async updateService(id: string, data: UpdateServiceData): Promise<{ success: boolean; service?: CalendarService; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/services/calendar/${id}`, {
        method: 'PUT',
        headers,
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
        headers
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
        headers,
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
      const response = await fetch(`${API_BASE}/services/calendar/${id}`, { headers });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to fetch service' };
    }
  }
}; 