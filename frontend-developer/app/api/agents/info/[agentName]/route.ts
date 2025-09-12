import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { getCurrentOrganization } from '@/lib/utils/getCurrentOrganization';

// GET /api/agents/info/[agentName] - Get agent information
export async function GET(
  request: NextRequest,
  { params }: { params: { agentName: string } }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agentName = params.agentName;

    // Get the current organization from the request
    const currentOrg = getCurrentOrganization(request);

    // Mock agent data - in real implementation, fetch from database
    const agent = {
      _id: `agent_${Date.now()}`,
      agent_prefix: agentName,
      organization_id: currentOrg, // Use current organization
      chatbot_api: "https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages",
      chatbot_key: "app-y6KZcETrVIOgJTMIHb06UUFG",
      tts_config: {
        provider: "cartesian",
        cartesian: {
          voice_id: "e8e5fffb-252c-436d-b842-8879b84445b6",
          tts_api_key: "sk_car_Q6fQT5PmAUDkyNgmmcK3KW",
          model: "sonic-2",
          speed: 1,
          language: "english"
        }
      },
      stt_config: {
        provider: "whisper",
        whisper: {
          api_key: "sk-svcacct-SrS_5Ba2X2VluIQzXVnvHoMj44ZdvT4xEC13sK8gMR81j3v0bKdjZ1iV1e1",
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
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
