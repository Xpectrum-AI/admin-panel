import { NextRequest, NextResponse } from 'next/server';

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

// Note: Dify API doesn't support GET requests for model configuration
// Only POST requests are supported for model configuration

export async function POST(request: NextRequest) {
  try {
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
    
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = body.chatbot_api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    console.log('🔍 Dify API key:', difyApiKey ? 'Present' : 'Missing');
    
    // Validate required configuration
    if (!DIFY_BASE_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DIFY_BASE_URL not configured' 
        },
        { status: 400 }
      );
    }
    
    if (!difyApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API key not provided' 
        },
        { status: 400 }
      );
    }
    
    try {
      console.log('🔍 Making request to Dify API:', {
        url: `${DIFY_BASE_URL}/apps/current/model-config`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: configPayload
      });

      // Try different authentication methods
      const authHeaders = {
        'Content-Type': 'application/json',
      };

      // Method 1: Bearer token
      authHeaders['Authorization'] = `Bearer ${difyApiKey}`;

      const response = await fetch(`${DIFY_BASE_URL}/apps/current/model-config`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(configPayload),
      });

      console.log('🔍 Dify API response status:', response.status);
      console.log('🔍 Dify API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to configure model:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        
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
      
    } catch (difyError) {
      console.error('❌ Dify API call failed:', difyError);
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
