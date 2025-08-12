import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/lib/controllers/doctorController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    
    if (orgId) {
      // Get doctors by organization
      const result = await doctorController.getDoctorsByOrg(orgId);
      return createSuccessResponse(result, 'Doctors retrieved successfully');
    }
    
    // Get all doctors (admin functionality)
    const result = await doctorController.getAllDoctors();
    return createSuccessResponse(result, 'All doctors retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'Doctor GET API');
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.doctor_id || !data.first_name || !data.last_name || !data.organization_id) {
      return handleApiError(new Error('Missing required fields: doctor_id, first_name, last_name, organization_id'), 'Doctor POST API');
    }
    
    const result = await doctorController.createDoctor(data);
    return createSuccessResponse(result, 'Doctor created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'Doctor POST API');
  }
} 