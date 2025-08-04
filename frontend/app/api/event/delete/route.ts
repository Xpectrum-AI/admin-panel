import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');
    const eventId = searchParams.get('event_id');

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { error: 'Calendar ID and Event ID are required' },
        { status: 400 }
      );
    }

    const result = await eventController.deleteEvent(calendarId, eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: error.status || 500 }
    );
  }
} 