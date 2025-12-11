import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_LIVE_API_URL || '';
const BACKEND_API_KEY = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Missing required Dify environment variables');
}

if (!BACKEND_URL || !BACKEND_API_KEY) {
  throw new Error('Missing required backend API configuration');
}

async function getAuthToken() {
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

async function switchWorkspace(token: string, workspaceId: string) {
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
      console.warn(`[Associate Agent] Workspace switch failed for ${workspaceId.substring(0, 8)}...`);
    }
  } catch (error) {
    console.warn(`[Associate Agent] Workspace switch error:`, error);
  }
}

async function getAppDetails(token: string, workspaceId: string, appId: string) {
  try {
    await switchWorkspace(token, workspaceId);

    // Get app details
    const appResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Workspace-Id': workspaceId,
      },
    });

    if (!appResponse.ok) {
      throw new Error(`Failed to fetch app details: ${appResponse.status}`);
    }

    const appData = await appResponse.json();
    const app = appData.data || appData;

    // Get API keys for the app
    const keysResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/api-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Workspace-Id': workspaceId,
      },
    });

    let apiKey = '';
    let serviceOrigin = '';

    if (keysResponse.ok) {
      const keysData = await keysResponse.json();
      const keys = Array.isArray(keysData.data) ? keysData.data : keysData.data ? [keysData.data] : [];
      
      if (keys.length > 0) {
        const firstKey = keys[0];
        apiKey = firstKey.api_key || firstKey.key || firstKey.token || '';
      }
    }

    // Get service origin from app details
    serviceOrigin = app.api_server || app.data?.api_server || '';
    if (serviceOrigin) {
      serviceOrigin = serviceOrigin.replace('/v1', '');
    }

    return {
      appName: app.name || app.app_name || 'Unnamed Agent',
      apiKey,
      serviceOrigin,
    };
  } catch (error) {
    console.error('[Associate Agent] Error fetching app details:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appId, appName, workspaceId, organizationId } = body;

    if (!appId || !workspaceId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: appId, workspaceId, and organizationId are required' },
        { status: 400 }
      );
    }

    // Get auth token and fetch app details from Dify
    const token = await getAuthToken();
    const appDetails = await getAppDetails(token, workspaceId, appId);

    // Use app name as agent_prefix (clean it to be a valid identifier)
    // If appName is not provided, fall back to appId
    const agentPrefix = appName || appDetails.appName || appId;
    // Clean the name to be a valid agent prefix (remove special chars, keep alphanumeric, hyphens, underscores)
    const cleanedAgentPrefix = agentPrefix.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    // Prepare agent data using existing agent model structure
    const agentData = {
      agent_prefix: cleanedAgentPrefix, // Store cleaned app name as agent_prefix
      organization_id: organizationId,
      chatbot_api: appDetails.serviceOrigin || process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
      chatbot_key: appDetails.apiKey || '',
      tts_config: {
        provider: 'openai',
        openai: {
          api_key: '',
          model: 'gpt-4o-mini-tts',
          response_format: 'mp3',
          voice: 'alloy',
          language: 'en',
          speed: 1,
        },
        elevenlabs: null,
      },
      stt_config: {
        provider: 'openai',
        deepgram: null,
        openai: {
          api_key: '',
          model: 'gpt-4o-mini-transcribe',
          language: 'en',
        },
      },
      initial_message: "Hello! How can I help you today?",
      nudge_text: "Hello, Are you still there?",
      nudge_interval: 15,
      max_nudges: 3,
      typing_volume: 0.8,
      max_call_duration: 300,
      system_prompt: `You are a helpful AI assistant.`,
      model_provider: "OpenAI",
      model_name: "GPT-4o",
      model_live_url: process.env.NEXT_PUBLIC_DIFY_BASE_URL || '',
      config: {
        workspace_id: workspaceId, // Store workspace ID in config
      },
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000,
    };

    // Save to MongoDB using existing agent update endpoint
    // Use cleaned agent prefix in the URL path
    const response = await fetch(`${BACKEND_URL}/agents/update/${cleanedAgentPrefix}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BACKEND_API_KEY,
      },
      body: JSON.stringify(agentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend service error: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        ...result.data || result,
        agent_prefix: cleanedAgentPrefix,
        name: appDetails.appName,
        workspace_id: workspaceId,
      },
      message: 'Agent associated successfully',
    });
  } catch (error) {
    console.error('[Associate Agent] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to associate agent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

