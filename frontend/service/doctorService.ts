import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

const API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

function unwrapData(obj: any): any {
  // Recursively unwrap if the object has only status/message/data keys and data is an object
  while (
    obj &&
    typeof obj === 'object' &&
    Object.keys(obj).length <= 3 &&
    'data' in obj &&
    (('status' in obj && typeof obj.status === 'string') || ('message' in obj && typeof obj.message === 'string'))
  ) {
    obj = obj.data;
  }
  return obj;
}

// Frontend service for React components
export const doctorApiService = {
  // Create a new doctor
  async createDoctor(data: any): Promise<any> {
    const response = await fetch('/api/doctor', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create doctor');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Get a single doctor by ID
  async getDoctor(doctorId: string): Promise<any> {
    const response = await fetch(`/api/doctor/${doctorId}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get doctor');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Update a doctor (full update)
  async updateDoctor(doctorId: string, data: any): Promise<any> {
    const response = await fetch(`/api/doctor/${doctorId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update doctor');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Get all doctors in an organization
  async getDoctorsByOrg(orgId: string): Promise<any> {
    const response = await fetch(`/api/doctor/organization/${orgId}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get organization doctors');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Get doctors by organization (alternative method using query params)
  async getDoctorsByOrgQuery(orgId: string): Promise<any> {
    const response = await fetch(`/api/doctor?organization_id=${orgId}`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get organization doctors');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Delete a doctor
  async deleteDoctor(doctorId: string): Promise<any> {
    const response = await fetch(`/api/doctor/${doctorId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete doctor');
    }

    const result = await response.json();
    return unwrapData(result);
  },

  // Get all doctors (admin functionality)
  async getAllDoctors(): Promise<any> {
    const response = await fetch('/api/doctor', {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get all doctors');
    }

    const result = await response.json();
    return unwrapData(result);
  }
}; 