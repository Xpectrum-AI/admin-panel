import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { difyApiUrl, difyApiKey, message } = body;

    if (!difyApiUrl || !difyApiKey || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: difyApiUrl, difyApiKey, or message' },
        { status: 400 }
      );
    }

    // Make the request to Dify API through our server (avoiding CORS)
    // Use the correct Dify service URL with chat-messages endpoint
    const difyServiceUrl = 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages';
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: '',
      user: 'preview-user',
      files: []
    };
    
    console.log('🚀 Making request to Dify API:', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API error:', response.status, errorText);
      
      // Provide more helpful error messages
      let errorMessage = `Dify API error: ${response.status} - ${errorText}`;
      
      if (response.status === 500) {
        errorMessage = `The Dify agent is not properly configured. Please check that the agent has a model and prompt configured in the Dify console. Error: ${errorText}`;
      } else if (response.status === 401) {
        errorMessage = `Invalid API key. Please check that the agent API key is correct. Error: ${errorText}`;
      } else if (response.status === 404) {
        errorMessage = `Agent not found. Please check that the agent exists and the API key is correct. Error: ${errorText}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
