import { NextRequest, NextResponse } from 'next/server';

// Helper function to get auth token
async function getAuthToken() {
  const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
  
  if (!CONSOLE_ORIGIN || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN, NEXT_PUBLIC_DIFY_ADMIN_EMAIL, or NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not configured');
  }

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

// POST - Test retrieval for a knowledge base
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
    
    if (!CONSOLE_ORIGIN || !WS_ID) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured' },
        { status: 500 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { query, topK = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    
    const testResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/hit-testing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        retrieval_model: {
          search_method: 'semantic_search',
          reranking_enable: false,
          reranking_model: {
            reranking_provider_name: '',
            reranking_model_name: ''
          },
          top_k: topK,
          score_threshold_enabled: false,
          score_threshold: 0.5
        }
      })
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      throw new Error(errorData.message || 'Failed to test retrieval');
    }

    const data = await testResponse.json();
    
    // Transform the response to match our interface
    const results = data.records?.map((record: any) => ({
      document: {
        name: record.document?.name || 'Unknown Document'
      },
      content: record.content || '',
      score: record.score || 0
    })) || [];

    return NextResponse.json({ records: results });
  } catch (error) {
    console.error('Error testing retrieval:', error);
    return NextResponse.json(
      { error: 'Failed to test retrieval' },
      { status: 500 }
    );
  }
}
