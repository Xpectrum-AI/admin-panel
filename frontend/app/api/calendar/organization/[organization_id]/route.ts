import { NextRequest, NextResponse } from 'next/server';
import { calendarController } from '@/lib/controllers/calendarController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organization_id: string }> }
) {
  try {
    const { organization_id } = await params;
    const result = await calendarController.getOrgCalendars(organization_id);
    return createSuccessResponse(result, 'Organization calendars retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'Organization Calendar API');
  }
} 