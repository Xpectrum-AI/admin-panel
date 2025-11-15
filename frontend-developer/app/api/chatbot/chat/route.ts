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
    
    // Fix URL pattern: if URL has /v1/chat-messages but missing /api before /v1, add /api
    // This handles cases where the URL structure is /v1/chat-messages instead of /api/v1/chat-messages
    if (envDifyUrl && envDifyUrl.includes('/v1/chat-messages') && !envDifyUrl.includes('/api/v1/chat-messages')) {
      envDifyUrl = envDifyUrl.replace('/v1/chat-messages', '/api/v1/chat-messages');
    }
    if (difyServiceUrl && difyServiceUrl.includes('/v1/chat-messages') && !difyServiceUrl.includes('/api/v1/chat-messages')) {
      difyServiceUrl = difyServiceUrl.replace('/v1/chat-messages', '/api/v1/chat-messages');
    }
    
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
    const responseText = await response.text();
if (responseMode === 'blocking') {
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
      // Handle streaming mode (for full chatbot page)
      // Try to parse as JSON first (some streaming responses might be JSON)
      try {
        const jsonData = JSON.parse(responseText);
        if (jsonData.answer) {
          return NextResponse.json({ 
            answer: jsonData.answer,
            conversationId: jsonData.conversation_id || conversationId
          });
        }
      } catch (e) {
      }
      
      // Process as Server-Sent Events
      const lines = responseText.split('\n');
      let finalAnswer = '';
      let accumulatedAnswer = '';
      let conversationIdFromStream = conversationId;
      let foundValidData = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue; // Skip empty lines
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === '[DONE]') {
              continue;
            }
            
            const data = JSON.parse(jsonStr);
            foundValidData = true;
            
            // Handle different event types - prioritize complete answers
            if (data.event === 'message_end' && data.answer) {
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
              break; // This is the final answer
            } else if (data.event === 'agent_message' && data.answer) {
              // Accumulate answer chunks instead of replacing
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message' && data.answer) {
              // Accumulate answer chunks instead of replacing
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'workflow_finished' && data.data && data.data.answer) {
              finalAnswer = data.data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message_replace' && data.answer) {
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.answer && !data.event) {
              // Direct answer without event
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.answer && data.event !== 'agent_message') {
              // Accumulate answer chunks (but not for agent_message events, already handled above)
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.text) {
              accumulatedAnswer += data.text;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message_append' && data.answer) {
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'agent_thought') {
              continue;
            } else if (data.event === 'message_file') {
              continue;
            } else {
            }
          } catch (parseError) {
            continue;
          }
        } else if (line.startsWith('event: ')) {
          continue;
        } else if (line.trim().length > 0) {
          // Try to parse as direct JSON (non-SSE format)
          try {
            const data = JSON.parse(line);
            foundValidData = true;
            
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
      
      // If we have no answer but found valid data, try to extract from raw response
      if (foundValidData && responseText.trim()) {
        // Try to find any text that looks like a response
        const textMatch = responseText.match(/"answer":\s*"([^"]+)"/);
        if (textMatch) {
          const extractedAnswer = textMatch[1];
          return NextResponse.json({ 
            answer: extractedAnswer,
            conversationId: conversationIdFromStream
          });
        }
      }
      
      // Final fallback - return the raw response for debugging
      return NextResponse.json(
        { 
          error: 'No answer found in streaming response', 
          rawResponse: responseText.substring(0, 1000),
          lines: lines.slice(0, 10), // First 10 lines for debugging
          foundValidData,
          totalLines: lines.length
        },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
