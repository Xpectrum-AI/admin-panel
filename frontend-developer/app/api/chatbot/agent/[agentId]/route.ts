import { NextRequest, NextResponse } from 'next/server';

// GET /api/chatbot/agent/[agentId] - Get agent information for chatbot (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // Fetch real agent data from the agents API
    try {
      // Use the correct endpoint with a default organization ID
      const organizationId = 'default_org';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL is not configured');
      }
      const agentsResponse = await fetch(`${appUrl}/api/agents/by-org/${organizationId}`);
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        const realAgent = agentsData.data?.find((agent: any) => 
          agent.agent_prefix === agentId || agent.name === agentId || agent._id === agentId
        );
        
        if (realAgent) {
          return NextResponse.json({
            success: true,
            data: realAgent,
            message: 'Agent information retrieved successfully'
          });
        }
      }
    } catch (fetchError) {
      // Could not fetch real agent data, using fallback
    }

    // Fallback to mock agent data if real agent not found
    const fallbackChatbotApi = process.env.NEXT_PUBLIC_CHATBOT_API_URL || (process.env.NEXT_PUBLIC_DIFY_BASE_URL ? `${process.env.NEXT_PUBLIC_DIFY_BASE_URL}/chat-messages` : '');
    const fallbackChatbotKey = process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '';
    
    const agent = {
      _id: `agent_${Date.now()}`,
      agent_prefix: agentId,
      name: agentId, // Add name field for compatibility
      organization_id: 'default_org', // Use default organization for public access
      chatbot_api: fallbackChatbotApi,
      chatbot_key: fallbackChatbotKey,
      tts_config: {
        provider: "openai",
        openai: {
          api_key: '',
          model: "gpt-4o-mini-tts",
          response_format: "mp3",
          voice: "alloy",
          language: "en",
          speed: 1
        },
        elevenlabs: null
      },
      stt_config: {
        provider: "openai",
        deepgram: null,
        openai: {
          api_key: '',
          model: "gpt-4o-mini-transcribe",
          language: "en"
        }
      },
      initial_message: "Hello! How can I help you today?",
      nudge_text: "Hello, Are you still there?",
      nudge_interval: 15,
      max_nudges: 3,
      typing_volume: 0.8,
      max_call_duration: 300,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };

    return NextResponse.json({
      success: true,
      data: agent,
      message: 'Agent information retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
