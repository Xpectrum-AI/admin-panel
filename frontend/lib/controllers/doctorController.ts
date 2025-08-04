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
  async createDoctor(data: DoctorCreateRequest): Promise<{ doctor: any }> {
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

    return await doctorBackendService.createDoctor(data);
  },

  // Get single doctor
  async getDoctor(doctorId: string): Promise<DoctorResponse> {
    if (!doctorId || doctorId.trim() === '') {
      throw new Error('Doctor ID is required');
    }

    return await doctorBackendService.getDoctor(doctorId);
  },

  // Update doctor
  async updateDoctor(doctorId: string, data: DoctorUpdateRequest): Promise<{ updated_doctor: any }> {
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

    return await doctorBackendService.updateDoctor(doctorId, data);
  },

  // Get doctors by organization
  async getDoctorsByOrg(orgId: string): Promise<OrganizationDoctorsResponse> {
    if (!orgId || orgId.trim() === '') {
      throw new Error('Organization ID is required');
    }

    return await doctorBackendService.getDoctorsByOrg(orgId);
  },

  // Delete doctor
  async deleteDoctor(doctorId: string): Promise<DeleteDoctorResponse> {
    if (!doctorId || doctorId.trim() === '') {
      throw new Error('Doctor ID is required');
    }

    return await doctorBackendService.deleteDoctor(doctorId);
  },

  // Get all doctors (if needed for admin purposes)
  async getAllDoctors(): Promise<{ doctors: any[] }> {
    // This would need to be implemented in your FastAPI backend
    // For now, returning empty array
    return { doctors: [] };
  },

  // Search doctors by name
  async searchDoctors(query: string, orgId?: string): Promise<{ doctors: any[] }> {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    // This would need to be implemented in your FastAPI backend
    // For now, returning empty array
    return { doctors: [] };
  }
}; 