import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await calendarController.createCalendar(body);
    return createSuccessResponse(result, 'Calendar created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'Calendar Create API');
  }
} 