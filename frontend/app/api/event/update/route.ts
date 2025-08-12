import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await eventController.updateEvent(data);
    return createSuccessResponse(result, 'Event updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'Event Update API');
  }
} 