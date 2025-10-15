import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

async function getAuthToken() {
  console.log('🔐 Authenticating with Dify Console API...');
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    console.error('❌ Dify login failed:', errorText);
    throw new Error('Failed to authenticate with Dify Console API');
  }

  const loginData = await loginResponse.json();
  const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
  console.log('✅ Successfully authenticated with Dify');
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
    console.log('🚀 Conversations API called');
    console.log('🔧 Environment check:', {
      CONSOLE_ORIGIN: CONSOLE_ORIGIN ? '✓ Set' : '✗ Missing',
      ADMIN_EMAIL: ADMIN_EMAIL ? '✓ Set' : '✗ Missing',
      ADMIN_PASSWORD: ADMIN_PASSWORD ? '✓ Set' : '✗ Missing',
      WS_ID: WS_ID ? '✓ Set' : '✗ Missing',
    });
    
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      console.error('❌ No API key provided');
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    console.log('🚀 Fetching conversations for API key:', apiKey.substring(0, 10) + '...');

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

    console.log('📡 Fetching conversations for app:', appId);

    // Fetch conversations from Dify Console API
    const conversationsResponse = await fetch(
      `${CONSOLE_ORIGIN}/console/api/apps/${appId}/completion-conversations?page=1&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
        }
      }
    );

    if (!conversationsResponse.ok) {
      const errorText = await conversationsResponse.text();
      console.error('❌ Failed to fetch conversations:', errorText);
      throw new Error(`Failed to fetch conversations: ${conversationsResponse.statusText}`);
    }

    const conversationsData = await conversationsResponse.json();
    const conversations = conversationsData.data || [];

    console.log(`✅ Found ${conversations.length} conversations`);

    return NextResponse.json({
      success: true,
      appId,
      conversations,
      total: conversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversations', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch conversation messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    const conversationId = searchParams.get('conversationId');

    if (!apiKey || !conversationId) {
      return NextResponse.json(
        { error: 'API key and conversation ID are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Fetching messages for conversation:', conversationId);

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

    console.log('📡 Fetching messages for conversation:', conversationId);

    // Fetch conversation messages from Dify Console API
    const messagesResponse = await fetch(
      `${CONSOLE_ORIGIN}/console/api/apps/${appId}/completion-conversations/${conversationId}/messages?page=1&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
        }
      }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('❌ Failed to fetch messages:', errorText);
      throw new Error(`Failed to fetch messages: ${messagesResponse.statusText}`);
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.data || [];

    console.log(`✅ Found ${messages.length} messages`);

    return NextResponse.json({
      success: true,
      messages,
      total: messages.length
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

