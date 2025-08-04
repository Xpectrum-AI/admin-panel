import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctor_id: string }> }
) {
  try {
    const { doctor_id } = await params;
    const result = await calendarController.getDoctorCalendar(doctor_id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get doctor calendar error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get doctor calendar' },
      { status: error.status || 500 }
    );
  }
} 