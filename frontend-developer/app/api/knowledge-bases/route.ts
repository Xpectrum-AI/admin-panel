import { NextRequest, NextResponse } from 'next/server';

// Configuration from environment variables with fallback values
const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || "Ghosh1@*123";
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

// Debug logging to help identify environment variable issues
console.log('🔍 Environment variables check:');
console.log('🔍 CONSOLE_ORIGIN:', CONSOLE_ORIGIN);
console.log('🔍 ADMIN_EMAIL:', ADMIN_EMAIL ? 'Present' : 'Missing');
console.log('🔍 ADMIN_PASSWORD:', ADMIN_PASSWORD ? 'Present' : 'Missing');
console.log('🔍 WS_ID:', WS_ID ? 'Present' : 'Missing');

// Helper function to get auth token
async function getAuthToken() {
  console.log('🔐 Attempting authentication with:', {
    url: `${CONSOLE_ORIGIN}/console/api/login`,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD ? 'Present' : 'Missing'
  });

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

  console.log('🔐 Login response status:', loginResponse.status);

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    console.error('❌ Authentication failed:', errorText);
    throw new Error(`Failed to authenticate: ${loginResponse.status} - ${errorText}`);
  }

  const loginData = await loginResponse.json();
  console.log('✅ Authentication successful');
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

// GET - List all knowledge bases
export async function GET() {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets?page=1&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch knowledge bases');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    const knowledgeBases = data.data?.map((kb: any) => ({
      id: kb.id,
      name: kb.name,
      description: kb.description || '',
      documentCount: kb.document_count || 0,
      wordCount: kb.word_count || 0,
      status: kb.embedding_available ? 'ready' : 'processing',
      createdAt: new Date(kb.created_at * 1000).toISOString(),
      indexingTechnique: kb.indexing_technique || 'high_quality',
      permission: kb.permission || 'only_me'
    })) || [];

    return NextResponse.json(knowledgeBases);
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge bases' },
      { status: 500 }
    );
  }
}

// POST - Create a new knowledge base
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, indexingTechnique, permission } = body;

    const token = await getAuthToken();
    
    const createResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || '',
        indexing_technique: indexingTechnique || 'high_quality',
        permission: permission || 'only_me',
        provider: 'vendor'
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || 'Failed to create knowledge base');
    }

    const data = await createResponse.json();
    
    // Transform the response
    const knowledgeBase = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      documentCount: data.document_count || 0,
      wordCount: data.word_count || 0,
      status: data.embedding_available ? 'ready' : 'processing',
      createdAt: new Date(data.created_at * 1000).toISOString(),
      indexingTechnique: data.indexing_technique || 'high_quality',
      permission: data.permission || 'only_me'
    };

    return NextResponse.json(knowledgeBase, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge base' },
      { status: 500 }
    );
  }
}
