import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WORKSPACE_FROM_ENV = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

type WorkspaceSummary = { id?: string; tenant_id?: string; name?: string };

if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Missing required Dify environment variables (CONSOLE_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD)');
}

// Helper to create fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
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
    throw new Error('Failed to authenticate');
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
      console.warn(`[Get App By Key] Failed to fetch workspaces: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data || data.workspaces || [];
  } catch (error) {
    console.error('[Get App By Key] Error fetching workspaces:', error);
    return [];
  }
}

function extractAllKeyFormats(keyObj: any): { keys: string[]; raw: string } {
  const keys: string[] = [];
  const raw = JSON.stringify(keyObj);

  if (!keyObj) return { keys, raw };

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

  return { keys, raw };
}

const keyMatches = (keyValues: string[], searchKey: string): boolean => {
  if (!keyValues || keyValues.length === 0) return false;
  const trimmedSearch = searchKey.trim();
  return keyValues.some((k) => k === trimmedSearch || k.trim() === trimmedSearch);
};

async function switchWorkspace(token: string, workspaceId: string) {
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
      `[Get App By Key] ⚠️ Workspace switch failed (${workspaceId.substring(0, 8)}...): ${response.status} ${response.statusText}`
    );
    console.warn(`[Get App By Key] Error: ${errorText.substring(0, 500)}`);
  }
}

async function searchAppInWorkspace(
  workspaceId: string,
  apiKey: string,
  token: string
): Promise<
  | {
      success: true;
      appId: string;
      appName: string;
      appMode: string;
      workspace: string;
    }
  | null
> {
  try {
    await switchWorkspace(token, workspaceId);

    let page = 1;
    const limit = 100;
    let hasMore = true;
    const MAX_PAGES = 10;
    const FETCH_TIMEOUT = 8000;

    while (hasMore && page <= MAX_PAGES) {
      const response = await fetchWithTimeout(
        `${CONSOLE_ORIGIN}/console/api/apps?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Workspace-Id': workspaceId,
          },
        },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        console.warn(
          `[Get App By Key] Failed to fetch apps in workspace ${workspaceId.substring(0, 8)}...`
        );
        break;
      }

      const data = await response.json();
      const apps = data.data || [];
      const total = data.total || 0;
      hasMore = apps.length === limit && page * limit < total;

      if (apps.length === 0) {
        break;
      }

      const BATCH_SIZE = 5;
      for (let i = 0; i < apps.length; i += BATCH_SIZE) {
        const batch = apps.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (app: any) => {
            try {
              const keysResponse = await fetchWithTimeout(
                `${CONSOLE_ORIGIN}/console/api/apps/${app.id}/api-keys`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Workspace-Id': workspaceId,
                  },
                },
                FETCH_TIMEOUT
              );

              if (keysResponse.ok) {
                const keysData = await keysResponse.json();
                let keys = keysData.data || keysData || [];

                if (i === 0 && app === batch[0]) {
                  console.log(
                    `[Get App By Key] First app keys response structure (workspace ${workspaceId.substring(0, 8)}...):`,
                    JSON.stringify(keys, null, 2).substring(0, 1000)
                  );
                }

                if (!Array.isArray(keys)) {
                  keys = [keys];
                }

                for (const keyObj of keys) {
                  const { keys: keyFormats } = extractAllKeyFormats(keyObj);

                  if (keyFormats.length > 0) {
                    console.log(
                      `[Get App By Key] App ${app.id.substring(0, 8)}... - Extracted key formats:`,
                      keyFormats
                    );
                  }

                  if (keyMatches(keyFormats, apiKey)) {
                    console.log(`[Get App By Key] ✓ MATCH FOUND! Key format: ${keyFormats[0]}`);
                    return {
                      success: true,
                      appId: app.id,
                      appName: app.name,
                      appMode: app.mode,
                      workspace: workspaceId,
                    } as const;
                  }
                }
              } else {
                const errorText = await keysResponse.text().catch(() => 'Unable to read');
                console.warn(
                  `[Get App By Key] Failed to fetch keys for app ${app.id}: ${keysResponse.status} - ${errorText.substring(
                    0,
                    200
                  )}`
                );
              }
            } catch (error) {
              // swallow error for this app
            }
            return null;
          })
        );

        const match = batchResults.find((result) => result !== null);
        if (match) {
          return match;
        }
      }

      page++;
    }

    return null;
  } catch (error) {
    console.error(
      `[Get App By Key] Error searching workspace ${workspaceId.substring(0, 8)}...`,
      error
    );
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, workspaceId, searchMode = 'all' } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const trimmedApiKey = apiKey.trim();
    const token = await getAuthToken();

    console.log(`[Get App By Key] Starting search with API key: ${trimmedApiKey.substring(0, 16)}...`);
    console.log(`[Get App By Key] Search mode: ${searchMode}`);
    console.log(`[Get App By Key] Environment workspace ID: ${WORKSPACE_FROM_ENV.substring(0, 8)}...`);

    if (WORKSPACE_FROM_ENV && (searchMode === 'all' || !workspaceId)) {
      console.log(`[Get App By Key] Searching environment workspace first: ${WORKSPACE_FROM_ENV.substring(0, 8)}...`);
      const match = await searchAppInWorkspace(WORKSPACE_FROM_ENV, trimmedApiKey, token);
      if (match) {
        console.log(`[Get App By Key] ✓ Found in environment workspace!`);
        return NextResponse.json({
          success: true,
          appId: match.appId,
          appName: match.appName,
          appMode: match.appMode,
          workspace: match.workspace,
          foundInEnvWorkspace: true,
          searchedWorkspaces: 1,
        });
      }
      console.log(`[Get App By Key] Not found in environment workspace, searching others...`);
    }

    if (workspaceId && workspaceId !== WORKSPACE_FROM_ENV && searchMode !== 'all') {
      console.log(`[Get App By Key] Searching requested workspace: ${workspaceId}`);
      const match = await searchAppInWorkspace(workspaceId, trimmedApiKey, token);
      if (match) {
        return NextResponse.json({
          success: true,
          appId: match.appId,
          appName: match.appName,
          appMode: match.appMode,
          workspace: match.workspace,
          searchedWorkspaces: 1,
        });
      }
    }

    console.log(`[Get App By Key] Fetching all workspaces...`);
    const workspaces = await getAllWorkspaces(token);
    if (workspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces found or unable to fetch workspaces' },
        { status: 403 }
      );
    }

    console.log(`[Get App By Key] Found ${workspaces.length} total workspaces`);
    const CONCURRENT_WORKSPACES = 3;
    let searchedCount = 1; // env workspace already searched

    const wsToSearch = workspaces.filter((ws) => {
      const wsId = ws.id || ws.tenant_id;
      return wsId !== WORKSPACE_FROM_ENV && wsId !== workspaceId;
    });

    console.log(`[Get App By Key] Searching ${wsToSearch.length} additional workspaces...`);

    for (let i = 0; i < wsToSearch.length; i += CONCURRENT_WORKSPACES) {
      const batch = wsToSearch.slice(i, i + CONCURRENT_WORKSPACES);

      const batchResults = await Promise.all(
        batch.map(async (ws: any) => {
          const wsId = ws.id || ws.tenant_id;
          if (!wsId) {
            return null;
          }
          console.log(`[Get App By Key] Searching workspace ${wsId.substring(0, 8)}... (${ws.name || 'Unnamed'})`);
          const result = await searchAppInWorkspace(wsId, trimmedApiKey, token);
          return result;
        })
      );

      searchedCount += batch.length;

      const match = batchResults.find((result) => result !== null);
      if (match && match.success) {
        console.log(
          `[Get App By Key] ✓ Found app ${match.appId.substring(0, 8)}... in workspace ${match.workspace.substring(0, 8)}...`
        );
        return NextResponse.json({
          success: true,
          appId: match.appId,
          appName: match.appName,
          appMode: match.appMode,
          workspace: match.workspace,
          searchedWorkspaces: searchedCount,
        });
      }
    }

    console.log(`[Get App By Key] App not found in the ${searchedCount} workspace(s) searched.`);
    return NextResponse.json(
      {
        error: 'No app found with the provided API key',
        searchedWorkspaces: searchedCount,
        debugInfo: {
          environmentWorkspace: WORKSPACE_FROM_ENV.substring(0, 8) + '...',
          totalWorkspacesAvailable: workspaces.length,
          apiKeySearched: trimmedApiKey.substring(0, 16) + '...',
        },
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Get App By Key] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search for app',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}