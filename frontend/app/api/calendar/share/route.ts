import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await calendarController.shareCalendar(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Calendar share error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share calendar' },
      { status: error.status || 500 }
    );
  }
} 