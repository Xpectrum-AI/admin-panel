import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

const LIVE_API_BASE_URL = "http://voice-integration-alb-test-883972788.us-west-1.elb.amazonaws.com" //process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://multiagents.livekit.xpectrum-ai.com';
const LIVE_API_KEY = "xpectrum-ai@123" //process.env.NEXT_PUBLIC_API_KEY || '';

class DoctorBackendService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': LIVE_API_KEY
    };
  }

  async createDoctor(data: DoctorCreateRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create doctor: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Doctor created successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create doctor');
    }
  }

  async getDoctor(doctorId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to get doctor: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Doctor retrieved successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get doctor');
    }
  }

  async updateDoctor(doctorId: string, data: DoctorUpdateRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update doctor: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Doctor updated successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update doctor');
    }
  }

  async patchDoctor(doctorId: string, data: Partial<DoctorUpdateRequest>): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to patch doctor: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Doctor patched successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to patch doctor');
    }
  }

  async getDoctorsByOrg(orgId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/organization/${orgId}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to get organization doctors: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Organization doctors retrieved successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get organization doctors');
    }
  }

  async deleteDoctor(doctorId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete doctor: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        status: 'success',
        message: 'Doctor deleted successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete doctor');
    }
  }
}

export const doctorBackendService = new DoctorBackendService(); 