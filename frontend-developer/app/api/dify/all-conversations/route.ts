import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error('Failed to authenticate with Console API');
  }

  const loginData = await loginResponse.json();
  const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
  return token;
}

async function findAppIdByApiKey(token: string, apiKey: string): Promise<string | null> {
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
          return app.id;
        }
      }
    } catch (error) {
    }
  }

  return null;
}

const DEFAULT_USER_IDS = ['preview-user', 'voice-session-abc123', 'admin', 'user', 'test-user'];

async function findAppUserId(
  apiKey: string,
  conversationId: string,
  preferredIds: string[] = []
) {
  const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_DIFY_BASE_URL is not configured');
  }

  const candidates = Array.from(new Set([...preferredIds, ...DEFAULT_USER_IDS].filter(Boolean)));

  for (const userId of candidates) {
    try {
      const testResponse = await fetch(
        `${baseUrl}/messages?user=${encodeURIComponent(userId)}&conversation_id=${conversationId}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (testResponse.ok) {
        return userId;
      }
    } catch (error) {
      // ignore and continue
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
          break;
        } else {
        }
      } catch (error) {
      }
    }
    
    if (!conversationsResponse || !conversationsResponse.ok) {
      // Fallback: Use App API with multiple common user types
      const allConversations: any[] = [];
      const conversationIds = new Set<string>();
      
      // Use default base URL
      const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_DIFY_BASE_URL is not configured');
      }

      for (const userId of DEFAULT_USER_IDS) {
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
            
            conversations.forEach((conv: any) => {
              if (!conversationIds.has(conv.id)) {
                conversationIds.add(conv.id);
                allConversations.push({
                  ...conv,
                  user_id: conv.from_end_user_id || userId,
                  app_user_id: userId,
                  from_end_user_id: conv.from_end_user_id || userId,
                  session_id: conv.from_end_user_session_id || userId,
                  app_id: appId,
                });
              }
            });
          }
        } catch (error) {
        }
      }
      return NextResponse.json({
        success: true,
        appId,
        conversations: allConversations,
        total: allConversations.length,
        source: 'app-api-fallback'
      });
    }

    const conversations = conversationsData.data || [];
    // Console API gives us UUIDs, but we need user strings for App API
    // Try to match each conversation with the correct user string
    const conversationsWithUser = await Promise.all(
      conversations.map(async (conv: any) => {
        const preferred = conv.from_end_user_id ? [conv.from_end_user_id] : [];
        const foundUser = await findAppUserId(apiKey, conv.id, preferred);

        return {
          ...conv,
          user_id: conv.from_end_user_id || foundUser || 'preview-user',
          app_user_id: foundUser || conv.from_end_user_id || 'preview-user',
          from_end_user_id: conv.from_end_user_id,
          session_id: conv.from_end_user_session_id || foundUser || 'preview-user',
          app_id: appId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      appId,
      conversations: conversationsWithUser,
      total: conversations.length
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

