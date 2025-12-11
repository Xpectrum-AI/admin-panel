import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { difyApiUrl, difyApiKey, message, conversationId, useStreaming } = body;

    if (!difyApiUrl || !difyApiKey || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: difyApiUrl, difyApiKey, or message' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!difyApiKey.startsWith('app-') && !difyApiKey.startsWith('sk-')) {
// For development/testing, allow empty or invalid keys with a warning
      if (process.env.NODE_ENV === 'development' && (!difyApiKey || difyApiKey.trim() === '')) {
        // Use a fallback API key for development
        const fallbackApiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;
        if (!fallbackApiKey) {
          throw new Error('NEXT_PUBLIC_DIFY_API_KEY is not configured');
        }
        if (fallbackApiKey) {
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
    // Use the provided Dify service URL (should already include /chat-messages endpoint)
    let difyServiceUrl = difyApiUrl;
    
    // Use environment variable for Dify service URL if available
    let envDifyUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || (process.env.NEXT_PUBLIC_DIFY_BASE_URL ? `${process.env.NEXT_PUBLIC_DIFY_BASE_URL}/chat-messages` : '');
    
    // Use the URL as provided by the user - don't modify it automatically
    // Different Dify instances may use different URL patterns:
    // - Some use: /v1/chat-messages (e.g., ngrok instances)
    // - Others use: /api/v1/chat-messages (e.g., production instances)
    // The user should provide the correct URL format for their specific Dify instance
    
    // If the agent is using an old URL or no URL, use the environment variable
    if (!difyServiceUrl || !difyServiceUrl.includes('/chat-messages')) {
      if (envDifyUrl) {
        difyServiceUrl = envDifyUrl;
      } else if (difyServiceUrl && !difyServiceUrl.includes('/chat-messages')) {
        // Only append /chat-messages if it's not already in the URL
        difyServiceUrl = `${difyServiceUrl.replace(/\/$/, '')}/chat-messages`;
      } else {
        throw new Error('Dify API URL is not configured. Please set NEXT_PUBLIC_CHATBOT_API_URL or NEXT_PUBLIC_DIFY_BASE_URL');
      }
    }
    
    // Determine response mode based on useStreaming parameter
    const responseMode = useStreaming ? 'streaming' : 'blocking';
    
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: responseMode,
      conversation_id: conversationId || '',
      user: 'preview-user',
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

    if (!response.ok) {
      const errorText = await response.text();
      // If streaming mode fails with 400 error, try blocking mode as fallback
      if (response.status === 400 && responseMode === 'streaming' && errorText.includes('blocking mode')) {
        const fallbackRequestBody = {
          ...requestBody,
          response_mode: 'blocking'
        };
        
        const fallbackResponse = await fetch(difyServiceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${difyApiKey}`
          },
          body: JSON.stringify(fallbackRequestBody)
        });
        
        if (fallbackResponse.ok) {
          const fallbackResponseText = await fallbackResponse.text();
          try {
            const fallbackData = JSON.parse(fallbackResponseText);
            if (fallbackData.answer) {
              return NextResponse.json({ 
                answer: fallbackData.answer,
                conversationId: fallbackData.conversation_id || conversationId
              });
            }
          } catch (e) {
          }
        }
      }
      
      // Provide more helpful error messages
      let errorMessage = `Dify API error: ${response.status} - ${errorText}`;
      
      if (response.status === 500) {
        errorMessage = `The Dify agent is not properly configured. Please check that the agent has a model and prompt configured in the Dify console. Error: ${errorText}`;
      } else if (response.status === 401) {
        errorMessage = `Invalid API key. Please check that the agent API key is correct. Error: ${errorText}`;
      } else if (response.status === 404) {
        errorMessage = `Agent not found. Please check that the agent exists and the API key is correct. Error: ${errorText}`;
      } else if (response.status === 400) {
        errorMessage = `Bad request. The agent might not support the requested response mode. Error: ${errorText}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Handle response based on mode
    if (responseMode === 'blocking') {
      // For blocking mode, read the entire response as text
      const responseText = await response.text();
      // Handle blocking mode (for widget preview)
      try {
        // Parse as JSON (blocking mode should return JSON directly)
        const data = JSON.parse(responseText);
        // Extract answer from various possible fields
        let answer = '';
        let conversationIdFromResponse = conversationId;
        
        if (data.answer) {
          answer = data.answer;
        } else if (data.message) {
          answer = data.message;
        } else if (data.text) {
          answer = data.text;
        } else if (data.data && data.data.answer) {
          answer = data.data.answer;
        } else if (data.data && data.data.message) {
          answer = data.data.message;
        } else if (data.response) {
          answer = data.response;
        } else {
          // If no direct answer field, try to extract from the entire response
// Look for any field that might contain the answer
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' && value.length > 0 && key.toLowerCase().includes('answer')) {
              answer = value;
              break;
            }
          }
        }
        
        // Extract conversation ID
        if (data.conversation_id) {
          conversationIdFromResponse = data.conversation_id;
        } else if (data.conversationId) {
          conversationIdFromResponse = data.conversationId;
        }
        
        if (answer) {
          return NextResponse.json({ 
            answer: answer,
            conversationId: conversationIdFromResponse
          });
        } else {
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
        // Try to extract answer from raw text using regex
        const answerMatch = responseText.match(/"answer":\s*"([^"]+)"/);
        if (answerMatch) {
          const extractedAnswer = answerMatch[1];
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
    } else {
      // Handle streaming mode - return streaming response to frontend
      // IMPORTANT: Don't consume response.body before this point!
      // Check if body exists and is not locked
      if (!response.body) {
        return NextResponse.json(
          { error: 'No response body available for streaming' },
          { status: 500 }
        );
      }

      // Create a ReadableStream to forward the streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let conversationIdFromStream = conversationId;

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // Send final message with conversation ID
                const finalData = JSON.stringify({
                  type: 'done',
                  conversationId: conversationIdFromStream
                });
                controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
                controller.close();
                break;
              }

              // Decode the chunk
              const chunk = decoder.decode(value, { stream: true });
              
              // Forward the chunk as-is to maintain SSE format
              // The frontend will handle parsing
              controller.enqueue(new TextEncoder().encode(chunk));
              
              // Try to extract conversation ID from chunks
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.substring(6).trim();
                    if (jsonStr === '[DONE]') continue;
                    const data = JSON.parse(jsonStr);
                    if (data.conversation_id) {
                      conversationIdFromStream = data.conversation_id;
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          } catch (error) {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Stream error'
            });
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      // Return streaming response with proper headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
