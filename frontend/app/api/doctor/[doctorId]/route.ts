import { NextRequest, NextResponse } from 'next/server';
import { doctorController } from '@/lib/controllers/doctorController';

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { doctorId } = params;
    
    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    const result = await doctorController.getDoctor(doctorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/doctor/[doctorId]:', error);
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { doctorId } = params;
    const data = await request.json();
    
    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    const result = await doctorController.updateDoctor(doctorId, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PUT /api/doctor/[doctorId]:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { doctorId } = params;
    
    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }
    
    const result = await doctorController.deleteDoctor(doctorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/doctor/[doctorId]:', error);
    
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