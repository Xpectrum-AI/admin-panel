import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');
    const upcomingOnly = searchParams.get('upcoming_only') === 'true';

    if (!calendarId) {
      return handleApiError(new Error('Calendar ID is required'), 'Event List API');
    }

    const data = {
      calendar_id: calendarId,
      upcoming_only: upcomingOnly
    };

    const result = await eventController.listEvents(data);
    return createSuccessResponse(result, 'Events retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'Event List API');
  }
} 