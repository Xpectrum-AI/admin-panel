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

    // Try to fetch real agents data from backend first
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    const backendUrl = `${baseUrl}/agents/by-org/${organizationId}`;
    console.log('🌐 Making backend request to:', backendUrl);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const backendData = await response.json();
        console.log('🔍 Backend agents response:', backendData);
        return NextResponse.json({
          success: true,
          data: backendData,
          message: `Found agents for organization ${organizationId}`
        });
      }
    } catch (backendError) {
      console.log('⚠️ Backend API not available, using mock data:', backendError);
    }

    // Fallback to mock data when backend is not available
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'karthk_keya',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Customer support agent',
        initial_message: 'Hello! How can I help you today?',
        chatbot_api: 'https://d22yt2oewbcglh.cloudfront.net/v1',
        chatbot_key: 'app-y6KZcETrVIOgJTMIHb06UUFG',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'agent-2',
        name: 'karthik',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Sales assistant agent',
        initial_message: 'Hello! How can I help you today?',
        chatbot_api: 'https://d22yt2oewbcglh.cloudfront.net/v1',
        chatbot_key: 'app-y6KZcETrVIOgJTMIHb06UUFG',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'agent-3',
        name: 'salesbot',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Sales bot for lead generation',
        initial_message: 'Hello! How can I help you today?',
        chatbot_api: 'https://d22yt2oewbcglh.cloudfront.net/v1',
        chatbot_key: 'app-y6KZcETrVIOgJTMIHb06UUFG',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('✅ Returning mock agents for organization:', organizationId);

    return NextResponse.json({
      success: true,
      data: mockAgents,
      message: `Found ${mockAgents.length} mock agents for organization ${organizationId}`
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
