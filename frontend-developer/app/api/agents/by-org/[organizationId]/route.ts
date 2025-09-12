import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// GET /api/agents/by-org/[organizationId] - Get all agents for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = params.organizationId;

    console.log('🔍 Fetching agents for organization:', organizationId);

    // Fetch real agents data from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIVE_API_URL}/agents/by-org/${organizationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agents from backend: ${response.statusText}`);
    }

    const backendData = await response.json();
    console.log('🔍 Backend agents response:', backendData);

    console.log('✅ Found agents for organization:', backendData);

    return NextResponse.json({
      success: true,
      data: backendData,
      message: `Found agents for organization ${organizationId}`
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
