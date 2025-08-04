import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

// Frontend service for React components
export const doctorApiService = {
  // Create a new doctor
  async createDoctor(data: DoctorCreateRequest): Promise<{ doctor: any }> {
    const response = await fetch('/api/doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create doctor');
    }

    return await response.json();
  },

  // Get a single doctor by ID
  async getDoctor(doctorId: string): Promise<DoctorResponse> {
    const response = await fetch(`/api/doctor/${doctorId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get doctor');
    }

    return await response.json();
  },

  // Update a doctor (full update)
  async updateDoctor(doctorId: string, data: DoctorUpdateRequest): Promise<{ updated_doctor: any }> {
    const response = await fetch(`/api/doctor/${doctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update doctor');
    }

    return await response.json();
  },

  // Get all doctors in an organization
  async getDoctorsByOrg(orgId: string): Promise<OrganizationDoctorsResponse> {
    const response = await fetch(`/api/doctor/organization/${orgId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get organization doctors');
    }

    return await response.json();
  },

  // Get doctors by organization (alternative method using query params)
  async getDoctorsByOrgQuery(orgId: string): Promise<OrganizationDoctorsResponse> {
    const response = await fetch(`/api/doctor?organization_id=${orgId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get organization doctors');
    }

    return await response.json();
  },

  // Delete a doctor
  async deleteDoctor(doctorId: string): Promise<DeleteDoctorResponse> {
    const response = await fetch(`/api/doctor/${doctorId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete doctor');
    }

    return await response.json();
  },

  // Get all doctors (admin functionality)
  async getAllDoctors(): Promise<{ doctors: any[] }> {
    const response = await fetch('/api/doctor');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get all doctors');
    }

    return await response.json();
  }
}; 