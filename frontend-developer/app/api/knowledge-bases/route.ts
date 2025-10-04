import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, getOrgIdFromKnowledgeBaseName, removeOrgPrefixFromName } from '@/lib/auth/getUserFromRequest';

// Configuration - same as your scripts
const CONSOLE_ORIGIN = "https://demos.xpectrum-ai.com";
const ADMIN_EMAIL = "ghosh.ishw@gmail.com";
const ADMIN_PASSWORD = "Ghosh1@*123";
const WS_ID = "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b";

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

// GET - List all knowledge bases (filtered by organization)
export async function GET(request: NextRequest) {
  try {
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
    console.log('📋 Fetching knowledge bases for org:', userOrgId, `(prefix: ${userOrgShortId})`);

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
    
    console.log(`✅ Found ${knowledgeBases.length} knowledge bases for org ${userOrgId} [${userOrgShortId}] (${allKnowledgeBases.length} total)`);

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
    console.log('📝 POST /api/knowledge-bases - Starting...');
    
    // Get the authenticated user's organization
    const user = await getUserFromRequest(request);
    
    console.log('📝 getUserFromRequest result:', user ? `User ID: ${user.userId}, Org ID: ${user.orgId}` : 'null');
    
    if (!user) {
      console.error('❌ POST /api/knowledge-bases - Authentication failed: user is null');
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userOrgId = user.orgId;
    console.log('📝 Creating knowledge base for org:', userOrgId);

    const body = await request.json();
    const { name, description, indexingTechnique, permission } = body;

    // Add organization prefix to the name for isolation
    // Use first 8 characters of org ID to keep within 40 character limit
    // Format: [8-char-hash]Name (e.g., [4f91b0f8]MyKB)
    const orgShortId = userOrgId.substring(0, 8);
    const orgPrefixedName = `[${orgShortId}]${name}`.substring(0, 40); // Ensure max 40 chars

    console.log(`📝 Original name: "${name}", Org-prefixed: "${orgPrefixedName}" (${orgPrefixedName.length} chars)`);

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
      console.error('❌ API error response:', JSON.stringify(errorData, null, 2));
      console.error('❌ Request payload was:', JSON.stringify({
        name: orgPrefixedName,
        description: description || '',
        indexing_technique: indexingTechnique || 'high_quality',
        permission: permission || 'only_me',
        provider: 'vendor'
      }, null, 2));
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

    console.log('✅ Knowledge base created:', knowledgeBase.id);

    return NextResponse.json(knowledgeBase, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge base' },
      { status: 500 }
    );
  }
}
