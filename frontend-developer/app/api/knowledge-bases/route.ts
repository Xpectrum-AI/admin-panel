import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, getOrgIdFromKnowledgeBaseName, removeOrgPrefixFromName } from '@/lib/auth/getUserFromRequest';

// Helper function to get auth token
async function getAuthToken() {
  const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
  
  if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN, NEXT_PUBLIC_DIFY_ADMIN_EMAIL, or NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not configured');
  }
  // Handle redirects (308 Permanent Redirect)
  let loginUrl = `${CONSOLE_ORIGIN}/console/api/login`;
  let loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }),
    redirect: 'follow' // Follow redirects automatically
  });
  
  // If we get a redirect status, try the redirect location
  if (loginResponse.status === 308 || loginResponse.status === 301 || loginResponse.status === 302) {
    const redirectLocation = loginResponse.headers.get('Location');
    if (redirectLocation) {
      loginUrl = redirectLocation;
      loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        }),
        redirect: 'follow'
      });
    }
  }
  
  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Failed to authenticate: ${loginResponse.status} - ${errorText}`);
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

// GET - List all knowledge bases (filtered by organization)
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables at runtime
    const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
    
    if (!CONSOLE_ORIGIN || !WS_ID) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured' },
        { status: 500 }
      );
    }
    
    // Get the authenticated user's organization
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userOrgId = user.orgId;
    const userOrgShortId = userOrgId.substring(0, 8); // Use first 8 chars for filtering
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
    
    // Transform and filter the data by organization (using 8-char prefix)
    const allKnowledgeBases = data.data || [];
    
    const knowledgeBases = allKnowledgeBases
      .filter((kb: any) => {
        const kbOrgShortId = getOrgIdFromKnowledgeBaseName(kb.name);
        return kbOrgShortId === userOrgShortId;
      })
      .map((kb: any) => ({
        id: kb.id,
        name: removeOrgPrefixFromName(kb.name),
        description: kb.description || '',
        documentCount: kb.document_count || 0,
        wordCount: kb.word_count || 0,
        status: kb.embedding_available ? 'ready' : 'processing',
        createdAt: new Date(kb.created_at * 1000).toISOString(),
        indexingTechnique: kb.indexing_technique || 'high_quality',
        permission: kb.permission || 'only_me'
      }));
return NextResponse.json(knowledgeBases);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch knowledge bases' },
      { status: 500 }
    );
  }
}

// POST - Create a new knowledge base
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables at runtime
    const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
    
    if (!CONSOLE_ORIGIN || !WS_ID) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured' },
        { status: 500 }
      );
    }
    
    // Get the authenticated user's organization
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userOrgId = user.orgId;
    const body = await request.json();
    const { name, description, indexingTechnique, permission } = body;

    // Add organization prefix to the name for isolation
    // Use first 8 characters of org ID to keep within 40 character limit
    // Format: [8-char-hash]Name (e.g., [4f91b0f8]MyKB)
    const orgShortId = userOrgId.substring(0, 8);
    const orgPrefixedName = `[${orgShortId}]${name}`.substring(0, 40); // Ensure max 40 chars
const token = await getAuthToken();
    
    // Create knowledge base without chunk settings (they will be set per-document)
    const createResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: orgPrefixedName, // Use org-prefixed name
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
    
    // Transform the response (remove org prefix for display)
    const knowledgeBase = {
      id: data.id,
      name: removeOrgPrefixFromName(data.name),
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
    return NextResponse.json(
      { error: 'Failed to create knowledge base' },
      { status: 500 }
    );
  }
}