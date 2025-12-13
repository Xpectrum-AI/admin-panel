import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

function getDifyEnvVars() {
  const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';

  if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing required Dify environment variables');
  }

  return { CONSOLE_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD };
}

type WorkspaceSummary = { id?: string; tenant_id?: string; name?: string };

async function getAuthToken(CONSOLE_ORIGIN: string, ADMIN_EMAIL: string, ADMIN_PASSWORD: string) {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate with Dify');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

async function getAllWorkspaces(token: string, CONSOLE_ORIGIN: string): Promise<WorkspaceSummary[]> {
  try {
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[Get All Agents] Failed to fetch workspaces: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data || data.workspaces || [];
  } catch (error) {
    console.error('[Get All Agents] Error fetching workspaces:', error);
    return [];
  }
}

async function switchWorkspace(token: string, workspaceId: string, CONSOLE_ORIGIN: string) {
  try {
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/workspaces/switch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenant_id: workspaceId }),
    });

    if (!response.ok) {
      console.warn(`[Get All Agents] Workspace switch failed for ${workspaceId.substring(0, 8)}...`);
    }
  } catch (error) {
    console.warn(`[Get All Agents] Workspace switch error:`, error);
  }
}

async function getAppsInWorkspace(
  token: string,
  workspaceId: string,
  CONSOLE_ORIGIN: string,
  workspaceName?: string
): Promise<Array<{ appId: string; appName: string; workspaceId: string; workspaceName?: string }>> {
  try {
    await switchWorkspace(token, workspaceId, CONSOLE_ORIGIN);

    const apps: Array<{ appId: string; appName: string; workspaceId: string; workspaceName?: string }> = [];
    let page = 1;
    const limit = 100;
    let hasMore = true;
    const MAX_PAGES = 10;

    while (hasMore && page <= MAX_PAGES) {
      const response = await fetch(
        `${CONSOLE_ORIGIN}/console/api/apps?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Workspace-Id': workspaceId,
          },
        }
      );

      if (!response.ok) {
        console.warn(`[Get All Agents] Failed to fetch apps in workspace ${workspaceId.substring(0, 8)}...`);
        break;
      }

      const data = await response.json();
      const workspaceApps = data.data || [];
      const total = data.total || 0;

      for (const app of workspaceApps) {
        apps.push({
          appId: app.id || app.app_id,
          appName: app.name || app.app_name || 'Unnamed Agent',
          workspaceId: workspaceId,
          workspaceName: workspaceName,
        });
      }

      hasMore = workspaceApps.length === limit && page * limit < total;
      page++;
    }

    return apps;
  } catch (error) {
    console.error(`[Get All Agents] Error fetching apps from workspace ${workspaceId.substring(0, 8)}...:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { CONSOLE_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD } = getDifyEnvVars();
    const token = await getAuthToken(CONSOLE_ORIGIN, ADMIN_EMAIL, ADMIN_PASSWORD);
    const workspaces = await getAllWorkspaces(token, CONSOLE_ORIGIN);

    if (workspaces.length === 0) {
      return NextResponse.json({
        success: true,
        agents: [],
        message: 'No workspaces found',
      });
    }

    // Fetch apps from all workspaces
    const allApps: Array<{
      appId: string;
      appName: string;
      workspaceId: string;
      workspaceName?: string;
    }> = [];

    // Process workspaces sequentially to avoid overwhelming the API
    for (const workspace of workspaces) {
      const workspaceId = workspace.id || workspace.tenant_id;
      if (!workspaceId) continue;

      const apps = await getAppsInWorkspace(token, workspaceId, CONSOLE_ORIGIN, workspace.name);
      allApps.push(...apps);
    }

    return NextResponse.json({
      success: true,
      agents: allApps,
      count: allApps.length,
    });
  } catch (error) {
    console.error('[Get All Agents] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch agents from Main App',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

