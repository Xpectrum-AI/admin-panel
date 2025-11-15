import { NextRequest, NextResponse } from 'next/server';

// GET endpoint removed - using localStorage solution instead

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Clean the prompt - remove any first message that might be included
    let cleanPrompt = body.prompt;
    if (typeof cleanPrompt === 'string') {
      // Remove common first message patterns
      cleanPrompt = cleanPrompt
        .replace(/^You are an expert calendar management assistant\.\s*/i, '')
        .replace(/^You are a helpful assistant\.\s*/i, '')
        .replace(/^Always be helpful, accurate, and proactive in managing schedules\.\s*/i, '')
        .replace(/^Thank you for calling Wellness Partners\. This is Riley, your scheduling agent\. How may I help you today\?\s*/i, '')
        .replace(/^Hello! I'm Riley, your scheduling assistant\. How can I help you today\?\s*/i, '')
        .replace(/^Hi there! I'm here to help you with your scheduling needs\. What can I do for you today\?\s*/i, '')
        .replace(/^Good day! I'm Riley, your appointment scheduling assistant\. How may I assist you today\?\s*/i, '')
        .trim();
    }
    
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = body.chatbot_api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    const appId = body.app_id;
    
    // Get console origin and credentials
    let CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
    const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
    
    // Normalize CONSOLE_ORIGIN - remove trailing slashes
    if (CONSOLE_ORIGIN) {
      CONSOLE_ORIGIN = CONSOLE_ORIGIN.replace(/\/+$/, ''); // Remove all trailing slashes
    }
    
    // Validate required configuration
    if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD || !WS_ID) {
      const missing = [];
      if (!CONSOLE_ORIGIN) missing.push('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN');
      if (!ADMIN_EMAIL) missing.push('NEXT_PUBLIC_DIFY_ADMIN_EMAIL');
      if (!ADMIN_PASSWORD) missing.push('NEXT_PUBLIC_DIFY_ADMIN_PASSWORD');
      if (!WS_ID) missing.push('NEXT_PUBLIC_DIFY_WORKSPACE_ID');
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Dify console configuration not complete. Missing: ${missing.join(', ')}. CONSOLE_ORIGIN: ${CONSOLE_ORIGIN || 'not set'}` 
        },
        { status: 400 }
      );
    }
    
    if (!difyApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API key not provided' 
        },
        { status: 400 }
      );
    }
    
    try {
      // Ensure no double slashes in URL
      const loginUrl = `${CONSOLE_ORIGIN.replace(/\/$/, '')}/console/api/login`;
      
      // Login to Dify console to get auth token
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        }),
        redirect: 'follow'
      });
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text().catch(() => '');
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}. URL: ${loginUrl}. Error: ${errorText}`);
      }
      
      const loginData = await loginResponse.json();
      const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
      
      if (!token) {
        throw new Error('No access token received from login');
      }
      
      // If app_id is not provided, try to find it from the API key
      let finalAppId = appId;
      if (!finalAppId) {
        // Fetch all apps and find the one with matching API key
        const appsResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Workspace-Id': WS_ID,
          }
        });
        
        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          const apps = appsData.data || [];
          
          // For each app, fetch its API keys and check if any match
          for (const app of apps) {
            try {
              const keysResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${app.id}/api-keys`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'X-Workspace-Id': WS_ID,
                }
              });
              
              if (keysResponse.ok) {
                const keysData = await keysResponse.json();
                const keys = keysData.data || [];
                
                // Check if any key matches
                const matchingKey = keys.find((k: any) => {
                  const keyValue = k.api_key || k.key || k.token;
                  return keyValue === difyApiKey;
                });
                
                if (matchingKey) {
                  finalAppId = app.id;
                  break;
                }
              }
            } catch (error) {
              // Continue to next app
            }
          }
        }
      }
      
      if (!finalAppId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'App ID not found. Cannot update prompt without app ID. Please provide app_id in the request or ensure the API key is valid.' 
          },
          { status: 400 }
        );
      }
      
      // Get the app details to get the current model_config
      const appResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${finalAppId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
        }
      });
      
      let configPayload: any = { pre_prompt: cleanPrompt };
      
      // If we can get the app details, extract model_config and update pre_prompt
      if (appResponse.ok) {
        const appData = await appResponse.json();
        const currentModelConfig = appData.data?.model_config || appData.model_config;
        
        if (currentModelConfig) {
          // Preserve all existing model_config settings, only update pre_prompt
          configPayload = {
            ...currentModelConfig,
            pre_prompt: cleanPrompt
          };
        } else {
          // If no model_config exists, create minimal required structure
          configPayload = {
            model: {
              provider: "langgenius/openai/openai",
              name: "gpt-4o",
              mode: "chat",
              completion_params: {
                temperature: 0.3,
                stop: []
              }
            },
            pre_prompt: cleanPrompt
          };
        }
      }
      
      // Update the prompt using the console API model-config endpoint
      const response = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${finalAppId}/model-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        data,
        message: 'Prompt configuration updated successfully'
      });
      
    } catch (difyError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API call failed',
          details: difyError instanceof Error ? difyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to configure prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
