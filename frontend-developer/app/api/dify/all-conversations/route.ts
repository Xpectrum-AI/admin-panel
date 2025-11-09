import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

async function getAuthToken() {
  console.log('🔐 Authenticating with Console API...');
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    console.error('❌ Login failed:', errorText);
    throw new Error('Failed to authenticate with Console API');
  }

  const loginData = await loginResponse.json();
  const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
  console.log('✅ Successfully authenticated');
  return token;
}

async function findAppIdByApiKey(token: string, apiKey: string): Promise<string | null> {
  console.log('🔍 Searching for app with API key...');
  
  // Fetch all apps
  const response = await fetch(`${CONSOLE_ORIGIN}/console/api/apps?page=1&limit=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': WS_ID,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch apps');
  }

  const data = await response.json();
  const apps = data.data || [];

  console.log(`📋 Found ${apps.length} total apps`);

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
          return keyValue === apiKey;
        });

        if (matchingKey) {
          console.log('✅ Found matching app:', app.id);
          return app.id;
        }
      }
    } catch (error) {
      console.error(`⚠️ Error checking app ${app.id}:`, error);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    console.log('🚀 Fetching ALL conversations (all users) for API key:', apiKey.substring(0, 10) + '...');

    // Get auth token
    const token = await getAuthToken();

    // Find app ID by API key
    const appId = await findAppIdByApiKey(token, apiKey);

    if (!appId) {
      return NextResponse.json(
        { error: 'No app found with the provided API key' },
        { status: 404 }
      );
    }

    console.log('📡 Fetching ALL conversations for app:', appId);

    // Try multiple possible Console API endpoints
    let conversationsResponse;
    let conversationsData;
    
    const endpoints = [
      `/console/api/apps/${appId}/chat-conversations`,
      `/console/api/apps/${appId}/conversations`,
      `/console/api/apps/${appId}/completion-conversations`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${CONSOLE_ORIGIN}${endpoint}`);
        conversationsResponse = await fetch(
          `${CONSOLE_ORIGIN}${endpoint}?page=1&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Workspace-Id': WS_ID,
            }
          }
        );
        
        if (conversationsResponse.ok) {
          conversationsData = await conversationsResponse.json();
          console.log(`✅ Success with endpoint: ${endpoint}`);
          break;
        } else {
          console.log(`⚠️ Endpoint ${endpoint} failed with status: ${conversationsResponse.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Endpoint ${endpoint} error:`, error);
      }
    }
    
    if (!conversationsResponse || !conversationsResponse.ok) {
      console.error('❌ All Console API endpoints failed. Falling back to App API with multiple users...');
      
            // Fallback: Use App API with multiple common user types
            const userTypes = ['preview-user', 'voice-session-abc123', 'admin', 'user', 'test-user'];
            const allConversations: any[] = [];
            const conversationIds = new Set<string>();
            
            // Use default base URL
            const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
            if (!baseUrl) {
              throw new Error('NEXT_PUBLIC_DIFY_BASE_URL is not configured');
            }
      
      for (const userId of userTypes) {
        try {
          const appResponse = await fetch(`${baseUrl}/conversations?user=${userId}&limit=100`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (appResponse.ok) {
            const appData = await appResponse.json();
            const conversations = appData.data || [];
            
            // IMPORTANT: Store the userId we used to fetch, NOT the from_end_user_id
            conversations.forEach((conv: any) => {
              if (!conversationIds.has(conv.id)) {
                conversationIds.add(conv.id);
                allConversations.push({
                  ...conv,
                  user_id: userId, // This is the user string to use for fetching messages
                  from_end_user_id: conv.from_end_user_id, // Preserve original for reference
                });
              }
            });
            
            console.log(`✅ App API: Found ${conversations.length} conversations for user: ${userId}`);
          }
        } catch (error) {
          console.log(`⚠️ App API failed for user ${userId}:`, error);
        }
      }
      
      console.log(`✅ Total conversations via App API fallback: ${allConversations.length}`);
      
      return NextResponse.json({
        success: true,
        appId,
        conversations: allConversations,
        total: allConversations.length,
        source: 'app-api-fallback'
      });
    }

    const conversations = conversationsData.data || [];

    console.log(`✅ Found ${conversations.length} conversations (all users) via Console API`);
    console.log('⚠️ Note: Matching user IDs for message retrieval...');

    // Console API gives us UUIDs, but we need user strings for App API
    // Try to match each conversation with the correct user string
    const conversationsWithUser = await Promise.all(conversations.map(async (conv: any) => {
      const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_DIFY_BASE_URL is not configured');
      }
      const userTypes = ['preview-user', 'voice-session-abc123', 'admin', 'user', 'test-user'];
      
      // Try to find which user string works for this conversation
      for (const userId of userTypes) {
        try {
          const testResponse = await fetch(
            `${baseUrl}/messages?user=${userId}&conversation_id=${conv.id}&limit=1`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (testResponse.ok) {
            console.log(`✅ Found working user ID for conversation ${conv.id}: ${userId}`);
            return {
              ...conv,
              user_id: userId,
              from_end_user_id: conv.from_end_user_id,
            };
          }
        } catch (error) {
          // Continue to next user type
        }
      }
      
      // If no user type worked, default to preview-user
      console.log(`⚠️ No working user ID found for conversation ${conv.id}, defaulting to preview-user`);
      return {
        ...conv,
        user_id: 'preview-user',
        from_end_user_id: conv.from_end_user_id,
      };
    }));

    return NextResponse.json({
      success: true,
      appId,
      conversations: conversationsWithUser,
      total: conversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

