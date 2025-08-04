import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/lib/controllers/doctorController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    const result = await doctorController.getDoctorsByOrg(orgId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/doctor/organization/[orgId]:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 