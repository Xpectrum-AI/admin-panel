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

    // Try to fetch real agents data from backend first
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    const backendUrl = `${baseUrl}/agents/by-org/${organizationId}`;
    
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
        return NextResponse.json({
          success: true,
          data: backendData,
          message: `Found agents for organization ${organizationId}`
        });
      } else {
        await response.text();
      }
    } catch (backendError) {
      // Backend API not available, using mock data
    }

    // Fallback to mock data when backend is not available
    const mockAgents = [
      {
        id: 'agent_1',
        name: 'karthk_keya',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Customer support agent',
        initial_message: 'Welcome! I am your customer support assistant. How can I help you today?',
        nudge_text: 'Are you still there? I am here to help!',
        nudge_interval: 20,
        max_nudges: 5,
        typing_volume: 0.9,
        max_call_duration: 600,
        chatbot_api: process.env.NEXT_PUBLIC_CHATBOT_API_URL || (process.env.NEXT_PUBLIC_DIFY_BASE_URL ? `${process.env.NEXT_PUBLIC_DIFY_BASE_URL}/chat-messages` : ''),
        chatbot_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'agent_2',
        name: 'karthik',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Sales assistant agent',
        initial_message: 'Hi there! I am your sales assistant. What can I help you with today?',
        nudge_text: 'Hello, are you still interested in our services?',
        nudge_interval: 30,
        max_nudges: 3,
        typing_volume: 0.7,
        max_call_duration: 900,
        chatbot_api: process.env.NEXT_PUBLIC_CHATBOT_API_URL || (process.env.NEXT_PUBLIC_DIFY_BASE_URL ? `${process.env.NEXT_PUBLIC_DIFY_BASE_URL}/chat-messages` : ''),
        chatbot_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'agent_3',
        name: 'salesbot',
        status: 'draft',
        model: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Sales bot for lead generation',
        initial_message: 'Hello! I am your sales bot. Ready to help you generate leads!',
        nudge_text: 'Still interested in our products?',
        nudge_interval: 25,
        max_nudges: 4,
        typing_volume: 0.8,
        max_call_duration: 1200,
        chatbot_api: process.env.NEXT_PUBLIC_CHATBOT_API_URL || (process.env.NEXT_PUBLIC_DIFY_BASE_URL ? `${process.env.NEXT_PUBLIC_DIFY_BASE_URL}/chat-messages` : ''),
        chatbot_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockAgents,
      message: `Found ${mockAgents.length} mock agents for organization ${organizationId}`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
