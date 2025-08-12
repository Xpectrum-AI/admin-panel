import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

const LIVE_API_BASE_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || '';
const LIVE_API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

// Helper function to get headers
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'x-api-key': LIVE_API_KEY
  };
};

export const doctorController = {

  // Create doctor
  async createDoctor(data: DoctorCreateRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Validation
      if (!data.doctor_id || !data.first_name || !data.last_name || !data.organization_id) {
        throw new Error('Missing required fields: doctor_id, first_name, last_name, organization_id');
      }

      // Validate doctor_id format (you can customize this)
      if (data.doctor_id.length < 3) {
        throw new Error('Doctor ID must be at least 3 characters long');
      }

      // Validate names
      if (data.first_name.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      if (data.last_name.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters long');
      }

      // Validate organization_id
      if (!data.organization_id.trim()) {
        throw new Error('Organization ID is required');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/create`, {
        method: 'POST',
        headers: getHeaders(),
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
  },

  // Get single doctor
  async getDoctor(doctorId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!doctorId || doctorId.trim() === '') {
        throw new Error('Doctor ID is required');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        headers: getHeaders()
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
  },

  // Update doctor
  async updateDoctor(doctorId: string, data: DoctorUpdateRequest): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!doctorId || doctorId.trim() === '') {
        throw new Error('Doctor ID is required');
      }

      // Validate at least one field is provided
      const hasUpdates = Object.keys(data).some(key => data[key as keyof DoctorUpdateRequest] !== undefined);
      if (!hasUpdates) {
        throw new Error('At least one field must be provided for update');
      }

      // Validate individual fields if provided
      if (data.first_name !== undefined && data.first_name.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      if (data.last_name !== undefined && data.last_name.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters long');
      }

      if (data.organization_id !== undefined && !data.organization_id.trim()) {
        throw new Error('Organization ID cannot be empty');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'PUT',
        headers: getHeaders(),
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
  },

  // Patch doctor
  async patchDoctor(doctorId: string, data: Partial<DoctorUpdateRequest>): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!doctorId || doctorId.trim() === '') {
        throw new Error('Doctor ID is required');
      }

      // Validate at least one field is provided
      const hasUpdates = Object.keys(data).some(key => data[key as keyof DoctorUpdateRequest] !== undefined);
      if (!hasUpdates) {
        throw new Error('At least one field must be provided for update');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'PATCH',
        headers: getHeaders(),
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
  },

  // Get doctors by organization
  async getDoctorsByOrg(orgId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!orgId || orgId.trim() === '') {
        throw new Error('Organization ID is required');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/organization/${orgId}`, {
        headers: getHeaders()
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
  },

  // Delete doctor
  async deleteDoctor(doctorId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!doctorId || doctorId.trim() === '') {
        throw new Error('Doctor ID is required');
      }

      // API call
      const response = await fetch(`${LIVE_API_BASE_URL}/doctor/${doctorId}`, {
        method: 'DELETE',
        headers: getHeaders()
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
  },

  // Get all doctors (if needed for admin purposes)
  async getAllDoctors(): Promise<{ status: string; message: string; data?: any }> {
    try {
      // This would need to be implemented in your FastAPI backend
      // For now, returning empty array
      return {
        status: 'success',
        message: 'All doctors retrieved successfully',
        data: { doctors: [] }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get all doctors');
    }
  },

  // Search doctors
  async searchDoctors(query: string, orgId?: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      // This would need to be implemented in your FastAPI backend
      // For now, returning empty array
      return {
        status: 'success',
        message: 'Doctors search completed successfully',
        data: { doctors: [] }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search doctors');
    }
  },
}; 