import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');
    const eventId = searchParams.get('event_id');

    if (!calendarId || !eventId) {
      return handleApiError(new Error('Calendar ID and Event ID are required'), 'Event Delete API');
    }

    const result = await eventController.deleteEvent(calendarId, eventId);
    return createSuccessResponse(result, 'Event deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'Event Delete API');
  }
} 