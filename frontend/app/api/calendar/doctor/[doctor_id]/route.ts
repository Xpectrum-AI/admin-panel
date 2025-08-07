import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctor_id: string }> }
) {
  try {
    const { doctor_id } = await params;
    const result = await calendarController.getDoctorCalendar(doctor_id);
    return createSuccessResponse(result, 'Doctor calendar retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'Doctor Calendar API');
  }
} 