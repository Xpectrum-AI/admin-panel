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
        const fallbackApiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || 'app-fallback-key-for-testing';
        if (fallbackApiKey && fallbackApiKey !== 'app-fallback-key-for-testing') {
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
    
    // Determine response mode based on useStreaming parameter
    // Both widget preview and full chatbot page use streaming mode since agent doesn't support blocking
    const responseMode = 'streaming'; // Force streaming mode for all requests
    
    const requestBody = {
      inputs: {},
      query: message,
      response_mode: responseMode,
      conversation_id: conversationId || '',
      user: 'preview-user',
      files: []
    };
    
    console.log('🚀 Making request to Dify API:', {
      url: difyServiceUrl,
      apiKey: difyApiKey ? difyApiKey.substring(0, 10) + '...' : 'NO API KEY',
      apiKeyLength: difyApiKey ? difyApiKey.length : 0,
      message: message.substring(0, 50) + '...',
      requestBody,
      responseMode
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
      
      // If streaming mode fails with 400 error, try blocking mode as fallback
      if (response.status === 400 && responseMode === 'streaming' && errorText.includes('blocking mode')) {
        console.log('🔄 Streaming mode failed, trying blocking mode as fallback');
        
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
          console.log('✅ Fallback to blocking mode successful');
          const fallbackResponseText = await fallbackResponse.text();
          console.log('📡 Fallback response:', fallbackResponseText);
          
          try {
            const fallbackData = JSON.parse(fallbackResponseText);
            if (fallbackData.answer) {
              return NextResponse.json({ 
                answer: fallbackData.answer,
                conversationId: fallbackData.conversation_id || conversationId
              });
            }
          } catch (e) {
            console.log('📡 Fallback response not JSON, continuing with error');
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
    console.log('📡 Raw Dify response length:', responseText.length);
    console.log('📡 Response mode:', responseMode);
    console.log('📡 Raw Dify response (first 500 chars):', responseText.substring(0, 500));
    
    if (responseMode === 'blocking') {
      // Handle blocking mode (for widget preview)
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
    } else {
      // Handle streaming mode (for full chatbot page)
      console.log('📡 Processing streaming response');
      console.log('📡 Full streaming response:', responseText);
      
      // Try to parse as JSON first (some streaming responses might be JSON)
      try {
        const jsonData = JSON.parse(responseText);
        console.log('📡 Streaming response is JSON:', jsonData);
        
        if (jsonData.answer) {
          return NextResponse.json({ 
            answer: jsonData.answer,
            conversationId: jsonData.conversation_id || conversationId
          });
        }
      } catch (e) {
        console.log('📡 Not JSON, processing as streaming format');
      }
      
      // Process as Server-Sent Events
      const lines = responseText.split('\n');
      let finalAnswer = '';
      let accumulatedAnswer = '';
      let conversationIdFromStream = conversationId;
      let foundValidData = false;
      
      console.log('📡 Total lines to process:', lines.length);
      console.log('📡 All lines:', lines);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue; // Skip empty lines
        
        console.log(`📡 Processing line ${i}:`, line);
        
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === '[DONE]') {
              console.log('📡 Found [DONE] marker');
              continue;
            }
            
            const data = JSON.parse(jsonStr);
            console.log('📡 Parsed streaming data:', data);
            foundValidData = true;
            
            // Handle different event types - prioritize complete answers
            if (data.event === 'message_end' && data.answer) {
              console.log('📡 Found message_end with answer:', data.answer);
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
              break; // This is the final answer
            } else if (data.event === 'agent_message' && data.answer) {
              console.log('📡 Found agent_message with answer chunk:', data.answer);
              // Accumulate answer chunks instead of replacing
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message' && data.answer) {
              console.log('📡 Found message with answer chunk:', data.answer);
              // Accumulate answer chunks instead of replacing
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'workflow_finished' && data.data && data.data.answer) {
              console.log('📡 Found workflow_finished with answer:', data.data.answer);
              finalAnswer = data.data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message_replace' && data.answer) {
              console.log('📡 Found message_replace with answer:', data.answer);
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.answer && !data.event) {
              // Direct answer without event
              console.log('📡 Found direct answer:', data.answer);
              finalAnswer = data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.answer && data.event !== 'agent_message') {
              // Accumulate answer chunks (but not for agent_message events, already handled above)
              console.log('📡 Found answer chunk:', data.answer);
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.text) {
              console.log('📡 Found text chunk:', data.text);
              accumulatedAnswer += data.text;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message_append' && data.answer) {
              console.log('📡 Found message_append with answer:', data.answer);
              accumulatedAnswer += data.answer;
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'agent_thought') {
              console.log('📡 Found agent_thought, skipping');
              continue;
            } else if (data.event === 'message_file') {
              console.log('📡 Found message_file, skipping');
              continue;
            } else {
              console.log('📡 Unhandled event/data:', data);
            }
          } catch (parseError) {
            console.log('📡 Failed to parse line:', line, parseError);
            continue;
          }
        } else if (line.startsWith('event: ')) {
          console.log('📡 Found event type line:', line);
          continue;
        } else if (line.trim().length > 0) {
          // Try to parse as direct JSON (non-SSE format)
          try {
            const data = JSON.parse(line);
            console.log('📡 Parsed direct JSON:', data);
            foundValidData = true;
            
            if (data.answer) {
              finalAnswer = data.answer;
              console.log('📡 Direct JSON answer:', finalAnswer);
            } else if (data.text) {
              finalAnswer = data.text;
              console.log('📡 Direct JSON text:', finalAnswer);
            } else if (data.message) {
              finalAnswer = data.message;
              console.log('📡 Direct JSON message:', finalAnswer);
            }
            
            if (data.conversation_id) {
              conversationIdFromStream = data.conversation_id;
            }
          } catch (directParseError) {
            // Not JSON, might be plain text response
            console.log('📡 Line is not JSON, treating as plain text:', line);
            if (line.trim().length > 0) {
              accumulatedAnswer += line.trim() + ' ';
            }
          }
        }
      }
      
      console.log('📡 Final parsing results:', {
        finalAnswer,
        accumulatedAnswer,
        foundValidData,
        conversationIdFromStream
      });
      
      const answer = finalAnswer || accumulatedAnswer.trim();
      if (answer) {
        console.log('📡 Returning answer:', answer);
        console.log('📡 Answer length:', answer.length);
        return NextResponse.json({ 
          answer: answer,
          conversationId: conversationIdFromStream
        });
      }
      
      // If we have no answer but found valid data, try to extract from raw response
      if (foundValidData && responseText.trim()) {
        console.log('📡 No structured answer found, trying to extract from raw response');
        // Try to find any text that looks like a response
        const textMatch = responseText.match(/"answer":\s*"([^"]+)"/);
        if (textMatch) {
          const extractedAnswer = textMatch[1];
          console.log('📡 Extracted answer from raw response:', extractedAnswer);
          return NextResponse.json({ 
            answer: extractedAnswer,
            conversationId: conversationIdFromStream
          });
        }
      }
      
      // Final fallback - return the raw response for debugging
      console.log('📡 No answer found, returning error with debug info');
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
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
