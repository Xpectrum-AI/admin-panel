import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { agentName: string } }
) {
  try {
    const { agentName } = params;
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!agentName) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    // For Dify API, we'll return mock agent info
    console.log('🚀 Dify API - returning mock agent info for:', agentName);
    
    // Mock agent info response
    const mockAgentInfo = {
      agent_id: `agent-${agentName}`,
      agent_name: agentName,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      configuration: {
        model: 'GPT-4o',
        provider: 'OpenAI',
        voice: 'Elliot',
        language: 'English'
      }
    };
    
    return NextResponse.json(mockAgentInfo);
  } catch (error) {
    console.error('Error proxying GET agent info request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
