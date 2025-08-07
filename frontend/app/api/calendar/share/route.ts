import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await calendarController.shareCalendar(body);
    return createSuccessResponse(result, 'Calendar shared successfully');
  } catch (error: any) {
    return handleApiError(error, 'Calendar Share API');
  }
} 