import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { difyApiKey, message } = body;

    if (!difyApiKey || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: difyApiKey or message' },
        { status: 400 }
      );
    }

    // Test the Dify API directly
    const difyServiceUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL + '/chat-messages' || 'https://dlb20rrk0t1tl.cloudfront.net/v1/chat-messages';
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: '',
      user: 'debug-user',
      files: []
    };

    console.log('🔍 Debug: Making direct request to Dify API:', {
      url: difyServiceUrl,
      apiKey: difyApiKey.substring(0, 10) + '...',
      message: message.substring(0, 50) + '...',
      requestBody
    });

    const response = await fetch(difyServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${difyApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    console.log('🔍 Debug: Dify API response status:', response.status);
    console.log('🔍 Debug: Dify API response text:', responseText);
    console.log('🔍 Debug: Response length:', responseText.length);

    return NextResponse.json({
      status: response.status,
      responseText: responseText,
      responseLength: responseText.length,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    console.error('🔍 Debug: Error:', error);
    return NextResponse.json(
      { error: 'Debug request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
