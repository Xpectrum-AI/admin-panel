import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getCurrentOrganization } from '@/lib/utils/getCurrentOrganization';

// GET /api/scheduled/[schedule_id] - Get specific scheduled event
export async function GET(
  request: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleId = params.schedule_id;

    // Get the current organization from the request
    const currentOrg = getCurrentOrganization(request);

    // Mock data - in real implementation, fetch from database
    const scheduledEvent = {
      schedule_id: scheduleId,
      organization_id: currentOrg, // Use current organization
      agent_id: "test_agent",
      call_type: "outbound",
      recipient_phone: "+1234567890",
      scheduled_time: "2024-12-31T10:00:00Z",
      message_template: "Hello, this is a test call",
      flexible_time_minutes: 15,
      max_retries: 3,
      status: "scheduled",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    };

    return NextResponse.json({
      success: true,
      data: scheduledEvent,
      message: 'Scheduled event retrieved successfully'
    });
  } catch (error) {
    console.error('Scheduled events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/scheduled/[schedule_id] - Update scheduled event
export async function PUT(
  request: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleId = params.schedule_id;
    const body = await request.json();

    // Mock update - in real implementation, update in database
    const updatedEvent = {
      schedule_id: scheduleId,
      ...body,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Scheduled event updated successfully'
    });
  } catch (error) {
    console.error('Scheduled events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/scheduled/[schedule_id] - Delete scheduled event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { schedule_id: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleId = params.schedule_id;

    // Mock deletion - in real implementation, delete from database
    return NextResponse.json({
      success: true,
      message: `Scheduled event ${scheduleId} deleted successfully`
    });
  } catch (error) {
    console.error('Scheduled events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
