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
      const agentsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/agents/by-org/${organizationId}`);
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        const realAgent = agentsData.data?.find((agent: any) => 
          agent.agent_prefix === agentId || agent.name === agentId || agent._id === agentId
        );
        
        if (realAgent) {
          console.log('🎯 Found real agent for chatbot:', {
            agent_prefix: realAgent.agent_prefix,
            name: realAgent.name,
            chatbot_api: realAgent.chatbot_api,
            has_chatbot_key: !!realAgent.chatbot_key,
            chatbot_key_preview: realAgent.chatbot_key ? realAgent.chatbot_key.substring(0, 10) + '...' : 'NO KEY'
          });
          return NextResponse.json({
            success: true,
            data: realAgent,
            message: 'Agent information retrieved successfully'
          });
        }
      }
    } catch (fetchError) {
      console.log('⚠️ Could not fetch real agent data, using fallback:', fetchError);
    }

    // Fallback to mock agent data if real agent not found
    const fallbackChatbotApi = process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://dlb20rrk0t1tl.cloudfront.net/v1';
    const fallbackChatbotKey = process.env.NEXT_PUBLIC_CHATBOT_API_KEY || 'REDACTED';
    
    console.log('🔄 Using fallback agent configuration:', {
      agentId,
      chatbot_api: fallbackChatbotApi,
      has_chatbot_key: !!fallbackChatbotKey,
      chatbot_key_preview: fallbackChatbotKey ? fallbackChatbotKey.substring(0, 10) + '...' : 'NO KEY'
    });
    
    const agent = {
      _id: `agent_${Date.now()}`,
      agent_prefix: agentId,
      name: agentId, // Add name field for compatibility
      organization_id: 'default_org', // Use default organization for public access
      chatbot_api: fallbackChatbotApi,
      chatbot_key: fallbackChatbotKey,
      tts_config: {
        provider: "cartesian",
        cartesian: {
          voice_id: "e8e5fffb-252c-436d-b842-8879b84445b6",
          tts_api_key: process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '',
          model: "sonic-2",
          speed: 1,
          language: "english"
        }
      },
      stt_config: {
        provider: "whisper",
        whisper: {
          api_key: process.env.NEXT_PUBLIC_WHISPER_API_KEY || '',
          model: "whisper-1",
          language: "en-US"
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
    console.error('Chatbot Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
