import { NextRequest, NextResponse } from 'next/server';

// Configuration from environment variables
const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || "Ghosh1@*123";
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

// Helper function to get auth token
async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

// GET - List API keys for a knowledge base
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/api-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch API keys');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    const apiKeys = data.items?.map((key: any) => ({
      id: key.id,
      token: key.token,
      createdAt: new Date(key.created_at * 1000).toISOString(),
      lastUsedAt: key.last_used_at ? new Date(key.last_used_at * 1000).toISOString() : undefined
    })) || [];

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST - Create a new API key for a knowledge base
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    const token = await getAuthToken();
    
    const createResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || `API Key for Knowledge Base ${id}`
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || 'Failed to create API key');
    }

    const data = await createResponse.json();
    
    // Transform the response
    const apiKey = {
      id: data.id,
      token: data.token,
      createdAt: new Date(data.created_at * 1000).toISOString(),
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at * 1000).toISOString() : undefined
    };

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
