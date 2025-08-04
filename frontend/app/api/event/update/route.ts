import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await eventController.updateEvent(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: error.status || 500 }
    );
  }
} 