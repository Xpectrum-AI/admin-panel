import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate with Console API');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

async function findAppIdByApiKey(token: string, apiKey: string): Promise<string | null> {
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

        if (keys.some((k: any) => (k.api_key || k.key || k.token) === apiKey)) {
          return app.id;
        }
      }
    } catch (error) {
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, conversationId, appId } = body;

    if (!apiKey || !conversationId || !appId) {
      return NextResponse.json(
        { error: 'apiKey, conversationId, and appId are required' },
        { status: 400 }
      );
    }

    if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD || !WS_ID) {
      return NextResponse.json(
        { error: 'Dify console credentials are not configured' },
        { status: 500 }
      );
    }

    const token = await getAuthToken();

    let resolvedAppId = appId;
    if (!UUID_REGEX.test(resolvedAppId)) {
      const lookedUp = await findAppIdByApiKey(token, apiKey);
      if (!lookedUp) {
        return NextResponse.json(
          { error: 'Unable to resolve app ID for the provided API key' },
          { status: 404 }
        );
      }
      resolvedAppId = lookedUp;
    }

    const messagesResponse = await fetch(
      `${CONSOLE_ORIGIN}/console/api/apps/${resolvedAppId}/chat-conversations/${conversationId}/messages?limit=200`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!messagesResponse.ok) {
      const detailResponse = await fetch(
        `${CONSOLE_ORIGIN}/console/api/apps/${resolvedAppId}/chat-conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Workspace-Id': WS_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!detailResponse.ok) {
        const errorText = await detailResponse.text();
        throw new Error(`Console API failed: ${detailResponse.status} ${errorText}`);
      }

      const detailData = await detailResponse.json();

      return NextResponse.json({
        success: true,
        conversation: detailData.data || detailData,
        messages: (detailData.data?.messages || detailData.messages || [])
      });
    }

    const messagesData = await messagesResponse.json();

    return NextResponse.json({
      success: true,
      messages: messagesData.data || [],
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch conversation messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


