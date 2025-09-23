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
    console.log('📡 Raw Dify response length:', responseText.length);
    console.log('📡 Raw Dify response (first 500 chars):', responseText.substring(0, 500));
    console.log('📡 Raw Dify response (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
    
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
      console.log('📡 Raw response text:', responseText);
      
      const lines = responseText.split('\n');
      let finalAnswer = '';
      let accumulatedAnswer = '';
      let conversationIdFromStream = conversationId;
      
      for (const line of lines) {
        if (line.trim() === '') continue; // Skip empty lines
        
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === '[DONE]') continue; // Skip DONE markers
            
            const data = JSON.parse(jsonStr);
            console.log('📡 Parsed streaming data:', data);
            
            // Handle different event types
            if (data.event === 'message_end') {
              if (data.answer) {
                finalAnswer = data.answer;
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
              break;
            } else if (data.event === 'agent_message') {
              if (data.answer) {
                finalAnswer = data.answer;
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message') {
              if (data.answer) {
                finalAnswer = data.answer;
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'agent_thought') {
              // Skip thought events
              continue;
            } else if (data.answer) {
              // Accumulate answer chunks
              accumulatedAnswer += data.answer;
            } else if (data.text) {
              // Some responses use 'text' instead of 'answer'
              accumulatedAnswer += data.text;
            }
          } catch (parseError) {
            console.log('📡 Failed to parse line:', line, parseError);
            continue;
          }
        } else if (line.startsWith('event: ')) {
          // Skip event type lines
          continue;
        } else {
          // Try to parse as direct JSON (non-SSE format)
          try {
            const data = JSON.parse(line);
            console.log('📡 Parsed direct JSON:', data);
            
            if (data.answer) {
              finalAnswer = data.answer;
            } else if (data.text) {
              finalAnswer = data.text;
            } else if (data.message) {
              finalAnswer = data.message;
            }
            
            if (data.conversation_id) {
              conversationIdFromStream = data.conversation_id;
            }
          } catch (directParseError) {
            // Not JSON, might be plain text response
            if (line.trim().length > 0) {
              accumulatedAnswer += line.trim() + ' ';
            }
          }
        }
      }
      
      const answer = finalAnswer || accumulatedAnswer.trim();
      if (answer) {
        return NextResponse.json({ 
          answer: answer,
          conversationId: conversationIdFromStream
        });
      }
      
      // Final fallback - return the raw response for debugging
      return NextResponse.json(
        { 
          error: 'No answer found in streaming response', 
          rawResponse: responseText.substring(0, 1000),
          lines: lines.slice(0, 10) // First 10 lines for debugging
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
