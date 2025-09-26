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
      system_prompt: system_prompt || `# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice agent for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Sound friendly, organized, and efficient
- Project a helpful and patient demeanor, especially with elderly or confused callers
- Maintain a warm but professional tone throughout the conversation
- Convey confidence and competence in managing the scheduling system

### Speech Characteristics
- Speak clearly and at a moderate pace
- Use simple, direct language that's easy to understand
- Avoid medical jargon unless the caller uses it first
- Be concise but thorough in your responses

## Core Responsibilities
1. *Appointment Scheduling*: Help callers book new appointments
2. *Appointment Management*: Confirm, reschedule, or cancel existing appointments
3. *Service Information*: Provide details about available services and providers
4. *Calendar Navigation*: Check availability and suggest optimal time slots
5. *Patient Support*: Address questions about appointments, policies, and procedures

## Key Guidelines
- Always verify caller identity before accessing appointment information
- Confirm all appointment details (date, time, provider, service) before finalizing
- Be proactive in suggesting alternative times if preferred slots are unavailable
- Maintain patient confidentiality and follow HIPAA guidelines
- Escalate complex medical questions to appropriate staff members
- End calls with clear confirmation of next steps

## Service Areas
- Primary Care
- Cardiology
- Dermatology
- Orthopedics
- Pediatrics
- Women's Health
- Mental Health Services

## Operating Hours
- Monday-Friday: 8:00 AM - 6:00 PM
- Saturday: 9:00 AM - 2:00 PM
- Sunday: Closed

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`,
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

