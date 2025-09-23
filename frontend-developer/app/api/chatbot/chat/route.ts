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
      console.log('📡 Raw response text length:', responseText.length);
      console.log('📡 Raw response text (first 1000 chars):', responseText.substring(0, 1000));
      
      const lines = responseText.split('\n');
      let finalAnswer = '';
      let accumulatedAnswer = '';
      let conversationIdFromStream = conversationId;
      let foundValidData = false;
      
      console.log('📡 Total lines to process:', lines.length);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue; // Skip empty lines
        
        console.log(`📡 Processing line ${i}:`, line.substring(0, 100));
        
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
            
            // Handle different event types
            if (data.event === 'message_end') {
              console.log('📡 Found message_end event');
              if (data.answer) {
                finalAnswer = data.answer;
                console.log('📡 Final answer from message_end:', finalAnswer);
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
              break;
            } else if (data.event === 'agent_message') {
              console.log('📡 Found agent_message event');
              if (data.answer) {
                finalAnswer = data.answer;
                console.log('📡 Final answer from agent_message:', finalAnswer);
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'message') {
              console.log('📡 Found message event');
              if (data.answer) {
                finalAnswer = data.answer;
                console.log('📡 Final answer from message:', finalAnswer);
              }
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
            } else if (data.event === 'agent_thought') {
              console.log('📡 Found agent_thought event, skipping');
              continue;
            } else if (data.answer) {
              console.log('📡 Found answer chunk:', data.answer);
              accumulatedAnswer += data.answer;
            } else if (data.text) {
              console.log('📡 Found text chunk:', data.text);
              accumulatedAnswer += data.text;
            } else if (data.event === 'workflow_finished') {
              console.log('📡 Found workflow_finished event');
              if (data.data && data.data.answer) {
                finalAnswer = data.data.answer;
                console.log('📡 Final answer from workflow_finished:', finalAnswer);
              }
            } else if (data.event === 'message_file') {
              console.log('📡 Found message_file event, skipping');
              continue;
            } else if (data.event === 'message_replace') {
              console.log('📡 Found message_replace event');
              if (data.answer) {
                finalAnswer = data.answer;
                console.log('📡 Final answer from message_replace:', finalAnswer);
              }
            } else if (data.event === 'message_append') {
              console.log('📡 Found message_append event');
              if (data.answer) {
                accumulatedAnswer += data.answer;
                console.log('📡 Appended answer chunk:', data.answer);
              }
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
