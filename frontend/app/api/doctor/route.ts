import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/lib/controllers/doctorController';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    
    if (orgId) {
      // Get doctors by organization
      const result = await doctorController.getDoctorsByOrg(orgId);
      return NextResponse.json(result);
    }
    
    // Get all doctors (admin functionality)
    const result = await doctorController.getAllDoctors();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/doctor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.doctor_id || !data.first_name || !data.last_name || !data.organization_id) {
      return NextResponse.json(
        { error: 'Missing required fields: doctor_id, first_name, last_name, organization_id' },
        { status: 400 }
      );
    }
    
    const result = await doctorController.createDoctor(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/doctor:', error);
    
    // Handle specific validation errors
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    if (error.message.includes('Missing required fields') || error.message.includes('must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 