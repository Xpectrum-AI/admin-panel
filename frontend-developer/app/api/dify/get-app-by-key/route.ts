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
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
const token = await getAuthToken();

    // Fetch all apps from Dify
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
            return NextResponse.json({
              success: true,
              appId: app.id,
              appName: app.name,
              appMode: app.mode
            });
          }
        }
      } catch (error) {
        // Continue to next app
      }
    }
    return NextResponse.json(
      { error: 'No app found with the provided API key' },
      { status: 404 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search for app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


