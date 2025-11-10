import { NextRequest, NextResponse } from 'next/server';

// Configuration from environment variables
const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
if (!CONSOLE_ORIGIN) {
  throw new Error('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not configured');
}
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !WS_ID) {
  throw new Error('NEXT_PUBLIC_DIFY_ADMIN_EMAIL, NEXT_PUBLIC_DIFY_ADMIN_PASSWORD, or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured');
}

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

// PATCH - Update segment enabled/disabled status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string; segmentId: string }> }
) {
  try {
    const { id, docId, segmentId } = await params;
    const token = await getAuthToken();
    const body = await request.json();
    const { enabled } = body;

    // Update segment status via backend API using action endpoint
    const action = enabled ? 'enable' : 'disable';
    const response = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${id}/documents/${docId}/segment/${action}?segment_id=${segmentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update segment error response:', errorText);
      throw new Error(`Failed to update segment: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Return success status since the API doesn't return the updated segment
    return NextResponse.json({ success: true, enabled }, { status: 200 });
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}
