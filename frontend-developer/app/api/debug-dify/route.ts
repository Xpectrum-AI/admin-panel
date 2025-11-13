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
    const difyServiceUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL + '/chat-messages' ;
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: '',
      user: 'debug-user',
      files: []
    };
const response = await fetch(difyServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${difyApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    return NextResponse.json({
      status: response.status,
      responseText: responseText,
      responseLength: responseText.length,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Debug request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
