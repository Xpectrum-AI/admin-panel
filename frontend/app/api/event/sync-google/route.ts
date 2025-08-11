import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');

    if (!calendarId) {
      return handleApiError(new Error('Calendar ID is required'), 'Event Sync API');
    }

    // Fetch events from backend
    const backendData = {
      calendar_id: calendarId,
      upcoming_only: false
    };

    const backendResult = await eventController.listEvents(backendData);
    
    // For now, just return the backend events
    // TODO: Implement Google Calendar API integration to fetch events from Google Calendar
    // and merge them with backend events
    
    return createSuccessResponse(backendResult, 'Events synced successfully');
  } catch (error: any) {
    return handleApiError(error, 'Event Sync API');
  }
}
