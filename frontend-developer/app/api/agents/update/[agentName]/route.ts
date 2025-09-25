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
    console.log('🔍 Chatbot API values received:', { chatbot_api, chatbot_key });

    // Call the real backend service to save to MongoDB
    const backendUrl = process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d2ref4sfj4q82j.cloudfront.net';
    const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

    if (!apiKey) {
      console.error('❌ Missing API key configuration');
      return NextResponse.json({ error: 'API key configuration missing' }, { status: 500 });
    }

    // Prepare the complete agent data for the backend
    // Handle TTS config - swap values if provided, or use swapped defaults
    let processedTtsConfig;
    if (tts_config && tts_config.openai) {
      // If TTS config is provided, swap the values to compensate for backend swapping
      processedTtsConfig = {
        ...tts_config,
        openai: {
          ...tts_config.openai,
          voice: tts_config.openai.response_format,  // Swap: send response_format as voice
          response_format: tts_config.openai.voice   // Swap: send voice as response_format
        }
      };
    } else {
      // Use swapped defaults
      processedTtsConfig = {
        provider: 'openai',
        openai: {
          api_key: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
          voice: 'mp3',  // Swap: send mp3 as voice so backend swaps it to response_format
          response_format: 'alloy',  // Swap: send alloy as response_format so backend swaps it to voice
          quality: 'standard',
          speed: 1.0
        }
      };
    }

    const agentData = {
      agent_prefix: agentName,
      organization_id: organization_id || null,
      chatbot_api: chatbot_api !== undefined ? chatbot_api : (process.env.NEXT_PUBLIC_CHATBOT_API_URL || ''),
      chatbot_key: chatbot_key !== undefined ? chatbot_key : (process.env.NEXT_PUBLIC_CHATBOT_API_KEY || ''),
      tts_config: processedTtsConfig,
      stt_config: stt_config || {
        provider: 'deepgram',
        deepgram: {
          api_key: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
          model: 'nova-2',
          language: 'en-US',
          punctuate: true,
          smart_format: true,
          interim_results: true
        }
      },
      initial_message: initial_message || "Hello! How can I help you today?",
      nudge_text: nudge_text || "Hello, Are you still there?",
      nudge_interval: nudge_interval || 15,
      max_nudges: max_nudges || 3,
      typing_volume: typing_volume || 0.8,
      max_call_duration: max_call_duration || 300,
      system_prompt: system_prompt || "You are a helpful assistant.",
      model_provider: model_provider || "OpenAI",
      model_name: model_name || "GPT-4o",
      model_api_key: model_api_key || process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '',
      model_live_url: model_live_url || process.env.NEXT_PUBLIC_DIFY_BASE_URL || '',
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };

    console.log('🚀 Sending complete agent data to backend service:', agentData);

    // Call the real backend service
    const response = await fetch(`${backendUrl}/agents/update/${agentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(agentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend service error:', response.status, errorData);
      throw new Error(`Backend service error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Agent saved to backend service (MongoDB):', result);
    console.log('✅ Chatbot API values saved to MongoDB:', { 
      chatbot_api: agentData.chatbot_api, 
      chatbot_key: agentData.chatbot_key 
    });

    return NextResponse.json({
      success: true,
      data: result.data || result,
      message: 'Agent created/updated successfully in MongoDB'
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

