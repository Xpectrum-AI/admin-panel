import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organization_id: string }> }
) {
  try {
    const { organization_id } = await params;
    const result = await calendarController.getOrgCalendars(organization_id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get organization calendars error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get organization calendars' },
      { status: error.status || 500 }
    );
  }
} 