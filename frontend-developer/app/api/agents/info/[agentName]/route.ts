import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getCurrentOrganization } from '@/lib/utils/getCurrentOrganization';

// GET /api/agents/info/[agentName] - Get agent information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentName: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentName } = await params;

    // Get the current organization from the request
    const currentOrg = getCurrentOrganization(request);

    // Call the real backend service to get agent information from MongoDB
    const backendUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_LIVE_API_URL is not configured' }, { status: 500 });
    }
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

    if (!apiKey) {
      console.error('❌ Missing API key configuration');
      return NextResponse.json({ error: 'API key configuration missing' }, { status: 500 });
    }

    console.log('🔍 Fetching agent info from backend service:', agentName);

    // Call the real backend service
    const response = await fetch(`${backendUrl}/agents/info/${agentName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend service error:', response.status, errorData);
      throw new Error(`Backend service error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Agent info retrieved from backend service (MongoDB):', result);

    return NextResponse.json({
      success: true,
      data: result.data || result,
      message: 'Agent information retrieved successfully from MongoDB'
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
