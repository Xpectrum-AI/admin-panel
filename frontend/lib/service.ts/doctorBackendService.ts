import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

const LIVE_API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://multiagents.livekit.xpectrum-ai.com';
const LIVE_API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

class DoctorBackendService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': LIVE_API_KEY
    };
  }

  async createDoctor(data: DoctorCreateRequest): Promise<{ doctor: any }> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create doctor: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getDoctor(doctorId: string): Promise<DoctorResponse> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get doctor: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async updateDoctor(doctorId: string, data: DoctorUpdateRequest): Promise<{ updated_doctor: any }> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update doctor: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async patchDoctor(doctorId: string, data: Partial<DoctorUpdateRequest>): Promise<DoctorResponse> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to patch doctor: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getDoctorsByOrg(orgId: string): Promise<OrganizationDoctorsResponse> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/organization/${orgId}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get organization doctors: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async deleteDoctor(doctorId: string): Promise<DeleteDoctorResponse> {
    const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete doctor: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const doctorBackendService = new DoctorBackendService(); 