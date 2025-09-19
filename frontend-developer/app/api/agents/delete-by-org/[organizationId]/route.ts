import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// DELETE /api/agents/delete-by-org/[organizationId] - Delete agent from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { agentName } = body;

    if (!agentName) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    console.log('🔍 Deleting agent:', agentName, 'from organization:', organizationId);
    console.log('🔗 NEXT_PUBLIC_LIVE_API_URL:', process.env.NEXT_PUBLIC_LIVE_API_URL);
    console.log('🔗 NEXT_PUBLIC_LIVE_API_URL type:', typeof process.env.NEXT_PUBLIC_LIVE_API_URL);
    console.log('🔗 NEXT_PUBLIC_LIVE_API_URL length:', process.env.NEXT_PUBLIC_LIVE_API_URL?.length);
    console.log('🔑 Using API key:', process.env.NEXT_PUBLIC_LIVE_API_KEY ? 'Present' : 'Missing');

    // Call the real backend API to delete the agent
    // Using the correct endpoint format: /agents/delete/{agent_prefix}
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_API_URL;
    console.log('🌐 Base URL:', baseUrl);
    console.log('🌐 Base URL is undefined?', baseUrl === undefined);
    console.log('🌐 Base URL is null?', baseUrl === null);
    console.log('🌐 Base URL is empty?', baseUrl === '');
    
    if (!baseUrl) {
      console.error('❌ NEXT_PUBLIC_LIVE_API_URL is not set! Cannot make backend call.');
      return NextResponse.json({ 
        error: 'Backend URL not configured', 
        message: 'NEXT_PUBLIC_LIVE_API_URL environment variable is not set' 
      }, { status: 500 });
    }
    
    const backendUrl = `${baseUrl}/agents/delete/${agentName}`;
    console.log('🌐 Making backend request to:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    console.log('📊 Backend response status:', backendResponse.status);
    console.log('📊 Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    if (!backendResponse.ok) {
      let errorData;
      try {
        errorData = await backendResponse.json();
      } catch (parseError) {
        errorData = { error: `HTTP ${backendResponse.status}: ${backendResponse.statusText}` };
      }
      console.error('❌ Backend deletion failed:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorData
      });
      throw new Error(errorData.error || errorData.message || `Backend deletion failed: ${backendResponse.statusText}`);
    }

    let backendResult;
    try {
      backendResult = await backendResponse.json();
      console.log('✅ Backend deletion response:', backendResult);
    } catch (parseError) {
      console.log('⚠️ Backend response is not JSON, treating as success');
      backendResult = { success: true, message: 'Agent deleted successfully' };
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${agentName} deleted from organization ${organizationId} successfully`,
      data: backendResult
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
