import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'developer';
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    // For Dify API, we need to use the apps endpoint instead of agents
    // Since this is a Dify OpenAPI service, we'll return a mock response for now
    console.log('🚀 Dify API detected - returning mock agents for organization:', organizationId);
    
    // Mock response for development
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Wellness Partner Agent',
        status: 'active',
        created_at: new Date().toISOString(),
        organization_id: organizationId
      },
      {
        id: 'agent-2', 
        name: 'Customer Support Agent',
        status: 'active',
        created_at: new Date().toISOString(),
        organization_id: organizationId
      }
    ];
    
    return NextResponse.json(mockAgents);
  } catch (error) {
    console.error('Error proxying GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');
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

    const body = await request.json();

    // For Dify API, we'll simulate agent creation/update
    console.log('🚀 Dify API - simulating agent creation/update for:', agentName);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    // Mock successful response
    const mockResponse = {
      success: true,
      agent_id: `agent-${Date.now()}`,
      agent_name: agentName,
      status: 'created',
      created_at: new Date().toISOString(),
      message: 'Agent created successfully'
    };
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error proxying POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'developer';
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // For Dify API, we'll simulate agent deletion
    console.log('🚀 Dify API - simulating agent deletion for organization:', organizationId);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    // Mock successful response
    const mockResponse = {
      success: true,
      message: 'Agent deleted successfully',
      deleted_at: new Date().toISOString()
    };
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error proxying DELETE request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
