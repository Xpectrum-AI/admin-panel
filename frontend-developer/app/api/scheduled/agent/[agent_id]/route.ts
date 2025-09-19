import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getCurrentOrganization } from '@/lib/utils/getCurrentOrganization';

// GET /api/scheduled/agent/[agent_id] - Get scheduled events for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agent_id: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_id } = await params;
    const agentId = agent_id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Get the current organization from the request
    const currentOrg = getCurrentOrganization(request);

    // Mock data - in real implementation, fetch from database with filters
    const scheduledEvents = [
      {
        schedule_id: `schedule_${Date.now()}_1`,
        organization_id: currentOrg, // Use current organization
        agent_id: agentId,
        call_type: "outbound",
        recipient_phone: "+1234567890",
        scheduled_time: "2024-12-31T10:00:00Z",
        message_template: "Hello, this is a test call",
        flexible_time_minutes: 15,
        max_retries: 3,
        status: status || "scheduled",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      }
    ];

    return NextResponse.json({
      success: true,
      data: scheduledEvents,
      message: 'Scheduled events retrieved successfully'
    });
  } catch (error) {
    console.error('Scheduled events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
