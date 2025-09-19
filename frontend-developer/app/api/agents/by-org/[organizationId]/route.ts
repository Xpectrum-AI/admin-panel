import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// GET /api/agents/by-org/[organizationId] - Get all agents for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;

    console.log('🔍 Fetching agents for organization:', organizationId);
    console.log('🔗 NEXT_PUBLIC_LIVE_API_URL:', process.env.NEXT_PUBLIC_LIVE_API_URL);

    // Fetch real agents data from backend
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL ;
    const backendUrl = `${baseUrl}/agents/by-org/${organizationId}`;
    console.log('🌐 Making backend request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
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
