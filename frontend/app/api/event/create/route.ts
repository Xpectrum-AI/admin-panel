import { NextRequest, NextResponse } from 'next/server';
import { eventController } from '@/lib/controllers/eventController';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await eventController.createEvent(data);
    return createSuccessResponse(result, 'Event created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'Event Create API');
  }
} 