import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

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

export async function GET() {
  try {
    console.log('🔍 Fetching current model configuration...');
    
    // For getting model config, we need to use the chatbot API key
    const chatbotApiKey = process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    if (!chatbotApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chatbot API key not configured' 
        },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${DIFY_BASE_URL}/apps/current/model-config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${chatbotApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to fetch model config:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Model config fetched successfully:', data);
    
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Model config fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch model configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('⚙️ Configuring model:', body);
    
    // Extract provider and api_key from the request
    const provider = body.provider;
    const apiKey = body.api_key;
    
    if (!provider) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider is required in request body' 
        },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key is required in request body' 
        },
        { status: 400 }
      );
    }
    
    // For model configuration, we need to include the model API key in the request
    const configPayload = {
      provider: provider,
      model: body.model,
      api_key: apiKey
    };
    
    // Use the chatbot API key from the request body, fallback to environment variable
    const chatbotApiKey = body.chatbot_api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    if (!chatbotApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chatbot API key not provided and not configured in environment' 
        },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${DIFY_BASE_URL}/apps/current/model-config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chatbotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to configure model:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Model configured successfully:', data);
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Model configuration updated successfully'
    });

  } catch (error) {
    console.error('❌ Model config error:', error);
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
