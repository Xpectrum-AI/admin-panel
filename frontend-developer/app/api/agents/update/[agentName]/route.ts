import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

// POST /api/agents/update/[agentName] - Create or update agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentName: string }> }
) {
  try {
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentName } = await params;
    const body = await request.json();
    const { 
      organization_id,
      chatbot_api,
      chatbot_key,
      tts_config,
      stt_config,
      initial_message,
      nudge_text,
      nudge_interval,
      max_nudges,
      typing_volume,
      max_call_duration,
      system_prompt,
      model_provider,
      model_name,
      model_api_key,
      model_live_url
    } = body;

    console.log('🔍 Creating/updating agent:', { agentName, organization_id, body });

    // Mock agent creation/update - in real implementation, save to database
    const agent = {
      _id: `agent_${Date.now()}`,
      agent_prefix: agentName,
      organization_id: organization_id || null, // This should not be null!
      chatbot_api: chatbot_api || '',
      chatbot_key: chatbot_key || '',
      tts_config: tts_config || {},
      stt_config: stt_config || {},
      initial_message: initial_message || "Hello! How can I help you today?",
      nudge_text: nudge_text || "Hello, Are you still there?",
      nudge_interval: nudge_interval || 15,
      max_nudges: max_nudges || 3,
      typing_volume: typing_volume || 0.8,
      max_call_duration: max_call_duration || 300,
      // Add system prompt and model configuration
      system_prompt: system_prompt || "You are a helpful assistant.",
      model_provider: model_provider || "OpenAI",
      model_name: model_name || "GPT-4o",
      model_api_key: model_api_key || '',
      model_live_url: model_live_url || '',
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };

    console.log('✅ Agent created/updated:', agent);

    return NextResponse.json({
      success: true,
      data: agent,
      message: 'Agent created/updated successfully'
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
