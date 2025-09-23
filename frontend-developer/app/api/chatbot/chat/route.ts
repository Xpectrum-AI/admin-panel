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

    // Make the request to Dify API through our server (avoiding CORS)
    // Use the correct Dify service URL with chat-messages endpoint
    const difyServiceUrl = 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages';
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: conversationId || '',
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

    // Handle response (streaming mode returns Server-Sent Events)
    const responseText = await response.text();
    console.log('📡 Raw Dify response:', responseText);
    
    try {
      // Try to parse as JSON first (in case of non-streaming response)
      const data = JSON.parse(responseText);
      console.log('📡 Parsed JSON data:', data);
      
      if (data.answer) {
        return NextResponse.json({ 
          answer: data.answer,
          conversationId: data.conversation_id || conversationId
        });
      } else if (data.message) {
        return NextResponse.json({ 
          answer: data.message,
          conversationId: data.conversation_id || conversationId
        });
      } else {
        return NextResponse.json({ 
          answer: JSON.stringify(data),
          conversationId: data.conversation_id || conversationId
        });
      }
    } catch (e) {
      // If not JSON, try to parse as streaming response
      console.log('📡 Not JSON, trying streaming format');
      const lines = responseText.split('\n');
      let finalAnswer = '';
      let accumulatedAnswer = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            console.log('📡 Parsed streaming data:', data);
            
            if (data.event === 'message_end' && data.answer) {
              finalAnswer = data.answer;
              break;
            } else if (data.event === 'agent_message' && data.answer) {
              finalAnswer = data.answer;
            } else if (data.event === 'message' && data.answer) {
              finalAnswer = data.answer;
            } else if (data.answer) {
              accumulatedAnswer += data.answer;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      const answer = finalAnswer || accumulatedAnswer;
      if (answer) {
        return NextResponse.json({ 
          answer: answer,
          conversationId: conversationId
        });
      }
      
      // Final fallback
      return NextResponse.json(
        { error: 'No answer found', rawResponse: responseText.substring(0, 500) },
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
