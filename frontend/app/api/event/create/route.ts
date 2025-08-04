import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await eventController.createEvent(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: error.status || 500 }
    );
  }
} 