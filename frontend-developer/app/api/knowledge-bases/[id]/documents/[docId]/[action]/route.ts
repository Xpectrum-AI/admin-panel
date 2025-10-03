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

// PATCH - Update document enabled/disabled status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string; action: string }> }
) {
  try {
    const { id, docId, action } = await params;
    const token = await getAuthToken();

    // Update document status via Dify console API
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/status/${action}/batch?document_id=${docId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update document error response:', errorText);
      throw new Error(`Failed to update document: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json({ success: true, enabled: action === 'enable' }, { status: 200 });
  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json(
      { error: 'Failed to update document status' },
      { status: 500 }
    );
  }
}