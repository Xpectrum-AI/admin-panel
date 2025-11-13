import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, model, systemPrompt, provider } = await request.json();
    
    // Validate required fields
    if (!message || !model || !systemPrompt || !provider) {
      return NextResponse.json({ 
        error: 'Missing required fields: message, model, systemPrompt, provider' 
      }, { status: 400 });
    }
    
    // Get environment variables - use dedicated chatbot API URL and key
    const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
    const CHATBOT_API_KEY = process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    
    if (!CHATBOT_API_URL || !CHATBOT_API_KEY) {
      return NextResponse.json({ 
        error: 'Missing required environment variables: NEXT_PUBLIC_CHATBOT_API_URL or NEXT_PUBLIC_CHATBOT_API_KEY' 
      }, { status: 500 });
    }
    // Use your custom API service for chat messages
    let response;
    let endpoint = CHATBOT_API_URL;
    
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATBOT_API_KEY}`,
        },
        body: JSON.stringify({
          message: message,
          system_prompt: systemPrompt,
          model: model,
          provider: provider
        }),
      });
    } catch (fetchError) {
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      // Try to provide more helpful error messages
      if (response.status === 404) {
        throw new Error(`Chat endpoint not found. Please check if /chat-messages endpoint exists on your API service.`);
      } else if (response.status === 401) {
        throw new Error(`Authentication failed. Please check your chatbot API key.`);
      } else if (response.status === 500) {
        throw new Error(`Server error from AI service: ${errorText}`);
      } else {
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
// Extract the response content based on your API structure
    let content = '';
    if (data.response) {
      content = data.response;
    } else if (data.message) {
      content = data.message;
    } else if (data.content) {
      content = data.content;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content;
    } else {
      content = data.response || data.message || data.content || 'I received your message but the response format was unexpected.';
    }
    
    return NextResponse.json({ 
      content: content,
      model: model,
      provider: provider,
      rawResponse: data // Include raw response for debugging
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
