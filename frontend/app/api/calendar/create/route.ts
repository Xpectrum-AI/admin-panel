import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await calendarController.createCalendar(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Calendar creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar' },
      { status: error.status || 500 }
    );
  }
} 