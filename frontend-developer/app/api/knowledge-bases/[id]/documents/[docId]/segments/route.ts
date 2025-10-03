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

// GET - Get document segments/chunks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const token = await getAuthToken();
    
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/${docId}/segments?page=1&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch document segments');
    }

    const data = await response.json();
    
    // Transform the data to match our interface
    const segments = data.data?.map((segment: any) => ({
      id: segment.id,
      content: segment.content,
      wordCount: segment.word_count || 0,
      position: segment.position || 0,
      enabled: segment.enabled !== false,
      hitCount: segment.hit_count || 0,
      indexNodeHash: segment.index_node_hash || '',
      createdAt: new Date(segment.created_at * 1000).toISOString(),
      updatedAt: new Date(segment.updated_at * 1000).toISOString()
    })) || [];

    return NextResponse.json(segments);
  } catch (error) {
    console.error('Error fetching document segments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document segments' },
      { status: 500 }
    );
  }
}
