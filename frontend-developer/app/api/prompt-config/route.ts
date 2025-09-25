import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

// GET endpoint removed - using localStorage solution instead

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('⚙️ Configuring prompt:', body);
    
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = body.chatbot_api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    if (!difyApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API key not provided and not configured in environment' 
        },
        { status: 400 }
      );
    }
    
    // Clean the prompt - remove any first message that might be included
    let cleanPrompt = body.prompt;
    if (typeof cleanPrompt === 'string') {
      // Remove common first message patterns
      cleanPrompt = cleanPrompt
        .replace(/^You are an expert calendar management assistant\.\s*/i, '')
        .replace(/^You are a helpful assistant\.\s*/i, '')
        .replace(/^Always be helpful, accurate, and proactive in managing schedules\.\s*/i, '')
        .replace(/^Thank you for calling Wellness Partners\. This is Riley, your scheduling agent\. How may I help you today\?\s*/i, '')
        .replace(/^Hello! I'm Riley, your scheduling assistant\. How can I help you today\?\s*/i, '')
        .replace(/^Hi there! I'm here to help you with your scheduling needs\. What can I do for you today\?\s*/i, '')
        .replace(/^Good day! I'm Riley, your appointment scheduling assistant\. How may I assist you today\?\s*/i, '')
        .trim();
    }
    
    const configPayload = {
      ...body,
      prompt: cleanPrompt
    };
    
    console.log('📤 Sending prompt config payload to Dify:', configPayload);
    
    const response = await fetch(`${DIFY_BASE_URL}/apps/current/prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to configure prompt:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Prompt configured successfully:', data);
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Prompt configuration updated successfully'
    });

  } catch (error) {
    console.error('❌ Prompt config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to configure prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
