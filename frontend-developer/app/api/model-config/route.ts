import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';

// Get the appropriate model API key based on provider
function getModelApiKey(provider: string): string | null {
  switch (provider.toLowerCase()) {
    case 'openai':
    case 'langgenius/openai/openai':
      return process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || null;
    case 'groq':
    case 'langgenius/groq/groq':
      return process.env.NEXT_PUBLIC_MODEL_GROQ_API_KEY || null;
    case 'anthropic':
    case 'langgenius/anthropic/anthropic':
      return process.env.NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY || null;
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Extract required fields
    const provider = body.provider;
    const model = body.model;
    const apiKey = body.api_key;
    const chatbotApiKey = body.chatbot_api_key;
    const datasetConfigs = body.dataset_configs;
    
    if (!provider || !model || !apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider, model, and API key are required' 
        },
        { status: 400 }
      );
    }
    
    if (!chatbotApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chatbot API key is required' 
        },
        { status: 400 }
      );
    }
    
    // Get app ID from request body (passed from frontend)
    const appId = body.app_id;
    
    if (!appId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'App ID is required. Please provide app_id in request body.' 
        },
        { status: 400 }
      );
    }
    try {
      // Login to Dify console to get auth token
      const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();
      const token = loginData.data?.access_token;

      if (!token) {
        throw new Error('No access token received from login');
      }
      // Get the current system prompt from the agent (if not provided in request)
      const systemPrompt = body.pre_prompt || `# Appointment Scheduling Agent Prompt

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

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`;
      
      // Build the complete configuration payload matching Dify's expected format
      const configPayload = {
        pre_prompt: systemPrompt,
        prompt_type: "simple",
        chat_prompt_config: {},
        completion_prompt_config: {},
        user_input_form: [],
        dataset_query_variable: "",
        more_like_this: { enabled: false },
        opening_statement: "",
        suggested_questions: [],
        sensitive_word_avoidance: { enabled: false },
        speech_to_text: { enabled: false },
        text_to_speech: { enabled: false, voice: "", language: "" },
        file_upload: {
          image: {
            detail: "high",
            enabled: false,
            number_limits: 3,
            transfer_methods: ["remote_url", "local_file"]
          },
          enabled: false,
          allowed_file_types: [],
          allowed_file_extensions: [".JPG", ".JPEG", ".PNG", ".GIF", ".WEBP", ".SVG", ".MP4", ".MOV", ".MPEG", ".WEBM"],
          allowed_file_upload_methods: ["remote_url", "local_file"],
          number_limits: 3
        },
        suggested_questions_after_answer: { enabled: false },
        retriever_resource: { enabled: false },
        agent_mode: {
          enabled: false,
          max_iteration: 10,
          strategy: "function_call",
          tools: []
        },
        model: {
          provider: provider,
          name: model,
          mode: "chat",
          completion_params: {
            temperature: 0.3,
            stop: []
          }
        },
        dataset_configs: datasetConfigs || {
          retrieval_model: "single",
          datasets: { datasets: [] },
          top_k: 4,
          reranking_enable: false
        }
      };
      // POST to the console API (this is what Dify Studio does)
      const response = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/model-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configPayload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to configure model: ${response.status}`,
            details: errorText
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        data,
        message: 'Model configuration updated successfully'
      });
      
    } catch (difyError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API call failed',
          details: difyError instanceof Error ? difyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to configure model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
