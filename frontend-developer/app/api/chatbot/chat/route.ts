import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { difyApiUrl, difyApiKey, message, conversationId } = body;

    if (!difyApiUrl || !difyApiKey || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: difyApiUrl, difyApiKey, or message' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!difyApiKey.startsWith('app-') && !difyApiKey.startsWith('sk-')) {
      console.log('❌ Invalid API key format:', {
        apiKey: difyApiKey,
        apiKeyLength: difyApiKey.length,
        startsWithApp: difyApiKey.startsWith('app-'),
        startsWithSk: difyApiKey.startsWith('sk-')
      });
      
      // For development/testing, allow empty or invalid keys with a warning
      if (process.env.NODE_ENV === 'development' && (!difyApiKey || difyApiKey.trim() === '')) {
        console.log('⚠️ Development mode: Using fallback API key for testing');
        // Use a fallback API key for development
        const fallbackApiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || 'REDACTED';
        if (fallbackApiKey && fallbackApiKey !== 'REDACTED') {
          console.log('🔄 Using fallback API key from environment');
          // Continue with fallback key
        } else {
          return NextResponse.json(
            { error: 'No valid API key provided. Please configure the agent with a valid Dify API key.' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Invalid API key format. Dify API keys should start with "app-" or "sk-". Received: ${difyApiKey.substring(0, 10)}...` },
          { status: 400 }
        );
      }
    }

    // Make the request to Dify API through our server (avoiding CORS)
    // Use the correct Dify service URL with chat-messages endpoint
    const difyServiceUrl = 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages';
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: conversationId || '',
      user: 'preview-user',
      files: []
    };
    
    console.log('🚀 Making request to Dify API:', {
      url: difyServiceUrl,
      apiKey: difyApiKey ? difyApiKey.substring(0, 10) + '...' : 'NO API KEY',
      apiKeyLength: difyApiKey ? difyApiKey.length : 0,
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

    // Handle response (blocking mode returns JSON directly)
    const responseText = await response.text();
    console.log('📡 Raw Dify response length:', responseText.length);
    console.log('📡 Raw Dify response (first 500 chars):', responseText.substring(0, 500));
    console.log('📡 Raw Dify response (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
    
    try {
      // Parse as JSON (blocking mode should return JSON directly)
      const data = JSON.parse(responseText);
      console.log('📡 Parsed JSON data:', data);
      
      // Extract answer from various possible fields
      let answer = '';
      let conversationIdFromResponse = conversationId;
      
      if (data.answer) {
        answer = data.answer;
        console.log('📡 Found answer field:', answer);
      } else if (data.message) {
        answer = data.message;
        console.log('📡 Found message field:', answer);
      } else if (data.text) {
        answer = data.text;
        console.log('📡 Found text field:', answer);
      } else if (data.data && data.data.answer) {
        answer = data.data.answer;
        console.log('📡 Found data.answer field:', answer);
      } else if (data.data && data.data.message) {
        answer = data.data.message;
        console.log('📡 Found data.message field:', answer);
      } else if (data.response) {
        answer = data.response;
        console.log('📡 Found response field:', answer);
      } else {
        // If no direct answer field, try to extract from the entire response
        console.log('📡 No direct answer field found, checking full response structure');
        console.log('📡 Full response keys:', Object.keys(data));
        
        // Look for any field that might contain the answer
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.length > 0 && key.toLowerCase().includes('answer')) {
            answer = value;
            console.log(`📡 Found answer in field ${key}:`, answer);
            break;
          }
        }
      }
      
      // Extract conversation ID
      if (data.conversation_id) {
        conversationIdFromResponse = data.conversation_id;
        console.log('📡 Found conversation_id:', conversationIdFromResponse);
      } else if (data.conversationId) {
        conversationIdFromResponse = data.conversationId;
        console.log('📡 Found conversationId:', conversationIdFromResponse);
      }
      
      if (answer) {
        console.log('📡 Returning answer:', answer);
        console.log('📡 Answer length:', answer.length);
        return NextResponse.json({ 
          answer: answer,
          conversationId: conversationIdFromResponse
        });
      } else {
        console.log('📡 No answer found in response, returning debug info');
        return NextResponse.json(
          { 
            error: 'No answer found in response', 
            rawResponse: responseText.substring(0, 1000),
            responseKeys: Object.keys(data),
            fullResponse: data
          },
          { status: 500 }
        );
      }
    } catch (parseError) {
      console.log('📡 Failed to parse JSON response:', parseError);
      console.log('📡 Raw response text:', responseText);
      
      // Try to extract answer from raw text using regex
      const answerMatch = responseText.match(/"answer":\s*"([^"]+)"/);
      if (answerMatch) {
        const extractedAnswer = answerMatch[1];
        console.log('📡 Extracted answer from raw response:', extractedAnswer);
        return NextResponse.json({ 
          answer: extractedAnswer,
          conversationId: conversationId
        });
      }
      
      // Final fallback
      return NextResponse.json(
        { 
          error: 'Failed to parse response and no answer found', 
          rawResponse: responseText.substring(0, 1000),
          parseError: parseError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
