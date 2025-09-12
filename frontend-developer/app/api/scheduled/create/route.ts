import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// POST /api/scheduled/create - Create scheduled event
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      organization_id, 
      agent_id, 
      call_type, 
      recipient_phone, 
      scheduled_time, 
      message_template, 
      flexible_time_minutes, 
      max_retries 
    } = body;

    if (!organization_id || !agent_id || !call_type || !recipient_phone || !scheduled_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: organization_id, agent_id, call_type, recipient_phone, scheduled_time' 
      }, { status: 400 });
    }

    // Mock creation - in real implementation, save to database
    const scheduledEvent = {
      schedule_id: `schedule_${Date.now()}`,
      organization_id,
      agent_id,
      call_type,
      recipient_phone,
      scheduled_time,
      message_template: message_template || '',
      flexible_time_minutes: flexible_time_minutes || 15,
      max_retries: max_retries || 3,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: scheduledEvent,
      message: 'Outbound call scheduled successfully!'
    }, { status: 201 });
  } catch (error) {
    console.error('Scheduled events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
