import { doctorBackendService } from '@/lib/service.ts/doctorBackendService';
import { 
  DoctorCreateRequest, 
  DoctorUpdateRequest, 
  DoctorResponse, 
  OrganizationDoctorsResponse,
  DeleteDoctorResponse 
} from '@/types/doctor';

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

      const result = await doctorBackendService.createDoctor(data);
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

      const result = await doctorBackendService.getDoctor(doctorId);
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

      const result = await doctorBackendService.updateDoctor(doctorId, data);
      return {
        status: 'success',
        message: 'Doctor updated successfully',
        data: result
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update doctor');
    }
  },

  // Get doctors by organization
  async getDoctorsByOrg(orgId: string): Promise<{ status: string; message: string; data?: any }> {
    try {
      if (!orgId || orgId.trim() === '') {
        throw new Error('Organization ID is required');
      }

      const result = await doctorBackendService.getDoctorsByOrg(orgId);
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

      const result = await doctorBackendService.deleteDoctor(doctorId);
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