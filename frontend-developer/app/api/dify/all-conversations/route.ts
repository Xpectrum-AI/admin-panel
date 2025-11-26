import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WORKSPACE_FROM_ENV = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

type WorkspaceSummary = { id?: string; tenant_id?: string; name?: string };

if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Missing required Dify environment variables.');
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

async function getAuthToken() {
  const loginResponse = await fetchWithTimeout(
    `${CONSOLE_ORIGIN}/console/api/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    },
    10000
  );

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Failed to authenticate with Console API: ${errorText.substring(0, 300)}`);
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

async function getAllWorkspaces(token: string): Promise<WorkspaceSummary[]> {
  try {
    const response = await fetchWithTimeout(
      `${CONSOLE_ORIGIN}/console/api/workspaces`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      10000
    );

    if (!response.ok) {
      console.warn(`[All Conversations] Failed to fetch workspaces: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data || data.workspaces || [];
  } catch (error) {
    console.error('[All Conversations] Error fetching workspaces:', error);
    return [];
  }
}

function extractAllKeyFormats(keyObj: any): string[] {
  const keys: string[] = [];
  if (!keyObj) return keys;

  const possibleFields = [
    'api_key',
    'key',
    'token',
    'token_value',
    'value',
    'id',
    'secret_key',
    'app_key',
  ];

  for (const field of possibleFields) {
    if (keyObj[field] && typeof keyObj[field] === 'string') {
      const val = keyObj[field].trim();
      if (val && !keys.includes(val)) {
        keys.push(val);
      }
    }
  }

  return keys;
}

const keyMatches = (keyValues: string[], searchKey: string): boolean => {
  if (!keyValues || keyValues.length === 0) return false;
  const trimmedSearch = searchKey.trim();
  return keyValues.some((k) => k === trimmedSearch || k.trim() === trimmedSearch);
};

async function switchWorkspace(token: string, workspaceId: string) {
  try {
    const response = await fetchWithTimeout(
      `${CONSOLE_ORIGIN}/console/api/workspaces/switch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: workspaceId }),
      },
      8000
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.warn(
        `[All Conversations] Workspace switch failed (${workspaceId.substring(0, 8)}...): ${response.status} ${response.statusText}`
      );
      console.warn(`[All Conversations] Error response: ${errorText.substring(0, 500)}`);
    }
  } catch (error) {
    console.warn('[All Conversations] Workspace switch error:', error);
  }
}

async function findAppInWorkspace(
  token: string,
  workspaceId: string,
  apiKey: string
): Promise<{ appId: string; appName?: string } | null> {
  try {
    await switchWorkspace(token, workspaceId);

    const response = await fetchWithTimeout(
      `${CONSOLE_ORIGIN}/console/api/apps?page=1&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Workspace-Id': workspaceId,
        },
      },
      8000
    );

    if (!response.ok) {
      console.warn(`[All Conversations] Failed to fetch apps in workspace ${workspaceId.substring(0, 8)}...`);
      return null;
    }

    const data = await response.json();
    const apps = data.data || [];

    for (const app of apps) {
      try {
        const keysResponse = await fetchWithTimeout(
          `${CONSOLE_ORIGIN}/console/api/apps/${app.id}/api-keys`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Workspace-Id': workspaceId,
            },
          },
          8000
        );

        if (!keysResponse.ok) {
          const errorText = await keysResponse.text().catch(() => 'Unable to read error');
          console.warn(
            `[All Conversations] Failed to fetch keys for app ${app.id}: ${keysResponse.status} - ${errorText.substring(
              0,
              200
            )}`
          );
          continue;
        }

        const keysData = await keysResponse.json();
        let keys = keysData.data || keysData || [];
        if (!Array.isArray(keys)) {
          keys = [keys];
        }

        for (const keyObj of keys) {
          const keyFormats = extractAllKeyFormats(keyObj);
          if (keyFormats.length > 0) {
            console.log(
              `[All Conversations] App ${app.id.substring(0, 8)}... - Key formats:`,
              keyFormats
            );
          }
          if (keyMatches(keyFormats, apiKey)) {
            console.log(
              `[All Conversations] ✓ Found matching app ${app.id.substring(0, 8)}... in workspace ${workspaceId.substring(
                0,
                8
              )}...`
            );
            return { appId: app.id, appName: app.name };
          }
        }
      } catch (error) {
        console.warn(
          `[All Conversations] Error while inspecting keys for app ${app.id}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return null;
  } catch (error) {
    console.error(
      `[All Conversations] Error searching workspace ${workspaceId.substring(0, 8)}...`,
      error
    );
    return null;
  }
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

    const trimmedApiKey = apiKey.trim();
    const token = await getAuthToken();

    console.log(`[All Conversations] Searching for API key: ${trimmedApiKey.substring(0, 16)}...`);

    let searchedWorkspaces = 0;
    let foundApp: { appId: string; appName?: string; workspace: string } | null = null;
    const searchedWorkspaceIds = new Set<string>();

    if (WORKSPACE_FROM_ENV) {
      console.log(
        `[All Conversations] Searching environment workspace first: ${WORKSPACE_FROM_ENV.substring(0, 8)}...`
      );
      const result = await findAppInWorkspace(token, WORKSPACE_FROM_ENV, trimmedApiKey);
      searchedWorkspaces++;
      searchedWorkspaceIds.add(WORKSPACE_FROM_ENV);
      if (result) {
        foundApp = { ...result, workspace: WORKSPACE_FROM_ENV };
      }
    }

    if (!foundApp) {
      const workspaces = await getAllWorkspaces(token);
      const otherWorkspaces = workspaces.filter((ws) => {
        const wsId = ws.id || ws.tenant_id;
        return wsId && !searchedWorkspaceIds.has(wsId);
      });

      console.log(`[All Conversations] Searching ${otherWorkspaces.length} additional workspaces...`);

      const CONCURRENT_WORKSPACES = 3;
      for (let i = 0; i < otherWorkspaces.length && !foundApp; i += CONCURRENT_WORKSPACES) {
        const batch = otherWorkspaces.slice(i, i + CONCURRENT_WORKSPACES);
        const results = await Promise.all(
          batch.map(async (ws) => {
            const wsId = ws.id || ws.tenant_id;
            if (!wsId) return null;
            console.log(
              `[All Conversations] Searching workspace ${wsId.substring(0, 8)}... (${ws.name || 'Unnamed'})`
            );
            searchedWorkspaceIds.add(wsId);
            return findAppInWorkspace(token, wsId, trimmedApiKey).then((res) =>
              res ? { ...res, workspace: wsId } : null
            );
          })
        );
        searchedWorkspaces += batch.length;
        foundApp = results.find((res) => res !== null) as typeof foundApp;
      }
    }

    if (!foundApp) {
      return NextResponse.json(
        {
          error: 'No app found with the provided API key',
          searchedWorkspaces,
        },
        { status: 404 }
      );
    }

    const { appId, workspace } = foundApp;
    await switchWorkspace(token, workspace);
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
              'X-Workspace-Id': workspace,
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
        workspace,
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
      workspace,
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

