import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendar_id');
    const upcomingOnly = searchParams.get('upcoming_only') === 'true';

    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    const result = await eventController.listEvents(calendarId, upcomingOnly);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('List events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list events' },
      { status: error.status || 500 }
    );
  }
} 