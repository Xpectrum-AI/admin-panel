import { NextRequest, NextResponse } from 'next/server';

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

// GET - Get specific knowledge base details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Knowledge base not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch knowledge base');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
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

    return NextResponse.json(knowledgeBase);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a knowledge base
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Knowledge base not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to delete knowledge base');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge base' },
      { status: 500 }
    );
  }
}
